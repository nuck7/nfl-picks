import {
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import {
  CachedSeason,
  CachedTeams,
  CachedWeekGames,
  Game,
  SeasonCalendar,
  SeedSummary,
} from '../types';
import { fetchSeasonScoreboard, getWeekMatchups, toGamesByWeek, toTeamsKeyed } from './espn';
import { makeWeekId } from '../utils/espn';
import { isFinal } from '../utils/grading';
import { getKickoffWindow } from '../utils/schedule';
import { getPickDeadline } from '../utils/picks';
import { db } from './firebase.config';

const CacheCollection = 'cache';
const WeeksCollection = 'weeks';

// Bump to force every document to be rewritten by the next seed run, when the
// stored shape changes in a way older documents can't satisfy.
export const CacheSchemaVersion = 1;

export const seasonDocId = (season: number) => `season_${season}`;
export const teamsDocId = (season: number) => `teams_${season}`;
export const matchupsDocId = (weekId: string) => `matchups_${weekId}`;

const cacheDoc = (docId: string) => doc(db, CacheCollection, docId);
const weekDoc = (weekId: string) => doc(db, WeeksCollection, weekId);

// serverTimestamp() resolves to exactly request.time, which is what the rules
// check -- a client cannot backdate an entry to pin it as permanently fresh.
const envelope = (season: number) => ({
  schemaVersion: CacheSchemaVersion,
  fetchedAt: serverTimestamp(),
  season,
});

/* ------------------------------------------------------------------ read -- */

const readCache = async <T>(docId: string): Promise<T | undefined> => {
  const snapshot = await getDoc(cacheDoc(docId));
  return snapshot.exists() ? (snapshot.data() as T) : undefined;
};

export const getCachedSeason = (season: number) =>
  readCache<CachedSeason>(seasonDocId(season));

export const getCachedTeams = (season: number) =>
  readCache<CachedTeams>(teamsDocId(season));

export const getCachedWeekGames = (weekId: string) =>
  readCache<CachedWeekGames>(matchupsDocId(weekId));

/* ----------------------------------------------------------------- write -- */

// Fills the cache for a whole season: the week list, all 32 teams, and one
// document per week of games.
//
// This costs ONE ESPN request. The site API serves the entire regular season
// from a single date-ranged scoreboard call -- 272 games with their week
// numbers, statuses and scores -- so there is no per-week sweep to run and
// nothing to fill in the background.
//
// The writes go in one batch, so the season either lands whole or not at all
// and no one can read a half-seeded season.
// A week's games, cache first -- but only once the week is over.
//
// The seed stores whatever the scoreboard said at the moment it ran, and it is
// run by hand, so a season seeded in August holds sixteen 0-0 scheduled games
// for every week in it. Serving those was what left the Results tab grading a
// finished week as pending: every pick came back 'pending', nobody had a
// correct one, and so no week ever had a winner to suggest.
//
// A week whose games are all final cannot change again, so it is served from
// the one Firestore read. Anything else goes to ESPN for the live scores, with
// the stored copy as the fallback if that request fails -- which is also what
// resolves a week the seed has never run for.
export const getWeekGames = async (
  season: number,
  week: number
): Promise<Game[]> => {
  const cached = await getCachedWeekGames(makeWeekId(season, week)).catch(
    () => undefined
  );
  const stored = cached?.games ?? [];

  if (stored.length && stored.every(isFinal)) {
    return stored;
  }

  return getWeekMatchups(season, week).catch(() => stored);
};

export const seedSeason = async (
  calendar: SeasonCalendar
): Promise<SeedSummary> => {
  if (!calendar.season || !calendar.start || !calendar.end) {
    throw new Error('The season calendar has not loaded yet.');
  }

  const scoreboard = await fetchSeasonScoreboard(calendar);
  const gamesByWeek = toGamesByWeek(scoreboard);
  // Every team appears across a full season, so this is the whole league
  // without a separate request for it.
  const teams = Object.values(toTeamsKeyed(scoreboard));

  const batch = writeBatch(db);
  const season = calendar.season;
  let games = 0;

  const weeks = calendar.weeks.map((week) => {
    const weekGames: Game[] = gamesByWeek[week.week] ?? [];
    const window = getKickoffWindow(weekGames);
    const weekId = makeWeekId(season, week.week);

    games += weekGames.length;

    batch.set(cacheDoc(matchupsDocId(weekId)), {
      ...envelope(season),
      week: week.week,
      weekId,
      games: weekGames,
    });

    // The week's default lock time, stored where the rules can reach it. The
    // rules refuse a member anyone else's picks until the week locks, and they
    // cannot derive "noon on the day of the first game" from an array of games
    // -- so the seed does the deriving once, here, for the whole season.
    //
    // merge, and a separate field from the admin's lockAt override: re-seeding
    // to pick up a schedule change must not quietly undo a lock time an admin
    // set by hand.
    const defaultDeadline = getPickDeadline(weekGames);

    if (defaultDeadline) {
      batch.set(
        weekDoc(weekId),
        {
          weekId,
          defaultLockAt: defaultDeadline.toISOString(),
          defaultLockAtMs: defaultDeadline.getTime(),
        },
        { merge: true }
      );
    }

    return {
      week: week.week,
      label: week.label,
      start: week.start,
      end: week.end,
      firstKickoff: window?.start.toISOString() ?? '',
      lastKickoff: window?.end.toISOString() ?? '',
      gameCount: weekGames.length,
    };
  });

  batch.set(cacheDoc(seasonDocId(season)), {
    ...envelope(season),
    start: calendar.start,
    end: calendar.end,
    weeks,
  });

  batch.set(cacheDoc(teamsDocId(season)), {
    ...envelope(season),
    teams,
  });

  await batch.commit();

  return { season, weeks: weeks.length, games, teams: teams.length };
};
