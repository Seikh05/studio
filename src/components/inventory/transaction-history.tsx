
'use client'

import * as React from 'react'
import { format, formatRelative } from 'date-fns'
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Bell, Calendar, CheckCircle, CircleDot, Undo2 } from 'lucide-react'
import type { ItemTransaction } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from '../ui/avatar'
import { useRouter } from 'next/navigation'


interface TransactionHistoryProps {
  transactions: ItemTransaction[]
  onReturn?: (transaction: ItemTransaction) => void;
  highlightedTransactionId?: string | null;
}

export function TransactionHistory({ transactions, onReturn, highlightedTransactionId }: TransactionHistoryProps) {
  const itemRefs = React.useRef<Map<string, HTMLLIElement | null>>(new Map());
  const router = useRouter();

  React.useEffect(() => {
    if (highlightedTransactionId) {
      const node = itemRefs.current.get(highlightedTransactionId);
      if (node) {
        node.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        node.classList.add('bg-primary/10', 'ring-2', 'ring-primary/50');
        setTimeout(() => {
          node.classList.remove('bg-primary/10', 'ring-2', 'ring-primary/50');
        }, 3000); // Highlight for 3 seconds
      }
    }
  }, [highlightedTransactionId, transactions]);


  if (transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <AlertCircle className="mx-auto h-10 w-10 mb-2" />
        <p>No transaction history for this item yet.</p>
      </div>
    )
  }

  const getTransactionTitle = (transaction: ItemTransaction) => {
    const byAdmin = `by ${transaction.adminName}`;
    const itemName = transaction.itemName || 'Item'; // Fallback for item name

    // Handle Borrow Transactions
    if (transaction.type === 'borrow') {
        let borrowerInfo = transaction.borrowerName || 'Unknown Borrower';
        if (transaction.borrowerRegdNum) borrowerInfo += ` (${transaction.borrowerRegdNum})`;
        
        let title;
        // Check if it's a dashboard view or item detail view
        if (transaction.itemId) { // Means it's from dashboard
            title = (
                <>
                    <span className="cursor-pointer hover:underline font-semibold" onClick={() => router.push(`/inventory/${transaction.itemId}`)}>
                        {itemName}
                    </span>
                    {` borrowed by ${borrowerInfo} (approved ${byAdmin})`}
                </>
            );
        } else { // Item detail view
            title = `Borrowed by ${borrowerInfo} (approved ${byAdmin})`;
        }
        return <span>{title}</span>;
    }
    
    // Handle Return Transactions
    let returnTitle = transaction.itemName ? `${itemName} returned to stock` : 'Item returned to stock';
    if (transaction.borrowerName) {
      returnTitle += ` from ${transaction.borrowerName}`;
    }
    if (transaction.relatedBorrowId) {
        returnTitle += ` (Ref: ${transaction.relatedBorrowId.substring(0,8)}...)`;
    }
    returnTitle += ` (logged ${byAdmin})`;
    
    if (transaction.itemId) {
        return (
             <span className="cursor-pointer hover:underline" onClick={() => router.push(`/inventory/${transaction.itemId}`)}>
                {returnTitle}
            </span>
        );
    }
    
    return <span>{returnTitle}</span>;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  return (
    <TooltipProvider>
      <div className="flow-root">
        <ul role="list" className="-mb-8">
          {transactions.map((transaction, transactionIdx) => (
            <li 
                key={transaction.id} 
                ref={node => {
                    if (node) {
                      itemRefs.current.set(transaction.id, node);
                    } else {
                      itemRefs.current.delete(transaction.id);
                    }
                }}
                className="rounded-lg transition-colors duration-1000 -m-2 p-2"
            >
              <div className="relative pb-8">
                {transactionIdx !== transactions.length - 1 ? (
                  <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                ) : null}
                <div className="relative flex items-start space-x-3">
                  <div>
                    <div
                      className={cn(
                        'relative px-1',
                        transaction.type === 'borrow' ? 'bg-destructive/10' : 'bg-green-100 dark:bg-green-900',
                        'rounded-full ring-4 ring-background flex items-center justify-center h-10 w-10'
                      )}
                    >
                      {transaction.type === 'borrow' ? (
                        <ArrowDownLeft className="h-5 w-5 text-destructive" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm">
                        <div className="font-medium text-foreground">
                         {getTransactionTitle(transaction)}
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatRelative(new Date(transaction.timestamp), new Date())}
                      </p>
                    </div>
                    <div className="mt-2 text-sm text-foreground">
                      <p>
                        <span className={cn("font-semibold", transaction.type === 'borrow' ? "text-destructive" : "text-green-600 dark:text-green-400")}>
                          {transaction.type === 'borrow' ? '-' : '+'}
                          {transaction.quantity}
                        </span>
                        {transaction.notes && <span className="text-muted-foreground ml-2 italic"> &quot;{transaction.notes}&quot;</span>}
                      </p>
                    </div>
                    {transaction.type === 'borrow' && (
                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {transaction.isSettled ? (
                                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>All {transaction.quantity} items returned</span>
                                </div>
                            ) : (
                                <>
                                 {transaction.returnDate && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>Due by {format(new Date(transaction.returnDate), 'MMM d, yyyy')}</span>
                                    </div>
                                    )}
                                    {transaction.reminder && (
                                    <div className="flex items-center gap-1 text-primary font-medium">
                                        <Bell className="h-3 w-3" />
                                        <span>Reminder set</span>
                                    </div>
                                    )}
                                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500 font-medium">
                                        <CircleDot className="h-4 w-4" />
                                        <span>{transaction.quantity - (transaction.quantityReturned || 0)} of {transaction.quantity} due</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 self-center flex items-center gap-2">
                      {onReturn && transaction.type === 'borrow' && !transaction.isSettled && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onReturn(transaction)}>
                                <Undo2 className="h-4 w-4" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Log a Return</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className='h-6 w-6'>
                            <AvatarFallback className='text-[10px]'>
                                {getInitials(transaction.adminName)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Logged by {transaction.adminName}</p>
                        </TooltipContent>
                      </Tooltip>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </TooltipProvider>
  )
}
