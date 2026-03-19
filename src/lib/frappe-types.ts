// src/lib/frappe-types.ts
// TypeScript interfaces for ERPNext Doctypes

export interface FrappeListParams {
  fields?: string[];
  filters?: FrappeFilter[];
  order_by?: string;
  limit_page_length?: number;
  limit_start?: number;
  or_filters?: FrappeFilter[];
  group_by?: string;
}

export type FrappeFilter = [string, string, string | number | boolean];

export interface FrappeListResponse<T> {
  data: T[];
}

export interface FrappeDocResponse<T> {
  data: T;
}

export interface FrappeError {
  exc_type?: string;
  exception?: string;
  _server_messages?: string;
  message?: string;
}

// ─── AUTH ───────────────────────────────────────
export interface LoginResponse {
  message: string;
  home_page: string;
  full_name: string;
  sid?: string;
}

// ─── USER / ROLE ─────────────────────────────────
export type UserRole = 'direktur' | 'manajer_pabrik' | 'sales' | 'gudang' | 'produksi' | 'qc';

export interface UserInfo {
  name: string;
  full_name: string;
  email: string;
  roles: string[];
  role: UserRole;
}

// ─── ITEM ─────────────────────────────────────────
export interface Item {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: number;
  standard_rate: number;
  opening_stock?: number;
  disabled: number;
  country_of_origin?: string;
  doctype?: string;
}

// ─── WAREHOUSE ────────────────────────────────────
export interface Warehouse {
  name: string;
  warehouse_name: string;
  company: string;
  is_group: number;
  disabled: number;
  parent_warehouse?: string;
}

// ─── BIN (Stock Level) ────────────────────────────
export interface Bin {
  name: string;
  item_code: string;
  warehouse: string;
  actual_qty: number;
  planned_qty: number;
  indented_qty: number;
  ordered_qty: number;
  reserved_qty: number;
  projected_qty: number;
  stock_uom: string;
  company: string;
  valuation_rate: number;
  stock_value: number;
}

// ─── STOCK ENTRY ──────────────────────────────────
export interface StockEntry {
  name: string;
  stock_entry_type: string;
  posting_date: string;
  posting_time?: string;
  company: string;
  docstatus: number;
  from_warehouse?: string;
  to_warehouse?: string;
  remarks?: string;
  total_amount?: number;
  items: StockEntryItem[];
}

export interface StockEntryItem {
  name?: string;
  item_code: string;
  item_name: string;
  s_warehouse?: string;
  t_warehouse?: string;
  qty: number;
  uom: string;
  basic_rate?: number;
  amount?: number;
  parent?: string;
}

// ─── CUSTOMER ─────────────────────────────────────
export interface Customer {
  name: string;
  customer_name: string;
  customer_type: string;
  customer_group?: string;
  territory?: string;
  mobile_no?: string;
  email_id?: string;
  disabled: number;
}

// ─── SALES ORDER ──────────────────────────────────
export interface SalesOrder {
  name: string;
  customer: string;
  customer_name: string;
  transaction_date: string;
  delivery_date: string;
  status: string;
  grand_total: number;
  total_qty: number;
  company: string;
  docstatus: number;
  delivery_status?: string;
  billing_status?: string;
  per_delivered?: number;
  currency?: string;
  items: SalesOrderItem[];
}

export interface SalesOrderItem {
  name?: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  warehouse?: string;
  actual_qty?: number;
  delivered_qty?: number;
  parent?: string;
}

// ─── DELIVERY NOTE ────────────────────────────────
export interface DeliveryNote {
  name: string;
  customer: string;
  customer_name: string;
  posting_date: string;
  status: string;
  grand_total: number;
  total_qty: number;
  company: string;
  docstatus: number;
  lr_no?: string;
  lr_date?: string;
  transport_company?: string;
  items: DeliveryNoteItem[];
}

export interface DeliveryNoteItem {
  name?: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate?: number;
  amount?: number;
  warehouse?: string;
  parent?: string;
}

// ─── BOM ──────────────────────────────────────────
export interface BOM {
  name: string;
  item: string;
  item_name: string;
  quantity: number;
  is_active: number;
  is_default: number;
  company: string;
  currency: string;
  total_cost?: number;
  docstatus: number;
  items: BOMItem[];
}

export interface BOMItem {
  name?: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate?: number;
  amount?: number;
  parent?: string;
}

// ─── WORK ORDER ───────────────────────────────────
export interface WorkOrder {
  name: string;
  production_item: string;
  item_name: string;
  bom_no: string;
  company: string;
  status: string;
  qty: number;
  produced_qty: number;
  planned_start_date: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  wip_warehouse?: string;
  fg_warehouse?: string;
  docstatus: number;
  sales_order?: string;
}

// ─── DASHBOARD SUMMARY ───────────────────────────
export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  activeItems: number;
  lowStockCount: number;
  pendingOrders: number;
  deliveredOrders: number;
}

// ─── USER (Frappe User/GSS CRM User) ─────────────
export interface FrappeUser {
  name: string;
  full_name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  enabled?: number;
  user_type?: string;
  role_profile_name?: string;
  roles?: { role: string }[];
  gss_role?: string;
  department?: string;
  creation?: string;
  modified?: string;
}
