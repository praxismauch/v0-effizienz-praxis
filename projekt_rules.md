## Database Schema Critical Information

### Practice ID Data Type
- **practices.id**: TEXT (not integer)
- **All practice_id foreign keys**: Mostly TEXT (some exceptions: academy tables use integer, some use uuid)
- **Current practice IDs in production**: "0", "1", "3", "4", "5"
- **NEVER attempt to convert practice_id columns** - RLS policies depend on them and will block ALTER TYPE operations

### RLS Policy Dependencies
- Cannot alter column types that have RLS policies attached
- To change types, you must: DROP policies → ALTER column → RECREATE policies
- This is risky and should be avoided in production

### Known Data Type Inconsistencies
**Tables with TEXT practice_id** (majority):
- shift_types, shift_schedules, employee_availability, compliance_violations
- shift_swap_requests, team_members, time_blocks, time_stamps, time_correction_requests
- Most other application tables

**Tables with INTEGER practice_id**:
- academy_courses, academy_enrollments, academy_user_badges
- roadmap_idea_feedback, user_preferences, user_self_checks

**Tables with UUID practice_id**:
- cockpit_card_settings, role_permissions, smtp_settings, user_profiles

### Best Practices
1. Always treat practice_id as TEXT in queries: `WHERE practice_id = '1'` not `WHERE practice_id = 1`
2. When building APIs, explicitly convert to string: `const practiceId = String(params.practiceId)`
3. Never assume practice_id type - always check the schema first
4. Use parameterized queries to avoid type coercion issues

## Common Loading Issues (Dienstplan, Zeiterfassung) - FIXED

### Root Causes Identified
1. **Missing Timeout Protection**: API calls could hang indefinitely
2. **Promise.all Blocking**: One failed API would prevent entire page from loading
3. **Silent Failures**: Direct Supabase queries with RLS issues had no error handling
4. **No Partial Loading**: All-or-nothing approach prevented showing available data

### Solutions Implemented
1. **fetchWithTimeout utility** (`lib/fetch-with-timeout.ts`):
   - Default 10 second timeout for all fetch requests
   - Prevents infinite loading by aborting stalled requests
   - Clear error messages for timeout issues

2. **Promise.allSettled instead of Promise.all**:
   - Dienstplan now loads partial data if some APIs fail
   - Shows toast notification for failed APIs
   - Page remains functional with available data

3. **Zeiterfassung Timeout Protection**:
   - Each Supabase query wrapped in Promise.race with 5s timeout
   - Partial loading with error notifications
   - Page doesn't hang on RLS or connection issues

4. **Better Error Messages**:
   - User sees which specific data failed to load
   - Console logs track exact failure points
   - Toast notifications provide actionable feedback

### Debugging Steps (if issues persist)
1. Check browser console for "[v0]" debug logs
2. Check Network tab for failed/timeout requests
3. Verify practice_id format matches database type (TEXT vs INTEGER)
4. Test RLS policies with direct SQL queries
5. Ensure currentPractice exists before making calls

### Prevention Checklist
- ✅ Always use fetchWithTimeout for API calls
- ✅ Use Promise.allSettled for parallel requests
- ✅ Set isLoading to false in finally block
- ✅ Add timeout protection to all async operations
- ✅ Show partial data when possible (graceful degradation)
- ✅ Add toast notifications for failed requests
- ✅ Never let currentPractice?.id be undefined when fetching
