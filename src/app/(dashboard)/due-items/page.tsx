
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, CalendarClock, Phone, Search } from 'lucide-react';
import type { InventoryItem, ItemTransaction, DueItem } from '@/lib/types';
import { differenceInDays, parseISO, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const INVENTORY_STORAGE_KEY = 'inventory-data';
const TRANSACTIONS_STORAGE_KEY_PREFIX = 'transactions-';


export default function DueItemsPage() {
    const [allDueItems, setAllDueItems] = React.useState<DueItem[]>([]);
    const [filteredDueItems, setFilteredDueItems] = React.useState<DueItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isClient, setIsClient] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');


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
                    setAllDueItems([]);
                    setIsLoading(false);
                    return;
                }

                const inventory: InventoryItem[] = JSON.parse(inventoryData);
                const items: DueItem[] = [];
                const today = startOfToday();

                inventory.forEach(item => {
                    const transactionsKey = `${TRANSACTIONS_STORAGE_KEY_PREFIX}${item.id}`;
                    const transactionsData = window.localStorage.getItem(transactionsKey);
                    if (transactionsData) {
                        const itemTransactions: ItemTransaction[] = JSON.parse(transactionsData);
                        
                        const activeBorrows = itemTransactions.filter(t => 
                            t.type === 'borrow' && 
                            !t.isSettled && 
                            t.returnDate
                        );

                        activeBorrows.forEach(t => {
                            const returnDate = parseISO(t.returnDate!);
                            const daysRemaining = differenceInDays(returnDate, today);
                            const quantityDue = t.quantity - (t.quantityReturned || 0);

                            if(quantityDue > 0) {
                                items.push({
                                    transactionId: t.id,
                                    itemId: item.id,
                                    itemName: item.name,
                                    itemImageUrl: item.imageUrl,
                                    borrowerName: t.borrowerName || 'Unknown',
                                    borrowerPhone: t.borrowerPhone,
                                    returnDate: t.returnDate!,
                                    daysRemaining: daysRemaining,
                                    quantityBorrowed: t.quantity,
                                    quantityReturned: t.quantityReturned || 0,
                                    quantityDue: quantityDue,
                                });
                            }
                        });
                    }
                });

                items.sort((a, b) => a.daysRemaining - b.daysRemaining);
                setAllDueItems(items);
                setFilteredDueItems(items);

            } catch (error) {
                console.error("Failed to load due items data", error)
                setAllDueItems([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchDueItems();

    }, [isClient]);

    React.useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = allDueItems.filter(item => {
            return (
                item.borrowerName.toLowerCase().includes(lowercasedFilter) ||
                (item.borrowerPhone && item.borrowerPhone.includes(lowercasedFilter)) ||
                item.itemName.toLowerCase().includes(lowercasedFilter)
            );
        });
        setFilteredDueItems(filteredData);
    }, [searchTerm, allDueItems]);


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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Borrowed Items</CardTitle>
                    <CardDescription>All items currently borrowed, sorted by the nearest due date.</CardDescription>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter by name, phone, or item..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-10"
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {filteredDueItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredDueItems.map(item => (
                        <Link href={`/inventory/${item.itemId}?transactionId=${item.transactionId}`} key={item.transactionId}>
                        <Card className="h-full hover:border-primary transition-colors flex flex-col">
                            <CardContent className="p-4 flex flex-col items-center text-center flex-1">
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
                                {item.borrowerPhone && (
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                        <Phone className="h-3 w-3"/>
                                        <span>{item.borrowerPhone}</span>
                                    </div>
                                )}
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
                            <div className="p-2 border-t bg-muted/50 text-center">
                                <Badge variant="secondary" className="text-sm font-bold">
                                    {item.quantityDue} of {item.quantityBorrowed} Due
                                </Badge>
                            </div>
                        </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <CalendarClock className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-xl font-semibold">{searchTerm ? 'No Matching Items' : 'No Borrowed Items'}</h3>
                    <p>{searchTerm ? 'Try adjusting your search term.' : 'There are no items currently marked as borrowed.'}</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
