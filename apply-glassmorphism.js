const fs = require('fs');
const path = require('path');

const targetClasses = [
  "bg-white dark:bg-zinc-900 shadow-sm rounded-xl border border-zinc-200 dark:border-zinc-800",
  "bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800",
  "bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm",
  "bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm",
  "bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800"
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Generic replace for standard cards
  content = content.replace(/bg-white dark:bg-zinc-900 shadow-sm rounded-xl border border-zinc-200 dark:border-zinc-800/g, "glass-panel shadow-lg rounded-xl");
  content = content.replace(/bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm/g, "glass-panel p-6 rounded-xl shadow-lg");
  content = content.replace(/bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800/g, "glass-panel shadow-lg rounded-xl");
  content = content.replace(/bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm/g, "glass-panel p-6 rounded-xl shadow-lg");
  content = content.replace(/bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800/g, "glass-panel rounded-xl shadow-xl w-full max-w-md overflow-hidden");
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    return 1;
  }
  return 0;
}

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let changed = 0;
walkDir(path.join(__dirname, 'src'), (f) => {
  if (f.endsWith('.tsx') || f.endsWith('.ts')) {
    changed += replaceInFile(f);
  }
});
console.log(`Applied glassmorphism to ${changed} files.`);
