# Diagnostic Scripts for Auth Issues

This directory contains diagnostic scripts to help identify and fix authentication and user profile issues.

## Problem Description

Based on the deep dive analysis, the issue is:
1. User IS authenticated in Supabase auth
2. BUT no profile exists in the `public.users` table
3. The middleware/auth code queries the `users` table and gets an error
4. The auto-create logic never runs because errors throw before reaching that code
5. This causes a redirect loop

## Diagnostic Scripts

### SQL Scripts (Run in Supabase SQL Editor)

1. **1-check-rls-policies.sql**
   - Checks if RLS is enabled on the users table
   - Lists all RLS policies
   - Verifies policies allow authenticated users to select

2. **2-check-users-table.sql**
   - Counts total users in the table
   - Shows sample users
   - Checks for data integrity issues

3. **3-check-auth-users.sql**
   - Compares auth.users with public.users
   - Finds "orphaned" users (in auth but not in public.users)
   - This is the KEY diagnostic to find the problem

4. **4-test-rls-permissions.sql**
   - Tests RLS policy behavior
   - Verifies policies are working correctly

### JavaScript Scripts (Run Locally)

5. **5-check-supabase-config.mjs**
   ```bash
   node scripts/diagnostics/5-check-supabase-config.mjs
   ```
   - Checks environment variables
   - Tests Supabase connection
   - Verifies URL format

6. **6-simulate-auth-flow.mjs**
   ```bash
   node scripts/diagnostics/6-simulate-auth-flow.mjs
   ```
   - Simulates the authentication flow
   - Identifies exactly where it breaks
   - **This is the most important diagnostic script**

### Fix Script

**FIX-create-missing-profiles.mjs**
```bash
node scripts/diagnostics/FIX-create-missing-profiles.mjs
```
- Finds users without profiles
- Creates missing profiles automatically
- Interactive prompt for safety

## How to Use

### Quick Start (Recommended)

1. **Run the simulation script first:**
   ```bash
   node scripts/diagnostics/6-simulate-auth-flow.mjs
   ```
   This will tell you exactly what the problem is.

2. **If it finds orphaned users, run the fix:**
   ```bash
   node scripts/diagnostics/FIX-create-missing-profiles.mjs
   ```

3. **Refresh your app and try logging in**

### Full Diagnostic Process

If you want to do a complete check:

1. Run SQL script 3 in Supabase SQL Editor:
   - Copy contents of `3-check-auth-users.sql`
   - Paste in Supabase Dashboard > SQL Editor
   - Run and check for orphaned users

2. Run the local simulation:
   ```bash
   node scripts/diagnostics/6-simulate-auth-flow.mjs
   ```

3. Check RLS policies (SQL script 1):
   - Verify policies are correctly configured

4. If issues found, run the fix:
   ```bash
   node scripts/diagnostics/FIX-create-missing-profiles.mjs
   ```

## Expected Findings

Based on the analysis, you should find:

- ✅ User exists in `auth.users`
- ❌ User does NOT exist in `public.users`
- ❌ Query to `users` table returns error PGRST116 or similar
- ❌ Auto-create logic never executes

## Solution

The fix script will:
1. Find all users in auth.users without profiles in public.users
2. Create profiles for them with default values
3. Extract metadata from auth.users (name, email, role, etc.)

## Prevention

To prevent this in the future, consider:

1. **Database Trigger** (recommended):
   Create a trigger that auto-creates profiles when users sign up

2. **Signup Hook**:
   Add a Supabase webhook to create profiles on user creation

3. **Better Error Handling**:
   Modify the auth code to handle missing profiles gracefully

## Environment Variables Required

For JavaScript scripts:
- `NEXT_PUBLIC_SUPABASE_URL` (required)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (required for diagnostics and fix)

## Troubleshooting

**Script fails with "Missing environment variables"**
- Check your `.env` file
- Verify variables are exported to your shell

**SQL scripts show "permission denied"**
- You may need to run them as a Supabase admin
- Use the Supabase Dashboard SQL Editor

**Fix script doesn't find any users**
- Check that users have actually signed up
- Verify service role key is correct
- Run the simulation script first to confirm

## Next Steps After Fixing

1. Test login with fixed accounts
2. Consider implementing a database trigger to auto-create profiles
3. Review the auto-create logic in `lib/auth-utils.ts` to understand why it didn't work
4. Add better error logging to catch similar issues in the future
