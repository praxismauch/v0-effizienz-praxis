# UUID Comparison Error Prevention Guide

## The Problem

You may encounter this PostgreSQL error repeatedly:

\`\`\`
SQL execution error: operator does not exist: text = uuid
\`\`\`

This occurs when PostgreSQL tries to compare a `text` column with a value it interprets as a UUID type.

## Root Cause

Our database uses `text` type for most ID columns (not UUID). When URL parameters like `params.practiceId` or `params.teamId` are passed directly to Supabase `.eq()` queries, PostgreSQL may interpret UUID-formatted strings as UUID literals, causing type mismatch errors.

### Affected Tables

Most tables have text IDs:
- `practices.id` (text)
- `teams.id`, `teams.practice_id` (text)
- `workflows.id`, `workflows.practice_id` (text)
- `users.id`, `users.practice_id` (text)
- `goals.id`, `goals.practice_id` (text)
- `todos.id`, `todos.practice_id` (text)
- And 70+ more tables...

## The Solution

**Always explicitly convert ID parameters to strings before using them in Supabase queries.**

### ✅ Correct Pattern

\`\`\`typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { practiceId: string; teamId: string } }
) {
  // Convert to strings explicitly
  const practiceIdStr = String(params.practiceId)
  const teamIdStr = String(params.teamId)

  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("practice_id", practiceIdStr)
    .eq("id", teamIdStr)

  // ... rest of code
}
\`\`\`

### ❌ Wrong Pattern (Causes Errors)

\`\`\`typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { practiceId: string; teamId: string } }
) {
  // DON'T DO THIS - May cause UUID comparison error
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("practice_id", params.practiceId)  // ❌ Error prone
    .eq("id", params.teamId)                // ❌ Error prone

  // ... rest of code
}
\`\`\`

## Helper Functions

Use the helper functions in `lib/supabase/query-helpers.ts`:

### Option 1: ensureString

\`\`\`typescript
import { ensureString } from "@/lib/supabase/query-helpers"

const practiceId = ensureString(params.practiceId)
const teamId = ensureString(params.teamId)

await supabase
  .from("teams")
  .select("*")
  .eq("practice_id", practiceId)
  .eq("id", teamId)
\`\`\`

### Option 2: ensureStrings (multiple IDs)

\`\`\`typescript
import { ensureStrings } from "@/lib/supabase/query-helpers"

const { practiceId, teamId, userId } = ensureStrings({
  practiceId: params.practiceId,
  teamId: params.teamId,
  userId: params.userId
})

await supabase
  .from("teams")
  .select("*")
  .eq("practice_id", practiceId)
  .eq("id", teamId)
\`\`\`

### Option 3: safeEq (chainable helper)

\`\`\`typescript
import { safeEq } from "@/lib/supabase/query-helpers"

let query = supabase.from("teams").select("*")
query = safeEq(query, "practice_id", params.practiceId)
query = safeEq(query, "id", params.teamId)

const { data, error } = await query
\`\`\`

## Already Fixed Files

The following files already implement this fix correctly:
- ✅ `app/api/practices/[practiceId]/workflows/[workflowId]/route.ts`
- ✅ `app/api/practices/[practiceId]/teams/route.ts`
- ✅ `app/api/practices/[practiceId]/teams/[teamId]/route.ts`

## Quick Reference Checklist

When creating or editing API routes:

- [ ] Extract URL parameters from `params`
- [ ] Convert all IDs to strings using `String()` or `ensureString()`
- [ ] Use converted strings in all `.eq()`, `.neq()`, `.in()` queries
- [ ] Test with different practice/team/user IDs to ensure no UUID errors

## Why This Works

By explicitly converting to strings, we tell PostgreSQL:
- "This is a text value, not a UUID"
- PostgreSQL then uses text comparison operators
- No type mismatch errors occur

## Prevention

**Golden Rule**: Never pass `params.*` directly to Supabase queries. Always convert first.

\`\`\`typescript
// ✅ ALWAYS DO THIS
const id = String(params.id)
await supabase.from("table").select("*").eq("id", id)

// ❌ NEVER DO THIS
await supabase.from("table").select("*").eq("id", params.id)
