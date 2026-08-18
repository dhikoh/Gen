const fs = require('fs');

const replacements = [
  {
    file: 'src/app/api/products/[id]/route.ts',
    replaces: [
      { from: 'NextResponse.json({ error: "Invalid data" }', to: 'NextResponse.json({ error: t("invalidData") }' }
    ]
  },
  {
    file: 'src/app/api/invoice/upload/route.ts',
    replaces: [
      { from: 'NextResponse.json({ error: "Terlalu banyak permintaan upload. Coba lagi nanti." }', to: 'NextResponse.json({ error: t("tooManyUploads") }' },
      { from: 'NextResponse.json({ error: "Ukuran file terlalu besar. Maksimal 2MB." }', to: 'NextResponse.json({ error: t("fileTooLarge") }' },
      { from: 'NextResponse.json({ error: "Hanya format gambar JPG/PNG yang diperbolehkan." }', to: 'NextResponse.json({ error: t("invalidImageFormat") }' },
      { from: 'NextResponse.json({ error: "Tagihan tidak valid atau sudah diproses." }', to: 'NextResponse.json({ error: t("invalidInvoice") }' },
      { from: 'NextResponse.json({ error: "Terjadi kesalahan sistem." }', to: 'NextResponse.json({ error: t("serverError") }' }
    ]
  },
  {
    file: 'src/app/api/drafts/[id]/route.ts',
    replaces: [
      { from: 'NextResponse.json({ error: "Invalid data",', to: 'NextResponse.json({ error: t("invalidData"),' }
    ]
  },
  {
    file: 'src/app/api/admin/users/route.ts',
    replaces: [
      { from: 'NextResponse.json({ error: "Terjadi kesalahan sistem." }', to: 'NextResponse.json({ error: t("serverError") }' }
    ]
  },
  {
    file: 'src/app/api/channels/route.ts',
    replaces: [
      { from: 'NextResponse.json({ error: "Terlalu banyak permintaan pembuatan channel. Coba lagi nanti." }', to: 'NextResponse.json({ error: t("tooManyChannels") }' }
    ]
  },
  {
    file: 'src/app/api/channels/[id]/products/route.ts',
    replaces: [
      { from: 'NextResponse.json({ error: "Invalid data" }', to: 'NextResponse.json({ error: t("invalidData") }' }
    ]
  },
  {
    file: 'src/app/api/auth/check/route.ts',
    replaces: [
      { from: 'NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }', to: 'NextResponse.json({ error: t("rateLimit") }' },
      { from: 'NextResponse.json({ error: "Input tidak valid" }', to: 'NextResponse.json({ error: t("invalidData") }' },
      { from: 'NextResponse.json({ error: "Minimal satu parameter (email/username/phoneNumber) harus diisi" }', to: 'NextResponse.json({ error: t("missingParams") }' },
      { from: 'NextResponse.json({ error: "Email sudah digunakan",', to: 'NextResponse.json({ error: t("emailTaken"),' },
      { from: 'NextResponse.json({ error: "Username sudah digunakan",', to: 'NextResponse.json({ error: t("usernameTaken"),' },
      { from: 'NextResponse.json({ error: "Nomor HP sudah digunakan",', to: 'NextResponse.json({ error: t("phoneTaken"),' },
      { from: 'NextResponse.json({ success: true, message: "Tersedia" }', to: 'NextResponse.json({ success: true, message: t("available") }' }
    ]
  }
];

for (const { file, replaces } of replacements) {
  let content = fs.readFileSync(file, 'utf8');
  for (const { from, to } of replaces) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(file, content);
}

console.log("Replaced hardcoded strings.");
