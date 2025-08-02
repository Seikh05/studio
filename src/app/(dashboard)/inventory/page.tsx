import type { InventoryItem } from '@/lib/types';
import { InventoryDataTable } from '@/components/inventory/inventory-data-table';
import { inventoryColumns } from '@/components/inventory/inventory-columns';

async function getInventoryData(): Promise<InventoryItem[]> {
  // In a real app, you'd fetch this from Firestore
  return [
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
}

export default async function InventoryPage() {
  const data = await getInventoryData();
  return <InventoryDataTable columns={inventoryColumns} data={data} />;
}
