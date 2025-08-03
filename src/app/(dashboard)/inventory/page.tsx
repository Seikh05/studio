
'use client';

import * as React from 'react';
import { InventoryDataTable } from '@/components/inventory/inventory-data-table';
import { inventoryColumns } from '@/components/inventory/inventory-columns';
import { initialInventory, initialUsers, User, InventoryItem, LogEntry, Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { ItemForm } from '@/components/inventory/item-form';
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
import { CategoryManager } from '@/components/inventory/category-manager';


const INVENTORY_STORAGE_KEY = 'inventory-data';
const CATEGORY_STORAGE_KEY = 'category-data';
const LOGS_STORAGE_KEY = 'logs-data';
const LOGGED_IN_USER_KEY = 'logged-in-user';

const defaultCategories: Category[] = [
    { id: 'cat-1', name: 'Gadgets' },
    { id: 'cat-2', name: 'Robotics' },
    { id: 'cat-3', name: 'Apparel' },
    { id: 'cat-4', name: 'Power Sources' },
    { id: 'cat-5', name: 'Other' },
];

export default function InventoryPage() {
    const { toast } = useToast();
    const [isClient, setIsClient] = React.useState(false);
    const [data, setData] = React.useState<InventoryItem[]>([]);
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);

    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [itemToDelete, setItemToDelete] = React.useState<InventoryItem | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = React.useState("");

    const [categories, setCategories] = React.useState<Category[]>(defaultCategories);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = React.useState(false);

    const loadData = React.useCallback(() => {
        try {
            // Load inventory
            const storedInventory = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
            if (storedInventory) {
                setData(JSON.parse(storedInventory));
            } else {
                setData(initialInventory);
                window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(initialInventory));
            }

            // Load categories
            const storedCategories = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
            if (storedCategories) {
                setCategories(JSON.parse(storedCategories));
            } else {
                setCategories(defaultCategories);
                window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(defaultCategories));
            }

            // Load current user
            const storedCurrentUser = window.localStorage.getItem(LOGGED_IN_USER_KEY);
            if (storedCurrentUser) {
                setCurrentUser(JSON.parse(storedCurrentUser));
            }

        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not load inventory data." });
        }
    }, [toast]);

    React.useEffect(() => {
        setIsClient(true);
        loadData();
    }, [loadData]);
    
    // Custom event listener for when inventory data is updated elsewhere
    React.useEffect(() => {
        const handleDataChanges = () => loadData();
        window.addEventListener('storage', handleDataChanges);
        window.addEventListener('inventory-updated', handleDataChanges);
        return () => {
            window.removeEventListener('storage', handleDataChanges);
            window.removeEventListener('inventory-updated', handleDataChanges);
        }
    }, [loadData]);


    const addLogEntry = (action: string, details: string) => {
        if (!currentUser) return;
        const newLog: LogEntry = {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            adminName: currentUser.name,
            action: action,
            details: details,
        };
        try {
            const logsRaw = window.localStorage.getItem(LOGS_STORAGE_KEY);
            const logs: LogEntry[] = logsRaw ? JSON.parse(logsRaw) : [];
            logs.unshift(newLog); // Add to the beginning
            window.localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
            window.dispatchEvent(new Event('logs-updated')); // Notify other components
        } catch (error) {
            console.error("Failed to add log entry", error);
        }
    };


    const openForm = (item: InventoryItem | null) => {
        setSelectedItem(item);
        setIsFormOpen(true);
    };

    const openDeleteDialog = (item: InventoryItem) => {
        setItemToDelete(item);
        setDeleteConfirmText("");
        setIsDeleteDialogOpen(true);
    }
    
    const handleDeleteItem = () => {
        if (!itemToDelete) return;
        try {
            const updatedInventory = data.filter(i => i.id !== itemToDelete.id);
            setData(updatedInventory);
            window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedInventory));
            
            addLogEntry("Item Deleted", `Item "${itemToDelete.name}" (${itemToDelete.id}) was deleted.`);

            toast({ title: "Item Deleted", description: `"${itemToDelete.name}" has been removed from inventory.` });
        } catch (error) {
            console.error("Failed to delete item:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not remove item." });
        } finally {
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const handleSaveItem = (itemData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'status'> & { stockUpdateNote?: string }) => {
        try {
            let updatedInventory;
            if (selectedItem) {
                // Editing existing item
                const oldStock = selectedItem.stock;
                updatedInventory = data.map(i => 
                    i.id === selectedItem.id ? { 
                        ...selectedItem, 
                        ...itemData,
                        lastUpdated: new Date().toISOString(),
                        status: itemData.stock > 0 ? (itemData.stock < 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock'
                    } : i
                );
                
                let logDetails = `Item "${itemData.name}" (${selectedItem.id}) was updated.`;
                if (itemData.stock !== oldStock && itemData.stockUpdateNote) {
                    logDetails += ` Stock changed from ${oldStock} to ${itemData.stock}. Note: ${itemData.stockUpdateNote}`;
                }
                addLogEntry("Item Updated", logDetails);

                toast({ title: "Item Updated", description: "Item details have been saved." });
            } else {
                // Adding new item
                const newItem: InventoryItem = {
                    ...itemData,
                    id: `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
                    status: itemData.stock > 0 ? (itemData.stock < 20 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
                    lastUpdated: new Date().toISOString(),
                };
                updatedInventory = [newItem, ...data];
                
                let logDetails = `Item "${newItem.name}" (${newItem.id}) was added with stock ${newItem.stock}.`;
                if (itemData.stockUpdateNote) {
                     logDetails += ` Note: ${itemData.stockUpdateNote}`;
                }
                addLogEntry("Item Added", logDetails);

                toast({ title: "Item Added", description: "The new item has been created." });
            }
            setData(updatedInventory);
            window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedInventory));
            window.dispatchEvent(new Event('inventory-updated'));
            setIsFormOpen(false);
            setSelectedItem(null);
        } catch (error) {
            console.error("Failed to save item:", error);
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not save item data." });
        }
    };
    
    const handleSaveCategories = (updatedCategories: Category[]) => {
        try {
            setCategories(updatedCategories);
            window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(updatedCategories));
            addLogEntry("Categories Updated", `The list of item categories was modified.`);
            toast({ title: "Categories Saved", description: "Your category list has been updated." });
        } catch (error) {
            console.error("Failed to save categories:", error);
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not save category data." });
        }
    }


    if (!isClient) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
  return (
    <>
      <ItemForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={selectedItem}
        onSave={handleSaveItem}
        categories={categories}
        inventory={data}
        openEditForm={openForm}
      />
      <CategoryManager 
        isOpen={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
        categories={categories}
        onSave={handleSaveCategories}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete <strong>{itemToDelete?.name}</strong> and all its transaction history. This action cannot be undone. Type "delete" to confirm.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
                <Label htmlFor="confirm-delete-input" className="sr-only">Confirm Delete</Label>
                <Input 
                    id="confirm-delete-input"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder='Type "delete" to proceed'
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={handleDeleteItem}
                    disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                    className="bg-destructive hover:bg-destructive/90"
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Confirm Deletion
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <InventoryDataTable 
        columns={inventoryColumns} 
        data={data}
        currentUser={currentUser}
        onOpenForm={openForm}
        onOpenDeleteDialog={openDeleteDialog}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
      />
    </>
  )
}
