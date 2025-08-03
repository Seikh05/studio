
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarClock, LoaderCircle, Package, Search } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import type { DueItem, InventoryItem, ItemTransaction } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

const INVENTORY_STORAGE_KEY = 'inventory-data';
const TRANSACTIONS_STORAGE_KEY_PREFIX = 'transactions-';

export default function DueItemsPage() {
    const [dueItems, setDueItems] = React.useState<DueItem[]>([]);
    const [filteredItems, setFilteredItems] = React.useState<DueItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const router = useRouter();

    const loadDueItems = React.useCallback(() => {
        setIsLoading(true);
        try {
            const inventoryData = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
            const inventory: InventoryItem[] = inventoryData ? JSON.parse(inventoryData) : [];
            
            const allDueItems: DueItem[] = [];

            inventory.forEach(item => {
                const transactionsKey = `${TRANSACTIONS_STORAGE_KEY_PREFIX}${item.id}`;
                const transactionsData = window.localStorage.getItem(transactionsKey);
                const transactions: ItemTransaction[] = transactionsData ? JSON.parse(transactionsData) : [];

                const openBorrows = transactions.filter(t => t.type === 'borrow' && !t.isSettled);

                openBorrows.forEach(borrow => {
                    const quantityDue = borrow.quantity - (borrow.quantityReturned || 0);
                    if (quantityDue > 0 && borrow.returnDate && borrow.borrowerName) {
                        const daysRemaining = differenceInDays(parseISO(borrow.returnDate), new Date());
                        allDueItems.push({
                            transactionId: borrow.id,
                            itemId: item.id,
                            itemName: item.name,
                            itemImageUrl: item.imageUrl,
                            borrowerName: borrow.borrowerName,
                            borrowerRegdNum: borrow.borrowerRegdNum,
                            borrowerPhone: borrow.borrowerPhone,
                            returnDate: borrow.returnDate,
                            daysRemaining: daysRemaining,
                            quantityBorrowed: borrow.quantity,
                            quantityReturned: borrow.quantityReturned || 0,
                            quantityDue: quantityDue,
                        });
                    }
                });
            });

            allDueItems.sort((a, b) => a.daysRemaining - b.daysRemaining);
            setDueItems(allDueItems);
            setFilteredItems(allDueItems);

        } catch (error) {
            console.error("Failed to load due items data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadDueItems();
        // Add listeners for changes to re-calculate
        window.addEventListener('storage', loadDueItems);
        return () => window.removeEventListener('storage', loadDueItems);
    }, [loadDueItems]);

    React.useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = dueItems.filter(item => {
            return (
                item.itemName.toLowerCase().includes(lowercasedFilter) ||
                item.borrowerName.toLowerCase().includes(lowercasedFilter) ||
                (item.borrowerRegdNum && item.borrowerRegdNum.toLowerCase().includes(lowercasedFilter))
            );
        });
        setFilteredItems(filtered);
    }, [searchTerm, dueItems]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const handleCardClick = (item: DueItem) => {
        router.push(`/inventory/${item.itemId}?transactionId=${item.transactionId}`);
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
                                placeholder="Filter by item or borrower..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full sm:w-64"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredItems.length === 0 ? (
                        <div className="text-center text-muted-foreground py-16">
                            <CalendarClock className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-xl font-semibold">No Borrowed Items</h3>
                            <p>There are no items currently marked as borrowed.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredItems.map(item => (
                                <Card key={item.transactionId} className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col" onClick={() => handleCardClick(item)}>
                                    <CardHeader className="flex-shrink-0">
                                        <div className="flex items-start gap-4">
                                            <Image 
                                                src={item.itemImageUrl}
                                                alt={item.itemName}
                                                width={64}
                                                height={64}
                                                className="rounded-lg border object-cover"
                                                data-ai-hint="product image"
                                            />
                                            <div className="flex-1">
                                                <CardTitle className="text-lg leading-tight">{item.itemName}</CardTitle>
                                                <CardDescription>
                                                    Borrowed by <span className="font-semibold text-foreground">{item.borrowerName}</span>
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 flex-1 flex flex-col justify-end">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-sm text-muted-foreground">Quantity Due</span>
                                            <span className="font-bold text-lg">
                                                <span className="text-primary">{item.quantityDue}</span>
                                                <span className="text-sm text-muted-foreground">/{item.quantityBorrowed}</span>
                                            </span>
                                        </div>
                                         <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Due Date</span>
                                            <Badge variant={item.daysRemaining < 0 ? "destructive" : item.daysRemaining < 3 ? "secondary" : "outline"}>
                                                {item.daysRemaining < 0 
                                                    ? `Overdue by ${Math.abs(item.daysRemaining)} days`
                                                    : item.daysRemaining === 0
                                                    ? 'Due Today'
                                                    : `Due in ${item.daysRemaining} days`
                                                }
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
