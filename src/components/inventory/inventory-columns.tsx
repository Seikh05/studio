
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

  return (
    <div className="text-right">
        <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/${item.id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View Log
        </Button>
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
    header: "Stock",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("stock"))
      return <div className="text-right font-medium">{amount}</div>
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ActionsCell,
  },
]
