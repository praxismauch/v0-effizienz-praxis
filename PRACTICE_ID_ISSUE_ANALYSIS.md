# Practice ID Type Mismatch - Root Cause Analysis

## Problem Summary
The application has a fundamental type mismatch with practice_id throughout the entire codebase, causing user creation failures and authentication issues.

## Database Schema (Verified)
- **practices.id**: TEXT (stores: "0", "1", "3", "4", "5")
- **users.practice_id**: TEXT (must match practices.id format)
- **team_members.practice_id**: TEXT (assumed, needs verification)

## Root Causes

### 1. Type Mismatch
**Problem**: Code treats practice_id as `number` but database expects `text`

**Evidence**:
- `lib/hooks/use-super-admin-users.ts` line 71: `practiceId?: number`
- Multiple components parse practice_id as integers
- API converts numbers to strings inconsistently

### 2. Hardcoded Fallback Practice ID = "1"
**Problem**: 103+ locations use hardcoded `practice_id="1"` or `practiceId=1` as fallback

**Critical Locations**:
- `/app/api/practices/[practiceId]/todos/route.ts` line 24: `effectivePracticeId = "1"`
- `/lib/api-helpers.ts` lines 142, 241: default practice "1"
- `/contexts/user-context.tsx` line 484
- `/lib/utils/practice-id.ts` lines 16, 21
- 99+ more locations

### 3. Inconsistent Null Handling
**Problem**: Different parts handle missing practice_id differently:
- Some use `null`
- Some use `"none"`
- Some use `"0"`
- Some use `"1"` as fallback
- Some use `undefined`

## Existing Practices in Database
```
id="0" → Praxis Dr. Mauch - ID 0
id="1" → Praxis Dr. Mauch - ID 1  ← Most hardcoded fallback
id="3" → Hauptpraxis Berlin
id="4" → Facharztpraxis Muenchen
id="5" → Yahya's TestPraxis
```

## Impact Areas

### HIGH PRIORITY - Broken Features
1. **User Creation** (Current Issue)
   - Super admin cannot create users
   - Type mismatch when practice selected
   - Error: "Database error creating new user"

2. **Authentication Flow**
   - Users without valid practice_id cannot log in
   - Session management relies on practice_id
   - 401 errors when practice_id invalid

3. **API Endpoints**
   - Many endpoints default to practice "1"
   - URLs use `/api/practices/1/...` even when wrong
   - RLS policies may fail with wrong practice_id

### MEDIUM PRIORITY - Data Integrity
4. **Team Members**
   - practice_id mismatch in team_members table
   - Users not properly associated with practices

5. **Practice-Scoped Features**
   - Todos, workflows, calendar defaulting to wrong practice
   - Data leakage between practices possible

## Fix Strategy

### Phase 1: Immediate Fix (User Creation)
**Files to update**:
1. `/app/api/super-admin/users/route.ts`
   - Ensure practice_id is always string
   - Handle "none" → null conversion properly

2. `/lib/hooks/use-super-admin-users.ts`
   - Change `practiceId?: number` to `practiceId?: string | null`

3. `/components/super-admin/users-manager.tsx`
   - Ensure form sends string practice_id

### Phase 2: Systematic Cleanup
**Strategy**: Replace all hardcoded practice_id="1" with proper context-aware values

**Files requiring update** (top priority):
- `/lib/utils/practice-id.ts` - Central practice ID utilities
- `/lib/api-helpers.ts` - API helper functions
- `/contexts/user-context.tsx` - User context provider
- All `/app/api/practices/[practiceId]/*` routes

### Phase 3: Type Safety
**Goal**: Enforce TEXT type throughout codebase

**Actions**:
1. Create TypeScript type: `type PracticeId = string`
2. Update all interfaces to use `PracticeId` instead of `number`
3. Add validation functions:
   ```typescript
   function isPracticeId(value: unknown): value is PracticeId {
     return typeof value === 'string' && /^[0-9]+$/.test(value)
   }
   ```

## Recommended Solution

### Option A: Keep TEXT IDs (Recommended)
**Pros**:
- Database already uses TEXT
- Supports future UUID migration
- No database migration needed

**Cons**:
- Need to update 103+ code locations

### Option B: Migrate to INTEGER
**Pros**:
- Matches most code expectations

**Cons**:
- Requires database migration
- Breaking change for existing data
- Prevents future UUID usage

**Recommendation**: Option A - Update code to match database

## Next Steps

1. ✅ Fix immediate user creation issue
2. Create practice_id utility functions
3. Systematically replace hardcoded "1" values
4. Add TypeScript types for type safety
5. Add database constraints/validation
6. Update tests

## Testing Checklist
- [ ] User creation with practice assigned
- [ ] User creation without practice (null)
- [ ] Login with various practice_id values
- [ ] API endpoints respect practice_id
- [ ] RLS policies work correctly
- [ ] Team member associations correct
