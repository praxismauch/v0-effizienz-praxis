# Troubleshooting PostgREST Schema Cache Issues

## Problem: PGRST204 Error

If you see an error like:
```
Could not find the 'favorites' column of 'user_sidebar_preferences' in the schema cache
```

This means PostgREST's schema cache is out of date and doesn't recognize recently added columns.

## Quick Fix

Run the schema reload script:

```bash
# From the project root
npm run db:reload-schema
```

Or execute the SQL directly:

```sql
NOTIFY pgrst, 'reload schema';
```

## Why This Happens

PostgREST caches the database schema for performance. When you add new columns to existing tables, PostgREST doesn't automatically detect the changes. You need to explicitly tell it to reload the schema.

## Solutions

### 1. Automatic Schema Reload (Recommended)

The migration scripts should include schema reload commands:

```sql
-- After adding a new column
ALTER TABLE user_sidebar_preferences ADD COLUMN favorites TEXT[] DEFAULT '{}';

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
```

### 2. Manual Schema Reload

If you forgot to include the NOTIFY command in your migration:

```bash
# Execute the reload script
psql $DATABASE_URL -f scripts/reload-schema-cache.sql
```

Or in Supabase dashboard SQL editor:

```sql
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```

### 3. Application-Level Fallback

The application now includes automatic fallbacks:

**Client-Side (components/app-sidebar.tsx)**
- Automatically saves favorites to localStorage when database save fails
- Loads from localStorage if database doesn't have favorites
- Shows warning messages in console

**Server-Side (app/api/users/[userId]/sidebar-preferences/route.ts)**
- Catches PGRST204 errors
- Returns graceful fallback responses
- Logs helpful debugging information

## Prevention

1. **Always include NOTIFY in migrations**
   ```sql
   -- At the end of every migration that changes schema
   NOTIFY pgrst, 'reload schema';
   ```

2. **Use schema reload script**
   Create a `scripts/reload-schema-cache.sql` file:
   ```sql
   NOTIFY pgrst, 'reload schema';
   NOTIFY pgrst, 'reload config';
   ```

3. **Add to package.json**
   ```json
   {
     "scripts": {
       "db:reload-schema": "psql $DATABASE_URL -f scripts/reload-schema-cache.sql"
     }
   }
   ```

## Verification

After running the schema reload, verify the column is recognized:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_sidebar_preferences'
  AND column_name = 'favorites';
```

Expected output:
```
 column_name | data_type | column_default 
-------------+-----------+----------------
 favorites   | ARRAY     | '{}'::text[]
```

## Additional Resources

- [PostgREST Schema Cache Docs](https://postgrest.org/en/stable/schema_cache.html)
- [Supabase Schema Updates](https://supabase.com/docs/guides/api/managing-schemas)
- Project docs: `/docs/sidebar-preferences.md`

## Current Status

✅ Favorites feature now works with fallback to localStorage
✅ Schema reload script available at `scripts/reload-schema-cache.sql`
✅ API handles PGRST204 errors gracefully
✅ Client-side persists favorites even when database save fails
