// src/lib/mock-data.ts
// Mock data that mirrors the ERPNext API structure

import type { Item, Warehouse, Bin, Customer, SalesOrder, DeliveryNote, BOM, WorkOrder, StockEntry } from './frappe-types';

export const mockItems: Item[] = [
  { name: 'BB-001', item_code: 'BB-001', item_name: 'Kain Katun', item_group: 'Bahan Baku', stock_uom: 'Pcs', is_stock_item: 1, standard_rate: 15000, disabled: 0 },
  { name: 'MJA-01', item_code: 'MJA-01', item_name: 'Panel Surya 100W', item_group: 'Products', stock_uom: 'Unit', is_stock_item: 1, standard_rate: 500000, disabled: 0 },
  { name: 'Plastik BEP', item_code: 'Plastik BEP', item_name: 'Plastik BEP', item_group: 'Bahan Baku', stock_uom: 'Nos', is_stock_item: 1, standard_rate: 5000, disabled: 0 },
  { name: 'FG-001', item_code: 'FG-001', item_name: 'Ember Plastik 20L', item_group: 'Finished Goods', stock_uom: 'Pcs', is_stock_item: 1, standard_rate: 45000, disabled: 0 },
  { name: 'FG-002', item_code: 'FG-002', item_name: 'Kursi Plastik Standar', item_group: 'Finished Goods', stock_uom: 'Pcs', is_stock_item: 1, standard_rate: 120000, disabled: 0 },
  { name: 'RM-001', item_code: 'RM-001', item_name: 'Plastik HDPE Grade A', item_group: 'Raw Materials', stock_uom: 'Kg', is_stock_item: 1, standard_rate: 18000, disabled: 0 },
  { name: 'RM-002', item_code: 'RM-002', item_name: 'Pigmen Biru PP', item_group: 'Raw Materials', stock_uom: 'Kg', is_stock_item: 1, standard_rate: 55000, disabled: 0 },
  { name: 'FG-003', item_code: 'FG-003', item_name: 'Botol PET 600ml', item_group: 'Finished Goods', stock_uom: 'Pcs', is_stock_item: 1, standard_rate: 3500, disabled: 0 },
];

export const mockWarehouses: Warehouse[] = [
  { name: 'Stores - NV', warehouse_name: 'Stores', company: 'Netra Vidya', is_group: 0, disabled: 0, parent_warehouse: 'All Warehouses - NV' },
  { name: 'Work In Progress - NV', warehouse_name: 'Work In Progress', company: 'Netra Vidya', is_group: 0, disabled: 0, parent_warehouse: 'All Warehouses - NV' },
  { name: 'Finished Goods - NV', warehouse_name: 'Finished Goods', company: 'Netra Vidya', is_group: 0, disabled: 0, parent_warehouse: 'All Warehouses - NV' },
  { name: 'Stores - PSB', warehouse_name: 'Stores', company: 'PT Solusi Berdikari', is_group: 0, disabled: 0, parent_warehouse: 'All Warehouses - PSB' },
  { name: 'Finished Goods - PSB', warehouse_name: 'Finished Goods', company: 'PT Solusi Berdikari', is_group: 0, disabled: 0, parent_warehouse: 'All Warehouses - PSB' },
  { name: 'Gudang Barang Jadi - PMS', warehouse_name: 'Gudang Barang Jadi', company: 'PT Maju Sejahtera', is_group: 0, disabled: 0, parent_warehouse: 'All Warehouses - PMS' },
  { name: 'Gudang NG - PMS', warehouse_name: 'Gudang NG', company: 'PT Maju Sejahtera', is_group: 0, disabled: 0, parent_warehouse: 'All Warehouses - PMS' },
];

export const mockBins: Bin[] = [
  { name: 't9i9rqn8j6', item_code: 'MJA-01', warehouse: 'Finished Goods - PSB', actual_qty: 0, planned_qty: 0, indented_qty: 0, ordered_qty: 0, reserved_qty: 100, projected_qty: -100, stock_uom: 'Unit', company: 'PT Solusi Berdikari', valuation_rate: 0, stock_value: 0 },
  { name: 'bin0002', item_code: 'BB-001', warehouse: 'Stores - NV', actual_qty: 250, planned_qty: 0, indented_qty: 0, ordered_qty: 100, reserved_qty: 50, projected_qty: 300, stock_uom: 'Pcs', company: 'Netra Vidya', valuation_rate: 15000, stock_value: 3750000 },
  { name: 'bin0003', item_code: 'FG-001', warehouse: 'Finished Goods - NV', actual_qty: 120, planned_qty: 0, indented_qty: 0, ordered_qty: 0, reserved_qty: 50, projected_qty: 70, stock_uom: 'Pcs', company: 'Netra Vidya', valuation_rate: 45000, stock_value: 5400000 },
  { name: 'bin0004', item_code: 'FG-002', warehouse: 'Gudang Barang Jadi - PMS', actual_qty: 20, planned_qty: 80, indented_qty: 0, ordered_qty: 0, reserved_qty: 100, projected_qty: 0, stock_uom: 'Pcs', company: 'PT Maju Sejahtera', valuation_rate: 120000, stock_value: 2400000 },
  { name: 'bin0005', item_code: 'RM-001', warehouse: 'Stores - PSB', actual_qty: 500, planned_qty: 0, indented_qty: 0, ordered_qty: 200, reserved_qty: 100, projected_qty: 600, stock_uom: 'Kg', company: 'PT Solusi Berdikari', valuation_rate: 18000, stock_value: 9000000 },
  { name: 'bin0006', item_code: 'Plastik BEP', warehouse: 'Gudang NG - PMS', actual_qty: 8, planned_qty: 0, indented_qty: 0, ordered_qty: 0, reserved_qty: 0, projected_qty: 8, stock_uom: 'Nos', company: 'PT Maju Sejahtera', valuation_rate: 5000, stock_value: 40000 },
  { name: 'bin0007', item_code: 'FG-003', warehouse: 'Finished Goods - NV', actual_qty: 5000, planned_qty: 0, indented_qty: 0, ordered_qty: 0, reserved_qty: 1000, projected_qty: 4000, stock_uom: 'Pcs', company: 'Netra Vidya', valuation_rate: 3500, stock_value: 17500000 },
];

export const mockCustomers: Customer[] = [
  { name: 'Pt Sunest', customer_name: 'PT Sunest', customer_type: 'Company', customer_group: 'Commercial', territory: 'Indonesia', mobile_no: '021-5551234', email_id: 'purchase@sunest.co.id', disabled: 0 },
  { name: 'PT Bangunan Jaya', customer_name: 'PT Bangunan Jaya', customer_type: 'Company', customer_group: 'Commercial', territory: 'Jawa Barat', mobile_no: '022-8881234', email_id: 'procurement@bangunanjaya.com', disabled: 0 },
  { name: 'CV Mitra Packaging', customer_name: 'CV Mitra Packaging Solutions', customer_type: 'Company', customer_group: 'Distributor', territory: 'Jawa Tengah', mobile_no: '024-7771234', email_id: 'order@mitrapackaging.co.id', disabled: 0 },
  { name: 'PT Aqua Golden', customer_name: 'PT Aqua Golden Mississippi', customer_type: 'Company', customer_group: 'Distributor', territory: 'DKI Jakarta', mobile_no: '021-9991234', email_id: 'supply@aquagolden.id', disabled: 0 },
  { name: 'PT Unilever Indonesia', customer_name: 'PT Unilever Indonesia', customer_type: 'Company', customer_group: 'Enterprise', territory: 'DKI Jakarta', mobile_no: '021-2341234', email_id: 'procurement@unilever.co.id', disabled: 0 },
  { name: 'PT Indofood CBP', customer_name: 'PT Indofood CBP Sukses Makmur', customer_type: 'Company', customer_group: 'Enterprise', territory: 'DKI Jakarta', mobile_no: '021-5678234', email_id: 'supply@indofood.co.id', disabled: 0 },
];

export const mockSalesOrders: SalesOrder[] = [
  {
    name: 'SAL-ORD-2026-00001',
    customer: 'Pt Sunest',
    customer_name: 'PT Sunest',
    transaction_date: '2026-03-16',
    delivery_date: '2026-03-24',
    status: 'To Deliver and Bill',
    grand_total: 25000000,
    total_qty: 50,
    company: 'PT Solusi Berdikari',
    docstatus: 1,
    delivery_status: 'Not Delivered',
    per_delivered: 0,
    currency: 'IDR',
    items: [
      { item_code: 'MJA-01', item_name: 'Panel Surya 100W', qty: 50, uom: 'Unit', rate: 500000, amount: 25000000, warehouse: 'Finished Goods - PSB', actual_qty: 0 }
    ]
  },
  {
    name: 'SAL-ORD-2026-00002',
    customer: 'PT Bangunan Jaya',
    customer_name: 'PT Bangunan Jaya',
    transaction_date: '2026-03-15',
    delivery_date: '2026-03-21',
    status: 'Completed',
    grand_total: 5400000,
    total_qty: 120,
    company: 'Netra Vidya',
    docstatus: 1,
    delivery_status: 'Fully Delivered',
    per_delivered: 100,
    currency: 'IDR',
    items: [
      { item_code: 'FG-001', item_name: 'Ember Plastik 20L', qty: 120, uom: 'Pcs', rate: 45000, amount: 5400000, warehouse: 'Finished Goods - NV', actual_qty: 120 }
    ]
  },
  {
    name: 'SAL-ORD-2026-00003',
    customer: 'CV Mitra Packaging',
    customer_name: 'CV Mitra Packaging Solutions',
    transaction_date: '2026-03-14',
    delivery_date: '2026-03-28',
    status: 'To Deliver and Bill',
    grand_total: 12000000,
    total_qty: 100,
    company: 'PT Maju Sejahtera',
    docstatus: 1,
    delivery_status: 'Not Delivered',
    per_delivered: 0,
    currency: 'IDR',
    items: [
      { item_code: 'FG-002', item_name: 'Kursi Plastik Standar', qty: 100, uom: 'Pcs', rate: 120000, amount: 12000000, warehouse: 'Gudang Barang Jadi - PMS', actual_qty: 20 }
    ]
  },
  {
    name: 'SAL-ORD-2026-00004',
    customer: 'PT Aqua Golden',
    customer_name: 'PT Aqua Golden Mississippi',
    transaction_date: '2026-03-13',
    delivery_date: '2026-03-20',
    status: 'Draft',
    grand_total: 17500000,
    total_qty: 5000,
    company: 'Netra Vidya',
    docstatus: 0,
    delivery_status: 'Not Delivered',
    per_delivered: 0,
    currency: 'IDR',
    items: [
      { item_code: 'FG-003', item_name: 'Botol PET 600ml', qty: 5000, uom: 'Pcs', rate: 3500, amount: 17500000, warehouse: 'Finished Goods - NV', actual_qty: 5000 }
    ]
  },
  {
    name: 'SAL-ORD-2026-00005',
    customer: 'PT Unilever Indonesia',
    customer_name: 'PT Unilever Indonesia',
    transaction_date: '2026-03-12',
    delivery_date: '2026-03-26',
    status: 'To Deliver and Bill',
    grand_total: 34000000,
    total_qty: 15000,
    company: 'Netra Vidya',
    docstatus: 1,
    delivery_status: 'Not Delivered',
    per_delivered: 0,
    currency: 'IDR',
    items: [
      { item_code: 'FG-003', item_name: 'Botol PET 600ml', qty: 15000, uom: 'Pcs', rate: 3500, amount: 52500000, warehouse: 'Finished Goods - NV', actual_qty: 5000 }
    ]
  },
];

export const mockDeliveryNotes: DeliveryNote[] = [
  {
    name: 'DN-2026-00001',
    customer: 'Pt Sunest',
    customer_name: 'PT Sunest',
    posting_date: '2026-03-16',
    status: 'To Deliver',
    grand_total: 25000000,
    total_qty: 50,
    company: 'PT Solusi Berdikari',
    docstatus: 1,
    lr_no: 'JNE20260315001',
    transport_company: 'JNE Express',
    items: [
      { item_code: 'MJA-01', item_name: 'Panel Surya 100W', qty: 50, uom: 'Unit', rate: 500000, amount: 25000000, warehouse: 'Finished Goods - PSB' }
    ]
  },
  {
    name: 'DN-2026-00002',
    customer: 'PT Bangunan Jaya',
    customer_name: 'PT Bangunan Jaya',
    posting_date: '2026-03-15',
    status: 'Completed',
    grand_total: 5400000,
    total_qty: 120,
    company: 'Netra Vidya',
    docstatus: 1,
    lr_no: 'TIKI20260312001',
    transport_company: 'TIKI',
    items: [
      { item_code: 'FG-001', item_name: 'Ember Plastik 20L', qty: 120, uom: 'Pcs', rate: 45000, amount: 5400000, warehouse: 'Finished Goods - NV' }
    ]
  },
  {
    name: 'DN-2026-00003',
    customer: 'CV Mitra Packaging',
    customer_name: 'CV Mitra Packaging Solutions',
    posting_date: '2026-03-14',
    status: 'To Deliver',
    grand_total: 12000000,
    total_qty: 100,
    company: 'PT Maju Sejahtera',
    docstatus: 1,
    items: [
      { item_code: 'FG-002', item_name: 'Kursi Plastik Standar', qty: 100, uom: 'Pcs', rate: 120000, amount: 12000000, warehouse: 'Gudang Barang Jadi - PMS' }
    ]
  },
  {
    name: 'DN-2026-00004',
    customer: 'PT Aqua Golden',
    customer_name: 'PT Aqua Golden Mississippi',
    posting_date: '2026-03-13',
    status: 'Completed',
    grand_total: 17500000,
    total_qty: 5000,
    company: 'Netra Vidya',
    docstatus: 1,
    lr_no: 'SICEPAT20260310001',
    transport_company: 'SiCepat',
    items: [
      { item_code: 'FG-003', item_name: 'Botol PET 600ml', qty: 5000, uom: 'Pcs', rate: 3500, amount: 17500000, warehouse: 'Finished Goods - NV' }
    ]
  },
  {
    name: 'DN-2026-00005',
    customer: 'PT Unilever Indonesia',
    customer_name: 'PT Unilever Indonesia',
    posting_date: '2026-03-12',
    status: 'Draft',
    grand_total: 0,
    total_qty: 0,
    company: 'Netra Vidya',
    docstatus: 0,
    items: []
  },
];

export const mockBOMs: BOM[] = [
  {
    name: 'BOM-BB-001-001',
    item: 'BB-001',
    item_name: 'Kain Katun',
    quantity: 1,
    is_active: 1,
    is_default: 1,
    company: 'PT Maju Sejahtera',
    currency: 'IDR',
    total_cost: 0,
    docstatus: 0,
    items: [
      { item_code: 'MJA-01', item_name: 'Panel Surya 100W', qty: 1, uom: 'Unit' }
    ]
  },
  {
    name: 'BOM-FG-002-001',
    item: 'FG-002',
    item_name: 'Kursi Plastik Standar',
    quantity: 1,
    is_active: 1,
    is_default: 1,
    company: 'PT Maju Sejahtera',
    currency: 'IDR',
    total_cost: 85000,
    docstatus: 1,
    items: [
      { item_code: 'RM-001', item_name: 'Plastik HDPE Grade A', qty: 4, uom: 'Kg', rate: 18000, amount: 72000 },
      { item_code: 'RM-002', item_name: 'Pigmen Biru PP', qty: 0.2, uom: 'Kg', rate: 55000, amount: 11000 },
    ]
  },
  {
    name: 'BOM-FG-001-001',
    item: 'FG-001',
    item_name: 'Ember Plastik 20L',
    quantity: 1,
    is_active: 1,
    is_default: 1,
    company: 'Netra Vidya',
    currency: 'IDR',
    total_cost: 30000,
    docstatus: 1,
    items: [
      { item_code: 'RM-001', item_name: 'Plastik HDPE Grade A', qty: 1.5, uom: 'Kg', rate: 18000, amount: 27000 },
      { item_code: 'RM-002', item_name: 'Pigmen Biru PP', qty: 0.05, uom: 'Kg', rate: 55000, amount: 2750 },
    ]
  },
];

export const mockWorkOrders: WorkOrder[] = [
  {
    name: 'WO-2026-0001',
    production_item: 'FG-002',
    item_name: 'Kursi Plastik Standar',
    bom_no: 'BOM-FG-002-001',
    company: 'PT Maju Sejahtera',
    status: 'In Process',
    qty: 80,
    produced_qty: 35,
    planned_start_date: '2026-03-15',
    planned_end_date: '2026-03-20',
    actual_start_date: '2026-03-15',
    wip_warehouse: 'Work In Progress - PMS',
    fg_warehouse: 'Gudang Barang Jadi - PMS',
    docstatus: 1,
    sales_order: 'SAL-ORD-2026-00003'
  },
  {
    name: 'WO-2026-0002',
    production_item: 'FG-001',
    item_name: 'Ember Plastik 20L',
    bom_no: 'BOM-FG-001-001',
    company: 'Netra Vidya',
    status: 'Completed',
    qty: 200,
    produced_qty: 200,
    planned_start_date: '2026-03-10',
    planned_end_date: '2026-03-14',
    actual_start_date: '2026-03-10',
    actual_end_date: '2026-03-14',
    wip_warehouse: 'Work In Progress - NV',
    fg_warehouse: 'Finished Goods - NV',
    docstatus: 1,
  },
  {
    name: 'WO-2026-0003',
    production_item: 'FG-003',
    item_name: 'Botol PET 600ml',
    bom_no: 'BOM-FG-003-001',
    company: 'Netra Vidya',
    status: 'Not Started',
    qty: 10000,
    produced_qty: 0,
    planned_start_date: '2026-03-18',
    planned_end_date: '2026-03-25',
    wip_warehouse: 'Work In Progress - NV',
    fg_warehouse: 'Finished Goods - NV',
    docstatus: 1,
    sales_order: 'SAL-ORD-2026-00005'
  },
];

export const mockStockEntries: StockEntry[] = [
  {
    name: 'SE-2026-00001',
    stock_entry_type: 'Material Receipt',
    posting_date: '2026-03-17',
    posting_time: '09:30:00',
    company: 'PT Solusi Berdikari',
    docstatus: 1,
    to_warehouse: 'Stores - PSB',
    total_amount: 9000000,
    remarks: 'Pembelian bahan baku dari supplier',
    items: [
      { item_code: 'RM-001', item_name: 'Plastik HDPE Grade A', qty: 500, uom: 'Kg', t_warehouse: 'Stores - PSB', basic_rate: 18000, amount: 9000000 },
    ]
  },
  {
    name: 'SE-2026-00002',
    stock_entry_type: 'Material Issue',
    posting_date: '2026-03-16',
    posting_time: '14:00:00',
    company: 'PT Maju Sejahtera',
    docstatus: 1,
    from_warehouse: 'Stores - PSB',
    to_warehouse: 'Work In Progress - PMS',
    total_amount: 5760000,
    remarks: 'Pengeluaran bahan baku untuk produksi',
    items: [
      { item_code: 'RM-001', item_name: 'Plastik HDPE Grade A', qty: 320, uom: 'Kg', s_warehouse: 'Stores - PSB', t_warehouse: 'Work In Progress - PMS', basic_rate: 18000, amount: 5760000 },
    ]
  },
  {
    name: 'SE-2026-00003',
    stock_entry_type: 'Material Transfer',
    posting_date: '2026-03-15',
    posting_time: '10:15:00',
    company: 'Netra Vidya',
    docstatus: 1,
    from_warehouse: 'Stores - NV',
    to_warehouse: 'Finished Goods - NV',
    total_amount: 3750000,
    remarks: 'Transfer barang ke gudang finished goods',
    items: [
      { item_code: 'BB-001', item_name: 'Kain Katun', qty: 250, uom: 'Pcs', s_warehouse: 'Stores - NV', t_warehouse: 'Finished Goods - NV', basic_rate: 15000, amount: 3750000 },
    ]
  },
  {
    name: 'SE-2026-00004',
    stock_entry_type: 'Manufacture',
    posting_date: '2026-03-14',
    posting_time: '16:45:00',
    company: 'Netra Vidya',
    docstatus: 1,
    from_warehouse: 'Work In Progress - NV',
    to_warehouse: 'Finished Goods - NV',
    total_amount: 9000000,
    remarks: 'Produksi selesai - Ember Plastik 20L',
    items: [
      { item_code: 'FG-001', item_name: 'Ember Plastik 20L', qty: 200, uom: 'Pcs', s_warehouse: 'Work In Progress - NV', t_warehouse: 'Finished Goods - NV', basic_rate: 45000, amount: 9000000 },
    ]
  },
  {
    name: 'SE-2026-00005',
    stock_entry_type: 'Material Receipt',
    posting_date: '2026-03-13',
    posting_time: '08:00:00',
    company: 'PT Maju Sejahtera',
    docstatus: 1,
    to_warehouse: 'Gudang NG - PMS',
    total_amount: 40000,
    remarks: 'Penerimaan barang tidak sesuai (NG)',
    items: [
      { item_code: 'Plastik BEP', item_name: 'Plastik BEP', qty: 8, uom: 'Nos', t_warehouse: 'Gudang NG - PMS', basic_rate: 5000, amount: 40000 },
    ]
  },
];

// Revenue trend mock data for charts
export const mockRevenueTrend = [
  { month: 'Okt', revenue: 890000000, target: 900000000 },
  { month: 'Nov', revenue: 1020000000, target: 950000000 },
  { month: 'Des', revenue: 1100000000, target: 1000000000 },
  { month: 'Jan', revenue: 950000000, target: 1000000000 },
  { month: 'Feb', revenue: 1050000000, target: 1050000000 },
  { month: 'Mar', revenue: 1110000000, target: 1100000000 },
];

export const mockStockByCategory = [
  { category: 'Botol PET', qty: 65000, value: 227500000 },
  { category: 'Jerigen HDPE', qty: 1200, value: 36000000 },
  { category: 'Tutup Botol', qty: 80000, value: 48000000 },
  { category: 'Pail/Ember', qty: 4500, value: 202500000 },
  { category: 'Container PP', qty: 800, value: 120000000 },
  { category: 'Preform PET', qty: 12000, value: 42000000 },
];

export const mockProductionTrend = [
  { month: 'Okt', planned: 80000, produced: 76000 },
  { month: 'Nov', planned: 90000, produced: 88000 },
  { month: 'Des', planned: 120000, produced: 121000 },
  { month: 'Jan', planned: 85000, produced: 78000 },
  { month: 'Feb', planned: 95000, produced: 91000 },
  { month: 'Mar', planned: 100000, produced: 45000 },
];

export const mockWorkOrderStatus = {
  total: 54,
  completed: 28,
  inProcess: 15,
  pending: 8,
  rejected: 3
};
