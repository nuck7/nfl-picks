import axios, { AxiosResponse } from 'axios'
import { CreateMatchupInput, CreatePickInput, CreateWeekInput, Team } from '../types';

export const getTeams = async () => {
    const teams: AxiosResponse<Team[]> = await axios({
        method: 'get',
        url: 'http://localhost:8091/teams'
    });
    return teams?.data || []
}

export const createWeek = async (week: CreateWeekInput) => {
    const response: AxiosResponse<Team[]> = await axios({
        method: 'post',
        url: 'http://localhost:8091/week',
        headers: { "Content-Type": "application/json" },
        data: {
            Start: week.Start,
            End: week.End,
        }
    });
    return response
}

export const createMatchup = async (matchup: CreateMatchupInput) => {
    const response: AxiosResponse<Team[]> = await axios({
        method: 'post',
        url: 'http://localhost:8091/matchup',
        headers: { "Content-Type": "application/json" },
        data: {
            HomeTeamID: matchup.HomeTeamID,
            AwayTeamID: matchup.AwayTeamID,
            WeekID: matchup.WeekID
        }
    });
    return response
}

export const createPick = async (pick: CreatePickInput) => {
    const response: AxiosResponse<Team[]> = await axios({
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
