import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const rootDir = '/vercel/share/v0-project';
const results = [];

function walk(dir) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.next' || entry === '.git' || entry === 'scripts') continue;
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').length;
        if (lines > 400) {
          results.push({ path: relative(rootDir, fullPath), lines });
        }
      }
    }
  } catch {}
}

walk(rootDir);
results.sort((a, b) => b.lines - a.lines);
console.log(`\nFiles over 400 lines (${results.length} files):\n`);
results.slice(0, 30).forEach((r, i) => {
  console.log(`${String(i + 1).padStart(2)}. ${String(r.lines).padStart(5)} lines  ${r.path}`);
});
