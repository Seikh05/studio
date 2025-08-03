
'use client';

import { redirect } from 'next/navigation';
import * as React from 'react';
import type { User } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';

const LOGGED_IN_USER_KEY = 'logged-in-user';
const USER_STORAGE_KEY = 'user-data';

const superAdminUser: User = {
  id: 'USR-SA-001',
  name: 'Super Admin',
  email: 'superadmin@robo.com',
  password: 'superadmin@1234',
  role: 'Super Admin',
  status: 'Active',
  lastLogin: new Date().toISOString(),
  avatarUrl: 'https://placehold.co/40x40.png',
  phone: '0000000000',
  regdNum: ''
};

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
            // No user is logged in, so we create the Super Admin session.
            window.localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(superAdminUser));

            // Also add the super admin to the main user list if not present
            const allUsersRaw = window.localStorage.getItem(USER_STORAGE_KEY);
            let allUsers: User[] = allUsersRaw ? JSON.parse(allUsersRaw) : [];
            const superAdminExists = allUsers.some(u => u.id === superAdminUser.id);
            if (!superAdminExists) {
                allUsers.push(superAdminUser);
                window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(allUsers));
            }
            
            // Dispatch storage event to notify other components of the new user data
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('users-updated'));
            
            // Redirect to dashboard
            redirect('/dashboard');
        }
      } catch (error) {
        console.error("Failed during auto-login setup, redirecting to login", error);
        // Fallback to login page in case of any error
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
