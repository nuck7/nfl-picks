import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Button } from 'grommet'
import { CurrentUserContext, CurrentWeekContext } from '../../App'
import { getPicksForWeek } from '../../resources/firebase'
import { getPlayers } from '../../resources/players'
import { CurrentUser, CurrentWeek, Game, Pick, PicksForm, Player } from '../../types'
import { findPickForMatchup, hasCompletePicks } from '../../utils/picks'
import { addOutcome, emptyRecord, formatRecord, getPickOutcome, WeekRecord } from '../../utils/grading'
import { isDemoMode, makeDemoPicks } from '../../fixtures/demoPicks'
import LinkButton from '../LinkButton'
import {
    Correct, NoPick, Notice, PrintPageStyle, Sheet, SheetHeading, SheetMeta, ToolBar,
} from './index.styles'

// Three characters instead of "Philadelphia Eagles". A picks sheet is one column
// per player, so the width of a cell is what decides how many players fit across
// a landscape page -- and the abbreviation is on the game already.
const pickedAbbreviation = (pick: Pick | undefined, matchup: Game) => {
    const pickedId = pick?.pickedTeam?.id

    if (!pickedId) {
        return undefined
    }
    if (pickedId === matchup.home.id) {
        return matchup.home.abbreviation
    }
    if (pickedId === matchup.away.id) {
        return matchup.away.abbreviation
    }

    // A pick for a team no longer in this matchup: show what was stored rather
    // than dropping it silently.
    return pick?.pickedTeam?.name
}

const PrintPicks: React.FC = () => {
    const { user, isAdmin, loading } = useContext<CurrentUser>(CurrentUserContext)
    const { games: matchups, season, week, weekId } = useContext<CurrentWeek>(CurrentWeekContext)
    const [players, setPlayers] = useState<Player[]>([])
    const [picks, setPicks] = useState<PicksForm[]>([])

    useEffect(() => {
        if (!isAdmin) {
            return
        }
        getPlayers().then(setPlayers).catch(console.error)
    }, [isAdmin])

    useEffect(() => {
        if (!isAdmin || !weekId) {
            return
        }
        // canSeeEveryone is safe to assert here: the page is admin-only, and the
        // rules let an admin read the week whether or not it has locked.
        getPicksForWeek(weekId, { playerId: user?.id, canSeeEveryone: true })
            .then(setPicks)
            .catch(console.error)
    }, [isAdmin, weekId, user?.id])

    // The same shape the standings build, so the sheet and the screen never
    // disagree about who is in the week or what their record is.
    const { entrants, records } = useMemo(() => {
        const picksByPlayer = new Map(picks.map((entry) => [entry.user_id, entry]))
        const roster: PicksForm[] = players.map((player) => ({
            ...(picksByPlayer.get(player.id) ?? { picks: [], week_id: '', tieBreakerPoints: '' }),
            user_id: player.id,
            user_name: player.name,
        }))
        const unrostered = picks.filter((entry) =>
            !players.some((player) => player.id === entry.user_id))

        const included = [
            ...[...roster, ...unrostered]
                .filter((entry) => entry.user_id && hasCompletePicks(entry, matchups)),
            // Same exemption the standings make: the demo fixture leaves every
            // third slot unpicked on purpose, so holding it to the completeness
            // rule would print an empty sheet.
            ...(isDemoMode() ? makeDemoPicks(matchups, weekId) : []),
        ]

        const weekRecords = new Map<string, WeekRecord>()

        for (const entry of included) {
            const record = matchups.reduce(
                (running, matchup) => addOutcome(
                    running,
                    getPickOutcome(findPickForMatchup(entry.picks ?? [], matchup), matchup)
                ),
                emptyRecord()
            )
            weekRecords.set(entry.user_id, record)
        }

        return { entrants: included, records: weekRecords }
    }, [players, picks, matchups])

    if (loading) {
        return null
    }

    if (!isAdmin) {
        return <Notice>You do not have access to this page.</Notice>
    }

    return (
        <div>
            <PrintPageStyle />

            <ToolBar>
                <Button primary label='Print' onClick={() => window.print()} />
                <LinkButton to='/standings'>Back to standings</LinkButton>
            </ToolBar>

            <SheetHeading>
                {week ? `${season} Week ${week} Picks` : 'Week picks'}
            </SheetHeading>
            <SheetMeta>
                {`${entrants.length} ${entrants.length === 1 ? 'player' : 'players'} · printed ${new Date().toLocaleDateString()}`}
            </SheetMeta>

            {matchups.length && entrants.length ? (
                <Sheet>
                    <thead>
                        <tr>
                            <th scope='col'>Matchup</th>
                            {entrants.map((entrant) => (
                                <th scope='col' key={entrant.user_id}>{entrant.user_name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matchups.map((matchup) => (
                            <tr key={matchup.matchupId}>
                                <th scope='row'>{matchup.shortName}</th>
                                {entrants.map((entrant) => {
                                    const pick = findPickForMatchup(entrant.picks ?? [], matchup)
                                    const abbreviation = pickedAbbreviation(pick, matchup)
                                    const outcome = getPickOutcome(pick, matchup)

                                    return (
                                        <td key={entrant.user_id}>
                                            {!abbreviation
                                                ? <NoPick aria-label='No pick'>&mdash;</NoPick>
                                                : outcome === 'correct'
                                                    ? <Correct>{`${abbreviation} ✓`}</Correct>
                                                    : abbreviation}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th scope='row'>Week record</th>
                            {entrants.map((entrant) => (
                                <td key={entrant.user_id}>
                                    {formatRecord(records.get(entrant.user_id) ?? emptyRecord())}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <th scope='row'>Tie breaker</th>
                            {entrants.map((entrant) => (
                                <td key={entrant.user_id}>
                                    {entrant.tieBreakerPoints === '' || entrant.tieBreakerPoints == null
                                        ? <NoPick>&mdash;</NoPick>
                                        : entrant.tieBreakerPoints}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                </Sheet>
            ) : (
                <Notice>
                    {matchups.length
                        ? 'Nobody has submitted a full set of picks for this week yet.'
                        : 'Loading this week…'}
                </Notice>
            )}
        </div>
    )
}

export default PrintPicks
