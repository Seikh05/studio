'use client'

import * as React from 'react'
import { format, formatRelative } from 'date-fns'
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Bell, Calendar } from 'lucide-react'
import type { ItemTransaction } from '@/lib/types'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface TransactionHistoryProps {
  transactions: ItemTransaction[]
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <AlertCircle className="mx-auto h-10 w-10 mb-2" />
        <p>No transaction history for this item yet.</p>
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {transactions.map((transaction, transactionIdx) => (
          <li key={transaction.id}>
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
                      <p className="font-medium text-foreground">
                        {transaction.type === 'borrow'
                          ? `Borrowed by ${transaction.borrowerName}`
                          : 'Returned to stock'}
                      </p>
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
                   {transaction.type === 'borrow' && (transaction.returnDate || transaction.reminder) && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      {transaction.returnDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Return by {format(new Date(transaction.returnDate), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {transaction.reminder && (
                        <div className="flex items-center gap-1 text-primary font-medium">
                          <Bell className="h-3 w-3" />
                          <span>Reminder set</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                 <div className="flex-shrink-0 self-center">
                    <Image
                        src={transaction.adminAvatar}
                        alt={transaction.adminName}
                        width={24}
                        height={24}
                        className="rounded-full"
                        title={`Logged by ${transaction.adminName}`}
                        data-ai-hint="person avatar"
                    />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
