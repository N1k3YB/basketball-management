'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

type SessionProviderProps = {
  children: React.ReactNode;
  session: any;
};

export default function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
} 