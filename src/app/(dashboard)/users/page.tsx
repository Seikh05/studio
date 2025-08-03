
'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import { UserDataTable } from '@/components/users/users-data-table';
import { usersColumns } from '@/components/users/users-columns';
import { LoaderCircle } from 'lucide-react';

const STORAGE_KEY = 'user-data';
const LOGGED_IN_USER_KEY = 'logged-in-user';

const initialUsers: User[] = [
    {
      id: 'USR-001',
      name: 'Alice Johnson',
      email: 'superadmin@example.com',
      role: 'Super Admin',
      status: 'Active',
      lastLogin: '2024-07-28T10:00:00Z',
      avatarUrl: 'https://placehold.co/40x40.png',
      phone: '9876543210',
      regdNum: '21050001',
    },
    {
      id: 'USR-002',
      name: 'Bob Williams',
      email: 'admin@example.com',
      role: 'Admin',
      status: 'Active',
      lastLogin: '2024-07-27T15:30:00Z',
      avatarUrl: 'https://placehold.co/40x40.png',
      phone: '9876543211',
      regdNum: '21050002',
    },
    {
      id: 'USR-003',
      name: 'Charlie Brown',
      email: 'charlie.b@example.com',
      role: 'Admin',
      status: 'Inactive',
      lastLogin: '2024-06-01T12:00:00Z',
      avatarUrl: 'https://placehold.co/40x40.png',
    },
     {
      id: 'USR-004',
      name: 'Diana Prince',
      email: 'diana.p@example.com',
      role: 'Admin',
      status: 'Active',
      lastLogin: '2024-07-29T08:00:00Z',
      avatarUrl: 'https://placehold.co/40x40.png',
      regdNum: '21050003',
    },
    {
      id: 'USR-005',
      name: 'Seikh Mustakim',
      email: 'seikhsouvagyamustakim@gmail.com',
      role: 'Super Admin',
      status: 'Active',
      lastLogin: new Date().toISOString(),
      avatarUrl: 'https://placehold.co/40x40.png',
      phone: '1234567890'
    },
    {
      id: 'USR-SA-001',
      name: 'Super Admin',
      email: 'superadmin@robo.com',
      password: 'superadmin@1234',
      role: 'Super Admin',
      status: 'Active',
      lastLogin: new Date().toISOString(),
      avatarUrl: 'https://placehold.co/40x40.png',
      phone: '0000000000'
    },
];

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
