import { createMatchup, createWeek } from "../resources/nfl-picks-server"
import { CreateWeekInput, WeekFormValues, Team, Week, WeekMatchupsAPI } from "../types"

export const submitNewWeekForm = async (weekFormValues: any) => {
    const week = weekFormToDb(weekFormValues)
    const createWeekResponse = await createWeek(week)
    console.log('week id', createWeekResponse.data.ID)
    const matchups = matchupFormToDb(weekFormValues.matchups, createWeekResponse.data.ID)
    console.log('matchups', matchups)
    matchups.forEach(async (matchup: any) => {
        console.log('matchup create payload ', matchup)

        const createMatchupResponse = await createMatchup(matchup)
        console.log('createMatchupResponse ', matchup, createMatchupResponse)
    })
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

/* tslint:disable-next-line */
export const matchupFormToDb = (matchupFormValues: any, weekId: number) => {
    const matchups = matchupFormValues.filter((matchup: { home: number }) => matchup.home).map(async (matchup: { home: { ID: any }; away: { ID: any } }) => {
        console.log('matchup db ', matchup)
        return {
            WeekID: weekId,
            HomeTeamID: matchup.home.ID,
            AwayTeamID: matchup.away.ID
        }
})
    return matchups
}
