
'use client';

import * as React from 'react';
import { redirect } from 'next/navigation';
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

export default function LoginPage() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (isClient) {
      try {
        // We always want to ensure the super admin is logged in when hitting this page.
        // This effectively makes the login page a redirect machine.
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
      } catch (error) {
        console.error("Failed during auto-login setup on login page.", error);
        // If something goes wrong, we can't show a login form, so we just show an error.
        // In a real app, we might redirect to an error page.
      }
    }
  }, [isClient]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
