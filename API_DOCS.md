# ERP Dashboard API Documentation

## Base URL
```
http://34.101.192.135:8080
```

## Authentication

### Login
```http
POST /api/method/login
Content-Type: application/json

{
  "usr": "Administrator",
  "pwd": "your_password"
}
```

**Response:**
```json
{
  "message": "Logged In",
  "sid": "session_id_cookie",
  "full_name": "Administrator"
}
```

### Logout
```http
POST /api/method/logout
```

### Get Current User
```http
GET /api/method/frappe.auth.get_logged_user
```

---

## CRUD Operations (Postman Examples)

### 1. GET - List Records

**Get All Items:**
```http
GET http://34.101.192.135:8080/api/resource/Item?fields=["name","item_code","item_name","item_group","stock_uom","standard_rate"]&limit_page_length=100
```

**Get All Sales Orders:**
```http
GET http://34.101.192.135:8080/api/resource/Sales%20Order?fields=["name","customer","customer_name","transaction_date","status","grand_total","total_qty","company"]&limit_page_length=100
```

**Get All Customers:**
```http
GET http://34.101.192.135:8080/api/resource/Customer?fields=["name","customer_name","customer_type","customer_group","territory","email_id"]&limit_page_length=100
```

**Get Work Orders:**
```http
GET http://34.101.192.135:8080/api/resource/Work%20Order?fields=["name","production_item","item_name","status","qty","produced_qty","company"]&limit_page_length=50
```

**Get Stock (Bin):**
```http
GET http://34.101.192.135:8080/api/resource/Bin?fields=["name","item_code","warehouse","actual_qty","projected_qty","stock_value"]&limit_page_length=100
```

**Get Warehouses:**
```http
GET http://34.101.192.135:8080/api/resource/Warehouse?fields=["name","warehouse_name","company","is_group"]&limit_page_length=50
```

### 2. GET - Get Single Record

**Get Specific Item:**
```http
GET http://34.101.192.135:8080/api/resource/Item/BB-001
```

**Get Specific Sales Order:**
```http
GET http://34.101.192.135:8080/api/resource/Sales%20Order/SAL-ORD-2026-00001
```

### 3. POST - Create Record

**Create New Item:**
```http
POST http://34.101.192.135:8080/api/resource/Item
Content-Type: application/json

{
  "item_code": "NEW-ITEM-001",
  "item_name": "Produk Baru",
  "item_group": "Products",
  "stock_uom": "Pcs",
  "is_stock_item": 1,
  "standard_rate": 50000,
  "company": "Netra Vidya"
}
```

**Create New Customer:**
```http
POST http://34.101.192.135:8080/api/resource/Customer
Content-Type: application/json

{
  "customer_name": "PT Contoh Indonesia",
  "customer_type": "Company",
  "customer_group": "Commercial",
  "territory": "Indonesia",
  "email_id": "info@contoh.id",
  "mobile_no": "021-1234567"
}
```

**Create New Sales Order:**
```http
POST http://34.101.192.135:8080/api/resource/Sales%20Order
Content-Type: application/json

{
  "customer": "PT Contoh Indonesia",
  "transaction_date": "2026-03-16",
  "delivery_date": "2026-03-23",
  "company": "Netra Vidya",
  "items": [
    {
      "item_code": "FG-001",
      "qty": 10,
      "uom": "Pcs",
      "rate": 45000,
      "warehouse": "Finished Goods - NV"
    }
  ]
}
```

### 4. PUT - Update Record

**Update Item:**
```http
PUT http://34.101.192.135:8080/api/resource/Item/NEW-ITEM-001
Content-Type: application/json

{
  "standard_rate": 55000,
  "item_name": "Produk Baru Updated"
}
```

**Update Sales Order Status:**
```http
PUT http://34.101.192.135:8080/api/resource/Sales%20Order/SAL-ORD-2026-00001
Content-Type: application/json

{
  "status": "Completed"
}
```

### 5. DELETE - Delete Record

**Delete Item:**
```http
DELETE http://34.101.192.135:8080/api/resource/Item/NEW-ITEM-001
```

---

## Using with Dashboard Proxy

You can also use the Next.js proxy:

```http
GET http://localhost:3000/api/frappe/resource/Item?fields=["name","item_code"]&limit_page_length=50
```

---

## Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `fields` | Array of fields to return | `?fields=["name","item_code"]` |
| `filters` | Filter conditions | `?filters=[["item_group","=","Products"]]` |
| `order_by` | Sort order | `?order_by=creation desc` |
| `limit_page_length` | Max results | `?limit_page_length=100` |
| `limit_start` | Pagination offset | `?limit_start=0` |

---

## Common Doctypes

- **Item** - Master produk
- **Customer** - Master pelanggan
- **Supplier** - Master supplier
- **Sales Order** - Pesanan penjualan
- **Purchase Order** - Pesanan pembelian
- **Delivery Note** - Surat jalan
- **Purchase Receipt** - Penerimaan barang
- **Stock Entry** - Entri stok
- **Work Order** - Order produksi
- **BOM** - Bill of Materials
- **Warehouse** - Gudang
- **Bin** - Lokasi stok
- **Employee** - Karyawan

---

## Headers Required

For all requests:
```
Content-Type: application/json
Accept: application/json
Cookie: sid=session_id_from_login
```

Or using API Key (recommended for production):
```
Authorization: token api_key:api_secret
```
