const fs = require('fs');

const enPath = './messages/en.json';
const idPath = './messages/id.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const id = JSON.parse(fs.readFileSync(idPath, 'utf8'));

const newKeys = {
  missingParams: { en: "At least one parameter is required", id: "Minimal satu parameter (email/username/phoneNumber) harus diisi" },
  emailTaken: { en: "Email is already taken", id: "Email sudah digunakan" },
  usernameTaken: { en: "Username is already taken", id: "Username sudah digunakan" },
  phoneTaken: { en: "Phone number is already taken", id: "Nomor HP sudah digunakan" },
  available: { en: "Available", id: "Tersedia" },
  fileTooLarge: { en: "File size too large. Max 2MB.", id: "Ukuran file terlalu besar. Maksimal 2MB." },
  invalidImageFormat: { en: "Only JPG/PNG image formats are allowed.", id: "Hanya format gambar JPG/PNG yang diperbolehkan." },
  invalidInvoice: { en: "Invalid invoice or already processed.", id: "Tagihan tidak valid atau sudah diproses." },
  tooManyChannels: { en: "Too many channel creation requests. Try again later.", id: "Terlalu banyak permintaan pembuatan channel. Coba lagi nanti." },
  tooManyUploads: { en: "Too many upload requests. Try again later.", id: "Terlalu banyak permintaan upload. Coba lagi nanti." },
};

for (const [key, val] of Object.entries(newKeys)) {
  en.API[key] = val.en;
  id.API[key] = val.id;
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(idPath, JSON.stringify(id, null, 2));
console.log("Translation files updated.");
