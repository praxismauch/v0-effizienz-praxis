# Sidebar Preferences System

## Overview

The application sidebar maintains user-specific preferences including expanded/collapsed sections, favorite menu items, and collapse state. These preferences are stored in the `user_sidebar_preferences` table and automatically synced via API.

## Database Schema

**Table:** `user_sidebar_preferences`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | - | Foreign key to `auth.users(id)` |
| `practice_id` | TEXT | - | Practice identifier |
| `expanded_groups` | TEXT[] | `'{}'` | Array of expanded navigation group keys |
| `expanded_items` | JSONB | `'{}'` | JSON object storing expanded state for nested items |
| `is_collapsed` | BOOLEAN | `false` | Whether the sidebar is collapsed |
| `favorites` | TEXT[] | `'{}'` | Array of favorited menu item hrefs |
| `collapsed_sections` | TEXT[] | `'{}'` | Array of collapsed section identifiers |
| `created_at` | TIMESTAMPTZ | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Last update timestamp |

**Unique Constraint:** `(user_id, practice_id)`

## API Endpoints

### GET `/api/users/[userId]/sidebar-preferences`

Fetch sidebar preferences for the authenticated user.

**Query Parameters:**
- `practice_id` (optional): Practice ID, defaults to "1"

**Response:**
```json
{
  "preferences": {
    "expanded_groups": ["overview", "planning", "data"],
    "expanded_items": {},
    "is_collapsed": false,
    "favorites": ["/dashboard", "/calendar"],
    "collapsed_sections": []
  }
}
```

### POST `/api/users/[userId]/sidebar-preferences`

Save sidebar preferences for the authenticated user.

**Request Body:**
```json
{
  "practice_id": "1",
  "expanded_groups": ["overview", "planning"],
  "expanded_items": {},
  "is_collapsed": false,
  "favorites": ["/dashboard"]
}
```

## Component Integration

The `AppSidebar` component automatically:
1. Loads user preferences on mount
2. Debounces updates (500ms delay)
3. Tracks user modifications to avoid saving on initial load
4. Handles errors gracefully with console logging

### Key React State Variables

- `favorites`: Array of favorited menu item hrefs
- `expandedGroups`: Set of expanded navigation group keys
- `expandedItems`: Map of expanded nested items
- `isCollapsed`: Sidebar collapse state
- `preferencesLoaded`: Boolean flag indicating preferences have loaded
- `favoritesModifiedByUser`: Ref tracking if user has modified favorites

## Troubleshooting

### Error: "Could not find the 'favorites' column"

**Cause:** Database schema is missing the `favorites` column.

**Solution:** Run the migration script:
```sql
-- Execute in Supabase SQL Editor or via CLI
\i scripts/add-favorites-column-simple.sql
```

Or manually add the column:
```sql
ALTER TABLE user_sidebar_preferences 
ADD COLUMN IF NOT EXISTS favorites TEXT[] DEFAULT '{}';

UPDATE user_sidebar_preferences 
SET favorites = '{}' 
WHERE favorites IS NULL;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

### Error: "Missing Supabase environment variables"

**Cause:** Environment variables are not configured.

**Solution:** Ensure these variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Error: 500 status when saving preferences

**Causes:**
1. Database schema mismatch (missing columns)
2. RLS policies blocking access
3. Invalid data types being sent

**Debug Steps:**
1. Check browser console for detailed error messages
2. Check server logs for "[v0]" prefixed messages
3. Verify database schema matches expected structure
4. Test RLS policies allow the authenticated user

## Best Practices

1. **Always debounce updates** to avoid excessive database writes
2. **Use refs to track user modifications** to prevent saving default states
3. **Handle errors gracefully** without breaking the UI
4. **Validate data types** before sending to API (arrays, booleans, etc.)
5. **Use transaction-safe upsert** to handle race conditions

## Schema Cache Issues

If PostgREST reports schema cache errors:

```sql
-- Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- Or restart PostgREST/Supabase in production
```

For persistent issues, check:
1. Database connection pooling
2. PostgREST configuration
3. RLS policies on the table
4. Column permissions in Supabase dashboard
