import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ColumnConfig, DataTable } from 'grommet';
import { Checkmark, Close } from 'grommet-icons';
import { getPicksForWeek } from '../../resources/firebase';
import { getPlayers } from '../../resources/players';
import { getWeekPayments, toPaymentsByPlayer } from '../../resources/payments';
import {
    CurrentUser, CurrentWeek, Outcome, PaymentMethod, Pick, PicksForm, Player,
    StandingsPickCell, StandingsRow, Team, TeamsKeyed,
} from '../../types';
import { CurrentUserContext, CurrentWeekContext, SubmitPicksContext, TeamsContext } from '../../App';
import { PaymentMethodLabels } from '../../constants';
import { getMatchupId, getMatchupLabel, getTeamByHomeAway } from '../../utils/teams';
import { findPickForMatchup, hasCompletePicks } from '../../utils/picks';
import {
    addOutcome, emptyRecord, formatRecord, getLeaders, getPickOutcome, Leader, WeekRecord,
} from '../../utils/grading';
import { resolveFillColor } from '../../utils/teamColors';
import { isDemoMode, makeDemoPicks } from '../../fixtures/demoPicks';
import MatchupHeading from '../MatchupHeading';
import VisuallyHidden from '../VisuallyHidden';
import { color } from '../../theme';
import {
    FooterStack, LeaderBanner, LeaderLabel, LeaderNames, LeaderRecord, NoPick,
    OutcomeBadge, PageHeader, PaymentBadge, PickLogo, PickTile, PlayerHeader,
    PrintLink, RecordLabel, RecordValue, TableScroll, TieBreakerValue,
} from './index.styles';

type Column = ColumnConfig<StandingsRow>

// The single source for how an outcome is announced. Colour, tint and badge are
// all decoration on top of this.
const OutcomeLabel: Record<Outcome, string> = {
    correct: 'Correct',
    incorrect: 'Incorrect',
    push: 'Tie, no result',
    pending: 'Not decided yet',
    none: 'No pick',
}

// The resolved Team for whichever side was picked, so the cell can use its
// logo and colour. Undefined when no pick was made, or when the stored id
// matches neither side -- a game whose teams changed after the pick was saved.
const getPickedTeam = (
    pick: Pick | undefined,
    homeTeam: Team,
    awayTeam: Team
): Team | undefined => {
    const pickedId = pick?.pickedTeam?.id

    if (pickedId === homeTeam.id) {
        return homeTeam
    }
    if (pickedId === awayTeam.id) {
        return awayTeam
    }

    return undefined
}

const PickCell: React.FC<{ cell?: StandingsPickCell }> = ({ cell }) => {
    if (!cell || cell.outcome === 'none') {
        return (
            <NoPick>
                <span aria-hidden='true'>&mdash;</span>
                <VisuallyHidden>No pick</VisuallyHidden>
            </NoPick>
        )
    }

    const { background, ink } = resolveFillColor(cell.color)
    const graded = cell.outcome === 'correct' || cell.outcome === 'incorrect'

    return (
        <PickTile $background={background} $ink={ink} $outcome={cell.outcome}>
            <PickLogo src={cell.logo} alt='' $outcome={cell.outcome} />
            {graded ? (
                // aria-hidden: the sentence below already says the outcome, and
                // announcing both reads it twice.
                <OutcomeBadge $outcome={cell.outcome} aria-hidden='true'>
                    {cell.outcome === 'correct'
                        ? <Checkmark size='14px' color='currentColor' />
                        : <Close size='14px' color='currentColor' />}
                </OutcomeBadge>
            ) : null}
            <VisuallyHidden>{`${cell.name ?? 'Pick'}. ${OutcomeLabel[cell.outcome]}.`}</VisuallyHidden>
        </PickTile>
    )
}

const Standings = () => {
    const teams = useContext<TeamsKeyed>(TeamsContext)
    const currentUser = useContext<CurrentUser>(CurrentUserContext)
    // The week and its games are resolved once in App.
    const { games: matchups, season, week, weekId } = useContext<CurrentWeek>(CurrentWeekContext)
    // The week is locked once picks can no longer be submitted. App leaves this
    // true when it has no deadline to go on, so an unknown deadline reads as
    // "not locked yet" and keeps everyone else's picks hidden -- the same way
    // the rules treat an unseeded week.
    const picksAreLocked = !useContext(SubmitPicksContext)
    const [userPicks, setUserPicks] = useState<PicksForm[]>([])
    const [players, setPlayers] = useState<Player[]>([])
    const [payments, setPayments] = useState<Record<string, PaymentMethod>>({})

    useEffect(() => {
        // Columns come from the roster, not from who happens to have submitted --
        // otherwise a player the admin just added wouldn't appear at all.
        getPlayers().then(setPlayers).catch(console.error)
    }, [])

    useEffect(() => {
        // Guarded rather than caught: the rules refuse a member the whole week's
        // payments, so asking anyway would be a request that can only ever fail.
        if (!currentUser.isAdmin || !weekId) {
            setPayments({})
            return
        }
        getWeekPayments(weekId)
            .then((weekPayments) => setPayments(toPaymentsByPlayer(weekPayments)))
            .catch(console.error)
    }, [currentUser.isAdmin, weekId])

    useEffect(() => {
        if (!weekId) {
            return
        }

        const fetchPicks = async () => {
            // Asked as a narrower query before the lock rather than filtered
            // afterwards: the rules refuse a member the whole week until then,
            // so fetching everything would fail outright.
            const userPicks: PicksForm[] = await getPicksForWeek(weekId, {
                playerId: currentUser.user?.id,
                canSeeEveryone: currentUser.isAdmin || picksAreLocked,
            })
            setUserPicks(userPicks)
        }
        // Firestore can reject (expired rules, offline). Demo mode should still
        // render, so swallow the failure and leave the real picks empty.
        fetchPicks().catch(console.error)
    }, [weekId, currentUser.isAdmin, currentUser.user?.id, picksAreLocked])

    // teams must be a dependency: App loads it with 32 sequential ESPN requests,
    // so it always resolves after the matchups and picks do.
    const { columns, rows, leaders } = useMemo(() => {
        if (!matchups.length || !Object.keys(teams).length) {
            return { columns: [] as Column[], rows: [] as StandingsRow[], leaders: [] as Leader[] }
        }

        // One entry per player, carrying their picks when they have some. Anyone
        // with picks but no roster record (older documents) is kept on the end so
        // their column doesn't silently vanish.
        const picksByPlayer = new Map(userPicks.map((entry) => [entry.user_id, entry]))
        const roster: PicksForm[] = players.map((player) => ({
            ...(picksByPlayer.get(player.id) ?? { picks: [], week_id: '', tieBreakerPoints: '' }),
            user_id: player.id,
            user_name: player.name,
        }))
        const unrostered = userPicks.filter((entry) => !players.some((player) => player.id === entry.user_id))

        // Only finished entries get a column. A player who has saved a partial
        // form, or none at all, is left off rather than shown as a column of
        // blanks -- and before the lock the roster is everyone, so without this
        // the page would be mostly empty columns.
        const entrants = [...roster, ...unrostered]
            .filter((participant) => hasCompletePicks(participant, matchups))

        // The demo fixture is exempt: it leaves every third slot unpicked on
        // purpose, to exercise the empty-cell rendering. Holding it to the same
        // rule as a real player empties the demo grid entirely.
        const participants = isDemoMode()
            ? [...entrants, ...makeDemoPicks(matchups, weekId)]
            : entrants

        // Keyed by matchup id so the Matchups column can render the same banded
        // heading the schedule page uses.
        const matchupsById = new Map(matchups.map((matchup) => [getMatchupId(matchup), matchup]))

        const records = new Map<string, WeekRecord>()
        const rowData: StandingsRow[] = []

        matchups.forEach((matchup) => {
            const homeTeam = getTeamByHomeAway(teams, matchup, 'home')
            const awayTeam = getTeamByHomeAway(teams, matchup, 'away')

            // A team missing from the map means ESPN returned a competitor we
            // haven't resolved; skip rather than dereference undefined.
            if (!homeTeam || !awayTeam) {
                return
            }

            const row: StandingsRow = {
                matchupId: getMatchupId(matchup),
                matchupName: getMatchupLabel(teams, matchup),
                picks: {},
            }

            for (const participant of participants) {
                if (!participant.user_id) {
                    continue
                }
                const pick = findPickForMatchup(participant.picks, matchup)
                const pickedTeam = getPickedTeam(pick, homeTeam, awayTeam)
                // Graded here rather than in the cell: the matchup, the pick and
                // the resolved team are all in scope exactly once, and the
                // week's record falls out of the same pass.
                const outcome = getPickOutcome(pick, matchup)

                row.picks[participant.user_id] = {
                    logo: pickedTeam?.logo,
                    name: pickedTeam?.displayName,
                    color: pickedTeam?.color,
                    outcome,
                }

                records.set(
                    participant.user_id,
                    addOutcome(records.get(participant.user_id) ?? emptyRecord(), outcome)
                )
            }

            rowData.push(row)
        })

        const columns: Column[] = [{
            property: 'matchupName',
            header: 'Matchups',
            verticalAlign: 'middle',
            render: (datum) => {
                const matchup = matchupsById.get(datum.matchupId)
                if (!matchup) {
                    return <>{datum.matchupName}</>
                }
                return <MatchupHeading size='grid' showResult tone='band' teams={teams} game={matchup} />
            },
            footer: (
                <FooterStack>
                    <RecordLabel>Week record</RecordLabel>
                    <RecordLabel>Tie breaker</RecordLabel>
                </FooterStack>
            ),
        }]

        for (const participant of participants) {
            if (!participant.user_id) {
                continue
            }
            const record = records.get(participant.user_id) ?? emptyRecord()
            const name = participant.user_name ?? participant.user_id
            const method = payments[participant.user_id]
            columns.push({
                property: participant.user_id,
                // Players are the columns here, so a player's payment sits at the
                // top of their own column rather than in one of its own. Admins
                // only: what anyone paid is nobody else's business.
                header: (
                    <PlayerHeader>
                        <span>{name}</span>
                        {currentUser.isAdmin ? (
                            <PaymentBadge $paid={Boolean(method)}>
                                {method ? PaymentMethodLabels[method] : 'Unpaid'}
                            </PaymentBadge>
                        ) : null}
                    </PlayerHeader>
                ),
                align: 'center',
                verticalAlign: 'middle',
                render: (datum) => <PickCell cell={datum.picks[participant.user_id]} />,
                footer: (
                    <FooterStack $align='center'>
                        <RecordValue>{formatRecord(record)}</RecordValue>
                        <TieBreakerValue>
                            {/* An empty string is a player who has not submitted,
                                which is different from one who guessed zero. */}
                            {participant.tieBreakerPoints === '' || participant.tieBreakerPoints == null
                                ? <span aria-hidden='true'>&mdash;</span>
                                : participant.tieBreakerPoints}
                            <VisuallyHidden>
                                {participant.tieBreakerPoints === '' || participant.tieBreakerPoints == null
                                    ? 'No tie breaker entered'
                                    : `Tie breaker ${participant.tieBreakerPoints} points`}
                            </VisuallyHidden>
                        </TieBreakerValue>
                    </FooterStack>
                ),
            })
        }

        // Built from the same records the column footers show, so the banner can
        // never disagree with the table underneath it.
        const leaders = getLeaders(participants
            .filter((participant) => participant.user_id)
            .map((participant) => ({
                userId: participant.user_id,
                name: participant.user_name ?? participant.user_id,
                record: records.get(participant.user_id) ?? emptyRecord(),
            })))

        return { columns, rows: rowData, leaders }
    }, [matchups, userPicks, players, teams, weekId, payments, currentUser.isAdmin])

    return (
        <div>
            <PageHeader>
                <h1>
                    {week ? `${season} Week ${week} Standings` : 'Standings'}
                </h1>
                {currentUser.isAdmin ? (
                    <PrintLink to='/standings/print'>Print picks sheet</PrintLink>
                ) : null}
            </PageHeader>

            {/* Absent rather than empty until a game has been decided: there is
                no leader in a week nobody has played yet. */}
            {leaders.length ? (
                <LeaderBanner>
                    <LeaderLabel>
                        {leaders.length > 1 ? 'Leaders' : 'Leader'}
                    </LeaderLabel>
                    <LeaderNames>
                        {leaders.map((leader) => leader.name).join(', ')}
                    </LeaderNames>
                    <LeaderRecord>
                        {/* Leaders are tied on correct picks only -- their full
                            records can still differ, so a shared lead reports
                            the one number they actually share. */}
                        {leaders.length > 1
                            ? `${leaders[0].record.correct} correct`
                            : (
                                <>
                                    {formatRecord(leaders[0].record)}
                                    <VisuallyHidden>
                                        {` — ${leaders[0].record.correct} correct`}
                                    </VisuallyHidden>
                                </>
                            )}
                    </LeaderRecord>
                </LeaderBanner>
            ) : null}

            <TableScroll>
                <DataTable
                    columns={columns}
                    data={rows}
                    // Player names stay put while you scroll the matchups, so a
                    // column of tiles is never anonymous.
                    pin='header'
                    // border={true} boxed every cell off from every other one,
                    // which fights the colour tiles. A hairline under each row
                    // is enough now that the tiles carry the structure.
                    border={{ body: { side: 'bottom', color: color.border } }}
                    pad={{ body: { horizontal: 'xsmall', vertical: 'xsmall' } }}
                />
            </TableScroll>
        </div>
    )
}

export default Standings
