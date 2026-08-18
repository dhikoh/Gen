const fs = require("fs");
const path = require("path");

function fixScope(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixScope(fullPath);
    } else if (file === "route.ts") {
      let content = fs.readFileSync(fullPath, "utf-8");
      
      // Look for:
      // export async function POST(req: Request) {
      //   try {
      //     const t = await getApiTranslator();
      
      const regex = /(export\s+async\s+function\s+[A-Z]+\([^)]*\)\s*\{)\s*(try\s*\{\s*)const\s+t\s*=\s*await\s+getApiTranslator\(\);/g;
      const replaced = content.replace(regex, "$1\n  const t = await getApiTranslator();\n  $2");
      
      if (replaced !== content) {
        console.log(`Fixed scoping in: ${fullPath}`);
        fs.writeFileSync(fullPath, replaced, "utf-8");
      }
    }
  }
}

fixScope(path.join(__dirname, "src/app/api"));
console.log("Done");
