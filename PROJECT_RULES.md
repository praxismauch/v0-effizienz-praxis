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

\`\`\`tsx
// app/[page]/page.tsx (Server Component)
export const dynamic = "force-dynamic"
import { PageClient } from "@/components/page-client"
export default function Page() {
  return <PageClient />
}
\`\`\`

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
\`\`\`tsx
// Server-side
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()

// Client-side  
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()
\`\`\`

### Snake_Case Field Names
Database uses snake_case. Always access fields correctly:
- `user.first_name` (not `firstName`)
- `user.practice_id` (not `practiceId`)
- `record.created_at` (not `createdAt`)

### Safe Query Utilities
Use `safeSupabaseQuery` from `lib/supabase/safe-query.ts` to handle rate limiting:
\`\`\`tsx
import { safeSupabaseQuery } from "@/lib/supabase/safe-query"
const { data, error } = await safeSupabaseQuery(
  () => supabase.from("table").select("*"),
  [] // fallback
)
\`\`\`

---

## API Response Format

API routes must always return JSON, never plain text:
\`\`\`tsx
// Bad
return new Response("Error message")

// Good
return Response.json({ error: "Fehler aufgetreten" }, { status: 400 })
\`\`\`

---

## Error Handling

### Every Error Must Be Caught
- Use try/catch around async operations
- Never send raw errors to client - sanitize messages
- Log full details server-side, show safe message to client

\`\`\`tsx
try {
  await doSomething()
} catch (error) {
  console.error("[API Error]:", error)
  return Response.json({ error: "Ein Fehler ist aufgetreten" }, { status: 500 })
}
\`\`\`

---

## Data Protection

### Never Delete User Data from Production
- Use soft deletes with `deleted_at` timestamp
- Always add confirmation dialogs for delete actions
- Never edit executed migration scripts

\`\`\`tsx
// Bad - hard delete
await supabase.from("users").delete().eq("id", userId)

// Good - soft delete
await supabase.from("users").update({ deleted_at: new Date().toISOString() }).eq("id", userId)
\`\`\`

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
\`\`\`js
// Bad - causes issues with Next.js 16+
webpack: (config) => {
  config.resolve.fallback = {
    fs: false, path: false, crypto: false, // etc.
  }
}
\`\`\`
Instead: use server components, API routes, or dynamic imports.

---

## Next.js Configuration

### Never Suppress Build Errors
\`\`\`js
// Bad
eslint: { ignoreDuringBuilds: true }
typescript: { ignoreBuildErrors: true }
\`\`\`

### Server-Only Packages
Use `server-only` package for server-only code:
\`\`\`tsx
import "server-only"
\`\`\`

---

## Tailwind CSS v4

Use `@theme inline` syntax in globals.css:
\`\`\`css
@theme inline {
  --font-sans: 'Geist', sans-serif;
}
\`\`\`

---

## Component Organization

### Naming
- Files: kebab-case (`team-member-card.tsx`)
- Components: PascalCase (`TeamMemberCard`)
- Hooks: camelCase with use prefix (`useTeamMembers`)

### No Nested Ternaries
\`\`\`tsx
// Bad
{a ? (b ? <X/> : <Y/>) : <Z/>}

// Good - use early returns or separate logic
\`\`\`

### Avoid Magic Strings
\`\`\`tsx
// Bad
if (role === "owner") { ... }

// Good
const ROLES = { OWNER: "owner", ADMIN: "admin" } as const
if (role === ROLES.OWNER) { ... }
\`\`\`

---

## File Naming

- Files: kebab-case (`team-member-card.tsx`)
- Components: PascalCase (`TeamMemberCard`)
- Hooks: camelCase with use prefix (`useTeamMembers`)

---

## AI SDK (v3.x)

\`\`\`tsx
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
\`\`\`

---

## Styling Rules

### Use Design Tokens
- Use `bg-background`, `text-foreground`, `text-muted-foreground`
- Never use raw colors like `bg-white`, `text-black`

### Use Spacing Scale
- Use `p-4`, `gap-6`, `mx-2` (not arbitrary values)

### Mobile-First
- Start with mobile styles, add responsive prefixes: `md:`, `lg:`
