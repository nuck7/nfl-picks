import React, { useState } from 'react';
import { Form, TextInput } from 'grommet';
import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
} from 'firebase/auth';
import { auth } from '../../resources/firebase.config';
import {
    Actions,
    Divider,
    ErrorMessage,
    GoogleButton,
    LoginContainer,
    Notice,
    StyledFormField,
    SubmitButton,
    TextLink,
} from './index.styles';

type Mode = 'signIn' | 'signUp';

// Firebase error codes are not presentable, so the ones a user can actually
// trigger are mapped to plain language.
const ErrorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'That email already has an account. Try signing in instead.',
    'auth/invalid-email': 'That does not look like a valid email address.',
    'auth/weak-password': 'Passwords need to be at least 6 characters.',
    'auth/wrong-password': 'That email and password do not match.',
    'auth/user-not-found': 'No account found for that email.',
    'auth/invalid-credential': 'That email and password do not match.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed.',
    'auth/operation-not-allowed': 'That sign-in method is not enabled for this project yet.',
}

const getErrorMessage = (error: unknown) => {
    const code = (error as { code?: string })?.code
    return (code && ErrorMessages[code]) || 'Something went wrong. Please try again.'
}

const SignInScreen = () => {
    const [mode, setMode] = useState<Mode>('signIn')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string>()
    const [notice, setNotice] = useState<string>()
    const [busy, setBusy] = useState(false)

    const signUpReady = !!name.trim() && !!email.trim() && !!password
    const signInReady = !!email.trim() && !!password
    const ready = mode === 'signUp' ? signUpReady : signInReady

    const run = async (action: () => Promise<void>) => {
        setBusy(true)
        setError(undefined)
        setNotice(undefined)
        try {
            await action()
        } catch (caught) {
            console.error(caught)
            setError(getErrorMessage(caught))
        } finally {
            setBusy(false)
        }
    }

    const submit = () => run(async () => {
        if (mode === 'signIn') {
            await signInWithEmailAndPassword(auth, email.trim(), password)
            return
        }

        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
        // Email/password accounts have no display name of their own. This has to
        // land before the player document is written, or the roster records a
        // nameless player.
        await updateProfile(credential.user, { displayName: name.trim() })
    })

    const signInWithGoogle = () => run(async () => {
        await signInWithPopup(auth, new GoogleAuthProvider())
    })

    const resetPassword = () => run(async () => {
        if (!email.trim()) {
            throw { code: 'auth/invalid-email' }
        }
        await sendPasswordResetEmail(auth, email.trim())
        setNotice(`Password reset email sent to ${email.trim()}.`)
    })

    const changeMode = (next: Mode) => {
        setMode(next)
        setError(undefined)
        setNotice(undefined)
    }

    return (
        <LoginContainer>
            <h1>NFL Picks</h1>

            <GoogleButton
                primary
                size='large'
                disabled={busy}
                onClick={signInWithGoogle}
                label='Continue with Google'
            />

            <Divider>or</Divider>

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            {notice ? <Notice>{notice}</Notice> : null}

            <Form onSubmit={submit}>
                {mode === 'signUp' ? (
                    <StyledFormField name='name' htmlFor='login_name' label='Name'>
                        <TextInput
                            id='login_name'
                            name='name'
                            placeholder='How your name appears in the standings'
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </StyledFormField>
                ) : null}

                <StyledFormField name='email' htmlFor='login_email' label='Email'>
                    <TextInput
                        id='login_email'
                        name='email'
                        type='email'
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </StyledFormField>

                <StyledFormField name='password' htmlFor='login_password' label='Password'>
                    <TextInput
                        id='login_password'
                        name='password'
                        type='password'
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </StyledFormField>

                <SubmitButton
                    primary
                    size='large'
                    type='submit'
                    disabled={busy || !ready}
                    label={mode === 'signUp' ? 'Create account' : 'Sign in'}
                />
            </Form>

            <Actions>
                {mode === 'signIn' ? (
                    <>
                        <TextLink type='button' onClick={() => changeMode('signUp')}>
                            Create an account
                        </TextLink>
                        <TextLink type='button' disabled={busy} onClick={resetPassword}>
                            Forgot password?
                        </TextLink>
                    </>
                ) : (
                    <TextLink type='button' onClick={() => changeMode('signIn')}>
                        Already have an account? Sign in
                    </TextLink>
                )}
            </Actions>
        </LoginContainer>
    )
}

export default SignInScreen
