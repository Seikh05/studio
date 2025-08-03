

export const initialInventory: InventoryItem[] = [
    {
      id: "ITEM-8782",
      name: "Quantum Flux-o-Matic",
      category: "Gadgets",
      status: "In Stock",
      stock: 120,
      description: "A state-of-the-art device that manipulates quantum fields. Perfect for time-travel enthusiasts and hobbyists.",
      imageUrl: "https://placehold.co/80x80.png",
      lastUpdated: "2024-07-28",
    },
    {
      id: "ITEM-7472",
      name: "Robo-Companion X1",
      category: "Robotics",
      status: "Low Stock",
      stock: 15,
      description: "Your new best friend, built with advanced AI and a durable titanium alloy frame. Can do chores.",
      imageUrl: "https://placehold.co/80x80.png",
      lastUpdated: "2024-07-27",
    },
    {
      id: "ITEM-3634",
      name: "Anti-Gravity Boots",
      category: "Apparel",
      status: "In Stock",
      stock: 55,
      description: "Defy gravity with these stylish and functional boots. Features magnetic-locking and a 2-hour flight time.",
      imageUrl: "https://placehold.co/80x80.png",
      lastUpdated: "2024-07-28",
    },
    {
      id: "ITEM-9382",
      name: "Neutron-Star Power Core",
      category: "Power Sources",
      status: "Out of Stock",
      stock: 0,
      description: "Miniature power core harnessing the energy of a neutron star. Handle with extreme caution. Powers a small city.",
      imageUrl: "https://placehold.co/80x80.png",
      lastUpdated: "2024-06-15",
    },
    {
      id: "ITEM-1123",
      name: "Holographic Projector 3000",
      category: "Gadgets",
      status: "In Stock",
      stock: 80,
      description: "Create stunning 3D holographic displays with this compact and powerful projector. Supports 16K resolution.",
      imageUrl: "https://placehold.co/80x80.png",
      lastUpdated: "2024-07-20",
    },
  ];


export const initialUsers: User[] = [
    {
      id: 'USR-001',
      name: 'Alice Johnson',
      email: 'superadmin@example.com',
      password: 'password123',
      role: 'Super Admin',
      status: 'Active',
      lastLogin: '2024-07-28T10:00:00Z',
      avatarUrl: 'https://placehold.co/40x40.png',
      phone: '9876543210',
      regdNum: '21050001',
    },
    {
      id: 'USR-002',
      name: 'Bob Williams',
      email: 'admin@example.com',
      password: 'password123',
      role: 'Admin',
      status: 'Active',
      lastLogin: '2024-07-27T15:30:00Z',
      avatarUrl: 'https://placehold.co/40x40.png',
      phone: '9876543211',
      regdNum: '21050002',
    },
    {
      id: 'USR-003',
      name: 'Charlie Brown',
      email: 'charlie.b@example.com',
      password: 'password123',
      role: 'Admin',
      status: 'Inactive',
      lastLogin: '2024-06-01T12:00:00Z',
      avatarUrl: 'https://placehold.co/40x40.png',
      phone: '',
      regdNum: '',
    },
     {
      id: 'USR-004',
      name: 'Diana Prince',
      email: 'diana.p@example.com',
      password: 'password123',
      role: 'Admin',
      status: 'Active',
      lastLogin: '2024-07-29T08:00:00Z',
      avatarUrl: 'https://placehold.co/40x40.png',
      regdNum: '21050003',
      phone: '',
    },
    {
      id: 'USR-005',
      name: 'Seikh Mustakim',
      email: 'seikhsouvagyamustakim@gmail.com',
      password: 'password123',
      role: 'Super Admin',
      status: 'Active',
      lastLogin: new Date().toISOString(),
      avatarUrl: 'https://placehold.co/40x40.png',
      phone: '1234567890',
      regdNum: '',
    },
    {
      id: 'USR-SA-001',
      name: 'Super Admin',
      email: 'superadmin@robo.com',
      password: 'superadmin@1234',
      role: 'Super Admin',
      status: 'Active',
      lastLogin: new Date().toISOString(),
      avatarUrl: 'https://placehold.co/40x40.png',
      phone: '0000000000',
      regdNum: '',
    },
];

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
  role: 'Admin' | 'Super Admin' | 'General Member' | 'New User';
  status: 'Active' | 'Inactive';
  lastLogin: string;
  avatarUrl: string;
  password?: string;
  phone: string;
  regdNum: string;
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
