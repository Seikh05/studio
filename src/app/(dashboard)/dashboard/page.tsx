
'use client'

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TransactionHistory } from '@/components/inventory/transaction-history';
import type { ItemTransaction, InventoryItem, User } from '@/lib/types';
import { Package, Users, ArrowRightLeft, LoaderCircle, Calendar as CalendarIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parseISO } from 'date-fns';

const INVENTORY_STORAGE_KEY = 'inventory-data';
const USER_STORAGE_KEY = 'user-data';
const TRANSACTIONS_STORAGE_KEY_PREFIX = 'transactions-';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = React.useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalUsers: 0,
    totalTransactions: 0,
  });
  const [allTransactions, setAllTransactions] = React.useState<ItemTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = React.useState<ItemTransaction[]>([]);
  const [isClient, setIsClient] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  const loadDashboardData = React.useCallback(() => {
    try {
      // Inventory Stats
      const inventoryData = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
      const inventory: InventoryItem[] = inventoryData ? JSON.parse(inventoryData) : [];
      const totalItems = inventory.length;
      const lowStock = inventory.filter(i => i.status === 'Low Stock').length;
      const outOfStock = inventory.filter(i => i.status === 'Out of Stock').length;

      // User Stats
      const usersData = window.localStorage.getItem(USER_STORAGE_KEY);
      const users: User[] = usersData ? JSON.parse(usersData) : [];
      const totalUsers = users.length;

      // Transaction Stats & Recent Transactions
      let transactions: ItemTransaction[] = [];
      inventory.forEach(item => {
        const transactionsKey = `${TRANSACTIONS_STORAGE_KEY_PREFIX}${item.id}`;
        const transactionsData = window.localStorage.getItem(transactionsKey);
        if (transactionsData) {
          const itemTransactions: ItemTransaction[] = JSON.parse(transactionsData);
          // Add item info to each transaction for the recent activity log
          const transactionsWithItem = itemTransactions.map(t => ({...t, itemName: item.name, itemId: item.id}));
          transactions.push(...transactionsWithItem);
        }
      });
      
      transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAllTransactions(transactions);

      setStats({
        totalItems,
        lowStock,
        outOfStock,
        totalUsers,
        totalTransactions: transactions.length,
      });

    } catch (error) {
      console.error("Failed to load dashboard data from localStorage", error);
    }
  }, []);

  React.useEffect(() => {
    setIsClient(true);
    loadDashboardData();
    
    const handleStorageChange = () => loadDashboardData();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('inventory-updated', handleStorageChange);
    window.addEventListener('users-updated', handleStorageChange);
    window.addEventListener('logs-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('inventory-updated', handleStorageChange);
      window.removeEventListener('users-updated', handleStorageChange);
       window.removeEventListener('logs-updated', handleStorageChange);
    }
  }, [loadDashboardData]);

  React.useEffect(() => {
    if (selectedDate) {
        const dateFiltered = allTransactions.filter(t => isSameDay(parseISO(t.timestamp), selectedDate));
        setFilteredTransactions(dateFiltered);
    } else {
        setFilteredTransactions(allTransactions.slice(0, 5));
    }
  }, [selectedDate, allTransactions]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalItems}</div>
                    <p className="text-xs text-muted-foreground">{stats.lowStock} items with low stock</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">Admins and Super Admins</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                    <p className="text-xs text-muted-foreground">Borrows and returns logged</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                     <Package className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{stats.outOfStock}</div>
                    <p className="text-xs text-muted-foreground">Items that need restocking</p>
                </CardContent>
            </Card>
       </div>
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  {selectedDate ? `Showing transactions for ${format(selectedDate, 'PPP')}` : 'The latest transactions from across the inventory.'}
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
                        onSelect={setSelectedDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                {selectedDate && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDate(undefined)}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Reset</span>
                    </Button>
                )}
                <Button onClick={() => router.push('/logs')} variant="link" className="text-sm font-medium text-primary">
                    View all
                </Button>
              </div>
            </div>
        </CardHeader>
        <CardContent>
          <TransactionHistory transactions={filteredTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
