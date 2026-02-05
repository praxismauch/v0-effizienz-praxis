# Team Pages Migration Status

## Completed ✅

### Main Team Page (`/app/team/page.tsx`)
- **Status**: Fully migrated to server-first architecture
- **Server Utility**: `getAllTeamData(practiceId)` 
- **Data Flow**: Server fetches → Props → Client component
- **Issues Fixed**:
  - Integer conversion for practice_id
  - Eliminated API route dependencies
  - Direct database queries with proper types

### Team Member Detail Page (`/app/team/[id]/page.tsx`)
- **Status**: Temporary redirect to /team
- **Server Utility**: `getTeamMemberById(memberId, practiceId)`
- **Current Behavior**: Fetches member, redirects to team list
- **TODO**: Create TeamMemberDetailClient component with proper UI

### Team Member Edit Page (`/app/team/[id]/edit/page.tsx`)
- **Status**: Server wrapper created
- **Server Utility**: Uses `getTeamMemberById()` and `getAllTeamData()`
- **Client Component**: Moved to `page-client.tsx`
- **TODO**: Update client component to accept server props instead of using contexts

## Critical Issues Found

### 1. Dashboard Stats Still Shows 0 Team Members
**Problem**: Despite fixing the query, dashboard shows `teamMembers: 0`

**Root Cause**: The dashboard stats API was querying `team_assignments` table instead of `team_members`

**Fix Applied**: Changed `/api/practices/[practiceId]/dashboard-stats/route.ts`:
```typescript
// BEFORE (wrong)
supabase
  .from("team_assignments")  // Wrong table
  .eq("practice_id", practiceIdStr)  // Wrong type (string)

// AFTER (correct)
supabase
  .from("team_members")  // Correct table
  .eq("practice_id", practiceIdInt)  // Correct type (integer)
```

**Status**: Fix committed, needs deployment verification

### 2. Client Component Dependencies
Many team-related pages still use:
- `useTeam()` context which fetches from non-existent API routes
- `useUser()` context for auth
- Client-side data fetching patterns

**Solution**: Pass data as props from server components

## Server Utilities Created ✅

All utilities in `/lib/server/`:

1. **get-current-user.ts**
   - `getCurrentUser()`
   - `getCurrentPracticeId()`

2. **get-team-data.ts**
   - `getTeamsByPractice(practiceId)`
   - `getTeamMembersByPractice(practiceId)` - Fixed with integer conversion
   - `getTeamMemberById(memberId, practiceId)`
   - `getAllTeamData(practiceId)` - Returns all team-related data

3. **get-calendar-data.ts**
   - `getEventsByPractice(practiceId)`

4. **get-todo-data.ts**
   - `getTodosByPractice(practiceId)`

5. **get-dashboard-data.ts**
   - `getDashboardStats(practiceId)`

6. **get-workflow-data.ts** ✅ NEW
   - `getWorkflowsByPractice(practiceId)`

7. **get-goals-data.ts** ✅ NEW
   - `getGoalsByPractice(practiceId)`

8. **get-knowledge-data.ts** ✅ NEW
   - `getDocumentsByPractice(practiceId)`

## Migration Pattern

For any page that needs migration:

```typescript
// 1. Server Page (page.tsx)
export const dynamic = "force-dynamic"

import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getDataFunction } from "@/lib/server/get-data"
import PageClient from "./page-client"

export default async function Page() {
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  if (!user) redirect("/auth/login")
  
  const data = practiceId ? await getDataFunction(practiceId) : defaultData
  
  return <PageClient initialData={data} practiceId={practiceId} userId={user.id} />
}

// 2. Client Component (page-client.tsx)
"use client"

export default function PageClient({ initialData, practiceId, userId }) {
  // Use initialData instead of fetching
  const [data, setData] = useState(initialData)
  
  // Only fetch if initialData not provided (shouldn't happen)
  useEffect(() => {
    if (!initialData) {
      fetchData()
    }
  }, [initialData])
  
  // Rest of component logic
}
```

## Next Steps

1. **Verify team members data** - Check if integer conversion fix resolved the issue
2. **Update EditTeamMemberClient** - Accept props instead of using contexts
3. **Create TeamMemberDetailClient** - Build proper detail view UI
4. **Migrate remaining team sub-pages** - Apply same pattern to all dynamic routes
5. **Test data flow end-to-end** - Ensure all data displays correctly

## Key Learnings

- **Always use integer for practice_id** when querying team_members table
- **Server utilities must use React.cache()** for deduplication
- **Pass data as props** instead of fetching client-side
- **Check actual table names** - team_assignments vs team_members matters!
