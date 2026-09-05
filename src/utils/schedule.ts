import { EspnMatchup, MatchupsByDate } from '../types';

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

export const formatGameTime = (date: string) =>
    new Date(date).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    })

// Groups a week's matchups into one section per calendar day, days in
// chronological order and kickoffs ordered within each day.
export const groupMatchupsByDate = (matchups: EspnMatchup[]): MatchupsByDate[] => {
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

    const byKickoff = (a: EspnMatchup, b: EspnMatchup) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()

    return [...sections.values()]
        .map((section) => ({
            ...section,
            matchups: [...section.matchups].sort(byKickoff),
        }))
        .sort((a, b) => new Date(a.matchups[0].date).getTime() - new Date(b.matchups[0].date).getTime())
}
