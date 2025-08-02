"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatRelative } from 'date-fns'
import type { LogEntry, User } from "@/lib/types"
import { Badge } from "../ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button"
import { MoreHorizontal, Trash2, EyeOff, Eye } from "lucide-react"

const ActionsCell = ({ row, table }: { row: any, table: any }) => {
  const log = row.original as LogEntry;
  const { currentUser } = table.options.meta || {};
  const canManage = currentUser?.role === 'Super Admin';

  if (!canManage) return null;

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
          <DropdownMenuLabel>Log Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => table.options.meta?.toggleHideLog?.(log)}>
            {log.isHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
            {log.isHidden ? 'Unhide Log' : 'Hide Log'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => table.options.meta?.deleteLog?.(log)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Log
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};


export const logsColumns: ColumnDef<LogEntry>[] = [
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.getValue("action") as string
      let variant: "default" | "secondary" | "outline" | "destructive" = "outline"
      if (action.includes("Add") || action.includes("Increase")) variant = "default"
      if (action.includes("Delete") || action.includes("Decrease")) variant = "destructive"
      if (action.includes("Update") || action.includes("Change")) variant = "secondary"

      return <Badge variant={variant} className="capitalize">{action}</Badge>
    }
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({ row }) => {
      return <span className="text-muted-foreground">{row.getValue("details")}</span>
    }
  },
  {
    accessorKey: "adminName",
    header: "Admin",
    cell: ({ row }) => {
      const log = row.original
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{log.adminName}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "timestamp",
    header: "Date",
    cell: ({ row }) => {
      const timestamp = new Date(row.getValue("timestamp"))
      const relativeTime = formatRelative(timestamp, new Date())
      return <span className="capitalize">{relativeTime}</span>
    },
  },
  {
    id: "actions",
    cell: ActionsCell,
  },
]
