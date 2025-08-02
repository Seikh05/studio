'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, LoaderCircle } from 'lucide-react';
import type { Category } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Category name cannot be empty.'),
});

const formSchema = z.object({
  categories: z.array(categorySchema),
});

type FormData = z.infer<typeof formSchema>;

interface CategoryManagerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  categories: Category[];
  onSave: (categories: Category[]) => void;
}

export function CategoryManager({ isOpen, onOpenChange, categories, onSave }: CategoryManagerProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categories: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'categories',
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({ categories });
    }
  }, [isOpen, categories, form]);

  const onSubmit = (data: FormData) => {
    setIsSaving(true);
    // Check for duplicate names
    const names = data.categories.map(c => c.name.toLowerCase().trim());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Categories',
        description: 'Category names must be unique.',
      });
      setIsSaving(false);
      return;
    }
    
    onSave(data.categories);
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleAddCategory = () => {
    append({ id: `new-cat-${Date.now()}`, name: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>Add, rename, or delete your item categories.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-72 pr-4">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`categories.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="sr-only">Category Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Category name..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Category</span>
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <Button type="button" variant="outline" className="w-full" onClick={handleAddCategory}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
            </Button>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
