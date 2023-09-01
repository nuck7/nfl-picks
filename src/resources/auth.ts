import { useEffect, useState } from 'react';
import { auth } from './firebase.config';
import { onAuthStateChanged } from 'firebase/auth';

export const isAuthenticated = () => {
  // check if the user is authenticated
  return auth.currentUser ? true : false;
};

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<any>();

  // Listen to the Firebase Auth state and set the local state.
  useEffect(() => {
    const unregisterAuthObserver = onAuthStateChanged(auth, (user) => {
      setCurrentUser(!!user);
    });
    return () => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
  }, []);

  return currentUser;
}
