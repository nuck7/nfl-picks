import { EspnMatchup, Pick } from '../types';
import { getMatchupId } from './teams';

export const createEmptyPick = (matchup: EspnMatchup): Pick => ({
    matchupId: getMatchupId(matchup),
    pickedTeam: { id: 0, name: '' },
    homeTeam: { id: 0, name: '' },
    awayTeam: { id: 0, name: '' },
})

// Finds the pick belonging to a matchup. Documents written before matchupId
// existed are matched positionally, but only when the slot carries no id of its
// own -- a slot with a different id belongs to another game.
export const findPickForMatchup = (
    picks: Pick[],
    matchup: EspnMatchup,
    index: number
): Pick | undefined => {
    const matchupId = getMatchupId(matchup)
    const byId = picks.find((pick) => pick.matchupId === matchupId)
    if (byId) {
        return byId
    }

    const positional = picks[index]
    return positional && !positional.matchupId ? positional : undefined
}

// One slot per matchup in the week, preserving any pick already made for that
// game. Weeks vary between 13 and 16 games because of byes, so the slots are
// sized from the matchups rather than a fixed maximum.
export const alignPicksToMatchups = (picks: Pick[], matchups: EspnMatchup[]): Pick[] =>
    matchups.map((matchup, index) => {
        const existing = findPickForMatchup(picks, matchup, index)
        return existing
            ? { ...existing, matchupId: getMatchupId(matchup) }
            : createEmptyPick(matchup)
    })
