# Effizienz Praxis - Project Rules & Database Schema Reference

**This is the single source of truth for all project rules and database schema documentation.**
**Always check this file before making changes to ensure compliance with database schema and coding patterns.**

---

## Table of Contents
1. [Core Principles](#core-principles)
2. [Database Schema Reference](#database-schema-reference)
3. [RLS Policies & Security](#rls-policies--security)
4. [API Patterns](#api-patterns)
5. [Component Patterns](#component-patterns)
6. [Common Issues & Fixes](#common-issues--fixes)
7. [Critical Bug Tracking](#critical-bug-tracking)
8. [Diagnostic Info](#diagnostic-info)

---

## Core Principles

### Must-Follow Rules

#### German Date/Time Format
- Always use DD.MM.YYYY and HH:mm format
- Use `date-fns` with German locale: `format(date, "dd.MM.yyyy", { locale: de })`

#### UUID & ID Validation
- Never allow empty UUIDs - validate before all database operations
- Never allow practice_id = 0 or empty - validate in all mutations

#### German Language
- All user-facing text must be in German
- Common translations: Save=Speichern, Cancel=Abbrechen, Delete=Löschen, Edit=Bearbeiten

#### Async/Await
- Use async/await exclusively - no mixing callbacks and `.then()`
- Handle all errors explicitly - no unhandled promise rejections

#### Authentication Pattern (CRITICAL)
- **NEVER** use `createAdminClient()` for user authentication
- **ALWAYS** use `createServerClient()` from `@supabase/ssr` for routes that need user context
- `createAdminClient()` is ONLY for backend operations that bypass RLS (e.g., cron jobs, admin tasks)
- Flow: Browser → calls API route → Route uses `createServerClient()` with cookies → `supabase.auth.getUser()`

---

## Database Schema Reference

### CRITICAL: practice_id Type Variations

Most tables use TEXT for practice_id, but some use INTEGER or UUID:

| Table | practice_id Type | Fix Needed |
|-------|-----------------|------------|
| Most tables | TEXT | Use as string |
| academy_courses | INTEGER | Use `Number.parseInt(practiceId)` |
| academy_enrollments | INTEGER | Use `Number.parseInt(practiceId)` |
| academy_user_badges | INTEGER | Use `Number.parseInt(practiceId)` |
| user_preferences | INTEGER | Use `Number.parseInt(practiceId)` |
| user_self_checks | INTEGER | Use `Number.parseInt(practiceId)` |
| roadmap_idea_feedback | INTEGER | Use `Number.parseInt(practiceId)` |
| cockpit_card_settings | UUID | No practice_id query needed |
| role_permissions | UUID | Handle as UUID |
| smtp_settings | UUID | No practice_id query needed |
| user_profiles | UUID | Handle as UUID |

### User ID Column Variations

Different tables use different column names for user references:

| Table | Column Name | Type |
|-------|-------------|------|
| time_blocks, time_stamps, overtime_accounts | `user_id` | TEXT |
| employee_appraisals | `employee_id` | TEXT |
| shift_schedules, employee_availability | `team_member_id` | UUID |
| compliance_violations | `team_member_id` | UUID |
| contracts | `team_member_id` | TEXT |

### Duplicate Column Warning

These tables have DUPLICATE columns - **ALWAYS use `practice_id`**:

| Table | Duplicate Column | Use Instead |
|-------|------------------|-------------|
| teams | practiceid | practice_id |
| team_assignments | practiceid | practice_id |
| todos | practiceid | practice_id |
| goals | practiceid | practice_id |
| org_chart_positions | practiceid | practice_id |

---

### org_chart_positions (Organigramm)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| practice_id | text | NO | Required for RLS |
| practiceid | text | YES | **DEPRECATED - DO NOT USE** |
| position_title | text | NO | Required |
| parent_id | text | YES | References self |
| level | integer | YES | Hierarchy level |
| team_member_id | text | YES | Links to team member |
| description | text | YES | |
| is_active | boolean | YES | Default true |
| created_at | timestamp | YES | |
| updated_at | timestamp | YES | |

**RLS Status:** Enabled with SELECT/INSERT/UPDATE/DELETE policies

---

### goals (Ziele)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| practice_id | text | NO | Required for RLS |
| practiceid | text | YES | **DEPRECATED - DO NOT USE** |
| title | text | NO | Goal title |
| description | text | YES | |
| goal_type | text | YES | NOT 'category'! |
| parent_goal_id | text | YES | NOT 'parent_id'! |
| target_value | numeric | YES | **Frontend often missing!** |
| current_value | numeric | YES | |
| unit | text | YES | **Frontend often missing!** |
| progress_percentage | integer | YES | NOT 'progress'! |
| start_date | date | YES | |
| end_date | date | YES | NOT 'due_date'! |
| status | text | YES | CHECK: 'not-started', 'in-progress', 'completed', 'cancelled' |
| priority | text | YES | CHECK: 'low', 'medium', 'high' |
| assigned_to | text | YES | |
| created_by | text | YES | |
| created_at | timestamp | YES | |
| updated_at | timestamp | YES | |
| deleted_at | timestamp | YES | Soft delete |

**RLS Status:** Enabled with SELECT/INSERT/UPDATE/DELETE policies

**Data Quality Issue (from audit):**
- 80% of goals have NULL `target_value`
- 100% of goals have NULL `unit`
- Frontend form not sending these fields properly

---

### calendar_events

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| practice_id | text | NO | Required for RLS |
| title | text | NO | |
| description | text | YES | |
| start_date | date | NO | Stored as DATE type (not timestamp) |
| end_date | date | YES | Stored as DATE type |
| start_time | time | YES | |
| end_time | time | YES | |
| type | text | YES | CHECK: 'meeting', 'training', 'maintenance', 'holiday', 'announcement', 'other' |
| priority | text | YES | CHECK: 'low', 'medium', 'high' |
| recurrence_type | text | YES | CHECK: 'none', 'daily', 'weekly', 'monthly', 'yearly' |
| is_all_day | boolean | YES | |
| created_by | text | YES | |
| created_at | timestamp | YES | |
| updated_at | timestamp | YES | |

**RLS Status:** Enabled with SELECT/INSERT/UPDATE/DELETE policies

**Date Format (from audit):**
- All dates stored as DATE type (not timestamp)
- Format: YYYY-MM-DD (no time component)
- 28 events exist, all consistent format
- No NULL practice_id values

---

### practices

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key (values: 0, 1, 3, 4, 5) |
| name | text | NO | |
| address | text | YES | |
| phone | text | YES | |
| email | text | YES | |
| website | text | YES | |
| created_at | timestamp | YES | |
| updated_at | timestamp | YES | |

**Current Practices:** 5 practices exist (IDs: 0, 1, 3, 4, 5)

---

### users

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key (matches auth.uid()) |
| email | text | NO | |
| name | text | YES | |
| practice_id | text | YES | **Used by RLS function** |
| current_practice_id | text | YES | **Alternative column - may cause issues** |
| role | text | YES | |
| created_at | timestamp | YES | |
| updated_at | timestamp | YES | |

**User Statistics (from audit):**
| Metric | Value |
|--------|-------|
| auth.users count | 7 |
| users table count | 11 |
| practice_members count | 1 |

**Issue:** 4 orphaned records in users table (not in auth.users)

---

### practice_members

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| user_id | text | NO | References users.id |
| practice_id | text | NO | References practices.id |
| role | text | YES | |
| created_at | timestamp | YES | |

**Critical Finding:** Only 1 record exists! Most users not linked to practices.

---

### responsibilities (Zuständigkeiten)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| practice_id | text | NO | |
| name | text | NO | |
| description | text | YES | |
| group_name | text | YES | **API returns as `category`** |
| estimated_time_minutes | integer | YES | |
| estimated_time_period | text | YES | CHECK: 'Monat', 'Quartal', 'Jahr' |
| is_active | boolean | YES | Default true |

**Important Field Mapping:**
- Database: `group_name` → API returns: `category`
- Frontend expects `category` but database stores `group_name`

---

### todos (Todos)

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| practice_id | text | NOT NULL |
| status | text | CHECK: 'offen', 'in_bearbeitung', 'erledigt', 'abgebrochen' (GERMAN!) |
| priority | text | low/medium/high |

---

### workflows

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| practice_id | text | NOT NULL |
| category_id | text | NOT 'category'! |
| status | text | CHECK: 'draft', 'active', 'paused', 'completed', 'cancelled', 'archived' |

**Non-existent tables:**
- `workflow_steps` - DOES NOT EXIST
- `workflow_categories` - DOES NOT EXIST

---

### team_members

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| practice_id | text | NOT NULL |
| status | text | CHECK: 'active', 'inactive', 'on_leave' |
| is_active | boolean | Use this for filtering! |

**Filtering:** Use `.eq("is_active", true)` NOT `.eq("status", "active")`

---

### candidates (Hiring)

| Column | Type | Notes |
|--------|------|-------|
| status | text | No CHECK constraint - any string allowed |
| rating | integer | CHECK: 1-5 |

**Status values used in code:**
`new`, `contacted`, `first_interview`, `trial_work`, `second_interview`, `offer_extended`, `rejected`, `archived`

---

### employee_appraisals

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | gen_random_uuid() | UUID type, not text! |
| practice_id | TEXT | NO | - | |
| employee_id | TEXT | NO | - | NOT 'member_id' or 'team_member_id' |
| appraiser_id | TEXT | YES | - | |
| appraisal_type | TEXT | NO | 'annual' | |
| appraisal_date | DATE | NO | - | |
| scheduled_date | DATE | YES | - | |
| status | TEXT | NO | 'scheduled' | |
| overall_rating | INTEGER | YES | - | |
| performance_rating | INTEGER | YES | - | |
| potential_rating | INTEGER | YES | - | |
| strengths | TEXT | YES | - | |
| areas_for_improvement | TEXT | YES | - | |
| goals_set | TEXT | YES | - | |
| development_plan | TEXT | YES | - | |
| employee_comments | TEXT | YES | - | |
| manager_comments | TEXT | YES | - | |
| notes | JSONB | YES | '{}' | |
| attachments | JSONB | YES | '[]' | |
| created_at | TIMESTAMP | YES | now() | |
| updated_at | TIMESTAMP | YES | now() | |
| deleted_at | TIMESTAMP | YES | - | Soft delete |
| created_by | UUID | YES | - | UUID type! |
| updated_by | UUID | YES | - | UUID type! |

**Important Notes:**
- `id`, `created_by`, `updated_by` are UUID type (not text)
- Use `employee_id` (not `member_id` or `team_member_id`)
- Default status is 'scheduled', default appraisal_type is 'annual'

---

## RLS Policies & Security

### RLS Status Overview

| Table | RLS Enabled | Policy Count | Status |
|-------|-------------|--------------|--------|
| org_chart_positions | YES | 4 (CRUD) | OK |
| goals | YES | 4 (CRUD) | OK |
| calendar_events | YES | 4 (CRUD) | OK |
| practices | YES | 2 | OK |

### RLS Policy Pattern

All main tables use this pattern:
\`\`\`sql
(auth.role() = 'authenticated') AND (practice_id = get_user_practice_id())
\`\`\`

### CRITICAL: `get_user_practice_id()` Function

\`\`\`sql
DECLARE
  user_practice_id TEXT;
BEGIN
  -- First check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get practice_id from users table
  SELECT practice_id INTO user_practice_id
  FROM users
  WHERE id = auth.uid()::text;
  
  -- If not found in users, check practice_members
  IF user_practice_id IS NULL THEN
    SELECT practice_id INTO user_practice_id
    FROM practice_members
    WHERE user_id = auth.uid()::text
    LIMIT 1;
  END IF;
  
  RETURN user_practice_id;
END;
\`\`\`

### RLS Function Issue

**POTENTIAL BUG:** The function queries `users.practice_id` but some code references `users.current_practice_id`. If the column name is wrong, the function returns NULL for all users, blocking ALL access via RLS.

**Verification needed:** Check if `users` table has `practice_id` or `current_practice_id` column.

### User-Practice Linkage Statistics

| Metric | Value | Issue |
|--------|-------|-------|
| Total auth.users | 7 | - |
| Total users table | 11 | 4 orphaned records |
| Total practice_members | 1 | **Only 1 user linked!** |

**Impact:** If users don't have `practice_id` set in `users` table AND aren't in `practice_members`, RLS blocks ALL their access to practice-scoped tables.

### Orphan Records Check (from audit)

| Table | Orphan Count | Status |
|-------|--------------|--------|
| org_chart_positions | 0 | OK |
| goals | 0 | OK |
| calendar_events | 0 | OK |

---

## API Patterns

### createAdminClient() is ASYNC

**CRITICAL**: `createAdminClient()` returns a Promise and MUST be awaited:

\`\`\`typescript
// WRONG - causes "TypeError: i.from is not a function"
const supabase = createAdminClient()

// CORRECT
const supabase = await createAdminClient()
\`\`\`

### Authentication in API Routes

\`\`\`typescript
// CORRECT - For user-authenticated routes
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ... rest of route
}

// CORRECT - For admin/backend operations only
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  // First authenticate user
  const serverClient = await createServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  
  // Then use admin client for operations that bypass RLS
  const adminClient = await createAdminClient()
  // ... admin operations
}
\`\`\`

### Supabase Client Usage

\`\`\`typescript
// Server-side (in API routes)
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()

// Admin client (bypasses RLS)
import { createAdminClient } from "@/lib/supabase/server"
const supabase = await createAdminClient()

// Client-side
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()
\`\`\`

### Use .maybeSingle() for Optional Data

\`\`\`typescript
// WRONG - throws error if no row found
const { data } = await supabase.from("table").select().eq("id", id).single()

// CORRECT - returns null if no row
const { data } = await supabase.from("table").select().eq("id", id).maybeSingle()
\`\`\`

### API Response Format

Always return JSON, never plain text:
\`\`\`typescript
// Bad
return new Response("Error message")

// Good
return Response.json({ error: "Fehler aufgetreten" }, { status: 400 })
\`\`\`

---

## Component Patterns

### Server vs Client Split

Pages using auth hooks need this pattern:

\`\`\`tsx
// app/[page]/page.tsx (Server Component)
export const dynamic = "force-dynamic"
import { PageClient } from "./page-client"
export default function Page() {
  return <PageClient />
}
\`\`\`

### AppLayout Wrapper

All dashboard pages must be wrapped in AppLayout:

\`\`\`tsx
import AppLayout from "@/components/app-layout"

export default function PageClient() {
  return (
    <AppLayout>
      {/* page content */}
    </AppLayout>
  )
}
\`\`\`

### Next.js Router Import

**CRITICAL:** Always use App Router imports, not Pages Router:

\`\`\`typescript
// WRONG - Pages Router (causes hydration errors)
import { useRouter } from "next/router"

// CORRECT - App Router
import { useRouter } from "next/navigation"
\`\`\`

### Optimistic Updates Pattern (For Instant UI)

**Problem:** Users wait for server response before seeing UI changes (slow/laggy feel)

**Solution:** Update local state immediately, then sync with server

\`\`\`typescript
// BEFORE (Pessimistic - Slow)
const handleSave = async (data) => {
  await fetch('/api/save', { method: 'POST', body: JSON.stringify(data) })
  await fetchAllData()  // Wait for server before UI updates
}

// AFTER (Optimistic - Instant)
const handleSave = async (data) => {
  // 1. Save current state for rollback
  const previousState = items
  
  // 2. Update UI immediately with optimistic item
  const optimisticItem = { id: crypto.randomUUID(), ...data, isOptimistic: true }
  setItems([...items, optimisticItem])
  
  // 3. Close dialog/UI immediately
  setIsOpen(false)
  
  // 4. Sync with server in background
  try {
    const response = await fetch('/api/save', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    })
    const serverItem = await response.json()
    
    // 5. Replace optimistic item with real server data
    setItems(prev => prev.map(item => 
      item.id === optimisticItem.id ? serverItem : item
    ))
  } catch (error) {
    // 6. Rollback on error
    setItems(previousState)
    toast.error("Speichern fehlgeschlagen")
  }
}
\`\`\`

---

## Common Issues & Fixes

### "Column not found in schema cache"
- Code is using wrong column name
- Check this file for correct column names
- Common: `category` vs `goal_type`, `parent_id` vs `parent_goal_id`

### "TypeError: i.from is not a function"
- Missing `await` on `createAdminClient()`

### 401 Unauthorized on AI Routes
- Route is using `createAdminClient()` instead of `createServerClient()`
- Admin client cannot read session cookies
- **Fixed routes:** `/api/ai-analysis/chat`, `/api/ai-analysis/practice`, `/api/hiring/ai-analyze-candidates`, `/api/ai/analyze-kv-abrechnung`

### 401 Unauthorized during initial load
- Add fallback to adminClient when auth fails
- Session may not be established on first API call

### Page stuck loading
- Check if all API calls have proper timeout handling
- Use `Promise.allSettled` instead of `Promise.all`

### Data not appearing after save
- Check if API response maps database columns to frontend expected names
- Example: `group_name` → `category`

### Hydration Errors / Page Crashes
- Check for wrong router import: `next/router` vs `next/navigation`
- **Fixed components:** `competitor-analysis-management.tsx`

### RLS Blocking Access
- User may not have `practice_id` set in `users` table
- User may not be in `practice_members` table
- Check `get_user_practice_id()` function returns correct value

---

## Critical Bug Tracking

### Batch 1: Authentication & Infrastructure (COMPLETED)

| # | Issue | File | Status |
|---|-------|------|--------|
| 1.1 | Auth Pattern - AI Practice Analysis | `app/api/ai-analysis/practice/route.ts` | FIXED |
| 1.2 | Auth Pattern - Hiring AI Analyze | `app/api/hiring/ai-analyze-candidates/route.ts` | FIXED |
| 1.3 | Auth Pattern - KV Abrechnung | `app/api/ai/analyze-kv-abrechnung/route.ts` | FIXED |
| 1.4 | Wrong Router Import | `components/competitor-analysis/competitor-analysis-management.tsx` | FIXED |

### Batch 2: Context Race Conditions (SKIPPED - No issues found)

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 2.1 | Organigramm Race Condition | NO ISSUE | Already has proper guards |
| 2.2 | Goals Race Condition | NO ISSUE | Uses fetchedRef pattern |
| 2.3 | Calendar Race Condition | NO ISSUE | Combined loading state |

### Batch 3: Hiring Pipeline (COMPLETED)

| # | Issue | File | Status |
|---|-------|------|--------|
| 3.1 | Pipeline Drag-Drop | `components/hiring/hiring-pipeline.tsx` | FIXED |
| 3.2 | Neuer Kandidat UI Update | `components/hiring/create-candidate-dialog.tsx` | FIXED |
| 3.3 | Neue Stelle Feedback | `components/hiring/create-job-posting-dialog.tsx` | FIXED |

**Resolution Details:**
- **3.1**: Added `movingQueue` state to prevent concurrent drag-drop operations on the same card, disabled dragging during moves, added queue-based synchronization
- **3.2**: Added success state with green checkmark animation, 800ms delay before closing dialog, improved loading states with Loader2 icon
- **3.3**: Added success state with green checkmark animation, 800ms delay before closing dialog, improved loading states with Loader2 icon

### Batch 4: Data Persistence (PENDING)

| # | Issue | File | Status |
|---|-------|------|--------|
| 4.1 | Calendar Day View | `app/calendar/page-client.tsx` | PENDING |
| 4.2 | Goal Parameters | `components/goals/create-goal-dialog.tsx` | PENDING |
| 4.3 | Workflow Edit | `components/workflows/edit-workflow-dialog.tsx` | PENDING |

### Data Quality Issues (from audit)

| Table | Issue | Impact |
|-------|-------|--------|
| goals | 80% missing target_value | Goals incomplete |
| goals | 100% missing unit | Goals incomplete |
| practice_members | Only 1 record | RLS may block users |
| users | 4 orphaned records | Data inconsistency |

---

## Diagnostic Info

### Dienstplan Loading Issues

The dienstplan page requires **shift_types** to be defined before it can load.

**Required for dienstplan:**
1. Shift types (minimum 3-5 recommended)
2. Team members linked to practice

**Diagnostic SQL:**
\`\`\`sql
SELECT COUNT(*) FROM shift_types WHERE practice_id = 'YOUR_PRACTICE_ID';
\`\`\`

### Practice IDs Reference

- Practice 1: "Praxis Dr. Mauch - ID 1" (main test practice)
- Practice 0, 5: May have missing data

### RLS Diagnostic Script

\`\`\`sql
-- Check if user has practice access
SELECT 
  u.id,
  u.email,
  u.practice_id,
  pm.practice_id as member_practice
FROM users u
LEFT JOIN practice_members pm ON pm.user_id = u.id
WHERE u.id = 'USER_ID_HERE';

-- Test get_user_practice_id() function
SELECT get_user_practice_id();
\`\`\`

---

## Notes

- All German status/type values in CHECK constraints must be used exactly as specified
- Always validate practice_id before database operations
- Use soft deletes with `deleted_at` timestamp, never hard delete
- When using `createAdminClient()`, always authenticate user first with `createServerClient()`
