
'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import { initialUsers } from '@/lib/types';
import { UserDataTable } from '@/components/users/users-data-table';
import { usersColumns } from '@/components/users/users-columns';
import { LoaderCircle } from 'lucide-react';

const STORAGE_KEY = 'user-data';
const LOGGED_IN_USER_KEY = 'logged-in-user';


export default function UsersPage() {
  const [data, setData] = React.useState<User[]>([]);
  const [isClient, setIsClient] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const loadData = React.useCallback(() => {
    try {
      const storedData = window.localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setData(JSON.parse(storedData));
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialUsers));
        setData(initialUsers);
      }
    } catch (error) {
      console.error("Failed to access localStorage", error);
      setData(initialUsers);
    }
  }, []);

  React.useEffect(() => {
    setIsClient(true);
    loadData();
    try {
        const storedUser = window.localStorage.getItem(LOGGED_IN_USER_KEY);
        if(storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Failed to get current user from localStorage", error);
    }
  }, [loadData]);
  
  if (!isClient) {
    return (
        <div className="flex items-center justify-center h-full">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return <UserDataTable columns={usersColumns} data={data} onDataChange={loadData} currentUser={currentUser} />;
}
