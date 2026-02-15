# API Performance Optimization Plan

## Current Performance Issues (from logs)

**Critical Slow Endpoints:**
- `/api/practices/1/analytics/data` - **5-8 seconds** 🔴
- `/api/practices/1/orga-categories` - 300-900ms 🟡
- `/api/workflow-templates` - 200-900ms 🟡
- `/api/practices/1/todos` - 100-500ms 🟢
- `/api/practices/1/workflows` - 85-480ms 🟢

**Target:** All endpoints under 500ms (200ms for cached data)

---

## Phase 1: Fix Analytics Endpoint (CRITICAL)

**File:** `/app/api/practices/[practiceId]/analytics/data/route.ts`

**Current Issues:**
- Takes 5-8 seconds per request
- Likely multiple sequential database queries
- No caching
- No query optimization

**Fixes Needed:**
1. Add response caching with 5-minute TTL
2. Parallelize database queries (use Promise.all)
3. Add database indexes on frequently queried columns
4. Implement incremental data loading (don't load everything at once)
5. Add query result memoization

**Expected Result:** 5-8s → 200-500ms (10-40x faster)

---

## Phase 2: Add Global Caching Strategy

**Create:** `/lib/cache/index.ts`

**Features:**
- In-memory cache with TTL
- Cache invalidation on mutations
- Separate cache keys per practice
- Configurable TTL per endpoint

**Cache Configuration:**
- Analytics data: 5 minutes
- Practice/user lists: 1 minute  
- Static data (templates, categories): 10 minutes
- Dynamic data (todos, workflows): 30 seconds

---

## Phase 3: Optimize Database Queries

**Files to Check:**
- All API routes in `/app/api/practices/[practiceId]/`

**Optimizations:**
1. Add `.select()` to only fetch needed columns
2. Remove unnecessary `.single()` calls (use arrays)
3. Add database indexes for commonly filtered columns
4. Use `.count()` instead of fetching all and counting
5. Batch similar queries together

---

## Phase 4: Add Pagination

**Endpoints needing pagination:**
- `/api/super-admin/users`
- `/api/super-admin/practices`
- `/api/practices/[id]/team-members`
- `/api/practices/[id]/todos`

**Implementation:**
- Add `limit`, `offset`, `cursor` query params
- Return `total`, `hasMore` in response
- Default limit: 50 items

---

## Phase 5: SWR Cache Configuration

**Update:** All hooks in `/lib/hooks/use-super-admin-*.ts`

**Configuration:**
```typescript
{
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 10000,
  focusThrottleInterval: 30000
}
```

---

## Quick Wins (Implement First)

1. **Add Cache Headers** - Set proper Cache-Control headers
2. **Compress Responses** - Enable gzip/brotli compression  
3. **Batch Requests** - Use SWR's built-in deduplication
4. **Early Returns** - Return cached data while revalidating
5. **Request Debouncing** - Prevent rapid-fire requests

---

## Monitoring After Implementation

**Metrics to Track:**
- P50 response time
- P95 response time  
- Cache hit rate
- Database query count
- API error rate

**Expected Improvements:**
- 70% reduction in response times
- 80% cache hit rate
- 60% fewer database queries
- 50% reduction in bandwidth

---

## Implementation Order

1. ✅ Fix hardcoded practice_id (DONE)
2. 🔲 Fix analytics endpoint (5-8s → 500ms) - START HERE
3. 🔲 Add caching layer
4. 🔲 Optimize other slow endpoints
5. 🔲 Add pagination
6. 🔲 Configure SWR properly

---

## Files to Modify

**Priority 1 (Critical):**
- `/app/api/practices/[practiceId]/analytics/data/route.ts`
- `/lib/cache/index.ts` (new)

**Priority 2 (Important):**
- `/app/api/practices/[practiceId]/orga-categories/route.ts`
- `/app/api/workflow-templates/route.ts`

**Priority 3 (Nice to have):**
- All hooks in `/lib/hooks/`
- SWR configuration in `/lib/swr-config.tsx`

---

## Next Action

**START WITH:** Analyzing and fixing the analytics endpoint that takes 5-8 seconds.
