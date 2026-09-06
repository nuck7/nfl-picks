import axios, { AxiosResponse } from 'axios';
import {
  EspnCompetitor,
  EspnEvent,
  EspnScoreboard,
  EspnSiteTeam,
  Game,
  GameTeam,
  SeasonCalendar,
  SeasonWeek,
  Team,
  TeamsKeyed,
} from '../types';
import { getCurrentYear } from '../utils/espn';

// ESPN's site API. The core API (sports.core.api.espn.com) is hypermedia --
// every team, score and status is a separate $ref -- so a single week costs
// 1 + 16 requests there and the scores need 48 more on top. These endpoints
// return the same information whole, in one request each.
const SiteApiBase = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

const RegularSeasonType = 2;

// Requests in flight, keyed by url + params. Several components can ask for the
// same week in the same tick; without this they each open their own request for
// an identical response. Entries are dropped as soon as they settle, so this is
// request coalescing rather than a cache -- a later page load fetches again.
const inFlight = new Map<string, Promise<unknown>>();

const espnFetch = <T>(
  url: string,
  params: Record<string, string | number> = {}
): Promise<T> => {
  const key = `${url}?${new URLSearchParams(
    Object.entries(params).map(([name, value]) => [name, String(value)])
  )}`;
  const pending = inFlight.get(key);

  if (pending) {
    return pending as Promise<T>;
  }

  const request = axios({ method: 'get', url, params })
    .then((response: AxiosResponse<T>) => response.data)
    .finally(() => inFlight.delete(key));

  inFlight.set(key, request);

  return request;
};

// One request: the week's games with status, scores and winners, plus the whole
// season's calendar and the current season/week.
//
// Passing no week returns the current one. NOTE the season parameter is
// `dates`, not `year` -- ESPN silently ignores `year` and hands back the
// current season, which looks like a caching bug rather than a bad request.
export const fetchScoreboard = (seasonWeek?: SeasonWeek): Promise<EspnScoreboard> =>
  espnFetch<EspnScoreboard>(
    `${SiteApiBase}/scoreboard`,
    seasonWeek
      ? {
          dates: seasonWeek.season,
          seasontype: RegularSeasonType,
          week: seasonWeek.week,
        }
      : {}
  );

// Where team display data comes from. ESPN's dedicated /teams endpoint sends
// no CORS headers at all -- curl can read it, a browser cannot -- but week 1 of
// any season has all 32 teams playing (byes start later), so one scoreboard
// carries the whole league.
export const TeamsSourceWeek = 1;

// A whole season of games in one request. Passing a bare `dates=2026` also
// returns the previous season's January playoff games, filed under week numbers
// that collide with September's -- the date range is what keeps them out.
const SeasonGamesLimit = 1000;

const toDateParam = (iso: string) => iso.slice(0, 10).replace(/-/g, '');

export const fetchSeasonScoreboard = (
  calendar: SeasonCalendar
): Promise<EspnScoreboard> =>
  espnFetch<EspnScoreboard>(`${SiteApiBase}/scoreboard`, {
    dates: `${toDateParam(calendar.start)}-${toDateParam(calendar.end)}`,
    limit: SeasonGamesLimit,
  });

/* ---------------------------------------------------------------------------
 * Mappers. The only place that knows ESPN's wire shape.
 * ------------------------------------------------------------------------ */

export const toTeam = (team: EspnSiteTeam): Team => ({
  id: team.id,
  location: team.location,
  name: team.name,
  displayName: team.displayName,
  abbreviation: team.abbreviation,
  color: team.color,
  alternateColor: team.alternateColor,
  logo: team.logo,
});

const toGameTeam = (competitor: EspnCompetitor): GameTeam => ({
  id: competitor.team.id,
  displayName: competitor.team.displayName,
  abbreviation: competitor.team.abbreviation,
  // A string on the wire, and absent until kickoff.
  score: parseInt(competitor.score ?? '') || 0,
  winner: competitor.winner === true,
});

// Undefined when ESPN returns a competition without both sides, which would
// otherwise dereference to nothing halfway down a render.
export const toGame = (event: EspnEvent): Game | undefined => {
  const competition = event.competitions[0];

  if (!competition) {
    return undefined;
  }

  const home = competition.competitors.find((side) => side.homeAway === 'home');
  const away = competition.competitors.find((side) => side.homeAway === 'away');

  if (!home || !away) {
    return undefined;
  }

  return {
    matchupId: competition.id,
    date: event.date,
    shortName: event.shortName,
    status: competition.status.type.name,
    state: competition.status.type.state,
    completed: competition.status.type.completed,
    home: toGameTeam(home),
    away: toGameTeam(away),
  };
};

// Games bucketed by week number, for a response spanning a whole season.
export const toGamesByWeek = (scoreboard: EspnScoreboard): Record<number, Game[]> => {
  const byWeek: Record<number, Game[]> = {};

  for (const event of scoreboard.events ?? []) {
    const week = event.week?.number;
    const game = toGame(event);

    if (!week || !game) {
      continue;
    }

    byWeek[week] = [...(byWeek[week] ?? []), game];
  }

  return byWeek;
};

export const toGames = (scoreboard: EspnScoreboard): Game[] =>
  scoreboard.events
    .map(toGame)
    .filter((game): game is Game => game !== undefined);

// ESPN rolls the default scoreboard onto regular-season week 1 during the
// preseason, so this reports week 1 rather than a preseason week number the
// rest of the app has no matchups for.
export const toSeasonWeek = (scoreboard: EspnScoreboard): SeasonWeek => ({
  season: scoreboard.season?.year ?? getCurrentYear(),
  week:
    scoreboard.season?.type === RegularSeasonType
      ? scoreboard.week?.number ?? 1
      : 1,
});

export const toSeasonCalendar = (scoreboard: EspnScoreboard): SeasonCalendar => {
  const league = scoreboard.leagues?.[0];
  const regularSeason = league?.calendar?.find(
    (entry) => entry.value === String(RegularSeasonType)
  );

  return {
    season: scoreboard.season?.year ?? getCurrentYear(),
    start: regularSeason?.startDate ?? league?.season?.startDate ?? '',
    end: regularSeason?.endDate ?? league?.season?.endDate ?? '',
    weeks: (regularSeason?.entries ?? []).map((entry) => ({
      week: parseInt(entry.value),
      label: entry.label,
      start: entry.startDate,
      end: entry.endDate,
    })),
  };
};

export const toTeamsKeyed = (scoreboard: EspnScoreboard): TeamsKeyed => {
  const keyed: TeamsKeyed = {};

  for (const event of scoreboard.events ?? []) {
    for (const side of event.competitions?.[0]?.competitors ?? []) {
      const team = toTeam(side.team);
      keyed[team.id] = team;
    }
  }

  return keyed;
};

/* ---------------------------------------------------------------------------
 * What the app asks for.
 * ------------------------------------------------------------------------ */

export const getWeekMatchups = async (
  season: number,
  week: number
): Promise<Game[]> => toGames(await fetchScoreboard({ season, week }));

