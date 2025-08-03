
'use client'

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowData
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, SlidersHorizontal, ListTree } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { InventoryItem, User } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-mobile"

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    onOpenForm: (item: TData | null) => void;
    onOpenDeleteDialog: (item: TData) => void;
    currentUser: User | null
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  currentUser: User | null;
  onOpenForm: (item: TData | null) => void;
  onOpenDeleteDialog: (item: TData) => void;
  onOpenCategoryManager: () => void;
}

export function InventoryDataTable<TData extends InventoryItem, TValue>({
  columns,
  data,
  currentUser,
  onOpenForm,
  onOpenDeleteDialog,
  onOpenCategoryManager
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();
  
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  React.useEffect(() => {
    if (isMobile) {
      setColumnVisibility({
        category: false,
        log: false,
      })
    } else {
      setColumnVisibility({})
    }
  }, [isMobile])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    meta: {
      onOpenForm,
      onOpenDeleteDialog,
      currentUser,
    }
  })

  const handleOpenNew = () => {
    onOpenForm(null);
  }

  const canManageInventory = currentUser && currentUser.role !== 'General Member';


  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="w-full md:max-w-sm"
        />
        {canManageInventory && (
        <div className="flex w-full items-center justify-between md:justify-end md:gap-2">
            <div className="md:hidden">
                <Button onClick={handleOpenNew} size="icon">
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only">Add Item</span>
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline" className="hidden md:flex" onClick={onOpenCategoryManager}>
                    <ListTree className="mr-2 h-4 w-4" />
                    Edit Categories
                </Button>
                <Button variant="outline" size="icon" className="md:hidden" onClick={onOpenCategoryManager}>
                    <ListTree className="h-4 w-4" />
                    <span className="sr-only">Edit Categories</span>
                </Button>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="ml-auto">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">View</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    {table
                        .getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => {
                        return (
                            <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                            }
                            >
                            {column.id}
                            </DropdownMenuCheckboxItem>
                        )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            
                <Button onClick={handleOpenNew} className="hidden md:flex">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </div>
        </div>
        )}
      </div>
      <Card className="shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
