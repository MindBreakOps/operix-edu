import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface OfflineAction {
  id: string;
  table: string;
  payload: any;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = useState<number>(0);

  // Sync queued actions to Supabase
  const syncOfflineData = useCallback(async () => {
	const queue: OfflineAction[] = JSON.parse(localStorage.getItem('opx_offline_queue') || '[]');
	if (queue.length === 0) return;

	for (const task of queue) {
	  try {
		if (task.action === 'INSERT') {
		  await supabase.from(task.table).insert(task.payload);
		} else if (task.action === 'UPDATE') {
		  await supabase.from(task.table).update(task.payload).eq('id', task.payload.id);
		}
		// Remove from queue after successful sync
		const currentQueue = JSON.parse(localStorage.getItem('opx_offline_queue') || '[]');
		localStorage.setItem('opx_offline_queue', JSON.stringify(currentQueue.filter((q: any) => q.id !== task.id)));
	  } catch (err) {
		console.error('Sync failed for task:', task, err);
	  }
	}
	setPendingSyncs(0);
  }, []);

  useEffect(() => {
	const handleOnline = () => {
	  setIsOnline(true);
	  syncOfflineData();
	};
	const handleOffline = () => setIsOnline(false);

	window.addEventListener('online', handleOnline);
	window.addEventListener('offline', handleOffline);

	// Initial check
	const initialQueue = JSON.parse(localStorage.getItem('opx_offline_queue') || '[]');
	setPendingSyncs(initialQueue.length);

	return () => {
	  window.removeEventListener('online', handleOnline);
	  window.removeEventListener('offline', handleOffline);
	};
  }, [syncOfflineData]);

  // Wrapper function to use instead of direct Supabase calls
  const executeOrQueue = async (table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
	if (isOnline) {
	  if (action === 'INSERT') await supabase.from(table).insert(payload);
	  if (action === 'UPDATE') await supabase.from(table).update(payload).eq('id', payload.id);
	} else {
	  const queue = JSON.parse(localStorage.getItem('opx_offline_queue') || '[]');
	  queue.push({ id: crypto.randomUUID(), table, action, payload, timestamp: Date.now() });
	  localStorage.setItem('opx_offline_queue', JSON.stringify(queue));
	  setPendingSyncs(queue.length);
	}
  };

  return { isOnline, pendingSyncs, executeOrQueue };
}