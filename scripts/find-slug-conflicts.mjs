import { readdirSync, statSync } from 'fs';
import { join } from 'path';

function findDynamicConflicts(dir, depth = 0) {
  try {
    const entries = readdirSync(dir);
    const dynamicDirs = entries.filter(e => e.startsWith('[') && e.endsWith(']') && statSync(join(dir, e)).isDirectory());
    
    if (dynamicDirs.length > 1) {
      console.log(`CONFLICT at ${dir}:`);
      dynamicDirs.forEach(d => console.log(`  - ${d}`));
    }
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        if (statSync(fullPath).isDirectory()) {
          findDynamicConflicts(fullPath, depth + 1);
        }
      } catch {}
    }
  } catch {}
}

findDynamicConflicts('/vercel/share/v0-project/app');
