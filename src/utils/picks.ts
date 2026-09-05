import { Game, Pick } from '../types';
import { getMatchupId } from './teams';

export const createEmptyPick = (matchup: Game): Pick => ({
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
    matchup: Game,
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
export const alignPicksToMatchups = (picks: Pick[], matchups: Game[]): Pick[] =>
    matchups.map((matchup, index) => {
        const existing = findPickForMatchup(picks, matchup, index)
        return existing
            ? { ...existing, matchupId: getMatchupId(matchup) }
            : createEmptyPick(matchup)
    })

// Picks lock at noon on the day of the week's first game, in the viewer's own
// timezone -- the same wall-clock day the schedule groups that game under.
// An admin can override this per week; see getEffectiveDeadline.
export const getPickDeadline = (games: Game[]): Date | undefined => {
    const kickoffs = games
        .map((game) => new Date(game.date).getTime())
        .filter((time) => !Number.isNaN(time))

    if (!kickoffs.length) {
        return undefined
    }

    const deadline = new Date(Math.min(...kickoffs))
    deadline.setHours(12, 0, 0, 0)

    return deadline
}

// An admin's lock time for the week wins over the computed one. An unparseable
// stored value is ignored rather than treated as "already locked", so a bad
// write can't shut the week down.
export const getEffectiveDeadline = (
    games: Game[],
    lockAt?: string
): Date | undefined => {
    if (lockAt) {
        const override = new Date(lockAt)
        if (!Number.isNaN(override.getTime())) {
            return override
        }
    }

    return getPickDeadline(games)
}

// Open until the deadline passes. A week with no games yet -- ESPN between
// weeks, or a failed request -- leaves the form open rather than locking
// everyone out over missing data.
export const canSubmitPicks = (
    games: Game[],
    now: number = Date.now(),
    lockAt?: string
): boolean => {
    const deadline = getEffectiveDeadline(games, lockAt)
    return !deadline || now < deadline.getTime()
}
