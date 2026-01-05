# Rate Limiting Protection

## Problem
When Supabase's rate limit is exceeded, it returns "Too Many Requests" as plain text instead of JSON. The Supabase client tries to parse this as JSON, causing `SyntaxError: Unexpected token 'T', "Too Many R"... is not valid JSON` errors that crash API routes.

## Solution
Use the `safeSupabaseQuery` utility function from `lib/supabase/safe-query.ts` to wrap all Supabase queries.

## Usage

### Single Query
\`\`\`typescript
import { safeSupabaseQuery } from '@/lib/supabase/safe-query'

const { data, error } = await safeSupabaseQuery(
  () => supabase.from('table_name').select('*'),
  [] // fallback value when rate limited
)
\`\`\`

### Multiple Queries
\`\`\`typescript
import { safeSupabaseQueries } from '@/lib/supabase/safe-query'

const results = await safeSupabaseQueries(
  {
    users: () => supabase.from('users').select('*'),
    posts: () => supabase.from('posts').select('*')
  },
  {
    users: [],
    posts: []
  }
)
\`\`\`

## Migration Status

### Routes with Protection ✅
- app/api/hiring/candidates/route.ts
- app/api/practices/[practiceId]/documents/route.ts
- app/api/practices/[practiceId]/google-reviews-config/route.ts
- app/api/practices/[practiceId]/responsibilities/route.ts

### Routes Needing Protection ⚠️
**All other API routes with Supabase queries** (~100+ routes)

## Next Steps
1. Import the utility in API routes that make Supabase queries
2. Wrap queries with `safeSupabaseQuery` or `safeSupabaseQueries`
3. Provide appropriate fallback values (usually empty arrays or null)
4. Test during rate limiting scenarios
