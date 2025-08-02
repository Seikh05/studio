

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
import type { ItemTransaction, User } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { useTransition, useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  type: z.enum(['borrow', 'return'], { required_error: 'You must select a transaction type.' }),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  borrowerName: z.string().optional(),
  borrowerRegdNum: z.string().optional(),
  borrowerPhone: z.string().optional(),
  returnDate: z.date().optional(),
  notes: z.string().optional(),
  reminder: z.boolean().default(false),
  borrowerId: z.string().optional(), // Holds user ID or "other"
}).refine(data => {
    if (data.type !== 'borrow') return true;
    return (data.borrowerId !== 'other' && data.borrowerId) || (data.borrowerId === 'other' && data.borrowerName && data.borrowerName.length > 0)
}, {
    message: "Borrower's name is required when borrowing an item.",
    path: ['borrowerName'],
}).refine(data => {
    if (data.type !== 'borrow') return true;
    return !!data.borrowerPhone && data.borrowerPhone.length > 0;
}, {
    message: "Borrower's phone number is required when borrowing an item.",
    path: ['borrowerPhone'],
}).refine(data => data.type === 'return' || !!data.returnDate, {
  message: "Expected return date is required when borrowing an item.",
  path: ['returnDate'],
});


type FormData = z.infer<typeof formSchema>;

interface TransactionFormProps {
  onSubmit: (data: Omit<ItemTransaction, 'id' | 'timestamp' | 'adminName' | 'isSettled' | 'quantityReturned'>) => void;
}

const USER_STORAGE_KEY = 'user-data';

export function TransactionForm({ onSubmit }: TransactionFormProps) {
    const [isPending, startTransition] = useTransition();
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        try {
            const storedData = window.localStorage.getItem(USER_STORAGE_KEY);
            if(storedData) {
                setUsers(JSON.parse(storedData));
            }
        } catch (error) {
            console.error("Failed to load users from storage", error);
        }
    }, [])

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'borrow',
            quantity: 1,
            borrowerName: '',
            borrowerRegdNum: '',
            borrowerPhone: '',
            notes: '',
            reminder: false,
            borrowerId: '',
        },
    });

    const transactionType = form.watch('type');
    const borrowerId = form.watch('borrowerId');
    const showManualBorrowerFields = borrowerId === 'other';

    function handleFormSubmit(values: FormData) {
        startTransition(() => {
            const finalValues = {...values};
            
            // If a registered user was selected, set their name for the transaction record
            if (finalValues.borrowerId && finalValues.borrowerId !== 'other') {
                const selectedUser = users.find(u => u.id === finalValues.borrowerId);
                if (selectedUser) {
                    finalValues.borrowerName = selectedUser.name;
                }
            }

            onSubmit({
                ...finalValues,
                returnDate: values.returnDate ? values.returnDate.toISOString() : undefined,
            });
            form.reset({
                ...form.getValues(),
                type: values.type, // Keep the selected type
                quantity: 1,
                borrowerName: '',
                borrowerRegdNum: '',
                borrowerPhone: '',
                notes: '',
                returnDate: undefined,
                borrowerId: '',
            });
        });
    }

    const handleBorrowerChange = (id: string) => {
        form.setValue('borrowerId', id);
        if (id !== 'other') {
            const selectedUser = users.find(u => u.id === id);
            if (selectedUser) {
                form.setValue('borrowerName', selectedUser.name);
                form.setValue('borrowerPhone', selectedUser.phone || '');
            }
        } else {
            form.setValue('borrowerName', '');
            form.setValue('borrowerPhone', '');
        }
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
                                            <RadioGroupItem value="return" disabled />
                                        </FormControl>
                                        <Label className="font-normal flex items-center gap-2 text-muted-foreground/50"><PlusCircle className="text-muted-foreground/50"/> Return / Increase</Label>
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
                    <>
                         <FormField
                            control={form.control}
                            name="borrowerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Borrower</FormLabel>
                                    <Select onValueChange={handleBorrowerChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a registered user or 'Other'" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>{user.name} ({user.role})</SelectItem>
                                        ))}
                                        <SelectItem value="other">Other...</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {showManualBorrowerFields && (
                            <div className="grid sm:grid-cols-2 gap-4 border p-4 rounded-md">
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
                                            <FormLabel>Registration Number (Optional)</FormLabel>
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
                            name="borrowerPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="e.g. 9876543210" 
                                            {...field}
                                            disabled={borrowerId !== 'other'}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
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
                    <Button type="submit" disabled={isPending || transactionType === 'return'}>
                        Log Borrow
                    </Button>
                </div>
            </form>
        </Form>
    );
}
