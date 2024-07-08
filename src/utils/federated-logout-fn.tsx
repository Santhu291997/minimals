// src/utils/federatedLogout.ts
import { signOut } from 'next-auth/react';
import { STORAGE_KEY } from 'src/auth/context/jwt';

interface LogoutResponse {
  url: string;
  error?: string;
}

export default async function federatedLogout(): Promise<void> {
  try {
    const response = await fetch('/api/auth/federated-logout');
    const data: LogoutResponse = await response.json();

    if (response.ok) {
      await signOut({ redirect: false });
      sessionStorage.removeItem(STORAGE_KEY);
      window.location.href = data.url;
      return;
    }

    throw new Error(data.error);
  } catch (error) {
    console.log(error);
    alert((error as Error).message);
    await signOut({ redirect: false });
    window.location.href = '/';
  }
}
