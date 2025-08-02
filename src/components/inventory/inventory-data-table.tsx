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
import { PlusCircle, SlidersHorizontal, Trash2, ListTree } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ItemForm } from "./item-form"
import type { InventoryItem, LogEntry, User, Category } from "@/lib/types"
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
import { CategoryManager } from "./category-manager"

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

const INVENTORY_STORAGE_KEY = 'inventory-data';
const LOGS_STORAGE_KEY = 'logs-data';
const LOGGED_IN_USER_KEY = 'logged-in-user';
const CATEGORIES_STORAGE_KEY = 'inventory-categories';
const MAX_LOG_ENTRIES = 50;

const defaultCategories: Category[] = [
    { id: 'cat-1', name: 'Gadgets' },
    { id: 'cat-2', name: 'Robotics' },
    { id: 'cat-3', name: 'Apparel' },
    { id: 'cat-4', name: 'Power Sources' },
    { id: 'cat-5', name: 'Other' },
];

const notifyLogUpdate = () => {
  window.dispatchEvent(new Event('logs-updated'));
};

const addLogEntry = (action: string, details: string) => {
  try {
    let adminName = 'Admin User';

    const storedUser = window.localStorage.getItem(LOGGED_IN_USER_KEY);
    if (storedUser) {
      const user: User = JSON.parse(storedUser);
      adminName = user.name;
    }

    const newLog: LogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName,
      action,
      details,
    };

    const existingLogsRaw = window.localStorage.getItem(LOGS_STORAGE_KEY);
    const existingLogs: LogEntry[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
    
    const updatedLogs = [newLog, ...existingLogs].slice(0, MAX_LOG_ENTRIES);
    
    try {
        window.localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
    } catch (error) {
        console.error("Failed to set log data in localStorage (quota may be exceeded):", error);
    }
    
    notifyLogUpdate();
  } catch (error) {
    console.error("Failed to create log entry:", error);
  }
};

export function InventoryDataTable<TData extends InventoryItem, TValue>({
  columns,
  data: initialData,
}: DataTableProps<TData, TValue>) {
  const { toast } = useToast()
  
  const [data, setData] = React.useState<TData[]>(initialData);
  const [isClient, setIsClient] = React.useState(false)
  const [categories, setCategories] = React.useState<Category[]>(defaultCategories);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  React.useEffect(() => {
    if (isClient) {
      try {
        // Load inventory
        const storedData = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
        if (storedData) {
          setData(JSON.parse(storedData));
        } else {
           window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(initialData));
        }
        // Load categories
        const storedCategories = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (storedCategories) {
            setCategories(JSON.parse(storedCategories));
        } else {
            window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCategories));
        }
      } catch (error) {
        console.error("Failed to access localStorage", error);
        setData(initialData)
      }
    }
  }, [isClient, initialData]);

  React.useEffect(() => {
    if (isClient) {
        try {
            window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Failed to save to localStorage", error);
        }
    }
  }, [data, isClient]);

  const handleSaveCategories = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    if(isClient) {
        try {
            window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
            toast({ title: "Categories Updated", description: "Your category list has been saved." });
        } catch (error) {
            console.error("Failed to save categories to localStorage", error);
            toast({ variant: "destructive", title: "Save Failed", description: "Could not save category list." });
        }
    }
    // Potentially update items if a category was renamed or deleted
    const oldCategoryNames = categories.map(c => c.name);
    const updatedCategoryNames = updatedCategories.map(c => c.name);
    
    // Simple check: if a category was removed, update items using it to "Other"
    const removedCategories = oldCategoryNames.filter(name => !updatedCategoryNames.includes(name));
    if (removedCategories.length > 0) {
        const defaultCategory = updatedCategories.find(c => c.name === 'Other')?.name || updatedCategories[0]?.name || '';
        setData(prevData => prevData.map(item => {
            if (removedCategories.includes(item.category)) {
                return { ...item, category: defaultCategory };
            }
            return item;
        }));
    }
  };


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
  
  const handleSaveItem = (formData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'status'> & { stockUpdateNote?: string }) => {
    if (selectedItem) {
      const oldStock = selectedItem.stock;
      const newStock = Number(formData.stock);
      const stockChange = newStock - oldStock;

      const updatedItem = {
        ...selectedItem,
        ...formData,
        stock: newStock,
        lastUpdated: new Date().toISOString(),
        status: newStock > 0 ? (newStock < 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
      }
      setData(data.map((item) => (item.id === selectedItem.id ? updatedItem : item) as TData));
      toast({
        title: "Item Updated",
        description: `${formData.name} has been successfully updated.`,
      })

      if (stockChange !== 0) {
          const action = stockChange > 0 ? 'Stock Increased' : 'Stock Decreased';
          let details = `${action} for "${formData.name}". New stock: ${newStock} (${stockChange > 0 ? '+' : ''}${stockChange}).`;
          if (formData.stockUpdateNote) {
            details += ` Note: ${formData.stockUpdateNote}`;
          }
          addLogEntry(action, details);
      } else {
        addLogEntry('Item Details Updated', `Updated details for "${formData.name}".`);
      }

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
      let logDetails = `Added new item "${newItem.name}" with initial stock of ${newItem.stock}.`;
      if (formData.stockUpdateNote) {
        logDetails += ` Note: ${formData.stockUpdateNote}`;
      }
      addLogEntry('Item Added', logDetails);
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
    addLogEntry('Item Deleted', `Deleted item "${itemToDelete.name}".`);
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  }

  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="space-y-4">
       <ItemForm 
        isOpen={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        item={selectedItem}
        onSave={handleSaveItem}
        categories={categories}
      />
      <CategoryManager 
        isOpen={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
        categories={categories}
        onSave={handleSaveCategories}
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
           <Button variant="outline" onClick={() => setIsCategoryManagerOpen(true)}>
             <ListTree className="mr-2 h-4 w-4" />
             Edit Categories
          </Button>
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
