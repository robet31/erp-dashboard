// src/lib/sync-queue.ts
// Sync queue untuk menyimpan operasi saat offline dan sync saat online

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  doctype: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
}

const SYNC_QUEUE_KEY = 'erp_sync_queue';

export function getSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
}

export function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'status'>): void {
  const queue = getSyncQueue();
  queue.push({
    ...item,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    status: 'pending',
  });
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromSyncQueue(id: string): void {
  const queue = getSyncQueue().filter(item => item.id !== id);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function clearSyncQueue(): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
}

export function getPendingCount(): number {
  return getSyncQueue().filter(item => item.status === 'pending').length;
}
