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
      code: 'DEMO',
      name: 'Demo 3 Hari',
      priceMonthly: 0,
      maxChannels: 1,
      features: { imagePromptStudio: true, htmlBlogExport: true },
      isActive: true,
      isPubliclyPurchasable: false,
      sortOrder: 0,
    },
    {
      code: 'STANDARD',
      name: 'Standard',
      priceMonthly: 10000,
      maxChannels: 1,
      features: { imagePromptStudio: true, htmlBlogExport: true },
      isActive: true,
      isPubliclyPurchasable: true,
      sortOrder: 1,
    },
    {
      code: 'PRO',
      name: 'Pro',
      priceMonthly: 25000,
      maxChannels: 3,
      features: { imagePromptStudio: true, htmlBlogExport: true },
      isActive: true,
      isPubliclyPurchasable: true,
      sortOrder: 2,
    },
    {
      code: 'ULTRA',
      name: 'Ultra',
      priceMonthly: 50000,
      maxChannels: 10,
      features: { imagePromptStudio: true, htmlBlogExport: true },
      isActive: true,
      isPubliclyPurchasable: true,
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
        isPubliclyPurchasable: plan.isPubliclyPurchasable,
        sortOrder: plan.sortOrder,
      },
      create: plan,
    })
  }
  console.log('Created Plans')

  // 3. Create System Platform Options
  const platforms = [
    'TikTok',
    'Instagram Reels',
    'YouTube Shorts',
    'Facebook Reels',
    'X / Twitter',
    'LinkedIn',
    'Snapchat',
    'Pinterest',
  ]
  for (const label of platforms) {
    await prisma.platformOption.upsert({
      where: { label },
      update: { isSystem: true },
      create: { label, isSystem: true },
    })
  }
  console.log('Created System Platform Options')

  // 4. Create System Persona Presets
  const personas = [
    { label: 'Ahli SEO & Digital Marketing', description: 'Gaya analitis, berbasis data, berfokus pada strategi ranking' },
    { label: 'Mentor Bisnis & Startup', description: 'Gaya profesional, memotivasi, taktis dengan insight kewirausahaan' },
    { label: 'Storyteller & Teman Curhat', description: 'Gaya emosional, hangat, personal, dan mudah dirasakan penonton' },
    { label: 'Reporter & Jurnalis Investigatif', description: 'Gaya to the point, obyektif, kritis, membongkar fakta menarik' },
    { label: 'Komedian & Entertainer Konten', description: 'Gaya humoris, penuh sindiran positif, menghibur, dan energik' },
    { label: 'Edukator Sains & Teknologi', description: 'Gaya meyakinkan, mudah dipahami, menyederhanakan materi rumit' },
    { label: 'Fitnes Coach & Pakar Kesehatan', description: 'Gaya tegas, disiplin, memotivasi hidup sehat dan aksi nyata' },
    { label: 'Chef & Influencer Kuliner', description: 'Gaya menggugah selera, ekspresif, fokus pada detail tekstur & rasa' },
    { label: 'Financial Planner & Investor', description: 'Gaya rasional, hati-hati, memandu pengelolaan uang cerdas' },
    { label: 'Travel Blogger & Petualang', description: 'Gaya penuh semangat, deskriptif, menginspirasi perjalanan baru' },
  ]
  for (const persona of personas) {
    const existing = await prisma.personaPreset.findFirst({ where: { label: persona.label, isSystem: true } })
    if (!existing) {
      await prisma.personaPreset.create({
        data: { label: persona.label, description: persona.description, isSystem: true },
      })
    }
  }
  console.log('Created System Persona Presets')

  // 5. Create System Visual Aesthetic Presets
  const visualAesthetics = [
    'Fotografi Realistis (Photorealistic)',
    'Animasi 3D Pixar / Disney Style',
    'Anime & Manga Studio Ghibli',
    'Cyberpunk & Neon Glow',
    'Vektor Ilustrasi Flat Art',
    'Sketsa Cat Air & Ink Wash',
    'Retro 80s Synthwave',
    'Sinematik Film Grain',
    'Fantasi Gelap & Gotik',
    'Isometric 3D Pop/Toy Style',
    'Comic Book / Pop Art',
    'Minimalist Line Art',
  ]
  for (const label of visualAesthetics) {
    const existing = await prisma.visualAestheticPreset.findFirst({ where: { label, isSystem: true } })
    if (!existing) {
      await prisma.visualAestheticPreset.create({
        data: { label, isSystem: true },
      })
    }
  }
  console.log('Created System Visual Aesthetic Presets')

  // 6. Create System Niche Category Presets
  const nicheCategories = [
    'Bisnis & Finansial',
    'Edukasi & Teknologi',
    'Hiburan & Komedi',
    'Kuliner & Resep',
    'Gaya Hidup & Fashion',
    'Kesehatan & Kebugaran',
    'Traveling & Otomotif',
    'Hewan & Zoologi',
    'Parenting & Keluarga',
    'Game & E-Sports',
  ]
  for (const label of nicheCategories) {
    const existing = await prisma.nicheCategoryPreset.findFirst({ where: { label, isSystem: true } })
    if (!existing) {
      await prisma.nicheCategoryPreset.create({
        data: { label, isSystem: true },
      })
    }
  }
  console.log('Created System Niche Category Presets')

  // 7. Create Default PromptSettings (singleton)
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

  // 8. Create Superadmin User
  if (process.env.NODE_ENV === 'production' && (!process.env.SUPERADMIN_EMAIL || !process.env.SUPERADMIN_SEED_PASSWORD)) {
    console.error('❌ SECURITY FATAL: SUPERADMIN_EMAIL and SUPERADMIN_SEED_PASSWORD MUST be set in production mode!');
    process.exit(1);
  }

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

