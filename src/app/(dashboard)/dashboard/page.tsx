'use client'

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TransactionHistory } from '@/components/inventory/transaction-history';
import type { ItemTransaction, InventoryItem } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import { Package, Users, ArrowRightLeft } from 'lucide-react';

const INVENTORY_STORAGE_KEY = 'inventory-data';
const TRANSACTIONS_STORAGE_KEY_PREFIX = 'transactions-';

export default function DashboardPage() {
  const [transactions, setTransactions] = React.useState<ItemTransaction[]>([]);
  const [stats, setStats] = React.useState({ totalItems: 0, lowStock: 0, outOfStock: 0, totalUsers: 0, totalTransactions: 0 });
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      try {
        const allTransactions: ItemTransaction[] = [];
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
              allTransactions.push(...itemTransactions);
            }
          });
        }
        
        const usersData = window.localStorage.getItem('user-data');
        const totalUsers = usersData ? JSON.parse(usersData).length : 0;

        allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setTransactions(allTransactions.slice(0, 5));
        setStats({ 
            totalItems, 
            lowStock, 
            outOfStock, 
            totalUsers,
            totalTransactions: allTransactions.length,
        });

      } catch (error) {
        console.error('Failed to load dashboard data from localStorage', error);
      }
    }
  }, []);

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
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>A log of the most recent inventory transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionHistory transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
