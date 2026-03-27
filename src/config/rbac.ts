export type UserRole = 'admin_sales' | 'admin_gudang' | 'manajer_produksi' | 'operator' | 'administrator';

export type ModuleKey = 'dashboard' | 'selling' | 'stock' | 'manufacturing' | 'users';

export type PermissionKey = 
  | 'create_customer' | 'edit_customer'
  | 'create_sales_order' | 'edit_sales_order'
  | 'create_delivery_note' | 'edit_delivery_note'
  | 'create_item' | 'create_bom' | 'create_work_order' | 'create_job_card'
  | 'manage_users' | 'create_user' | 'edit_user' | 'delete_user';

export type DashboardWidget = {
  id: string;
  title: string;
  type: 'chart' | 'stat' | 'list';
  colSpan?: number;
};

export const ROLES = [
  {
    id: 'admin_sales',
    label: 'Admin Sales',
    badge: 'SLS',
    description: 'Kelola Customer, Order & Invoice',
    icon: 'ShoppingCart',
    color: '#054CC7', // Warna Primary Baru
    modules: ['dashboard', 'selling'] as ModuleKey[],
    permissions: ['create_customer', 'edit_customer', 'create_sales_order', 'edit_sales_order'] as PermissionKey[],
    widgets: [{ id: 'sales_overview', title: 'Sales Overview', type: 'chart' }] as DashboardWidget[]
  },
  {
    id: 'admin_gudang',
    label: 'Admin Gudang',
    badge: 'GDG',
    description: 'Kelola Stok, Item & Delivery',
    icon: 'Warehouse',
    color: '#17C3CC', // Warna Secondary Baru
    modules: ['dashboard', 'stock'] as ModuleKey[],
    permissions: ['create_item', 'create_delivery_note', 'edit_delivery_note'] as PermissionKey[],
    widgets: [{ id: 'stock_overview', title: 'Stock Overview', type: 'stat' }] as DashboardWidget[]
  },
  {
    id: 'manajer_produksi',
    label: 'Manajer Produksi',
    badge: 'PRD',
    description: 'Kelola BOM & Work Order',
    icon: 'Factory',
    color: '#054CC7', // Warna Primary Baru
    modules: ['dashboard', 'manufacturing'] as ModuleKey[],
    permissions: ['create_bom', 'create_work_order', 'create_job_card'] as PermissionKey[],
    widgets: [{ id: 'prod_overview', title: 'Production Overview', type: 'chart' }] as DashboardWidget[]
  },
  {
    id: 'operator',
    label: 'Operator',
    badge: 'OPR',
    description: 'Eksekusi Job Card di Pabrik',
    icon: 'Wrench',
    color: '#17C3CC', // Warna Secondary Baru
    modules: ['dashboard', 'manufacturing'] as ModuleKey[],
    permissions: ['create_job_card'] as PermissionKey[],
    widgets: [{ id: 'job_card_list', title: 'My Job Cards', type: 'list' }] as DashboardWidget[]
  },
  {
    id: 'administrator',
    label: 'Administrator',
    badge: 'ADM',
    description: 'Akses penuh ke semua modul',
    icon: 'Cog',
    color: '#054CC7',
    modules: ['dashboard', 'selling', 'stock', 'manufacturing', 'users'] as ModuleKey[],
    permissions: ['create_customer', 'edit_customer', 'create_sales_order', 'edit_sales_order', 'create_delivery_note', 'edit_delivery_note', 'create_item', 'create_bom', 'create_work_order', 'create_job_card', 'manage_users', 'create_user', 'edit_user', 'delete_user'] as PermissionKey[],
    widgets: [{ id: 'system_overview', title: 'System Overview', type: 'chart' }] as DashboardWidget[]
  }
];

export const getRoleConfig = (roleId: string) => {
  return ROLES.find(r => r.id === roleId) || ROLES[ROLES.length - 1];
};

export const hasPermission = (roleId: string, permission: PermissionKey) => {
  const role = getRoleConfig(roleId);
  return role.permissions.includes(permission);
};

export const hasModuleAccess = (roleId: string, module: ModuleKey) => {
  const role = getRoleConfig(roleId);
  return role.modules.includes(module);
};

export const getDashboardWidgets = (roleId: string): DashboardWidget[] => {
  const role = getRoleConfig(roleId);
  return role.widgets || [];
};