// src/config/rbac.ts
// Role-Based Access Control configuration

export type UserRole = 'direktur' | 'manajer_pabrik' | 'sales' | 'gudang' | 'produksi';

export interface RoleConfig {
  id: UserRole;
  label: string;
  description: string;
  color: string;
  badge: string;
  icon: string;
}

export const ROLES: RoleConfig[] = [
  {
    id: 'direktur',
    label: 'Direktur',
    description: 'Manajemen & Akses Penuh',
    color: '#0066B3',
    badge: 'DIR',
    icon: 'Crown',
  },
  {
    id: 'manajer_pabrik',
    label: 'Manajer Pabrik',
    description: 'Produksi & Manajemen',
    color: '#7c3aed',
    badge: 'MPB',
    icon: 'Factory',
  },
  {
    id: 'sales',
    label: 'Staff Sales',
    description: 'Penjualan & Pelanggan',
    color: '#059669',
    badge: 'SLS',
    icon: 'ShoppingCart',
  },
  {
    id: 'gudang',
    label: 'Staff Gudang',
    description: 'Inventory & Warehouse',
    color: '#d97706',
    badge: 'GDG',
    icon: 'Warehouse',
  },
  {
    id: 'produksi',
    label: 'Operator Produksi',
    description: 'Manufaktur & Produksi',
    color: '#0891b2',
    badge: 'PRD',
    icon: 'Cog',
  },
];

// Permission keys
export type PermissionKey =
  // Dashboard
  | 'view_dashboard'
  // User Management
  | 'view_users'
  | 'create_user'
  | 'edit_user'
  | 'delete_user'
  // Selling
  | 'view_sales'
  | 'create_sales_order'
  | 'edit_sales_order'
  | 'delete_sales_order'
  | 'view_customers'
  | 'create_customer'
  | 'edit_customer'
  | 'delete_customer'
  | 'view_delivery_notes'
  | 'create_delivery_note'
  | 'edit_delivery_note'
  | 'delete_delivery_note'
  // Stock
  | 'view_stock'
  | 'view_items'
  | 'create_item'
  | 'edit_item'
  | 'delete_item'
  | 'view_warehouse'
  | 'create_warehouse'
  | 'edit_warehouse'
  | 'delete_warehouse'
  | 'view_bin'
  | 'create_stock_entry'
  | 'edit_stock_entry'
  | 'delete_stock_entry'
  | 'view_stock_entry'
  // Manufacturing
  | 'view_manufacturing'
  | 'view_bom'
  | 'create_bom'
  | 'edit_bom'
  | 'delete_bom'
  | 'view_work_orders'
  | 'create_work_order'
  | 'edit_work_order'
  | 'delete_work_order';

export type DashboardWidget = 
  | 'revenue_stats'
  | 'sales_orders'
  | 'customers'
  | 'delivery_notes'
  | 'items'
  | 'warehouses'
  | 'bins'
  | 'stock_entries'
  | 'boms'
  | 'work_orders'
  | 'production_status'
  | 'low_stock_alerts'
  | 'pending_orders'
  | 'quick_actions';

// Module access
export type ModuleKey = 'dashboard' | 'selling' | 'stock' | 'manufacturing' | 'api_tester' | 'users';

// Role permissions map
export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  direktur: [
    'view_dashboard',
    'view_users', 'create_user', 'edit_user', 'delete_user',
    'view_sales', 'create_sales_order', 'edit_sales_order', 'delete_sales_order',
    'view_customers', 'create_customer', 'edit_customer', 'delete_customer',
    'view_delivery_notes', 'create_delivery_note', 'edit_delivery_note', 'delete_delivery_note',
    'view_stock', 'view_items', 'create_item', 'edit_item', 'delete_item',
    'view_warehouse', 'view_bin', 'create_stock_entry', 'edit_stock_entry', 'delete_stock_entry', 'view_stock_entry',
    'view_manufacturing', 'view_bom', 'create_bom', 'edit_bom', 'delete_bom',
    'view_work_orders', 'create_work_order', 'edit_work_order', 'delete_work_order',
  ],
  manajer_pabrik: [
    'view_dashboard',
    'view_users', 'create_user', 'edit_user',
    'view_sales', 'view_customers', 'view_delivery_notes',
    'view_stock', 'view_items', 'view_warehouse', 'view_bin', 'view_stock_entry',
    'view_manufacturing', 'view_bom', 'create_bom', 'edit_bom',
    'view_work_orders', 'create_work_order', 'edit_work_order',
  ],
  sales: [
    'view_dashboard',
    'view_sales', 'create_sales_order', 'edit_sales_order',
    'view_customers', 'create_customer', 'edit_customer',
    'view_delivery_notes', 'create_delivery_note',
    'view_stock', 'view_items', 'view_bin',
  ],
  gudang: [
    'view_dashboard',
    'view_sales', 'view_delivery_notes', 'create_delivery_note', 'edit_delivery_note',
    'view_stock', 'view_items', 'create_item', 'edit_item', 'delete_item',
    'view_warehouse', 'create_warehouse', 'edit_warehouse', 'delete_warehouse', 'view_bin', 
    'create_stock_entry', 'edit_stock_entry', 'delete_stock_entry', 'view_stock_entry',
  ],
  produksi: [
    'view_dashboard',
    'view_stock', 'view_items', 'view_bin',
    'view_manufacturing', 'view_bom', 'view_work_orders', 'create_work_order', 'edit_work_order',
  ],
};

export const MODULE_ACCESS: Record<UserRole, ModuleKey[]> = {
  direktur: ['dashboard', 'selling', 'stock', 'manufacturing', 'api_tester', 'users'],
  manajer_pabrik: ['dashboard', 'selling', 'stock', 'manufacturing', 'api_tester', 'users'],
  sales: ['dashboard', 'selling', 'stock'],
  gudang: ['dashboard', 'selling', 'stock'],
  produksi: ['dashboard', 'stock', 'manufacturing'],
};

export function hasPermission(role: UserRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasModuleAccess(role: UserRole, module: ModuleKey): boolean {
  return MODULE_ACCESS[role]?.includes(module) ?? false;
}

export function getRoleConfig(role: UserRole): RoleConfig {
  return ROLES.find(r => r.id === role) || ROLES[0];
}

export const DASHBOARD_WIDGETS: Record<UserRole, DashboardWidget[]> = {
  direktur: [
    'revenue_stats',
    'sales_orders',
    'customers',
    'delivery_notes',
    'items',
    'warehouses',
    'bins',
    'stock_entries',
    'boms',
    'work_orders',
    'production_status',
    'low_stock_alerts',
    'pending_orders',
    'quick_actions',
  ],
  manajer_pabrik: [
    'revenue_stats',
    'sales_orders',
    'items',
    'bins',
    'boms',
    'work_orders',
    'production_status',
    'low_stock_alerts',
    'pending_orders',
    'quick_actions',
  ],
  sales: [
    'sales_orders',
    'customers',
    'delivery_notes',
    'items',
    'bins',
    'pending_orders',
    'quick_actions',
  ],
  gudang: [
    'items',
    'warehouses',
    'bins',
    'stock_entries',
    'delivery_notes',
    'low_stock_alerts',
    'quick_actions',
  ],
  produksi: [
    'items',
    'bins',
    'boms',
    'work_orders',
    'production_status',
    'quick_actions',
  ],
};

export function getDashboardWidgets(role: UserRole): DashboardWidget[] {
  return DASHBOARD_WIDGETS[role] || [];
}
