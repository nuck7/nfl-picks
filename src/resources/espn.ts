import axios, { AxiosResponse } from 'axios'
import { CreateMatchupsInput, CreatePickInput, CreateWeekInput, Team, MatchupsInput, UpdateWeekInput, Week, WeekMatchupsAPI, Matchup, Pick, EspnSeasons, EspnSeason } from '../types';

export const getSeasons = async () => {
    const seasons: AxiosResponse<EspnSeasons> = await axios({
        method: 'get',
        url: 'http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons?lang=en&region=us'
    });
    return seasons?.data || null
}

export const getSeason = async (url: string) => {
    const seasons: AxiosResponse<EspnSeason> = await axios({
        method: 'get',
        url: url
    });
    return seasons?.data || null
}

export const getWeekById = async (id: number) => {
    const week: AxiosResponse<WeekMatchupsAPI> = await axios({
        method: 'get',
        url: 'http://localhost:8091/weekMatchups',
        params: {
            id: id,
        }
    });
    return week?.data || []
}

export const createWeek = async (week: CreateWeekInput) => {
    const response: AxiosResponse<Week> = await axios({
        method: 'post',
        url: 'http://localhost:8091/week',
        headers: { "Content-Type": "application/json" },
        data: {
            Name: week.Name,
            Start: week.Start,
            End: week.End,
        }
    });
    return response
}

export const updateWeek = async (week: UpdateWeekInput) => {
    const response: AxiosResponse<Week> = await axios({
        method: 'patch',
        url: `http://localhost:8091/week/${week.ID}`,
        headers: { "Content-Type": "application/json" },
        data: {
            Name: week.Name,
            Start: week.Start,
            End: week.End,
        }
    });
    return response
}

export const createMatchups = async (matchups: CreateMatchupsInput[]) => {
    const response: AxiosResponse<Matchup[]> = await axios({
        method: 'post',
        url: 'http://localhost:8091/matchups',
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(matchups)
    });
    return response
}
export const updateMatchups = async (matchups: MatchupsInput[]) => {
    const response: AxiosResponse<Matchup[]> = await axios({
        method: 'patch',
        url: 'http://localhost:8091/matchups',
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({matchups})
    });
    return response
}

export const createPick = async (pick: CreatePickInput) => {
    const response: AxiosResponse<Pick[]> = await axios({
        method: 'post',
        url: 'http://localhost:8091/pick',
        headers: { "Content-Type": "application/json" },
        data: {
            UserID: pick.UserID,
            MatchupID: pick.MatchupID,
            WinnerID: pick.WinnerID
        }
    });
    return response
}
