#!/usr/bin/env node
/**
 * Codebase Cleanup Script
 * 
 * This script safely removes:
 * - Completed audit and status documentation files
 * - Duplicate documentation files
 * - Obsolete configuration files
 * 
 * Run with: node scripts/cleanup-codebase.ts
 */

import fs from 'fs';
import path from 'path';

const filesToDelete = {
  // Completed Audit Documentation (Root)
  root: [
    'API_COLUMN_AUDIT_COMPLETE.md',
    'CLIENT_SERVER_FIXES_APPLIED.md',
    'CLIENT_SERVER_ISSUES_FIX.md',
    'CRITICAL_FIXES_DOCUMENTATION.md',
    'DATABASE_ANALYSIS_REPORT.md',
    'DATABASE_AUDIT_COMPLETE.md',
    'DATABASE_AUDIT_REPORT.md',
    'DATABASE_SECURITY_COMPLETE.md',
    'FORM_AUDIT_REPORT.md',
    'PLACEHOLDER_DATA_AUDIT.md',
    'QUERY_PERFORMANCE_FIXES.md',
    'RLS_EXECUTION_PLAN.md',
    'RLS_POLICIES_COMPLETED.md',
    'RLS_POLICIES_STATUS.md',
    'ROUTE_FIX_DOCUMENTATION.md',
    'SECURITY-FIXES.md',
    'projekt_rules.md', // Duplicate of PROJECT_RULES.md
  ],
  
  // Completed Audit Documentation (docs/)
  docs: [
    'docs/BUNDLE_OPTIMIZATION.md',
    'docs/COMPREHENSIVE_MIGRATION_STATUS.md',
    'docs/CURRENT_ISSUES_SUMMARY.md',
    'docs/DATABASE_COLUMN_ANALYSIS_COMPLETE.md',
    'docs/DATA_FLOW_VERIFICATION.md',
    'docs/IMPORT_VERIFICATION.md',
    'docs/IMPROVEMENTS_APPLIED.md',
    'docs/INSTANT_UPDATES_FIX.md',
    'docs/LOGIN_ERROR_FIX_SUMMARY.md',
    'docs/MEMORY_LEAK_PREVENTION.md',
    'docs/MIGRATION_PROGRESS.md',
    'docs/MIGRATION_VERIFICATION_REPORT.md',
    'docs/MISSING_COLUMNS_ANALYSIS.md',
    'docs/OPTIMIZATIONS_APPLIED.md',
    'docs/OPTIMIZATION_ACTION_PLAN.md',
    'docs/PERFORMANCE_ANALYSIS.md',
    'docs/PERFORMANCE_SUMMARY.md',
    'docs/PRACTICE_ID_VALIDATION_REPORT.md',
    'docs/PRE_DEPLOY_VERIFICATION.md',
    'docs/PROJECT_AUDIT.md',
    'docs/PROVIDER_HIERARCHY_FIX.md',
    'docs/REFACTOR_COMPLETE.md',
    'docs/SECURITY_FIXES_REQUIRED.md',
    'docs/TEAM_PAGES_FIX_SUMMARY.md',
    'docs/TEAM_PAGES_STATUS.md',
    'docs/TROUBLESHOOTING-SCHEMA-CACHE.md',
    'docs/UNUSED_COLUMNS_ANALYSIS.md',
    'docs/UUID_ERROR_FIX_COMPLETE.md',
    'docs/sql-tables-without-components-audit.md',
  ],

  // VSCode User Settings (shouldn't be in repo)
  other: [
    'User/settings.json',
  ],
};

// Files to KEEP (for reference)
const filesToKeep = [
  'PROJECT_RULES.md', // Main project rules
  'README-RATE-LIMITING.md', // Active feature docs
  'README_SYSTEM_TRACKING.md',
  'README_TODO_REMINDERS.md',
  'SUPER_ADMIN_SETUP.md',
  'EMAIL_CONFIRMATION_SETUP.md',
  'HOSTINGER_SMTP_SETUP.md',
  'MULTI_PRACTICE_MIGRATION.md',
  'PERFORMANCE_IMPROVEMENTS.md',
  'app/super-admin/README.md',
  'docs/CALENDAR_SETUP.md',
  'docs/CONTEXT_PROVIDER_GUIDELINES.md',
  'docs/DATABASE_SCHEMA.md',
  'docs/DESIGN_SYSTEM.md',
  'docs/RULES.md',
  'docs/SERVER_FIRST_MIGRATION_GUIDE.md',
  'docs/SOFT_DELETE_GUIDE.md',
  'docs/SUPABASE_DEPLOYMENT.md',
  'docs/UUID_FIX_GUIDE.md',
  'docs/sidebar-preferences.md',
  'docs/video-production-guide.md',
  'docs/video-scripts/*',
];

let deletedCount = 0;
let skippedCount = 0;
let errorCount = 0;

console.log('🧹 Starting Codebase Cleanup...\n');

// Function to delete a file safely
function deleteFile(filePath: string, category: string) {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✅ Deleted [${category}]: ${filePath}`);
      deletedCount++;
    } else {
      console.log(`⏭️  Skipped (not found): ${filePath}`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`❌ Error deleting ${filePath}:`, error);
    errorCount++;
  }
}

// Delete files by category
Object.entries(filesToDelete).forEach(([category, files]) => {
  console.log(`\n📁 Processing ${category.toUpperCase()} files...`);
  files.forEach(file => deleteFile(file, category));
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Cleanup Summary:');
console.log('='.repeat(60));
console.log(`✅ Deleted: ${deletedCount} files`);
console.log(`⏭️  Skipped: ${skippedCount} files (not found)`);
console.log(`❌ Errors: ${errorCount} files`);
console.log('='.repeat(60));

if (deletedCount > 0) {
  console.log('\n✨ Cleanup completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review the changes');
  console.log('   2. Test the application');
  console.log('   3. Commit the changes if everything works');
} else {
  console.log('\n⚠️  No files were deleted. They may have already been removed.');
}

console.log('\n🔒 Files kept for reference:');
filesToKeep.slice(0, 10).forEach(file => console.log(`   - ${file}`));
if (filesToKeep.length > 10) {
  console.log(`   ... and ${filesToKeep.length - 10} more files`);
}
