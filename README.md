# 🏢 Artavista ERP Dashboard

> Dashboard ERP modern berbasis web untuk **PT Artavista** — terintegrasi penuh dengan **Frappe ERPNext** sebagai backend.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![Frappe](https://img.shields.io/badge/Frappe-ERPNext-0089FF)

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Arsitektur & Database](#-arsitektur--database)
- [Alur Kerja per Role](#-alur-kerja-per-role)
- [User Roles](#-user-roles--hak-akses)
- [Cara Instalasi](#-cara-instalasi-step-by-step)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Struktur Folder](#-struktur-folder)
- [Environment Variables](#-environment-variables)
- [Panduan Penggunaan](#-panduan-penggunaan)
- [CRUD & Sinkronisasi Frappe](#-crud--sinkronisasi-frappe)
- [Screenshots](#-screenshots)
- [FAQ](#-faq)

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 📊 **Dashboard Overview** | Statistik bisnis real-time (Revenue, Orders, Stock, Produksi) |
| 🛒 **Modul Selling** | Kelola Customer, Sales Order, dan Sales Invoice |
| 📦 **Modul Inventory** | Kelola Item, Stock Entry, Warehouse, dan Delivery Note |
| 🏭 **Modul Manufacturing** | Kelola BOM (Bill of Materials), Work Order, dan Job Card |
| 👥 **User Management** | CRUD user dengan role-based access control (RBAC) |
| 🔔 **Notifikasi Dinamis** | Notifikasi real-time berdasarkan role user |
| 🌙 **Dark Mode** | Tema gelap yang konsisten di seluruh halaman |
| 🌐 **Bilingual (ID/EN)** | Semua teks dashboard mendukung Bahasa Indonesia & English |
| 📐 **Data Density** | 3 tingkat kepadatan tampilan (Comfortable / Cozy / Compact) |
| 📱 **Responsive** | Optimal di desktop, tablet, dan mobile |
| 🔍 **Global Search** | Pencarian cepat menu & halaman (Ctrl+K) |
| 🔐 **Authentication** | Login via PostgreSQL + Frappe API (dual-source) |
| 💀 **Skeleton Loading** | Tampilan skeleton saat loading data untuk UX yang premium |

---

## 🛠 Tech Stack

### Arsitektur Visual

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend (Next.js 16)"]
        UI["React 19 + TypeScript"]
        Charts["Recharts 3.8"]
        Icons["Lucide React"]
        Forms["React Hook Form + Zod"]
        Query["TanStack React Query"]
    end

    subgraph Backend["⚙️ Backend"]
        API["Next.js API Routes"]
        Prisma["Prisma ORM 5"]
        Proxy["Frappe API Proxy"]
    end

    subgraph Database["🗄️ Database"]
        PG["PostgreSQL (Neon Cloud)"]
        Frappe["Frappe ERPNext (GCP)"]
    end

    UI --> API
    Charts --> Query
    Query --> API
    API --> Prisma --> PG
    API --> Proxy --> Frappe
```

### Frontend
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| **Next.js** | 16.1.6 | Framework React full-stack (App Router) |
| **React** | 19.2.3 | UI Component Library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Recharts** | 3.8.0 | Grafik & chart interaktif |
| **Lucide React** | 0.577.0 | Icon library modern |
| **React Hook Form** | 7.71.2 | Form handling |
| **Zod** | 4.3.6 | Schema validation |
| **TanStack React Query** | 5.90.21 | Data fetching & caching |
| **Axios** | 1.13.6 | HTTP client |
| **date-fns** | 4.1.0 | Date formatting utility |

### Backend & Database
| Teknologi | Kegunaan |
|-----------|----------|
| **Frappe ERPNext** | Backend ERP utama (REST API) — hosted di GCP |
| **PostgreSQL (Neon)** | Database cloud untuk user auth & management |
| **Prisma** | ORM untuk akses PostgreSQL |
| **Next.js API Routes** | Proxy ke Frappe API + auth endpoints |

### Styling
| Teknologi | Kegunaan |
|-----------|----------|
| **CSS (Vanilla)** | Styling utama dengan CSS custom properties |
| **Google Fonts (Poppins)** | Font utama seluruh aplikasi |
| **Skeleton UI** | Shimmer loading effect saat fetch data |

---

## 🗄 Arsitektur & Database

### Alur Data

```mermaid
flowchart LR
    Browser["🌐 Browser"] --> NextAPI["Next.js API Routes"]
    NextAPI --> |Auth| PostgreSQL["🐘 PostgreSQL\n(Neon Cloud)"]
    NextAPI --> |ERP Data| Frappe["🔗 Frappe ERPNext\n(GCP)"]
    
    PostgreSQL --> |Users, Roles| NextAPI
    Frappe --> |Sales, Stock,\nManufacturing| NextAPI
```

### Database Schema (Prisma)

```prisma
model User {
  id         String   @id @default(uuid())
  full_name  String
  email      String   @unique
  password   String
  role       String   // admin_sales | admin_gudang | manajer_produksi | operator | administrator
  created_at DateTime @default(now())
}
```

### API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/auth/register` | Register user baru |
| `POST` | `/api/auth/login` | Login (email + password) |
| `GET` | `/api/auth/users` | List semua user dari DB |
| `PATCH` | `/api/auth/users` | Update role/info user |
| `DELETE` | `/api/auth/users?email=...` | Hapus user dari DB |
| `GET` | `/api/auth/session` | Cek session aktif |
| `GET/POST` | `/api/frappe/*` | Proxy ke Frappe ERPNext API |

---

## 🔄 Alur Kerja per Role

### Administrator — Full Access Flow

```mermaid
flowchart TD
    Login["🔐 Login as Administrator"] --> Dashboard["📊 Dashboard Overview"]
    Dashboard --> Selling["🛒 Selling Module"]
    Dashboard --> Stock["📦 Inventory Module"]
    Dashboard --> Mfg["🏭 Manufacturing Module"]
    Dashboard --> Users["👥 Kelola User"]
    
    Selling --> SO["Create Sales Order"]
    Selling --> SI["Lihat Sales Invoice"]
    Selling --> Cust["Kelola Customer"]
    
    Stock --> Item["Kelola Item"]
    Stock --> SE["Create Stock Entry"]
    Stock --> WH["Lihat Warehouse"]
    Stock --> DN["Create Delivery Note"]
    
    Mfg --> BOM["Create BOM"]
    Mfg --> WO["Create/Edit Work Order"]
    Mfg --> JC["Create Job Card"]
    
    Users --> AddUser["Tambah User"]
    Users --> EditRole["Edit Role User"]
    Users --> DeleteUser["Hapus User"]
    
    SO --> |Sync| Frappe["☁️ Frappe ERPNext"]
    SE --> |Sync| Frappe
    WO --> |Sync| Frappe
    BOM --> |Sync| Frappe
    DN --> |Sync| Frappe
```

### Admin Sales — Selling Flow

```mermaid
flowchart LR
    Login["🔐 Login"] --> Home["🏠 Selling Home"]
    Home --> Analytics["📊 Sales Analytics"]
    Home --> Orders["📋 Sales Orders"]
    Home --> Customers["👥 Customers"]
    Home --> Invoices["🧾 Sales Invoice"]
    
    Orders --> CreateSO["➕ Create Sales Order"]
    CreateSO --> SelectCust["Pilih Customer"]
    SelectCust --> AddItems["Tambah Item & Qty"]
    AddItems --> Submit["✅ Submit ke Frappe"]
    
    Customers --> CreateCust["➕ Create Customer"]
    CreateCust --> FillInfo["Isi Nama & Territory"]
    FillInfo --> SaveCust["💾 Simpan ke Frappe"]
```

### Admin Gudang — Inventory Flow

```mermaid
flowchart LR
    Login["🔐 Login"] --> Home["🏠 Inventory Home"]
    Home --> Items["📦 Items"]
    Home --> StockEntry["📥 Stock Entry"]
    Home --> Warehouse["🏭 Warehouses"]
    Home --> DN["🚚 Delivery Notes"]
    
    Items --> CreateItem["➕ Create Item"]
    StockEntry --> CreateSE["➕ Material Receipt"]
    CreateSE --> SelectWH["Pilih Warehouse"]
    SelectWH --> AddQty["Input Qty"]
    AddQty --> SaveSE["💾 Simpan ke Frappe"]
    
    DN --> CreateDN["➕ Create Delivery Note"]
```

### Manajer Produksi — Manufacturing Flow

```mermaid
flowchart LR
    Login["🔐 Login"] --> Home["🏠 Manufacturing Home"]
    Home --> BOM["📐 Bill of Materials"]
    Home --> WO["🔧 Work Orders"]
    Home --> JC["🎫 Job Cards"]
    
    BOM --> CreateBOM["➕ Create BOM"]
    CreateBOM --> SelectItem["Pilih Item"]
    SelectItem --> AddMaterials["Tambah Material & Qty"]
    AddMaterials --> SaveBOM["💾 Simpan ke Frappe"]
    
    WO --> CreateWO["➕ Create Work Order"]
    CreateWO --> SelectBOM["Pilih BOM"]
    SelectBOM --> SetQty["Set Produksi Qty"]
    SetQty --> SaveWO["💾 Simpan ke Frappe"]
    
    JC --> CreateJC["➕ Create Job Card"]
```

---

## 👤 User Roles & Hak Akses

Sistem menggunakan **5 role** dengan hak akses yang berbeda:

### 1. 🛒 Admin Sales (`admin_sales`)
| Modul | Hak Akses |
|-------|-----------|
| Dashboard | ✅ Revenue Stats, Sales Orders, Items |
| Selling | ✅ Create/Edit Customer, Sales Order |
| Inventory | ❌ |
| Manufacturing | ❌ |
| User Management | ❌ |

### 2. 📦 Admin Gudang (`admin_gudang`)
| Modul | Hak Akses |
|-------|-----------|
| Dashboard | ✅ Items, Production Status |
| Selling | ❌ |
| Inventory | ✅ Create Item, Create/Edit Stock Entry, Delivery Note |
| Manufacturing | ❌ |
| User Management | ❌ |

### 3. 🏭 Manajer Produksi (`manajer_produksi`)
| Modul | Hak Akses |
|-------|-----------|
| Dashboard | ✅ Production Status, Items |
| Selling | ❌ |
| Inventory | ❌ |
| Manufacturing | ✅ Create BOM, Work Order, Job Card |
| User Management | ❌ |

### 4. 🔧 Operator (`operator`)
| Modul | Hak Akses |
|-------|-----------|
| Dashboard | ✅ Production Status, Items |
| Selling | ❌ |
| Inventory | ❌ |
| Manufacturing | ✅ Create Job Card saja |
| User Management | ❌ |

### 5. 🔑 Administrator (`administrator`)
| Modul | Hak Akses |
|-------|-----------|
| Dashboard | ✅ Revenue Stats, Sales Orders, Items, Production Status |
| Selling | ✅ Semua fitur (CRUD) |
| Inventory | ✅ Semua fitur (CRUD) |
| Manufacturing | ✅ Semua fitur (CRUD) |
| User Management | ✅ Create, Edit, Delete User |

### Akun Default

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@artavista.com` | `@Artavista123` |

> ⚠️ User baru yang didaftarkan melalui panel admin akan mendapatkan password default `password123`. Segera ganti setelah login pertama.

---

## 🚀 Cara Instalasi (Step by Step)

### Prerequisites

Pastikan sudah terinstall di komputer Anda:

| Software | Versi Minimum | Cara Cek |
|----------|---------------|----------|
| **Node.js** | ≥ 18.x | `node -v` |
| **npm** | ≥ 9.x | `npm -v` |
| **Git** | Terbaru | `git --version` |

### Langkah Instalasi

#### Step 1: Clone Repository

```bash
git clone https://github.com/<username>/erp-dashboard.git
cd erp-dashboard
```

#### Step 2: Install Dependencies

```bash
npm install
```

> ⏳ Proses ini akan mengunduh ~200MB+ dependencies. Pastikan koneksi internet stabil.

#### Step 3: Setup Environment Variables

Buat file `.env.local` di root project:

```bash
# Di Linux/Mac:
cp .env.example .env.local

# Di Windows (PowerShell):
Copy-Item .env.example .env.local
```

Edit `.env.local` dan isi dengan konfigurasi berikut:

```env
# ═══ Frappe/ERPNext API ═══
NEXT_PUBLIC_FRAPPE_URL=https://erpnextgcpnew.browniesqu.my.id
FRAPPE_API_KEY=your_api_key_here
FRAPPE_API_SECRET=your_api_secret_here
NEXT_PUBLIC_FRAPPE_API_KEY=your_api_key_here
NEXT_PUBLIC_FRAPPE_API_SECRET=your_api_secret_here

# ═══ Database (PostgreSQL - Neon) ═══
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# ═══ App Config ═══
NEXT_PUBLIC_APP_NAME=ERP Dashboard
NEXT_PUBLIC_USE_MOCK_DATA=false

# ═══ Auth ═══
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

> 💡 **Cara mendapatkan Frappe API Key:**
> 1. Login ke ERPNext instance → **Settings** → **API Access**
> 2. Generate API Key & Secret
> 3. Copy dan paste ke `.env.local`

#### Step 4: Setup Database (Prisma)

```bash
# Generate Prisma client
npx prisma generate

# Push schema ke database (jika DB baru)
npx prisma db push
```

#### Step 5: (Optional) Seed Admin User

Register user admin pertama via API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Administrator",
    "email": "admin@artavista.com",
    "password": "@Artavista123",
    "role": "administrator"
  }'
```

Atau langsung melalui halaman registrasi di browser.

#### Step 6: Jalankan Aplikasi

```bash
npm run dev
```

Buka browser dan akses: **[http://localhost:3000](http://localhost:3000)**

### Summary Instalasi

```mermaid
flowchart LR
    A["1. Clone Repo"] --> B["2. npm install"]
    B --> C["3. Setup .env.local"]
    C --> D["4. prisma generate\n& db push"]
    D --> E["5. npm run dev"]
    E --> F["🎉 Open localhost:3000"]
```

---

## ▶️ Menjalankan Aplikasi

### Development Mode

```bash
npm run dev
```

Buka browser di [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

### Login

1. Buka `http://localhost:3000/login`
2. Masukkan email & password (lihat tabel [Akun Default](#akun-default))
3. Anda akan diarahkan ke Dashboard

---

## 📁 Struktur Folder

```
erp-dashboard/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   ├── favicon.ico
│   └── logo-*.png             # Logo assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # Auth API routes (login, register, users, session)
│   │   │   └── frappe/        # Proxy ke Frappe ERPNext API
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # Dashboard Overview
│   │   │   ├── layout.tsx     # Dashboard layout (sidebar + topbar)
│   │   │   ├── selling/       # Modul Selling (home, analytics, data)
│   │   │   │   ├── home/      # Selling summary cards + chart
│   │   │   │   └── analytics/ # Selling detailed analytics
│   │   │   ├── stock/         # Modul Inventory (home, analytics, data)
│   │   │   │   ├── home/      # Stock summary cards + chart
│   │   │   │   └── analytics/ # Stock detailed analytics
│   │   │   ├── manufacturing/ # Modul Manufacturing (home, analytics, data)
│   │   │   │   ├── home/      # Manufacturing summary + chart
│   │   │   │   └── analytics/ # Manufacturing detailed analytics
│   │   │   ├── users/         # User Management (CRUD)
│   │   │   ├── settings/      # Settings (theme, language, notifications)
│   │   │   └── profile/       # User profile page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── globals.css        # CSS global + dark mode + responsive
│   │   └── layout.tsx         # Root layout (font, providers)
│   ├── components/
│   │   ├── sidebar.tsx        # Navigasi sidebar dengan RBAC
│   │   ├── topbar.tsx         # Top navigation bar (search, notif, profile)
│   │   └── skeleton.tsx       # Skeleton loading components
│   ├── config/
│   │   ├── rbac.ts            # Role-based access control configuration
│   │   └── frappe-data.ts     # Frappe company & warehouse config
│   ├── hooks/
│   │   ├── useFrappeData.ts   # Data fetching hooks (polling, caching)
│   │   └── useSync.ts         # Offline sync queue
│   ├── lib/
│   │   ├── api.ts             # Frappe API client (GET, POST, PUT, DELETE)
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── utils.ts           # Utility functions (format, date, etc.)
│   │   ├── frappe-types.ts    # TypeScript types for ERPNext doctypes
│   │   └── sync-queue.ts      # Offline sync queue manager
│   └── providers/
│       ├── auth-provider.tsx  # Authentication context
│       ├── settings-provider.tsx # Settings context (theme, language, density)
│       ├── avatar-provider.tsx   # Avatar upload context
│       └── query-provider.tsx    # React Query provider
├── .env.local                 # Environment variables (JANGAN commit!)
├── .env                       # Shared env (non-sensitive)
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🔐 Environment Variables

Buat file `.env.local` di root project:

```env
# ═══ Frappe/ERPNext API ═══
NEXT_PUBLIC_FRAPPE_URL=https://your-erpnext-instance.com
FRAPPE_API_KEY=your_api_key
FRAPPE_API_SECRET=your_api_secret
NEXT_PUBLIC_FRAPPE_API_KEY=your_api_key
NEXT_PUBLIC_FRAPPE_API_SECRET=your_api_secret

# ═══ Database (PostgreSQL) ═══
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# ═══ App Config ═══
NEXT_PUBLIC_APP_NAME=ERP Dashboard
NEXT_PUBLIC_USE_MOCK_DATA=false

# ═══ Auth ═══
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

> ⚠️ **PENTING:** Jangan commit file `.env.local` ke repository! Pastikan sudah ada di `.gitignore`.

---

## 📖 Panduan Penggunaan

### 1. Login & Navigasi Dasar

1. Buka aplikasi → otomatis redirect ke `/login`
2. Login dengan akun sesuai role
3. Dashboard menampilkan widget sesuai hak akses role Anda
4. Gunakan sidebar di kiri untuk navigasi antar modul
5. Gunakan `Ctrl+K` untuk quick search

### 2. Mengubah Bahasa

1. Klik ikon **gear** (⚙️) di sidebar → masuk ke **Pengaturan / Settings**
2. Pada bagian **Bahasa Antarmuka**, pilih **English** atau **Bahasa Indonesia**
3. Klik **Simpan** → semua teks akan berubah sesuai bahasa

### 3. Mengaktifkan Dark Mode

1. Buka **Settings** → tab **Tampilan / Appearance**
2. Klik tombol **Dark** pada pilihan tema
3. Klik **Simpan**

### 4. Mengatur Data Density

1. Buka **Settings** → bagian **Kepadatan Data / Data Density**
2. Pilih salah satu: **Nyaman**, **Sedang**, atau **Padat**
3. Klik **Simpan** → spacing dan padding seluruh UI akan berubah

### 5. Mengelola User (Admin Only)

1. Buka menu **Kelola User** di sidebar (hanya visible untuk role Administrator)
2. Klik **Tambah User** → isi form (Email, Nama, Role)
3. Untuk edit role: klik ikon ✏️ → ubah role di dropdown → **Perbarui**
4. Role tersimpan otomatis ke database PostgreSQL
5. Untuk hapus: klik ikon 🗑️ → konfirmasi

---

## 🔁 CRUD & Sinkronisasi Frappe

### Alur Sinkronisasi Data

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Dashboard as 🖥️ Dashboard
    participant API as ⚙️ Next.js API
    participant Frappe as ☁️ ERPNext

    User->>Dashboard: Klik "Create"
    Dashboard->>API: POST /api/frappe
    API->>Frappe: POST /api/resource/{doctype}
    Frappe-->>API: 201 Created
    API-->>Dashboard: Response data
    Dashboard-->>User: ✅ Sukses + refresh data
    
    User->>Dashboard: Klik "Update"
    Dashboard->>API: PUT /api/frappe
    API->>Frappe: PUT /api/resource/{doctype}/{name}
    Frappe-->>API: 200 OK
    API-->>Dashboard: Updated data
    Dashboard-->>User: ✅ Data diperbarui
    
    User->>Dashboard: Klik "Delete"
    Dashboard->>API: DELETE /api/frappe
    API->>Frappe: DELETE /api/resource/{doctype}/{name}
    Frappe-->>API: 200 OK
    Dashboard-->>User: ✅ Data dihapus
```

### CRUD per Modul

| Modul | Create | Read | Update | Delete | Sync ke Frappe |
|-------|--------|------|--------|--------|----------------|
| **Customer** | ✅ | ✅ | ✅ | ❌ (Frappe restriction) | ✅ Real-time |
| **Sales Order** | ✅ | ✅ | ✅ (Submit/Cancel) | ❌ | ✅ Real-time |
| **Sales Invoice** | ❌ (Read only) | ✅ | ❌ | ❌ | ✅ Read-only |
| **Item** | ✅ | ✅ | ✅ | ❌ (Frappe restriction) | ✅ Real-time |
| **Stock Entry** | ✅ | ✅ | ✅ (Submit/Cancel) | ❌ | ✅ Real-time |
| **Warehouse** | ❌ (Read only) | ✅ | ❌ | ❌ | ✅ Read-only |
| **Delivery Note** | ✅ | ✅ | ✅ (Submit) | ❌ | ✅ Real-time |
| **BOM** | ✅ | ✅ | ✅ | ❌ | ✅ Real-time |
| **Work Order** | ✅ | ✅ | ✅ (Submit) | ❌ | ✅ Real-time |
| **Job Card** | ✅ | ✅ | ✅ | ❌ | ✅ Real-time |
| **User** | ✅ | ✅ | ✅ (Role) | ✅ | PostgreSQL |

---

## 📸 Screenshots

### Light Mode (Bahasa Indonesia)
Dashboard menampilkan Total Pesanan, Pendapatan, Produk Aktif, dan Stok Rendah.

### English Mode
All labels switch to English: Total Orders, Revenue Trend, Production Status.

### Dark Mode
Full dark theme dengan sidebar, cards, charts, dan tables yang konsisten.

### Skeleton Loading
Tampilan skeleton shimmer saat data sedang dimuat — memberikan UX yang premium dan responsif.

### Settings Page
Data Density selector, dark mode toggle, language picker, dan font size options.

---

## ❓ FAQ

### Q: Kenapa data di dashboard kosong?
**A:** Pastikan konfigurasi `.env.local` sudah benar dan ERPNext instance Anda berjalan. Dashboard mengambil data dari API ERPNext secara real-time.

### Q: Bagaimana cara menambah user dengan role tertentu?
**A:** Login sebagai Administrator → Kelola User → Tambah User → Pilih Role dari dropdown → Simpan. Role akan tersimpan ke database PostgreSQL.

### Q: Apakah bisa berjalan tanpa koneksi ke ERPNext?
**A:** Ya, tapi hanya modul auth (login/register) dan settings yang berfungsi penuh. Modul selling, stock, dan manufacturing membutuhkan koneksi ke ERPNext untuk data.

### Q: Bagaimana password di-hash?
**A:** Saat ini password belum di-hash (untuk development). Untuk produksi, tambahkan bcrypt hashing di `/api/auth/register/route.ts`.

### Q: API Key Frappe di mana dapatnya?
**A:** Login ke ERPNext → Settings → API Access → Generate API Key & Secret.

### Q: Bagaimana cara build untuk production?
**A:**
```bash
npm run build    # Compile & optimize
npm run start    # Jalankan production server
```

### Q: Error "Could not resolve module" saat build?
**A:** Jalankan `npm install` ulang, lalu `npx prisma generate` untuk regenerate Prisma client.

---

## 📄 Lisensi

Project ini dikembangkan untuk keperluan akademik **Semester 6 (MBKM)** — PT Artavista.

---

## 🤝 Contributing

1. Fork repository
2. Buat branch baru: `git checkout -b feature/nama-fitur`
3. Commit perubahan: `git commit -m "feat: deskripsi fitur"`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buat Pull Request

---

*Dibuat dengan ❤️ menggunakan Next.js, React, TypeScript, Prisma, dan Frappe ERPNext*
