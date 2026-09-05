import React, { useContext, useEffect, useState } from 'react';
import { Button, Form, TextInput } from 'grommet';
import { CurrentUserContext } from '../../App';
import { setOwnName } from '../../resources/players';
import { getSocialProviderLabel, hasPasswordSignIn, requestEmailChange } from '../../resources/auth';
import { CurrentUser } from '../../types';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { InvalidEmailMessage, isValidEmail } from '../../utils/validation';
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
    StyledFormField,
} from './index.styles';

// Lets anyone change the name they appear under, including people who signed in
// with Google/Facebook/X and don't want the name their provider supplied. The
// email is only theirs to change when they have a password: a social account's
// email belongs to the provider.
const Profile = () => {
    const currentUser = useContext<CurrentUser>(CurrentUserContext)
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
            <Intro>
                This is the name shown on the standings and next to your picks.
                Changing it here overrides the name your sign-in provider gave you.
            </Intro>

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            {notice ? <Notice>{notice}</Notice> : null}

            <Section>
                <Form onSubmit={saveName}>
                    <StyledFormField name='displayName' htmlFor='profile_name' label='Display name'>
                        <TextInput
                            id='profile_name'
                            name='displayName'
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </StyledFormField>
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
                        <StyledFormField
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
                        </StyledFormField>
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

            <Detail>
                <DetailLabel>Role</DetailLabel>
                <span>{currentUser.isAdmin ? 'Admin' : 'Member'}</span>
            </Detail>
        </ProfileContainer>
    )
}

export default Profile
