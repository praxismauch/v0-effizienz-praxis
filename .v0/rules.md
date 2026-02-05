# Project Rules for v0

## Database Migration Verification

After executing any database migration script via SystemAction:

1. **Always verify** the migration succeeded by querying the affected table/column
2. Use a SELECT query or create a test endpoint to confirm schema changes exist
3. Report verification result (SUCCESS or FAILED) before proceeding
4. If verification fails, investigate and re-run the migration before writing dependent code
5. Never assume a migration worked - always test it

### Verification Example

```sql
-- Test if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'table_name' 
AND column_name = 'new_column';
```

### Verification Endpoint

Use `/api/verify-schema` endpoint when available, or create targeted test queries for specific migrations.
