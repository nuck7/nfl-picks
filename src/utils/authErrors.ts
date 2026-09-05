// Firebase error codes are not presentable, so the ones a user can actually
// trigger are mapped to plain language. Shared by the sign-in screen and the
// profile page.
const AuthErrorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'That email already has an account. Try signing in instead.',
  'auth/invalid-email': 'That does not look like a valid email address.',
  'auth/weak-password': 'Passwords need to be at least 6 characters.',
  'auth/wrong-password': 'That email and password do not match.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/invalid-credential': 'That email and password do not match.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/popup-closed-by-user': 'The sign-in window was closed.',
  'auth/operation-not-allowed': 'That sign-in method is not enabled for this project yet.',
  'auth/account-exists-with-different-credential':
    'You already have an account with that email using a different sign-in method. Use that one instead.',
  'auth/cancelled-popup-request': 'The sign-in window was closed.',
  // Changing an email is a sensitive operation, so firebase rejects it unless
  // the sign-in is recent.
  'auth/requires-recent-login': 'For security, sign out and sign back in before changing your email.',
};

export const getAuthErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
) => {
  const code = (error as { code?: string })?.code;
  return (code && AuthErrorMessages[code]) || fallback;
};
