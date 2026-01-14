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

## Zeiterfassung (Time Tracking) Database Schema

### time_stamps table
```
column_name         | data_type                | is_nullable | column_default
--------------------|--------------------------|-------------|----------------
id                  | uuid                     | NO          | gen_random_uuid()
user_id             | text                     | NO          | null
practice_id         | text                     | NO          | null
stamp_type          | text                     | NO          | null
timestamp           | timestamp with time zone | NO          | now()
location_type       | text                     | YES         | 'office'::text
device_fingerprint  | text                     | YES         | null
ip_address          | text                     | YES         | null
latitude            | numeric                  | YES         | null
longitude           | numeric                  | YES         | null
notes               | text                     | YES         | null
is_manual           | boolean                  | YES         | false
created_at          | timestamp with time zone | YES         | now()
updated_at          | timestamp with time zone | YES         | now()
```

**DOES NOT HAVE**: browser_info, work_location, comment, type

**CHECK CONSTRAINTS**:
- `time_stamps_location_type_check`: location_type IN ('office', 'homeoffice', 'mobile')
- `time_stamps_stamp_type_check`: stamp_type IN ('start', 'stop', 'pause_start', 'pause_end')

### time_blocks table
```
column_name      | data_type                | is_nullable | column_default
-----------------|--------------------------|-------------|----------------
id               | uuid                     | NO          | gen_random_uuid()
user_id          | text                     | NO          | null
practice_id      | text                     | NO          | null
date             | date                     | NO          | null
start_time       | timestamp with time zone | NO          | null
end_time         | timestamp with time zone | YES         | null
planned_hours    | numeric                  | YES         | null
actual_hours     | numeric                  | YES         | null
break_minutes    | integer                  | YES         | 0
overtime_minutes | integer                  | YES         | 0
location_type    | text                     | YES         | 'office'::text
status           | text                     | YES         | 'active'::text
notes            | text                     | YES         | null
created_at       | timestamp with time zone | YES         | now()
updated_at       | timestamp with time zone | YES         | now()
```

**DOES NOT HAVE**: is_open, work_location, start_stamp_id, end_stamp_id, gross_minutes, net_minutes, plausibility_status

**CHECK CONSTRAINTS**:
- `time_blocks_location_type_check`: location_type IN ('office', 'homeoffice', 'mobile')
- `time_blocks_status_check`: status IN ('active', 'completed', 'corrected', 'deleted')

### Important Mappings (Code → Database)
- `work_location` → `location_type`
- `comment` → `notes`
- `is_open: true` → `status: 'active'`
- `is_open: false` → `status: 'completed'`
- `net_minutes` → calculate from `actual_hours * 60`
- Remove `browser_info`, `start_stamp_id`, `end_stamp_id`

### Allowed Values (Quick Reference)
| Column | Table | Allowed Values |
|--------|-------|----------------|
| location_type | time_stamps, time_blocks | 'office', 'homeoffice', 'mobile' |
| stamp_type | time_stamps | 'start', 'stop', 'pause_start', 'pause_end' |
| status | time_blocks | 'active', 'completed', 'corrected', 'deleted' |

## Workflows Database Schema

### workflows table
```
column_name                   | data_type                | is_nullable | column_default
------------------------------|--------------------------|-------------|----------------
id                            | text                     | NO          | null
name                          | text                     | NO          | null
description                   | text                     | YES         | null
practice_id                   | text                     | NO          | null
created_by                    | text                     | YES         | null
status                        | text                     | YES         | 'active'::text
trigger_type                  | text                     | YES         | null
is_template                   | boolean                  | YES         | false
total_steps                   | integer                  | YES         | 0
completed_steps               | integer                  | YES         | 0
progress_percentage           | integer                  | YES         | 0
started_at                    | timestamp with time zone | YES         | null
completed_at                  | timestamp with time zone | YES         | null
created_at                    | timestamp with time zone | YES         | now()
updated_at                    | timestamp with time zone | YES         | now()
deleted_at                    | timestamp with time zone | YES         | null
hide_items_from_other_users   | boolean                  | YES         | false
template_id                   | text                     | YES         | null
practiceid                    | text                     | YES         | null
priority                      | text                     | YES         | 'medium'::text
category_id                   | text                     | YES         | null
```

**DOES NOT HAVE**: story, category (uses category_id instead)

**CHECK CONSTRAINTS**:
- `workflows_status_check`: status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'archived')

### Important Field Mappings (Code → Database)
- Frontend sends `category` → Database stores in `category_id`
- Frontend sends `title` → Database stores in `name`
- `practice_id` is TEXT type (not integer)

### Allowed Values
| Column | Allowed Values |
|--------|----------------|
| status | 'draft', 'active', 'paused', 'completed', 'cancelled', 'archived' |
| priority | Any text (commonly: 'low', 'medium', 'high', 'urgent') |

### Notes
- The table has both `practice_id` (NOT NULL) and `practiceid` (nullable) columns - use `practice_id`
- Always use TEXT for practice_id queries: `.eq("practice_id", practiceId)` where practiceId is a string

## Employee Appraisals (Mitarbeitergespräche) Database Schema

### employee_appraisals table
```
column_name                | data_type                | is_nullable | column_default
---------------------------|--------------------------|-------------|----------------
id                         | uuid                     | NO          | gen_random_uuid()
practice_id                | text                     | NO          | null
employee_id                | text                     | NO          | null
appraiser_id               | text                     | YES         | null
appraisal_date             | date                     | YES         | null
appraisal_type             | text                     | YES         | null
status                     | text                     | YES         | 'draft'::text
overall_rating             | numeric                  | YES         | null
skill_rating_1             | numeric                  | YES         | null
skill_rating_2             | numeric                  | YES         | null
skill_rating_3             | numeric                  | YES         | null
skill_rating_4             | numeric                  | YES         | null
skill_rating_5             | numeric                  | YES         | null
skill_rating_6             | numeric                  | YES         | null
skill_rating_7             | numeric                  | YES         | null
skill_rating_8             | numeric                  | YES         | null
skill_rating_9             | numeric                  | YES         | null
skill_rating_10            | numeric                  | YES         | null
performance_areas          | jsonb                    | YES         | null
competencies               | jsonb                    | YES         | null
goals_review               | jsonb                    | YES         | null
new_goals                  | jsonb                    | YES         | null
development_plan           | jsonb                    | YES         | null
follow_up_actions          | jsonb                    | YES         | null
strengths                  | text                     | YES         | null
areas_for_improvement      | text                     | YES         | null
key_achievements           | text                     | YES         | null
challenges                 | text                     | YES         | null
employee_self_assessment   | text                     | YES         | null
manager_comments           | text                     | YES         | null
career_aspirations         | text                     | YES         | null
scheduled_at               | timestamp with time zone | YES         | null
created_at                 | timestamp with time zone | YES         | now()
updated_at                 | timestamp with time zone | YES         | now()
deleted_at                 | timestamp with time zone | YES         | null
```

**CRITICAL**: Column is `employee_id` NOT `memberId` or `member_id`

### skill_definitions table
```
column_name          | data_type                | is_nullable | column_default
---------------------|--------------------------|-------------|----------------
id                   | uuid                     | NO          | gen_random_uuid()
practice_id          | text                     | NO          | null
name                 | text                     | NO          | null
category             | text                     | YES         | null
description          | text                     | YES         | null
level_0_description  | text                     | YES         | null
level_1_description  | text                     | YES         | null
level_2_description  | text                     | YES         | null
level_3_description  | text                     | YES         | null
is_active            | boolean                  | YES         | true
display_order        | integer                  | YES         | 0
created_at           | timestamp with time zone | YES         | now()
updated_at           | timestamp with time zone | YES         | now()
team_id              | text                     | YES         | null
```

### Common Issues & Fixes

**Issue**: "Missing practiceId or memberId" error when saving
**Cause**: `currentPractice` from practice context is null/undefined when API is called
**Fix**: Always check `currentPractice?.id` exists before making API calls, add loading state until context is ready

**Issue**: Skills API returns 400 Bad Request
**Cause**: Missing or incorrect `/api/practices/[practiceId]/skills` route
**Fix**: Implement skills route or use correct endpoint `/api/practices/[practiceId]/skill-definitions`

### Important Field Mappings
- Frontend: `memberId` → Database: `employee_id`
- Frontend: `practiceId` → Database: `practice_id` (TEXT type)
- Frontend: `selectedMember.id` → Database: `employee_id`

### API Routes
- GET/POST: `/api/practices/[practiceId]/team-members/[memberId]/appraisals`
- GET/PATCH: `/api/practices/[practiceId]/appraisals/[appraisalId]`
- Skills: `/api/practices/[practiceId]/skill-definitions` (NOT `/skills`)

### Validation Requirements
- Both `practiceId` AND `employee_id` must be present before API calls
- `practiceId` must be TEXT type (e.g., "1" not 1)
- URL must include employee/member ID for new appraisals: `/mitarbeitergespraeche/neu?memberId=xxx`

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
