import { Game, TeamsKeyed } from "../types";

// A game carries only team ids; the display data lives in the teams map so a
// logo url isn't duplicated into all 18 weeks.
export const getTeamByHomeAway = (teams: TeamsKeyed, game: Game, homeAway: string) =>
    teams[homeAway === 'home' ? game.home.id : game.away.id]

// ESPN's competition id is stable per game, unlike the position of the game in
// the week. Picks are keyed off this so columns can't drift.
export const getMatchupId = (game: Game) => game.matchupId

// Display label, using "@" rather than ESPN's "at". Prefers the resolved teams
// and falls back to the names carried on the game itself, so it reads correctly
// while the teams map is still loading. Both paths produce the same text.
export const getMatchupLabel = (teams: TeamsKeyed, game: Game) => {
    const homeTeam = getTeamByHomeAway(teams, game, 'home')
    const awayTeam = getTeamByHomeAway(teams, game, 'away')

    return `${awayTeam?.displayName ?? game.away.displayName} @ ${homeTeam?.displayName ?? game.home.displayName}`
}

