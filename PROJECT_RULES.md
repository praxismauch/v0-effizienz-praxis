# Effizienz Praxis - Project Rules & Database Schema Reference

**This is the single source of truth for all project rules and database schema documentation.**
**Always check this file before making changes to ensure compliance with database schema and coding patterns.**

---

## Table of Contents
1. [Core Principles](#core-principles)
2. [Database Schema Reference](#database-schema-reference)
3. [API Patterns](#api-patterns)
4. [Component Patterns](#component-patterns)
5. [Common Issues & Fixes](#common-issues--fixes)
6. [Diagnostic Info](#diagnostic-info)

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

### goals (Ziele)

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| practice_id | text | NOT NULL |
| goal_type | text | NOT 'category'! |
| parent_goal_id | text | NOT 'parent_id'! |
| progress_percentage | integer | NOT 'progress'! |
| end_date | date | NOT 'due_date'! |
| status | text | CHECK: 'not-started', 'in-progress', 'completed', 'cancelled' |
| priority | text | CHECK: 'low', 'medium', 'high' |

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

### time_stamps

| Column | Type | Notes |
|--------|------|-------|
| user_id | text | NOT NULL, NOT 'team_member_id' |
| practice_id | text | NOT NULL |
| stamp_type | text | CHECK: 'start', 'stop', 'pause_start', 'pause_end' |
| location_type | text | CHECK: 'office', 'homeoffice', 'mobile' |
| timestamp | timestamp | NOT 'created_at' |
| notes | text | NOT 'comment' |

---

### time_blocks

| Column | Type | Notes |
|--------|------|-------|
| user_id | text | NOT NULL |
| practice_id | text | NOT NULL |
| location_type | text | CHECK: 'office', 'homeoffice', 'mobile' |
| status | text | CHECK: 'active', 'completed', 'corrected', 'deleted' |

---

### calendar_events

| Column | Type | Notes |
|--------|------|-------|
| type | text | CHECK: 'meeting', 'training', 'maintenance', 'holiday', 'announcement', 'other' |
| priority | text | CHECK: 'low', 'medium', 'high' |
| recurrence_type | text | CHECK: 'none', 'daily', 'weekly', 'monthly', 'yearly' |

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

## API Patterns

### createAdminClient() is ASYNC

**CRITICAL**: `createAdminClient()` returns a Promise and MUST be awaited:

```typescript
// WRONG - causes "TypeError: i.from is not a function"
const supabase = createAdminClient()

// CORRECT
const supabase = await createAdminClient()
```

### Supabase Client Usage

```typescript
// Server-side (in API routes)
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()

// Admin client (bypasses RLS)
import { createAdminClient } from "@/lib/supabase/server"
const supabase = await createAdminClient()

// Client-side
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()
```

### Use .maybeSingle() for Optional Data

```typescript
// WRONG - throws error if no row found
const { data } = await supabase.from("table").select().eq("id", id).single()

// CORRECT - returns null if no row
const { data } = await supabase.from("table").select().eq("id", id).maybeSingle()
```

### API Response Format

Always return JSON, never plain text:
```typescript
// Bad
return new Response("Error message")

// Good
return Response.json({ error: "Fehler aufgetreten" }, { status: 400 })
```

---

## Component Patterns

### Server vs Client Split

Pages using auth hooks need this pattern:

```tsx
// app/[page]/page.tsx (Server Component)
export const dynamic = "force-dynamic"
import { PageClient } from "./page-client"
export default function Page() {
  return <PageClient />
}
```

### AppLayout Wrapper

All dashboard pages must be wrapped in AppLayout:

```tsx
import AppLayout from "@/components/app-layout"

export default function PageClient() {
  return (
    <AppLayout>
      {/* page content */}
    </AppLayout>
  )
}
```

### Optimistic Updates Pattern (For Instant UI)

**Problem:** Users wait for server response before seeing UI changes (slow/laggy feel)

**Solution:** Update local state immediately, then sync with server

```typescript
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
```

**When to Use:**
- High-frequency actions: todos check/uncheck, drag & drop
- User-facing CRUD: create, update, delete with immediate feedback
- Reordering operations: visual changes need instant response

**When NOT to Use:**
- Critical operations requiring server validation first
- Actions with complex side effects
- Operations where rollback would be confusing to user

**Pages Implemented:**
- ✅ Responsibilities: Optimistic save and delete
- ⏳ Todos: Pending implementation
- ⏳ Goals: Pending implementation
- ⏳ Hiring Pipeline: Pending implementation

### Responsibilities-Specific Patterns

**Database → API → Frontend Mapping:**
```
Database: group_name (text)
    ↓
API: Maps to → category: resp.group_name
    ↓
Frontend: Uses → responsibility.category
```

**Why this mapping exists:**
- Database column is `group_name` (historical naming)
- Frontend/UI always referred to it as "category"
- API bridges the gap by transforming the response

**Component Checklist:**
- ✅ Use `responsibility.category || responsibility.group_name` (for safety)
- ✅ API routes map `group_name` → `category` in responses
- ✅ Send `group_name: data.category` in POST/PUT bodies

---

## Common Issues & Fixes

### "Column not found in schema cache"
- Code is using wrong column name
- Check this file for correct column names
- Common: `category` vs `goal_type`, `parent_id` vs `parent_goal_id`

### "TypeError: i.from is not a function"
- Missing `await` on `createAdminClient()`

### 401 Unauthorized during initial load
- Add fallback to adminClient when auth fails
- Session may not be established on first API call

### Page stuck loading
- Check if all API calls have proper timeout handling
- Use `Promise.allSettled` instead of `Promise.all`

### Data not appearing after save
- Check if API response maps database columns to frontend expected names
- Example: `group_name` → `category`

---

## Diagnostic Info

### Dienstplan Loading Issues

The dienstplan page requires **shift_types** to be defined before it can load.

**Required for dienstplan:**
1. Shift types (minimum 3-5 recommended)
2. Team members linked to practice

**Diagnostic SQL:**
```sql
SELECT COUNT(*) FROM shift_types WHERE practice_id = 'YOUR_PRACTICE_ID';
```

### Practice IDs Reference

- Practice 1: "Praxis Dr. Mauch - ID 1" (main test practice)
- Practice 0, 5: May have missing data

---

## Notes

- All German status/type values in CHECK constraints must be used exactly as specified
- Always validate practice_id before database operations
- Use soft deletes with `deleted_at` timestamp, never hard delete
