import type { User } from '@/lib/types';
import { UserDataTable } from '@/components/users/users-data-table';
import { usersColumns } from '@/components/users/users-columns';

async function getUsersData(): Promise<User[]> {
  // In a real app, you'd fetch this from Firestore
  return [
    {
      id: 'USR-001',
      name: 'Alice Johnson',
      email: 'superadmin@example.com',
      role: 'Super Admin',
      status: 'Active',
      lastLogin: '2024-07-28T10:00:00Z',
      avatarUrl: 'https://placehold.co/40x40.png',
    },
    {
      id: 'USR-002',
      name: 'Bob Williams',
      email: 'admin@example.com',
      role: 'Admin',
      status: 'Active',
      lastLogin: '2024-07-27T15:30:00Z',
      avatarUrl: 'https://placehold.co/40x40.png',
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
    },
  ];
}

export default async function UsersPage() {
  const data = await getUsersData();
  return <UserDataTable columns={usersColumns} data={data} />;
}
