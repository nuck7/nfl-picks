import axios, { AxiosResponse } from 'axios'
import { CreateMatchupsInput, CreatePickInput, CreateWeekInput, Team, MatchupsInput, UpdateWeekInput, Week, WeekMatchupsAPI, Matchup, EspnSeasons, EspnSeason, EspnEvent } from '../types';

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
  return season.week.number;
};

export const getCurrentWeekMatchups = async () => {
  const events = await espnFetch<EspnEvent>('events');
  const matchupQueries = events.items.map((event) => espnFetchUrl(event.$ref));
  const matchups = await Promise.all(matchupQueries);

  return matchups;
};

export const getWeekById = async (id: number) => {
  const week: AxiosResponse<WeekMatchupsAPI> = await axios({
    method: 'get',
    url: 'http://localhost:8091/weekMatchups',
    params: {
      id: id,
    },
  });
  return week?.data || [];
};

export const createWeek = async (week: CreateWeekInput) => {
  const response: AxiosResponse<Week> = await axios({
    method: 'post',
    url: 'http://localhost:8091/week',
    headers: { 'Content-Type': 'application/json' },
    data: {
      Name: week.Name,
      Start: week.Start,
      End: week.End,
    },
  });
  return response;
};

export const updateWeek = async (week: UpdateWeekInput) => {
  const response: AxiosResponse<Week> = await axios({
    method: 'patch',
    url: `http://localhost:8091/week/${week.ID}`,
    headers: { 'Content-Type': 'application/json' },
    data: {
      Name: week.Name,
      Start: week.Start,
      End: week.End,
    },
  });
  return response;
};

export const createMatchups = async (matchups: CreateMatchupsInput[]) => {
  const response: AxiosResponse<Matchup[]> = await axios({
    method: 'post',
    url: 'http://localhost:8091/matchups',
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify(matchups),
  });
  return response;
};
export const updateMatchups = async (matchups: MatchupsInput[]) => {
  const response: AxiosResponse<Matchup[]> = await axios({
    method: 'patch',
    url: 'http://localhost:8091/matchups',
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ matchups }),
  });
  return response;
};

