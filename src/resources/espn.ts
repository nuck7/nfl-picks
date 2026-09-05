import axios, { AxiosResponse } from 'axios';
import {
  EspnSeasons,
  EspnSeason,
  EspnEvent,
  EspnMatchup,
  EspnTeams,
  EspnTeam,
  EspnWeek,
  EspnWeeks,
  SeasonWeek,
} from '../types';
import { getCurrentYear } from '../utils/espn';

const ESPN_PARAMS = {
  lang: 'en',
  limit: 500,
  region: 'us',
};

export const espnFetchUrl = async <T>(url: string) => {
  const securedUrl = url?.replace('http:', 'https:')
  const response: AxiosResponse<T> = await axios({
    method: 'get',
    params: ESPN_PARAMS,
    url: securedUrl,
  });
  return response?.data;
};

export const espnFetch = async <T>(endpoint: string) => {
  const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/${endpoint}`;
  return espnFetchUrl<T>(url);
};

export const getSeasons = () => espnFetch<EspnSeasons>('seasons');

export const getSeason = (year: number | string) =>
  espnFetch<EspnSeason>(`seasons/${year}`);

export const getCurrentSeason = async (): Promise<EspnSeason> => {
  const year = getCurrentYear();
  return getSeason(year);
};

export const getWeek = (year: number, week: number | string): Promise<EspnWeek> => 
  espnFetch<EspnWeek>(`seasons/${year}/types/2/weeks/${week}`);

// Week refs look like ".../seasons/2026/types/2/weeks/1".
export const getWeekNumberFromRef = (ref: string) => {
  const [, week] = ref.match(/\/weeks\/(\d+)/) ?? [];
  return week ? parseInt(week) : undefined;
};

export const getSeasonYearFromRef = (ref: string) => {
  const [, season] = ref.match(/\/seasons\/(\d+)/) ?? [];
  return season ? parseInt(season) : undefined;
};

// Derived from the events actually in play rather than season.type.week.
// season.type is whichever type is active today, so during the preseason it
// reports preseason week numbers (e.g. 4 for "Preseason Week 3") which don't
// line up with the regular season weeks the rest of the app shows. Taking the
// number off the events keeps the week id consistent with the matchups the
// pick form and standings display.
// The season year comes from the same ref as the week, so it stays correct in
// January when the calendar year has rolled over but the season has not.
export const getCurrentSeasonWeek = async (): Promise<SeasonWeek> => {
  const events = await espnFetch<EspnEvent>('events');
  const [firstEvent] = events.items;

  if (!firstEvent) {
    return { season: getCurrentYear(), week: 1 };
  }

  const matchup = await espnFetchUrl<EspnMatchup>(firstEvent.$ref);
  const ref = matchup.week.$ref;

  return {
    season: getSeasonYearFromRef(ref) ?? getCurrentYear(),
    week: getWeekNumberFromRef(ref) ?? 1,
  };
};

export const getCurrentWeekId = async (): Promise<number> =>
  (await getCurrentSeasonWeek()).week;

export const getNextWeek = async () => {
  const season = await getCurrentSeason();
  return season.type.week.number+1;
};

export const getCurrentWeekMatchups = async (): Promise<EspnMatchup[]> => {
  const events = await espnFetch<EspnEvent>('events');
  const matchupQueries = events.items.map((event): Promise<EspnMatchup> => espnFetchUrl(event.$ref));
  const matchups: EspnMatchup[] = await Promise.all(matchupQueries);

  return matchups;
};

// The regular season's week list, used to populate the week dropdown.
export const getSeasonWeeks = (year: number): Promise<EspnWeeks> =>
  espnFetch<EspnWeeks>(`seasons/${year}/types/2/weeks`);

// Matchups for one specific week. getCurrentWeekMatchups hits the unscoped
// /events endpoint, which only ever returns the current week.
export const getWeekMatchups = async (
  year: number,
  week: number
): Promise<EspnMatchup[]> => {
  const events = await espnFetch<EspnEvent>(
    `seasons/${year}/types/2/weeks/${week}/events`
  );

  return Promise.all(
    events.items.map((event) => espnFetchUrl<EspnMatchup>(event.$ref))
  );
};

export const getTeams = async (): Promise<EspnTeams> => {
  const year = getCurrentYear();
  const teams: Promise<EspnTeams> = espnFetch(`seasons/${year}/teams`);

  return teams;
};

export const getTeamById = async (teamId: string): Promise<EspnTeam> => {
  const year = getCurrentYear();
  const team: Promise<EspnTeam> = espnFetch(`seasons/${year}/teams/${teamId}`);

  return team;
};
