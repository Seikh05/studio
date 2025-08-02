

'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, LoaderCircle, Trash2 } from 'lucide-react';
import type { InventoryItem, ItemTransaction, User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { TransactionForm } from '@/components/inventory/transaction-form';
import { TransactionHistory } from '@/components/inventory/transaction-history';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INVENTORY_STORAGE_KEY = 'inventory-data';
const TRANSACTIONS_STORAGE_KEY_PREFIX = 'transactions-';
const LOGGED_IN_USER_KEY = 'logged-in-user';
const MAX_TRANSACTIONS_PER_ITEM = 50;


export default function ItemLogPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const itemId = params.id as string;

  const [item, setItem] = React.useState<InventoryItem | null>(null);
  const [transactions, setTransactions] = React.useState<ItemTransaction[]>([]);
  const [isClient, setIsClient] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [transactionToReturn, setTransactionToReturn] = React.useState<ItemTransaction | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = React.useState(false);
  const [returnConfirmText, setReturnConfirmText] = React.useState("");

  React.useEffect(() => {
    setIsClient(true);
    if (!itemId) return;

    try {
      // Fetch item
      const inventoryData = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (inventoryData) {
        const inventory: InventoryItem[] = JSON.parse(inventoryData);
        const foundItem = inventory.find((i) => i.id === itemId);
        setItem(foundItem || null);
      }

      // Fetch transactions
      const transactionsKey = `${TRANSACTIONS_STORAGE_KEY_PREFIX}${itemId}`;
      const transactionsData = window.localStorage.getItem(transactionsKey);
      if (transactionsData) {
        setTransactions(JSON.parse(transactionsData));
      }

      // Fetch current user
      const userData = window.localStorage.getItem(LOGGED_IN_USER_KEY);
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }

    } catch (error) {
      console.error('Failed to load data from localStorage', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load item details.',
      });
    }
  }, [itemId, toast]);

  const handleTransactionUpdate = (updatedTransactions: ItemTransaction[], updatedItem: InventoryItem) => {
     // Update state
    setItem(updatedItem);
    setTransactions(updatedTransactions);

    try {
      // Update inventory in localStorage
      const inventoryData = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (inventoryData) {
        let inventory: InventoryItem[] = JSON.parse(inventoryData);
        inventory = inventory.map(i => i.id === itemId ? updatedItem : i);
        window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
      }

      // Update transactions in localStorage
      const transactionsKey = `${TRANSACTIONS_STORAGE_KEY_PREFIX}${itemId}`;
      window.localStorage.setItem(transactionsKey, JSON.stringify(updatedTransactions));

    } catch (error) {
       console.error('Failed to save data to localStorage', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save transaction.',
      });
    }
  }


  const handleAddTransaction = (newTransaction: Omit<ItemTransaction, 'id' | 'timestamp' | 'adminName' | 'returned'>) => {
    if (!item || !currentUser) return;

    const transaction: ItemTransaction = {
      ...newTransaction,
      id: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: currentUser.name,
      returned: false,
    };

    const newStock = newTransaction.type === 'borrow' 
      ? item.stock - newTransaction.quantity
      : item.stock + newTransaction.quantity;

    if (newStock < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Quantity',
        description: 'Cannot borrow more items than available in stock.',
      });
      return;
    }

    const updatedItem: InventoryItem = {
      ...item,
      stock: newStock,
      status: newStock > 0 ? (newStock < 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
      lastUpdated: new Date().toISOString(),
    };
    
    const updatedTransactions = [transaction, ...transactions].slice(0, MAX_TRANSACTIONS_PER_ITEM);

    handleTransactionUpdate(updatedTransactions, updatedItem);

    toast({
      title: 'Transaction Logged',
      description: `Successfully logged ${newTransaction.type} of ${newTransaction.quantity} item(s).`,
    });
  };

  const handleOpenReturnDialog = (borrowTransaction: ItemTransaction) => {
    setTransactionToReturn(borrowTransaction);
    setIsReturnDialogOpen(true);
    setReturnConfirmText("");
  };

  const handleReturnTransaction = () => {
    if (!item || !currentUser || !transactionToReturn) return;

    // Create the new "return" transaction
    const returnTransaction: ItemTransaction = {
        id: `TXN-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'return',
        quantity: transactionToReturn.quantity,
        notes: `Return of transaction ${transactionToReturn.id}`,
        adminName: currentUser.name,
        reminder: false,
        returned: false, // Not applicable for return transactions
    };
    
    // Update the stock
    const newStock = item.stock + transactionToReturn.quantity;
    const updatedItem: InventoryItem = {
      ...item,
      stock: newStock,
      status: newStock > 0 ? (newStock < 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
      lastUpdated: new Date().toISOString(),
    };

    // Mark the original borrow transaction as returned
    const updatedOldTransactions = transactions.map(t => t.id === transactionToReturn.id ? { ...t, returned: true } : t);
    
    // Add the new return transaction and slice to maintain the limit
    const finalTransactions = [returnTransaction, ...updatedOldTransactions].slice(0, MAX_TRANSACTIONS_PER_ITEM);

    handleTransactionUpdate(finalTransactions, updatedItem);

    toast({
      title: 'Item Returned',
      description: `Logged return of ${transactionToReturn.quantity} item(s). Stock updated.`,
    });
    
    setIsReturnDialogOpen(false);
    setTransactionToReturn(null);
  };


  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Item not found</h2>
        <p className="text-muted-foreground mt-2">The requested item does not exist.</p>
        <Button onClick={() => router.push('/inventory')} className="mt-4">
          <ArrowLeft className="mr-2" /> Back to Inventory
        </Button>
      </div>
    );
  }
  
  const statusVariant: "default" | "secondary" | "destructive" =
    item.status === "In Stock" ? "default" : item.status === "Low Stock" ? "secondary" : "destructive";

  return (
    <>
      <AlertDialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to return this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark transaction <strong>{transactionToReturn?.id}</strong> as returned and update the stock.
              To confirm, please type "confirm" in the box below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="confirm-return-input" className="sr-only">Confirm Return</Label>
            <Input 
              id="confirm-return-input"
              value={returnConfirmText}
              onChange={(e) => setReturnConfirmText(e.target.value)}
              placeholder='Type "confirm" to proceed'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToReturn(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReturnTransaction} 
              disabled={returnConfirmText.toLowerCase() !== 'confirm'}
              className="bg-primary hover:bg-primary/90"
            >
              Confirm Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/inventory')}>
              <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
          <Badge variant={statusVariant} className="capitalize text-sm">{item.status}</Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={160}
                    height={160}
                    className="rounded-lg object-cover border"
                    data-ai-hint="product image"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Current Stock</p>
                  <p className="text-3xl font-bold">{item.stock}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-sm">{item.category}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Item ID</p>
                  <p className="text-sm font-mono">{item.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                  <CardTitle>Log a New Transaction</CardTitle>
                  <CardDescription>Record when an item is borrowed or returned.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionForm onSubmit={handleAddTransaction} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>A complete log of all activities for this item.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionHistory transactions={transactions} onReturn={handleOpenReturnDialog} />
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
