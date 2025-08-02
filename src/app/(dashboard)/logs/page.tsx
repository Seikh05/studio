
'use client'

import * as React from 'react';
import type { LogEntry, User } from '@/lib/types';
import { LogsDataTable } from '@/components/logs/logs-data-table';
import { logsColumns } from '@/components/logs/logs-columns';
import { isSameDay, parseISO } from 'date-fns';
import { LoaderCircle } from 'lucide-react';

const LOGS_STORAGE_KEY = 'logs-data';
const LOGGED_IN_USER_KEY = 'logged-in-user';


export default function LogsPage() {
  const [allLogs, setAllLogs] = React.useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = React.useState<LogEntry[]>([]);
  const [isClient, setIsClient] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showHidden, setShowHidden] = React.useState(false);


  const loadLogs = React.useCallback(() => {
    try {
      const storedData = window.localStorage.getItem(LOGS_STORAGE_KEY);
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
  }, []);
  
  React.useEffect(() => {
    setIsClient(true)
    try {
        const storedUser = window.localStorage.getItem(LOGGED_IN_USER_KEY);
        if(storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Failed to get current user from localStorage", error);
    }
    loadLogs();
    setIsLoading(false);
  }, [loadLogs])
  
  React.useEffect(() => {
    if (isClient) {
      const handleStorageChange = () => {
        loadLogs();
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('logs-updated', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('logs-updated', handleStorageChange);
      };
    }
  }, [isClient, loadLogs]);

  React.useEffect(() => {
    // Filter by visibility first
    const visibleLogs = showHidden ? allLogs : allLogs.filter(log => !log.isHidden);
    
    // Then filter by date
    if (!selectedDate) {
      setFilteredLogs(visibleLogs);
    } else {
      const dateFiltered = visibleLogs.filter(log => isSameDay(parseISO(log.timestamp), selectedDate));
      setFilteredLogs(dateFiltered);
    }
  }, [selectedDate, allLogs, showHidden]);
  
  if (!isClient || isLoading) {
    return (
        <div className="flex items-center justify-center h-full">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return <LogsDataTable 
            columns={logsColumns} 
            data={filteredLogs} 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate}
            currentUser={currentUser}
            onLogsChange={loadLogs}
            showHidden={showHidden}
            onShowHiddenChange={setShowHidden}
        />;
}
