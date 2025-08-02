'use client'

import * as React from 'react';
import type { LogEntry } from '@/lib/types';
import { LogsDataTable } from '@/components/logs/logs-data-table';
import { logsColumns } from '@/components/logs/logs-columns';

const STORAGE_KEY = 'logs-data';

export default function LogsPage() {
  const [data, setData] = React.useState<LogEntry[]>([]);
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  React.useEffect(() => {
    if (isClient) {
      const handleStorageChange = () => {
        try {
          const storedData = window.localStorage.getItem(STORAGE_KEY);
          if (storedData) {
            setData(JSON.parse(storedData));
          } else {
            setData([]);
          }
        } catch (error) {
          console.error("Failed to access localStorage", error);
          setData([]);
        }
      };

      handleStorageChange(); // Initial load

      // Listen for changes from other tabs/windows
      window.addEventListener('storage', handleStorageChange);

      // Listen for custom event for same-tab updates
      window.addEventListener('logs-updated', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('logs-updated', handleStorageChange);
      };
    }
  }, [isClient]);
  
  if (!isClient) {
    // Render a placeholder or loading state on the server
    return <LogsDataTable columns={logsColumns} data={[]} />;
  }

  return <LogsDataTable columns={logsColumns} data={data} />;
}
