import React, { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../resources/firebase.config';
import { CurrentUserContext } from '../../App';
import { CurrentUser } from '../../types';

// Signs out, then waits for the auth state to actually clear before leaving.
// Navigating as soon as signOut() is called races the listener that clears the
// user: the base path would still see someone signed in, forward them into the
// app, and render an empty page before flipping back to the sign-in form.
export const LogOut = () => {
  const { user } = useContext<CurrentUser>(CurrentUserContext);

  useEffect(() => {
    auth.signOut().catch(console.error)
  }, [])

  return user ? <div /> : <Navigate to='/' replace />;
};
