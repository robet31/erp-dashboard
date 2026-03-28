// src/hooks/useFrappeData.ts
// Custom hooks — fetch data dari Frappe/ERPNext menggunakan Proxy API Next.js (Bebas CORS)

import { useState, useEffect, useCallback } from 'react';
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
}

export function useDashboardData(): DashboardData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Omit<DashboardData, 'isLoading' | 'error' | 'refetch'> | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [salesOrders, items, bins, workOrders] = await Promise.allSettled([
        apiGetList<SalesOrder>('Sales Order', { limit: 1000, fields: ['*'] }),
        apiGetList<Item>('Item', { limit: 1000, fields: ['*'] }),
        apiGetList<Bin>('Bin', { limit: 1000, fields: ['*'] }),
        apiGetList<WorkOrder>('Work Order', { limit: 1000, fields: ['*'] }),
      ]);

      const rSalesOrders = (salesOrders.status === 'fulfilled' && salesOrders.value.length > 0 ? salesOrders.value : mockSalesOrders).map((o: any) => ({ ...o, items: o.items || [] }));
      const rItems = items.status === 'fulfilled' && items.value.length > 0 ? items.value : mockItems;
      const rBins = bins.status === 'fulfilled' && bins.value.length > 0 ? bins.value : mockBins;
      const rWorkOrders = workOrders.status === 'fulfilled' && workOrders.value.length > 0 ? workOrders.value : mockWorkOrders;

      if (salesOrders.status === 'rejected' || (salesOrders.status === 'fulfilled' && salesOrders.value.length === 0)) console.warn('Sales Order: tidak ada data, menggunakan mock');
      if (items.status === 'rejected' || (items.status === 'fulfilled' && items.value.length === 0)) console.warn('Item: tidak ada data, menggunakan mock');
      if (bins.status === 'rejected' || (bins.status === 'fulfilled' && bins.value.length === 0)) console.warn('Bin: tidak ada data, menggunakan mock');

      const revenueTrend = buildRevenueTrend(rSalesOrders.length > 0 ? rSalesOrders : []);
      const stockByCategory = buildStockByCategory(rBins, rItems);
      const productionTrend = revenueTrend.map(r => ({ month: r.month, planned: 100000, produced: Math.floor(r.revenue / 12000) }));
      const workOrderStatus = buildWorkOrderStatus(rWorkOrders.length > 0 ? rWorkOrders : []);

      setData({
        salesOrders: rSalesOrders.length > 0 ? rSalesOrders : [],
        items: rItems.length > 0 ? rItems : [],
        bins: rBins.length > 0 ? rBins : [],
        workOrders: rWorkOrders.length > 0 ? rWorkOrders : [],
        revenueTrend,
        stockByCategory: stockByCategory.length > 0 ? stockByCategory : [],
        productionTrend,
        workOrderStatus,
        stats: {
          totalOrders: rSalesOrders.length,
          totalRevenue: rSalesOrders.reduce((s, o) => s + (o.grand_total || 0), 0),
          activeItems: rItems.filter((i: any) => i.disabled === 0).length,
          lowStockCount: rBins.filter((b: any) => (b.projected_qty || 0) < 50).length,
        },
      });
    } catch (err) {
      console.error('[Dashboard] fetch error:', err);
      setError(err instanceof Error ? err.message : 'Gagal ambil data');
      const emptyRevenueTrend = buildRevenueTrend([]);
      setData({
        salesOrders: [], items: [], bins: [], workOrders: [],
        revenueTrend: emptyRevenueTrend,
        stockByCategory: [],
        productionTrend: emptyRevenueTrend.map(r => ({ month: r.month, planned: 100000, produced: 0 })),
        workOrderStatus: { total: 0, completed: 0, inProcess: 0, pending: 0, rejected: 0 },
        stats: { totalOrders: 0, totalRevenue: 0, activeItems: 0, lowStockCount: 0 },
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fallback = { 
    salesOrders: [], 
    items: [], 
    bins: [], 
    workOrders: [], 
    revenueTrend: mockRevenueTrend, 
    stockByCategory: mockStockByCategory, 
    productionTrend: mockProductionTrend, 
    workOrderStatus: mockWorkOrderStatus, 
    stats: { totalOrders: 0, totalRevenue: 0, activeItems: 0, lowStockCount: 0 } 
  };
  return { ...(data || fallback), isLoading, error, refetch: fetchData };
}

// ─── Selling Module Hook ─────────────────────────────────────────────────────

export interface SellingData extends BaseState {
  salesOrders: SalesOrder[];
  customers: Customer[];
  deliveryNotes: DeliveryNote[];
  refetch: () => void;
}

export function useSellingData(): SellingData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [so, cust] = await Promise.allSettled([
        apiGetList<SalesOrder>('Sales Order', { limit: 1000, fields: ['*'] }),
        apiGetList<Customer>('Customer', { limit: 1000, fields: ['*'] }),
      ]);
      setSalesOrders(so.status === 'fulfilled' ? so.value.map((o: any) => ({ ...o, items: o.items || [] })) : mockSalesOrders);
      setCustomers(cust.status === 'fulfilled' ? cust.value : mockCustomers);
    } catch (err) {
      console.warn('Failed to fetch Sales Orders/Customers, using mock data:', err);
      setSalesOrders(mockSalesOrders);
      setCustomers(mockCustomers);
    }

    try {
      const dn = await apiGetList<DeliveryNote>('Delivery Note', { limit: 1000, fields: ['*'] });
      setDeliveryNotes(dn.map((d: any) => ({ ...d, items: d.items || [] })));
    } catch (err) {
      console.warn('Failed to fetch Delivery Notes, using mock data:', err);
      setDeliveryNotes(mockDeliveryNotes);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { salesOrders, customers, deliveryNotes, isLoading, error, refetch: fetchData };
}

// ─── Stock Module Hook ───────────────────────────────────────────────────────

export interface StockData extends BaseState {
  items: Item[];
  warehouses: Warehouse[];
  bins: Bin[];
  stockEntries: StockEntry[];
  refetch: () => void;
}

export function useStockData(): StockData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [it, wh, bn, se] = await Promise.allSettled([
        apiGetList<Item>('Item', { limit: 1000, fields: ['*'] }),
        apiGetList<Warehouse>('Warehouse', { limit: 1000, fields: ['*'] }),
        apiGetList<Bin>('Bin', { limit: 1000, fields: ['*'] }),
        apiGetList<StockEntry>('Stock Entry', { limit: 1000, fields: ['*'] }),
      ]);

      setItems(it.status === 'fulfilled' && it.value.length > 0 ? it.value : mockItems);
      setWarehouses(wh.status === 'fulfilled' && wh.value.length > 0 ? wh.value : mockWarehouses);
      setBins(bn.status === 'fulfilled' && bn.value.length > 0 ? bn.value : mockBins);
      setStockEntries(se.status === 'fulfilled' && se.value.length > 0 ? se.value.map((s: any) => ({ ...s, items: s.items || [] })) : mockStockEntries);

    } catch (err) {
      console.warn('Failed to fetch stock data, using mock data:', err);
      setItems(mockItems);
      setWarehouses(mockWarehouses);
      setBins(mockBins);
      setStockEntries(mockStockEntries);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { items, warehouses, bins, stockEntries, isLoading, error, refetch: fetchData };
}

// ─── Manufacturing Module Hook ────────────────────────────────────────────────

export interface ManufacturingData extends BaseState {
  workOrders: WorkOrder[];
  boms: BOM[];
  refetch: () => void;
}

export function useManufacturingData(): ManufacturingData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [wo, bom] = await Promise.allSettled([
        apiGetList<WorkOrder>('Work Order', { limit: 1000, fields: ['*'] }),
        apiGetList<BOM>('BOM', { limit: 1000, fields: ['*'] }),
      ]);

      // Check if offline (apiGetList returns [] with __offline flag when server is down)
      const woData = wo.status === 'fulfilled' ? wo.value : [];
      const bomData = bom.status === 'fulfilled' ? bom.value : [];
      const isOffline = (woData as any).__offline || (bomData as any).__offline;

      setWorkOrders(
        woData.length > 0 ? woData : isOffline ? mockWorkOrders : mockWorkOrders
      );
      setBoms(
        bomData.length > 0
          ? bomData.map((b: any) => ({ ...b, items: b.items || [] }))
          : mockBOMs
      );

      // Only show error for real API errors (not offline)
      if (wo.status === 'rejected' && !(wo.reason?.message?.includes('503') || wo.reason?.message?.includes('offline'))) {
        console.debug('[Manufacturing] Work Order fetch failed, using mock data');
      }
    } catch (err) {
      // Silently fall back to mock — don't show error banner
      console.debug('[Manufacturing] Fetch failed, using mock data:', (err as Error)?.message);
      setWorkOrders(mockWorkOrders);
      setBoms(mockBOMs);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { workOrders, boms, isLoading, error, refetch: fetchData };
}

// ─── User Management Hook ─────────────────────────────────────────────────────

export interface UserData extends BaseState {
  users: FrappeUser[];
  refetch: () => void;
  createUser: (data: Partial<FrappeUser>) => Promise<FrappeUser>;
  updateUser: (name: string, data: Partial<FrappeUser>) => Promise<FrappeUser>;
  deleteUser: (name: string) => Promise<void>;
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
  const [users, setUsers] = useState<FrappeUser[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGetList<FrappeUser>('User', { limit: 1000, fields: ['*'] });

      // __offline flag is set by apiGetList when server is unreachable
      const isOffline = (data as any).__offline;

      if (isOffline || data.length < 2) {
        // Server offline or only returned 1 user (Guest/Administrator only)
        // Use mock data silently — no error banner
        setUsers(MOCK_USERS);
        setError(null); // don't show an error banner
      } else {
        setUsers(data);
      }
    } catch (err) {
      // Silent fallback — server being down is expected in dev
      console.debug('[Users] Fetch failed, using mock data');
      setUsers(MOCK_USERS);
      setError(null);
    } finally {
      setIsLoading(false);
    }
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

  // Single fetch on mount (fetchData is stable via useCallback)
  useEffect(() => { fetchData(); }, [fetchData]);

  return { users, isLoading, error, refetch: fetchData, createUser, updateUser, deleteUser };
}

// ─── Legacy export (backward compat) ─────────────────────────────────────────
export { mockRevenueTrend, mockStockByCategory, mockProductionTrend, mockWorkOrderStatus };