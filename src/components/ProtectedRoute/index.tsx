import Login from '../Login';
import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { CurrentUserContext } from '../../App';
import { CurrentUser } from '../../types';

export const ProtectedRoute = () => {
  const { user, loading } = useContext<CurrentUser>(CurrentUserContext);

  if (loading) {
    return <></>;
  }

  return user ? <Outlet /> : <Login />;
};
