# Doable Task Plan - Client/Server Error Fixes

## Overview
This plan breaks down the client-server error analysis into 5 concrete, actionable tasks that can be executed sequentially. Each task is designed to be completed independently and includes specific files to modify and clear success criteria.

---

## Task 1: Fix Session Management and 401 Error Handling ⭐ HIGH PRIORITY

**Problem:** Session retry logic causes infinite loops, 401 errors aren't handled properly, users get logged out randomly.

**Files to Modify:**
- `lib/supabase/client.ts` - Fix session refresh logic
- `lib/api-helpers.ts` - Add proper 401 error handling
- `components/providers/auth-provider.tsx` - Implement session state management
- All SWR hooks in `lib/hooks/` - Add global error handling

**Implementation Steps:**
1. Update `createBrowserClient` to handle auth state changes properly
2. Add centralized 401 error handler that redirects to login
3. Implement exponential backoff for session refresh retries (max 3 attempts)
4. Add global SWR error handler for authentication errors
5. Update all API calls to handle 401 consistently

**Success Criteria:**
- No infinite retry loops on session expiry
- Users are redirected to login on 401 without multiple redirects
- Session state is preserved across page refreshes
- Console shows no "Session missing" spam

**Estimated Impact:** Fixes ~60% of current production errors

---

## Task 2: Implement User Activation Workflow ⭐ HIGH PRIORITY

**Problem:** Users with `is_active=false` can't log in but get no clear workflow to request activation.

**Files to Create:**
- `app/auth/pending-approval/page.tsx` - Pending approval page
- `app/api/auth/request-activation/route.ts` - Request activation API
- `components/super-admin/pending-users-manager.tsx` - Admin approval interface

**Files to Modify:**
- `app/api/auth/login/route.ts` - Better error messages for inactive users
- `app/super-admin/verwaltung/page-client.tsx` - Add pending users tab

**Implementation Steps:**
1. Create pending approval page that users see when `is_active=false`
2. Add "Request Activation" button that notifies super admins
3. Build admin interface to approve/reject pending users
4. Update login API to redirect to pending page instead of signing out
5. Send email notifications to admins for new activation requests

**Success Criteria:**
- Inactive users see clear message and can request activation
- Super admins can approve users from admin panel
- Email notifications work for activation requests
- Login flow handles inactive users gracefully

**Estimated Impact:** Resolves all current login blocking issues

---

## Task 3: Optimize API Performance and Caching

**Problem:** Slow API responses, unnecessary database queries, no caching strategy.

**Files to Modify:**
- `app/api/super-admin/users/route.ts` - Add pagination and filtering
- `app/api/super-admin/practices/route.ts` - Optimize queries
- `app/api/super-admin/teams/route.ts` - Add caching
- `lib/hooks/use-super-admin-*.ts` - Implement SWR caching properly

**Files to Create:**
- `lib/cache-config.ts` - Centralized cache configuration
- `lib/api/query-optimizer.ts` - Query optimization utilities

**Implementation Steps:**
1. Add pagination to all list endpoints (limit, offset, cursor)
2. Implement Redis caching for frequently accessed data (practices, users)
3. Add database query optimization (indexes, joins reduction)
4. Configure SWR cache policies (revalidate on focus, dedupe requests)
5. Add request deduplication for parallel calls

**Success Criteria:**
- API responses under 500ms for cached data
- No duplicate database queries for same data
- Pagination works on all list views
- SWR cache reduces API calls by 70%

**Estimated Impact:** 3-5x faster page loads, reduced database load

---

## Task 4: Add Server-Only Protection to Sensitive Code

**Problem:** Admin/server functions accessible from client, security risk.

**Files to Create:**
- `lib/server/admin-only.ts` - Server-only admin utilities
- `lib/server/auth-guard.ts` - Server-side auth verification

**Files to Modify:**
- `lib/supabase/admin.ts` - Add server-only import
- All super-admin API routes - Add proper auth checks
- `app/api/super-admin/*/route.ts` - Verify admin role on every request

**Implementation Steps:**
1. Add `import "server-only"` to all server-specific files
2. Create wrapper functions for admin operations
3. Add middleware to verify super admin role on protected routes
4. Move sensitive logic to server components/actions
5. Audit and remove any admin functions exposed to client

**Success Criteria:**
- All admin functions have `server-only` import
- Client code cannot access admin utilities
- API routes verify admin role before execution
- Build fails if server code imported on client

**Estimated Impact:** Eliminates security vulnerabilities, prevents accidental client exposure

---

## Task 5: Fix Race Conditions in Data Fetching

**Problem:** Multiple parallel requests, stale data overwrites fresh data, inconsistent state.

**Files to Modify:**
- All hooks in `lib/hooks/use-super-admin-*.ts` - Add proper key management
- `components/super-admin/*-manager.tsx` - Fix concurrent mutations
- SWR configurations across codebase

**Files to Create:**
- `lib/hooks/use-optimistic-mutation.ts` - Optimistic updates helper
- `lib/api/mutation-queue.ts` - Serial mutation queue

**Implementation Steps:**
1. Implement proper SWR key dependencies (revalidate related data on mutation)
2. Add optimistic updates for better UX
3. Create mutation queue to serialize conflicting updates
4. Fix stale closure issues in hooks (use refs for latest values)
5. Add loading states to prevent concurrent submissions

**Success Criteria:**
- No race conditions between parallel requests
- Mutations don't overwrite each other
- Data stays consistent across components
- Optimistic updates rollback on error

**Estimated Impact:** Eliminates data consistency bugs, better UX

---

## Execution Order

Execute tasks in this order for maximum impact:

1. **Week 1:** Task 1 (Session Management) - Highest user impact
2. **Week 1:** Task 2 (User Activation) - Unblocks users immediately
3. **Week 2:** Task 3 (Performance) - Improves overall experience
4. **Week 3:** Task 4 (Security) - Risk mitigation
5. **Week 3:** Task 5 (Race Conditions) - Polish and stability

---

## Monitoring After Each Task

After completing each task, monitor these metrics:

- **Error Rate:** Should decrease by 20-30% per task
- **API Response Time:** Should improve by 50-70% after Task 3
- **User Complaints:** Should drop significantly after Tasks 1 & 2
- **Database Load:** Should decrease by 40% after Task 3
- **Security Audit:** Should pass after Task 4

---

## Quick Wins (Can be done anytime)

These small fixes can be done independently:

1. Add `console.log` removal script to clean up debug statements
2. Update role documentation to match database constraint
3. Add health check endpoint for monitoring
4. Implement request ID tracing for debugging
5. Add error boundary components to catch client errors

---

## Notes

- Each task is designed to be completed in 1-3 days by one developer
- Tasks are independent but build on each other
- All changes should be tested on staging before production
- Create a separate branch for each task
- Document all API changes in the existing docs

---

## Current Priority

**START WITH TASK 1** - Fix Session Management and 401 Error Handling

This will immediately improve stability and user experience. The other tasks can follow in sequence.
