import axios, { AxiosResponse } from 'axios';
import {
  EspnSeasons,
  EspnSeason,
  EspnEvent,
  EspnMatchup,
  EspnTeams,
  EspnTeam,
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

export const getCurrentSeason = async () => {
  const year = getCurrentYear();
  return getSeason(year);
};

export const getCurrentWeekId = async () => {
  const season = await getCurrentSeason();
  return season.type.week.number;
};

export const getCurrentWeekMatchups = async (): Promise<EspnMatchup[]> => {
  const events = await espnFetch<EspnEvent>('events');
  const matchupQueries = events.items.map((event): Promise<EspnMatchup> => espnFetchUrl(event.$ref));
  const matchups: EspnMatchup[] = await Promise.all(matchupQueries);

  return matchups;
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
