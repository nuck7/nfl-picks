import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ColumnConfig, DataTable, Select } from 'grommet';
import { Checkmark, Close, FormDown, FormNext } from 'grommet-icons';
import { getPicksForWeek, WeekPicks } from '../../resources/firebase';
import { getPlayers } from '../../resources/players';
import { getWeekPayments, toPaymentsByPlayer } from '../../resources/payments';
import {
    CurrentUser, CurrentWeek, DropdownOption, Game, Outcome, PaymentMethod, Pick,
    PicksForm, Player, StandingsPickCell, StandingsRow, Team, TeamsKeyed, WeekSettings,
} from '../../types';
import { CurrentUserContext, CurrentWeekContext, TeamsContext } from '../../App';
import { PaymentMethodLabels, WeeklyBuyIn } from '../../constants';
import { getMatchupId, getMatchupLabel, getTeamByHomeAway } from '../../utils/teams';
import { canSubmitPicks, findPickForMatchup, hasCompletePicks } from '../../utils/picks';
import { byKickoff } from '../../utils/schedule';
import { getWeekMatchups } from '../../resources/espn';
import { getRulesLockMs, getWeekSettings, weekIsLockedForReads } from '../../resources/weeks';
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
    PrintLink, RecordLabel, RecordValue, TableNote, TableScroll, TieBreakerValue,
    WeekSelectContainer,
} from './index.styles';

type Column = ColumnConfig<StandingsRow>

// One week as this page shows it: its games and the id its picks and payments
// are stored under. Whether the pool's picks may be shown is deliberately NOT
// here -- see canSeeEveryone below, which asks the weeks document rather than
// the schedule, because the weeks document is what the rules will answer from.
type ViewedWeek = {
    week: number
    weekId: string
    games: Game[]
}

// Referentially stable, so a week with no picks yet doesn't hand the memo below
// a fresh array on every render.
const NoPicks: PicksForm[] = []

// Every player column is this wide, explicitly. Letting the content size them
// meant each column was as wide as its own header, so the tile -- centred in
// whatever room the name left -- sat with different padding in every column and
// the gaps between tiles came out uneven (57, 36, 27, 46...). A 64px tile and a
// 76px header both fit inside this less the cell padding, so nothing stretches
// it and the spacing is even by construction.
const PlayerColumnWidth = '92px'

// setTimeout holds its delay in a signed 32-bit int, so anything beyond ~24 days
// overflows and fires immediately. A lock further out than this is slept to in
// stages instead. Same ceiling App uses for the pick deadline.
const MaxTimeoutMs = 2_147_483_647

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
    const [selectedWeek, setSelectedWeek] = useState<DropdownOption>()
    const [otherWeek, setOtherWeek] = useState<ViewedWeek>()
    // Kept with the week it was read for, so the answer to "may this viewer see
    // the pool's picks" is never the previous week's answer.
    const [weekSettings, setWeekSettings] = useState<{ weekId: string; settings?: WeekSettings }>()
    const [weekPicks, setWeekPicks] = useState<WeekPicks & { weekId: string }>()
    // Re-reads the clock when the week's lock time arrives. The standings used
    // to inherit that moment from App, which keeps a timer for the pick form;
    // now that the read lock is answered here, the timer has to be here too, or
    // a tab left open across the deadline keeps showing one column.
    const [lockTick, setLockTick] = useState(0)
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

    // Any other week has to be fetched. Its lock comes from the effect below,
    // which asks the same question for every week rather than only for this one.
    useEffect(() => {
        if (isCurrentWeek || !viewedWeek || !season) {
            return
        }

        let current = true
        const weekId = makeWeekId(season, viewedWeek)

        const load = async () => {
            const games = await getWeekMatchups(season, viewedWeek)

            if (current) {
                setOtherWeek({ week: viewedWeek, weekId, games })
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
        }
        : otherWeek?.week === viewedWeek ? otherWeek : undefined

    const matchups = viewing?.games ?? []
    const weekId = viewing?.weekId ?? ''

    // The lock time the RULES will judge the picks read by. Fetched for every
    // week the page can show, current one included.
    useEffect(() => {
        if (!weekId) {
            return
        }

        let current = true

        getWeekSettings(weekId)
            .catch(() => undefined)
            .then((settings) => {
                if (current) {
                    setWeekSettings({ weekId, settings })
                }
            })

        return () => { current = false }
    }, [weekId])

    const settings = weekSettings?.weekId === weekId ? weekSettings.settings : undefined
    const settingsLoaded = weekSettings?.weekId === weekId

    useEffect(() => {
        const lockMs = getRulesLockMs(settings)
        const remaining = lockMs - Date.now()

        if (!lockMs || remaining <= 0) {
            return
        }

        // Clamped and re-armed from the tick, the way App sleeps to the pick
        // deadline: setTimeout holds its delay in a signed 32-bit int.
        const timer = window.setTimeout(
            () => setLockTick((tick) => tick + 1),
            Math.min(remaining, MaxTimeoutMs)
        )

        return () => window.clearTimeout(timer)
    }, [settings, lockTick])

    // Whether this viewer can see the whole week -- and therefore whether asking
    // for it is a request that can succeed.
    //
    // This used to be answered from the schedule, the same way the pick form
    // decides whether it is still open. The rules do not have the schedule: they
    // read the weeks document and treat one without a lock time as never locked.
    // On a week that was never seeded the two disagreed, the page asked for
    // everyone's picks, the rules refused the whole list, and every member got a
    // grid with no columns in it. So the question is put to the same field the
    // rules will answer from.
    const canSeeEveryone = currentUser.isAdmin || weekIsLockedForReads(settings)

    // What the schedule says, which is what the pick form and the deadline
    // shown to players both go by. Only used to tell a week that is genuinely
    // still open from one whose lock never made it into the database.
    const deadlinePassed = matchups.length > 0
        && !canSubmitPicks(matchups, Date.now(), settings?.lockAt)

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
        // Waiting for the settings rather than guessing at them: asking before
        // they land would run the narrow query, then the broad one a tick later,
        // for every week anyone opens.
        //
        // An admin does not wait, because their answer does not depend on the
        // settings -- the rules let them read the week either way. Making them
        // wait would have put a Firestore read they do not need between the page
        // and its own data, so a weeks document that never arrived would hang
        // the grid for the one person able to fix it.
        if (!weekId || (!currentUser.isAdmin && !settingsLoaded)) {
            return
        }

        let current = true

        const fetchPicks = async () => {
            // Asked as a narrower query before the lock rather than filtered
            // afterwards: the rules refuse a member the whole week until then,
            // so fetching everything would fail outright.
            const picks = await getPicksForWeek(weekId, {
                playerId: currentUser.user?.id,
                canSeeEveryone,
            })

            if (current) {
                setWeekPicks({ ...picks, weekId })
            }
        }

        // Firestore can reject (expired rules, offline). Demo mode should still
        // render, so swallow the failure and leave the real picks empty -- but
        // record that it failed, so the grid below can say so rather than read
        // as though nobody had entered.
        fetchPicks().catch((error) => {
            console.error(error)
            if (current) {
                setWeekPicks({ picks: [], scope: 'mine', denied: true, weekId })
            }
        })

        return () => { current = false }
    }, [weekId, settingsLoaded, canSeeEveryone, currentUser.isAdmin, currentUser.user?.id])

    // Anchored to the week on screen, so switching weeks empties the grid
    // rather than briefly drawing the previous week's columns under the new
    // week's heading.
    const picksForWeek = weekPicks?.weekId === weekId ? weekPicks : undefined
    const userPicks = picksForWeek?.picks ?? NoPicks

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
    // Why there is nothing to show, when there is nothing to show. Only once the
    // week's games and its picks have both landed -- before that an empty grid
    // is just a grid that hasn't loaded.
    // Why the grid is showing less than the whole week -- or nothing at all.
    //
    // Worded for anybody signed in, not for a participant: the standings are
    // readable by everyone with an account, whether or not they are playing, so
    // "your own entry" is the wrong frame for half the people who can open this
    // page. It is the POOL's picks that are or aren't visible.
    //
    // Said even when a column is already showing, since a viewer looking at one
    // column has no way to tell a quiet week from a week they are only seeing
    // part of -- which is the whole failure this page had.
    const emptyReason = !matchups.length || !picksForWeek
        ? undefined
        : picksForWeek.denied
            ? 'This week\u2019s picks could not be read. The week has no lock time recorded, so the pool\u2019s picks stay private \u2014 an admin can fix this by re-seeding the season on the Admin page.'
            : picksForWeek.scope === 'mine' && deadlinePassed
                ? 'This week is past its deadline but has no lock time recorded, so the pool\u2019s picks stay private. An admin can fix this by re-seeding the season on the Admin page.'
                : picksForWeek.scope === 'mine'
                    ? 'The pool\u2019s picks appear once this week\u2019s deadline passes.'
                    : entrantCount > 0
                        ? undefined
                        : 'No completed entries for this week yet.'

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

            {emptyReason ? <TableNote>{emptyReason}</TableNote> : null}
        </div>
    )
}

export default Standings
