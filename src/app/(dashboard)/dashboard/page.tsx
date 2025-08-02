'use client'

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TransactionHistory } from '@/components/inventory/transaction-history';
import type { ItemTransaction, InventoryItem } from '@/lib/types';
import { LoaderCircle, Package, Users, ArrowRightLeft, Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parseISO } from 'date-fns';


const INVENTORY_STORAGE_KEY = 'inventory-data';
const TRANSACTIONS_STORAGE_KEY_PREFIX = 'transactions-';

export default function DashboardPage() {
  const [allTransactions, setAllTransactions] = React.useState<ItemTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = React.useState<ItemTransaction[]>([]);
  const [stats, setStats] = React.useState({ totalItems: 0, lowStock: 0, outOfStock: 0, totalUsers: 0 });
  const [isClient, setIsClient] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [filteredTransactionCount, setFilteredTransactionCount] = React.useState(0);


  React.useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      try {
        const transactions: ItemTransaction[] = [];
        let totalItems = 0;
        let lowStock = 0;
        let outOfStock = 0;
        
        const inventoryData = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
        if (inventoryData) {
          const inventory: InventoryItem[] = JSON.parse(inventoryData);
          totalItems = inventory.length;
          inventory.forEach(item => {
            if (item.status === 'Low Stock') lowStock++;
            if (item.status === 'Out of Stock') outOfStock++;
            
            const transactionsKey = `${TRANSACTIONS_STORAGE_KEY_PREFIX}${item.id}`;
            const transactionsData = window.localStorage.getItem(transactionsKey);
            if (transactionsData) {
              const itemTransactions: ItemTransaction[] = JSON.parse(transactionsData);
              const transactionsWithItemName = itemTransactions.map(t => ({
                ...t,
                itemName: item.name
              }));
              transactions.push(...transactionsWithItemName);
            }
          });
        }
        
        const usersData = window.localStorage.getItem('user-data');
        const totalUsers = usersData ? JSON.parse(usersData).length : 0;

        transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setAllTransactions(transactions);
        setFilteredTransactions(transactions.slice(0,5)); // Initially show latest 5
        setFilteredTransactionCount(transactions.length);
        setStats({ 
            totalItems, 
            lowStock, 
            outOfStock, 
            totalUsers,
        });

      } catch (error) {
        console.error('Failed to load dashboard data from localStorage', error);
      }
    }
  }, []);

  React.useEffect(() => {
    if (!selectedDate) {
      setFilteredTransactions(allTransactions.slice(0, 5));
      setFilteredTransactionCount(allTransactions.length);
    } else {
      const filtered = allTransactions.filter(t => isSameDay(parseISO(t.timestamp), selectedDate));
      setFilteredTransactions(filtered);
      setFilteredTransactionCount(filtered.length);
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
                    <div className="text-2xl font-bold">{filteredTransactionCount}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedDate ? `On ${format(selectedDate, 'PPP')}` : 'Borrows and returns logged'}
                    </p>
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
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                {selectedDate ? `Transactions for ${format(selectedDate, 'PPP')}` : 'Most recent inventory transactions.'}
              </CardDescription>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-2">
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
            </div>
        </CardHeader>
        <CardContent>
          <TransactionHistory transactions={filteredTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
