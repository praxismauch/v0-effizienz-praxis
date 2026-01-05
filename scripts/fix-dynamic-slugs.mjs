// scripts/fix-dynamic-slugs.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "pages"]; // it will skip if directory does not exist

/** Recursively walk directory and return all folder/file paths */
function walk(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    result.push(full);
    if (entry.isDirectory()) {
      result.push(...walk(full));
    }
  }
  return result;
}

/** Get dynamic segment name from "[slug]" or "[[...slug]]" */
function getDynamicName(segment) {
  const match = segment.match(/^\[+\.*(.*?)\]+$/); // matches [id], [...id], [[...id]]
  return match ? match[1] : null;
}

/**
 * Build a map:
 *   key: normalized path without segment names
 *   value: { segments: Set<slugName>, items: Array<{fullPath, name, dir}> }
 */
function collectConflicts(baseDir) {
  const all = walk(baseDir);
  const map = new Map();

  for (const full of all) {
    const rel = path.relative(ROOT, full);
    const dir = path.dirname(rel);
    const name = path.basename(rel);

    const dynamicName = getDynamicName(name);
    if (!dynamicName) continue;

    const key = path.join(dir, "__segment__"); // group all dynamic segments in same dir

    if (!map.has(key)) {
      map.set(key, { segments: new Set(), items: [] });
    }
    const entry = map.get(key);
    entry.segments.add(dynamicName);
    entry.items.push({ fullPath: full, name, dir });
  }

  return map;
}

function fixBaseDir(baseDir) {
  const conflicts = collectConflicts(baseDir);
  let fixCount = 0;

  for (const [key, info] of conflicts.entries()) {
    if (info.segments.size <= 1) continue; // no conflict

    const [canonical] = info.segments; // deterministic: first encountered
    const canonicalName = `[${canonical}]`;

    console.log(`\n⚠️  Conflict in "${key.replace("__segment__", "")}"`);
    console.log(`   Slugs found: ${Array.from(info.segments).join(", ")}`);
    console.log(`   Canonical:   ${canonicalName}`);

    for (const item of info.items) {
      const currentDynamic = getDynamicName(item.name);
      if (currentDynamic === canonical) continue; // already canonical

      const newName = item.name.replace(/\[+\.*(.*?)\]+/, canonicalName);
      const newFullPath = path.join(path.dirname(item.fullPath), newName);

      console.log(`   → Renaming ${item.fullPath}  ->  ${newFullPath}`);
      
      try {
        fs.renameSync(item.fullPath, newFullPath);
        fixCount++;
      } catch (error) {
        console.error(`   ❌ Error renaming: ${error.message}`);
      }
    }
  }

  return fixCount;
}

function main() {
  console.log("🔎 Scanning for conflicting dynamic slugs…");
  let totalFixes = 0;

  for (const d of TARGET_DIRS) {
    const full = path.join(ROOT, d);
    if (!fs.existsSync(full)) {
      console.log(`\n⏭️  Skipping ./${d} (does not exist)`);
      continue;
    }
    console.log(`\n📁 Checking ./${d}`);
    const fixes = fixBaseDir(full);
    totalFixes += fixes;
  }

  console.log("\n" + "=".repeat(50));
  if (totalFixes > 0) {
    console.log(`✅ Fixed ${totalFixes} conflicting dynamic segment(s).`);
    console.log("   Re-run your Next.js build/dev server to apply changes.");
  } else {
    console.log("✅ No conflicting dynamic segments found.");
  }
  console.log("=".repeat(50) + "\n");
}

main();
