'use client';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, ReactNode } from 'react';
import { isValidToken, jwtDecode, tokenExpired } from '../context/jwt';
import { decode } from 'next-auth/jwt';

interface SessionGuardProps {
  children: ReactNode;
}

interface ExtendedSessionData {
  error?: string;
  // other properties of the session data can be added here if needed
}

export default function SessionGuard({ children }: SessionGuardProps) {
  const { data } = useSession() as any;
  const isValid = isValidToken(data?.accessToken as any);
  console.log(isValid, 'isValid');
  if (!isValid) {
    signIn('keycloak');
  }
  // useEffect(() => {
  //   if ((data as ExtendedSessionData)?.error === 'RefreshAccessTokenError') {
  //   }
  // }, [data]);

  return <>{children}</>;
}
