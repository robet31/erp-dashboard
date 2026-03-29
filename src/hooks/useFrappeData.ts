// src/hooks/useFrappeData.ts
// Custom hooks — fetch data dari Frappe/ERPNext menggunakan Proxy API Next.js (Bebas CORS)
// Fitur: Real-time polling setiap 30 detik + refresh saat tab kembali aktif

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGetList, apiCreate, apiUpdate, apiDelete } from '@/lib/api'; 
import type {
  Item, Warehouse, Bin, Customer, SalesOrder,
  DeliveryNote, BOM, WorkOrder, StockEntry,
  FrappeUser,
} from '@/lib/frappe-types';
import {
  mockRevenueTrend,
  mockStockByCategory,
  mockProductionTrend,
  mockWorkOrderStatus,
  mockCustomers,
  mockSalesOrders,
  mockDeliveryNotes,
  mockItems,
  mockWarehouses,
  mockBins,
  mockStockEntries,
  mockBOMs,
  mockWorkOrders,
} from '@/lib/mock-data';

// ─── Polling interval ────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 30_000; // 30 detik — real-time sync

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RevenueTrendPoint { month: string; revenue: number; target: number; }
export interface StockCategoryPoint { category: string; qty: number; value: number; }
export interface ProductionTrendPoint { month: string; planned: number; produced: number; }
export interface WorkOrderStatusSummary { total: number; completed: number; inProcess: number; pending: number; rejected: number; }
export interface DashboardStats { totalOrders: number; totalRevenue: number; activeItems: number; lowStockCount: number; }

interface BaseState { isLoading: boolean; error: string | null; }

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildRevenueTrend(salesOrders: SalesOrder[]): RevenueTrendPoint[] {
  const now = new Date();
  const shortMonth = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const revenueMap: Record<string, number> = {};
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  salesOrders.forEach(order => {
    const d = new Date(order.transaction_date);
    if (d >= sixMonthsAgo) {
      const key = shortMonth[d.getMonth()];
      revenueMap[key] = (revenueMap[key] || 0) + (order.grand_total || 0);
    }
  });

  return Array.from({ length: 6 }, (_, i) => {
    const monthIdx = (now.getMonth() - 5 + i + 12) % 12;
    const key = shortMonth[monthIdx];
    return { month: key, revenue: revenueMap[key] || 0, target: 1_000_000_000 };
  });
}

function buildStockByCategory(bins: Bin[], items: Item[]): StockCategoryPoint[] {
  const map: Record<string, { qty: number; value: number }> = {};
  bins.forEach(bin => {
    const item = items.find(i => i.item_code === bin.item_code);
    const cat = item?.item_group || 'Other';
    if (!map[cat]) map[cat] = { qty: 0, value: 0 };
    map[cat].qty += bin.actual_qty || 0;
    map[cat].value += bin.stock_value || 0;
  });
  return Object.entries(map).map(([category, d]) => ({ category, qty: d.qty, value: d.value }));
}

function buildWorkOrderStatus(wos: WorkOrder[]): WorkOrderStatusSummary {
  return {
    total: wos.length,
    completed: wos.filter(w => w.status === 'Completed').length,
    inProcess: wos.filter(w => w.status === 'In Process').length,
    pending: wos.filter(w => w.status === 'Not Started' || w.status === 'Pending').length,
    rejected: wos.filter(w => w.status === 'Cancelled' || w.status === 'Closed').length,
  };
}

// ─── Utility: is array from offline circuit breaker ──────────────────────────
function isOfflineResult(arr: any[]): boolean {
  return !!(arr as any).__offline;
}

// ─── Real-time polling hook helper ───────────────────────────────────────────
function usePolling(fetchFn: () => Promise<void>, intervalMs: number) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(fetchFn, intervalMs);
  }, [fetchFn, intervalMs]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Start polling
    start();

    // Pause when tab hidden, resume when visible
    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        // Immediately refetch on tab focus, then resume polling
        fetchFn();
        start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchFn, start, stop]);
}

// ─── Dashboard Data Hook ─────────────────────────────────────────────────────

export interface DashboardData extends BaseState {
  salesOrders: SalesOrder[];
  items: Item[];
  bins: Bin[];
  workOrders: WorkOrder[];
  revenueTrend: RevenueTrendPoint[];
  stockByCategory: StockCategoryPoint[];
  productionTrend: ProductionTrendPoint[];
  workOrderStatus: WorkOrderStatusSummary;
  stats: DashboardStats;
  refetch: () => void;
  lastUpdated: Date | null;
}

export function useDashboardData(): DashboardData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [data, setData] = useState<Omit<DashboardData, 'isLoading' | 'error' | 'refetch' | 'lastUpdated'> | null>(null);

  const fetchData = useCallback(async () => {
    // Don't show loading spinner on background polls (only on first load)
    if (!data) setIsLoading(true);
    setError(null);

    try {
      const [salesOrders, items, bins, workOrders] = await Promise.allSettled([
        apiGetList<SalesOrder>('Sales Order', { limit: 500, fields: ['name', 'customer', 'customer_name', 'transaction_date', 'grand_total', 'status', 'docstatus', 'delivery_date'] }),
        apiGetList<Item>('Item', { limit: 500, fields: ['name', 'item_code', 'item_name', 'item_group', 'stock_uom', 'is_stock_item', 'disabled', 'standard_rate'] }),
        apiGetList<Bin>('Bin', { limit: 1000, fields: ['name', 'item_code', 'warehouse', 'actual_qty', 'projected_qty', 'stock_value', 'valuation_rate'] }),
        apiGetList<WorkOrder>('Work Order', { limit: 200, fields: ['name', 'production_item', 'qty', 'produced_qty', 'status', 'planned_start_date', 'planned_end_date', 'company'] }),
      ]);

      const soData    = salesOrders.status  === 'fulfilled' ? salesOrders.value  : [];
      const itemData  = items.status        === 'fulfilled' ? items.value        : [];
      const binData   = bins.status         === 'fulfilled' ? bins.value         : [];
      const woData    = workOrders.status   === 'fulfilled' ? workOrders.value   : [];

      // Only use mock when the server is fully offline (circuit breaker)
      const soFinal   = isOfflineResult(soData)   ? mockSalesOrders   : soData;
      const itemFinal = isOfflineResult(itemData)  ? mockItems         : itemData;
      const binFinal  = isOfflineResult(binData)   ? mockBins          : binData;
      const woFinal   = isOfflineResult(woData)    ? mockWorkOrders    : woData;

      const rSalesOrders = soFinal.map((o: any) => ({ ...o, items: o.items || [] }));
      const revenueTrend = buildRevenueTrend(rSalesOrders);
      const stockByCategory = buildStockByCategory(binFinal, itemFinal);
      const productionTrend = revenueTrend.map(r => ({ month: r.month, planned: 100000, produced: Math.floor(r.revenue / 12000) }));
      const workOrderStatus = buildWorkOrderStatus(woFinal);

      setData({
        salesOrders: rSalesOrders,
        items: itemFinal,
        bins: binFinal,
        workOrders: woFinal,
        revenueTrend,
        stockByCategory,
        productionTrend,
        workOrderStatus,
        stats: {
          totalOrders: rSalesOrders.length,
          totalRevenue: rSalesOrders.reduce((s, o) => s + (o.grand_total || 0), 0),
          activeItems: itemFinal.filter((i: any) => i.disabled === 0 || i.disabled === false).length,
          lowStockCount: binFinal.filter((b: any) => (b.actual_qty || 0) < 10).length,
        },
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Dashboard] fetch error:', err);
      setError(err instanceof Error ? err.message : 'Gagal ambil data');
      if (!data) {
        // Only fall back to mock on first load failure
        const emptyRevenueTrend = buildRevenueTrend([]);
        setData({
          salesOrders: [], items: [], bins: [], workOrders: [],
          revenueTrend: emptyRevenueTrend,
          stockByCategory: [],
          productionTrend: emptyRevenueTrend.map(r => ({ month: r.month, planned: 100000, produced: 0 })),
          workOrderStatus: { total: 0, completed: 0, inProcess: 0, pending: 0, rejected: 0 },
          stats: { totalOrders: 0, totalRevenue: 0, activeItems: 0, lowStockCount: 0 },
        });
      }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, POLL_INTERVAL_MS);

  const fallback = { 
    salesOrders: [], items: [], bins: [], workOrders: [], 
    revenueTrend: mockRevenueTrend, stockByCategory: mockStockByCategory, 
    productionTrend: mockProductionTrend, workOrderStatus: mockWorkOrderStatus, 
    stats: { totalOrders: 0, totalRevenue: 0, activeItems: 0, lowStockCount: 0 } 
  };
  return { ...(data || fallback), isLoading, error, refetch: fetchData, lastUpdated };
}

// ─── Selling Module Hook ─────────────────────────────────────────────────────

export interface SellingData extends BaseState {
  salesOrders: SalesOrder[];
  customers: Customer[];
  deliveryNotes: DeliveryNote[];
  refetch: () => void;
  lastUpdated: Date | null;
}

export function useSellingData(): SellingData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const initialLoadDone = useRef(false);

  const fetchData = useCallback(async () => {
    if (!initialLoadDone.current) setIsLoading(true);
    setError(null);

    try {
      const [so, cust, dn] = await Promise.allSettled([
        apiGetList<SalesOrder>('Sales Order', { limit: 500, fields: ['name', 'customer', 'customer_name', 'transaction_date', 'grand_total', 'status', 'docstatus', 'delivery_date', 'items'] }),
        apiGetList<Customer>('Customer', { limit: 500, fields: ['name', 'customer_name', 'customer_type', 'customer_group', 'territory', 'mobile_no', 'email_id'] }),
        apiGetList<DeliveryNote>('Delivery Note', { limit: 500, fields: ['name', 'customer', 'customer_name', 'posting_date', 'grand_total', 'status', 'docstatus', 'items'] }),
      ]);

      const soData  = so.status   === 'fulfilled' ? so.value   : [];
      const custData = cust.status === 'fulfilled' ? cust.value : [];
      const dnData  = dn.status   === 'fulfilled' ? dn.value   : [];

      setSalesOrders(
        isOfflineResult(soData) ? mockSalesOrders : soData.map((o: any) => ({ ...o, items: o.items || [] }))
      );
      setCustomers(
        isOfflineResult(custData) ? mockCustomers : custData
      );
      setDeliveryNotes(
        isOfflineResult(dnData) ? mockDeliveryNotes : dnData.map((d: any) => ({ ...d, items: d.items || [] }))
      );
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('[Selling] fetch failed:', err);
      if (!initialLoadDone.current) {
        setSalesOrders(mockSalesOrders);
        setCustomers(mockCustomers);
        setDeliveryNotes(mockDeliveryNotes);
      }
    } finally {
      initialLoadDone.current = true;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, POLL_INTERVAL_MS);

  return { salesOrders, customers, deliveryNotes, isLoading, error, refetch: fetchData, lastUpdated };
}

// ─── Stock Module Hook ───────────────────────────────────────────────────────

export interface StockData extends BaseState {
  items: Item[];
  warehouses: Warehouse[];
  bins: Bin[];
  stockEntries: StockEntry[];
  refetch: () => void;
  lastUpdated: Date | null;
}

export function useStockData(): StockData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const initialLoadDone = useRef(false);

  const fetchData = useCallback(async () => {
    if (!initialLoadDone.current) setIsLoading(true);
    setError(null);

    try {
      const [it, wh, bn, se] = await Promise.allSettled([
        apiGetList<Item>('Item', { limit: 500, fields: ['name', 'item_code', 'item_name', 'item_group', 'stock_uom', 'is_stock_item', 'is_fixed_asset', 'disabled', 'standard_rate', 'creation', 'modified'] }),
        apiGetList<Warehouse>('Warehouse', { limit: 200, fields: ['name', 'warehouse_name', 'company', 'is_group', 'parent_warehouse'] }),
        apiGetList<Bin>('Bin', { limit: 1000, fields: ['name', 'item_code', 'warehouse', 'actual_qty', 'projected_qty', 'stock_value', 'valuation_rate'] }),
        apiGetList<StockEntry>('Stock Entry', { limit: 200, fields: ['name', 'stock_entry_type', 'posting_date', 'posting_time', 'company', 'docstatus', 'to_warehouse', 'from_warehouse', 'total_amount', 'modified'] }),
      ]);

      const itData = it.status === 'fulfilled' ? it.value : [];
      const whData = wh.status === 'fulfilled' ? wh.value : [];
      const bnData = bn.status === 'fulfilled' ? bn.value : [];
      const seData = se.status === 'fulfilled' ? se.value : [];

      setItems(isOfflineResult(itData) ? mockItems : itData);
      setWarehouses(isOfflineResult(whData) ? mockWarehouses : whData);
      setBins(isOfflineResult(bnData) ? mockBins : bnData);
      setStockEntries(
        isOfflineResult(seData) ? mockStockEntries : seData.map((s: any) => ({ ...s, items: s.items || [] }))
      );
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('[Stock] fetch failed:', err);
      if (!initialLoadDone.current) {
        setItems(mockItems);
        setWarehouses(mockWarehouses);
        setBins(mockBins);
        setStockEntries(mockStockEntries);
      }
    } finally {
      initialLoadDone.current = true;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, POLL_INTERVAL_MS);

  return { items, warehouses, bins, stockEntries, isLoading, error, refetch: fetchData, lastUpdated };
}

// ─── Manufacturing Module Hook ────────────────────────────────────────────────

export interface ManufacturingData extends BaseState {
  workOrders: WorkOrder[];
  boms: BOM[];
  refetch: () => void;
  lastUpdated: Date | null;
}

export function useManufacturingData(): ManufacturingData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const initialLoadDone = useRef(false);

  const fetchData = useCallback(async () => {
    if (!initialLoadDone.current) setIsLoading(true);
    setError(null);

    try {
      const [wo, bom] = await Promise.allSettled([
        apiGetList<WorkOrder>('Work Order', { limit: 200, fields: ['name', 'production_item', 'item_name', 'bom_no', 'qty', 'produced_qty', 'status', 'planned_start_date', 'planned_end_date', 'company', 'docstatus', 'modified'] }),
        apiGetList<BOM>('BOM', { limit: 200, fields: ['name', 'item', 'item_name', 'quantity', 'is_active', 'is_default', 'company', 'docstatus', 'modified', 'items'] }),
      ]);

      const woData  = wo.status  === 'fulfilled' ? wo.value  : [];
      const bomData = bom.status === 'fulfilled' ? bom.value : [];

      setWorkOrders(isOfflineResult(woData) ? mockWorkOrders : woData);
      setBoms(
        isOfflineResult(bomData) ? mockBOMs : bomData.map((b: any) => ({ ...b, items: b.items || [] }))
      );
      setLastUpdated(new Date());
    } catch (err) {
      console.debug('[Manufacturing] fetch failed, using mock data:', (err as Error)?.message);
      if (!initialLoadDone.current) {
        setWorkOrders(mockWorkOrders);
        setBoms(mockBOMs);
      }
    } finally {
      initialLoadDone.current = true;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, POLL_INTERVAL_MS);

  return { workOrders, boms, isLoading, error, refetch: fetchData, lastUpdated };
}

// ─── User Management Hook ─────────────────────────────────────────────────────

export interface UserData extends BaseState {
  users: FrappeUser[];
  refetch: () => void;
  createUser: (data: Partial<FrappeUser>) => Promise<FrappeUser>;
  updateUser: (name: string, data: Partial<FrappeUser>) => Promise<FrappeUser>;
  deleteUser: (name: string) => Promise<void>;
  lastUpdated: Date | null;
}

const MOCK_USERS: FrappeUser[] = [
  { name: 'Administrator', full_name: 'Administrator', email: 'administrator@erp.com', first_name: 'Administrator', last_name: '', enabled: 1, user_type: 'System User', creation: '2026-01-01', modified: '2026-01-01' },
  { name: 'direktur@erp.com', full_name: 'Ahmad Wijaya', email: 'direktur@erp.com', first_name: 'Ahmad', last_name: 'Wijaya', enabled: 1, user_type: 'System User', creation: '2026-01-15', modified: '2026-03-01' },
  { name: 'manajer@erp.com', full_name: 'Budi Santoso', email: 'manajer@erp.com', first_name: 'Budi', last_name: 'Santoso', enabled: 1, user_type: 'System User', creation: '2026-01-15', modified: '2026-03-01' },
  { name: 'sales@erp.com', full_name: 'Citra Dewi', email: 'sales@erp.com', first_name: 'Citra', last_name: 'Dewi', enabled: 1, user_type: 'System User', creation: '2026-01-16', modified: '2026-03-01' },
  { name: 'gudang@erp.com', full_name: 'Dedi Kurniawan', email: 'gudang@erp.com', first_name: 'Dedi', last_name: 'Kurniawan', enabled: 1, user_type: 'System User', creation: '2026-01-16', modified: '2026-03-01' },
  { name: 'produksi@erp.com', full_name: 'Eko Prasetyo', email: 'produksi@erp.com', first_name: 'Eko', last_name: 'Prasetyo', enabled: 1, user_type: 'System User', creation: '2026-01-16', modified: '2026-03-01' },
];

export function useUserData(): UserData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [users, setUsers] = useState<FrappeUser[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const mergedMap = new Map<string, FrappeUser>();

    // 1. Fetch from PostgreSQL Database (primary source for local users)
    try {
      const pgRes = await fetch('/api/auth/users');
      if (pgRes.ok) {
        const pgData = await pgRes.json();
        (pgData.users || []).forEach((u: any) => {
          mergedMap.set(u.email, {
            name: u.name || u.email,
            full_name: u.full_name || u.email,
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            email: u.email,
            enabled: 1,
            user_type: 'System User',
            role: u.role || undefined, // Preserve role from DB
            creation: u.creation || new Date().toISOString(),
            modified: u.creation || new Date().toISOString(),
          } as any);
        });
      }
    } catch (pgErr) {
      console.debug('[Users] PostgreSQL fetch failed:', pgErr);
    }

    // 2. Fetch from Frappe API (secondary source, may have limited results)
    try {
      const data = await apiGetList<FrappeUser>('User', { 
        limit: 500, 
        fields: ['name', 'full_name', 'first_name', 'last_name', 'email', 'enabled', 'user_type', 'creation', 'modified'],
        filters: [['User', 'user_type', '!=', 'Website User']]
      });

      if (!isOfflineResult(data)) {
        data.forEach(u => {
          // Frappe data takes priority if the user exists in both
          if (u.email) {
            mergedMap.set(u.email, { ...mergedMap.get(u.email), ...u });
          }
        });
      }
    } catch (frappeErr) {
      console.debug('[Users] Frappe API fetch failed:', frappeErr);
    }

    // 3. Combine results
    const allUsers = Array.from(mergedMap.values());
    
    if (allUsers.length > 0) {
      setUsers(allUsers);
    } else {
      // Fallback to mock if both sources failed
      setUsers(MOCK_USERS);
    }
    
    setLastUpdated(new Date());
    setIsLoading(false);
  }, []);

  const createUser = useCallback(async (data: Partial<FrappeUser>): Promise<FrappeUser> => {
    try { const result = await apiCreate<FrappeUser>('User', data); await fetchData(); return result; }
    catch { throw new Error('Gagal membuat user. Server tidak tersedia.'); }
  }, [fetchData]);

  const updateUser = useCallback(async (name: string, data: Partial<FrappeUser>): Promise<FrappeUser> => {
    try { const result = await apiUpdate<FrappeUser>('User', name, data); await fetchData(); return result; }
    catch { throw new Error('Gagal update user. Server tidak tersedia.'); }
  }, [fetchData]);

  const deleteUser = useCallback(async (name: string): Promise<void> => {
    try { await apiDelete('User', name); await fetchData(); }
    catch { throw new Error('Gagal hapus user. Server tidak tersedia.'); }
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, POLL_INTERVAL_MS);

  return { users, isLoading, error, refetch: fetchData, createUser, updateUser, deleteUser, lastUpdated };
}

// ─── Legacy export (backward compat) ─────────────────────────────────────────
export { mockRevenueTrend, mockStockByCategory, mockProductionTrend, mockWorkOrderStatus };