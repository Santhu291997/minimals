'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { setSession } from 'src/auth/context/jwt';
import { signIn as signInKeyCloak } from 'next-auth/react';

export default function Page() {
  const { data, status } = useSession() as any;
  const { push } = useRouter();
  if (status === 'loading') {
    return <></>;
  }
  console.log(data?.accessToken, 'data?.accessToken');
  if (data?.accessToken) {
    setSession(data?.accessToken);
    return push('/dashboard');
  }

  signInKeyCloak('keycloak');
  return null;
}
