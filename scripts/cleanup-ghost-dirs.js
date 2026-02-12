import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const projectRoot = '/vercel/share/v0-project';

const ghostDirs = [
  'app/competitor-analysis/[analysisId]',
  'app/igel-analysis/[analysisId]',
  'app/igel/[analysisId]',
  'app/roi-analysis/[analysisId]',
  'app/analysis/[analysisId]',
  'app/api/competitor-analysis/[analysisId]',
  'app/api/practices/[practiceId]/competitor-analysis/[analysisId]',
  'app/api/practices/[practiceId]/igel/[analysisId]',
  'app/api/roi-analysis/[analysisId]',
  'app/api/igel-analysis/[analysisId]',
  'app/api/ai-analysis-history/[analysisId]',
];

for (const dir of ghostDirs) {
  const fullPath = join(projectRoot, dir);
  if (existsSync(fullPath)) {
    try {
      rmSync(fullPath, { recursive: true, force: true });
      console.log(`REMOVED: ${dir}`);
    } catch (e) {
      console.log(`FAILED to remove ${dir}: ${e.message}`);
    }
  } else {
    console.log(`NOT FOUND: ${dir}`);
  }
}

console.log('\\nDone. Ghost directory cleanup complete.');
