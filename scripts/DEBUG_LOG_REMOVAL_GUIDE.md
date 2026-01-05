# Debug Log Removal Script

This script automatically removes all `console.log("[v0]")` debug statements from the codebase.

## Usage

### Dry Run (Preview Changes)
\`\`\`bash
pnpm run remove-debug -- --dry-run
\`\`\`

This will show you what changes would be made without modifying any files.

### Apply Changes
\`\`\`bash
pnpm run remove-debug
\`\`\`

This will remove all debug log statements from the codebase.

### Verbose Mode
\`\`\`bash
pnpm run remove-debug -- --verbose
\`\`\`

Shows detailed information about each file being processed.

### Combine Options
\`\`\`bash
pnpm run remove-debug -- --dry-run --verbose
\`\`\`

## What It Does

- Scans all `.ts` and `.tsx` files in the project
- Identifies lines containing `console.log("[v0]"`
- Handles both single-line and multi-line console.log statements
- Removes the entire statement including continuation lines
- Preserves all other code and formatting

## Statistics

The script will provide a summary including:
- Number of files processed
- Total debug logs removed
- List of modified files with counts

## Safety

- Always run with `--dry-run` first to preview changes
- The script creates backups in memory before writing
- Only targets `console.log("[v0]")` statements specifically
- Does not affect other console.log statements

## Example Output

\`\`\`
🔍 Searching for debug log statements...

✓ app/api/auth/login/route.ts: Removed 3 debug log(s)
✓ app/api/practices/[practiceId]/goals/route.ts: Removed 8 debug log(s)

============================================================
📊 Summary
============================================================
Files processed: 45
Debug logs removed: 187

✨ Done!
