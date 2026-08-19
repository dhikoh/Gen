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
      csMode: 'DIRECT_WHATSAPP',
      csWhatsappNumber: '628123456789', // Placeholder WA (Wajib diganti sebelum produksi)
      csEmail: 'cs@promptgen.com',      // Placeholder Email
      csOperatingHours: 'Senin - Jumat, 09:00 - 17:00 WIB',
      csWidgetEnabled: true,
      registrationPendingAlertHours: 24,
      paymentPendingAlertHours: 12,
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
      features: { imagePromptStudio: false, htmlBlogExport: false },
      sortOrder: 1,
    },
    {
      code: 'PRO',
      name: 'Pro',
      priceMonthly: 25000,
      maxChannels: 3,
      features: { imagePromptStudio: true, htmlBlogExport: false },
      sortOrder: 2,
    },
    {
      code: 'ULTRA',
      name: 'Ultra',
      priceMonthly: 50000,
      maxChannels: 10,
      features: { imagePromptStudio: true, htmlBlogExport: true },
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

  // 3. Create Default PromptSettings (singleton)
  await prisma.promptSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      defaultSpeechRate: 'medium',
      bannedWords: [],
    },
  })
  console.log('Created PromptSettings')

  // 4. Create Superadmin User
  const superadminEmail = process.env.SUPERADMIN_EMAIL || 'admin@promptgen.com'
  const seedPassword = process.env.SUPERADMIN_SEED_PASSWORD || 'superadmin123'
  const passwordHash = await bcrypt.hash(seedPassword, 10)

  await prisma.user.upsert({
    where: { email: superadminEmail },
    update: {}, // Never overwrite passwordHash or admin fields if superadmin already exists
    create: {
      name: 'Super Admin',
      username: 'superadmin',
      email: superadminEmail,
      passwordHash,
      role: 'SUPERADMIN',
      registrationStatus: 'APPROVED',
      approvedAt: new Date(),
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
