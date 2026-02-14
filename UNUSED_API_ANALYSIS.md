# Unused API Routes Analysis

**Generated:** ${new Date().toISOString()}  
**Purpose:** Identify potentially unused, development-only, or old API endpoints that can be safely removed

---

## Summary

| Category | Count | Action |
|----------|-------|--------|
| **Confirmed Unused** | 2 | Can delete immediately |
| **Development/Debug Only** | 3 | Keep but document |
| **Testing/Internal Only** | 4 | Review for deletion |
| **Cron Jobs** | 4 | Keep (automated tasks) |
| **Active APIs** | 200+ | Keep |

---

## 1. CONFIRMED UNUSED - SAFE TO DELETE

### `/api/generate-header-image`
- **File:** `app/api/generate-header-image/route.ts`
- **Purpose:** Super Admin tool to generate header images using fal.ai
- **Usage:** NOT FOUND in any component or page
- **Status:** UNUSED
- **Action:** **DELETE**
- **Reason:** No references found in codebase. Appears to be an old feature.

### `/api/verify-schema`
- **File:** `app/api/verify-schema/route.ts`
- **Purpose:** Verify database schema changes (arbeitsplatz_ids column migration)
- **Usage:** NOT FOUND in any component or page
- **Status:** COMPLETED MIGRATION VERIFICATION
- **Action:** **DELETE**
- **Reason:** This was a one-time migration verification. The migration is complete.

---

## 2. DEVELOPMENT/DEBUG ENDPOINTS - KEEP BUT DOCUMENT

### `/api/auth/dev-user`
- **File:** `app/api/auth/dev-user/route.ts`
- **Usage:** Found in `contexts/user-context.tsx`
- **Purpose:** Development user for testing
- **Status:** ACTIVE in development
- **Action:** **KEEP** (but ensure it's disabled in production)
- **Security Note:** Must check this is disabled in production environment

### `/api/csrf`
- **File:** `app/api/csrf/route.ts`
- **Usage:** Only references itself
- **Purpose:** CSRF token generation
- **Status:** Utility endpoint
- **Action:** **KEEP** (security feature)
- **Note:** May be unused but is a security best practice endpoint

### `/api/db/health`
- **File:** `app/api/db/health/route.ts`
- **Usage:** Only references itself
- **Purpose:** Database health monitoring
- **Status:** Monitoring endpoint
- **Action:** **KEEP** (ops/monitoring)
- **Note:** Used for health checks and monitoring, may be called externally

---

## 3. TESTING/INTERNAL ENDPOINTS - REVIEW FOR DELETION

### `/api/super-admin/form-db-sync`
- **File:** `app/api/super-admin/form-db-sync/route.ts`
- **Usage:** Found in `components/testing/form-db-sync-panel.tsx`
- **Purpose:** Form-database synchronization testing
- **Status:** Used in testing panel
- **Action:** **REVIEW** - Is this still needed?
- **Recommendation:** Keep only if actively used in development

### `/api/super-admin/form-scan`
- **File:** `app/api/super-admin/form-scan/route.ts`
- **Usage:** Found in `components/testing/form-db-sync-panel.tsx`
- **Purpose:** Scan forms for database mismatches
- **Status:** Used in testing panel
- **Action:** **REVIEW** - Is this still needed?
- **Recommendation:** Keep only if actively used in development

### `/api/super-admin/ui-tests`
- **File:** `app/api/super-admin/ui-tests/route.ts`
- **Usage:** Found in `components/super-admin/ui-items-test-manager.tsx`
- **Purpose:** UI testing management
- **Status:** Used in super admin testing
- **Action:** **REVIEW** - Is this still needed?

### `/api/super-admin/ui-items`
- **File:** `app/api/super-admin/ui-items/route.ts`
- **Usage:** Found in `components/super-admin/ui-items-test-manager.tsx`
- **Purpose:** UI items testing
- **Status:** Used in super admin testing
- **Action:** **REVIEW** - Is this still needed?

---

## 4. CRON/SCHEDULED JOBS - KEEP

These are automated background tasks that run on schedules:

### `/api/cron/verify-backups`
- **Purpose:** Verify backup integrity (scheduled)
- **Status:** ACTIVE CRON JOB
- **Action:** **KEEP**

### `/api/cron/todo-reminders`
- **Purpose:** Send todo reminder notifications (scheduled)
- **Status:** ACTIVE CRON JOB
- **Action:** **KEEP**

### `/api/cron/daily-backup`
- **Purpose:** Daily automated backups (scheduled)
- **Status:** ACTIVE CRON JOB
- **Action:** **KEEP**

### `/api/cron/check-email-uploads`
- **Purpose:** Check for email uploads (scheduled)
- **Status:** ACTIVE CRON JOB
- **Action:** **KEEP**

---

## 5. MIGRATION/SEED ENDPOINTS - REVIEW

### `/seed`
- **File:** `app/seed/route.ts`
- **Usage:** Found in `lib/tickets/hooks.ts`
- **Purpose:** Database seeding (tickets config)
- **Status:** Used for initial data setup
- **Action:** **KEEP** (but only for initial setup)
- **Note:** May want to make this admin-only or disable after setup

---

## API Usage Statistics

### Total API Routes Found: ~250+

### Most Actively Used APIs (10+ references):
- `/api/practices/[practiceId]/*` - Practice management (heavily used)
- `/api/super-admin/*` - Super admin management (many endpoints)
- `/api/users/[userId]/*` - User management (heavily used)
- `/api/tickets/*` - Ticket system (active)
- `/api/knowledge-base/*` - Knowledge base (active)
- `/api/workflows/*` - Workflow management (active)

### Categories by Usage:
- **Super Admin APIs:** ~50 endpoints (all active)
- **Practice APIs:** ~80 endpoints (all active)
- **User APIs:** ~30 endpoints (all active)
- **Workflow APIs:** ~15 endpoints (all active)
- **Testing APIs:** ~10 endpoints (review needed)
- **Cron APIs:** 4 endpoints (all active)
- **Development APIs:** 3 endpoints (keep with caution)
- **Unused APIs:** 2 endpoints (DELETE)

---

## Immediate Action Items

### Priority 1: DELETE NOW
1. Delete `/api/generate-header-image/route.ts`
2. Delete `/api/verify-schema/route.ts`

### Priority 2: VERIFY & DECIDE
1. Check if `/api/auth/dev-user` is disabled in production
2. Review testing endpoints - are they still needed?
   - `/api/super-admin/form-db-sync`
   - `/api/super-admin/form-scan`
   - `/api/super-admin/ui-tests`
   - `/api/super-admin/ui-items`

### Priority 3: DOCUMENT
1. Document that `/api/csrf` is for security (even if unused)
2. Document that `/api/db/health` is for monitoring
3. Document all cron job endpoints

---

## Search Methodology

1. **Found all API routes** - Used Grep to find all route.ts files with HTTP methods
2. **Searched for usage** - Used Grep to find fetch() calls referencing each API
3. **Cross-referenced** - Checked if API is only referenced by itself
4. **Categorized** - Grouped by purpose and usage pattern

---

## Notes

- The codebase has excellent API coverage with ~250+ endpoints
- Most APIs are actively used and well-integrated
- Only 2 confirmed unused endpoints found (very clean!)
- Testing/development endpoints should be reviewed periodically
- Consider adding API documentation for maintenance

---

## Next Steps

1. **Delete the 2 unused APIs** (generate-header-image, verify-schema)
2. **Review testing APIs** with the team - decide if still needed
3. **Add environment checks** for dev-user endpoint
4. **Document remaining utility endpoints** (csrf, db/health)
5. **Set up periodic API audits** (quarterly review recommended)

---

## Files to Delete

```bash
# Safe to delete immediately:
app/api/generate-header-image/route.ts
app/api/verify-schema/route.ts
```

---

**Analysis Complete**
