# Script Cleanup Guide

## Quick Decision Tree

### Should I delete this script?

**YES - Delete if:**
- ✅ It's a sample/demo data script that's been cleaned up
- ✅ It's a duplicate (older version when V2/V3 exists)
- ✅ File is empty or completely commented out

**NO - Keep if:**
- ❌ Creates a table (`create-*-table.sql`)
- ❌ Adds columns/indexes (`add-*-column.sql`, `add-*-index.sql`)
- ❌ Fixes security/RLS (`fix-*-rls.sql`)
- ❌ Sets up default data needed for app to function

**ARCHIVE - Move to scripts/archive/ if:**
- 📦 Successfully executed one-time migration
- 📦 Historical record needed for reference
- 📦 Not needed for fresh installations

## Current Status of Your Scripts

### ✅ Successfully Executed (Can Archive)
\`\`\`
scripts/create-default-teams-final.sql
scripts/add-ai-enabled-to-practices.sql  
scripts/ensure-datenspende-columns.sql
\`\`\`

### ❌ Can Be Deleted
\`\`\`
scripts/seed-sample-changelog.sql (ALREADY DELETED)
\`\`\`

### ⚠️ Needs Investigation
\`\`\`
scripts/create-blog-posts-table.sql - Returns error "already exists"
- Check if this is the only version or if there's a V2
- If policies already exist, this is fine - no action needed
\`\`\`

## Cleanup Commands

\`\`\`bash
# Create archive folder
mkdir -p scripts/archive

# Move completed migrations to archive
mv scripts/create-default-teams-final.sql scripts/archive/
mv scripts/add-ai-enabled-to-practices.sql scripts/archive/
mv scripts/ensure-datenspende-columns.sql scripts/archive/

# Note: seed-sample-changelog.sql already deleted
\`\`\`

## Important Notes

1. **Don't delete `create-*` scripts** - Needed for fresh database installations
2. **Keep all RLS/security scripts** - May need to re-run after schema changes
3. **Version tracking** - If you have V1, V2, V3 of same script, only keep latest
4. **Test on staging first** - Always test cleanup on staging database

## Script Count Summary

- Total scripts: 121
- Core table creation: ~30
- Column additions: ~40  
- RLS/Security fixes: ~15
- Migrations: ~20
- Can be archived: ~5
- Can be deleted: ~1-2
