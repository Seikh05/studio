
'use client'

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TransactionHistory } from '@/components/inventory/transaction-history';
import type { ItemTransaction, InventoryItem, User } from '@/lib/types';
import { Package, Users, ArrowRightLeft, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const [recentTransactions, setRecentTransactions] = React.useState<ItemTransaction[]>([]);
  const [isClient, setIsClient] = React.useState(false);

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
      let allTransactions: ItemTransaction[] = [];
      inventory.forEach(item => {
        const transactionsKey = `${TRANSACTIONS_STORAGE_KEY_PREFIX}${item.id}`;
        const transactionsData = window.localStorage.getItem(transactionsKey);
        if (transactionsData) {
          const itemTransactions: ItemTransaction[] = JSON.parse(transactionsData);
          // Add item info to each transaction for the recent activity log
          const transactionsWithItem = itemTransactions.map(t => ({...t, itemName: item.name}));
          allTransactions.push(...transactionsWithItem);
        }
      });
      
      allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setStats({
        totalItems,
        lowStock,
        outOfStock,
        totalUsers,
        totalTransactions: allTransactions.length,
      });

      setRecentTransactions(allTransactions.slice(0, 5));

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

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('inventory-updated', handleStorageChange);
      window.removeEventListener('users-updated', handleStorageChange);
    }
  }, [loadDashboardData]);

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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  The latest transactions from across the inventory.
                </CardDescription>
              </div>
              <button onClick={() => router.push('/logs')} className="text-sm font-medium text-primary hover:underline">
                View all
              </button>
            </div>
        </CardHeader>
        <CardContent>
          <TransactionHistory transactions={recentTransactions} />
        </CardContent>
      </Card>
    </div>
  );
}
