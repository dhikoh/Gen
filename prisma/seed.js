const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // 1. Create AppSettings (singleton)
  await prisma.appSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      bankName: 'BCA',
      bankAccountNo: '1234567890',
      bankAccountName: 'PT Prompt Gen Indonesia',
      heroTitle: 'Buat Master Prompt Terstruktur dengan Mudah',
      heroSubtitle: 'Optimalkan performa konten sosial media Anda dengan AI prompt generator terbaik.',
    },
  })
  console.log('Created AppSettings')

  // 2. Create Plans
  const plans = [
    {
      code: 'STANDARD',
      name: 'Standard',
      priceMonthly: 10000,
      maxChannels: 1,
      features: { imagePromptStudio: false },
      sortOrder: 1,
    },
    {
      code: 'PRO',
      name: 'Pro',
      priceMonthly: 25000,
      maxChannels: 3,
      features: { imagePromptStudio: true },
      sortOrder: 2,
    },
    {
      code: 'ULTRA',
      name: 'Ultra',
      priceMonthly: 50000,
      maxChannels: 10,
      features: { imagePromptStudio: true },
      sortOrder: 3,
    },
  ]

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        maxChannels: plan.maxChannels,
        features: plan.features,
        sortOrder: plan.sortOrder,
      },
      create: plan,
    })
  }
  console.log('Created Plans')

  // 3. Create Superadmin User
  const superadminEmail = 'admin@promptgen.com'
  const passwordHash = await bcrypt.hash('superadmin123', 10)

  await prisma.user.upsert({
    where: { email: superadminEmail },
    update: {
      passwordHash, // Reset password on seed just in case
      role: 'SUPERADMIN',
    },
    create: {
      name: 'Super Admin',
      username: 'superadmin',
      email: superadminEmail,
      passwordHash,
      role: 'SUPERADMIN',
    },
  })
  console.log('Created Superadmin')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
