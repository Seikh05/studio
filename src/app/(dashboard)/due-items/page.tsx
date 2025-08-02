
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoaderCircle, CalendarClock, AlertCircle } from 'lucide-react';
import type { InventoryItem, ItemTransaction, DueItem } from '@/lib/types';
import { differenceInDays, parseISO, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';

const INVENTORY_STORAGE_KEY = 'inventory-data';
const TRANSACTIONS_STORAGE_KEY_PREFIX = 'transactions-';


export default function DueItemsPage() {
    const [dueItems, setDueItems] = React.useState<DueItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, [])

    React.useEffect(() => {
        if (!isClient) return;

        const fetchDueItems = () => {
            setIsLoading(true);
            try {
                const inventoryData = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
                if (!inventoryData) {
                    setDueItems([]);
                    setIsLoading(false);
                    return;
                }

                const inventory: InventoryItem[] = JSON.parse(inventoryData);
                const allDueItems: DueItem[] = [];
                const today = startOfToday();

                inventory.forEach(item => {
                    const transactionsKey = `${TRANSACTIONS_STORAGE_KEY_PREFIX}${item.id}`;
                    const transactionsData = window.localStorage.getItem(transactionsKey);
                    if (transactionsData) {
                        const itemTransactions: ItemTransaction[] = JSON.parse(transactionsData);
                        
                        const activeBorrows = itemTransactions.filter(t => 
                            t.type === 'borrow' && 
                            !t.returned && 
                            t.returnDate
                        );

                        activeBorrows.forEach(t => {
                            const returnDate = parseISO(t.returnDate!);
                            const daysRemaining = differenceInDays(returnDate, today);

                            allDueItems.push({
                                transactionId: t.id,
                                itemId: item.id,
                                itemName: item.name,
                                itemImageUrl: item.imageUrl,
                                borrowerName: t.borrowerName || 'Unknown',
                                returnDate: t.returnDate!,
                                daysRemaining: daysRemaining
                            });
                        });
                    }
                });

                allDueItems.sort((a, b) => a.daysRemaining - b.daysRemaining);
                setDueItems(allDueItems);

            } catch (error) {
                console.error("Failed to load due items data", error)
                setDueItems([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchDueItems();

    }, [isClient]);


  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>Borrowed Items</CardTitle>
            <CardDescription>All items currently borrowed, sorted by the nearest due date.</CardDescription>
        </CardHeader>
        <CardContent>
            {dueItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {dueItems.map(item => (
                        <Link href={`/inventory/${item.itemId}`} key={item.transactionId}>
                        <Card className="h-full hover:border-primary transition-colors">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <Image 
                                    src={item.itemImageUrl}
                                    alt={item.itemName}
                                    width={80}
                                    height={80}
                                    className="rounded-md border mb-4"
                                    data-ai-hint="product image"
                                />
                                <p className="font-semibold text-base">{item.itemName}</p>
                                <p className="text-sm text-muted-foreground">Borrowed by {item.borrowerName}</p>
                                <div className={cn(
                                    "font-bold text-lg mt-2",
                                    item.daysRemaining < 0 && "text-destructive",
                                    item.daysRemaining >= 0 && item.daysRemaining < 2 && "text-amber-600",
                                    item.daysRemaining >= 2 && "text-primary"
                                )}>
                                    {item.daysRemaining < 0 
                                        ? `Overdue by ${Math.abs(item.daysRemaining)} day(s)` 
                                        : (item.daysRemaining === 0 ? "Due Today" : `Due in ${item.daysRemaining} day(s)`)
                                    }
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    on {parseISO(item.returnDate).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <CalendarClock className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-xl font-semibold">No Borrowed Items</h3>
                    <p>There are no items currently marked as borrowed.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
