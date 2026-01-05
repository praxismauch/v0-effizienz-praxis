# Dynamic Slug Conflict Fix Guide

## Problem

Next.js requires that all dynamic route segments at the same path level use **exactly the same slug name**. Having different names like `[id]` and `[eventId]` at the same level causes routing conflicts and 504 errors.

### Example of Conflict

\`\`\`
app/api/practices/[practiceId]/calendar-events/[id]/route.ts      ❌
app/api/practices/[practiceId]/calendar-events/[eventId]/route.ts ❌
\`\`\`

Both routes exist at the same path level but use different slug names (`id` vs `eventId`), causing Next.js routing to fail.

## Solution

The `fix-dynamic-slugs.mjs` script automatically:

1. Scans `app/` and `pages/` directories
2. Detects conflicting dynamic segment names at the same path level
3. Picks the first encountered slug name as canonical
4. Renames all other conflicting segments to match the canonical name

## Usage

### Step 1: Backup Your Code

\`\`\`bash
git add -A
git commit -m "backup before slug fix"
\`\`\`

### Step 2: Run the Fix Script

\`\`\`bash
pnpm run fix:slugs
\`\`\`

### Step 3: Restart Your Server

\`\`\`bash
# Stop the current server (Ctrl+C)
pnpm dev
# or for production
pnpm build
pnpm start
\`\`\`

## What Gets Fixed

The script will:

- ✅ Rename folders and files with conflicting dynamic segments
- ✅ Preserve all code inside the files (only renames the folder/file)
- ✅ Show detailed output of what was changed
- ✅ Skip non-dynamic routes
- ✅ Handle catch-all routes like `[...slug]` and optional catch-all `[[...slug]]`

## Example Output

\`\`\`
🔎 Scanning for conflicting dynamic slugs…

📁 Checking ./app

⚠️  Conflict in "app/api/practices/[practiceId]/calendar-events"
   Slugs found: id, eventId
   Canonical:   [id]
   → Renaming app/api/practices/[practiceId]/calendar-events/[eventId]/route.ts  ->  app/api/practices/[practiceId]/calendar-events/[id]/route.ts

==================================================
✅ Fixed 1 conflicting dynamic segment(s).
   Re-run your Next.js build/dev server to apply changes.
==================================================
\`\`\`

## Important Notes

1. **Internal code is NOT changed** - The script only renames folders/files. Your route handlers, components, and logic remain unchanged.

2. **Parameter names in code are independent** - Next.js lets you use any parameter name in your code:
   \`\`\`typescript
   // File: [id]/route.ts
   export async function GET(request: Request, { params }: { params: { id: string } }) {
     const eventId = params.id; // You can still call it eventId internally
   }
   \`\`\`

3. **Run after every major route change** - If you add new dynamic routes, run this script to prevent conflicts.

4. **Safe to run multiple times** - The script is idempotent and will only fix actual conflicts.

## Troubleshooting

### Script finds no conflicts but you still get errors

1. Clear Next.js cache:
   \`\`\`bash
   rm -rf .next
   pnpm dev
   \`\`\`

2. Check for typos in folder names manually

### After fixing, routes still don't work

1. Verify the folder was actually renamed:
   \`\`\`bash
   find app -type d -name "[*]"
   \`\`\`

2. Check that no other conflicting segments exist at different levels

## Prevention

To avoid future conflicts:

1. Decide on a slug naming convention:
   - Use `[id]` for all single-item routes
   - Use `[slug]` for all content routes
   - Use `[...slug]` for catch-all routes

2. Document your convention in your project README

3. Run `pnpm run fix:slugs` after adding new dynamic routes
