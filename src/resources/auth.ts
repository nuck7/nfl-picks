import { auth } from './firebase.config';

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
