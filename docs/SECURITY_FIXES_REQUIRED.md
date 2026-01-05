# Security Fixes Required

Based on Supabase Database Linter analysis on 03.12.2025

## 🔴 Critical Security Issues

### 1. Function Search Path Mutable (12 functions affected)

**Risk Level:** WARN  
**Category:** SECURITY  
**Status:** ✅ SQL Script Created

**Issue:**
Functions without a fixed `search_path` are vulnerable to search_path manipulation attacks where malicious users could alter the search path to execute unauthorized code.

**Affected Functions:**
1. `decrement_template_usage`
2. `increment_group_usage`
3. `decrement_group_usage`
4. `is_practice_admin`
5. `is_power_user`
6. `validate_datensponde_settings`
7. `update_workflow_progress`
8. `add_default_document_folders`
9. `check_appointment_conflict`
10. `update_updated_at_column`
11. `is_super_admin`
12. `update_blog_posts_updated_at`

**Solution:**
Run the SQL script: `scripts/fix-function-search-path-security.sql`

This script recreates all affected functions with `SET search_path = ''` to prevent search_path manipulation attacks.

**Reference:**
https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

---

### 2. Leaked Password Protection Disabled

**Risk Level:** WARN  
**Category:** SECURITY  
**Status:** ⚠️ Manual Configuration Required

**Issue:**
Supabase Auth can prevent the use of compromised passwords by checking against HaveIBeenPwned.org database. This feature is currently disabled.

**Impact:**
Users can set passwords that have been exposed in data breaches, increasing the risk of account compromise.

**Solution:**
Enable leaked password protection in Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Policies** (or **Password Settings**)
3. Find **"Leaked Password Protection"** setting
4. Enable the toggle
5. Save changes

**Benefits:**
- Prevents users from using compromised passwords
- Checks against 600M+ leaked passwords from HaveIBeenPwned.org
- No performance impact (uses k-Anonymity model)
- Improves overall account security

**Reference:**
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

---

## Implementation Priority

### High Priority (Do immediately)
1. ✅ Run `scripts/fix-function-search-path-security.sql` - Fixes 12 function vulnerabilities
2. ⚠️ Enable leaked password protection in Supabase Dashboard

### Post-Implementation Verification

After running the fixes, verify with:

\`\`\`sql
-- Check that all functions now have fixed search_path
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security,
  CASE 
    WHEN 'search_path' = ANY(string_to_array(prosqlbody, ' ')) THEN 'FIXED'
    ELSE 'VULNERABLE'
  END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'decrement_template_usage',
  'increment_group_usage',
  'decrement_group_usage',
  'is_practice_admin',
  'is_power_user',
  'validate_datensponde_settings',
  'update_workflow_progress',
  'add_default_document_folders',
  'check_appointment_conflict',
  'update_updated_at_column',
  'is_super_admin',
  'update_blog_posts_updated_at'
);
\`\`\`

---

## Additional Notes

- All affected functions use `SECURITY DEFINER` which makes the search_path vulnerability more critical
- The fix is backward compatible and won't affect existing functionality
- After applying fixes, re-run Supabase Database Linter to verify all issues are resolved
