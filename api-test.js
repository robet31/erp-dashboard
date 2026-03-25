// ==========================================
// TEST API FRAPPE - MINI ERP DASHBOARD
// Buka developer tools (F12) → Console → Paste kode ini
// ==========================================

const BASE_URL = 'http://34.101.192.135:8080';
const COMPANY = 'Netra Vidya';

// Konfigurasi standar untuk Fetch API via Browser (menggunakan Cookie)
const FETCH_OPTS = {
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  credentials: 'include' // Penting agar session cookie ikut terkirim
};

// Helper untuk membaca pesan error bawaan Frappe
async function handleResponse(res, actionName) {
  const data = await res.json();
  if (!res.ok || data.exc) {
    let errorMsg = data.message || "Terjadi kesalahan";
    if (data._server_messages) {
      try { errorMsg = JSON.parse(JSON.parse(data._server_messages)[0]).message.replace(/<[^>]*>?/gm, ''); } catch(e){}
    }
    console.error(`❌ [${actionName}] GAGAL:`, errorMsg);
    return null;
  }
  console.log(`✅ [${actionName}] SUKSES:`, data.data || data.message || data);
  return data.data || data;
}

// ---------------------------------------------------------
// 1. AUTHENTICATION
// ---------------------------------------------------------
async function login(usr, pwd) {
  console.log('⏳ Sedang mencoba login...');
  const res = await fetch(`${BASE_URL}/api/method/login`, {
    method: 'POST',
    ...FETCH_OPTS,
    body: JSON.stringify({ usr, pwd })
  });
  const data = await res.json();
  if(data.message === "Logged In") {
    console.log('✅ Login Berhasil! Anda sudah bisa menjalankan test API lainnya.');
  } else {
    console.error('❌ Login Gagal:', data);
  }
}

// Helper: Submit Dokumen (Ubah Draft -> Submitted)
async function submitDoc(doctype, docname) {
  console.log(`⏳ Melakukan submit dokumen ${doctype} (${docname})...`);
  const res = await fetch(`${BASE_URL}/api/resource/${doctype}/${encodeURIComponent(docname)}`, {
    method: 'PUT',
    ...FETCH_OPTS,
    body: JSON.stringify({ docstatus: 1 })
  });
  return handleResponse(res, `Submit ${doctype}`);
}

// ---------------------------------------------------------
// 2. MODAL STOCK (INVENTORY)
// ---------------------------------------------------------
async function testCreateItem() {
  const itemCode = 'API-ITEM-' + Date.now();
  const res = await fetch(`${BASE_URL}/api/resource/Item`, {
    method: 'POST',
    ...FETCH_OPTS,
    body: JSON.stringify({
      item_code: itemCode,
      item_name: 'Produk Hasil Test API',
      item_group: 'Products',
      stock_uom: 'Nos',
      is_stock_item: 1,
      standard_rate: 50000
    })
  });
  return handleResponse(res, 'Create Item');
}

async function testStockEntry(itemCode, qty, targetWarehouse) {
  const res = await fetch(`${BASE_URL}/api/resource/Stock Entry`, {
    method: 'POST',
    ...FETCH_OPTS,
    body: JSON.stringify({
      stock_entry_type: 'Material Receipt',
      company: COMPANY,
      set_posting_time: 1,
      to_warehouse: targetWarehouse,
      items: [
        {
          item_code: itemCode,
          qty: qty,
          t_warehouse: targetWarehouse,
          basic_rate: 1000 // Wajib diisi untuk Receipt jika tidak ada valuation rate
        }
      ]
    })
  });
  const draft = await handleResponse(res, 'Draft Stock Entry');
  if (draft) {
    await submitDoc('Stock Entry', draft.name);
  }
}

// ---------------------------------------------------------
// 3. MODUL SELLING
// ---------------------------------------------------------
async function testCreateCustomer() {
  const custName = 'PT API Testing ' + Math.floor(Math.random() * 1000);
  const res = await fetch(`${BASE_URL}/api/resource/Customer`, {
    method: 'POST',
    ...FETCH_OPTS,
    body: JSON.stringify({
      customer_name: custName,
      customer_type: 'Company',
      customer_group: 'Commercial',
      territory: 'Indonesia'
    })
  });
  return handleResponse(res, 'Create Customer');
}

async function testSalesOrder(customerName, itemCode, qty, rate) {
  const res = await fetch(`${BASE_URL}/api/resource/Sales Order`, {
    method: 'POST',
    ...FETCH_OPTS,
    body: JSON.stringify({
      customer: customerName,
      company: COMPANY,
      transaction_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Besok
      currency: 'IDR',
      items: [
        { item_code: itemCode, qty: qty, rate: rate }
      ]
    })
  });
  const draft = await handleResponse(res, 'Draft Sales Order');
  // Hapus komentar di bawah jika ingin otomatis ter-submit
  // if (draft) await submitDoc('Sales Order', draft.name);
}

// ---------------------------------------------------------
// 4. MODUL MANUFACTURING
// ---------------------------------------------------------
async function testWorkOrder(itemCode, bomNo, qty, wipWarehouse, fgWarehouse) {
  const res = await fetch(`${BASE_URL}/api/resource/Work Order`, {
    method: 'POST',
    ...FETCH_OPTS,
    body: JSON.stringify({
      production_item: itemCode,
      bom_no: bomNo,
      qty: qty,
      company: COMPANY,
      wip_warehouse: wipWarehouse,
      fg_warehouse: fgWarehouse,
      use_multi_level_bom: 0
    })
  });
  return handleResponse(res, 'Create Work Order');
}

// ==========================================
// MENU PANDUAN PENGGUNAAN
// ==========================================
console.log('%c🚀 FRAPPE API TEST KIT READY!', 'color: #0066B3; font-size: 16px; font-weight: bold;');
console.log('Jalankan perintah berikut di console Anda:');
console.log('--------------------------------------------------');
console.log('🔑 1. Login dulu:');
console.log('   login("Administrator", "passwordAnda")');
console.log('\n📦 2. Test Modul Stock:');
console.log('   testCreateItem()');
console.log('   testStockEntry("KODE-ITEM", 50, "Finished Goods - NV")');
console.log('\n🤝 3. Test Modul Selling:');
console.log('   testCreateCustomer()');
console.log('   testSalesOrder("Nama Customer", "KODE-ITEM", 10, 150000)');
console.log('\n⚙️ 4. Test Modul Manufacturing (BOM harus sudah ada di ERPNext):');
console.log('   testWorkOrder("KODE-ITEM", "BOM-ITEM-001", 5, "Work In Progress - NV", "Finished Goods - NV")');
console.log('--------------------------------------------------');