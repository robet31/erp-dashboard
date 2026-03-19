# ERP Dashboard - Testing Scenarios

## Table of Contents
1. [Login Credentials](#login-credentials)
2. [Test Scenarios by Role](#test-scenarios-by-role)
3. [CRUD Operations](#crud-operations)

---

## Login Credentials

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Direktur | direktur@erp.com | password123 | Full Access |
| Manajer Pabrik | manajer@erp.com | password123 | Produksi & Sales View |
| Staff Sales | sales@erp.com | password123 | Penjualan |
| Staff Gudang | gudang@erp.com | password123 | Inventory & Warehouse |
| Operator Produksi | produksi@erp.com | password123 | Manufaktur |

---

## Test Scenarios by Role

### 🔵 Test 1: Staff Gudang (gudang@erp.com)

**Expected Access:**
- ✅ Dashboard
- ✅ Selling (Delivery Notes)
- ✅ Stock (Items, Warehouses, Bin, Stock Entry)

**Steps:**
1. Login dengan **gudang@erp.com**
2. Buka **/dashboard/stock**

#### A. Items CRUD
1. Klik tab **Items**
2. ✅ **Create Item:**
   - Klik tombol **"Item Baru"**
   - Isi: Item Code, Item Name, Item Group, Stock UOM
   - Klik "Simpan ke ERP"
   - Verifikasi: Alert sukses, item muncul di tabel
3. ✅ **Edit Item:**
   - Klik icon **Edit** di tabel
   - Ubah nama/item name
   - Klik "Simpan Perubahan"
   - Verifikasi: Alert sukses
4. ✅ **Delete Item:**
   - Di modal edit, klik tombol **Hapus**
   - Konfirmasi OK
   - Verifikasi: Alert sukses, item dihapus dari tabel

#### B. Warehouse CRUD
1. Klik tab **Warehouse**
2. ✅ **Create Warehouse:**
   - Klik tombol **"Warehouse Baru"**
   - Isi: Nama Warehouse, Perusahaan
   - Klik "Simpan ke ERP"
   - Verifikasi: Alert sukses, warehouse muncul di tabel
3. ✅ **Edit Warehouse:**
   - Klik icon **Edit** di tabel
   - Ubah nama warehouse
   - Klik "Simpan Perubahan"
   - Verifikasi: Alert sukses
4. ✅ **Delete Warehouse:**
   - Di modal edit, klik tombol **Hapus**
   - Konfirmasi OK
   - Verifikasi: Alert sukses

#### C. Stock Entry CRUD
1. Klik tab **Stock Entry**
2. ✅ **Create Stock Entry:**
   - Klik tombol **"Stock Entry"**
   - Pilih Tipe: Material Receipt
   - Pilih Perusahaan
   - Pilih Item dan Qty
   - Pilih Warehouse
   - Klik "Simpan ke ERP"
   - Verifikasi: Alert sukses
3. ✅ **Delete Stock Entry:**
   - Klik icon **Hapus** di tabel
   - Konfirmasi OK
   - Verifikasi: Alert sukses

---

### 🟢 Test 2: Staff Sales (sales@erp.com)

**Expected Access:**
- ✅ Dashboard
- ✅ Selling (Sales Orders, Customers, Delivery Notes)
- ✅ Stock (Items, Bin - View Only)

**Steps:**
1. Login dengan **sales@erp.com**
2. Buka **/dashboard/selling**

#### A. Sales Order CRUD
1. ✅ **Create Sales Order:**
   - Klik **"Sales Order Baru"**
   - Pilih Customer
   - Pilih Item, Qty, Rate
   - Klik "Simpan Sales Order"
   - Verifikasi: Alert sukses

#### B. Customer CRUD
1. Klik tab **Customers**
2. ✅ **Create Customer:**
   - Klik **"Customer Baru"**
   - Isi: Nama, Tipe, Territory, Phone, Email
   - Klik "Simpan Customer"
   - Verifikasi: Alert sukses
3. ✅ **Edit Customer:**
   - Klik icon **Edit** di tabel
   - Ubah data
   - Klik "Simpan Perubahan"
   - Verifikasi: Alert sukses
4. ✅ **Delete Customer:**
   - Di modal edit, klik **Hapus**
   - Konfirmasi OK

---

### 🟣 Test 3: Operator Produksi (produksi@erp.com)

**Expected Access:**
- ✅ Dashboard
- ✅ Stock (Items, Bin - View Only)
- ✅ Manufacturing (BOM, Work Orders)

**Steps:**
1. Login dengan **produksi@erp.com**
2. Buka **/dashboard/manufacturing**

#### A. Work Order CRUD
1. ✅ **Create Work Order:**
   - Klik **"Work Order Baru"**
   - Pilih Item Produksi
   - Pilih BOM
   - Isi Qty, Tanggal
   - Pilih FG Warehouse & WIP Warehouse
   - Klik "Buat Work Order"
   - Verifikasi: Alert sukses

2. ✅ **Edit Work Order:**
   - Klik Work Order di tabel
   - Update status/qty
   - Verifikasi: Alert sukses

---

### 🔴 Test 4: Direktur (direktur@erp.com)

**Expected Access:**
- ✅ SEMUA MODUL
- ✅ SEMUA CRUD

**Steps:**
1. Login dengan **direktur@erp.com**
2. Test semua fitur dari semua role di atas

---

## API Testing (Optional)

Buka **/api-tester** untuk testing manual:

### Example: Create Item
```
Method: POST
URL: /api/resource/Item
Body:
{
  "item_code": "TEST-ITEM-001",
  "item_name": "Test Item Baru",
  "item_group": "All Item Groups",
  "stock_uom": "Nos",
  "standard_rate": 50000
}
```

### Example: Get Items
```
Method: GET
URL: /api/resource/Item?limit_page_length=10
```

---

## Expected Results

| Feature | Gudang | Sales | Produksi | Direktur |
|---------|--------|-------|----------|----------|
| Items Create | ✅ | ❌ | ❌ | ✅ |
| Items Edit | ✅ | ❌ | ❌ | ✅ |
| Items Delete | ✅ | ❌ | ❌ | ✅ |
| Warehouse Create | ✅ | ❌ | ❌ | ✅ |
| Warehouse Edit | ✅ | ❌ | ❌ | ✅ |
| Warehouse Delete | ✅ | ❌ | ❌ | ✅ |
| Stock Entry Create | ✅ | ❌ | ❌ | ✅ |
| Stock Entry Delete | ✅ | ❌ | ❌ | ✅ |
| Sales Order Create | ❌ | ✅ | ❌ | ✅ |
| Customer Create | ❌ | ✅ | ❌ | ✅ |
| Work Order Create | ❌ | ❌ | ✅ | ✅ |

---

## Troubleshooting

### Error: "Gagal membuat..."
- Periksa koneksi ke server Frappe
- Pastikan field wajib diisi
- Cek console browser untuk detail error

### Error: "Tidak dapat terhubung ke server ERP"
- Server Frappe mungkin sedang offline
- Periksa URL di .env.local

### Data tidak muncul di tabel
- Refresh halaman
- Cek filter yang aktif
- Periksa console untuk error
