// src/hooks/useSync.ts
// Hook untuk auto-sync data ke Frappe

import { useEffect, useCallback, useState } from 'react';
import { getSyncQueue, removeFromSyncQueue, getPendingCount } from '@/lib/sync-queue';
import { apiCreate, apiUpdate, apiDelete } from '@/lib/api';

export function useSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const updatePendingCount = useCallback(() => {
    setPendingCount(getPendingCount());
  }, []);

  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  const syncItem = async (item: any): Promise<{ success: boolean; skip: boolean }> => {
    try {
      switch (item.action) {
        case 'create':
          await apiCreate(item.doctype, item.data);
          return { success: true, skip: false };
        case 'update':
          await apiUpdate(item.doctype, item.data.name, item.data);
          return { success: true, skip: false };
        case 'delete':
          await apiDelete(item.doctype, item.data.name);
          return { success: true, skip: false };
        default:
          return { success: false, skip: true };
      }
    } catch (err: any) {
      const errorMsg = err?.message || '';
      
      // If item not found in Frappe, skip it (doesn't exist in ERP)
      if (errorMsg.includes('not found') || errorMsg.includes('NotFound') || errorMsg.includes('404')) {
        console.warn(`Skipping sync for ${item.doctype}: item not in ERP (${errorMsg})`);
        return { success: false, skip: true }; // Skip - don't retry
      }
      
      // Network or auth error - will retry later
      console.warn(`Sync failed for ${item.doctype}, will retry:`, errorMsg);
      return { success: false, skip: false }; // Retry later
    }
  };

  const syncAll = useCallback(async () => {
    const queue = getSyncQueue();
    const pendingItems = queue.filter(item => item.status === 'pending');
    
    if (pendingItems.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;
    let skipCount = 0;

    for (const item of pendingItems) {
      const result = await syncItem(item);
      if (result.success) {
        removeFromSyncQueue(item.id);
        successCount++;
      } else if (result.skip) {
        removeFromSyncQueue(item.id); // Remove skipped items
        skipCount++;
      }
    }

    setLastSync(new Date().toISOString());
    updatePendingCount();
    setIsSyncing(false);

    if (successCount > 0 || skipCount > 0) {
      const msg = [];
      if (successCount > 0) msg.push(`✅ ${successCount} sync成功`);
      if (skipCount > 0) msg.push(`⏭️ ${skipCount} dilewati (tidak ada di ERP)`);
      alert(msg.join('\n'));
    }
  }, [updatePendingCount]);

  // Auto-sync every 30 seconds when page is active
  useEffect(() => {
    const interval = setInterval(() => {
      const count = getPendingCount();
      if (count > 0 && !isSyncing) {
        console.log(`[Auto-sync] ${count} item pending, attempting...`);
        syncAll();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [syncAll, isSyncing]);

  // Sync when page becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && !isSyncing) {
        const count = getPendingCount();
        if (count > 0) {
          console.log(`[Sync] Page visible, ${count} items pending`);
          syncAll();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [syncAll, isSyncing]);

  return {
    pendingCount,
    isSyncing,
    lastSync,
    syncAll,
    updatePendingCount,
  };
}
