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
import { PlusCircle, Trash2 } from "lucide-react"
import type { User } from "@/lib/types"
import { UserForm } from "./user-form"
import { Card } from "../ui/card"
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
    openForm: (user: TData) => void
    openDeleteDialog: (user: TData) => void
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

const STORAGE_KEY = 'user-data';

export function UserDataTable<TData extends User, TValue>({
  columns,
  data: initialData,
}: DataTableProps<TData, TValue>) {
  const { toast } = useToast()
  const [data, setData] = React.useState<TData[]>(initialData)
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
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<TData | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [userToDelete, setUserToDelete] = React.useState<TData | null>(null)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      openForm: (user) => {
        setSelectedUser(user);
        setIsFormOpen(true);
      },
      openDeleteDialog: (user) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
      }
    }
  })

  const handleOpenNew = () => {
    setSelectedUser(null)
    setIsFormOpen(true)
  }

  const handleSaveUser = (formData: Omit<User, 'id' | 'lastLogin' | 'status' | 'avatarUrl'>) => {
    if (selectedUser) {
      const updatedUser = {
        ...selectedUser,
        ...formData,
        lastLogin: new Date().toISOString(),
      }
      setData(data.map((user) => (user.id === selectedUser.id ? updatedUser : user)) as TData);
      toast({
        title: "User Updated",
        description: `${formData.name} has been successfully updated.`,
      })
    } else {
      const newUser: User = {
        id: `USR-${Math.floor(Math.random() * 9000) + 1000}`,
        ...formData,
        status: 'Active',
        lastLogin: new Date().toISOString(),
        avatarUrl: `https://placehold.co/40x40.png`,
      }
      setData([...data, newUser as TData]);
      toast({
        title: "User Added",
        description: `${formData.name} has been successfully created.`,
      })
    }
    setIsFormOpen(false);
    setSelectedUser(null);
  }

  const handleDelete = () => {
    if (!userToDelete) return;
    setData(data.filter(user => user.id !== userToDelete.id));
    toast({
      title: "User Removed",
      description: `${userToDelete.name} has been removed.`,
    });
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  }

  return (
    <div className="space-y-4">
      <UserForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={selectedUser}
        onSave={handleSaveUser}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to remove this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the user
               <span className="font-semibold"> {userToDelete?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Filter by name or email..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="w-full md:max-w-sm"
        />
        <div className="flex justify-start md:justify-end">
            <Button onClick={handleOpenNew} className="md:hidden" size="icon">
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only">Add User</span>
            </Button>
             <Button onClick={handleOpenNew} className="hidden md:flex">
                <PlusCircle className="mr-2 h-4 w-4" /> Add User
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
                  No users found.
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
