import React, { useContext, useEffect, useState } from 'react';
import { Button, Form, FormField, TextInput } from 'grommet';
import { CurrentUserContext, CurrentWeekContext } from '../../App';
import { setOwnName } from '../../resources/players';
import { getSocialProviderLabel, hasPasswordSignIn, requestEmailChange } from '../../resources/auth';
import { getPlayerPayments } from '../../resources/payments';
import { getSeasonWeeks } from '../../resources/weeks';
import { CurrentUser, CurrentWeek, WeekPayment, WeekSettings } from '../../types';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { parseWeekId } from '../../utils/espn';
import { InvalidEmailMessage, isValidEmail } from '../../utils/validation';
import { PaymentMethodLabels } from '../../constants';
import {
    Detail,
    DetailLabel,
    ErrorMessage,
    FieldHint,
    Intro,
    Message,
    Notice,
    ProfileContainer,
    Section,
    TabButton,
    TabList,
    TabPanel,
    WinCount,
    WinRow,
    WinWeek,
} from './index.styles';

type ProfileTab = 'info' | 'payments' | 'results'

const ProfileTabs: { id: ProfileTab; label: string }[] = [
    { id: 'info', label: 'Info' },
    { id: 'payments', label: 'Payments' },
    { id: 'results', label: 'Results' },
]

const tabId = (id: ProfileTab) => `profile_tab_${id}`
const panelId = (id: ProfileTab) => `profile_panel_${id}`

// Lets anyone change the name they appear under, including people who signed in
// with Google/Facebook/X and don't want the name their provider supplied. The
// email is only theirs to change when they have a password: a social account's
// email belongs to the provider.
const Profile = () => {
    const currentUser = useContext<CurrentUser>(CurrentUserContext)
    const currentWeek = useContext<CurrentWeek>(CurrentWeekContext)
    const [payments, setPayments] = useState<WeekPayment[]>([])
    const [seasonWeeks, setSeasonWeeks] = useState<WeekSettings[]>([])
    const [loadingResults, setLoadingResults] = useState(true)
    const [tab, setTab] = useState<ProfileTab>('info')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [savingName, setSavingName] = useState(false)
    const [savingEmail, setSavingEmail] = useState(false)
    const [error, setError] = useState<string>()
    const [notice, setNotice] = useState<string>()

    useEffect(() => {
        if (currentUser.user) {
            setName(currentUser.user.name)
            setEmail(currentUser.user.email)
        }
    }, [currentUser.user])

    useEffect(() => {
        const playerId = currentUser.user?.id

        if (!playerId) {
            return
        }
        // Only your own -- the rules refuse anything wider, and this page is the
        // only place a member sees payment data at all.
        getPlayerPayments(playerId).then(setPayments).catch(console.error)
    }, [currentUser.user?.id])

    // The winners an admin has confirmed. Cheap enough to read on mount rather
    // than on tab open -- one query over a collection of about eighteen small
    // documents, against the per-week picks-and-results grind the admin page
    // does to work them out in the first place.
    useEffect(() => {
        if (!currentWeek.season) {
            return
        }

        let current = true
        setLoadingResults(true)

        getSeasonWeeks(currentWeek.season)
            .then((weeks) => {
                if (current) {
                    setSeasonWeeks(weeks)
                }
            })
            .catch(console.error)
            .finally(() => {
                if (current) {
                    setLoadingResults(false)
                }
            })

        return () => { current = false }
    }, [currentWeek.season])

    // Weeks this player was recorded as winning, newest first. Nothing is
    // inferred here: a week counts only once an admin has confirmed it on the
    // Results tab, so an ungraded or unconfirmed week is simply absent.
    const weeksWon = seasonWeeks
        .filter((week) => week.winnerPlayerId
            && week.winnerPlayerId === currentUser.user?.id)
        .map((week) => ({ week, number: parseWeekId(week.weekId)?.week ?? 0 }))
        .sort((a, b) => b.number - a.number)

    // This season only, newest week first: an old season's rows would just push
    // the current one out of sight.
    const seasonPayments = payments
        .map((payment) => ({ payment, week: parseWeekId(payment.weekId) }))
        .filter((entry) => entry.week?.season === currentWeek.season)
        .sort((a, b) => (b.week?.week ?? 0) - (a.week?.week ?? 0))

    const saveName = async () => {
        const trimmed = name.trim()

        if (!trimmed) {
            return
        }

        setSavingName(true)
        setError(undefined)
        setNotice(undefined)
        try {
            await setOwnName(trimmed)
            await currentUser.refresh()
            setNotice('Name updated.')
        } catch (saveError) {
            console.error(saveError)
            setError('Could not update your name. Please try again.')
        } finally {
            setSavingName(false)
        }
    }

    const saveEmail = async () => {
        const trimmed = email.trim()

        if (!trimmed) {
            return
        }

        setSavingEmail(true)
        setError(undefined)
        setNotice(undefined)
        try {
            await requestEmailChange(trimmed)
            setNotice(`Confirmation link sent to ${trimmed}. Your email changes once you open it and sign in again.`)
        } catch (saveError) {
            console.error(saveError)
            setError(getAuthErrorMessage(saveError, 'Could not update your email. Please try again.'))
        } finally {
            setSavingEmail(false)
        }
    }

    if (currentUser.loading) {
        return <Message>Loading&hellip;</Message>
    }

    if (!currentUser.user) {
        return (
            <div>
                <h1>Profile</h1>
                <Message>You are not signed in.</Message>
            </div>
        )
    }

    const emailError = email.trim() && !isValidEmail(email) ? InvalidEmailMessage : undefined
    const nameUnchanged = name.trim() === currentUser.user.name
    const emailUnchanged = email.trim() === currentUser.user.email
    const canChangeEmail = hasPasswordSignIn()
    const socialProvider = getSocialProviderLabel()

    return (
        <ProfileContainer>
            <h1>Profile</h1>

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            {notice ? <Notice>{notice}</Notice> : null}

            <TabList role='tablist' aria-label='Profile sections'>
                {ProfileTabs.map((entry) => (
                    <TabButton
                        key={entry.id}
                        type='button'
                        role='tab'
                        id={tabId(entry.id)}
                        aria-controls={panelId(entry.id)}
                        aria-selected={tab === entry.id}
                        $active={tab === entry.id}
                        onClick={() => setTab(entry.id)}
                    >
                        {entry.label}
                    </TabButton>
                ))}
            </TabList>

            <TabPanel
                role='tabpanel'
                id={panelId('info')}
                aria-labelledby={tabId('info')}
                hidden={tab !== 'info'}
            >
            <Intro>
                This is the name shown on the standings and next to your picks.
                Changing it here overrides the name your sign-in provider gave you.
            </Intro>

            <Section>
                <Form onSubmit={saveName}>
                    <FormField name='displayName' htmlFor='profile_name' label='Display name'>
                        <TextInput
                            id='profile_name'
                            name='displayName'
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </FormField>
                    <Button
                        primary
                        type='submit'
                        label='Save name'
                        disabled={savingName || !name.trim() || nameUnchanged}
                    />
                </Form>
            </Section>

            <Section>
                {canChangeEmail ? (
                    <Form onSubmit={saveEmail}>
                        <FormField
                            name='email'
                            htmlFor='profile_email'
                            label='Email'
                            error={emailError}
                        >
                            <TextInput
                                id='profile_email'
                                name='email'
                                type='email'
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                        </FormField>
                        <FieldHint>
                            This is the email you sign in with. Changing it sends a confirmation
                            link to the new address, and it only takes effect once you open it.
                        </FieldHint>
                        <Button
                            primary
                            type='submit'
                            label='Change email'
                            disabled={savingEmail || !isValidEmail(email) || emailUnchanged}
                        />
                    </Form>
                ) : (
                    <>
                        <Detail>
                            <DetailLabel>Email</DetailLabel>
                            <span>{currentUser.user.email || 'None'}</span>
                        </Detail>
                        <FieldHint>
                            {socialProvider
                                ? `You sign in with ${socialProvider}, so your email is managed there and cannot be changed here.`
                                : 'Your email is managed by your sign-in provider and cannot be changed here.'}
                        </FieldHint>
                    </>
                )}
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
                <FieldHint>
                    {`What you have paid in so far this ${currentWeek.season} season. An admin records these — if a week looks wrong, tell them.`}
                </FieldHint>
                {seasonPayments.length ? (
                    seasonPayments.map(({ payment, week }) => (
                        <Detail key={payment.weekId}>
                            <DetailLabel>{`Week ${week?.week}`}</DetailLabel>
                            <span>{PaymentMethodLabels[payment.method]}</span>
                        </Detail>
                    ))
                ) : (
                    <Message>Nothing recorded yet.</Message>
                )}
            </Section>
            </TabPanel>

            <TabPanel
                role='tabpanel'
                id={panelId('results')}
                aria-labelledby={tabId('results')}
                hidden={tab !== 'results'}
            >
                <Section>
                    <h2>Weeks won</h2>
                    <FieldHint>
                        {`Weeks you took in the ${currentWeek.season} season — most correct picks, with a tie going to the closest tie breaker. An admin confirms each week's winner, so a week that has just finished may not be here yet.`}
                    </FieldHint>
                    {loadingResults ? (
                        <Message>Loading&hellip;</Message>
                    ) : weeksWon.length ? (
                        <>
                            <WinCount>
                                {weeksWon.length === 1 ? '1 week won' : `${weeksWon.length} weeks won`}
                            </WinCount>
                            {weeksWon.map(({ week, number }) => (
                                <WinRow key={week.weekId}>
                                    <WinWeek>{`Week ${number}`}</WinWeek>
                                </WinRow>
                            ))}
                        </>
                    ) : (
                        <Message>No weeks won yet this season.</Message>
                    )}
                </Section>
            </TabPanel>
        </ProfileContainer>
    )
}

export default Profile
