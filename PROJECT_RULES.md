# Effizienz Praxis - Code Generation Rules

Rules for v0/AI when generating code for this project.

---

## Core Principles

**Follow these rules strictly.** If a rule cannot be followed, explain why before writing code.

- **Do not take shortcuts** - Always implement the complete, correct solution
- **Prefer clarity over cleverness** - Code should be easy to read and understand
- **Prefer safety over speed** - Validate inputs, handle errors, protect data
- **Prefer maintainability over brevity** - Future developers must understand the code

---

## Must-Follow Rules

### German Date/Time Format
- Always use DD.MM.YYYY and HH:mm format
- Use `date-fns` with German locale: `format(date, "dd.MM.yyyy", { locale: de })`

### UUID & ID Validation
- Never allow empty UUIDs - validate before all database operations
- Never allow practice_id = 0 or empty - validate in all mutations

### German Language
- All user-facing text must be in German
- Common translations: Save=Speichern, Cancel=Abbrechen, Delete=Löschen, Edit=Bearbeiten

### Async/Await
- Use async/await exclusively - no mixing callbacks and `.then()`
- Handle all errors explicitly - no unhandled promise rejections
- Never block the event loop - no sync I/O in request handlers

---

## Component Patterns

### Server vs Client Split (to avoid build errors)
Pages using auth hooks (`useUser`, `useTeam`, `usePractice`) need this pattern:

```tsx
// app/[page]/page.tsx (Server Component)
export const dynamic = "force-dynamic"
import { PageClient } from "@/components/page-client"
export default function Page() {
  return <PageClient />
}
```

### Icon Serialization
Pass icon names as strings, resolve in client component:
- Bad: `icon: Brain` (component)
- Good: `iconName: "Brain"` (string)

### Public Routes
Pages in PUBLIC_ROUTES cannot use `useUser()`, `useTeam()`, `usePractice()` hooks.
Keep `providers.tsx` and `proxy.ts` PUBLIC_ROUTES in sync.

---

## Database Patterns

### Supabase Client Usage
```tsx
// Server-side
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()

// Client-side  
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()
```

### Snake_Case Field Names
Database uses snake_case. Always access fields correctly:
- `user.first_name` (not `firstName`)
- `user.practice_id` (not `practiceId`)
- `record.created_at` (not `createdAt`)

### Safe Query Utilities
Use `safeSupabaseQuery` from `lib/supabase/safe-query.ts` to handle rate limiting:
```tsx
import { safeSupabaseQuery } from "@/lib/supabase/safe-query"
const { data, error } = await safeSupabaseQuery(
  () => supabase.from("table").select("*"),
  [] // fallback
)
```

---

## API Response Format

API routes must always return JSON, never plain text:
```tsx
// Bad
return new Response("Error message")

// Good
return Response.json({ error: "Fehler aufgetreten" }, { status: 400 })
```

---

## Error Handling

### Every Error Must Be Caught
- Use try/catch around async operations
- Never send raw errors to client - sanitize messages
- Log full details server-side, show safe message to client

```tsx
try {
  await doSomething()
} catch (error) {
  console.error("[API Error]:", error)
  return Response.json({ error: "Ein Fehler ist aufgetreten" }, { status: 500 })
}
```

---

## Data Protection

### Never Delete User Data from Production
- Use soft deletes with `deleted_at` timestamp
- Always add confirmation dialogs for delete actions
- Never edit executed migration scripts

```tsx
// Bad - hard delete
await supabase.from("users").delete().eq("id", userId)

// Good - soft delete
await supabase.from("users").update({ deleted_at: new Date().toISOString() }).eq("id", userId)
```

---

## Architecture & Dependencies

### Never Expose DB Entities Directly
Map to DTOs, hide sensitive fields

### No Hard-Coded Dependencies
Pass dependencies as parameters (dependency injection)

### No Global Variables for App State
DB, cache, email = explicit dependencies

---

## TypeScript & Code Quality

### Strict TypeScript
- No `any`, no implicit `any`, no unsafe casts
- Explicit types at boundaries (APIs, services, DTOs)

### Code Organization
- One responsibility per function/file
- Split functions over ~50 lines
- Avoid deep nesting - return early
- Use descriptive names - no abbreviations

### Feature-Based Folder Structure
Organize by domain (users, teams), not technical layers

### Thin Controllers
API routes only: validate input, call services, return responses

---

## Logging Rules

- No console.log in production - use structured logging
- Always include context: requestId, userId, action

---

## Webpack / Bundling

### No webpack.fallback Blocks
Never use webpack config with many false entries:
```js
// Bad - causes issues with Next.js 16+
webpack: (config) => {
  config.resolve.fallback = {
    fs: false, path: false, crypto: false, // etc.
  }
}
```
Instead: use server components, API routes, or dynamic imports.

---

## Next.js Configuration

### Never Suppress Build Errors
```js
// Bad
eslint: { ignoreDuringBuilds: true }
typescript: { ignoreBuildErrors: true }
```

### Server-Only Packages
Use `server-only` package for server-only code:
```tsx
import "server-only"
```

---

## Tailwind CSS v4

Use `@theme inline` syntax in globals.css:
```css
@theme inline {
  --font-sans: 'Geist', sans-serif;
}
```

---

## Component Organization

### Naming
- Files: kebab-case (`team-member-card.tsx`)
- Components: PascalCase (`TeamMemberCard`)
- Hooks: camelCase with use prefix (`useTeamMembers`)

### No Nested Ternaries
```tsx
// Bad
{a ? (b ? <X/> : <Y/>) : <Z/>}

// Good - use early returns or separate logic
```

### Avoid Magic Strings
```tsx
// Bad
if (role === "owner") { ... }

// Good
const ROLES = { OWNER: "owner", ADMIN: "admin" } as const
if (role === ROLES.OWNER) { ... }
```

---

## File Naming

- Files: kebab-case (`team-member-card.tsx`)
- Components: PascalCase (`TeamMemberCard`)
- Hooks: camelCase with use prefix (`useTeamMembers`)

---

## AI SDK (v3.x)

```tsx
// Client component
import { useChat } from "ai/react"
const { messages, input, handleSubmit } = useChat({ api: "/api/chat" })

// API route - use Vercel AI Gateway
import { streamText } from "ai"
const result = streamText({
  model: "openai/gpt-4o-mini",
  messages,
})
return result.toUIMessageStreamResponse()
```

---

## Styling Rules

### Use Design Tokens
- Use `bg-background`, `text-foreground`, `text-muted-foreground`
- Never use raw colors like `bg-white`, `text-black`

### Use Spacing Scale
- Use `p-4`, `gap-6`, `mx-2` (not arbitrary values)

### Mobile-First
- Start with mobile styles, add responsive prefixes: `md:`, `lg:`

---

## Database Schema Reference (Core Features)

### 1. responsibilities (Zuständigkeiten)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| practice_id | text | NO | FK -> practices.id |
| name | text | NO | |
| description | text | YES | |
| group_name | text | YES | Category grouping |
| responsible_user_id | text | YES | FK -> users.id |
| deputy_user_id | text | YES | FK -> users.id |
| team_member_ids | jsonb | YES | Array of team member IDs |
| is_active | boolean | YES | Default true |
| suggested_hours_per_week | numeric | YES | |
| estimated_time_amount | numeric | YES | |
| estimated_time_period | text | YES | |
| assigned_to | uuid | YES | |
| status | varchar | YES | |
| deleted_at | timestamptz | YES | Soft delete |

**API Routes:**
- `GET/POST /api/practices/[practiceId]/responsibilities`
- `GET/PUT/DELETE /api/practices/[practiceId]/responsibilities/[id]`
- `GET/POST /api/practices/[practiceId]/responsibilities/[id]/todos`
- `POST /api/practices/[practiceId]/responsibilities/upload-file`

---

### 2. team_members (Team)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| user_id | text | YES | FK -> users.id (NULL = no login) |
| practice_id | text | NO | FK -> practices.id |
| role | text | NO | user/admin/owner |
| department | text | YES | |
| status | text | YES | active/inactive |
| joined_date | date | YES | |
| candidate_id | text | YES | FK -> candidates.id |
| first_name | text | YES | |
| last_name | text | YES | |
| email | varchar | YES | |
| is_active | boolean | YES | |
| deleted_at | timestamptz | YES | Soft delete |

**WICHTIG:** 
- `user_id` ist NULLABLE - Team Members ohne user_id haben keinen Login-Zugang
- Practice 1 hat 39 Members, davon nur 10 mit user_id
- Team-Zuweisung erfordert user_id (team_assignments.user_id ist NOT NULL)

**API Routes:**
- `GET/POST/PUT /api/practices/[practiceId]/team-members`
- `GET/PUT/DELETE /api/practices/[practiceId]/team-members/[memberId]`
- `POST /api/practices/[practiceId]/team-members/[memberId]/assign`
- `POST /api/practices/[practiceId]/team-members/[memberId]/unassign`

---

### 3. teams (Teamgruppen)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| name | text | NO | |
| description | text | YES | |
| color | text | YES | Hex color code |
| practice_id | text | NO | FK -> practices.id |
| is_active | boolean | YES | |
| is_default | boolean | YES | |
| sort_order | integer | YES | |
| practiceid | text | YES | DUPLICATE - do not use |
| deleted_at | timestamptz | YES | Soft delete |

**WICHTIG:** Spalte `practiceid` ist ein Duplikat - immer `practice_id` verwenden!

**API Routes:**
- `GET/POST /api/practices/[practiceId]/teams`
- `GET/PUT/DELETE /api/practices/[practiceId]/teams/[teamId]`

---

### 4. team_assignments (Team-Zuweisungen)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| team_id | text | NO | FK -> teams.id |
| user_id | text | NO | FK -> users.id (NOT team_members.id!) |
| practice_id | text | YES | |
| practiceid | text | YES | DUPLICATE - do not use |
| assigned_at | timestamp | YES | |

**KRITISCH:** 
- `user_id` referenziert `users.id`, NICHT `team_members.id`!
- Team Members ohne `user_id` können NICHT zu Teams zugewiesen werden
- Beim Zuweisen: Erst `team_members.user_id` holen, dann für team_assignments verwenden

---

### 5. todos (Todos)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| practice_id | text | NO | FK -> practices.id |
| title | text | NO | |
| description | text | YES | |
| status | text | YES | offen/in_bearbeitung/erledigt |
| priority | text | YES | low/medium/high |
| due_date | date | YES | |
| assigned_to | text | YES | |
| assigned_user_ids | jsonb | YES | Array of user IDs |
| assigned_team_ids | jsonb | YES | Array of team IDs |
| completed | boolean | YES | |
| responsibility_id | text | YES | FK -> responsibilities.id |
| orga_category_id | uuid | YES | FK -> orga_categories.id |
| recurrence_type | text | NO | none/daily/weekly/monthly |
| recurring | boolean | YES | |
| parent_todo_id | text | YES | FK -> todos.id (self-reference) |
| created_by | text | YES | FK -> users.id |
| practiceid | text | YES | DUPLICATE - do not use |
| deleted_at | timestamptz | YES | Soft delete |

**Status Values:** `offen`, `in_bearbeitung`, `erledigt`

**API Routes:**
- `GET/POST /api/practices/[practiceId]/todos`
- `GET/PUT/PATCH/DELETE /api/practices/[practiceId]/todos/[todoId]`
- `POST /api/practices/[practiceId]/todos/bulk-update`

---

### 6. goals (Ziele)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| practice_id | text | NO | FK -> practices.id |
| created_by | text | NO | FK -> users.id |
| assigned_to | text | YES | |
| parent_goal_id | text | YES | FK -> goals.id (self-reference) |
| title | text | NO | |
| description | text | YES | |
| goal_type | text | NO | |
| target_value | numeric | YES | |
| current_value | numeric | YES | |
| unit | text | YES | |
| progress_percentage | integer | YES | 0-100 |
| status | text | YES | not-started/in-progress/completed |
| priority | text | YES | low/medium/high |
| start_date | date | YES | |
| end_date | date | YES | |
| display_order | integer | YES | |
| linked_parameter_id | text | YES | FK -> analytics_parameters.id |
| show_on_dashboard | boolean | YES | |
| practiceid | text | YES | DUPLICATE - do not use |
| deleted_at | timestamptz | YES | Soft delete |

**Status Values:** `not-started`, `in-progress`, `completed`

**API Routes:**
- `GET/POST /api/practices/[practiceId]/goals`
- `GET/PUT/DELETE /api/practices/[practiceId]/goals/[goalId]`
- `GET/POST/DELETE /api/practices/[practiceId]/goals/[goalId]/assignments`
- `GET/POST /api/practices/[practiceId]/goals/[goalId]/attachments`
- `DELETE /api/practices/[practiceId]/goals/[goalId]/attachments/[id]`
- `POST /api/practices/[practiceId]/goals/reorder`

---

### 7. arbeitsplaetze (Arbeitsplätze)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| practice_id | text | NO | FK -> practices.id |
| name | text | NO | |
| beschreibung | text | YES | German: description |
| raum_id | text | YES | Room reference |
| is_active | boolean | YES | |
| created_by | text | YES | |
| deleted_at | timestamptz | YES | Soft delete |

**WICHTIG:** Spalte heißt `beschreibung` (Deutsch), nicht `description`!

**API Routes:**
- `GET/POST /api/practices/[practiceId]/arbeitsplaetze`
- `GET/PUT/DELETE /api/practices/[practiceId]/arbeitsplaetze/[id]`

---

### 8. skill_definitions (Skills/Kompetenzen)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | text | NO | Primary key |
| practice_id | text | NO | FK -> practices.id |
| name | text | NO | |
| category | text | YES | administrative/communication/leadership/emergency/other |
| description | text | YES | |
| level_0_description | text | YES | |
| level_1_description | text | YES | |
| level_2_description | text | YES | |
| level_3_description | text | YES | |
| is_active | boolean | YES | |
| display_order | integer | YES | |
| team_id | text | YES | FK -> teams.id |
| deleted_at | timestamptz | YES | Soft delete |

**Categories:** `administrative`, `communication`, `leadership`, `emergency`, `other`

**API Routes:**
- `GET/POST /api/practices/[practiceId]/skills`
- `GET/PUT/DELETE /api/practices/[practiceId]/skills/[skillId]`
- `POST /api/practices/[practiceId]/skills/generate`

---

### 9. team_member_skills (Member-Skill-Zuweisungen)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | Primary key |
| practice_id | text | NO | |
| team_member_id | text | NO | FK -> team_members.id |
| skill_id | text | NO | FK -> skill_definitions.id |
| current_level | integer | YES | 0-3 |
| target_level | integer | YES | 0-3 |
| assessed_at | timestamp | YES | |
| deleted_at | timestamptz | YES | Soft delete |

**API Routes:**
- `GET/POST/PUT /api/practices/[practiceId]/team-members/[memberId]/skills`

---

### 10. employee_appraisals (Mitarbeitergespräche)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | Primary key (UUID, nicht text!) |
| practice_id | text | NO | |
| employee_id | text | NO | FK -> team_members.id |
| appraiser_id | text | YES | FK -> team_members.id |
| appraisal_type | text | NO | annual/probation/feedback/goal-setting |
| appraisal_date | date | NO | |
| scheduled_date | date | YES | |
| status | text | NO | scheduled/in-progress/completed/cancelled |
| overall_rating | integer | YES | 1-5 |
| performance_rating | integer | YES | 1-5 |
| potential_rating | integer | YES | 1-5 |
| strengths | text | YES | |
| areas_for_improvement | text | YES | |
| goals_set | text | YES | |
| development_plan | text | YES | |
| employee_comments | text | YES | |
| manager_comments | text | YES | |
| notes | jsonb | YES | |
| attachments | jsonb | YES | |
| deleted_at | timestamptz | YES | Soft delete |

**WICHTIG:** ID ist `uuid` Typ, nicht `text`!

**Status Values:** `scheduled`, `in-progress`, `completed`, `cancelled`
**Appraisal Types:** `annual`, `probation`, `feedback`, `goal-setting`

**API Routes:**
- `GET /api/practices/[practiceId]/appraisals`
- `GET/PUT/DELETE /api/practices/[practiceId]/appraisals/[appraisalId]`
- `GET/POST /api/practices/[practiceId]/team-members/[memberId]/appraisals`

---

## Foreign Key Relationships

```
responsibilities.practice_id -> practices.id
team_members.practice_id -> practices.id
team_members.candidate_id -> candidates.id
teams.practice_id -> practices.id
teams.skill_definitions.team_id -> teams.id
team_assignments.team_id -> teams.id
team_assignments.user_id -> users.id (NOT team_members!)
todos.practice_id -> practices.id
todos.created_by -> users.id
todos.orga_category_id -> orga_categories.id
todos.parent_todo_id -> todos.id
goals.practice_id -> practices.id
goals.parent_goal_id -> goals.id
goals.linked_parameter_id -> analytics_parameters.id
arbeitsplaetze.practice_id -> practices.id
skill_definitions.practice_id -> practices.id
skill_definitions.team_id -> teams.id
employee_appraisals.employee_id -> team_members.id
employee_appraisals.appraiser_id -> team_members.id
```

---

## Duplicate Column Warning

The following tables have DUPLICATE columns - always use `practice_id`:

| Table | Duplicate Column | Use Instead |
|-------|------------------|-------------|
| teams | practiceid | practice_id |
| team_assignments | practiceid | practice_id |
| todos | practiceid | practice_id |
| goals | practiceid | practice_id |

**NEVER query or update the `practiceid` column!**

---

## RLS Policies Summary

All core tables have RLS policies for SELECT, INSERT, UPDATE, DELETE:
- `arbeitsplaetze_*` 
- `employee_appraisals` (manager-based)
- `goals_*`
- `responsibilities_*`
- `skill_definitions` (practice1_all)
- `team_assignments_*`
- `team_members_*` + superadmin variants
- `teams_*` + superadmin variants
- `todos_*`

**Note:** `temp_allow_all_*` policies exist for debugging - these are permissive and should be removed in production.
