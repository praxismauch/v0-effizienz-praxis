import fs from "fs";
import path from "path";

const appDir = path.resolve("app");

function scanDir(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  const dynamicDirs = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      if (entry.name.startsWith("[") && entry.name.endsWith("]")) {
        dynamicDirs.push(entry.name);
      }
      scanDir(fullPath);
    }
  }

  if (dynamicDirs.length > 1) {
    const unique = [...new Set(dynamicDirs)];
    if (unique.length > 1) {
      console.log("CONFLICT in:", dir);
      console.log("  Slugs:", unique.join(", "));
    }
  }
}

scanDir(appDir);
console.log("Scan complete.");
