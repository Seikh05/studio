
'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import { UserDataTable } from '@/components/users/users-data-table';
import { usersColumns } from '@/components/users/users-columns';
import { initialUsers } from '@/lib/types';

export default function UsersPage() {
  const [data, setData] = React.useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    // Set a default user as we are no longer logging in
    const superAdmin = initialUsers.find(u => u.role === 'Super Admin');
    setCurrentUser(superAdmin || initialUsers[0]);
  }, []);

  return <UserDataTable columns={usersColumns} data={data} onDataChange={() => {}} currentUser={currentUser} />;
}
