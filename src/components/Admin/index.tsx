import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button, DataTable, Form, Layer, Select, TextInput } from 'grommet';
import { CurrentUserContext, CurrentWeekContext } from '../../App';
import {
    DuplicateEmailError, addManagedPlayer, getPlayers, setPlayerName, setPlayerRole,
    sortPlayersByName,
} from '../../resources/players';
import { CurrentUser, CurrentWeek, DropdownOption, Game, PaymentMethod, Player, SeedSummary } from '../../types';
import { makeWeekId } from '../../utils/espn';
import { isAdmin, isOwner } from '../../utils/admin';
import { InvalidEmailMessage, isValidEmail } from '../../utils/validation';
import { getSeasonWeeks, getWeekSettings, setWeekLock, setWeekWinner } from '../../resources/weeks';
import { getWeekGames } from '../../resources/cache';
import { fetchSeasonScoreboard, toGamesByWeek } from '../../resources/espn';
import { getPicks } from '../../resources/firebase';
import { countMadePicks, findPickForMatchup, hasCompletePicks } from '../../utils/picks';
import {
    addOutcome, emptyRecord, formatRecord, getLeaders, getPickOutcome,
    getTieBreakerTotal, getWeekWinner, Leader,
} from '../../utils/grading';
import { seedSeason } from '../../resources/cache';
import {
    clearPlayerPayment, getWeekPayments, setPlayerPayment, toPaymentsByPlayer,
} from '../../resources/payments';
import { PaymentMethodOptions } from '../../constants';
import { getPickDeadline } from '../../utils/picks';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '../../utils/schedule';
import {
    AddPlayerForm,
    ConfirmActions,
    ConfirmPanel,
    ConfirmText,
    ConfirmTitle,
    ErrorMessage,
    TabButton,
    TabList,
    TabPanel,
    Intro,
    Message,
    NameCell,
    NameInput,
    PaymentCell,
    PickStatus,
    RoleLabel,
    Hint,
    LockNote,
    LockRow,
    Section,
    SeedNote,
    StyledFormField,
    SuggestionCell,
    WeekSelectContainer,
    WeekSelectLabel,
    WinnerCell,
} from './index.styles';

type AdminTab = 'settings' | 'payments' | 'results' | 'players'

const AdminTabs: { id: AdminTab; label: string }[] = [
    { id: 'settings', label: 'Settings' },
    { id: 'payments', label: 'Payments' },
    { id: 'results', label: 'Results' },
    { id: 'players', label: 'Manage Players' },
]

// What the picks say about a week: who won it, and -- when the week ended level
// at the top -- the combined score of its last game, which is what separated
// them. The total is carried only when it actually settled a tie, so its
// presence is what tells an admin the week came down to the tie breaker rather
// than to correct picks.
type WeekSuggestion = {
    leader: Leader
    tieBreakerTotal?: number
}

// One row of the Results tab: what is stored for the week, and what the picks
// say should be stored. They are kept apart so the table can show an admin that
// their override disagrees with the calculation, rather than quietly hiding it.
type ResultRow = {
    weekId: string
    week: number
    label: string
    winnerPlayerId?: string
    suggestion?: WeekSuggestion
}

// Grades one week from scratch: its games, everyone's picks, and who came out
// on top once a tie is settled on the tie breaker. Only complete entries count,
// which is the same rule the standings use to decide who gets a column.
//
// The games are passed in when the caller already has them -- the season
// scoreboard below carries every week at once -- and looked up per week only as
// the fallback for a week that response had nothing for.
const computeWeekWinner = async (
    season: number,
    week: number,
    weekGames?: Game[]
): Promise<WeekSuggestion | undefined> => {
    const [games, picks] = await Promise.all([
        weekGames?.length ? weekGames : getWeekGames(season, week),
        getPicks(makeWeekId(season, week)),
    ])

    if (!games.length) {
        return undefined
    }

    const entries: Leader[] = picks
        .filter((entry) => hasCompletePicks(entry, games))
        .map((entry) => ({
            userId: entry.user_id,
            name: entry.user_name ?? entry.user_id,
            tieBreakerPoints: entry.tieBreakerPoints,
            record: games.reduce(
                (record, game) => addOutcome(
                    record,
                    getPickOutcome(findPickForMatchup(entry.picks ?? [], game), game)
                ),
                emptyRecord()
            ),
        }))

    const tieBreakerTotal = getTieBreakerTotal(games)
    const leader = getWeekWinner(entries, tieBreakerTotal)

    if (!leader) {
        return undefined
    }

    // More than one leader means the tie breaker is what picked between them,
    // so the total is worth showing beside the name. A week won outright says
    // nothing about it.
    return getLeaders(entries).length > 1
        ? { leader, tieBreakerTotal }
        : { leader }
}

// The two halves of a week's lock time, held together so the field below can
// say which of them it is showing. An absent override is a week running on the
// default, which is not the same as a week with no lock time at all.
type WeekLock = {
    // The admin's saved override, absent until one is set.
    override?: string
    // The seeded default the Firestore rules enforce. Absent for a week the
    // season seed has never run for, which falls back to the deadline derived
    // from the week's kickoffs.
    fallback?: string
}

// Who entered the week the payments table is on. The two halves are held in one
// object so they are always replaced together: a count of 6 shown against the
// PREVIOUS week's 16 games would be a plausible-looking lie, and separate state
// would leave exactly that gap between the two setStates.
type WeekEntries = {
    // Games in the week. 0 while it loads, or if the schedule can't be read --
    // either way there is nothing to measure an entry against.
    games: number
    // Keyed by player id, how many of those games they have picked. A player
    // with no picks document at all is absent rather than 0.
    made: Record<string, number>
}

const tabId = (id: AdminTab) => `admin_tab_${id}`
const panelId = (id: AdminTab) => `admin_panel_${id}`

const Admin = () => {
    const currentUser = useContext<CurrentUser>(CurrentUserContext)
    const [players, setPlayers] = useState<Player[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>()
    const [notice, setNotice] = useState<string>()
    const [saving, setSaving] = useState<string>()

    const [newName, setNewName] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [adding, setAdding] = useState(false)

    const [editingId, setEditingId] = useState<string>()
    const [editingName, setEditingName] = useState('')

    // The player whose access change is waiting to be confirmed. Admin is the
    // one change on this page that hands someone else the ability to make it,
    // so it is the one worth asking about twice.
    const [confirmingRole, setConfirmingRole] = useState<Player>()

    const currentWeek = useContext<CurrentWeek>(CurrentWeekContext)
    const [lockValue, setLockValue] = useState('')
    const [lockSettings, setLockSettings] = useState<WeekLock>({})
    const [savingLock, setSavingLock] = useState(false)

    const [tab, setTab] = useState<AdminTab>('settings')

    const [seeding, setSeeding] = useState(false)
    const [seeded, setSeeded] = useState<SeedSummary>()

    // Keyed by player id. A player with no entry has not paid -- there is no
    // stored "unpaid", so the absence is the state.
    const [payments, setPayments] = useState<Record<string, PaymentMethod>>({})
    const [savingPayment, setSavingPayment] = useState<string>()
    const [loadingPayments, setLoadingPayments] = useState(false)

    const [entries, setEntries] = useState<WeekEntries>({ games: 0, made: {} })
    const [loadingEntries, setLoadingEntries] = useState(false)

    const [resultRows, setResultRows] = useState<ResultRow[]>([])
    const [loadingResults, setLoadingResults] = useState(false)
    const [savingWinner, setSavingWinner] = useState<string>()
    const [paymentWeek, setPaymentWeek] = useState<DropdownOption>()

    const weeks: DropdownOption[] = currentWeek.calendar.weeks.map((entry) => ({
        label: entry.label,
        value: entry.week,
    }))

    // Payments are recorded against whichever week the dropdown is on, which is
    // not necessarily the week the app is on: an admin catching up on week 2
    // during week 4 must not write to week 4.
    const paymentsWeekId = paymentWeek
        ? makeWeekId(currentWeek.season, paymentWeek.value)
        : ''

    // The deadline the week falls back to with no override. The seeded value is
    // preferred over the derived one because it is the copy the Firestore rules
    // actually enforce -- if the two ever disagree, the field should show the
    // one that decides whether picks are open.
    const defaultDeadline = getPickDeadline(currentWeek.games)
    const fallbackLockAt = lockSettings.fallback ?? defaultDeadline?.toISOString()

    // What picks lock at as things stand: the override when one is saved, the
    // default otherwise.
    const lockInEffect = toDateTimeLocalValue(lockSettings.override ?? fallbackLockAt)
    const hasOverride = Boolean(lockSettings.override)
    // Nothing to write when the field already says what the week does. This is
    // what keeps a prefilled default from being saved back as a real override
    // by an admin who opened the tab, looked, and pressed the button.
    const lockUnchanged = lockValue === lockInEffect

    useEffect(() => {
        if (!currentWeek.weekId) {
            return
        }
        // The field shows the time picks actually lock, override or not. It
        // used to be left empty whenever the week had no override, on the
        // reasoning that the field held the override and nothing else -- but an
        // empty box under a heading that says "Locks at" reads as a page that
        // has failed to load, not as "no override set", and it is the one
        // question this tab exists to answer. Which of the two it is showing is
        // now said in words underneath, and Save stays disabled until the value
        // differs from what is already in effect, so a default can no longer be
        // written back as an override by accident.
        //
        // Guarded like every other read on this page. The week rolls over on
        // its own the moment its last game ends, so a page open across that
        // moment fires this twice with two week ids in flight at once, and the
        // OLD week's answer must not land second.
        let current = true

        getWeekSettings(currentWeek.weekId)
            .then((settings) => {
                if (!current) {
                    return
                }
                setLockSettings({
                    override: settings?.lockAt,
                    fallback: settings?.defaultLockAt,
                })
                setLockValue(toDateTimeLocalValue(
                    settings?.lockAt
                    ?? settings?.defaultLockAt
                    ?? getPickDeadline(currentWeek.games)?.toISOString()
                ))
            })
            .catch(console.error)

        return () => { current = false }
        // currentWeek.games is deliberately not a dependency: it is replaced by
        // every score poll, and re-reading the week's settings once a minute to
        // recompute a deadline that only moves when the week does is a Firestore
        // read per tab per minute for nothing. The games are set in the same
        // update as the week id, so they are already this week's here.
    }, [currentWeek.weekId])

    // Open on the current week, since that is the one being collected for.
    useEffect(() => {
        if (currentWeek.loading || paymentWeek) {
            return
        }
        setPaymentWeek(weeks.find((week) => week.value === currentWeek.week) ?? weeks[0])
    }, [currentWeek, paymentWeek, weeks])

    useEffect(() => {
        if (!currentUser.isAdmin || !paymentsWeekId) {
            return
        }

        // A slow request for a week the admin has already moved off must not
        // land on top of the week they are now looking at. Clearing first keeps
        // one week's payments from showing for a moment under another's
        // heading, which would read as somebody having paid when they have not.
        let current = true
        setLoadingPayments(true)
        setPayments({})

        getWeekPayments(paymentsWeekId)
            .then((weekPayments) => {
                if (current) {
                    setPayments(toPaymentsByPlayer(weekPayments))
                }
            })
            .catch(console.error)
            .finally(() => {
                if (current) {
                    setLoadingPayments(false)
                }
            })

        return () => { current = false }
    }, [currentUser.isAdmin, paymentsWeekId])

    // Who actually played the week the table is on. Plenty of people sit weeks
    // out, and there is nothing to collect from them -- so this is the column
    // that says which blanks in the payments beside it are worth chasing.
    //
    // Its own effect rather than folded into the payments read above: a slow
    // picks query must not hold the payment dropdowns disabled, since recording
    // a payment is what this tab is actually for. Gated on the tab for the same
    // reason the Results tab is -- a games read and a picks query is not
    // something to spend on an admin who came here to add a player.
    useEffect(() => {
        if (!currentUser.isAdmin
            || tab !== 'payments'
            || !paymentsWeekId
            || !paymentWeek
            || !currentWeek.season) {
            return
        }

        let current = true
        setLoadingEntries(true)
        setEntries({ games: 0, made: {} })

        Promise.all([
            getWeekGames(currentWeek.season, paymentWeek.value),
            getPicks(paymentsWeekId),
        ])
            .then(([games, weekPicks]) => {
                if (!current) {
                    return
                }

                setEntries({
                    games: games.length,
                    made: Object.fromEntries(weekPicks.map((entry) =>
                        [entry.user_id, countMadePicks(entry, games)])),
                })
            })
            // A week ESPN has no schedule for, or an unseeded one, leaves the
            // column reading "--" rather than claiming nobody played.
            .catch(console.error)
            .finally(() => {
                if (current) {
                    setLoadingEntries(false)
                }
            })

        return () => { current = false }
    }, [currentUser.isAdmin, tab, currentWeek.season, paymentWeek, paymentsWeekId])

    // Only while the tab is actually open. Working out the suggestions costs a
    // games read and a picks query per played week, which is not something to
    // spend on an admin who came here to add a player.
    useEffect(() => {
        if (!currentUser.isAdmin || tab !== 'results' || currentWeek.loading) {
            return
        }

        let current = true
        setLoadingResults(true)

        const load = async () => {
            const played = currentWeek.calendar.weeks
                .filter((entry) => entry.week <= currentWeek.week)
            const stored = await getSeasonWeeks(currentWeek.season)
            const storedByWeekId = new Map(stored.map((week) => [week.weekId, week]))

            // Every played week's live scores, in ONE request: the site API
            // serves a whole date range at once, which is the same call the
            // season seed makes. Grading off the stored copy instead was what
            // broke the suggestions -- the seed is run by hand, so its scores
            // are whatever they were the day it ran. A failure here leaves the
            // per-week lookup in getWeekGames to answer for itself.
            const calendar = currentWeek.calendar
            const liveGamesByWeek: Record<number, Game[]> = calendar.start && calendar.end
                ? await fetchSeasonScoreboard(calendar)
                    .then(toGamesByWeek)
                    .catch(() => ({}))
                : {}

            // In parallel: eighteen sequential round trips would take long
            // enough for the admin to assume the tab was broken.
            const suggestions = await Promise.all(
                played.map((entry) => computeWeekWinner(
                    currentWeek.season,
                    entry.week,
                    liveGamesByWeek[entry.week]
                )
                    // One unreadable week must not blank the whole table -- an
                    // unseeded week refuses a picks read for anyone but an
                    // admin, and this page has other weeks worth showing.
                    .catch(() => undefined))
            )

            if (!current) {
                return
            }

            setResultRows(played.map((entry, index) => {
                const weekId = makeWeekId(currentWeek.season, entry.week)
                return {
                    weekId,
                    week: entry.week,
                    label: entry.label,
                    winnerPlayerId: storedByWeekId.get(weekId)?.winnerPlayerId,
                    suggestion: suggestions[index],
                }
            }))
        }

        load()
            .catch((loadError) => {
                console.error(loadError)
                if (current) {
                    setError('Could not work out the winners. Check that the Firestore rules allow reading the weeks and picks collections.')
                }
            })
            .finally(() => {
                if (current) {
                    setLoadingResults(false)
                }
            })

        return () => { current = false }
    }, [currentUser.isAdmin, tab, currentWeek.loading, currentWeek.season, currentWeek.week, currentWeek.calendar])

    // Nothing is stored until this runs: the suggestion is only ever a prefill
    // in the dropdown, so a week an admin has not looked at stays unrecorded
    // rather than being crowned by the calculation alone.
    const changeWinner = async (row: ResultRow, playerId?: string) => {
        setSavingWinner(row.weekId)
        try {
            await setWeekWinner(row.weekId, playerId ?? '')
            setResultRows((current) => current.map((existing) =>
                existing.weekId === row.weekId
                    ? { ...existing, winnerPlayerId: playerId }
                    : existing
            ))
            setError(undefined)
        } catch (saveError) {
            console.error(saveError)
            setError(`Could not save the winner for ${row.label}. Check that the Firestore rules allow admins to write the weeks collection.`)
        } finally {
            setSavingWinner(undefined)
        }
    }

    const saveLock = async () => {
        // The Save button is disabled in both these cases; a stray Enter in the
        // field submits the form regardless of which button is focused.
        if (!lockValue || lockUnchanged) {
            return
        }

        setSavingLock(true)
        setError(undefined)
        try {
            const lockAt = fromDateTimeLocalValue(lockValue)
            await setWeekLock(currentWeek.weekId, lockAt)
            // Recorded here as well as written, so the note under the field
            // flips to "override" without re-reading the document.
            setLockSettings((settings) => ({ ...settings, override: lockAt }))
            setNotice(`Picks for week ${currentWeek.week} now lock at ${new Date(lockValue).toLocaleString()}.`)
        } catch (saveError) {
            console.error(saveError)
            setError('Could not save the lock time. Check that the Firestore rules allow admins to write the weeks collection.')
        } finally {
            setSavingLock(false)
        }
    }

    const resetLock = async () => {
        setSavingLock(true)
        setError(undefined)
        try {
            await setWeekLock(currentWeek.weekId, '')
            // Back onto the default, which the field then shows -- the week
            // still locks at a time, and this is it.
            setLockSettings((settings) => ({ ...settings, override: undefined }))
            setLockValue(toDateTimeLocalValue(fallbackLockAt))
            setNotice('Lock time reset to the default for this week.')
        } catch (saveError) {
            console.error(saveError)
            setError('Could not reset the lock time.')
        } finally {
            setSavingLock(false)
        }
    }

    const fetchPlayers = useCallback(async () => {
        setLoading(true)
        try {
            setPlayers(await getPlayers())
            setError(undefined)
        } catch (fetchError) {
            console.error(fetchError)
            setError('Could not load players. Check that the Firestore rules allow reading the players collection.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (currentUser.isAdmin) {
            fetchPlayers()
        }
    }, [currentUser.isAdmin, fetchPlayers])

    const newEmailError = newEmail.trim() && !isValidEmail(newEmail)
        ? InvalidEmailMessage
        : undefined

    const addPlayer = async () => {
        setAdding(true)
        try {
            const created = await addManagedPlayer({ name: newName, email: newEmail })
            setPlayers((current) => [...current, created])
            setNewName('')
            setNewEmail('')
            setError(undefined)
        } catch (addError) {
            console.error(addError)
            // A duplicate is the one failure here that is about the data rather
            // than the setup, and it names the player already holding the
            // address -- which is the whole answer, so the rules advice below
            // would only be misleading.
            setError(addError instanceof DuplicateEmailError
                ? addError.message
                : 'Could not add the player. Check that the Firestore rules allow admins to write the players collection.')
        } finally {
            setAdding(false)
        }
    }

    const changeRole = async (player: Player) => {
        // The rules are the real gate; this keeps a non-owner from firing a
        // write that can only come back denied.
        if (!currentUser.isOwner) {
            setError('Only the pool owner can change who is an admin.')
            return
        }
        const nextRole = isAdmin(player) ? 'member' : 'admin'
        setSaving(player.id)
        try {
            await setPlayerRole(player.id, nextRole)
            setPlayers((current) => current.map((existing) =>
                existing.id === player.id ? { ...existing, role: nextRole } : existing
            ))
            setError(undefined)
        } catch (saveError) {
            console.error(saveError)
            setError(`Could not update ${player.name}.`)
        } finally {
            setSaving(undefined)
        }
    }

    // The dialog stays up while the write runs, so a slow save reads as pending
    // rather than as a change that has already landed. changeRole swallows its
    // own errors into the page banner, so this always closes.
    const confirmChangeRole = async () => {
        if (!confirmingRole) {
            return
        }
        await changeRole(confirmingRole)
        setConfirmingRole(undefined)
    }

    const cancelChangeRole = () => {
        if (saving === confirmingRole?.id) {
            return
        }
        setConfirmingRole(undefined)
    }

    // An undefined method clears the payment, which deletes the document rather
    // than storing an "unpaid" nothing else would read.
    const changePayment = async (player: Player, method?: PaymentMethod) => {
        setSavingPayment(player.id)
        try {
            if (method) {
                await setPlayerPayment(paymentsWeekId, player.id, method)
            } else {
                await clearPlayerPayment(paymentsWeekId, player.id)
            }
            setPayments((current) => {
                const next = { ...current }
                if (method) {
                    next[player.id] = method
                } else {
                    delete next[player.id]
                }
                return next
            })
            setError(undefined)
        } catch (saveError) {
            console.error(saveError)
            setError(`Could not save the payment for ${player.name}. Check that the Firestore rules allow admins to write the payments collection.`)
        } finally {
            setSavingPayment(undefined)
        }
    }

    const saveName = async (player: Player) => {
        const trimmed = editingName.trim()

        if (!trimmed || trimmed === player.name) {
            setEditingId(undefined)
            return
        }

        setSaving(player.id)
        try {
            await setPlayerName(player.id, trimmed)
            setPlayers((current) => current.map((existing) =>
                existing.id === player.id ? { ...existing, name: trimmed } : existing
            ))
            setEditingId(undefined)
            setError(undefined)
        } catch (saveError) {
            console.error(saveError)
            setError(`Could not rename ${player.name}.`)
        } finally {
            setSaving(undefined)
        }
    }

    // Copies the season from ESPN into Firestore: the week list, all 32 teams,
    // and one document per week of games. Costs a single ESPN request -- the
    // whole regular season comes back from one date-ranged scoreboard call.
    const seed = async () => {
        setSeeding(true)
        setError(undefined)
        setNotice(undefined)
        setSeeded(undefined)
        try {
            const summary = await seedSeason(currentWeek.calendar)
            setSeeded(summary)
            setNotice(`Stored the ${summary.season} season: ${summary.weeks} weeks, ${summary.games} games, ${summary.teams} teams.`)
        } catch (seedError) {
            console.error(seedError)
            setError('Could not store the season. Check that the Firestore rules allow admins to write the cache collection.')
        } finally {
            setSeeding(false)
        }
    }

    // Counted off the roster rather than off the payments map, so a payment left
    // behind by a deleted player can't push the total past the number of players.
    const paidCount = players.filter((player) => payments[player.id]).length

    // One order for every player list on this page: the Manage Players table,
    // the winner dropdowns, and the base the payments table sorts further.
    // Memoised because all three read it, and because a fresh array on every
    // keystroke in the add-player form would hand the Selects a new `options`
    // prop each time.
    //
    // A rename therefore moves its row to the name's new place once saved, which
    // is the same thing that would happen on the next load.
    const sortedPlayers = useMemo(() => sortPlayersByName(players), [players])

    // Ordered for the job this tab is for. Anyone with an entry this week is
    // someone a payment may be due from, so they come first and the people who
    // sat it out settle to the bottom, out of the way. Partial entries count as
    // having picks: they are the ones most in need of a decision, so burying
    // them with the non-players would be exactly backwards.
    //
    // The grouping is applied over the alphabetical order rather than instead of
    // it, which works because sort is stable -- so names stay in order inside
    // each group. Copied first: sortedPlayers is shared with the dropdowns above
    // and must not be reordered under them.
    //
    // While the picks are still loading nobody has an entry yet. Grouping on
    // that would sort the whole table alphabetically and then visibly reshuffle
    // it a moment later, so it is skipped until there is a real answer.
    const paymentRows = useMemo(() => {
        if (loadingEntries || !entries.games) {
            return sortedPlayers
        }

        const hasPicks = (player: Player) => (entries.made[player.id] ?? 0) > 0

        return [...sortedPlayers].sort((a, b) => Number(hasPicks(b)) - Number(hasPicks(a)))
    }, [sortedPlayers, entries, loadingEntries])

    // The Accept button is only offered on a row where it would change
    // something, so once every week agrees with its suggestion the last column
    // renders null the whole way down -- and an empty column with an empty
    // header still draws its borders and claims its width, which reads as a
    // stray fourth column. Leave it out entirely unless a row can use it.
    const hasSuggestionToApply = resultRows.some((row) =>
        row.suggestion && row.suggestion.leader.userId !== row.winnerPlayerId)

    // Complete entries only, which is the same bar the standings use to decide
    // who gets a column -- so this number and the one on the standings agree.
    const playedCount = entries.games > 0
        ? players.filter((player) => entries.made[player.id] === entries.games).length
        : 0

    const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0

        if (!step) {
            return
        }

        event.preventDefault()
        const current = AdminTabs.findIndex((entry) => entry.id === tab)
        const next = AdminTabs[(current + step + AdminTabs.length) % AdminTabs.length]

        setTab(next.id)
        document.getElementById(tabId(next.id))?.focus()
    }

    if (currentUser.loading) {
        return <Message>Checking access&hellip;</Message>
    }

    if (!currentUser.isAdmin) {
        return (
            <div>
                <h1>Admin</h1>
                <Message>You do not have access to this page.</Message>
            </div>
        )
    }

    return (
        <div>
            <h1>Admin</h1>

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            {notice ? <Message>{notice}</Message> : null}

            <TabList role='tablist' aria-label='Admin sections'>
                {AdminTabs.map((entry) => (
                    <TabButton
                        key={entry.id}
                        id={tabId(entry.id)}
                        type='button'
                        role='tab'
                        aria-selected={tab === entry.id}
                        aria-controls={panelId(entry.id)}
                        // Only the selected tab is in the tab order; the arrow
                        // keys move between them once you are inside the list.
                        tabIndex={tab === entry.id ? 0 : -1}
                        $active={tab === entry.id}
                        onClick={() => setTab(entry.id)}
                        onKeyDown={onTabKeyDown}
                    >
                        {entry.label}
                    </TabButton>
                ))}
            </TabList>

            <TabPanel
                role='tabpanel'
                id={panelId('settings')}
                aria-labelledby={tabId('settings')}
                hidden={tab !== 'settings'}
            >
                <Section>
                    <h2>Picks lock time</h2>
                    <Hint>
                        {currentWeek.loading
                            ? 'Loading this week\u2026'
                            : `Week ${currentWeek.week} of the ${currentWeek.season} season. Picks lock at the time below; by default that is noon on the day of the week's first game.`}
                    </Hint>
                    <Form onSubmit={saveLock}>
                        <LockRow>
                            <StyledFormField name='lockAt' htmlFor='week_lock' label='Locks at'>
                                <TextInput
                                    id='week_lock'
                                    name='lockAt'
                                    type='datetime-local'
                                    value={lockValue}
                                    onChange={(event) => setLockValue(event.target.value)}
                                />
                            </StyledFormField>
                            <Button
                                primary
                                type='submit'
                                label='Save lock time'
                                // Unchanged is disabled as well as empty: with
                                // the default prefilled, an admin who opens the
                                // tab and presses Save would otherwise pin the
                                // week to a copy of it as a real override.
                                disabled={savingLock || !lockValue || lockUnchanged || !currentWeek.weekId}
                            />
                            <Button
                                secondary
                                type='button'
                                label='Reset to default'
                                // Nothing to reset on a week that never had an
                                // override, and nothing to reset TO on a week
                                // with no schedule behind it.
                                disabled={savingLock || !hasOverride || !currentWeek.weekId}
                                onClick={resetLock}
                            />
                        </LockRow>
                        {/* Which of the two the field is showing. The old
                            version said this by leaving the box empty, which
                            read as a page that had not loaded. */}
                        {!currentWeek.loading ? (
                            <LockNote>
                                {!lockInEffect
                                    ? 'No games stored for this week yet, so there is no default to fall back on. Set a time here, or run Store season data below.'
                                    : hasOverride
                                        ? `Saved for this week. ${fallbackLockAt
                                            ? `Reset to default puts it back to ${new Date(fallbackLockAt).toLocaleString()}.`
                                            : 'There is no stored default to reset to.'}`
                                        : 'The default for this week. Change it and save to override it.'}
                            </LockNote>
                        ) : null}
                    </Form>
                </Section>

                <Section>
                    <h2>Season data</h2>
                    <Hint>
                        {currentWeek.loading
                            ? 'Loading the season\u2026'
                            : `Stores the ${currentWeek.season} season in Firestore \u2014 the week list, all 32 teams, and every week's games with their scores. Run it once a season, and again whenever the schedule changes or you want the latest results.`}
                    </Hint>
                    <Button
                        primary
                        type='button'
                        label={seeding ? 'Storing\u2026' : 'Store season data'}
                        disabled={seeding || currentWeek.loading || !currentWeek.calendar.weeks.length}
                        onClick={seed}
                    />
                    {seeded ? (
                        <SeedNote>
                            {`${seeded.weeks} weeks, ${seeded.games} games, ${seeded.teams} teams.`}
                        </SeedNote>
                    ) : null}
                </Section>
            </TabPanel>

            <TabPanel
                role='tabpanel'
                id={panelId('payments')}
                aria-labelledby={tabId('payments')}
                hidden={tab !== 'payments'}
            >
                <Section>
                    <h2>Payments</h2>
                    <Hint>
                        {currentWeek.loading
                            ? 'Loading this week…'
                            : `Who has paid in for the ${currentWeek.season} season, and how. Leave a player blank until they pay — clearing a method marks them unpaid again. Picks shows who actually entered the week: nobody owes for a week they sat out.`}
                    </Hint>
                    <WeekSelectContainer>
                        <WeekSelectLabel htmlFor='payment_week'>Week</WeekSelectLabel>
                        <Select
                            id='payment_week'
                            name='paymentWeek'
                            placeholder='Select a week'
                            options={weeks}
                            value={paymentWeek}
                            disabled={!weeks.length}
                            onChange={({ option }) => setPaymentWeek(option)}
                            labelKey='label'
                            valueKey='value'
                        />
                    </WeekSelectContainer>
                    {loading ? (
                        <Message>Loading players&hellip;</Message>
                    ) : players.length ? (
                        <DataTable
                            border={true}
                            data={paymentRows}
                            primaryKey='id'
                            columns={[
                                {
                                    property: 'name',
                                    header: 'Player',
                                    footer: (
                                        <SeedNote>
                                            {/* "0 of 12 paid" while the week is
                                                still loading would read as a
                                                fact rather than a gap. */}
                                            {loadingPayments
                                                ? 'Loading…'
                                                : `${paidCount} of ${players.length} paid`}
                                        </SeedNote>
                                    ),
                                },
                                {
                                    // Not a field on Player -- grommet only uses
                                    // this as the column's key, and nothing on
                                    // this table sorts.
                                    property: 'picks',
                                    header: 'Picks',
                                    render: (player: Player) => {
                                        const made = entries.made[player.id]

                                        // Nothing to measure against yet. An em
                                        // dash, not "No picks": we don't know.
                                        if (loadingEntries || !entries.games) {
                                            return <SeedNote>{loadingEntries ? 'Loading…' : '—'}</SeedNote>
                                        }

                                        if (made === undefined || made === 0) {
                                            return <PickStatus $state='none'>Sat out</PickStatus>
                                        }

                                        if (made < entries.games) {
                                            return (
                                                <PickStatus
                                                    $state='partial'
                                                    title={`Started but did not finish — ${entries.games - made} game${entries.games - made === 1 ? '' : 's'} left blank.`}
                                                >
                                                    {`${made} of ${entries.games}`}
                                                </PickStatus>
                                            )
                                        }

                                        return <PickStatus $state='complete'>Played</PickStatus>
                                    },
                                    footer: (
                                        <SeedNote>
                                            {/* Three states, not two: a week
                                                whose schedule never arrives is
                                                unknown, and would otherwise sit
                                                on "Loading…" for good. */}
                                            {loadingEntries
                                                ? 'Loading…'
                                                : entries.games
                                                    ? `${playedCount} of ${players.length} played`
                                                    : '—'}
                                        </SeedNote>
                                    ),
                                },
                                {
                                    property: 'id',
                                    header: 'Paid with',
                                    render: (player: Player) => (
                                        <PaymentCell>
                                            <Select
                                                id={`payment_${player.id}`}
                                                name={`payment_${player.id}`}
                                                a11yTitle={`Payment method for ${player.name}`}
                                                options={PaymentMethodOptions}
                                                labelKey='label'
                                                valueKey={{ key: 'value', reduce: true }}
                                                value={payments[player.id] ?? ''}
                                                placeholder='Unpaid'
                                                clear={{ label: 'Mark unpaid' }}
                                                // Disabled while the week's
                                                // payments load, so a change
                                                // can't be made against values
                                                // that are about to be replaced.
                                                disabled={savingPayment === player.id
                                                    || loadingPayments
                                                    || !paymentsWeekId}
                                                onChange={({ value }) => changePayment(
                                                    player,
                                                    (value as PaymentMethod) || undefined
                                                )}
                                            />
                                        </PaymentCell>
                                    ),
                                },
                            ]}
                        />
                    ) : null}
                </Section>
            </TabPanel>

            <TabPanel
                role='tabpanel'
                id={panelId('results')}
                aria-labelledby={tabId('results')}
                hidden={tab !== 'results'}
            >
                <Section>
                    <h2>Week winners</h2>
                    <Hint>
                        Most correct picks takes the week, and a tie goes to whoever
                        came closest on the tie breaker. Suggested is what the picks
                        say &mdash; nothing is recorded until you choose it here, and
                        you can name someone else instead.
                    </Hint>
                    {loadingResults ? (
                        <Message>Working out the winners&hellip;</Message>
                    ) : resultRows.length ? (
                        <DataTable
                            border={true}
                            data={resultRows}
                            primaryKey='weekId'
                            columns={[
                                { property: 'label', header: 'Week' },
                                {
                                    property: 'winnerPlayerId',
                                    header: 'Winner',
                                    render: (row: ResultRow) => (
                                        <WinnerCell>
                                            <Select
                                                id={`winner_${row.weekId}`}
                                                name={`winner_${row.weekId}`}
                                                a11yTitle={`Winner of ${row.label}`}
                                                options={sortedPlayers}
                                                labelKey='name'
                                                valueKey={{ key: 'id', reduce: true }}
                                                value={row.winnerPlayerId ?? ''}
                                                placeholder='Not recorded'
                                                clear={{ label: 'Clear winner' }}
                                                disabled={savingWinner === row.weekId}
                                                onChange={({ value }) => changeWinner(
                                                    row,
                                                    (value as string) || undefined
                                                )}
                                            />
                                        </WinnerCell>
                                    ),
                                },
                                {
                                    property: 'suggestion',
                                    header: 'Suggested',
                                    render: (row: ResultRow) => {
                                        if (!row.suggestion) {
                                            // A week can genuinely have no
                                            // suggestion: still being played, or
                                            // a tie the tie breaker couldn't
                                            // separate. Neither is an error.
                                            return <SeedNote>&mdash;</SeedNote>
                                        }
                                        const { leader, tieBreakerTotal } = row.suggestion
                                        return (
                                            <SuggestionCell>
                                                <SeedNote>
                                                    {`${leader.name} (${formatRecord(leader.record)})`}
                                                </SeedNote>
                                                {/* Only on a week that ended
                                                    level at the top, where this
                                                    is the whole reason one name
                                                    is here and not another. */}
                                                {tieBreakerTotal !== undefined ? (
                                                    <SeedNote>
                                                        {`Tie breaker: guessed ${leader.tieBreakerPoints}, actual ${tieBreakerTotal}`}
                                                    </SeedNote>
                                                ) : null}
                                            </SuggestionCell>
                                        )
                                    },
                                },
                                // Spread rather than a ternary inside the
                                // array: a false/null entry is still a column
                                // as far as grommet is concerned.
                                ...(hasSuggestionToApply ? [{
                                    property: 'week',
                                    header: '',
                                    render: (row: ResultRow) => {
                                        // Only offered when it would change
                                        // something, so a row that already
                                        // agrees carries no pointless button.
                                        if (!row.suggestion
                                            || row.suggestion.leader.userId === row.winnerPlayerId) {
                                            return null
                                        }
                                        return (
                                            <Button
                                                secondary
                                                type='button'
                                                label={row.winnerPlayerId ? 'Use suggested' : 'Accept'}
                                                disabled={savingWinner === row.weekId}
                                                onClick={() => changeWinner(row, row.suggestion?.leader.userId)}
                                            />
                                        )
                                    },
                                }] : []),
                            ]}
                        />
                    ) : (
                        <Message>
                            No weeks have been played yet this season.
                        </Message>
                    )}
                </Section>
            </TabPanel>

            <TabPanel
                role='tabpanel'
                id={panelId('players')}
                aria-labelledby={tabId('players')}
                hidden={tab !== 'players'}
            >
                <Intro>
                    Players with an account sign in themselves. Managed players have no
                    login &mdash; add them here and enter their picks for them from the
                    Submit Picks page.
                </Intro>

                <Section>
                    <h2>Add a player</h2>
                    <Form onSubmit={addPlayer}>
                        <AddPlayerForm>
                            <StyledFormField name='playerName' htmlFor='player_name' label='Name'>
                                <TextInput
                                    id='player_name'
                                    name='playerName'
                                    placeholder='Required'
                                    value={newName}
                                    onChange={(event) => setNewName(event.target.value)}
                                />
                            </StyledFormField>
                            <StyledFormField
                                name='playerEmail'
                                htmlFor='player_email'
                                label='Email'
                                error={newEmailError}
                            >
                                <TextInput
                                    id='player_email'
                                    name='playerEmail'
                                    placeholder='Required'
                                    value={newEmail}
                                    onChange={(event) => setNewEmail(event.target.value)}
                                />
                            </StyledFormField>
                            <Button
                                primary
                                type='submit'
                                label='Add player'
                                disabled={adding || !newName.trim() || !isValidEmail(newEmail)}
                            />
                        </AddPlayerForm>
                    </Form>
                </Section>

                {loading ? (
                    <Message>Loading players&hellip;</Message>
                ) : players.length ? (
                    <DataTable
                        border={true}
                        data={sortedPlayers}
                        primaryKey='id'
                        columns={[
                            {
                                property: 'name',
                                header: 'Name',
                                render: (player: Player) => (
                                    editingId === player.id ? (
                                        <NameCell>
                                            <NameInput
                                                value={editingName}
                                                autoFocus
                                                onChange={(event) => setEditingName(event.target.value)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') saveName(player)
                                                    if (event.key === 'Escape') setEditingId(undefined)
                                                }}
                                            />
                                            <Button
                                                secondary
                                                label='Save'
                                                disabled={saving === player.id || !editingName.trim()}
                                                onClick={() => saveName(player)}
                                            />
                                        </NameCell>
                                    ) : (
                                        <NameCell>
                                            {player.name}
                                            <Button
                                                plain
                                                label={<SeedNote>Rename</SeedNote>}
                                                onClick={() => {
                                                    setEditingId(player.id)
                                                    setEditingName(player.name)
                                                }}
                                            />
                                        </NameCell>
                                    )
                                ),
                            },
                            { property: 'email', header: 'Email' },
                            {
                                property: 'managed',
                                header: 'Type',
                                render: (player: Player) => (
                                    <RoleLabel>{player.managed ? 'Managed' : 'Account'}</RoleLabel>
                                ),
                            },
                            {
                                property: 'role',
                                header: 'Role',
                                render: (player: Player) => (
                                    <RoleLabel>
                                        {isOwner(player) ? 'Owner' : isAdmin(player) ? 'Admin' : 'Member'}
                                    </RoleLabel>
                                ),
                            },
                            // Only the owner hands out admin, so for every other
                            // admin the column isn't there to be disabled -- the
                            // hint below the table says who to ask instead. The
                            // rules refuse the write either way; this is so the
                            // page doesn't offer a button that always fails.
                            ...(currentUser.isOwner ? [{
                                property: 'id',
                                header: 'Access',
                                render: (player: Player) => {
                                    // The owner's own row is locked: there is no
                                    // hardcoded account to fall back on, so the one
                                    // person who can grant admin must not be able to
                                    // give away that power by accident.
                                    if (player.id === currentUser.user?.id) {
                                        return <SeedNote>You</SeedNote>
                                    }
                                    return (
                                        <Button
                                            secondary
                                            disabled={saving === player.id}
                                            onClick={() => setConfirmingRole(player)}
                                            label={isAdmin(player) ? 'Revoke admin' : 'Make admin'}
                                        />
                                    )
                                },
                            }] : []),
                        ]}
                    />
                ) : (
                    <Message>
                        No players yet. A record is created the first time someone signs in.
                    </Message>
                )}

                {!currentUser.isOwner && players.length ? (
                    <Hint>
                        Admin access is granted and revoked by the pool owner only. Ask
                        them if someone needs it.
                    </Hint>
                ) : null}
            </TabPanel>

            {confirmingRole ? (
                <Layer
                    modal
                    responsive={false}
                    animation='fadeIn'
                    onEsc={cancelChangeRole}
                    onClickOutside={cancelChangeRole}
                    aria-labelledby='confirm_role_title'
                >
                    <ConfirmPanel>
                        <ConfirmTitle id='confirm_role_title'>
                            {isAdmin(confirmingRole)
                                ? `Revoke admin from ${confirmingRole.name}?`
                                : `Make ${confirmingRole.name} an admin?`}
                        </ConfirmTitle>
                        <ConfirmText>
                            {isAdmin(confirmingRole)
                                ? `${confirmingRole.name} will go back to being a member: no admin page, no entering other people's picks, and no changing the lock time or payments. Their own picks are untouched.`
                                : `${confirmingRole.name} will be able to add and rename players, enter anyone's picks, change the lock time and record payments. They will not be able to make anyone else an admin, or undo it if you revoke this later — that stays with you.`}
                        </ConfirmText>
                        <ConfirmActions>
                            <Button
                                secondary
                                type='button'
                                label='Cancel'
                                disabled={saving === confirmingRole.id}
                                onClick={cancelChangeRole}
                            />
                            <Button
                                primary
                                type='button'
                                disabled={saving === confirmingRole.id}
                                onClick={confirmChangeRole}
                                label={saving === confirmingRole.id
                                    ? 'Saving…'
                                    : isAdmin(confirmingRole) ? 'Revoke admin' : 'Make admin'}
                            />
                        </ConfirmActions>
                    </ConfirmPanel>
                </Layer>
            ) : null}
        </div>
    )
}

export default Admin
