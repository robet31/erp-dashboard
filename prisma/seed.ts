import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_USERS = [
  { full_name: 'Citra Dewi (Sales)', email: 'sales@erp.com', password: 'password123', role: 'admin_sales' },
  { full_name: 'Dedi Kurniawan (Gudang)', email: 'gudang@erp.com', password: 'password123', role: 'admin_gudang' },
  { full_name: 'Eko Prasetyo (Produksi)', email: 'produksi@erp.com', password: 'password123', role: 'manajer_produksi' },
  { full_name: 'Administrator', email: 'admin@erp.com', password: 'password123', role: 'administrator' },
]

async function main() {
  console.log('Mulai melakukan seeding data...')

  for (const user of DEFAULT_USERS) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {}, 
      create: {
        full_name: user.full_name,
        email: user.email,
        password: user.password, 
        role: user.role,
      },
    })
    console.log(`User ${createdUser.email} siap di database.`)
  }

  console.log('Seeding selesai!')
}

main()
  .catch((e) => {
    console.error('Terjadi kesalahan saat seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })