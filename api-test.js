// Test API Frappe - bisa dijalankan di browser console
// Buka developer tools (F12) → Console → paste kode ini

const BASE_URL = 'http://34.101.192.135:8080';

async function login(usr, pwd) {
  const res = await fetch(`${BASE_URL}/api/method/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usr, pwd }),
    credentials: 'include'
  });
  const data = await res.json();
  console.log('Login:', data);
  return res.headers.get('set-cookie');
}

async function getCookies() {
  return document.cookie;
}

// Test: Create Item
async function createItem() {
  const res = await fetch(`${BASE_URL}/api/resource/Item`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      item_code: 'TEST-ITEM-' + Date.now(),
      item_name: 'Item Test API',
      item_group: 'Products',
      stock_uom: 'Pcs',
      is_stock_item: 1,
      company: 'Netra Vidya'
    }),
    credentials: 'include'
  });
  const data = await res.json();
  console.log('Create Item Response:', data);
  return data;
}

// Test: Get Items
async function getItems() {
  const res = await fetch(`${BASE_URL}/api/resource/Item?limit_page_length=10`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    credentials: 'include'
  });
  const data = await res.json();
  console.log('Items:', data);
  return data;
}

// Test: Create Stock Entry
async function createStockEntry() {
  const res = await fetch(`${BASE_URL}/api/resource/Stock Entry`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      stock_entry_type: 'Material Receipt',
      company: 'Netra Vidya',
      items: [
        {
          item_code: 'FG-001',
          qty: 100,
          t_warehouse: 'Stores - NV'
        }
      ]
    }),
    credentials: 'include'
  });
  const data = await res.json();
  console.log('Stock Entry Response:', data);
  return data;
}

console.log('=== FRAPPE API TEST ===');
console.log('1. Login dulu dengan: login("Administrator", "password")');
console.log('2. Create item: createItem()');
console.log('3. Get items: getItems()');
console.log('4. Create stock entry: createStockEntry()');
