

'use client'

import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, LifeBuoy, LogOut, Settings, User, Inbox, Check, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { User as UserType, Notification } from '@/lib/types';
import { Badge } from '../ui/badge';
import { formatRelative } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const pathToTitle: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory Management',
  '/users': 'User Management',
  '/logs': 'Inventory Log',
  '/profile': 'My Profile'
};

const LOGGED_IN_USER_KEY = 'logged-in-user';
const ALL_USERS_KEY = 'user-data';
const NOTIFICATIONS_STORAGE_KEY = 'notifications-data';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const title = pathToTitle[pathname] || 'Dashboard';
  const [user, setUser] = React.useState<UserType | null>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleStorageChange = React.useCallback(() => {
    // User data
    try {
      const storedUserSession = window.localStorage.getItem(LOGGED_IN_USER_KEY);
      if (storedUserSession) {
        const session = JSON.parse(storedUserSession);
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
    
    // Notifications data
    try {
      const storedNotifications = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) {
        const parsedNotifications: Notification[] = JSON.parse(storedNotifications);
        parsedNotifications.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(parsedNotifications);
      }
    } catch (error) {
        console.error("Failed to retrieve notifications from storage", error);
    }
  }, []);

  React.useEffect(() => {
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    }
  }, [handleStorageChange]);

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(LOGGED_IN_USER_KEY);
    } catch (error) {
      console.error("Failed to clear user session", error);
    }
    router.push('/login');
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    const updatedNotifications = notifications.map(n => 
      n.id === notification.id ? { ...n, isRead: true } : n
    );
    setNotifications(updatedNotifications);
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    
    // Navigate
    router.push(`/inventory/${notification.itemId}`);
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updatedNotifications);
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
  };


  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const canSeeNotifications = user && user.role !== 'General Member';
  const canSeeProfile = user && user.role !== 'General Member';


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      <h1 className="text-xl font-semibold hidden md:block">{title}</h1>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={handleRefresh}>
                        <RefreshCw className="h-5 w-5" />
                        <span className="sr-only">Refresh Data</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Pull Latest Changes</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
        
        {canSeeNotifications && (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 md:w-96" align="end">
                <DropdownMenuLabel>
                    <div className="flex items-center justify-between">
                        <p>Notifications</p>
                        {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} unread</p>}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <ScrollArea className="h-64">
                    {notifications.length > 0 ? (
                        notifications.map(notification => (
                            <DropdownMenuItem key={notification.id} onSelect={() => handleNotificationClick(notification)} className="flex items-start gap-3 p-3 cursor-pointer">
                                <div className={`mt-1 h-2 w-2 rounded-full ${notification.isRead ? 'bg-transparent' : 'bg-primary'}`} />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatRelative(new Date(notification.createdAt), new Date())}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-center p-8 text-muted-foreground">
                           <Inbox className="h-8 w-8" />
                           <p className="font-medium">All caught up!</p>
                           <p className="text-xs">You have no new notifications.</p>
                        </div>
                    )}
                    </ScrollArea>
                </DropdownMenuGroup>
                {unreadCount > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleMarkAllAsRead} className="flex items-center justify-center cursor-pointer text-sm font-medium text-primary hover:text-primary focus:text-primary focus:bg-primary/10">
                        <Check className="mr-2 h-4 w-4" />
                        <span>Mark all as read</span>
                    </DropdownMenuItem>
                  </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
        )}

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
            {canSeeProfile && (
            <DropdownMenuItem asChild>
                <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </Link>
            </DropdownMenuItem>
            )}
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
