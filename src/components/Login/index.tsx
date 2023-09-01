// Import FirebaseAuth and firebase.
import React, { useEffect, useState } from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { auth } from '../../resources/firebase.config';
import { GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider } from 'firebase/auth';

// Configure FirebaseUI.
const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: 'popup',
  // Auth providers to display in the sign-in widget.
  signInOptions: [
    GoogleAuthProvider.PROVIDER_ID,
    FacebookAuthProvider.PROVIDER_ID,
    TwitterAuthProvider.PROVIDER_ID,
  ],
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false,
  },
};

function SignInScreen() {
  const [isSignedIn, setIsSignedIn] = useState(false); // Local signed-in state.

  // Listen to the Firebase Auth state and set the local state.
  useEffect(() => {
    const unregisterAuthObserver = auth.onAuthStateChanged(user => {
      setIsSignedIn(!!user);
    });
    return () => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
  }, []);

  if (!isSignedIn) {
    return (
      <div>
        <h1>NFL Picks</h1>
        <p>Please log in:</p>
        <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
      </div>
    );
  }
  return (
    <div>
      <h1>NFL Picks</h1>
      <p>Welcome {auth.currentUser?.displayName}! You are now logged in!</p>
      <a onClick={() => auth.signOut()}>Log out</a>
    </div>
  );
}

export default SignInScreen;
