import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ColumnConfig, DataTable, Select } from 'grommet';
import { Checkmark, Close, FormDown, FormNext } from 'grommet-icons';
import { getPicksForWeek } from '../../resources/firebase';
import { getPlayers } from '../../resources/players';
import { getWeekPayments, toPaymentsByPlayer } from '../../resources/payments';
import {
    CurrentUser, CurrentWeek, DropdownOption, Game, Outcome, PaymentMethod, Pick,
    PicksForm, Player, StandingsPickCell, StandingsRow, Team, TeamsKeyed,
} from '../../types';
import { CurrentUserContext, CurrentWeekContext, SubmitPicksContext, TeamsContext } from '../../App';
import { PaymentMethodLabels, WeeklyBuyIn } from '../../constants';
import { getMatchupId, getMatchupLabel, getTeamByHomeAway } from '../../utils/teams';
import { canSubmitPicks, findPickForMatchup, hasCompletePicks } from '../../utils/picks';
import { byKickoff } from '../../utils/schedule';
import { getWeekMatchups } from '../../resources/espn';
import { getWeekSettings } from '../../resources/weeks';
import { makeWeekId } from '../../utils/espn';
import {
    addOutcome, emptyRecord, formatRecord, getLeaders, getPickOutcome, getTieBreakerTotal,
    getWeekWinner, isFinal, Leader, WeekRecord,
} from '../../utils/grading';
import { resolveFillColor } from '../../utils/teamColors';
import { isDemoMode, makeDemoPicks } from '../../fixtures/demoPicks';
import MatchupHeading from '../MatchupHeading';
import VisuallyHidden from '../VisuallyHidden';
import { color } from '../../theme';
import {
    FooterStack, HeaderMeta, HeaderMetaLine, HeaderTitle, LeaderList, LeaderToggle, MetaValue, NoPick,
    OutcomeBadge, PageHeader, PaymentBadge, PickLogo, PickTile, PlayerHeader,
    PrintLink, RecordLabel, RecordValue, TableScroll, TieBreakerValue, WeekSelectContainer,
} from './index.styles';

type Column = ColumnConfig<StandingsRow>

// One week as this page shows it: its games, the id its picks and payments are
// stored under, and whether its picks have locked. The last one is per week and
// not a property of "now" -- a finished week is locked however open the week in
// play happens to be.
type ViewedWeek = {
    week: number
    weekId: string
    games: Game[]
    locked: boolean
}

// Every player column is this wide, explicitly. Letting the content size them
// meant each column was as wide as its own header, so the tile -- centred in
// whatever room the name left -- sat with different padding in every column and
// the gaps between tiles came out uneven (57, 36, 27, 46...). A 64px tile and a
// 76px header both fit inside this less the cell padding, so nothing stretches
// it and the spacing is even by construction.
const PlayerColumnWidth = '92px'

// Above this many tied at the top, the names collapse to a count. Three fit on
// one line at meta size even on a phone; four start wrapping, and a full pool
// tied after the first Thursday game is what made the old banner unreadable.
const MaxNamedLeaders = 3

// "Alex" / "Alex and Sam" / "Alex, Sam and Jo". No Oxford comma: this runs
// inline inside a sentence, where the extra comma reads as another name.
const formatNames = (names: string[]) =>
    names.length <= 1
        ? names.join('')
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

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
    // The week the pool is playing, resolved once in App. Since the week now
    // rolls over the moment its last game ends, this is where the page opens
    // rather than the only week it can show -- a finished week stays readable.
    const currentWeek = useContext<CurrentWeek>(CurrentWeekContext)
    const { calendar, season } = currentWeek
    // The CURRENT week is locked once picks can no longer be submitted. App
    // leaves this true when it has no deadline to go on, so an unknown deadline
    // reads as "not locked yet" and keeps everyone else's picks hidden -- the
    // same way the rules treat an unseeded week.
    const currentWeekIsLocked = !useContext(SubmitPicksContext)
    const [selectedWeek, setSelectedWeek] = useState<DropdownOption>()
    const [otherWeek, setOtherWeek] = useState<ViewedWeek>()
    const [userPicks, setUserPicks] = useState<PicksForm[]>([])
    const [players, setPlayers] = useState<Player[]>([])
    const [payments, setPayments] = useState<Record<string, PaymentMethod>>({})
    // Only ever consulted for a tie too wide to name inline, so it needs no
    // reset when the week changes: the toggle that sets it isn't rendered
    // unless there is something behind it.
    const [showLeaders, setShowLeaders] = useState(false)

    const weekOptions: DropdownOption[] = calendar.weeks.map((entry) => ({
        label: entry.label,
        value: entry.week,
    }))

    // Opens on the week in play -- but only while nothing has been chosen yet.
    // Once a week is showing, this default included, a rollover mid-read must
    // not yank the page off the table someone is reading.
    useEffect(() => {
        if (currentWeek.loading || selectedWeek || !weekOptions.length) {
            return
        }

        setSelectedWeek(
            weekOptions.find((option) => option.value === currentWeek.week) ?? weekOptions[0]
        )
    }, [currentWeek.loading, currentWeek.week, selectedWeek, weekOptions])

    const viewedWeek = selectedWeek?.value ?? currentWeek.week
    const isCurrentWeek = viewedWeek === currentWeek.week

    // Any other week has to be fetched, and so does its own lock time. Whether
    // the pool's picks may be shown is a per-week question: answering it with
    // the current week's lock would either hide a finished week's grid or ask
    // Firestore for a future week's picks and be refused.
    useEffect(() => {
        if (isCurrentWeek || !viewedWeek || !season) {
            return
        }

        let current = true
        const weekId = makeWeekId(season, viewedWeek)

        const load = async () => {
            const [games, settings] = await Promise.all([
                getWeekMatchups(season, viewedWeek),
                getWeekSettings(weekId).catch(() => undefined),
            ])

            if (current) {
                setOtherWeek({
                    week: viewedWeek,
                    weekId,
                    games,
                    locked: !canSubmitPicks(games, Date.now(), settings?.lockAt),
                })
            }
        }

        load().catch(console.error)

        return () => { current = false }
    }, [isCurrentWeek, viewedWeek, season])

    // Undefined for the moment between choosing a week and its games landing,
    // which the table reads as "nothing to draw yet" rather than drawing the
    // previous week's grid under the new week's heading.
    const viewing: ViewedWeek | undefined = isCurrentWeek
        ? {
            week: currentWeek.week,
            weekId: currentWeek.weekId,
            games: currentWeek.games,
            locked: currentWeekIsLocked,
        }
        : otherWeek?.week === viewedWeek ? otherWeek : undefined

    const matchups = viewing?.games ?? []
    const weekId = viewing?.weekId ?? ''
    const picksAreLocked = viewing?.locked ?? true
    // Whether this viewer can see the whole week. Before the lock the rules
    // refuse a member anyone else's picks, so their answer to "who entered" is
    // only ever themselves -- which is why the pot below waits for this.
    const canSeeEveryone = currentUser.isAdmin || picksAreLocked

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
                canSeeEveryone,
            })
            setUserPicks(userPicks)
        }
        // Firestore can reject (expired rules, offline). Demo mode should still
        // render, so swallow the failure and leave the real picks empty.
        fetchPicks().catch(console.error)
    }, [weekId, canSeeEveryone, currentUser.user?.id])

    // teams must be a dependency: App loads it with 32 sequential ESPN requests,
    // so it always resolves after the matchups and picks do.
    const {
        columns, rows, leaders, winner, tieBreakerTotal, entrantCount,
    } = useMemo(() => {
        if (!matchups.length || !Object.keys(teams).length) {
            return {
                columns: [] as Column[],
                rows: [] as StandingsRow[],
                leaders: [] as Leader[],
                winner: undefined as Leader | undefined,
                tieBreakerTotal: undefined as number | undefined,
                entrantCount: 0,
            }
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

        // ESPN returns a week's events in no order the app can rely on, so the
        // rows are put in kickoff order here rather than inheriting it. The
        // schedule and the pick form get the same order from
        // groupMatchupsByDate, which sorts with this same comparator -- so all
        // three pages list a week's games the same way round.
        const orderedMatchups = [...matchups].sort(byKickoff)

        // Keyed by matchup id so the Matchups column can render the same banded
        // heading the schedule page uses.
        const matchupsById = new Map(orderedMatchups.map((matchup) => [getMatchupId(matchup), matchup]))

        // The combined score of the week's last game, once it is final -- the
        // number everyone was guessing at in the pick form. Resolved up here
        // because the footer below closes over it, and JSX is built eagerly.
        const tieBreakerTotal = getTieBreakerTotal(orderedMatchups)

        const records = new Map<string, WeekRecord>()
        const rowData: StandingsRow[] = []

        orderedMatchups.forEach((matchup) => {
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
            // Held in place while the player columns scroll past it. With a full
            // pool the table is several screens wide, and without this you lose
            // track of which game a run of tiles belongs to.
            pin: true,
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
                    {/* The answer, beside the row of guesses at it, so the
                        closest one can be read off the table rather than
                        worked out. Absent until the last game is final, which
                        is the same moment the tie breaker starts counting. */}
                    <RecordLabel>
                        {tieBreakerTotal === undefined
                            ? 'Tie breaker'
                            : `Tie breaker \u2014 ${tieBreakerTotal} actual`}
                    </RecordLabel>
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
                size: PlayerColumnWidth,
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
        // never disagree with the table underneath it. The tie breaker guess
        // rides along: it is what settles the week when the top is level, and
        // without it here getWeekWinner has nothing to separate them by.
        const entries: Leader[] = participants
            .filter((participant) => participant.user_id)
            .map((participant) => ({
                userId: participant.user_id,
                name: participant.user_name ?? participant.user_id,
                record: records.get(participant.user_id) ?? emptyRecord(),
                tieBreakerPoints: participant.tieBreakerPoints,
            }))

        const leaders = getLeaders(entries)
        const winner = getWeekWinner(entries, tieBreakerTotal)

        // The same list the columns are built from, so the pot can never name a
        // number of players the grid doesn't show.
        return {
            columns,
            rows: rowData,
            leaders,
            winner,
            tieBreakerTotal,
            entrantCount: participants.length,
        }
    }, [matchups, userPicks, players, teams, weekId, payments, currentUser.isAdmin])

    // Only once the viewer can see the whole week -- see the summary below.
    const showPot = canSeeEveryone && entrantCount > 0

    // A week with nothing left to play has a winner rather than a leader, and a
    // level top is settled on the tie breaker rather than left on the page as a
    // tie -- which is how week 1 ended. Undefined while a game is still to come,
    // and undefined too when the tie breaker cannot separate the leaders (nobody
    // guessed, or two guesses were equally close), which falls back to naming
    // them all rather than picking one.
    const weekIsComplete = matchups.length > 0 && matchups.every(isFinal)
    const decided = weekIsComplete ? winner : undefined
    // Only worth saying when it actually decided something.
    const wonOnTieBreaker = Boolean(decided && leaders.length > 1)

    return (
        <div>
            <PageHeader>
                <HeaderTitle>
                    {/* Just "Standings". The heading used to read "2026 Week 3
                        Standings" next to a select reading "Week 3", which said
                        the week twice in one line and rewrote the page's own
                        title on every change -- noise for anything reading the
                        page aloud, and a heading that never held still. */}
                    <h1>Standings</h1>

                    {/* Which makes this the only thing naming the week, and the
                        reason it belongs against the heading rather than on a
                        row of its own. */}
                    <WeekSelectContainer>
                        <Select
                            id='standings_week'
                            name='week'
                            placeholder='Select a week'
                            options={weekOptions}
                            value={selectedWeek}
                            disabled={!weekOptions.length}
                            onChange={({ option }) => setSelectedWeek(option)}
                            labelKey='label'
                            valueKey='value'
                        />
                    </WeekSelectContainer>
                </HeaderTitle>
                {/* Everything about the week that is not the grid, beside the
                    heading rather than stacked under it: what is in the pot,
                    how many are playing for it, and who is ahead.

                    The pot is counted off the entrants rather than the roster
                    -- people sit weeks out, and there is nothing in the pot for
                    a week they didn't play. It is held back until the viewer
                    can see the whole week: before the lock a member is served
                    only their own picks, so counting what they can see would
                    tell everybody the pot was $5, and nothing beats a confident
                    wrong number. */}
                {currentUser.isAdmin || season || showPot || leaders.length ? (
                    <HeaderMeta>
                        {currentUser.isAdmin ? (
                            <PrintLink to='/standings/print'>Print picks sheet</PrintLink>
                        ) : null}

                        {season || showPot || leaders.length ? (
                            <HeaderMetaLine>
                                {/* The season is not a week the select can
                                    reach -- the calendar it is built from is
                                    this season's -- so it is context rather
                                    than a choice, and it reads as context here
                                    beside the week's other fixed facts. */}
                                {season ? `${season} season` : null}

                                {season && (showPot || leaders.length) ? ' \u00b7 ' : null}

                                {showPot ? (
                                    <>
                                        <MetaValue title={`${entrantCount} × $${WeeklyBuyIn} buy-in`}>
                                            {`$${entrantCount * WeeklyBuyIn}`}
                                        </MetaValue>
                                        {` pot \u00b7 ${entrantCount} ${entrantCount === 1 ? 'player' : 'players'}`}
                                    </>
                                ) : null}

                                {showPot && leaders.length ? ' \u00b7 ' : null}

                                {/* Four shapes, narrowing as the week does. A
                                    finished week names its winner -- and says so
                                    when the tie breaker is what made them one;
                                    otherwise one leader is named with their full
                                    record, a small tie is named without one,
                                    since a shared lead is shared on correct picks
                                    only and their other columns can differ, and a
                                    wide tie is a count until asked. */}
                                {decided ? (
                                    <>
                                        {'Winner '}
                                        <MetaValue>{decided.name}</MetaValue>
                                        {' '}
                                        {formatRecord(decided.record)}
                                        {wonOnTieBreaker
                                            ? ` \u00b7 took the tie breaker at ${decided.tieBreakerPoints}`
                                            : null}
                                        <VisuallyHidden>
                                            {` — ${decided.record.correct} correct`}
                                            {wonOnTieBreaker
                                                ? `, closest to the actual ${tieBreakerTotal}`
                                                : ''}
                                        </VisuallyHidden>
                                    </>
                                ) : null}

                                {!decided && leaders.length === 1 ? (
                                    <>
                                        {'Leader '}
                                        <MetaValue>{leaders[0].name}</MetaValue>
                                        {' '}
                                        {formatRecord(leaders[0].record)}
                                        <VisuallyHidden>
                                            {` — ${leaders[0].record.correct} correct`}
                                        </VisuallyHidden>
                                    </>
                                ) : null}

                                {!decided && leaders.length > 1 && leaders.length <= MaxNamedLeaders ? (
                                    <>
                                        <MetaValue>{formatNames(leaders.map((leader) => leader.name))}</MetaValue>
                                        {` tied at ${leaders[0].record.correct} correct`}
                                    </>
                                ) : null}

                                {!decided && leaders.length > MaxNamedLeaders ? (
                                    <LeaderToggle
                                        type='button'
                                        aria-expanded={showLeaders}
                                        aria-controls='standings_leaders'
                                        onClick={() => setShowLeaders((shown) => !shown)}
                                    >
                                        {`${leaders.length} tied at ${leaders[0].record.correct} correct`}
                                        {showLeaders
                                            ? <FormDown size='16px' color='currentColor' />
                                            : <FormNext size='16px' color='currentColor' />}
                                    </LeaderToggle>
                                ) : null}
                            </HeaderMetaLine>
                        ) : null}

                        {/* Rendered only when open rather than hidden with CSS:
                            the toggle is the only thing that can open it, and it
                            isn't rendered below the threshold. */}
                        {!decided && leaders.length > MaxNamedLeaders && showLeaders ? (
                            <LeaderList id='standings_leaders'>
                                {formatNames(leaders.map((leader) => leader.name))}
                            </LeaderList>
                        ) : null}
                    </HeaderMeta>
                ) : null}
            </PageHeader>

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
