# Security Fixes for effizienz-praxis

## Database Function Security (RESOLVED)

The following functions have been fixed to include `SET search_path = public, pg_temp`:

- ✅ `public.decrement_template_usage`
- ✅ `public.increment_group_usage`
- ✅ `public.decrement_group_usage`
- ✅ `public.check_appointment_conflict`

**Action Required:** Run the `scripts/fix-function-security.sql` script in your database to apply these fixes.

## Auth Leaked Password Protection (MANUAL FIX REQUIRED)

**Status:** ⚠️ Currently Disabled

Supabase Auth can prevent the use of compromised passwords by checking against HaveIBeenPwned.org. This feature is currently disabled and needs to be enabled manually.

### How to Enable:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Policies**
3. Find **Password Security Settings**
4. Enable **"Leaked Password Protection"**

### Documentation:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Benefits:
- Prevents users from using passwords that have been exposed in data breaches
- Enhances overall security without impacting user experience
- Automatic check against HaveIBeenPwned.org database

---

## Summary

**Database Functions:** The SQL script exists at `scripts/fix-function-security.sql` and needs to be executed to fix the mutable search_path warnings.

**Password Protection:** Must be enabled manually in Supabase Dashboard settings.
