# ERP Dashboard - Installation Guide

A Next.js based ERP Dashboard application with Frappe/ERPNext integration.

## Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/robet31/erp-dashboard.git
cd erp-dashboard
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

Using pnpm:
```bash
pnpm install
```

Using bun:
```bash
bun install
```

### 3. Configure Environment Variables

The project includes a `.env.local` file with default configuration. You can modify it based on your needs:

```env
# Frappe/ERPNext API
NEXT_PUBLIC_FRAPPE_URL=http://34.101.192.135:8080

# Server-side only (tidak NEXT_PUBLIC agar aman)
FRAPPE_API_KEY=your_api_key
FRAPPE_API_SECRET=your_api_secret

# App Config
NEXT_PUBLIC_APP_NAME=ERP Dashboard
NEXT_PUBLIC_USE_MOCK_DATA=false

# Auth
NEXTAUTH_SECRET=erp-dashboard-secret-key-2026
NEXTAUTH_URL=http://localhost:3001
```

### 4. Run Development Server

Using npm:
```bash
npm run dev
```

Using yarn:
```bash
yarn dev
```

Using pnpm:
```bash
pnpm dev
```

Using bun:
```bash
bun dev
```

### 5. Access the Application

Open your browser and navigate to:
- **Local:** http://localhost:3000
- **Or:** http://localhost:3001 (depending on your NEXTAUTH_URL configuration)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
erp-dashboard/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and API clients
│   └── providers/    # React context providers
├── public/           # Static assets
├── .env.local        # Environment variables (included)
└── package.json      # Dependencies
```

## Tech Stack

- **Framework:** Next.js 16.x
- **UI:** React 19, Tailwind CSS
- **State Management:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **API Client:** Axios

## License

MIT