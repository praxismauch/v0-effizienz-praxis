# Current Issues Summary

## Issue 1: Team Member Detail Page Shows 404

**URL:** `/team/52f15351-1c88-4785-9229-3938524e1222`
**Status:** 404 Not Found

**Analysis:**
- The page file exists at `/app/team/[id]/page.tsx`
- The `getTeamMemberById` function has debug logs but they don't appear in server logs
- This suggests the route isn't being matched or compiled properly
- Possible Turbopack build issue (see fatal error in logs)

**Root Cause:**
The Turbopack fatal error shows: "Next.js package not found" from directory `/vercel/share/v0-next-shadcn/app`
This is causing dynamic routes to fail compilation.

**Solution Needed:**
1. Verify the dynamic route file structure
2. Check if Next.js can properly resolve the [id] dynamic segment
3. May need to restart dev server or clear build cache

## Issue 2: Dashboard Stats Shows 0 Team Members

**Current Behavior:** `teamMembers: 0` in dashboard stats
**Expected:** Should show actual count from database

**Fixes Applied:**
1. Changed query from `team_assignments` to `team_members` table ✅
2. Changed `practice_id` from string to integer ✅
3. Added debug logging ✅

**Status:** Fixes are in code but may not be reflected due to caching

**Verification Needed:**
Check if the team_members query actually returns data with:
```sql
SELECT COUNT(*) FROM team_members WHERE practice_id = 1;
```

## Issue 3: OnboardingProvider SSR Error

**Status:** Fix applied but not deployed (build cache issue)
**User Request:** Ignore this error for now

**Current Code:** Has SSR check (`typeof window === "undefined"`)
**Deployed Code:** Still throwing error (old version)

## Issue 4: Missing API Routes

**Status:** Intentionally removed as part of server-first migration
**Impact:** 401 errors in console for:
- `/api/practices/1/todos`
- `/api/practices/1/workflows`

**Note:** These should be migrated to server components, not API routes

## Recommended Next Steps

1. **Immediate:** Add more debug logging to team member detail page to see if route is being hit
2. **Verify:** Check Supabase directly for team member with ID `52f15351-1c88-4785-9229-3938524e1222`
3. **Test:** Restart dev server to clear Turbopack cache
4. **Migrate:** Complete remaining pages to server-first architecture
