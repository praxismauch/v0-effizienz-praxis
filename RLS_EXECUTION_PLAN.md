# RLS Policy Implementation & Verification Plan

## Overview
This document outlines the step-by-step execution plan to secure the database with proper RLS policies and clean up unused tables.

## Current Status
- **Total Tables:** 148
- **Tables with RLS:** 107 (72%)
- **Tables WITHOUT RLS:** 41 (28%)
- **Tables with RLS but 0 policies:** 6
- **Backup tables to delete:** 3

---

## Phase 1: Execute Backup Table Deletion (5 minutes)

### Script: `scripts/delete-unused-tables.sql`

**What it does:**
- Deletes 3 backup tables that are confirmed unused
- Removes duplicate manual backup copies

**Execute:**
```bash
# Option 1: Via Supabase SQL Editor
# Copy contents of scripts/delete-unused-tables.sql and run

# Option 2: Via v0 supabase_execute_sql tool
# The script is ready to run
```

**Impact:** 
- Removes 3 unused tables
- Reduces database clutter
- No impact on application functionality

---

## Phase 2: Create RLS Policies (15 minutes)

### Script: `scripts/create-missing-rls-policies.sql`

**What it does:**
- Creates 37 new RLS policies for unprotected tables
- Adds practice-based isolation to critical tables
- Fixes tables with RLS enabled but no policies

**Categories covered:**
1. **Critical (11 policies):** absences, holiday_requests, contract_files, document_signatures, messages, kudos, notifications, etc.
2. **High Priority (17 policies):** mood surveys, forms, equipment, hygiene plans, recruiting, etc.
3. **Fixes (4 policies):** academy_enrollments, academy_user_badges, cirs_incidents, cirs_incident_comments
4. **Join-based (5 policies):** Tables without practice_id that link through other tables

**Execute in batches:**

### Batch 1: Helper Function (required first)
```sql
CREATE OR REPLACE FUNCTION auth.user_practice_id() RETURNS TEXT AS $$
  SELECT practice_id FROM users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

### Batch 2: Critical Tables (11 policies)
Execute the CRITICAL PRIORITY section of the script

### Batch 3: High Priority Tables (17 policies)
Execute the HIGH PRIORITY section of the script

### Batch 4: Fixes (4 policies)
Execute the FIX section of the script

### Batch 5: Global Content (5 policies)
Execute the GLOBAL CONTENT TABLES section of the script

---

## Phase 3: Verification Testing (30 minutes)

### Test Script: `scripts/verify-practice-isolation.sql`

**Test Cases:**

### 1. Test Practice Isolation
```sql
-- Login as user from Practice A
SELECT * FROM absences;
-- Should only see Practice A's absences

-- Login as user from Practice B
SELECT * FROM absences;
-- Should only see Practice B's absences, not A's
```

### 2. Test Cross-Practice Prevention
```sql
-- Try to insert data for another practice
-- Should fail due to RLS policy
INSERT INTO absences (practice_id, user_id, ...) 
VALUES ('other-practice-id', auth.uid(), ...);
-- Expected: Policy violation error
```

### 3. Test Super Admin Access
```sql
-- Super admins might need special policies to see all practices
-- Implement via application-level checks or special RLS policies
```

### 4. Performance Testing
```sql
-- Check query performance with RLS enabled
EXPLAIN ANALYZE SELECT * FROM absences WHERE user_id = auth.uid();

-- Ensure indexes exist on practice_id columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_absences_practice_id 
  ON absences(practice_id);
```

### 5. Test Each Table Type

**Tables with practice_id:**
- absences
- holiday_requests
- contract_files
- messages
- kudos
- equipment
- hygiene_plans

**Tables without practice_id (join-based):**
- cirs_incident_comments
- recruiting_form_fields
- survey_questions
- survey_answers

**User-specific tables:**
- journal_preferences
- user_favorites
- notifications

---

## Phase 4: Create Missing Indexes (10 minutes)

**For optimal RLS performance, ensure indexes exist:**

```sql
-- Check existing indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%practice_id%';

-- Create missing indexes (examples)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_absences_practice_id 
  ON absences(practice_id);
  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_holiday_requests_practice_id 
  ON holiday_requests(practice_id);
  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_practice_id 
  ON messages(practice_id);

-- Add for all tables with practice_id that don't have an index
```

---

## Phase 5: Monitor & Document (Ongoing)

### Monitoring Queries

**Check RLS status:**
```sql
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY rls_enabled, tablename;
```

**Check policy effectiveness:**
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Documentation

1. **Update schema documentation** with RLS policy descriptions
2. **Document super admin access patterns** if they need bypass
3. **Create runbook** for adding new tables with practice_id
4. **Add to onboarding docs** for new developers

---

## Rollback Plan

If issues arise after RLS policy creation:

### Disable RLS on specific table:
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Drop specific policy:
```sql
DROP POLICY IF EXISTS policy_name ON table_name;
```

### Emergency: Disable all RLS (not recommended):
```sql
-- Only if critical production issue
ALTER TABLE absences DISABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_requests DISABLE ROW LEVEL SECURITY;
-- etc...
```

---

## Success Criteria

- [ ] All 3 backup tables deleted successfully
- [ ] 37 new RLS policies created without errors
- [ ] Cross-practice data isolation verified for 10+ tables
- [ ] No application errors in production logs
- [ ] Query performance remains acceptable (< 100ms for typical queries)
- [ ] Super admin users can still access necessary data
- [ ] All automated tests pass
- [ ] Database backup taken before and after changes

---

## Timeline

**Total estimated time:** 60 minutes + testing

1. **Preparation (5 min):** Review scripts, take database backup
2. **Deletion (5 min):** Execute table deletion script
3. **RLS Creation (15 min):** Execute policy creation in batches
4. **Testing (30 min):** Run verification tests
5. **Indexing (10 min):** Create performance indexes
6. **Documentation (ongoing):** Update docs and monitors

---

## Contact & Support

If you encounter issues:
1. Check `DATABASE_AUDIT_REPORT.md` for table details
2. Review policy definitions in `create-missing-rls-policies.sql`
3. Test isolation with `verify-practice-isolation.sql`
4. Rollback using the plan above if needed

---

## Next Steps After Completion

1. **Monitor error logs** for 48 hours
2. **Performance test** with production load
3. **Train team** on RLS policy patterns
4. **Document** any super admin bypass logic needed
5. **Schedule review** of RLS policies quarterly
