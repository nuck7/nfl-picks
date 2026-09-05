import { Game, MatchupsByDate } from '../types';

// ESPN returns kickoff times in UTC, e.g. "2026-09-13T17:00Z". A Sunday night
// game is the following day in UTC, so both the grouping key and the labels are
// derived in the viewer's local timezone rather than from the ISO string.
const getLocalDateKey = (date: string) => {
    const kickoff = new Date(date)
    return `${kickoff.getFullYear()}-${kickoff.getMonth() + 1}-${kickoff.getDate()}`
}

export const formatGameDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    })

// Compact enough for a table cell: "Wed, Sep 9, 5:20 PM".
export const formatGameDateTime = (date: string) =>
    new Date(date).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })

// When a week's games start and finish kicking off. Note `end` is the LAST
// KICKOFF, not when that game ends -- a Monday night game still has three hours
// to run at this point, so don't use it to decide whether a week is over.
export const getKickoffWindow = (games: Game[]) => {
    const kickoffs = games
        .map((game) => new Date(game.date).getTime())
        .filter((time) => !Number.isNaN(time))

    if (!kickoffs.length) {
        return undefined
    }

    return {
        start: new Date(Math.min(...kickoffs)),
        end: new Date(Math.max(...kickoffs)),
    }
}

export const formatGameTime = (date: string) =>
    new Date(date).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    })

// Groups a week's matchups into one section per calendar day, days in
// chronological order and kickoffs ordered within each day.
export const groupMatchupsByDate = (matchups: Game[]): MatchupsByDate[] => {
    const sections = new Map<string, MatchupsByDate>()

    for (const matchup of matchups) {
        const key = getLocalDateKey(matchup.date)
        const section = sections.get(key)

        if (section) {
            section.matchups.push(matchup)
        } else {
            sections.set(key, { key, date: matchup.date, matchups: [matchup] })
        }
    }

    const byKickoff = (a: Game, b: Game) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()

    return [...sections.values()]
        .map((section) => ({
            ...section,
            matchups: [...section.matchups].sort(byKickoff),
        }))
        .sort((a, b) => new Date(a.matchups[0].date).getTime() - new Date(b.matchups[0].date).getTime())
}

// datetime-local speaks local wall-clock with no zone, so an ISO instant has to
// be shifted by the offset before it can prefill the input, and shifted back on
// the way out. Doing this with slice() on the ISO string would silently show UTC.
export const toDateTimeLocalValue = (iso?: string) => {
    if (!iso) {
        return ''
    }

    const date = new Date(iso)

    if (Number.isNaN(date.getTime())) {
        return ''
    }

    const offsetMs = date.getTimezoneOffset() * 60 * 1000

    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export const fromDateTimeLocalValue = (value: string) => {
    if (!value) {
        return ''
    }

    const date = new Date(value)

    return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}
