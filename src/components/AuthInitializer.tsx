import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return <>{children}</>;
};