# Project Rules & Guidelines

## Authentication

### Supabase SSR Authentication Flow

The `/api/auth/login` route MUST use `createServerClient` from `@supabase/ssr` (not the admin client) and let Supabase SSR manage cookies.

**Authentication Flow:**
1. Browser → calls `/api/auth/login`
2. Route → performs `signInWithPassword`, sets Supabase cookies via SSR helpers
3. Any server route using `createServerClient().auth.getUser()` will have access to the authenticated session

**Implementation Requirements:**
- ALWAYS use `createServerClient` from `@supabase/ssr` for authentication
- NEVER use the admin client (`createClient` with service role key) for user authentication
- Let Supabase SSR manage cookies automatically via `getAll()` and `setAll()` cookie handlers
- The cookie management ensures session persistence across server-side requests

**Example Pattern:**
\`\`\`typescript
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const cookieStore = await cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  }
)

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
\`\`\`

## Date & Time Formatting

- Use German date/time format (DD.MM.YYYY, HH:MM)
- Example: `01.12.2025, 14:30`

## UUID & ID Handling

- Always validate UUIDs before database operations
- Reduce errors from empty UUIDs or practice IDs
- Never pass empty strings or `0` as IDs to database queries
