# Team Pages Data Flow Fix Summary

## Problem
All team-related dynamic routes (team member details, edit pages, etc.) were failing with "not found" errors because:
1. They relied on client-side API routes that don't exist (`/api/practices/${practiceId}/team-members`)
2. They depended on TeamContext which had empty data (0 team members)
3. The team members query was failing due to type mismatch (string vs integer for practice_id)

## Root Cause Fixed
The main issue was in `/lib/server/get-team-data.ts`:
- `getTeamMembersByPractice` was querying with `practiceId` as a string
- Database stores `practice_id` as an integer
- **Fixed by converting**: `const practiceIdNum = parseInt(practiceId, 10)`

## Server Utilities Added

### `/lib/server/get-team-data.ts`
```typescript
// New function to fetch individual team member
export const getTeamMemberById = cache(async (memberId: string, practiceId: string): Promise<any | null> => {
  const supabase = await createServerClient()
  const practiceIdNum = parseInt(practiceId, 10)
  
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("id", memberId)
    .eq("practice_id", practiceIdNum)
    .single()

  return data
})
```

## Pages That Need Server-First Pattern

### 1. Team Member Detail Page (`/app/team/[id]/page.tsx`)
**Status**: Server wrapper created, needs client component update

**Required Changes**:
- ✅ Created server page.tsx that fetches data
- ⏳ Update client component to accept props:
  ```typescript
  interface TeamMemberDetailClientProps {
    initialMember: any | null
    initialTeamData: { teams: any[], teamMembers: any[] }
    memberId: string
    practiceId: string
    userId: string
    isAdmin: boolean
  }
  ```
- ⏳ Remove all client-side data fetching useEffects
- ⏳ Use initialMember directly instead of searching teamMembers array

### 2. Team Member Edit Page (`/app/team/[id]/edit/page.tsx`)
**Status**: Needs conversion

**Required Changes**:
- Create server page.tsx wrapper
- Fetch team member server-side with `getTeamMemberById`
- Pass to client component as props
- Remove client-side fetching logic

### 3. Other Team Detail Routes
Check for additional dynamic routes under `/app/team/` that may need similar fixes.

## Data Flow Pattern (Standard for All Pages)

```typescript
// app/team/[id]/page.tsx (Server Component)
export default async function Page({ params }) {
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  const member = await getTeamMemberById(params.id, practiceId)
  const teamData = await getAllTeamData(practiceId)
  
  return <ClientComponent initialData={member} teamData={teamData} />
}

// app/team/[id]/page-client.tsx (Client Component)
'use client'
export default function ClientComponent({ initialData, teamData }) {
  const [member, setMember] = useState(initialData)
  // Use initialData, don't fetch unless needed
}
```

## Testing Checklist

After implementing fixes:
- [ ] `/team` shows team members count > 0
- [ ] Clicking on a team member shows their detail page
- [ ] Team member detail page displays data correctly
- [ ] Edit team member page loads and saves
- [ ] No 401 errors for missing API routes
- [ ] Console logs show correct team member counts

## Next Steps

1. Update `/app/team/[id]/page-client.tsx` to accept server props
2. Convert `/app/team/[id]/edit/page.tsx` to server+client pattern  
3. Test all team member flows
4. Remove debug console.log statements once confirmed working
