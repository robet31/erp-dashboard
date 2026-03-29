// src/config/frappe-data.ts
// Konfigurasi data statis dari Frappe ERP
// Data ini diambil dari API Frappe — HARUS cocok persis dengan nama di ERPNext

export const FRAPPE_COMPANIES = [
  { name: 'Artavista', code: 'A', short: 'Artavista' },
  { name: 'PT Solusi Berdikari', code: 'PSB', short: 'Solusi Berdikari' },
  { name: 'PT Maju Sejahtera', code: 'PMS', short: 'Maju Sejahtera' },
  { name: 'PT Maju Jaya Abadi', code: 'PMJA', short: 'Maju Jaya' },
];

export const FRAPPE_WAREHOUSES = [
  // Artavista (suffix - A, sesuai ERPNext)
  { name: 'Stores - A', company: 'Artavista', type: 'Stores' },
  { name: 'Work In Progress - A', company: 'Artavista', type: 'WIP' },
  { name: 'Finished Goods - A', company: 'Artavista', type: 'FG' },
  { name: 'Goods In Transit - A', company: 'Artavista', type: 'Transit' },
  { name: 'Raw Materials - A', company: 'Artavista', type: 'Stores' },
  // PT Solusi Berdikari
  { name: 'Stores - PSB', company: 'PT Solusi Berdikari', type: 'Stores' },
  { name: 'Work In Progress - PSB', company: 'PT Solusi Berdikari', type: 'WIP' },
  { name: 'Finished Goods - PSB', company: 'PT Solusi Berdikari', type: 'FG' },
  { name: 'Goods In Transit - PSB', company: 'PT Solusi Berdikari', type: 'Transit' },
  // PT Maju Sejahtera
  { name: 'Stores - PMS', company: 'PT Maju Sejahtera', type: 'Stores' },
  { name: 'Work In Progress - PMS', company: 'PT Maju Sejahtera', type: 'WIP' },
  { name: 'Finished Goods - PMS', company: 'PT Maju Sejahtera', type: 'FG' },
  { name: 'Goods In Transit - PMS', company: 'PT Maju Sejahtera', type: 'Transit' },
  { name: 'Gudang Barang Jadi - PMS', company: 'PT Maju Sejahtera', type: 'FG' },
  { name: 'Gudang NG - PMS', company: 'PT Maju Sejahtera', type: 'NG' },
  // PT Maju Jaya Abadi
  { name: 'Stores - PMJA', company: 'PT Maju Jaya Abadi', type: 'Stores' },
  { name: 'Work In Progress - PMJA', company: 'PT Maju Jaya Abadi', type: 'WIP' },
  { name: 'Finished Goods - PMJA', company: 'PT Maju Jaya Abadi', type: 'FG' },
  { name: 'Goods In Transit - PMJA', company: 'PT Maju Jaya Abadi', type: 'Transit' },
  { name: 'Gudang Bahan Baku - PMJA', company: 'PT Maju Jaya Abadi', type: 'Stores' },
  { name: 'Gudang Barang Jadi - PMJA', company: 'PT Maju Jaya Abadi', type: 'FG' },
  { name: 'Gudang Barang Reject - PMJA', company: 'PT Maju Jaya Abadi', type: 'NG' },
];

export const FRAPPE_CUSTOMERS = [
  { name: 'Pt Sunest', customer_name: 'Pt Sunest', customer_type: 'Company' },
  { name: 'Toko Mebel Sejahtera', customer_name: 'Toko Mebel Sejahtera', customer_type: 'Individual' },
  { name: 'PT Plastik Jaya', customer_name: 'PT Plastik Jaya', customer_type: 'Company' },
];

export const STOCK_ENTRY_TYPES = [
  { value: 'Material Receipt', label: 'Material Receipt (Penerimaan)' },
  { value: 'Material Issue', label: 'Material Issue (Pengeluaran)' },
  { value: 'Material Transfer', label: 'Material Transfer (Transfer)' },
  { value: 'Material Transfer for Manufacture', label: 'Transfer for Manufacture' },
  { value: 'Manufacture', label: 'Manufacture (Produksi)' },
  { value: 'Repack', label: 'Repack (Kemasan Ulang)' },
  { value: 'Send to Subcontractor', label: 'Send to Subcontractor' },
];

export function getWarehousesByCompany(company: string) {
  return FRAPPE_WAREHOUSES.filter(w => w.company === company);
}

export function getDefaultWarehouses() {
  return FRAPPE_WAREHOUSES.filter(w => 
    w.type === 'Stores' || w.type === 'WIP' || w.type === 'FG'
  );
}

export function getStoreWarehouse(company: string) {
  return `Stores - ${getCompanyCode(company)}`;
}

export function getWIPWarehouse(company: string) {
  return `Work In Progress - ${getCompanyCode(company)}`;
}

export function getFGWarehouse(company: string) {
  return `Finished Goods - ${getCompanyCode(company)}`;
}

export function getCompanyCode(companyName: string): string {
  const company = FRAPPE_COMPANIES.find(c => c.name === companyName);
  return company ? company.code : 'A';
}
