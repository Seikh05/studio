"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatRelative } from 'date-fns'
import type { LogEntry } from "@/lib/types"
import { Badge } from "../ui/badge"

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
]
