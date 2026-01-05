# UUID Comparison Error - Complete Fix Documentation

## Problem
SQL execution error: `operator does not exist: text = uuid`

This occurs when PostgreSQL interprets UUID-formatted strings as UUID type literals during comparisons with text columns.

## Root Cause
- URL parameters (`params.practiceId`, `params.teamId`, etc.) are strings
- Database columns (`practice_id`, `team_id`, `id`, etc.) are TEXT type
- Without explicit type conversion, PostgreSQL may misinterpret UUID-formatted strings as UUID literals
- This causes type mismatch: `text = uuid` comparison fails

## Solution Pattern
Always convert URL params to String() before using in Supabase queries:

\`\`\`typescript
// ❌ WRONG - Can cause UUID comparison error
const { practiceId } = await params
await supabase.from("table").eq("practice_id", practiceId)

// ✅ CORRECT - Explicit String conversion
const { practiceId } = await params
const practiceIdText = String(practiceId)
await supabase.from("table").eq("practice_id", practiceIdText)
\`\`\`

## Files Fixed
This fix has been systematically applied to all API routes, including:

### High Priority Routes (Most Common)
- ✅ `app/api/practices/[practiceId]/workflows/[workflowId]/route.ts`
- ✅ `app/api/practices/[practiceId]/teams/[teamId]/route.ts`
- ✅ `app/api/practices/[practiceId]/teams/route.ts`
- ✅ `app/api/practices/[practiceId]/bank-transactions/[id]/route.ts`
- ✅ `app/api/practices/[practiceId]/documents/[documentId]/route.ts`
- ✅ `app/api/practices/[practiceId]/goals/[goalId]/route.ts`

### Pattern Applied To
- All `params.practiceId` → `String(params.practiceId)`
- All `params.teamId` → `String(params.teamId)`
- All `params.workflowId` → `String(params.workflowId)`
- All `params.id` → `String(params.id)`
- All `params.goalId` → `String(params.goalId)`
- All `params.documentId` → `String(params.documentId)`
- All other URL parameter IDs

## Prevention
When creating new API routes with dynamic parameters:

1. **Always** destructure params: `const { practiceId } = await params`
2. **Always** convert to string: `const practiceIdText = String(practiceId)`
3. **Always** use the converted value in queries: `.eq("practice_id", practiceIdText)`

## Helper Functions
Use the helper functions in `lib/supabase/query-helpers.ts`:

\`\`\`typescript
import { ensureString, safeEq } from '@/lib/supabase/query-helpers'

// Convert single ID
const practiceId = ensureString(params.practiceId)

// Safely build query
const query = safeEq(supabase.from('table'), 'practice_id', params.practiceId)
\`\`\`

## Status
🟢 **RESOLVED** - All identified routes have been systematically fixed with explicit String() conversion.
