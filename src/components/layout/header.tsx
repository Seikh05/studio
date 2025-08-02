
'use client'

import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, LifeBuoy, LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import type { User as UserType } from '@/lib/types';

const pathToTitle: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory Management',
  '/users': 'User Management',
  '/logs': 'Inventory Log',
  '/profile': 'My Profile'
};

const LOGGED_IN_USER_KEY = 'logged-in-user';
const ALL_USERS_KEY = 'user-data';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const title = pathToTitle[pathname] || 'Dashboard';
  const [user, setUser] = React.useState<UserType | null>(null);

  React.useEffect(() => {
    const handleStorageChange = () => {
        try {
          const storedUserSession = window.localStorage.getItem(LOGGED_IN_USER_KEY);
          if (storedUserSession) {
            const session = JSON.parse(storedUserSession);
            // Now, get the full user profile from the master list
            const allUsersData = window.localStorage.getItem(ALL_USERS_KEY);
            if (allUsersData) {
              const allUsers: UserType[] = JSON.parse(allUsersData);
              const fullUser = allUsers.find(u => u.id === session.id);
              setUser(fullUser || session);
            } else {
              setUser(session);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to retrieve user from storage", error);
        }
    };
    
    handleStorageChange(); // Initial load
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(LOGGED_IN_USER_KEY);
    } catch (error) {
      console.error("Failed to clear user session", error);
    }
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      <h1 className="text-xl font-semibold hidden md:block">{title}</h1>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Toggle notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatarUrl} alt={user?.name || ''} data-ai-hint="person avatar" />
                <AvatarFallback>{user ? getInitials(user.name) : 'AU'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'Admin User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'admin@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
