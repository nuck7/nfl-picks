import Login from '../Login';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../resources/auth';

export const ProtectedRoute = () => {
  const user = useAuth();

  console.log('/////user autheticated', user);

  return typeof user === 'undefined' ? (
    <></>
  ) : user ? (
    <Outlet />
  ) : (
    <Login />
  );
};
