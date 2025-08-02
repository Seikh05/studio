
'use client';

import Link from 'next/link';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Package, Users, ScrollText, LogOut, LayoutDashboard, ChevronLeft, CalendarClock } from 'lucide-react';
import Image from 'next/image';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import type { User as UserType } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

const LOGGED_IN_USER_KEY = 'logged-in-user';
const ALL_USERS_KEY = 'user-data';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [user, setUser] = React.useState<UserType | null>(null);
  const [pendingUsersCount, setPendingUsersCount] = React.useState(0);


  const handleStorageChange = React.useCallback(() => {
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
              const pendingCount = allUsers.filter(u => u.role === 'New User').length;
              setPendingUsersCount(pendingCount);
            } else {
              setUser(session);
              setPendingUsersCount(0);
            }
          } else {
            setUser(null);
            setPendingUsersCount(0);
          }
        } catch (error) {
          console.error("Failed to retrieve user from storage", error);
        }
    }, []);
    
  React.useEffect(() => {
    handleStorageChange(); // Initial load
    
    window.addEventListener('storage', handleStorageChange);
    // Add custom event listener for user data changes
    window.addEventListener('users-updated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('users-updated', handleStorageChange);
    }
  }, [handleStorageChange]);

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(LOGGED_IN_USER_KEY);
    } catch (error) {
      console.error('Failed to clear user session', error);
    }
    router.push('/login');
  };

  const handleBackToHome = () => {
    router.push('/dashboard');
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const allNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin', 'Super Admin'] },
    { href: '/inventory', icon: Package, label: 'Inventory', roles: ['Admin', 'Super Admin', 'General Member'] },
    { href: '/due-items', icon: CalendarClock, label: 'Due Items', roles: ['Admin', 'Super Admin'] },
    { href: '/users', icon: Users, label: 'User Management', roles: ['Admin', 'Super Admin'], notificationCount: pendingUsersCount },
    { href: '/logs', icon: ScrollText, label: 'Inventory Log', roles: ['Admin', 'Super Admin'] },
  ];

  const navItems = allNavItems.filter(item => user && item.roles.includes(user.role));


  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
                 <div className="bg-primary rounded-lg p-1 text-primary-foreground">
                    <Image
                    src="https://res.cloudinary.com/diqgquom2/image/upload/v1754114497/WhatsApp_Image_2024-11-13_at_23.44.12_1060fab9-removebg-preview_hzogwa.png"
                    alt="Club Icon"
                    width={32}
                    height={32}
                    className="h-8 w-8"
                    />
                </div>
                <span
                    className={cn(
                    'font-semibold text-lg transition-opacity duration-200',
                    state === 'collapsed' && 'opacity-0'
                    )}
                >
                    Robostreaks Inventory
                </span>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-1">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href} className="relative">
                  <item.icon />
                  <span>{item.label}</span>
                   {item.notificationCount && item.notificationCount > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-destructive flex items-center justify-center text-white text-[9px]">
                        <span className={cn("transition-opacity duration-200", state === 'collapsed' && 'opacity-0')}>
                            {/* For collapsed state, the dot itself is the indicator */}
                        </span>
                    </span>
                   )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 flex flex-col gap-2">
        {isMobile && (
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleBackToHome}>
                <ChevronLeft />
                Back to Home
            </Button>
        )}
        <div className={cn('flex items-center gap-3 w-full', state === 'collapsed' && 'justify-center')}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatarUrl} alt={user?.name || ''} data-ai-hint="person avatar" />
            <AvatarFallback>{user ? getInitials(user.name) : 'AU'}</AvatarFallback>
          </Avatar>
          <div className={cn('flex flex-col grow min-w-0', state === 'collapsed' && 'hidden')}>
            <span className="text-xs font-semibold text-foreground truncate">{user?.name || 'Admin User'}</span>
            <span className="text-[11px] text-muted-foreground truncate">{user?.email || 'admin@example.com'}</span>
          </div>
          <Button variant="ghost" size="icon" className={cn('text-muted-foreground', state === 'collapsed' ? 'hidden' : 'flex')} onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
