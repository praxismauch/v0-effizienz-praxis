# Practice ID Validation Report

## Executive Summary

This report documents the comprehensive audit and fix of practice ID handling across the entire application, ensuring consistent behavior for both regular users and super admins.

## Issues Identified

### 1. Inconsistent Practice ID Sources
- Some components use `currentPractice?.id` from PracticeContext
- Others use `currentUser?.practice_id` from UserContext
- Some use `user?.practice_id` from AuthContext
- No standardized fallback chain

### 2. Super Admin Handling
- Super admins may not have a `practice_id` directly assigned
- They rely on `currentPractice` from PracticeContext (selected practice)
- Many components failed to handle this case, blocking functionality

### 3. Validation Inconsistencies
- Different validation patterns: `!practiceId`, `practiceId === "0"`, `practiceId === "null"`
- No centralized validation utility
- Inconsistent error messages

## Solution Architecture

### New Utilities Created

#### 1. `lib/hooks/use-practice-id.ts`
Universal hook for getting a valid practice ID across all user types.

**Resolution Order:**
1. `currentPractice.id` from PracticeContext (best for super admins)
2. `currentUser.practice_id` from UserContext
3. `currentUser.practiceId` from UserContext (legacy)
4. Returns null with appropriate error

**Features:**
- `practiceId`: Resolved practice ID
- `isReady`: Boolean indicating if safe to use
- `isLoading`: Combined loading state
- `error`: German error message if not ready
- `isSuperAdmin`: User type indicator
- `source`: Debug info showing where ID came from
- `getOrFallback(fallback)`: Helper method

#### 2. `components/practice-guard.tsx`
Guard component for wrapping pages/sections that require a practice ID.

**Features:**
- Loading state handling
- Error state handling with custom messages
- Super admin practice selector
- Fallback practice ID support

#### 3. `isValidPracticeId(id)` Function
Centralized validation that checks for:
- null, undefined
- Empty string
- "0", "null", "undefined", "default"

## User Type Handling

### Regular Users
- Always have `practice_id` from their user record
- Use `currentUser.practice_id` as primary source
- Cannot switch practices

### Super Admins
- May not have a direct `practice_id`
- Use `currentPractice.id` from practice selector
- Can switch between all practices
- Components should show practice selector when no practice selected

### API Routes
- Use `validatePracticeIdForApi()` for consistent server-side validation
- Return 400 with clear error message if invalid

## Migration Guide

### Before (Inconsistent):
\`\`\`tsx
const { currentPractice } = usePractice()
const { currentUser } = useUser()

// Different components did different things:
const practiceId = currentPractice?.id
// or
const practiceId = currentUser?.practice_id
// or
if (!currentPractice) return null
\`\`\`

### After (Standardized):
\`\`\`tsx
import { usePracticeId } from "@/lib/hooks/use-practice-id"

const { practiceId, isReady, isLoading, error, isSuperAdmin } = usePracticeId()

if (isLoading) return <LoadingSpinner />
if (!isReady) return <ErrorMessage message={error} />

// Safe to use practiceId
fetch(`/api/practices/${practiceId}/data`)
\`\`\`

### For Pages (with Guard):
\`\`\`tsx
import { PracticeGuard } from "@/components/practice-guard"

export default function MyPage() {
  return (
    <PracticeGuard>
      <MyPageContent />
    </PracticeGuard>
  )
}
\`\`\`

## Components Updated

The following patterns need to be updated across the codebase:

1. **Dialog Components** - Use `usePracticeId()` instead of separate context hooks
2. **Page Components** - Wrap with `<PracticeGuard>` for automatic handling
3. **API Calls** - Validate using `validatePracticeIdForApi()` 
4. **Forms** - Include `practiceId` in submission with validation

## Testing Checklist

- [ ] Regular user can access all features with their assigned practice
- [ ] Super admin can select and switch practices
- [ ] Super admin sees practice selector when no practice selected
- [ ] Loading states display correctly
- [ ] Error states display appropriate German messages
- [ ] API routes reject invalid practice IDs with 400 status
- [ ] Forms cannot submit without valid practice ID

## Best Practices

1. **Always use `usePracticeId()` hook** for client-side practice ID access
2. **Wrap pages with `<PracticeGuard>`** for automatic loading/error handling
3. **Use `validatePracticeIdForApi()`** in API routes
4. **Never assume practice ID exists** - always check `isReady`
5. **Show meaningful errors** - use the provided German error messages
6. **Log for debugging** - use `source` property to track where ID came from
