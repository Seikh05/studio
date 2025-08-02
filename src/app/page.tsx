
'use client';

import { redirect } from 'next/navigation';
import * as React from 'react';
import type { User } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';

const LOGGED_IN_USER_KEY = 'logged-in-user';

export default function Home() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (isClient) {
      try {
        const storedUser = window.localStorage.getItem(LOGGED_IN_USER_KEY);
        if (storedUser) {
          const user: User = JSON.parse(storedUser);
          if (user.role === 'General Member') {
            redirect('/inventory');
          } else {
            redirect('/dashboard');
          }
        } else {
          redirect('/login');
        }
      } catch (error) {
        console.error("Failed to parse user data, redirecting to login", error);
        redirect('/login');
      }
    }
  }, [isClient]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
