# Database Analysis Report - API 500 Errors
**Date:** January 15, 2026  
**Issue:** 500 errors on `/api/practices/1/sick-leaves/stats` and `/api/practices/1/parameter-values`

---

## Executive Summary

✅ **GOOD NEWS:** All required database tables exist and have data!
- `sick_leaves` table exists with proper schema
- `parameter_values` table exists with proper schema  
- `analytics_parameters` table exists with proper schema
- Test data exists (1 sick leave record for Daniel Mauch)

❌ **PROBLEM IDENTIFIED:** Foreign key reference mismatch in API code

---

## Detailed Analysis

### Issue 1: Foreign Key Mismatch in `sick_leaves` Stats Route

**File:** `app/api/practices/[practiceId]/sick-leaves/stats/route.ts`

**Problem:**
\`\`\`typescript
// Line ~13-17: API tries to join with foreign key constraint
.select(`
  id,
  user_id,
  start_date,
  end_date,
  status,
  user:users!sick_leaves_user_id_fkey(id, name)  // ❌ This foreign key doesn't exist
`)
\`\`\`

**Database Reality:**
\`\`\`csv
sick_leaves table columns:
- id (text, primary key)
- practice_id (text, NOT NULL)
- user_id (text, NOT NULL)  // Just a text column, no foreign key constraint
- team_member_id (text, nullable)
- start_date (date, NOT NULL)
- end_date (date, NOT NULL)
- reason (text, nullable)
- notes (text, nullable)
- status (text, nullable)
- approved_by (text, nullable)
- approved_at (timestamp)
- document_url (text, nullable)
- created_by (text, NOT NULL)
- created_at (timestamp)
- updated_at (timestamp)
- deleted_at (timestamp with time zone)
\`\`\`

**Root Cause:** 
The `user_id` column in `sick_leaves` is just a text field with NO foreign key constraint to the `users` table. The Supabase query tries to use `sick_leaves_user_id_fkey` which doesn't exist, causing the query to fail.

**Data Example:**
\`\`\`
id: c9ac13ab-dcbe-4ea1-a89d-446b0474e41c
practice_id: 1
user_id: 36883b61-34e4-4b9e-8a11-eb1a9656d2a0
user_name: Daniel Mauch
start_date: 2025-12-30
end_date: 2026-01-07
\`\`\`

---

### Issue 2: Parameter Values Route (Likely Similar Issue)

**File:** `app/api/practices/[practiceId]/parameter-values/route.ts`

**Code:**
\`\`\`typescript
// Lines ~22-27: Uses implicit foreign key relationships
.select(`
  *,
  parameter:analytics_parameters(id, name, category, unit, data_type),
  user:users(id, name)
`)
\`\`\`

**Database Schema:**
\`\`\`csv
parameter_values columns:
- id (text, primary key)
- parameter_id (text, NOT NULL)  // No explicit foreign key shown
- practice_id (text, NOT NULL)
- value (text, NOT NULL)
- recorded_date (date, NOT NULL)
- recorded_by (text, nullable)  // No explicit foreign key shown
- notes (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
- deleted_at (timestamp with time zone)

analytics_parameters columns:
- id (text, primary key)
- practice_id (text, nullable)
- name (text, NOT NULL)
- category (text, NOT NULL)
- data_type (text, NOT NULL)
- unit (text, nullable)
- description (text, nullable)
- is_global (boolean, nullable)
- created_at (timestamp)
- updated_at (timestamp)
- interval (text, nullable)
- group_ids (jsonb, nullable)
- data_collection_start (date, nullable)
- color (text, nullable)
- deleted_at (timestamp with time zone)
\`\`\`

**Potential Issue:** The implicit join syntax might fail if foreign keys aren't properly defined in Supabase.

---

## Solutions

### Option 1: Fix Foreign Key Constraints (Recommended)

Add proper foreign key constraints to the database:

\`\`\`sql
-- Fix sick_leaves foreign key
ALTER TABLE public.sick_leaves
ADD CONSTRAINT sick_leaves_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Fix parameter_values foreign keys
ALTER TABLE public.parameter_values
ADD CONSTRAINT parameter_values_parameter_id_fkey 
FOREIGN KEY (parameter_id) 
REFERENCES public.analytics_parameters(id) 
ON DELETE CASCADE;

ALTER TABLE public.parameter_values
ADD CONSTRAINT parameter_values_recorded_by_fkey 
FOREIGN KEY (recorded_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Verify foreign keys were created
SELECT
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('sick_leaves', 'parameter_values')
ORDER BY tc.table_name;
\`\`\`

### Option 2: Fix API Code (Alternative if DB changes not possible)

Modify the API routes to use manual joins instead of foreign key syntax:

**For sick-leaves stats route:**
\`\`\`typescript
// Instead of using foreign key syntax, fetch separately
const { data: sickLeaves, error } = await supabase
  .from("sick_leaves")
  .select("id, user_id, start_date, end_date, status")
  .eq("practice_id", String(practiceId))
  .is("deleted_at", null)
  .gte("start_date", `${year}-01-01`)
  .lte("start_date", `${year}-12-31`)

// Then fetch user names separately
const userIds = [...new Set(sickLeaves?.map(sl => sl.user_id).filter(Boolean))]
const { data: users } = await supabase
  .from("users")
  .select("id, name")
  .in("id", userIds)

// Manually join in code
const leavesWithUsers = sickLeaves?.map(leave => ({
  ...leave,
  user: users?.find(u => u.id === leave.user_id)
}))
\`\`\`

---

## Diagnostic SQL Scripts

### Check Current Foreign Keys
\`\`\`sql
-- List all foreign keys in the database
SELECT
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('sick_leaves', 'parameter_values', 'analytics_parameters')
ORDER BY tc.table_name, tc.constraint_name;
\`\`\`

### Verify Data Integrity Before Adding Constraints
\`\`\`sql
-- Check if all user_ids in sick_leaves exist in auth.users
SELECT DISTINCT sl.user_id, u.id as user_exists
FROM sick_leaves sl
LEFT JOIN auth.users u ON sl.user_id = u.id
WHERE u.id IS NULL;
-- If this returns rows, those user_ids don't exist and need to be fixed first

-- Check if all parameter_ids exist
SELECT DISTINCT pv.parameter_id, ap.id as param_exists
FROM parameter_values pv
LEFT JOIN analytics_parameters ap ON pv.parameter_id = ap.id
WHERE ap.id IS NULL;
-- If this returns rows, those parameter_ids don't exist

-- Check if all recorded_by users exist
SELECT DISTINCT pv.recorded_by, u.id as user_exists
FROM parameter_values pv
LEFT JOIN auth.users u ON pv.recorded_by = u.id
WHERE pv.recorded_by IS NOT NULL AND u.id IS NULL;
-- If this returns rows, those user_ids don't exist
\`\`\`

### Test Queries After Fix
\`\`\`sql
-- Test sick_leaves query (mimics API)
SELECT 
    sl.id,
    sl.user_id,
    sl.start_date,
    sl.end_date,
    sl.status,
    u.id as user_id_check,
    u.name as user_name
FROM sick_leaves sl
LEFT JOIN auth.users u ON sl.user_id = u.id
WHERE sl.practice_id = '1'
    AND sl.deleted_at IS NULL
    AND sl.start_date >= '2026-01-01'
    AND sl.start_date <= '2026-12-31';

-- Test parameter_values query (mimics API)
SELECT 
    pv.*,
    ap.id as param_id,
    ap.name as param_name,
    ap.category,
    ap.unit,
    ap.data_type,
    u.id as user_id_check,
    u.name as user_name
FROM parameter_values pv
LEFT JOIN analytics_parameters ap ON pv.parameter_id = ap.id
LEFT JOIN auth.users u ON pv.recorded_by = u.id
WHERE pv.practice_id = '1'
ORDER BY pv.recorded_date DESC
LIMIT 10;
\`\`\`

---

## Recommendations

1. **IMMEDIATE ACTION:** Run data integrity checks (Section: Verify Data Integrity)
2. **PRIMARY FIX:** Add foreign key constraints (Option 1) - This is the proper database design
3. **ENABLE RLS:** Ensure Row Level Security policies are properly configured
4. **TESTING:** After adding constraints, test both API endpoints with:
   - Valid practice_id
   - Valid date ranges
   - Check browser network tab for response codes

---

## Additional Notes

- All tables use `text` for IDs (not UUID type), which is fine but inconsistent
- The `deleted_at` pattern is properly implemented (soft deletes)
- Practice IDs are stored as text ("1") not integers
- Date formats use ISO standard (YYYY-MM-DD)
- User IDs appear to be valid UUIDs stored as text

---

## Status: AWAITING FOREIGN KEY CREATION

The API code is correct, but the database is missing foreign key constraints that Supabase's implicit join syntax requires. Once constraints are added, the 500 errors should resolve immediately.
