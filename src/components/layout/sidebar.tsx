"use client";

import Link from "next/link";
import * as React from 'react';
import { usePathname, useRouter } from "next/navigation";
import { Package, Users, ScrollText, LogOut } from "lucide-react";
import Image from "next/image";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "../ui/button";
import type { User as UserType } from "@/lib/types";

const LOGGED_IN_USER_KEY = 'logged-in-user';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const [user, setUser] = React.useState<UserType | null>(null);

  React.useEffect(() => {
    try {
      const storedUser = window.localStorage.getItem(LOGGED_IN_USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to retrieve user from storage", error);
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

  const navItems = [
    { href: "/inventory", icon: Package, label: "Inventory" },
    { href: "/users", icon: Users, label: "User Management" },
    { href: "/logs", icon: ScrollText, label: "Inventory Log" },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
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
              "font-semibold text-xl transition-opacity duration-200",
              state === "collapsed" && "opacity-0"
            )}
          >
            Robostreaks
          </span>
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
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <div className={cn("flex items-center gap-3 w-full", state === "collapsed" && "justify-center")}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatarUrl} alt={user?.name || ''} data-ai-hint="person avatar" />
            <AvatarFallback>{user ? getInitials(user.name) : 'AU'}</AvatarFallback>
          </Avatar>
          <div className={cn("flex flex-col grow", state === "collapsed" && "hidden")}>
            <span className="text-sm font-semibold text-foreground">{user?.name || 'Admin User'}</span>
            <span className="text-xs text-muted-foreground">{user?.email || 'admin@example.com'}</span>
          </div>
            <Button variant="ghost" size="icon" className={cn("text-muted-foreground", state === "collapsed" ? "hidden" : "flex")} onClick={handleLogout}>
              <LogOut className="w-4 h-4"/>
            </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
