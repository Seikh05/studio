
'use client'

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X, Trash2, EyeOff } from 'lucide-react'

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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Calendar } from "../ui/calendar"
import type { User, LogEntry } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
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
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"


const LOGS_STORAGE_KEY = 'logs-data';

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    currentUser: User | null;
    deleteLog: (log: TData) => void;
    toggleHideLog: (log: TData) => void;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  currentUser: User | null;
  onLogsChange: () => void;
  showHidden: boolean;
  onShowHiddenChange: (show: boolean) => void;
}

export function LogsDataTable<TData extends LogEntry, TValue>({
  columns,
  data,
  selectedDate,
  onDateChange,
  currentUser,
  onLogsChange,
  showHidden,
  onShowHiddenChange,
}: DataTableProps<TData, TValue>) {
  const { toast } = useToast();
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  
  const [logToDelete, setLogToDelete] = React.useState<TData | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");

  const [logToHide, setLogToHide] = React.useState<TData | null>(null);
  const [isHideOpen, setIsHideOpen] = React.useState(false);


  const handleDeleteLog = () => {
    if (!logToDelete) return;
    try {
      const logsRaw = window.localStorage.getItem(LOGS_STORAGE_KEY);
      let logs: LogEntry[] = logsRaw ? JSON.parse(logsRaw) : [];
      logs = logs.filter(log => log.id !== logToDelete.id);
      window.localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
      toast({ title: "Log Deleted", description: "The log entry has been permanently removed." });
      onLogsChange();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete log entry." });
    }
    setIsDeleteOpen(false);
    setLogToDelete(null);
  };

  const handleToggleHideLog = () => {
    if (!logToHide) return;
    try {
      const logsRaw = window.localStorage.getItem(LOGS_STORAGE_KEY);
      let logs: LogEntry[] = logsRaw ? JSON.parse(logsRaw) : [];
      logs = logs.map(log => log.id === logToHide.id ? { ...log, isHidden: !log.isHidden } : log);
      window.localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
      toast({ title: `Log ${logToHide.isHidden ? 'Shown' : 'Hidden'}`, description: `The log entry is now ${logToHide.isHidden ? 'visible' : 'hidden'}.` });
      onLogsChange();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update log entry." });
    }
    setIsHideOpen(false);
    setLogToHide(null);
  }

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
      currentUser,
      deleteLog: (log) => {
        setLogToDelete(log);
        setDeleteConfirmText("");
        setIsDeleteOpen(true);
      },
      toggleHideLog: (log) => {
        setLogToHide(log);
        setIsHideOpen(true);
      }
    }
  })

  return (
    <>
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the log entry. This action cannot be undone.
              Type "delete" to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
              <Label htmlFor="confirm-delete-input" className="sr-only">Confirm Delete</Label>
              <Input 
                id="confirm-delete-input"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Type "delete" to proceed'
              />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteLog}
              disabled={deleteConfirmText.toLowerCase() !== 'delete'}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Log
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isHideOpen} onOpenChange={setIsHideOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {logToHide?.isHidden ? 'unhide' : 'hide'} this log entry?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleHideLog}>
              <EyeOff className="mr-2 h-4 w-4" /> Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Inventory Log</CardTitle>
              <CardDescription>
                A record of all activities in the inventory system. 
                {selectedDate && `Showing logs for ${format(selectedDate, "PPP")}.`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full sm:w-56 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={onDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {selectedDate && (
                <Button variant="ghost" size="icon" onClick={() => onDateChange(undefined)}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Reset Date</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Input
              placeholder="Filter by action details..."
              value={(table.getColumn("details")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("details")?.setFilterValue(event.target.value)
              }
              className="w-full sm:max-w-sm"
            />
            {currentUser?.role === 'Super Admin' && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="show-hidden"
                  checked={showHidden}
                  onCheckedChange={onShowHiddenChange}
                />
                <Label htmlFor="show-hidden">Show Hidden Logs</Label>
              </div>
            )}
          </div>
          <div className="rounded-md border">
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
                      className={row.original.isHidden ? 'bg-muted/50' : ''}
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
                      No logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
        </CardContent>
      </Card>
    </>
  )
}
