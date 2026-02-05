# Project Rules for v0

## Database Migration Verification

After executing any database migration script (SQL files in /scripts/):

1. **Always verify** the migration succeeded by testing the affected schema
2. **Query the database** to confirm columns/tables exist
3. **Use the /api/verify-schema endpoint** or create a targeted test query
4. **Only proceed** with code that depends on the migration after verification passes
5. **If verification fails**, re-run the migration or investigate the error before continuing
6. **Never assume** a migration worked - always test it

### Verification Methods

#### Method 1: Use verify-schema endpoint
```
GET /api/verify-schema
```

#### Method 2: Direct SQL query
```sql
-- Test if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'table_name' 
AND column_name = 'new_column';
```

#### Method 3: Test SELECT on affected table
```sql
-- Try to select the new column
SELECT new_column FROM table_name LIMIT 1;
```

### Workflow

```
1. Write migration script → 2. Execute via SystemAction → 3. VERIFY SUCCESS → 4. Write dependent code
                                                              ↓ (if failed)
                                                         Investigate & retry
```
