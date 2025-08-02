

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stock: number;
  description: string;
  imageUrl: string;
  lastUpdated: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Super Admin' | 'General Member';
  status: 'Active' | 'Inactive';
  lastLogin: string;
  avatarUrl: string;
  password?: string;
  phone?: string;
  regdNum?: string;
};

export type LogEntry = {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  details: string;
  isHidden?: boolean;
};

export type ItemTransaction = {
  id: string;
  timestamp: string;
  type: 'borrow' | 'return';
  quantity: number;
  borrowerName?: string;
  borrowerRegdNum?: string;
  borrowerPhone?: string;
  returnDate?: string;
  notes?: string;
  reminder: boolean;
  adminName: string;
  isSettled?: boolean; // For borrow transactions: true if fully returned
  quantityReturned?: number; // For borrow transactions
  relatedBorrowId?: string; // For return transactions
  itemName?: string;
}

export type Category = {
  id: string;
  name: string;
}

export type Notification = {
  id: string;
  itemId: string;
  transactionId: string;
  message: string;
  dueDate: string;
  isRead: boolean;
  createdAt: string;
};

export type DueItem = {
  transactionId: string;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  borrowerName: string;
  borrowerRegdNum?: string;
  borrowerPhone?: string;
  returnDate: string;
  daysRemaining: number;
  quantityBorrowed: number;
  quantityReturned: number;
  quantityDue: number;
}


// Re-exporting AI types to be used in client components
export type {
  ValidateDescriptionConsistencyInput,
  ValidateDescriptionConsistencyOutput,
} from '@/ai/flows/validate-description-consistency';
