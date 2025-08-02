import type { LogEntry } from '@/lib/types';
import { LogsDataTable } from '@/components/logs/logs-data-table';
import { logsColumns } from '@/components/logs/logs-columns';

async function getLogsData(): Promise<LogEntry[]> {
  // In a real app, you'd fetch this from Firestore
  return [
    {
      id: 'LOG-001',
      timestamp: '2024-07-28T10:05:00Z',
      adminName: 'Alice Johnson',
      adminAvatar: 'https://placehold.co/40x40.png',
      action: 'Item Updated',
      details: 'Changed stock of "Quantum Flux-o-Matic" from 100 to 120.',
    },
    {
      id: 'LOG-002',
      timestamp: '2024-07-28T09:45:00Z',
      adminName: 'Alice Johnson',
      adminAvatar: 'https://placehold.co/40x40.png',
      action: 'Item Added',
      details: 'Added new item "Anti-Gravity Boots".',
    },
    {
      id: 'LOG-003',
      timestamp: '2024-07-27T15:32:00Z',
      adminName: 'Bob Williams',
      adminAvatar: 'https://placehold.co/40x40.png',
      action: 'Category Changed',
      details: 'Changed category of "Robo-Companion X1" to "Robotics".',
    },
    {
      id: 'LOG-004',
      timestamp: '2024-07-26T11:00:00Z',
      adminName: 'Alice Johnson',
      adminAvatar: 'https://placehold.co/40x40.png',
      action: 'User Added',
      details: 'Added new admin "Diana Prince".',
    },
     {
      id: 'LOG-005',
      timestamp: '2024-07-25T18:20:00Z',
      adminName: 'Bob Williams',
      adminAvatar: 'https://placehold.co/40x40.png',
      action: 'Item Stock Changed',
      details: 'Updated stock of "Robo-Companion X1" to 15.',
    },
  ];
}

export default async function LogsPage() {
  const data = await getLogsData();
  return <LogsDataTable columns={logsColumns} data={data} />;
}
