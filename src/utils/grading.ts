import { Game, GameTeam, Outcome, Pick } from '../types';

/* ---------------------------------------------------------------------------
 * ESPN already sends everything below: completed, state and a per-side winner
 * flag are mapped in resources/espn.ts and, until now, read by nothing.
 * ------------------------------------------------------------------------ */

export const isFinal = (game?: Game) =>
    Boolean(game && (game.completed || game.state === 'post'))

export const isInProgress = (game?: Game) =>
    Boolean(game && !isFinal(game) && game.state === 'in')

// Undefined for anything that isn't a decided, finished game. Both flags equal
// covers two cases -- an actual tie, and a final ESPN hasn't scored yet -- and
// both should read as "no result" rather than as "the home team lost", so
// nobody is marked wrong on missing data.
export const getWinningSide = (game?: Game): GameTeam | undefined => {
    if (!game || !isFinal(game) || game.home.winner === game.away.winner) {
        return undefined
    }
    return game.home.winner ? game.home : game.away
}

export const getWinningSideKey = (game?: Game): 'home' | 'away' | undefined => {
    const winner = getWinningSide(game)
    if (!winner || !game) {
        return undefined
    }
    return game.home.winner ? 'home' : 'away'
}

export const getPickOutcome = (pick: Pick | undefined, game: Game | undefined): Outcome => {
    const picked = pick?.pickedTeam

    if (!picked) {
        return 'none'
    }
    if (!game || !isFinal(game)) {
        return 'pending'
    }

    const winner = getWinningSide(game)
    if (!winner) {
        return 'push'
    }

    // Both ids are ESPN team ids as strings, so this is a direct comparison.
    return picked.id === winner.id ? 'correct' : 'incorrect'
}

export const isPickCorrect = (pick: Pick | undefined, game: Game | undefined) =>
    getPickOutcome(pick, game) === 'correct'

/* --- Per-player week records --------------------------------------------- */

export type WeekRecord = {
    correct: number
    incorrect: number
    pushes: number
    pending: number
    unpicked: number
}

export const emptyRecord = (): WeekRecord => ({
    correct: 0, incorrect: 0, pushes: 0, pending: 0, unpicked: 0,
})

export const addOutcome = (record: WeekRecord, outcome: Outcome): WeekRecord => {
    switch (outcome) {
        case 'correct': record.correct += 1; break
        case 'incorrect': record.incorrect += 1; break
        case 'push': record.pushes += 1; break
        case 'pending': record.pending += 1; break
        case 'none': record.unpicked += 1; break
    }
    return record
}

// Everyone tied at the top of the week by correct picks -- plural because a
// shared lead is the normal case early in a week, not an edge case.
//
// Nobody leads on zero. Until a game has actually been decided every record is
// 0-0, and crowning the whole pool on that would be noise; an empty result is
// what tells the page to say nothing yet.
export type Leader = {
    userId: string
    name: string
    record: WeekRecord
    // Only needed to settle a tie, so callers that never break one may omit it.
    // '' is a player who submitted without filling it in, which is distinct from
    // one who guessed zero.
    tieBreakerPoints?: number | ''
}

export const getLeaders = (entries: Leader[]): Leader[] => {
    const best = entries.reduce((most, entry) => Math.max(most, entry.record.correct), 0)

    return best === 0
        ? []
        : entries
            .filter((entry) => entry.record.correct === best)
            // Sorted so a tie doesn't reorder itself between renders as the
            // underlying picks come back in whatever order Firestore returns.
            .sort((a, b) => a.name.localeCompare(b.name))
}

/* --- Who won a week ------------------------------------------------------ */

// The tie breaker is the total points of the week's last game -- the Monday
// night game in a normal week, which is what the pick form asks players to
// guess. Undefined until that game is final: a week still being played has no
// tie to break yet, and a half-played score would settle one wrongly.
export const getTieBreakerTotal = (games: Game[]): number | undefined => {
    const last = games.reduce<Game | undefined>((latest, game) => {
        const kickoff = new Date(game.date).getTime()

        if (Number.isNaN(kickoff)) {
            return latest
        }

        const latestKickoff = latest ? new Date(latest.date).getTime() : -Infinity

        return kickoff > latestKickoff ? game : latest
    }, undefined)

    return last && isFinal(last) ? last.home.score + last.away.score : undefined
}

// The one winner of a week: most correct picks, and a tie settled by whose
// guess came closest to the actual total.
//
// Undefined rather than a coin toss whenever the week genuinely has no single
// winner -- nothing graded yet, a tie with the last game still unplayed, a tie
// where nobody filled the tie breaker in, or two guesses equally close. A week
// that cannot be decided should show nobody, not the first name alphabetically.
export const getWeekWinner = (
    entries: Leader[],
    tieBreakerTotal?: number
): Leader | undefined => {
    const leaders = getLeaders(entries)

    if (leaders.length <= 1) {
        return leaders[0]
    }

    if (tieBreakerTotal === undefined) {
        return undefined
    }

    // Blank guesses are dropped rather than treated as zero, which would hand
    // the week to whoever skipped the field in a low-scoring game.
    const guesses = leaders
        .map((leader) => ({
            leader,
            distance: typeof leader.tieBreakerPoints === 'number'
                ? Math.abs(leader.tieBreakerPoints - tieBreakerTotal)
                : undefined,
        }))
        .filter(
            (entry): entry is { leader: Leader; distance: number } =>
                entry.distance !== undefined
        )

    if (!guesses.length) {
        return undefined
    }

    const closest = Math.min(...guesses.map((entry) => entry.distance))
    const winners = guesses.filter((entry) => entry.distance === closest)

    return winners.length === 1 ? winners[0].leader : undefined
}

// "9-4", or "9-4-1" when a tie pushed one game. Ties run about one a season,
// but without the third number a push is indistinguishable from a game nobody
// has graded, which is the one thing a record must not be ambiguous about.
export const formatRecord = (record: WeekRecord) =>
    `${record.correct}-${record.incorrect}${record.pushes ? `-${record.pushes}` : ''}`
