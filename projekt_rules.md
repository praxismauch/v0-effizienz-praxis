## Workflows Database Schema

### workflows table
```
column_name                   | data_type                | is_nullable | column_default
------------------------------|--------------------------|-------------|----------------
id                            | text                     | NO          | null
name                          | text                     | NO          | null
description                   | text                     | YES         | null
practice_id                   | text                     | NO          | null
created_by                    | text                     | YES         | null
status                        | text                     | YES         | 'active'::text
trigger_type                  | text                     | YES         | null
is_template                   | boolean                  | YES         | false
total_steps                   | integer                  | YES         | 0
completed_steps               | integer                  | YES         | 0
progress_percentage           | integer                  | YES         | 0
started_at                    | timestamp with time zone | YES         | null
completed_at                  | timestamp with time zone | YES         | null
created_at                    | timestamp with time zone | YES         | now()
updated_at                    | timestamp with time zone | YES         | now()
deleted_at                    | timestamp with time zone | YES         | null
hide_items_from_other_users   | boolean                  | YES         | false
template_id                   | text                     | YES         | null
practiceid                    | text                     | YES         | null
priority                      | text                     | YES         | 'medium'::text
category_id                   | text                     | YES         | null
```

**DOES NOT HAVE**: story, category (uses category_id instead)

**TABLES THAT DO NOT EXIST**:
- `workflow_categories` - DOES NOT EXIST (category_id stores plain text like "Organisation" or UUIDs)
- `workflow_steps` - DOES NOT EXIST (do NOT try to join with this table)

**CHECK CONSTRAINTS**:
- `workflows_status_check`: status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'archived')

### Important Field Mappings (Code → Database)
- Frontend sends `category` → Database stores in `category_id`
- Frontend sends `title` → Database stores in `name`
- `practice_id` is TEXT type (not integer)

### Allowed Values
| Column | Allowed Values |
|--------|----------------|
| status | 'draft', 'active', 'paused', 'completed', 'cancelled', 'archived' |
| priority | Any text (commonly: 'low', 'medium', 'high', 'urgent') |

### Notes
- The table has both `practice_id` (NOT NULL) and `practiceid` (nullable) columns - use `practice_id`
- Always use TEXT for practice_id queries: `.eq("practice_id", practiceId)` where practiceId is a string
- **NEVER try to join with `workflow_steps`** - the table does not exist
- **NEVER try to join with `workflow_categories`** - the table does not exist
