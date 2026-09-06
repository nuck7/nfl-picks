import { Game, Pick, PicksForm, Player } from '../types';
import { getMatchupId } from './teams';

// A slot for one game, with no team chosen yet. The two sides are filled in
// from the matchup rather than left blank: the slot knows which game it is for.
export const createEmptyPick = (matchup: Game): Pick => ({
    matchupId: getMatchupId(matchup),
    homeTeam: { id: matchup.home.id, name: matchup.home.displayName },
    awayTeam: { id: matchup.away.id, name: matchup.away.displayName },
})

// Finds the pick belonging to a matchup. Every pick carries the competition id,
// so position in the array means nothing and never needs to be consulted.
export const findPickForMatchup = (picks: Pick[], matchup: Game): Pick | undefined => {
    const matchupId = getMatchupId(matchup)
    return picks.find((pick) => pick?.matchupId === matchupId)
}

// One slot per matchup in the week, preserving any pick already made for that
// game. Weeks vary between 13 and 16 games because of byes, so the slots are
// sized from the matchups rather than a fixed maximum.
// Rebuilds each slot from the matchup -- which is the authority on who is
// playing -- and carries over only the choice that was made.
export const alignPicksToMatchups = (picks: Pick[], matchups: Game[]): Pick[] =>
    matchups.map((matchup) => {
        const chosen = findPickForMatchup(picks, matchup)?.pickedTeam
        const slot = createEmptyPick(matchup)
        return chosen ? { ...slot, pickedTeam: chosen } : slot
    })

// Every game in the week picked. A saved document is not the same as a finished
// entry -- the form stores whatever you have so far -- so the standings use this
// rather than "has a picks document" to decide who appears.
//
// The tie breaker is deliberately not required: it only separates players who
// are already tied, and a missing one is rendered as an em dash rather than
// treated as an unfinished entry.
export const hasCompletePicks = (entry: PicksForm, matchups: Game[]): boolean =>
    matchups.length > 0
    && matchups.every((matchup) =>
        Boolean(findPickForMatchup(entry.picks ?? [], matchup)?.pickedTeam))

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

/* --- What actually gets stored ------------------------------------------- */

// Firestore rejects a write containing `undefined` anywhere in the payload, so
// an unmade pick omits the key entirely rather than carrying an undefined one.
const toStoredPick = (pick: Pick): Pick => ({
    matchupId: pick.matchupId,
    homeTeam: pick.homeTeam,
    awayTeam: pick.awayTeam,
    ...(pick.pickedTeam ? { pickedTeam: pick.pickedTeam } : {}),
})

// The document body for a week of picks. `key` is deliberately absent: it is the
// document's own id, not part of its data.
export const toPicksDocument = (picks: PicksForm, player: Player) => ({
    user_id: player.id,
    // A player document written before names were required can come back
    // without one, and undefined here would reject the whole write.
    user_name: player.name ?? '',
    week_id: picks.week_id ?? '',
    tieBreakerPoints: picks.tieBreakerPoints ?? '',
    // Dropping anything without a matchupId also drops array holes, which
    // firestore would reject outright -- and compacting is safe now that picks
    // are found by competition id rather than by position.
    picks: (picks.picks ?? [])
        .filter((pick): pick is Pick => Boolean(pick?.matchupId))
        .map(toStoredPick),
})
