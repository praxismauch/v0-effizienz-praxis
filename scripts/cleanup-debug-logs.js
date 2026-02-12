import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const projectRoot = '/vercel/share/v0-project';
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx']);
const excludeDirs = new Set(['node_modules', '.next', '.git', 'scripts']);

let totalRemoved = 0;
let filesModified = 0;

function processFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const filtered = [];
  let removed = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Match console.log("[v0]...") lines - full line removal
    if (trimmed.match(/^console\.log\(\s*["'`]\[v0\]/)) {
      removed++;
      // Also remove the preceding blank line if the next line is also blank
      continue;
    }
    filtered.push(lines[i]);
  }

  if (removed > 0) {
    // Clean up consecutive blank lines left behind
    const cleaned = [];
    for (let i = 0; i < filtered.length; i++) {
      if (i > 0 && filtered[i].trim() === '' && filtered[i - 1].trim() === '') {
        continue; // skip double blank lines
      }
      cleaned.push(filtered[i]);
    }
    writeFileSync(filePath, cleaned.join('\n'), 'utf-8');
    totalRemoved += removed;
    filesModified++;
    console.log(`  ${filePath.replace(projectRoot + '/', '')}: removed ${removed} debug log(s)`);
  }
}

function walkDir(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (excludeDirs.has(entry)) continue;
    const fullPath = join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (stat.isFile() && extensions.has(extname(fullPath))) {
        processFile(fullPath);
      }
    } catch (e) {
      // skip inaccessible
    }
  }
}

console.log('Cleaning console.log("[v0]...") debug statements...\n');
walkDir(projectRoot);
console.log(`\nDone! Removed ${totalRemoved} debug log(s) from ${filesModified} file(s).`);
