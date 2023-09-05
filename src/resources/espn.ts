import axios, { AxiosResponse } from 'axios';
import {
  CreateMatchupsInput,
  CreatePickInput,
  CreateWeekInput,
  Team,
  MatchupsInput,
  UpdateWeekInput,
  Week,
  WeekMatchupsAPI,
  Matchup,
  EspnSeasons,
  EspnSeason,
  EspnEvent,
  EspnMatchup,
} from '../types';
import { getCurrentYear } from '../utils/espn';

const ESPN_PARAMS = {
  lang: 'en',
  limit: 500,
  region: 'us',
};

export const espnFetchUrl = async <T>(url: string) => {
  const response: AxiosResponse<T> = await axios({
    method: 'get',
    params: ESPN_PARAMS,
    url,
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

export const getTeamById = async (teamId: string) => {
  const year = getCurrentYear();
  const team = espnFetch(`seasons/${year}/teams/${teamId}`);

  return team;
};
