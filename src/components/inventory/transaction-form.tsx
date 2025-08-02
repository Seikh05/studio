
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MinusCircle, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ItemTransaction } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { useTransition } from 'react';

const formSchema = z.object({
  type: z.enum(['borrow', 'return'], { required_error: 'You must select a transaction type.' }),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  borrowerName: z.string().optional(),
  borrowerRegdNum: z.string().optional(),
  returnDate: z.date().optional(),
  notes: z.string().optional(),
  reminder: z.boolean().default(false),
}).refine(data => data.type === 'return' || !!data.borrowerName, {
  message: "Borrower's name is required when borrowing an item.",
  path: ['borrowerName'],
});

type FormData = z.infer<typeof formSchema>;

interface TransactionFormProps {
  onSubmit: (data: Omit<ItemTransaction, 'id' | 'timestamp' | 'adminName' | 'returned'>) => void;
}

export function TransactionForm({ onSubmit }: TransactionFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'borrow',
            quantity: 1,
            borrowerName: '',
            borrowerRegdNum: '',
            notes: '',
            reminder: false,
        },
    });

    const transactionType = form.watch('type');

    function handleFormSubmit(values: FormData) {
        startTransition(() => {
            onSubmit({
                ...values,
                returnDate: values.returnDate ? values.returnDate.toISOString() : undefined,
            });
            form.reset();
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Transaction Type</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex items-center gap-6"
                                >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="borrow" />
                                        </FormControl>
                                        <Label className="font-normal flex items-center gap-2"><MinusCircle className="text-destructive"/> Borrow / Decrease</Label>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="return" />
                                        </FormControl>
                                        <Label className="font-normal flex items-center gap-2"><PlusCircle className="text-green-600"/> Return / Increase</Label>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid sm:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {transactionType === 'borrow' && (
                       <FormField
                            control={form.control}
                            name="returnDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Expected Return Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn(
                                                        'w-full pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                {transactionType === 'borrow' && (
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="borrowerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Borrower&apos;s Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="borrowerRegdNum"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Regd. Number (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 21051234" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}
                 <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="e.g. For the weekend robotics competition."
                            className="resize-none"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className='flex items-center justify-between'>
                    <FormField
                        control={form.control}
                        name="reminder"
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={transactionType === 'return'}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal text-sm !mt-0">Set Reminder</FormLabel>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isPending}>
                        {transactionType === 'borrow' ? 'Log Borrow' : 'Log Return'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
