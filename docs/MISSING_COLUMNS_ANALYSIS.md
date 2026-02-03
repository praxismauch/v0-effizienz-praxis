# Missing Database Columns Analysis

> **Date:** January 2026  
> **Status:** Columns Identified and Script Ready  
> **Purpose:** Comprehensive analysis of missing columns in database tables

---

## Executive Summary

This analysis identified **12 missing columns** across **6 database tables** that are actively referenced in the codebase but don't exist in the database schema. These missing columns are causing PGRST204 errors and preventing features from working correctly.

---

## Missing Columns by Table

### 1. `calendar_events` Table

| Column | Type | Nullable | Usage | Priority |
|--------|------|----------|-------|----------|
| `location` | TEXT | YES | Stores meeting location or URL | **HIGH** |
| `attendees` | JSONB | YES | Stores list of attendees | **HIGH** |
| `recurrence_type` | TEXT | YES | Values: none, daily, weekly, monthly, yearly | **MEDIUM** |
| `recurrence_end_date` | DATE | YES | End date for recurring events | **MEDIUM** |
| `is_recurring_instance` | BOOLEAN | YES | True if generated from recurring event | **MEDIUM** |
| `parent_event_id` | TEXT | YES | FK to original recurring event | **MEDIUM** |
| `last_generated_date` | DATE | YES | Tracks last date generated for recurring | **MEDIUM** |
| `is_all_day` | BOOLEAN | YES | True for all-day events | **HIGH** |

**Files Using These Columns:**
- `/app/api/practices/[practiceId]/calendar-events/route.ts` (lines 43-57, 118-145)
- `/app/calendar/types.ts` (CalendarEvent interface)

**Impact:** Calendar events cannot store location, attendees, or support recurring events.

---

### 2. `team_members` Table

| Column | Type | Nullable | Usage | Priority |
|--------|------|----------|-------|----------|
| `position` | TEXT | YES | Job title/position | **MEDIUM** |

**Files Using This Column:**
- `/app/team/types.ts` (TeamMember interface, line 21)
- Multiple team management components

**Impact:** Team members' job positions cannot be stored or displayed.

---

### 3. `teams` Table  

| Column | Type | Nullable | Usage | Priority |
|--------|------|----------|-------|----------|
| `display_order` | INTEGER | YES | Sorting order for teams | **LOW** |

**Files Using This Column:**
- `/app/team/types.ts` (Team interface, line 23)
- Multiple UI components for team ordering

**Impact:** Teams cannot be manually sorted by users.

---

### 4. `workflows` Table

| Column | Type | Nullable | Usage | Priority |
|--------|------|----------|-------|----------|
| `team_ids` | TEXT[] | YES | Array of team IDs assigned | **MEDIUM** |

**Files Using This Column:**
- `/app/api/practices/[practiceId]/workflows/route.ts` (lines 50, 144, 199)

**Impact:** Workflows cannot be assigned to specific teams.

---

### 5. `holiday_requests` Table

| Column | Type | Nullable | Usage | Priority |
|--------|------|----------|-------|----------|
| `days_count` | NUMERIC | YES | Number of days requested | **HIGH** |

**Files Using This Column:**
- `/app/team/types.ts` (HolidayRequest interface, line 56)

**Impact:** Holiday request duration cannot be calculated or displayed.

---

### 6. `staffing_plans` Table

| Column | Type | Nullable | Usage | Priority |
|--------|------|----------|-------|----------|
| `description` | TEXT | YES | Staffing plan description | **MEDIUM** |

**Files Using This Column:**
- `/app/team/types.ts` (StaffingPlan interface, line 65)

**Impact:** Staffing plans cannot have detailed descriptions.

---

## Previously Missing Columns (Now Fixed)

These columns were identified as missing and have been added by the migration:

1. ✅ `user_favorites.sort_order` - For custom ordering
2. ✅ `team_members.avatar_url` - For profile pictures
3. ✅ `time_blocks.is_open` - For tracking active time blocks
4. ✅ `time_stamps.comment` - For time entry notes
5. ✅ `practices.description` - For practice descriptions

---

## Columns That Should NOT Be Added

### `team_members.skills`
- **Type Reference:** `string[]` in interface
- **Recommendation:** Use separate `team_member_skills` junction table
- **Reason:** Better normalization, skills should be defined centrally

### `calendar_events.event_type`
- **Status:** Column exists as `type` (not `event_type`)
- **Action:** Update code to use correct column name

---

## Migration Priority

### High Priority (Fix Immediately)
- `calendar_events.location` - Used in every event creation
- `calendar_events.is_all_day` - Essential for event display
- `calendar_events.attendees` - Core feature for meetings
- `holiday_requests.days_count` - Critical for holiday management

### Medium Priority (Fix Soon)
- `calendar_events.recurrence_*` - Nice-to-have recurring events
- `team_members.position` - Helpful but not critical
- `workflows.team_ids` - Team assignment feature
- `staffing_plans.description` - Additional context

### Low Priority (Optional)
- `teams.display_order` - UI enhancement

---

## Database Impact Assessment

### Tables Affected: 6
- `calendar_events` (8 columns)
- `team_members` (1 column)  
- `teams` (1 column)
- `workflows` (1 column)
- `holiday_requests` (1 column)
- `staffing_plans` (1 column)

### Total New Columns: 13

### Estimated Migration Time: 2-3 seconds

### Risk Level: **LOW**
- All columns are nullable
- No data transformation required
- No breaking changes to existing data

---

## Implementation Script

A comprehensive migration script has been created at:
```
/scripts/add-all-missing-columns-complete.sql
```

This script:
- Uses `IF NOT EXISTS` to safely add columns
- Sets appropriate defaults
- Handles all 13 missing columns
- Can be run multiple times safely (idempotent)

---

## Post-Migration Verification

After running the migration, verify with:

```sql
-- Check calendar_events columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'calendar_events' 
  AND column_name IN ('location', 'attendees', 'is_all_day');

-- Check team_members columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_members' 
  AND column_name = 'position';

-- Check workflows columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workflows' 
  AND column_name = 'team_ids';
```

---

## Recommendations

1. **Immediate Action:** Execute the migration script to add all missing columns
2. **Code Review:** Update TypeScript interfaces to match actual database schema
3. **Documentation:** Update DATABASE_SCHEMA.md after migration
4. **Testing:** Verify calendar events, team management, and workflows after migration
5. **Future Prevention:** Set up schema validation in CI/CD to catch mismatches

---

## Related Files

- Migration Script: `/scripts/add-all-missing-columns-comprehensive.sql`
- Schema Docs: `/docs/DATABASE_SCHEMA.md`
- Type Definitions: `/app/calendar/types.ts`, `/app/team/types.ts`
- API Routes: `/app/api/practices/[practiceId]/*/route.ts`

---

## Notes

- All missing columns are non-breaking additions
- Existing functionality will not be affected
- New features will become available after migration
- No data migration or transformation needed
