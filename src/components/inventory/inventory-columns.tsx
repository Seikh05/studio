
"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Trash2 } from "lucide-react"
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
import type { InventoryItem, User } from "@/lib/types"

const ActionsCell = ({ row, table }: { row: any, table: any }) => {
  const item = row.original as InventoryItem;
  const router = useRouter();
  const { currentUser, onOpenForm, onOpenDeleteDialog } = table.options.meta || {};

  const canManage = currentUser?.role !== 'General Member';

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
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/inventory/${item.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View Log
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOpenForm?.(item)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Item
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => onOpenDeleteDialog?.(item)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Item
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
    accessorKey: "category",
    header: "Category",
  },
    {
    accessorKey: "stock",
    header: () => <div className="text-right">Stock</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("stock"))
      return <div className="text-right font-medium">{amount}</div>
    },
  },
  {
    id: "log",
    header: () => <div className="text-center">Log</div>,
    cell: ({ row }) => {
      const item = row.original;
      const router = useRouter();
      return (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/${item.id}`)}>
            View Log
          </Button>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ActionsCell,
  },
]
