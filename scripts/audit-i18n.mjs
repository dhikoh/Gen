import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const idPath = path.join(rootDir, 'messages/id.json');
const enPath = path.join(rootDir, 'messages/en.json');

console.log('🔍 [AUDIT-I18N] Running strict i18n parity audit...');

if (!fs.existsSync(idPath)) {
  console.error(`❌ [AUDIT-I18N] File not found: ${idPath}`);
  process.exit(1);
}
if (!fs.existsSync(enPath)) {
  console.error(`❌ [AUDIT-I18N] File not found: ${enPath}`);
  process.exit(1);
}

let idData, enData;
try {
  idData = JSON.parse(fs.readFileSync(idPath, 'utf8'));
} catch (err) {
  console.error(`❌ [AUDIT-I18N] JSON parse error in id.json:`, err.message);
  process.exit(1);
}

try {
  enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
} catch (err) {
  console.error(`❌ [AUDIT-I18N] JSON parse error in en.json:`, err.message);
  process.exit(1);
}

function extractKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(extractKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const idKeys = new Set(extractKeys(idData));
const enKeys = new Set(extractKeys(enData));

const missingInEn = [...idKeys].filter(k => !enKeys.has(k));
const missingInId = [...enKeys].filter(k => !idKeys.has(k));

console.log(`📊 Total Indonesian (id) keys: ${idKeys.size}`);
console.log(`📊 Total English (en) keys:    ${enKeys.size}`);

let hasError = false;

if (missingInEn.length > 0) {
  console.error(`❌ [AUDIT-I18N] ${missingInEn.length} key(s) present in id.json but missing in en.json:`);
  missingInEn.slice(0, 20).forEach(k => console.error(`   - ${k}`));
  if (missingInEn.length > 20) console.error(`   ... and ${missingInEn.length - 20} more`);
  hasError = true;
}

if (missingInId.length > 0) {
  console.error(`❌ [AUDIT-I18N] ${missingInId.length} key(s) present in en.json but missing in id.json:`);
  missingInId.slice(0, 20).forEach(k => console.error(`   - ${k}`));
  if (missingInId.length > 20) console.error(`   ... and ${missingInId.length - 20} more`);
  hasError = true;
}

if (!hasError) {
  console.log('✅ [AUDIT-I18N] 100% key parity confirmed between id.json and en.json. Zero missing keys!');
  process.exit(0);
} else {
  console.error('❌ [AUDIT-I18N] Audit failed due to key parity mismatch.');
  process.exit(1);
}
