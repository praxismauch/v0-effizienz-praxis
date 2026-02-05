# Performance Analysis & Optimization Plan

## Executive Summary

Your app has significant performance bottlenecks across 5 major areas:
1. **Request Waterfalls** - Sequential API calls blocking render
2. **Hydration Loops** - Multiple context providers causing re-renders
3. **Dev Overhead** - 11 nested context providers with complex state management
4. **Large Dependencies** - Supabase, SWR, Recharts loaded on every page
5. **No Code Splitting** - All contexts and libraries bundled into main chunk

**Estimated Impact**: Reducing initial bundle from ~600KB to ~150KB, improving LCP by 40-60%

---

## 1. REQUEST WATERFALLS

### Current Issues

**Dashboard Page** loads data sequentially:
```typescript
// ❌ BAD: Sequential waterfall
1. User auth → 200ms
2. User profile → 150ms  
3. Practice data → 180ms
4. Dashboard stats → 250ms
5. Recent activities → 180ms
6. Documents → 150ms
Total: ~1110ms
```

**Root Layout** also creates waterfalls:
- Waits for headers/cookies
- Fetches getCurrentUserProfile
- Then children can start rendering

### Solutions

#### A. Parallel Data Fetching
```typescript
// ✅ GOOD: Parallel fetching
const [user, stats, activities, docs] = await Promise.all([
  supabase.auth.getUser(),
  fetch('/api/dashboard-stats'),
  fetch('/api/recent-activities'),
  fetch('/api/documents')
])
// Total: ~250ms (longest request)
```

#### B. Streaming SSR
```typescript
// Use React 19 Suspense boundaries
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardStats /> {/* Streams when ready */}
</Suspense>
```

#### C. Prefetching
```typescript
// Add prefetch hints in layout
<link rel="prefetch" href="/api/dashboard-stats" />
```

---

## 2. HYDRATION LOOPS

### Current Issues

**11 Nested Context Providers** in `components/providers.tsx`:
1. SWRConfig
2. UserProvider (with 6 useEffects!)
3. TranslationProvider
4. PracticeProvider (with SWR)
5. SidebarSettingsProvider
6. OnboardingProvider
7. TeamProvider
8. TodoProvider
9. CalendarProvider
10. WorkflowProvider
11. AnalyticsDataProvider

**Hydration Loop Pattern Detected**:
```typescript
// UserProvider triggers PracticeProvider
UserProvider changes → 
  PracticeProvider fetches → 
    SWR updates → 
      UserProvider re-renders →
        Loop continues...
```

**Evidence**: 
- UserProvider has 6 useEffects with complex dependencies
- PracticeProvider has onSuccess callback that was causing render loops (commented out)
- Multiple providers listening to same user/practice state changes

### Solutions

#### A. Reduce Context Providers (Target: 3-4 max)
```typescript
// ✅ GOOD: Minimal providers
<ServerDataProvider initialData={serverData}>
  <ThemeProvider>
    <UIProvider> {/* Sidebar, modals, toasts */}
      {children}
    </UIProvider>
  </ThemeProvider>
</ServerDataProvider>
```

#### B. Move to Server Components
- UserProvider → Use server-side getCurrentUser()
- PracticeProvider → Fetch practice in layout
- TeamProvider, TodoProvider → Fetch in page components
- Only keep client-side: Theme, UI state, real-time updates

#### C. Consolidate State
```typescript
// Instead of 11 providers, use zustand/jotai for client state
const useAppStore = create((set) => ({
  user: null,
  practice: null,
  sidebar: { open: true },
}))
```

---

## 3. DEV OVERHEAD

### Current Issues

**Excessive Re-renders**:
- Every context change triggers full provider tree re-render
- UserContext fetches on mount, auth state change, pathname change, etc.
- Multiple refs and state variables causing unnecessary updates

**Complex State Management**:
```typescript
// UserProvider alone has:
- 8 state variables
- 6 refs
- 6 useEffects
- Complex dependency arrays
```

### Solutions

#### A. Simplify UserContext
```typescript
// ✅ Minimal client-side user context
export function UserProvider({ initialUser, children }) {
  const [user] = useState(initialUser) // From server
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}
```

#### B. Move Logic to Server
- Authentication → middleware.ts
- User fetching → layout.tsx server component
- Practice selection → Server Actions

#### C. Use React 19 Features
```typescript
// use() hook eliminates need for context providers
import { use } from 'react'
const user = use(userPromise) // No provider needed!
```

---

## 4. LARGE DEPENDENCIES

### Current Bundle Analysis

**Client Bundle Breakdown** (estimated):
- @supabase/supabase-js: ~42KB gzipped
- @supabase/ssr: ~18KB gzipped
- swr: ~31KB gzipped
- recharts + d3: ~85KB gzipped
- lucide-react: ~45KB gzipped (if not tree-shaken)
- date-fns: ~35KB gzipped
- **Total heavy deps**: ~256KB before app code

### Solutions

#### A. Lazy Load Heavy Libraries
```typescript
// ✅ Dynamic import for charts
const RechartsComponent = dynamic(() => import('@/components/charts'), {
  loading: () => <ChartSkeleton />,
})
```

#### B. Tree-shake Lucide Icons
```typescript
// ❌ BAD
import * as Icons from 'lucide-react'

// ✅ GOOD
import { Users, Calendar, Settings } from 'lucide-react'
```

#### C. Replace or Remove
- Replace `date-fns` with native `Intl.DateTimeFormat` (0KB)
- Use CSS animations instead of framer-motion for simple animations
- Consider replacing SWR with native React Server Components + streaming

---

## 5. NO CODE SPLITTING

### Current Issues

**Everything in Main Bundle**:
- All 11 context providers load immediately
- All pages' client components pre-bundled
- Dashboard loads even if user goes to /team
- Recharts loads even on pages without charts

### Solutions

#### A. Route-based Code Splitting (Already configured but needs optimization)
```typescript
// next.config.mjs - Add more aggressive splitting
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        // Split by feature
        dashboard: {
          test: /[\\/]components[\\/]dashboard[\\/]/,
          name: 'dashboard',
          priority: 20,
        },
        calendar: {
          test: /[\\/]components[\\/]calendar[\\/]/,
          name: 'calendar',
          priority: 20,
        },
      }
    }
  }
}
```

#### B. Component-level Dynamic Imports
```typescript
// ✅ Lazy load dashboard widgets
const DashboardOverview = dynamic(
  () => import('@/components/dashboard-overview'),
  { ssr: false } // Client-only if it uses heavy client libs
)
```

#### C. Conditional Loading
```typescript
// Only load contexts when needed
{isAuthenticated && <UserProvider>...</UserProvider>}
{!isPublicRoute && <PracticeProvider>...</PracticeProvider>}
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Quick Wins (1-2 days)
1. ✅ Move dashboard data fetching to server (DONE)
2. Remove unused context providers from public routes
3. Lazy load Recharts components
4. Add proper webpack code splitting rules

### Phase 2: Architecture Changes (3-5 days)
1. Consolidate 11 providers into 3-4
2. Move UserProvider logic to server components
3. Replace SWR with Server Components where possible
4. Implement streaming SSR for dashboard

### Phase 3: Advanced Optimizations (1 week)
1. Implement React 19 use() hook to eliminate providers
2. Add route-based code splitting
3. Implement service worker for offline support
4. Add resource hints (preconnect, prefetch, preload)

---

## MEASUREMENT

### Before Optimization (Estimated)
- Initial Bundle: ~600KB gzipped
- LCP: 2.5-3.5s
- TTI: 4-5s
- Total Blocking Time: 800-1200ms

### After Phase 1 (Target)
- Initial Bundle: ~300KB gzipped
- LCP: 1.8-2.2s
- TTI: 2.5-3s
- Total Blocking Time: 400-600ms

### After Phase 3 (Target)
- Initial Bundle: ~150KB gzipped
- LCP: 1.2-1.6s
- TTI: 1.8-2.2s
- Total Blocking Time: 200-300ms

---

## NEXT STEPS

1. Run `pnpm run analyze` to visualize current bundle
2. Implement Phase 1 optimizations
3. Measure with Lighthouse before/after
4. Deploy and monitor with Vercel Analytics
5. Iterate based on real user metrics
