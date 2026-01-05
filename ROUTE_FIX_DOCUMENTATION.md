# Route Consolidation Fix

## Issue
Duplicate dynamic segments in Next.js routing caused 504 errors and routing conflicts.

## Problems Found

### 1. Calendar Events Route Conflict
**Location:** `app/api/practices/[practiceId]/calendar-events/`

**Duplicate Routes:**
- `[eventId]/route.ts` (DELETED)
- `[id]/route.ts` (KEPT)

**Resolution:**
- Deleted `[eventId]/route.ts` 
- Kept `[id]/route.ts` because it has:
  - Proper authentication checks (getCurrentUserId, getCurrentPracticeId)
  - Practice access validation
  - Soft delete functionality
  - More secure implementation

**Frontend Impact:**
- `contexts/calendar-context.tsx` already uses generic path construction that works with both
- No changes needed to frontend code

## Next.js Dynamic Route Rules

In Next.js App Router, you CANNOT have multiple dynamic segments at the same level:

### ❌ WRONG (causes 504 errors):
\`\`\`
/api/resource/[eventId]/route.ts
/api/resource/[id]/route.ts
\`\`\`

### ✅ CORRECT:
\`\`\`
/api/resource/[id]/route.ts  (single dynamic segment per level)
\`\`\`

## How to Prevent This

1. **One dynamic segment name per route level** - Use consistent naming (prefer `[id]` as the standard)
2. **Never mix optional catch-all with regular dynamic segments** - Don't have both `[id]` and `[[...id]]` at same level
3. **Check route tree consistency** - All dynamic segments at the same nesting level must have the same name

## Verification Steps

After this fix:
1. Restart Next.js development server to rebuild route tree
2. Test calendar event updates and deletes
3. Monitor for 504 errors in calendar operations
4. Check browser console for any routing errors

## Migration Notes

If you had code referencing the old `[eventId]` param:
- Update to use `params.id` instead of `params.eventId`
- The calendar context already handles this correctly by extracting the real ID from virtual recurring instances
</markdown>
