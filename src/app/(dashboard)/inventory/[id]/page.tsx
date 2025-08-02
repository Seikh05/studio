

'use client';

import * as React from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, LoaderCircle, Calendar as CalendarIcon, X } from 'lucide-react';
import type { InventoryItem, ItemTransaction, User, Notification } from '@/lib/types';
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
import { format, isSameDay, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const INVENTORY_STORAGE_KEY = 'inventory-data';
const TRANSACTIONS_STORAGE_KEY_PREFIX = 'transactions-';
const NOTIFICATIONS_STORAGE_KEY = 'notifications-data';
const LOGGED_IN_USER_KEY = 'logged-in-user';
const MAX_TRANSACTIONS_PER_ITEM = 50;


export default function ItemLogPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const itemId = params.id as string;
  const highlightedTransactionId = searchParams.get('transactionId');

  const [item, setItem] = React.useState<InventoryItem | null>(null);
  const [allTransactions, setAllTransactions] = React.useState<ItemTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = React.useState<ItemTransaction[]>([]);
  const [isClient, setIsClient] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [transactionToReturn, setTransactionToReturn] = React.useState<ItemTransaction | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = React.useState(false);
  const [returnQuantity, setReturnQuantity] = React.useState(1);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);


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
        const itemTransactions = JSON.parse(transactionsData);
        setAllTransactions(itemTransactions);
        setFilteredTransactions(itemTransactions);
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

  React.useEffect(() => {
    if (selectedDate) {
      const filtered = allTransactions.filter(t => isSameDay(parseISO(t.timestamp), selectedDate));
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(allTransactions);
    }
  }, [selectedDate, allTransactions]);

  const handleTransactionUpdate = (updatedTransactions: ItemTransaction[], updatedItem: InventoryItem) => {
     // Update state
    setItem(updatedItem);
    setAllTransactions(updatedTransactions);
    setFilteredTransactions(updatedTransactions); // Also update filtered view

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

  const addNotification = (transaction: ItemTransaction, item: InventoryItem, message: string) => {
    const newNotification: Notification = {
      id: `NOTIF-${Date.now()}`,
      itemId: item.id,
      transactionId: transaction.id,
      message: message,
      dueDate: transaction.returnDate || new Date().toISOString(), // Use return date or now
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    
    try {
      const existingNotificationsRaw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const existingNotifications: Notification[] = existingNotificationsRaw ? JSON.parse(existingNotificationsRaw) : [];
      const updatedNotifications = [newNotification, ...existingNotifications];
      window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
      // Dispatch event to update header
      window.dispatchEvent(new Event('storage'));
    } catch(error) {
        console.error("Failed to add notification", error)
    }
  };


  const handleAddTransaction = (newTransaction: Omit<ItemTransaction, 'id' | 'timestamp' | 'adminName' | 'isSettled' | 'quantityReturned'>) => {
    if (!item || !currentUser) return;

    const transaction: ItemTransaction = {
      ...newTransaction,
      id: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminName: currentUser.name,
      isSettled: false,
      quantityReturned: 0,
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
    
    if (transaction.type === 'borrow' && transaction.returnDate) {
       const message = `${transaction.borrowerName} is due to return ${item.name} (${transaction.quantity}) on ${format(new Date(transaction.returnDate), 'PPP')}.`
       addNotification(transaction, item, message);
    }

    const updatedItem: InventoryItem = {
      ...item,
      stock: newStock,
      status: newStock > 0 ? (newStock < 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
      lastUpdated: new Date().toISOString(),
    };
    
    const updatedTransactions = [transaction, ...allTransactions].slice(0, MAX_TRANSACTIONS_PER_ITEM);

    handleTransactionUpdate(updatedTransactions, updatedItem);

    toast({
      title: 'Transaction Logged',
      description: `Successfully logged ${newTransaction.type} of ${newTransaction.quantity} item(s).`,
    });
  };

  const handleOpenReturnDialog = (borrowTransaction: ItemTransaction) => {
    setTransactionToReturn(borrowTransaction);
    const maxReturnQty = borrowTransaction.quantity - (borrowTransaction.quantityReturned || 0);
    setReturnQuantity(maxReturnQty); // Default to max possible return
    setIsReturnDialogOpen(true);
  };

  const handleReturnTransaction = () => {
    if (!item || !currentUser || !transactionToReturn) return;

    const quantityToReturn = Number(returnQuantity);
    const maxReturnQty = transactionToReturn.quantity - (transactionToReturn.quantityReturned || 0);

    if (isNaN(quantityToReturn) || quantityToReturn <= 0 || quantityToReturn > maxReturnQty) {
        toast({
            variant: "destructive",
            title: "Invalid Quantity",
            description: `Please enter a number between 1 and ${maxReturnQty}.`
        });
        return;
    }

    // Create the new "return" transaction
    const returnTransaction: ItemTransaction = {
        id: `TXN-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'return',
        quantity: quantityToReturn,
        borrowerName: transactionToReturn.borrowerName,
        borrowerRegdNum: transactionToReturn.borrowerRegdNum,
        notes: `Returned against borrow ID ${transactionToReturn.id}`,
        adminName: currentUser.name,
        reminder: false,
        relatedBorrowId: transactionToReturn.id,
    };
    
    // Update the stock
    const newStock = item.stock + quantityToReturn;
    const updatedItem: InventoryItem = {
      ...item,
      stock: newStock,
      status: newStock > 0 ? (newStock < 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
      lastUpdated: new Date().toISOString(),
    };

    // Update the original borrow transaction
    const updatedOldTransactions = allTransactions.map(t => {
      if (t.id === transactionToReturn.id) {
        const newQuantityReturned = (t.quantityReturned || 0) + quantityToReturn;
        return { 
          ...t, 
          quantityReturned: newQuantityReturned,
          isSettled: newQuantityReturned >= t.quantity,
        };
      }
      return t;
    });
    
    const finalTransactions = [returnTransaction, ...updatedOldTransactions].slice(0, MAX_TRANSACTIONS_PER_ITEM);

    handleTransactionUpdate(finalTransactions, updatedItem);

    const remaining = maxReturnQty - quantityToReturn;
    let toastMessage: string;
    let notifMessage: string;

    if (remaining > 0) {
        toastMessage = `${quantityToReturn} item(s) returned. ${remaining} still due.`;
        notifMessage = `${item.name}: ${quantityToReturn} returned by ${transactionToReturn.borrowerName}. ${remaining} still due.`;
    } else {
        toastMessage = `Final ${quantityToReturn} item(s) returned. Transaction complete.`;
        notifMessage = `${item.name}: All ${transactionToReturn.quantity} items returned by ${transactionToReturn.borrowerName}.`;
    }

    addNotification(returnTransaction, item, notifMessage);

    toast({
      title: 'Item(s) Returned',
      description: toastMessage,
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

  const quantityDue = transactionToReturn ? transactionToReturn.quantity - (transactionToReturn.quantityReturned || 0) : 0;

  return (
    <>
      <AlertDialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Item Return</AlertDialogTitle>
            <AlertDialogDescription>
              Log a return for <strong>{item.name}</strong> from borrower <strong>{transactionToReturn?.borrowerName}</strong>. 
              They currently have {quantityDue} item(s) due from borrow ID {transactionToReturn?.id}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="return-quantity-input">Quantity to Return</Label>
            <Input 
              id="return-quantity-input"
              type="number"
              value={returnQuantity}
              onChange={(e) => setReturnQuantity(Number(e.target.value))}
              placeholder="e.g. 1"
              max={quantityDue}
              min={1}
            />
             {returnQuantity > quantityDue && <p className="text-destructive text-sm mt-1">Cannot return more than {quantityDue} items.</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTransactionToReturn(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReturnTransaction} 
              disabled={returnQuantity <= 0 || returnQuantity > quantityDue}
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>
                                {selectedDate ? `Showing transactions for ${format(selectedDate, 'PPP')}` : 'A complete log of all activities for this item.'}
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
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                  <TransactionHistory 
                    transactions={filteredTransactions} 
                    onReturn={handleOpenReturnDialog}
                    highlightedTransactionId={highlightedTransactionId}
                   />
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
