import React, { useState } from 'react';
import { Form, TextInput } from 'grommet';
import { FormView, FormViewHide } from 'grommet-icons';
import {
    AuthProvider,
    GoogleAuthProvider,
    OAuthProvider,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
} from 'firebase/auth';
import { auth } from '../../resources/firebase.config';
import { setOwnName } from '../../resources/players';
import { InvalidEmailMessage, isValidEmail } from '../../utils/validation';
import {
    Actions,
    PasswordField,
    PasswordToggle,
    Divider,
    ErrorMessage,
    SocialButton,
    LoginContainer,
    Notice,
    SocialButtons,
    StyledFormField,
    SubmitButton,
    TextLink,
} from './index.styles';
import { AppleIcon, GoogleIcon } from './icons';
import { getAuthErrorMessage } from '../../utils/authErrors';

type Mode = 'signIn' | 'signUp';

// Each must also be enabled in the Firebase console under Authentication ->
// Sign-in method; a provider listed here but not enabled there fails with
// auth/operation-not-allowed, which is reported below. Apple has no dedicated
// provider class -- it goes through the generic OAuth provider.
type SocialProvider = {
    id: string;
    label: string;
    dark?: boolean;
    icon: () => JSX.Element;
    create: () => AuthProvider;
};

const SocialProviders: SocialProvider[] = [
    {
        id: 'google',
        label: 'Continue with Google',
        icon: GoogleIcon,
        create: () => new GoogleAuthProvider(),
    },
    {
        id: 'apple',
        label: 'Continue with Apple',
        dark: true,
        icon: AppleIcon,
        create: () => {
            const provider = new OAuthProvider('apple.com');
            // Apple only returns these on the very first authorisation.
            provider.addScope('email');
            provider.addScope('name');
            return provider;
        },
    },
];

const SignInScreen = () => {
    const [mode, setMode] = useState<Mode>('signIn')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string>()
    const [notice, setNotice] = useState<string>()
    const [busy, setBusy] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Only enforced when creating an account. Sign-in is left to Firebase: a
    // stricter pattern here could lock out someone whose existing address the
    // regex disagrees with.
    const emailError = mode === 'signUp' && !!email.trim() && !isValidEmail(email)
        ? InvalidEmailMessage
        : undefined

    const signUpReady = !!name.trim() && isValidEmail(email) && !!password
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
            setError(getAuthErrorMessage(caught))
        } finally {
            setBusy(false)
        }
    }

    const submit = () => run(async () => {
        if (mode === 'signIn') {
            await signInWithEmailAndPassword(auth, email.trim(), password)
            return
        }

        await createUserWithEmailAndPassword(auth, email.trim(), password)
        // Sets the auth display name AND writes the player record with that name.
        // The auth listener has already fired by now and written the fallback, so
        // this has to overwrite it rather than merely fill a gap.
        await setOwnName(name.trim())
    })

    const signInWithProvider = (provider: AuthProvider) => run(async () => {
        await signInWithPopup(auth, provider)
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
        setShowPassword(false)
        setError(undefined)
        setNotice(undefined)
    }

    return (
        <LoginContainer>
            <h1>NFL Picks</h1>

            <SocialButtons>
                {SocialProviders.map((provider) => (
                    <SocialButton
                        key={provider.id}
                        type='button'
                        $dark={provider.dark}
                        disabled={busy}
                        onClick={() => signInWithProvider(provider.create())}
                    >
                        <provider.icon />
                        {provider.label}
                    </SocialButton>
                ))}
            </SocialButtons>

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

                <StyledFormField name='email' htmlFor='login_email' label='Email' error={emailError}>
                    <TextInput
                        id='login_email'
                        name='email'
                        type='email'
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </StyledFormField>

                <StyledFormField name='password' htmlFor='login_password' label='Password'>
                    <PasswordField>
                        <TextInput
                            id='login_password'
                            name='password'
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                        <PasswordToggle
                            type='button'
                            // type='button' matters: inside a Form, a bare button
                            // submits, so toggling would attempt a sign-in.
                            onClick={() => setShowPassword((shown) => !shown)}
                            title={showPassword ? 'Hide password' : 'Show password'}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? <FormViewHide /> : <FormView />}
                        </PasswordToggle>
                    </PasswordField>
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
