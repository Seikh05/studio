
'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import { UserDataTable } from '@/components/users/users-data-table';
import { usersColumns } from '@/components/users/users-columns';
import { initialUsers } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { UserForm } from '@/components/users/user-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const USER_STORAGE_KEY = 'user-data';
const LOGGED_IN_USER_KEY = 'logged-in-user';

export default function UsersPage() {
    const { toast } = useToast();
    const [isClient, setIsClient] = React.useState(false);
    const [data, setData] = React.useState<User[]>([]);
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
    
    const [isDenyDialogOpen, setIsDenyDialogOpen] = React.useState(false);
    const [userToDeny, setUserToDeny] = React.useState<User | null>(null);

    const loadData = React.useCallback(() => {
        try {
            const storedUsers = window.localStorage.getItem(USER_STORAGE_KEY);
            if (storedUsers) {
                setData(JSON.parse(storedUsers));
            } else {
                setData(initialUsers);
                window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(initialUsers));
            }
            
            const storedCurrentUser = window.localStorage.getItem(LOGGED_IN_USER_KEY);
            if (storedCurrentUser) {
                setCurrentUser(JSON.parse(storedCurrentUser));
            }

        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not load user data." });
        }
    }, [toast]);
    
    React.useEffect(() => {
        setIsClient(true);
        loadData();
    }, [loadData]);
    
    // Custom event listener for when user data is updated elsewhere
    React.useEffect(() => {
        const handleUsersUpdated = () => loadData();
        window.addEventListener('users-updated', handleUsersUpdated);
        return () => window.removeEventListener('users-updated', handleUsersUpdated);
    }, [loadData]);

    const openForm = (user: User | null) => {
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    const openDeleteDialog = (user: User) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    }
    
    const openDenyDialog = (user: User) => {
        setUserToDeny(user);
        setIsDenyDialogOpen(true);
    }

    const handleSaveUser = (userData: Omit<User, 'id' | 'lastLogin' | 'status' | 'avatarUrl'>) => {
        try {
            let updatedUsers;
            if (selectedUser) {
                // Editing existing user
                updatedUsers = data.map(u => 
                    u.id === selectedUser.id ? { ...u, ...userData, password: userData.password || u.password } : u
                );
                toast({ title: "User Updated", description: "User details have been saved." });
            } else {
                // Adding new user
                const newUser: User = {
                    ...userData,
                    id: `USR-${Date.now()}`,
                    status: userData.role === 'New User' ? 'Inactive' : 'Active',
                    lastLogin: new Date().toISOString(),
                    avatarUrl: 'https://placehold.co/40x40.png',
                };
                updatedUsers = [...data, newUser];
                toast({ title: "User Added", description: "The new user has been created." });
            }
            setData(updatedUsers);
            window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUsers));
            window.dispatchEvent(new Event('users-updated'));
            setIsFormOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error("Failed to save user:", error);
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not save user data." });
        }
    };
    
    const handleDeleteOrDenyUser = (user: User) => {
        try {
            const updatedUsers = data.filter(u => u.id !== user.id);
            setData(updatedUsers);
            window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUsers));
            window.dispatchEvent(new Event('users-updated'));

            if(isDeleteDialogOpen) toast({ title: "User Removed", description: `${user.name} has been removed from the system.` });
            if(isDenyDialogOpen) toast({ title: "User Denied", description: `The registration for ${user.name} has been denied.` });
            
        } catch (error) {
            console.error("Failed to delete user:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not remove user." });
        } finally {
            setIsDeleteDialogOpen(false);
            setUserToDelete(null);
            setIsDenyDialogOpen(false);
            setUserToDeny(null);
        }
    }
    
    const handleApproveUser = (user: User) => {
         try {
            const updatedUsers = data.map(u => 
                u.id === user.id ? { ...u, role: 'General Member', status: 'Active' } : u
            );
            setData(updatedUsers);
            window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUsers));
            window.dispatchEvent(new Event('users-updated'));
            toast({ title: "User Approved", description: `${user.name} is now a General Member.` });
        } catch (error) {
            console.error("Failed to approve user:", error);
            toast({ variant: 'destructive', title: "Approval Failed", description: "Could not approve user." });
        }
    }


    if (!isClient) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
  return (
    <>
        <UserForm 
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            user={selectedUser}
            onSave={handleSaveUser}
            currentUser={currentUser}
        />
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove <strong>{userToDelete?.name}</strong> from the system. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => userToDelete && handleDeleteOrDenyUser(userToDelete)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Confirm Removal
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDenyDialogOpen} onOpenChange={setIsDenyDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Deny Registration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently deny and remove the registration request for <strong>{userToDeny?.name}</strong>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => userToDeny && handleDeleteOrDenyUser(userToDeny)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Confirm Denial
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <UserDataTable 
            columns={usersColumns} 
            data={data}
            onDataChange={loadData}
            currentUser={currentUser}
            onOpenForm={openForm}
            onOpenDeleteDialog={openDeleteDialog}
            onApproveUser={handleApproveUser}
            onOpenDenyDialog={openDenyDialog}
        />
    </>
  );
}
