
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
import { PlusCircle, Trash2, UserCheck, SlidersHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/types"
import { Card } from "../ui/card"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"


declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    onOpenForm: (user: TData | null) => void;
    onOpenDeleteDialog: (user: TData) => void;
    onApproveUser: (user: TData) => void;
    onOpenDenyDialog: (user: TData) => void;
    currentUser: User | null;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onDataChange: () => void;
  currentUser: User | null;
  onOpenForm: (user: TData | null) => void;
  onOpenDeleteDialog: (user: TData) => void;
  onApproveUser: (user: TData) => void;
  onOpenDenyDialog: (user: TData) => void;
}

export function UserDataTable<TData extends User, TValue>({
  columns,
  data,
  onDataChange,
  currentUser,
  onOpenForm,
  onOpenDeleteDialog,
  onApproveUser,
  onOpenDenyDialog,
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [showPendingOnly, setShowPendingOnly] = React.useState(false);

  const pendingUsersCount = React.useMemo(() => data.filter(user => user.role === 'New User').length, [data]);

  React.useEffect(() => {
    if (isMobile) {
      setColumnVisibility({
        status: false,
        lastLogin: false,
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
      onApproveUser,
      onOpenDenyDialog,
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
    onOpenForm(null);
  }

  const canAddUsers = currentUser?.role === 'Super Admin';
  const canApproveUsers = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';


  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Input
            placeholder="Filter by name or email..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="w-full md:max-w-sm"
            />
            <div className="flex w-full items-center justify-between md:justify-end md:gap-2">
                <div className="md:hidden">
                    {canAddUsers && (
                        <Button onClick={handleOpenNew} size="icon">
                            <PlusCircle className="h-4 w-4" />
                            <span className="sr-only">Add User</span>
                        </Button>
                    )}
                </div>

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

                    {canAddUsers && (
                        <Button onClick={handleOpenNew} className="hidden md:flex">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add User
                        </Button>
                    )}
                </div>
            </div>
      </div>
      <Card className="shadow-sm">
        <div className="overflow-x-auto">
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
        </div>
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
