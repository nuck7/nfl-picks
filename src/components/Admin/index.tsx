import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Button, DataTable, Form, TextInput } from 'grommet';
import { CurrentUserContext, CurrentWeekContext } from '../../App';
import { addManagedPlayer, getPlayers, setPlayerName, setPlayerRole } from '../../resources/players';
import { CurrentUser, CurrentWeek, Player } from '../../types';
import { isAdmin } from '../../utils/admin';
import { InvalidEmailMessage, isValidEmail } from '../../utils/validation';
import { getWeekSettings, setWeekLock } from '../../resources/weeks';
import { getPickDeadline } from '../../utils/picks';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '../../utils/schedule';
import {
    AddPlayerForm,
    ErrorMessage,
    Intro,
    Message,
    NameCell,
    NameInput,
    RoleLabel,
    Hint,
    LockRow,
    Section,
    SeedNote,
    StyledFormField,
} from './index.styles';

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

    const currentWeek = useContext<CurrentWeek>(CurrentWeekContext)
    const [lockValue, setLockValue] = useState('')
    const [savingLock, setSavingLock] = useState(false)

    // The deadline the week would use with no override, shown so an admin can
    // see what they are changing away from.
    const defaultDeadline = getPickDeadline(currentWeek.games)

    useEffect(() => {
        if (!currentWeek.weekId) {
            return
        }
        getWeekSettings(currentWeek.weekId)
            .then((settings) => setLockValue(toDateTimeLocalValue(
                settings?.lockAt || defaultDeadline?.toISOString()
            )))
            .catch(console.error)
    }, [currentWeek.weekId])

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
            setLockValue(toDateTimeLocalValue(defaultDeadline?.toISOString()))
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
            <Intro>
                Players with an account sign in themselves. Managed players have no
                login &mdash; add them here and enter their picks for them from the
                Submit Picks page. Admin access is granted here; the first admin is
                set by hand in the Firebase console.
            </Intro>

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            {notice ? <Message>{notice}</Message> : null}

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
                                        onClick={() => changeRole(player)}
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
        </div>
    )
}

export default Admin
