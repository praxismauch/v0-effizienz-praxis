# UUID Comparison Fix Guide

## Problem Overview

Your Next.js application encounters PostgreSQL errors like:
\`\`\`
operator does not exist: text = uuid
\`\`\`

This happens when URL parameters (which are strings) are compared to TEXT columns in PostgreSQL without explicit type conversion.

## Root Cause

1. URL params arrive as strings: `params.id → "123e4567-e89b-12d3-a456-426614174000"`
2. PostgreSQL detects UUID format and attempts implicit casting
3. TEXT columns can't be compared to UUID type → error
4. Solution: Explicit `String()` conversion prevents auto-casting

## The Fix Pattern

### Before (Error)
\`\`\`typescript
.eq("id", params.id)
.eq("practice_id", params.practiceId)
.in("user_ids", [params.userId])
\`\`\`

### After (Fixed)
\`\`\`typescript
.eq("id", String(params.id))
.eq("practice_id", String(params.practiceId))
.in("user_ids", [String(params.userId)])
\`\`\`

## Using the Automated Script

### 1. Dry Run (Preview Changes)
\`\`\`bash
pnpm run fix-uuid --dry-run
# or
tsx scripts/fix-uuid-comparisons.ts --dry-run
\`\`\`

This will:
- Scan all API routes
- Show which files need fixes
- Preview the changes without modifying files

### 2. View Statistics
\`\`\`bash
pnpm run fix-uuid --stats
\`\`\`

Shows summary statistics without detailed output.

### 3. Apply Fixes
\`\`\`bash
pnpm run fix-uuid --fix
\`\`\`

This will:
- Create backups in `.uuid-fix-backups/`
- Apply all String() conversions
- Report results

### 4. Review and Test
After applying fixes:
1. Check TypeScript errors: `pnpm typecheck`
2. Test affected API routes
3. Review git diff: `git diff`
4. Run test suite if available

## What the Script Detects

### Automatic Detection
The script automatically finds and fixes:

- **Dynamic route params**: `params.id`, `params.practiceId`, `params.userId`
- **Search params**: `searchParams.get('practiceId')`
- **ID variables**: Any variable ending with `Id` or `UUID`
- **Nested expressions**: `params.id || defaultId`

### Safety Features
- Skips already-fixed code (already has `String()` or `.toString()`)
- Skips string literals and numbers
- Creates backups before modifying files
- Comprehensive error handling

## Manual Review Needed

The script also reports (but doesn't auto-fix):

### .in() Array Issues
\`\`\`typescript
// Detected but needs manual review
.in("ids", [params.id1, params.id2])

// Fix:
.in("ids", [String(params.id1), String(params.id2)])
\`\`\`

### Complex Expressions
\`\`\`typescript
// May need manual review
.eq("id", condition ? params.id : otherId)

// Fix:
.eq("id", String(condition ? params.id : otherId))
\`\`\`

## Common Patterns Fixed

### Pattern 1: Single ID Lookup
\`\`\`typescript
// Before
const { data } = await supabase
  .from("practices")
  .select("*")
  .eq("id", params.id)

// After
const { data } = await supabase
  .from("practices")
  .select("*")
  .eq("id", String(params.id))
\`\`\`

### Pattern 2: Multiple Conditions
\`\`\`typescript
// Before
.eq("practice_id", params.practiceId)
.eq("user_id", params.userId)

// After
.eq("practice_id", String(params.practiceId))
.eq("user_id", String(params.userId))
\`\`\`

### Pattern 3: Update/Delete Operations
\`\`\`typescript
// Before
await supabase
  .from("documents")
  .delete()
  .eq("id", params.documentId)
  .eq("practice_id", params.practiceId)

// After
await supabase
  .from("documents")
  .delete()
  .eq("id", String(params.documentId))
  .eq("practice_id", String(params.practiceId))
\`\`\`

## Backup Recovery

If something goes wrong, restore from backups:

\`\`\`bash
# View backups
ls -la .uuid-fix-backups/app/api/

# Restore a specific file
cp .uuid-fix-backups/app/api/practices/[practiceId]/route.ts \
   app/api/practices/[practiceId]/route.ts

# Restore all files (careful!)
rsync -av .uuid-fix-backups/app/ app/
\`\`\`

## Troubleshooting

### Script Reports No Issues
- Check if fixes were already applied manually
- Verify you're running from project root
- Check that `app/api` directory exists

### TypeScript Errors After Fix
- Most likely unrelated to the fix
- Run `pnpm typecheck` to see details
- The String() wrapper is always safe for this use case

### Still Getting UUID Errors
- Check if the error is in a different file
- Look for `.neq()`, `.in()`, or other comparison operators
- Some cases may need manual review (complex expressions)

## Statistics

After running the script, you'll see:
- **Total files scanned**: All TypeScript files in `app/api`
- **Files with .eq() calls**: Files that use Supabase queries
- **Files needing fixes**: Files with unwrapped param comparisons
- **Fixes applied**: Number of String() conversions added

## Best Practices Going Forward

### Always Wrap Params
\`\`\`typescript
// Good habit for new routes
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { data } = await supabase
    .from("table")
    .select("*")
    .eq("id", String(params.id))  // ✅ Always wrap
}
\`\`\`

### Use Type Guards
\`\`\`typescript
// For complex logic
function ensureString(value: unknown): string {
  return String(value)
}

.eq("id", ensureString(params.id))
\`\`\`

### Update Templates
Add this pattern to your route templates and snippets.

## Need Help?

If the automated script doesn't fix your issue:
1. Run with `--dry-run` first to see what it detects
2. Check the detailed output for your specific file
3. Review the "Additional issues detected" section
4. Some complex cases may need manual fixes
