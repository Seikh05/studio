import type { InventoryItem } from '@/lib/types';
import { InventoryDataTable } from '@/components/inventory/inventory-data-table';
import { inventoryColumns } from '@/components/inventory/inventory-columns';
import { initialInventory } from '@/lib/types';


async function getInventoryData(): Promise<InventoryItem[]> {
  // In a real app, you'd fetch this from a database like Firestore.
  // For now, we'll use the hardcoded initial data.
  // This function is async to simulate a real data fetch.
  return Promise.resolve(initialInventory);
}

export default async function InventoryPage() {
  const data = await getInventoryData();
  return <InventoryDataTable columns={inventoryColumns} data={data} />;
}
