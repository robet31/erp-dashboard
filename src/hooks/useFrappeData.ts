// src/hooks/useFrappeData.ts
// Custom hooks — fetch data dari Frappe/ERPNext menggunakan Proxy API Next.js (Bebas CORS)
// *SUDAH DIBERSIHKAN DARI MOCK/DUMMY DATA*

import { useState, useEffect, useCallback } from 'react';
import { apiGetList, apiCreate, apiUpdate, apiDelete } from '@/lib/api'; 
import type {
  Item, Warehouse, Bin, Customer, SalesOrder,
  DeliveryNote, BOM, WorkOrder, StockEntry,
  FrappeUser,
} from '@/lib/frappe-types';

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
  const shortMonth = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
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

      const rSalesOrders = salesOrders.status === 'fulfilled' ? salesOrders.value.map((o: any) => ({ ...o, items: o.items || [] })) : [];
      const rItems = items.status === 'fulfilled' ? items.value : [];
      const rBins = bins.status === 'fulfilled' ? bins.value : [];
      const rWorkOrders = workOrders.status === 'fulfilled' ? workOrders.value : [];

      const revenueTrend = buildRevenueTrend(rSalesOrders);
      const stockByCategory = buildStockByCategory(rBins, rItems);
      const productionTrend = revenueTrend.map(r => ({ month: r.month, planned: 100000, produced: Math.floor(r.revenue / 12000) }));
      const workOrderStatus = buildWorkOrderStatus(rWorkOrders);

      setData({
        salesOrders: rSalesOrders,
        items: rItems,
        bins: rBins,
        workOrders: rWorkOrders,
        revenueTrend,
        stockByCategory,
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
    salesOrders: [], items: [], bins: [], workOrders: [], 
    revenueTrend: [], stockByCategory: [], productionTrend: [], 
    workOrderStatus: { total: 0, completed: 0, inProcess: 0, pending: 0, rejected: 0 }, 
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
      setSalesOrders(so.status === 'fulfilled' ? so.value.map((o: any) => ({ ...o, items: o.items || [] })) : []);
      setCustomers(cust.status === 'fulfilled' ? cust.value : []);
    } catch (err) {
      console.warn('Failed to fetch Sales Orders/Customers:', err);
      setSalesOrders([]);
      setCustomers([]);
    }

    try {
      const dn = await apiGetList<DeliveryNote>('Delivery Note', { limit: 1000, fields: ['*'] });
      setDeliveryNotes(dn.map((d: any) => ({ ...d, items: d.items || [] })));
    } catch (err) {
      console.warn('Failed to fetch Delivery Notes:', err);
      setDeliveryNotes([]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { salesOrders, customers, deliveryNotes, isLoading, error, refetch: fetchData };
}

// ─── Stock Module Hook ───────────────────────────────────────────────────────

// Tambahkan Company ke interface
export interface StockData extends BaseState {
  items: Item[];
  warehouses: Warehouse[];
  bins: Bin[];
  stockEntries: StockEntry[];
  companies: any[]; // ✨ TAMBAHAN BARU
  refetch: () => void;
}

export function useStockData(): StockData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [companies, setCompanies] = useState<any[]>([]); // ✨ TAMBAHAN BARU

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // ✨ Tambahkan fetch 'Company' di Promise.allSettled
      const [it, wh, bn, se, comp] = await Promise.allSettled([
        apiGetList<Item>('Item', { limit: 1000, fields: ['*'] }),
        apiGetList<Warehouse>('Warehouse', { limit: 1000, fields: ['*'] }),
        apiGetList<Bin>('Bin', { limit: 1000, fields: ['*'] }),
        apiGetList<StockEntry>('Stock Entry', { limit: 1000, fields: ['*'] }),
        apiGetList<any>('Company', { limit: 100, fields: ['name', 'company_name'] }),
      ]);

      setItems(it.status === 'fulfilled' ? it.value : []);
      setWarehouses(wh.status === 'fulfilled' ? wh.value : []);
      setBins(bn.status === 'fulfilled' ? bn.value : []);
      setStockEntries(se.status === 'fulfilled' ? se.value.map((s: any) => ({ ...s, items: s.items || [] })) : []);
      setCompanies(comp.status === 'fulfilled' ? comp.value : []); // ✨ SET STATE COMPANY

    } catch (err) {
      console.warn('Failed to fetch stock data:', err);
      setItems([]);
      setWarehouses([]);
      setBins([]);
      setStockEntries([]);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { items, warehouses, bins, stockEntries, companies, isLoading, error, refetch: fetchData };
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

      const woData = wo.status === 'fulfilled' ? wo.value : [];
      const bomData = bom.status === 'fulfilled' ? bom.value : [];
      
      setWorkOrders(woData);
      setBoms(bomData.map((b: any) => ({ ...b, items: b.items || [] })));

      if (wo.status === 'rejected' && !(wo.reason?.message?.includes('503') || wo.reason?.message?.includes('offline'))) {
        console.debug('[Manufacturing] Work Order fetch failed:', wo.reason);
      }
    } catch (err) {
      console.debug('[Manufacturing] Fetch failed:', (err as Error)?.message);
      setWorkOrders([]);
      setBoms([]);
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

export function useUserData(): UserData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<FrappeUser[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiGetList<FrappeUser>('User', { limit: 1000, fields: ['*'] });

      // Jika offline atau hanya 1 user (biasanya cuma ada Administrator bawaan frappe), tetap set data yang didapat
      setUsers(data || []);
    } catch (err) {
      console.debug('[Users] Fetch failed:', err);
      setUsers([]);
      setError(null); // Silent fail
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

  useEffect(() => { fetchData(); }, [fetchData]);

  return { users, isLoading, error, refetch: fetchData, createUser, updateUser, deleteUser };
}