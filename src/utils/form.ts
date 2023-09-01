import { CreateWeekInput, WeekFormValues, FormMatchup, WeekMatchupsAPI, MatchupsInput, CreateMatchupsInput, FormUpdateMatchup, WeekUpdateFormValues } from "../types"

export const weekFormToDb = (weekFormValues: WeekFormValues): CreateWeekInput => {
    let weekInput = {
        Name: weekFormValues.name,
        Start: weekFormValues.start_date,
        End: weekFormValues.end_date
    }
    return weekInput
}

export const weekDbToForm = (week: WeekMatchupsAPI): WeekFormValues => {
    const matchups = week.Matchups.map(matchup => ({
        id: matchup.ID,
        weekId: matchup.WeekID,
        home: {
            ID: matchup.HomeTeamID,
            Name: matchup.HomeTeamName,
            City: matchup.HomeTeamCity
        },
        away: {
            ID: matchup.AwayTeamID,
            Name: matchup.AwayTeamName,
            City: matchup.AwayTeamCity
        },
    }))

    const weekFormData = {
        id: week.ID,
        name: week.Name,
        start_date: week.Start,
        end_date: week.End,
        matchups: matchups
    }
    console.log('week form', weekFormData)
    return weekFormData
}

export const createMatchupFormToDb = (matchupFormValues: FormMatchup[], weekId: number): CreateMatchupsInput[] => {
    const matchups = matchupFormValues.filter((matchup) => matchup?.home?.ID != 0 && matchup?.away?.ID != 0).map((matchup) => ({
        WeekID: weekId,
        HomeTeamID: matchup.home.ID,
        AwayTeamID: matchup.away.ID
    }))
    return matchups
}

export const updateMatchupFormToDb = (matchupFormValues: FormUpdateMatchup[]): MatchupsInput[] => {
    const matchups = matchupFormValues.filter((matchup) => matchup?.home?.ID != 0 && matchup?.away?.ID != 0).map((matchup) => ({
        ID: matchup.id,
        WeekID: matchup.weekId,
        HomeTeamID: matchup.home.ID,
        AwayTeamID: matchup.away.ID
    }))
    console.log('matchups',matchups)
    return matchups
}

export const pickFormToDb = (weekFormValues: WeekFormValues): CreateWeekInput => {
    let weekInput = {
        Name: weekFormValues.name,
        Start: weekFormValues.start_date,
        End: weekFormValues.end_date
    }
    return weekInput
}

export const pickDbToForm = (week: WeekMatchupsAPI): WeekFormValues => {
    const matchups = week.Matchups.map(matchup => ({
        id: matchup.ID,
        weekId: matchup.WeekID,
        home: {
            ID: matchup.HomeTeamID,
            Name: matchup.HomeTeamName,
            City: matchup.HomeTeamCity
        },
        away: {
            ID: matchup.AwayTeamID,
            Name: matchup.AwayTeamName,
            City: matchup.AwayTeamCity
        },
    }))

    const weekFormData = {
        id: week.ID,
        name: week.Name,
        start_date: week.Start,
        end_date: week.End,
        matchups: matchups
    }
    console.log('week form', weekFormData)
    return weekFormData
}

export const submitCreatePicks = () => {

}

export const submitUpdatePicks = () => {

}
