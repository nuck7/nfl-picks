/* ---------------------------------------------------------------------------
 * Calendar arithmetic in a named timezone, on Intl alone -- no date library.
 *
 * Deliberately import-free: it is the one module the pick deadline and the
 * season seed both depend on, and keeping it standalone is what lets it be
 * exercised directly under `node --experimental-strip-types`.
 * ------------------------------------------------------------------------ */

// Where the pool is. The lock has to be ONE instant for everyone: resolving
// "noon" against each viewer's own clock handed two people in different zones
// two different deadlines, neither of which matched the defaultLockAtMs the
// Firestore rules enforce -- and for a viewer far enough east it landed after
// kickoff, which is a deadline that locks nothing. Viewers elsewhere are not
// shown Pacific time: formatDeadline renders the instant in the reader's own
// zone and labels it, so a traveller sees the same moment in their own terms.
export const PoolTimeZone = 'America/Los_Angeles'

// The wall clock in `timeZone` at `instant`, carried on a Date whose UTC fields
// hold those numbers. Not a real moment -- a readable way to ask "what day is
// it there?" and to do arithmetic on the answer.
const toZonedWallClock = (instant: Date, timeZone: string): Date => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).formatToParts(instant)

    const field = (type: string) =>
        Number(parts.find((part) => part.type === type)?.value ?? '0')

    // hour12: false answers midnight as "24" on some engines; % 24 normalises it
    // to the 0 that Date.UTC expects.
    return new Date(Date.UTC(
        field('year'),
        field('month') - 1,
        field('day'),
        field('hour') % 24,
        field('minute'),
        field('second')
    ))
}

// How far `timeZone` sits from UTC at that instant, in milliseconds. Positive
// east of Greenwich, negative west of it.
const zoneOffsetMs = (instant: Date, timeZone: string): number =>
    toZonedWallClock(instant, timeZone).getTime() - instant.getTime()

// The real moment at which a given wall clock happens in `timeZone`. The offset
// has to be measured at the answer rather than at the guess, so it is applied
// once to get close and then re-measured there -- otherwise a deadline within a
// few hours of a DST boundary lands an hour out.
const fromZonedWallClock = (wallClockMs: number, timeZone: string): Date => {
    const guess = wallClockMs - zoneOffsetMs(new Date(wallClockMs), timeZone)
    return new Date(wallClockMs - zoneOffsetMs(new Date(guess), timeZone))
}

// Midday in `timeZone`, on whichever calendar day `instant` falls on THERE.
// The day is the zone's, not the caller's: a Sunday 9:30am kickoff in London is
// still Sunday in Los Angeles, and a Thursday night game is still Thursday.
export const noonOnDayOf = (instant: Date, timeZone: string): Date => {
    const day = toZonedWallClock(instant, timeZone)

    return fromZonedWallClock(
        Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 12, 0, 0, 0),
        timeZone
    )
}
