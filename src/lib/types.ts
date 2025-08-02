
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
  role: 'Admin' | 'Super Admin';
  status: 'Active' | 'Inactive';
  lastLogin: string;
  avatarUrl: string;
  password?: string;
};

export type LogEntry = {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  details: string;
};

export type ItemTransaction = {
  id: string;
  timestamp: string;
  type: 'borrow' | 'return';
  quantity: number;
  borrowerName?: string;
  borrowerRegdNum?: string;
  returnDate?: string;
  notes?: string;
  reminder: boolean;
  adminName: string;
  returned?: boolean;
  itemName?: string;
}

export type Category = {
  id: string;
  name: string;
}

// Re-exporting AI types to be used in client components
export type {
  ValidateDescriptionConsistencyInput,
  ValidateDescriptionConsistencyOutput,
} from '@/ai/flows/validate-description-consistency';
