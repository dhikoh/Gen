const fs = require('fs');
const path = require('path');

const errorMap = {
  "Unauthorized": "unauthorized",
  "Data tidak valid": "invalidData",
  "Terjadi kesalahan sistem": "systemError",
  "Terjadi kesalahan pada server": "serverError",
  "Server error": "serverError",
  "Not found": "notFound",
  "Channel tidak ditemukan": "channelNotFound",
  "User tidak ditemukan.": "userNotFound",
  "Terlalu banyak request. Harap tunggu sebentar.": "rateLimit",
  "Langganan Anda tidak aktif. Silakan beli paket PRO di menu Tagihan.": "inactiveSub",
  "Fitur Image Prompt Studio tidak tersedia di paket Anda. Silakan upgrade paket.": "imageStudioLocked",
  "Profile Channel tidak valid.": "invalidChannel",
  "Channel terkunci. Silakan upgrade paket.": "channelLocked",
  "Channel terkunci. Silakan upgrade paket untuk membuka akses.": "channelLocked",
  "Draft not found": "draftNotFound",
  "Forbidden": "forbidden",
  "Internal server error": "serverError",
  "Format JSON tidak valid. Pastikan Anda menyalin seluruh output AI.": "invalidJson",
  "Terjadi kesalahan saat menyimpan draft.": "draftSaveError",
  "Terjadi kesalahan pada server saat memproses prompt.": "generateError",
  "Terlalu banyak permintaan pembuatan produk. Coba lagi nanti.": "rateLimitProduct",
  "Invoice tidak ditemukan": "invoiceNotFound",
  "Bukti transfer wajib diunggah": "proofRequired",
  "URL bukti transfer tidak valid": "invalidProofUrl",
  "Invoice tidak dalam status PENDING": "invoiceNotPending",
  "Gagal mengunggah bukti transfer": "uploadProofFail",
  "Belum ada channel utama untuk diset.": "noPrimaryChannel"
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const apiDir = path.join(__dirname, 'src/app/api');

let filesChanged = 0;
walkDir(apiDir, (filePath) => {
  if (filePath.endsWith('route.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Check if it has error responses
    if (content.includes('error: "') || content.includes("error: '") || content.includes('success: true')) {
      if (!content.includes('getApiTranslator')) {
        content = 'import { getApiTranslator } from "@/lib/apiI18n";\n' + content;
      }

      // Find all async function GET/POST/PUT/DELETE/PATCH
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      methods.forEach(method => {
        const regex = new RegExp(`export async function ${method}\\([^\\)]*\\)\\s*\\{\\s*try\\s*\\{`, 'g');
        content = content.replace(regex, (match) => {
          return match + `\n    const t = await getApiTranslator();`;
        });
      });

      // Replace hardcoded error strings
      for (const [indoText, key] of Object.entries(errorMap)) {
        content = content.split(`error: "${indoText}"`).join(`error: t("${key}")`);
      }

      if (content !== original) {
        fs.writeFileSync(filePath, content);
        filesChanged++;
      }
    }
  }
});
console.log(`Changed ${filesChanged} files.`);
