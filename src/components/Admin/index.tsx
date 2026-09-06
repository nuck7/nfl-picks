import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Button, DataTable, Form, Layer, Select, TextInput } from 'grommet';
import { CurrentUserContext, CurrentWeekContext } from '../../App';
import { addManagedPlayer, getPlayers, setPlayerName, setPlayerRole } from '../../resources/players';
import { CurrentUser, CurrentWeek, DropdownOption, PaymentMethod, Player, SeedSummary } from '../../types';
import { makeWeekId } from '../../utils/espn';
import { isAdmin } from '../../utils/admin';
import { InvalidEmailMessage, isValidEmail } from '../../utils/validation';
import { getSeasonWeeks, getWeekSettings, setWeekLock, setWeekWinner } from '../../resources/weeks';
import { getWeekGames } from '../../resources/cache';
import { getPicks } from '../../resources/firebase';
import { findPickForMatchup, hasCompletePicks } from '../../utils/picks';
import {
    addOutcome, emptyRecord, formatRecord, getPickOutcome, getTieBreakerTotal,
    getWeekWinner, Leader,
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
    RoleLabel,
    Hint,
    LockRow,
    Section,
    SeedNote,
    StyledFormField,
    WeekSelectContainer,
    WeekSelectLabel,
} from './index.styles';

type AdminTab = 'settings' | 'payments' | 'results' | 'players'

const AdminTabs: { id: AdminTab; label: string }[] = [
    { id: 'settings', label: 'Settings' },
    { id: 'payments', label: 'Payments' },
    { id: 'results', label: 'Results' },
    { id: 'players', label: 'Manage Players' },
]

// One row of the Results tab: what is stored for the week, and what the picks
// say should be stored. They are kept apart so the table can show an admin that
// their override disagrees with the calculation, rather than quietly hiding it.
type ResultRow = {
    weekId: string
    week: number
    label: string
    winnerPlayerId?: string
    suggestion?: Leader
}

// Grades one week from scratch: its games, everyone's picks, and who came out
// on top once a tie is settled on the tie breaker. Only complete entries count,
// which is the same rule the standings use to decide who gets a column.
const computeWeekWinner = async (
    season: number,
    week: number
): Promise<Leader | undefined> => {
    const [games, picks] = await Promise.all([
        getWeekGames(season, week),
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

    return getWeekWinner(entries, getTieBreakerTotal(games))
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
    const [savingLock, setSavingLock] = useState(false)

    const [tab, setTab] = useState<AdminTab>('settings')

    const [seeding, setSeeding] = useState(false)
    const [seeded, setSeeded] = useState<SeedSummary>()

    // Keyed by player id. A player with no entry has not paid -- there is no
    // stored "unpaid", so the absence is the state.
    const [payments, setPayments] = useState<Record<string, PaymentMethod>>({})
    const [savingPayment, setSavingPayment] = useState<string>()
    const [loadingPayments, setLoadingPayments] = useState(false)

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

    // The deadline the week would use with no override, shown so an admin can
    // see what they are changing away from.
    const defaultDeadline = getPickDeadline(currentWeek.games)

    useEffect(() => {
        if (!currentWeek.weekId) {
            return
        }
        // Empty when the week has no stored override, rather than pre-filled
        // with the derived default: the field holds the override and nothing
        // else, so anything in it is a value an admin actually saved. Filling
        // it with the default made an unset week look set, and made "Save"
        // write a copy of the default as a real override. The Hint above still
        // says what the default is.
        getWeekSettings(currentWeek.weekId)
            .then((settings) => setLockValue(toDateTimeLocalValue(settings?.lockAt)))
            .catch(console.error)
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

            // In parallel: eighteen sequential round trips would take long
            // enough for the admin to assume the tab was broken.
            const suggestions = await Promise.all(
                played.map((entry) => computeWeekWinner(currentWeek.season, entry.week)
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
    }, [currentUser.isAdmin, tab, currentWeek.loading, currentWeek.season, currentWeek.week, currentWeek.calendar.weeks])

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
        setSavingLock(true)
        setError(undefined)
        try {
            await setWeekLock(currentWeek.weekId, fromDateTimeLocalValue(lockValue))
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
            // Clearing the override empties the field, for the same reason the
            // load leaves it empty -- the week is back on the default.
            setLockValue('')
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
            setError('Could not add the player. Check that the Firestore rules allow admins to write the players collection.')
        } finally {
            setAdding(false)
        }
    }

    const changeRole = async (player: Player) => {
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
                            : `Week ${currentWeek.week} of the ${currentWeek.season} season. `}
                        {!currentWeek.loading && defaultDeadline
                            ? `By default picks lock at ${defaultDeadline.toLocaleString()}, noon on the day of the first game.`
                            : null}
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
                                disabled={savingLock || !lockValue || !currentWeek.weekId}
                            />
                            <Button
                                secondary
                                type='button'
                                label='Reset to default'
                                disabled={savingLock || !currentWeek.weekId}
                                onClick={resetLock}
                            />
                        </LockRow>
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
                            : `Who has paid in for the ${currentWeek.season} season, and how. Leave a player blank until they pay — clearing a method marks them unpaid again.`}
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
                            data={players}
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
                                        <PaymentCell>
                                            <Select
                                                id={`winner_${row.weekId}`}
                                                name={`winner_${row.weekId}`}
                                                a11yTitle={`Winner of ${row.label}`}
                                                options={players}
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
                                        </PaymentCell>
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
                                        return (
                                            <SeedNote>
                                                {`${row.suggestion.name} (${formatRecord(row.suggestion.record)})`}
                                            </SeedNote>
                                        )
                                    },
                                },
                                {
                                    property: 'week',
                                    header: '',
                                    render: (row: ResultRow) => {
                                        // Only offered when it would change
                                        // something, so a row that already
                                        // agrees carries no pointless button.
                                        if (!row.suggestion
                                            || row.suggestion.userId === row.winnerPlayerId) {
                                            return null
                                        }
                                        return (
                                            <Button
                                                secondary
                                                type='button'
                                                label={row.winnerPlayerId ? 'Use suggested' : 'Accept'}
                                                disabled={savingWinner === row.weekId}
                                                onClick={() => changeWinner(row, row.suggestion?.userId)}
                                            />
                                        )
                                    },
                                },
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
                        data={players}
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
                                    <RoleLabel>{isAdmin(player) ? 'Admin' : 'Member'}</RoleLabel>
                                ),
                            },
                            {
                                property: 'id',
                                header: 'Access',
                                render: (player: Player) => {
                                    // Your own row is locked, so an admin can never
                                    // revoke themselves. That is what guarantees at
                                    // least one admin always remains -- there is no
                                    // hardcoded account to fall back on any more.
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
                            },
                        ]}
                    />
                ) : (
                    <Message>
                        No players yet. A record is created the first time someone signs in.
                    </Message>
                )}
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
                                : `${confirmingRole.name} will be able to add and rename players, enter anyone's picks, change the lock time, record payments — and make other people admins, including back to themselves if you revoke this later.`}
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
