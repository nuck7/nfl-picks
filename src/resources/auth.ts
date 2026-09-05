import { User, verifyBeforeUpdateEmail } from 'firebase/auth';
import { auth } from './firebase.config';

const PasswordProviderId = 'password';

// The providers the sign-in screen offers, named the way a person would.
const ProviderLabels: Record<string, string> = {
  'google.com': 'Google',
  'apple.com': 'Apple',
};

export const getCurrentUser = () => {
  // get the current user from firebase
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  return auth.currentUser;
};

export const isAuthenticated = () => {
  // check if the user is authenticated
  return auth.currentUser ? true : false;
};

// An account can have more than one provider linked. Having a password is what
// makes the email ours to change: an email that came from Google or Apple is
// theirs, and changing it here would only be undone at the next sign-in.
export const hasPasswordSignIn = (user: User | null = auth.currentUser) =>
  !!user?.providerData.some((provider) => provider.providerId === PasswordProviderId);

// What to call the provider the account signed in with, for explaining why the
// email is fixed. Falls back to the raw id for a provider added later.
export const getSocialProviderLabel = (user: User | null = auth.currentUser) => {
  const provider = user?.providerData.find(
    (candidate) => candidate.providerId !== PasswordProviderId
  );

  if (!provider) {
    return undefined;
  }

  return ProviderLabels[provider.providerId] ?? provider.providerId;
};

// Firebase mails a confirmation link to the new address and only moves the
// account once it is opened, so there is nothing to write here: the player
// document picks the new email up from the token at the next sign-in, which is
// also the only email the security rules will accept.
export const requestEmailChange = async (email: string) => {
  const trimmed = email.trim();

  if (!trimmed) {
    throw new Error('An email is required.');
  }

  if (!auth.currentUser) {
    throw new Error('Not signed in.');
  }

  await verifyBeforeUpdateEmail(auth.currentUser, trimmed);
};
