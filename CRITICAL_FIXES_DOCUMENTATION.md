# Critical Bug Fixes - December 17, 2025

## Issues Fixed

### 1. Infinite Recursion in RLS Policies (CRITICAL)
**Error**: `infinite recursion detected in policy for relation "practice_members"`

**Root Cause**: The RLS policy for `practice_members` table was referencing itself, creating a circular dependency. When querying `calendar_events`, the policy would check `practice_members`, which in turn would check `practice_members` again recursively.

**Solution**:
- Rewrote RLS policies to avoid self-references
- Changed from checking practice membership via `practice_members` table to checking via `users` table
- Added simple role-based checks (superadmin, admin) instead of complex joins
- Created indexes on key columns to improve performance

**File**: `scripts/fix-rls-infinite-recursion-v2.sql`

### 2. Redis Serialization Error
**Error**: `t.map is not a function` when reading/writing to Redis

**Root Cause**: Upstash Redis was auto-parsing JSON values, but the code expected strings. This caused type mismatches when trying to parse already-parsed objects.

**Solution**:
- Added type checking in `getCached()` to handle both string and pre-parsed values
- Added validation in `setCached()` to ensure values are serializable before caching
- Added proper error handling for parse/stringify failures
- Ensured all badge counts are plain numbers, not BigInt or other non-JSON types

**Files**: 
- `lib/redis.ts` - Fixed serialization handling
- `lib/db/queries.ts` - Ensured plain number types for badge counts

### 3. Auth Session Missing
**Error**: Multiple "Auth session missing!" errors in middleware

**Root Cause**: The middleware was correctly detecting missing sessions but the error messages were confusing.

**Status**: This is expected behavior - the middleware logs are informational. The middleware correctly allows access and lets client-side auth handle the session. No fix needed.

## Testing

After running the SQL script:
1. Test calendar events: `GET /api/practices/1/calendar-events`
2. Test sidebar badges: `GET /api/practices/1/sidebar-badges`
3. Monitor logs for Redis errors
4. Verify no more "infinite recursion" errors

## Performance Impact

- Added indexes on frequently-queried columns
- Simplified RLS policies reduce query complexity
- Redis caching continues to work properly

## Rollback Plan

If issues occur, revert to previous RLS policies in `scripts/fix-calendar-rls-recursion.sql`
