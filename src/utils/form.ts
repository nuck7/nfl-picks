import { createMatchups, createWeek } from "../resources/nfl-picks-server"
import { CreateWeekInput, WeekFormValues, FormMatchup, WeekMatchupsAPI, CreateMatchupInput } from "../types"

export const submitNewWeekForm = async (weekFormValues: WeekFormValues) => {
    // const week = weekFormToDb(weekFormValues)
    // console.log('week to submit', week)

    // const createWeekResponse = await createWeek(week)
    // console.log('week id', createWeekResponse.data.ID)
    const matchups = matchupFormToDb(weekFormValues.matchups, 12)//createWeekResponse.data.ID)
    console.log('matchups', matchups)
    const createMatchupResponse = await createMatchups(matchups)
    console.log('createMatchupResponse ', createMatchupResponse)
}

export const submitPickForm = () => {

}

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
        name: week.Name,
        start_date: week.Start,
        end_date: week.End,
        matchups: matchups
    }
    console.log('week form', weekFormData)
    return weekFormData
}

export const matchupFormToDb = (matchupFormValues: FormMatchup[], weekId: number): CreateMatchupInput[] => {
    const matchups = matchupFormValues.filter((matchup) => matchup?.home?.ID != 0).map((matchup) => ({
        WeekID: weekId,
        HomeTeamID: matchup.home.ID,
        AwayTeamID: matchup.away.ID
    }))
    return matchups
}
