
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
import { PlusCircle, Trash2, UserCheck } from "lucide-react"
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
import { Label } from "../ui/label"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip"


declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    openForm: (user: TData) => void;
    openDeleteDialog: (user: TData) => void;
    approveUser: (user: TData) => void;
    openDenyDialog: (user: TData) => void;
    currentUser: User | null;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onDataChange: () => void;
  currentUser: User | null;
}

const STORAGE_KEY = 'user-data';
const LOGGED_IN_USER_KEY = 'logged-in-user';

const notifyUserUpdate = () => {
    window.dispatchEvent(new Event('users-updated'));
};

export function UserDataTable<TData extends User, TValue>({
  columns,
  data,
  onDataChange,
  currentUser,
}: DataTableProps<TData, TValue>) {
  const { toast } = useToast()

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<TData | null>(null)
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [userToDelete, setUserToDelete] = React.useState<TData | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("")

  const [isDenyDialogOpen, setIsDenyDialogOpen] = React.useState(false);
  const [userToDeny, setUserToDeny] = React.useState<TData | null>(null);
  const [denyConfirmText, setDenyConfirmText] = React.useState("");
  const [showPendingOnly, setShowPendingOnly] = React.useState(false);

  const pendingUsersCount = React.useMemo(() => data.filter(user => user.role === 'New User').length, [data]);


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
        setDeleteConfirmText("");
        setIsDeleteDialogOpen(true);
      },
      openDenyDialog: (user) => {
        setUserToDeny(user);
        setDenyConfirmText("");
        setIsDenyDialogOpen(true);
      },
      approveUser: (user) => {
        handleApproveUser(user);
      },
      currentUser,
    }
  })

  React.useEffect(() => {
    if (showPendingOnly) {
      table.getColumn('role')?.setFilterValue('New User');
    } else {
      table.getColumn('role')?.setFilterValue(undefined);
    }
  }, [showPendingOnly, table]);

  const handleOpenNew = () => {
    setSelectedUser(null)
    setIsFormOpen(true)
  }

  const handleApproveUser = (userToApprove: User) => {
    try {
        const existingUsersRaw = window.localStorage.getItem(STORAGE_KEY);
        const existingUsers: User[] = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];

        const updatedUsers = existingUsers.map((user) => 
            user.id === userToApprove.id ? { ...user, role: 'General Member' } : user
        );
        
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
        toast({
            title: "User Approved",
            description: `${userToApprove.name} has been approved as a General Member.`,
        });
        onDataChange();
        notifyUserUpdate(); // Notify sidebar to update dot
    } catch(error) {
        console.error("Failed to approve user:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to approve user."
        })
    }
  }

  const handleSaveUser = (formData: Omit<User, 'id' | 'lastLogin' | 'status' | 'avatarUrl'>) => {
    try {
        const existingUsersRaw = window.localStorage.getItem(STORAGE_KEY);
        const existingUsers: User[] = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];

        if (selectedUser) {
            const updatedUser = {
                ...selectedUser,
                ...formData,
                lastLogin: new Date().toISOString(),
            };
            const updatedUsers = existingUsers.map((user) => (user.id === selectedUser.id ? updatedUser : user));
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
            toast({
                title: "User Updated",
                description: `${formData.name} has been successfully updated.`,
            });
        } else {
            const newUser: User = {
                id: `USR-${Math.floor(Math.random() * 9000) + 1000}`,
                ...formData,
                status: 'Active',
                lastLogin: new Date().toISOString(),
                avatarUrl: `https://placehold.co/40x40.png`,
            };
            const updatedUsers = [...existingUsers, newUser];
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
            toast({
                title: "User Added",
                description: `${formData.name} has been successfully created.`,
            });
        }
        onDataChange();
        notifyUserUpdate(); // Notify sidebar to update dot
        setIsFormOpen(false);
        setSelectedUser(null);
    } catch(error) {
        console.error("Failed to save user:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save user data."
        })
    }
  }

  const handleDelete = () => {
    if (!userToDelete) return;
    if (currentUser?.role !== 'Super Admin') {
        toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You do not have permission to remove users."
        });
        return;
    }

     try {
        const existingUsersRaw = window.localStorage.getItem(STORAGE_KEY);
        const existingUsers: User[] = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];
        const updatedUsers = existingUsers.filter(user => user.id !== userToDelete.id);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
        toast({
            title: "User Removed",
            description: `${userToDelete.name} has been removed.`,
        });
        onDataChange(); // Trigger data refresh in parent
        notifyUserUpdate(); // Notify sidebar to update dot
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
    } catch(error) {
         console.error("Failed to delete user:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete user."
        })
    }
  }
  
  const handleDenyUser = () => {
    if (!userToDeny) return;
    try {
        const existingUsersRaw = window.localStorage.getItem(STORAGE_KEY);
        const existingUsers: User[] = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];
        const updatedUsers = existingUsers.filter(user => user.id !== userToDeny.id);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
        toast({
            title: "User Denied",
            description: `${userToDeny.name} has been denied and removed from the system.`,
        });
        onDataChange();
        notifyUserUpdate();
        setIsDenyDialogOpen(false);
        setUserToDeny(null);
    } catch(error) {
         console.error("Failed to deny user:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to deny user."
        })
    }
  }

  const canAddUsers = currentUser?.role === 'Super Admin';
  const canApproveUsers = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';


  return (
    <div className="space-y-4">
      <UserForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={selectedUser}
        onSave={handleSaveUser}
        currentUser={currentUser}
      />
       <AlertDialog open={isDenyDialogOpen} onOpenChange={setIsDenyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to deny this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the registration for 
              <span className="font-semibold"> {userToDeny?.name}</span>. This action cannot be undone.
              To confirm, type "deny" in the box below.
            </AlertDialogDescription>
          </AlertDialogHeader>
           <div className="py-2">
            <Label htmlFor="confirm-deny-input" className="sr-only">Confirm Deny</Label>
            <Input 
              id="confirm-deny-input"
              value={denyConfirmText}
              onChange={(e) => setDenyConfirmText(e.target.value)}
              placeholder='Type "deny" to proceed'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDenyUser} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={denyConfirmText.toLowerCase() !== 'deny'}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deny User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to remove this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the user
               <span className="font-semibold"> {userToDelete?.name}</span>.
               To confirm, please type "confirm" in the box below.
            </AlertDialogDescription>
          </AlertDialogHeader>
           <div className="py-2">
            <Label htmlFor="confirm-delete-input" className="sr-only">Confirm Delete</Label>
            <Input 
              id="confirm-delete-input"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder='Type "confirm" to proceed'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteConfirmText.toLowerCase() !== 'confirm'}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Input
            placeholder="Filter by name or email..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="w-full md:max-w-sm"
            />
            <div className="flex items-center gap-2">
                 {canApproveUsers && pendingUsersCount > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button variant={showPendingOnly ? "default" : "outline"} onClick={() => setShowPendingOnly(!showPendingOnly)} className="relative">
                            <UserCheck className="md:mr-2 h-4 w-4" />
                            <span className="hidden md:inline">Pending Approvals</span>
                            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                                {pendingUsersCount}
                            </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="md:hidden">
                        <p>Pending Approvals</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                 {canAddUsers && (
                    <>
                        <Button onClick={handleOpenNew} className="md:hidden" size="icon">
                            <PlusCircle className="h-4 w-4" />
                            <span className="sr-only">Add User</span>
                        </Button>
                        <Button onClick={handleOpenNew} className="hidden md:flex">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add User
                        </Button>
                    </>
                )}
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
