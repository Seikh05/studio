
"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { MoreHorizontal, ArrowUpDown, CheckSquare } from "lucide-react"
import { format } from 'date-fns'
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/lib/types"

const LastLoginCell = ({ row }: { row: any }) => {
  const lastLogin = row.getValue("lastLogin") as string;
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    try {
      setFormattedDate(format(new Date(lastLogin), "PPp"));
    } catch (e) {
      setFormattedDate('Invalid date');
    }
  }, [lastLogin]);

  if (!formattedDate) {
    // Render a placeholder on the server and initial client render
    return <span>Loading...</span>;
  }

  return <span>{formattedDate}</span>;
};

export const usersColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center gap-3">
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
            data-ai-hint="person avatar"
          />
          <div className="flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variant: "default" | "secondary" =
        status === "Active" ? "default" : "secondary"
      
      return <Badge variant={variant} className="capitalize">{status}</Badge>
    },
  },
  {
    accessorKey: "role",
    header: "Role",
     cell: ({ row }) => {
      const role = row.getValue("role") as string
      let variant: "outline" | "secondary" | "default" | "destructive" = "default";
      switch(role) {
        case "Admin":
          variant = "outline";
          break;
        case "General Member":
          variant = "secondary";
          break;
        case "New User":
          variant = "destructive";
          break;
        case "Super Admin":
        default:
          variant = "default";
          break;
      }
      return <Badge variant={variant} className="capitalize">{role}</Badge>
    },
  },
  {
    accessorKey: "lastLogin",
    header: "Last Login",
    cell: LastLoginCell,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const user = row.original
      // @ts-ignore
      const { currentUser } = table.options.meta || {};
      
      const canApprove = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
      const canManageUsers = currentUser?.role === 'Super Admin'; // Only Super Admin can edit/delete
      const isSelf = currentUser?.id === user.id;

      if (!canApprove && !canManageUsers) return null;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {canApprove && user.role === 'New User' && (
                <DropdownMenuItem onClick={() => table.options.meta?.approveUser?.(user)}>
                   <CheckSquare className="mr-2 h-4 w-4" />
                   Approve User
                </DropdownMenuItem>
              )}
               {canManageUsers && (
                <DropdownMenuItem onClick={() => table.options.meta?.openForm?.(user)}>
                  Edit user
                </DropdownMenuItem>
              )}
              {canManageUsers && !isSelf && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => table.options.meta?.openDeleteDialog?.(user)}
                  >
                    Remove user
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
