
"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { MoreHorizontal, ArrowUpDown, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

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
import type { InventoryItem, User } from "@/lib/types"

const ActionsCell = ({ row, table }: { row: any, table: any }) => {
  const item = row.original as InventoryItem;
  const router = useRouter();
  const { currentUser } = table.options.meta || {};

  if (!currentUser || currentUser.role === 'General Member') {
    return null;
  }

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
          <DropdownMenuItem onClick={() => router.push(`/inventory/${item.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View Logs
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>
            Copy item ID
          </DropdownMenuItem>
          <DropdownMenuItem>Generate QR Code</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => table.options.meta?.openForm?.(item)}>
            Edit item
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => table.options.meta?.openDeleteDialog?.(item)}
          >
            Delete item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};


export const inventoryColumns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Item
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const item = row.original
      const router = useRouter();
      return (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/inventory/${item.id}`)}>
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={40}
            height={40}
            className="rounded-md object-cover"
            data-ai-hint="product image"
          />
          <div className="flex flex-col">
            <span className="font-medium">{item.name}</span>
            <span className="text-sm text-muted-foreground">{item.id}</span>
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
      const variant: "default" | "secondary" | "destructive" =
        status === "In Stock"
          ? "default"
          : status === "Low Stock"
          ? "secondary"
          : "destructive"
      
      return <Badge variant={variant} className="capitalize">{status}</Badge>
    },
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("stock"))
      return <div className="text-right font-medium">{amount}</div>
    },
  },
  {
    id: "actions",
    cell: ActionsCell,
  },
]
