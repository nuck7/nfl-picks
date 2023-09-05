import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../resources/auth';
import { auth } from '../../resources/firebase.config';

export const LogOut = () => {
  const user = useAuth();
  const Navigate = useNavigate()

  useEffect(() => {
    const logout = async () => {
      auth.signOut()
      Navigate('/')
    }
    logout()
  }, [])

  return <div></div>
};
