import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🎨 [AUDIT-DESIGN] Running Prompt Gen Design System Token Audit...');

const targetDirs = [
  path.join(rootDir, 'src/app'),
  path.join(rootDir, 'src/components'),
];

function getFiles(dir, extensions = ['.tsx', '.jsx']) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFiles(full, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = targetDirs.flatMap(d => getFiles(d));
console.log(`📁 Scanning ${allFiles.length} UI components...`);

const DESIGN_TOKENS = [
  'pg-surface',
  'pg-surface-dim',
  'pg-border',
  'pg-divide',
  'pg-text-heading',
  'pg-text-sub',
  'pg-text-muted',
  'pg-bg-page',
  'neu-btn-brand',
  'neu-btn',
  'neu-flat',
  'neu-pressed',
  'neu-sm',
  'neu-input',
  'text-brand',
  'bg-brand',
  'border-brand',
  'var(--pg-'
];

let tokenOccurrences = 0;
let fileTokenCounts = {};

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let count = 0;
  for (const token of DESIGN_TOKENS) {
    const matches = content.split(token).length - 1;
    count += matches;
  }
  if (count > 0) {
    fileTokenCounts[file] = count;
    tokenOccurrences += count;
  }
}

const tokenizedFilesCount = Object.keys(fileTokenCounts).length;
const tokenAdoptionRate = ((tokenizedFilesCount / allFiles.length) * 100).toFixed(1);

console.log(`✨ Total Design Token occurrences: ${tokenOccurrences}`);
console.log(`📊 Component adoption rate: ${tokenizedFilesCount}/${allFiles.length} (${tokenAdoptionRate}%)`);

const MIN_ADOPTION_RATE = 95.0;

if (tokenOccurrences > 500 && parseFloat(tokenAdoptionRate) >= MIN_ADOPTION_RATE) {
  console.log(`✅ [AUDIT-DESIGN] Design system health check: PASS! Component adoption rate (${tokenAdoptionRate}%) >= ${MIN_ADOPTION_RATE}%.`);
  process.exit(0);
} else {
  console.error(`❌ [AUDIT-DESIGN] Design token adoption rate (${tokenAdoptionRate}%) is below required ${MIN_ADOPTION_RATE}% threshold!`);
  process.exit(1);
}
