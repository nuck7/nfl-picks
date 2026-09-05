import { EspnMatchup, TeamsKeyed } from "../types";

export const getTeamByHomeAway = (teams: TeamsKeyed, matchup: EspnMatchup, homeAway: string) => {
    if (matchup.competitions[0].competitors[0].homeAway == homeAway) {
        return teams[matchup.competitions[0].competitors[0].id]
    }
    return teams[matchup.competitions[0].competitors[1].id]
}

// ESPN's competition id is stable per game, unlike the position of the matchup
// in the events array. Picks are keyed off this so columns can't drift.
export const getMatchupId = (matchup: EspnMatchup) => matchup.competitions[0].id

// ESPN returns name as "<away displayName> at <home displayName>", so " at " is
// the separator to split on. Returns [away, home].
export const getMatchupTeamNames = (matchup: EspnMatchup) => matchup.name.split(' at ')

// Display label, using "@" rather than ESPN's "at". Prefers the resolved teams so
// the label doesn't depend on parsing, and falls back to the name while the teams
// map is still loading. Both paths produce the same text.
export const getMatchupLabel = (teams: TeamsKeyed, matchup: EspnMatchup) => {
    const homeTeam = getTeamByHomeAway(teams, matchup, 'home')
    const awayTeam = getTeamByHomeAway(teams, matchup, 'away')

    if (homeTeam && awayTeam) {
        return `${awayTeam.displayName} @ ${homeTeam.displayName}`
    }

    return getMatchupTeamNames(matchup).join(' @ ')
}
