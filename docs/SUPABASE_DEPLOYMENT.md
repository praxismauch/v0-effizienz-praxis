# Supabase Deployment Guide

## Prerequisites

1. Supabase CLI installed: `npm install -g supabase`
2. Supabase project created and linked
3. Environment variables configured

## Step 1: Link Your Project

\`\`\`bash
# Login to Supabase
supabase login

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF
\`\`\`

## Step 2: Commit Current Database State

\`\`\`bash
# Pull current remote schema to local
supabase db pull

# Commit the current state
supabase db remote commit
\`\`\`

## Step 3: Apply Migrations

\`\`\`bash
# Push all migrations to remote database
supabase db push
\`\`\`

This will apply the following migrations in order:
1. `20251216_fix_calendar_rls_recursion.sql` - Fixes infinite recursion in RLS policies
2. `20251216_add_performance_indexes.sql` - Adds indexes for query performance
3. `20251216_add_query_optimizations.sql` - Adds helper functions and triggers

## Step 4: Verify Deployment

\`\`\`bash
# Check migration status
supabase migration list

# Test database connection
supabase db test
\`\`\`

## Step 5: Reset (If Needed)

If you encounter issues and need to reset:

\`\`\`bash
# Reset local database
supabase db reset

# Or reset remote (CAUTION: This deletes all data)
supabase db push --force
\`\`\`

## Rollback

To rollback a migration:

\`\`\`bash
# Revert last migration
supabase migration repair --status reverted 20251216_add_query_optimizations

# Then push
supabase db push
\`\`\`

## Troubleshooting

### RLS Policy Errors

If you see "infinite recursion" errors:
- The migration fixes this by using auth.uid() directly
- Ensure all old policies are dropped before applying new ones

### Performance Issues

After applying indexes:
- Run `ANALYZE` on affected tables
- Monitor query performance with Supabase dashboard
- Check slow query logs

### Connection Timeouts

- Increase timeout in Supabase settings
- Use connection pooling (already configured with Postgres)
- Enable Redis caching (already implemented)

## Environment Variables

Required environment variables:
\`\`\`
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
\`\`\`

## Post-Deployment

1. Clear Redis cache: The application will automatically warm up new cache
2. Monitor error logs for RLS policy violations
3. Check query performance in Supabase dashboard
4. Verify calendar events load correctly
