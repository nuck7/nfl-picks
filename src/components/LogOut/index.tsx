import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../resources/firebase.config';

export const LogOut = () => {
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
