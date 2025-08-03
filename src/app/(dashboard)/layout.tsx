
'use client';

import { AppHeader } from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import * as React from 'react';
import { LoaderCircle } from "lucide-react";

const LOGGED_IN_USER_KEY = 'logged-in-user';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const checkAuth = React.useCallback(() => {
    try {
      const userSession = window.localStorage.getItem(LOGGED_IN_USER_KEY);
      if (userSession) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/login');
      }
    } catch (error) {
      console.error("Auth check failed", error);
      setIsAuthenticated(false);
      router.push('/login');
    }
  }, [router]);

  React.useEffect(() => {
    setIsClient(true);
    checkAuth();
  }, [checkAuth]);
  
  // This effect handles logout/login events from other tabs
  React.useEffect(() => {
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === LOGGED_IN_USER_KEY) {
            checkAuth();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => {
          window.removeEventListener('storage', handleStorageChange);
      };
  }, [checkAuth]);

  if (!isClient || !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
