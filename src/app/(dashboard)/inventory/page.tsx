
import { InventoryDataTable } from '@/components/inventory/inventory-data-table';
import { inventoryColumns } from '@/components/inventory/inventory-columns';
import { initialInventory } from '@/lib/types';

// This is now a Server Component. It fetches data on the server.
export default async function InventoryPage() {
  // Data is now sourced directly from the hardcoded list.
  const data = initialInventory;
  return <InventoryDataTable columns={inventoryColumns} data={data} />;
}
