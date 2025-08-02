"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Package, Users, ScrollText, LogOut } from "lucide-react";
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

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  const navItems = [
    { href: "/inventory", icon: Package, label: "Inventory" },
    { href: "/users", icon: Users, label: "User Management" },
    { href: "/logs", icon: ScrollText, label: "Inventory Log" },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2 text-primary-foreground">
            <Bot className="h-6 w-6" />
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
            <AvatarImage src="https://placehold.co/40x40" alt="Admin User" data-ai-hint="person avatar" />
            <AvatarFallback>AU</AvatarFallback>
          </Avatar>
          <div className={cn("flex flex-col grow", state === "collapsed" && "hidden")}>
            <span className="text-sm font-semibold text-foreground">Admin User</span>
            <span className="text-xs text-muted-foreground">admin@example.com</span>
          </div>
          <Link href="/login" passHref>
            <Button variant="ghost" size="icon" className={cn("text-muted-foreground", state === "collapsed" ? "hidden" : "flex")}>
              <LogOut className="w-4 h-4"/>
            </Button>
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
