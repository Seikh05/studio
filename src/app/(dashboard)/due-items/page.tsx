
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';

export default function DueItemsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Borrowed Items</CardTitle>
                    <CardDescription>All items currently borrowed, sorted by the nearest due date.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground py-16">
                <CalendarClock className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">No Borrowed Items</h3>
                <p>There are no items currently marked as borrowed.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
