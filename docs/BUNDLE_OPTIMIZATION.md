# Bundle Size Optimization Guide

## Current Issues Identified

### 1. **Client-Side SWR Provider (lib/swr-config.tsx)**
- **Issue**: SWR library (~40KB) loaded on every client component
- **Impact**: Adds unnecessary weight to client bundles
- **Fix**: Move data fetching to Server Components using native fetch with Next.js caching

### 2. **Heavy Client Components**
- Multiple page-client.tsx files import large dependencies
- dashboard/page-client.tsx loads contexts that pull in SWR and Supabase client
- Many pages use "use client" unnecessarily

### 3. **Supabase Client Bundle**
- @supabase/ssr and @supabase/supabase-js loaded client-side
- Should only be used in Server Components and API routes

### 4. **Icon Library (lucide-react)**
- Importing entire icon library instead of tree-shaking
- Already using proper imports, but verify no barrel imports

## Optimization Strategy

### Phase 1: Move Data Fetching to Server Components (High Impact)

1. **Dashboard Page**
   - Remove SWR from dashboard data fetching
   - Fetch data in Server Component (page.tsx)
   - Pass data as props to minimal Client Component
   - Use Server Actions for mutations

2. **Other Pages**
   - Audit all page-client.tsx files
   - Convert to Server Components where possible
   - Use React Server Components pattern:
     ```tsx
     // app/dashboard/page.tsx (Server Component)
     export default async function DashboardPage() {
       const data = await getData() // Server-side fetch
       return <DashboardClient data={data} />
     }
     
     // app/dashboard/client.tsx (Minimal Client Component)
     'use client'
     export function DashboardClient({ data }: Props) {
       // Only client interactions, no data fetching
     }
     ```

### Phase 2: Remove SWR Library (Very High Impact)

Replace SWR with:
- **Server Components**: Use native fetch with Next.js cache
- **Client State**: Use React state for UI-only state
- **Optimistic Updates**: Use Server Actions with useOptimistic
- **Real-time**: Use Supabase Realtime subscriptions (smaller bundle than SWR)

### Phase 3: Dynamic Imports for Heavy Components

```tsx
// Before
import { HeavyChart } from '@/components/heavy-chart'

// After  
const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

Target components:
- Chart components (recharts)
- Rich text editors
- PDF viewers
- Large dialog content

### Phase 4: Context Optimization

Review contexts/*:
- user-context.tsx - Can this be Server Component data?
- practice-context.tsx - Can this use Server Component data?
- Remove SWR from contexts

### Phase 5: Supabase Client Optimization

- Remove client-side Supabase from most pages
- Use Server Actions for mutations
- Only use client Supabase for:
  - Real-time subscriptions
  - Auth flows (login/signup)

## Expected Results

- **Before**: Estimated 600KB+ initial JS bundle
- **After**: Target 100-200KB gzipped
- **Savings**: ~70% reduction in client JavaScript

## Implementation Order

1. ✅ Bundle analyzer setup (completed)
2. ⬜ Convert dashboard to Server Components
3. ⬜ Remove SWR library
4. ⬜ Add dynamic imports for heavy components
5. ⬜ Optimize contexts
6. ⬜ Remove client-side Supabase where not needed
7. ⬜ Re-analyze bundle and verify improvements
