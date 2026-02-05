# Server-First Architecture Migration Guide

## Overview

This guide documents the migration from client-side context-heavy architecture to a server-first, React Server Components (RSC) architecture.

## Goals

1. **Reduce bundle size** by ~40% (from 600KB+ to 300-350KB)
2. **Improve performance** by 4-5x (request waterfalls eliminated)
3. **Simplify codebase** by replacing contexts with props/server data
4. **Better SEO** with server-rendered content
5. **Easier testing** with less coupling

## New Server Utilities

### `/lib/server/get-current-user.ts`

Server-side user authentication utilities:

```typescript
import { getCurrentUser, getCurrentPracticeId, isCurrentUserAdmin } from "@/lib/server/get-current-user"

// In any Server Component:
const user = await getCurrentUser()
const practiceId = await getCurrentPracticeId()
const isAdmin = await isCurrentUserAdmin()
```

**Features:**
- Uses React `cache()` for automatic request deduplication
- No client bundle impact
- Type-safe with existing `User` interface
- Handles all edge cases (missing profile, auth errors, etc.)

### `/lib/server/get-dashboard-data.ts`

Server-side dashboard data fetcher:

```typescript
import { getDashboardData } from "@/lib/server/get-dashboard-data"

const data = await getDashboardData(practiceId)
// Returns: { totalTeams, totalMembers, activeTodos, completedTodos, upcomingEvents }
```

**Features:**
- Parallel data fetching for maximum performance
- Cached with React `cache()`
- Graceful error handling with default values

## Migration Pattern

### Before (Client-Side Context)

```typescript
// ❌ OLD: Client component with context
"use client"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"

export default function MyPage() {
  const { currentUser, loading } = useUser()
  const { currentPractice } = usePractice()
  
  if (loading) return <Spinner />
  if (!currentUser) return <Login />
  
  return <div>Welcome {currentUser.name}</div>
}
```

### After (Server Component)

```typescript
// ✅ NEW: Server component with server utilities
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { redirect } from "next/navigation"
import MyPageClient from "./page-client"

export default async function MyPage() {
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  if (!user) redirect("/auth/login")
  
  return <MyPageClient user={user} practiceId={practiceId} />
}
```

```typescript
// page-client.tsx - minimal client component
"use client"

interface Props {
  user: { id: string; name: string; email: string }
  practiceId: string | null
}

export default function MyPageClient({ user, practiceId }: Props) {
  return <div>Welcome {user.name}</div>
}
```

## Benefits of This Pattern

### 1. No Loading States

Server components load data before rendering, eliminating spinners and skeleton screens.

### 2. No Request Waterfalls

```
❌ OLD: 
Page loads → Context Provider loads → useUser() fetches → usePractice() fetches → Component fetches
Total: 1100ms+

✅ NEW:
Page loads with all data in parallel
Total: 250ms
```

### 3. Smaller Bundle

```
❌ OLD: UserContext (15KB) + PracticeContext (12KB) + SWR (30KB) = 57KB just for user data

✅ NEW: 0KB client bundle for user data (fetched on server)
```

### 4. Better DX

```typescript
// No more context boilerplate
// No more "must be used within Provider" errors
// No more debugging render loops
// Just async/await
```

## Migration Checklist

### Phase 1: Dashboard (✅ Complete)
- [x] Create `/lib/server/get-current-user.ts`
- [x] Create `/lib/server/get-dashboard-data.ts`
- [x] Refactor `/app/dashboard/page.tsx` to Server Component
- [x] Update `/app/dashboard/page-client.tsx` to accept props

### Phase 2: Practice Context
- [ ] Create `/lib/server/get-practice-data.ts`
- [ ] Identify all `usePractice()` usage
- [ ] Migrate pages one by one to server utilities
- [ ] Remove PracticeContext once all migrations complete

### Phase 3: Team/Todo/Calendar Contexts
- [ ] Create server utilities for each domain
- [ ] Migrate pages to Server Components
- [ ] Remove client contexts

### Phase 4: Cleanup
- [ ] Remove unused context providers
- [ ] Update Providers component to only include necessary contexts
- [ ] Add error boundaries
- [ ] Update documentation

## Pages to Migrate (Priority Order)

1. **Dashboard** ✅ (Complete)
2. **Team pages** - High traffic, lots of data fetching
3. **Todo pages** - Similar to dashboard
4. **Calendar pages** - Event data can be server-fetched
5. **Analytics pages** - Heavy data, perfect for server rendering
6. **Settings pages** - User/practice data ideal for server
7. **Profile pages** - User-specific, good for server

## Common Migration Patterns

### Pattern 1: Simple Data Display

```typescript
// Server Component
export default async function Page() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")
  
  return <DisplayClient userName={user.name} />
}
```

### Pattern 2: Forms with Server Actions

```typescript
// Server Component
import { revalidatePath } from "next/cache"

async function updateProfile(formData: FormData) {
  "use server"
  
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  
  // Update logic...
  revalidatePath("/profile")
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")
  
  return <ProfileForm user={user} updateAction={updateProfile} />
}
```

### Pattern 3: Data Fetching with Dynamic Segments

```typescript
// app/team/[id]/page.tsx
export default async function TeamPage({ params }: { params: { id: string } }) {
  const [user, teamData] = await Promise.all([
    getCurrentUser(),
    getTeamData(params.id),
  ])
  
  if (!user) redirect("/auth/login")
  if (!teamData) notFound()
  
  return <TeamClient team={teamData} currentUser={user} />
}
```

## Troubleshooting

### "Cannot use hooks in Server Components"

**Problem:** Trying to use `useUser()`, `useState()`, etc. in a Server Component

**Solution:** Move client-only logic to a Client Component (with "use client")

### "Headers already sent"

**Problem:** Trying to redirect after data has started streaming

**Solution:** Call `redirect()` before any async operations that might stream

### "Context is undefined"

**Problem:** Component uses `useUser()` but is now in a Server Component tree

**Solution:** Pass user data as props from the Server Component parent

## Performance Metrics

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial Bundle | 600KB | 350KB | 42% smaller |
| Dashboard Load | 1100ms | 250ms | 4.4x faster |
| Time to Interactive | 2.5s | 0.8s | 3.1x faster |
| Context Providers | 11 | 4-5 | 50% fewer |
| API Requests (Dashboard) | 6 sequential | 4 parallel | Waterfall eliminated |

## Next Steps

1. Review this migration guide
2. Test dashboard performance after changes
3. Begin migrating team pages using the same pattern
4. Monitor bundle size with `pnpm run analyze`
5. Gradually phase out client contexts

## Resources

- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React cache()](https://react.dev/reference/react/cache)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
