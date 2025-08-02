'use client'

import * as React from 'react';
import type { LogEntry } from '@/lib/types';
import { LogsDataTable } from '@/components/logs/logs-data-table';
import { logsColumns } from '@/components/logs/logs-columns';
import { isSameDay, parseISO } from 'date-fns';

const STORAGE_KEY = 'logs-data';

export default function LogsPage() {
  const [allLogs, setAllLogs] = React.useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = React.useState<LogEntry[]>([]);
  const [isClient, setIsClient] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  React.useEffect(() => {
    if (isClient) {
      const handleStorageChange = () => {
        try {
          const storedData = window.localStorage.getItem(STORAGE_KEY);
          if (storedData) {
            const logs: LogEntry[] = JSON.parse(storedData)
            logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setAllLogs(logs);
          } else {
            setAllLogs([]);
          }
        } catch (error) {
          console.error("Failed to access localStorage", error);
          setAllLogs([]);
        }
      };

      handleStorageChange();

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('logs-updated', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('logs-updated', handleStorageChange);
      };
    }
  }, [isClient]);

  React.useEffect(() => {
    if (!selectedDate) {
      setFilteredLogs(allLogs);
    } else {
      const filtered = allLogs.filter(log => isSameDay(parseISO(log.timestamp), selectedDate));
      setFilteredLogs(filtered);
    }
  }, [selectedDate, allLogs]);
  
  if (!isClient) {
    return <LogsDataTable columns={logsColumns} data={[]} selectedDate={selectedDate} onDateChange={setSelectedDate} />;
  }

  return <LogsDataTable columns={logsColumns} data={filteredLogs} selectedDate={selectedDate} onDateChange={setSelectedDate} />;
}
