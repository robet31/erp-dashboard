import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEFAULT_USERS = [
  { full_name: 'Administrator', email: 'admin@artavista.com', password: '@Artavista123', role: 'administrator' },
  { full_name: 'Citra Dewi (Sales)', email: 'sales@erp.com', password: 'password123', role: 'admin_sales' },
  { full_name: 'Dedi Kurniawan (Gudang)', email: 'gudang@erp.com', password: 'password123', role: 'admin_gudang' },
  { full_name: 'Eko Prasetyo (Produksi)', email: 'produksi@erp.com', password: 'password123', role: 'manajer_produksi' },
  { full_name: 'Administrator (Legacy)', email: 'admin@erp.com', password: 'password123', role: 'administrator' },
];

export async function POST(request: NextRequest) {
  try {
    for (const u of DEFAULT_USERS) {
      const exists = await prisma.user.findUnique({
        where: { email: u.email }
      });
      if (!exists) {
        await prisma.user.create({ data: u });
      }
    }
    return NextResponse.json({ message: 'Database was seeded' }, { status: 200 });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
