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
import { PlusCircle, SlidersHorizontal, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ItemForm } from "./item-form"
import type { InventoryItem } from "@/lib/types"
import { Card } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    openForm: (item: TData) => void
    openDeleteDialog: (item: TData) => void
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

const STORAGE_KEY = 'inventory-data';

export function InventoryDataTable<TData extends InventoryItem, TValue>({
  columns,
  data: initialData,
}: DataTableProps<TData, TValue>) {
  const { toast } = useToast()
  
  const [data, setData] = React.useState<TData[]>(initialData);
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  React.useEffect(() => {
    if (isClient) {
      try {
        const storedData = window.localStorage.getItem(STORAGE_KEY);
        if (storedData) {
          setData(JSON.parse(storedData));
        } else {
           window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
        }
      } catch (error) {
        console.error("Failed to access localStorage", error);
        // Fallback to initial data if localStorage fails
        setData(initialData)
      }
    }
  }, [isClient, initialData]);

  React.useEffect(() => {
    if (isClient) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Failed to save to localStorage", error);
        }
    }
  }, [data, isClient]);


  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<TData | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<TData | null>(null)

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
      openForm: (item) => {
        setSelectedItem(item);
        setIsFormOpen(true);
      },
      openDeleteDialog: (item) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
      }
    }
  })

  const handleOpenNew = () => {
    setSelectedItem(null)
    setIsFormOpen(true)
  }
  
  const handleSaveItem = (formData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'status'>) => {
    if (selectedItem) {
      const updatedItem = {
        ...selectedItem,
        ...formData,
        stock: Number(formData.stock),
        lastUpdated: new Date().toISOString(),
        status: Number(formData.stock) > 0 ? (Number(formData.stock) < 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
      }
      setData(data.map((item) => (item.id === selectedItem.id ? updatedItem : item) as TData));
      toast({
        title: "Item Updated",
        description: `${formData.name} has been successfully updated.`,
      })
    } else {
      const newItem: InventoryItem = {
        id: `ITEM-${Math.floor(Math.random() * 9000) + 1000}`,
        ...formData,
        stock: Number(formData.stock),
        status: Number(formData.stock) > 0 ? (Number(formData.stock) < 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
        lastUpdated: new Date().toISOString(),
      }
      setData([...data, newItem as TData]);
      toast({
        title: "Item Added",
        description: `${formData.name} has been successfully created.`,
      })
    }
    setIsFormOpen(false);
    setSelectedItem(null);
  }

  const handleDelete = () => {
    if (!itemToDelete) return;
    setData(data.filter(item => item.id !== itemToDelete.id));
    toast({
      title: "Item Deleted",
      description: `${itemToDelete.name} has been removed from the inventory.`,
    });
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  }

  return (
    <div className="space-y-4">
       <ItemForm 
        isOpen={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        item={selectedItem}
        onSave={handleSaveItem}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              <span className="font-semibold"> {itemToDelete?.name}</span> from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                View
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
          <Button onClick={handleOpenNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
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
