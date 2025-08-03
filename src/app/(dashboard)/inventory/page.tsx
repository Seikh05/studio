import type { InventoryItem } from '@/lib/types';
import { InventoryDataTable } from '@/components/inventory/inventory-data-table';
import { inventoryColumns } from '@/components/inventory/inventory-columns';
import { redirect } from 'next/navigation';
import { initialInventory } from '@/lib/types';


async function getInventoryData(): Promise<InventoryItem[]> {
  // In a real app, you'd fetch this from a database like Firestore.
  // For now, we'll use the hardcoded initial data.
  return initialInventory;
}

export default async function InventoryPage({ params }: { params: { id?: string } }) {
  if (params.id) {
    redirect(`/inventory/${params.id}`);
  }
  const data = await getInventoryData();
  return <InventoryDataTable columns={inventoryColumns} data={data} />;
}
