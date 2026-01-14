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

## Goals Database Schema

### goals table
```
column_name             | data_type                   | is_nullable | column_default
------------------------|-----------------------------|-------------|---------------------------
id                      | text                        | NO          | gen_random_uuid()::text
practice_id             | text                        | NO          | null
created_by              | text                        | NO          | null
assigned_to             | text                        | YES         | null
parent_goal_id          | text                        | YES         | null (FK → goals.id)
title                   | text                        | NO          | null
description             | text                        | YES         | null
goal_type               | text                        | NO          | null
target_value            | numeric                     | YES         | null
current_value           | numeric                     | YES         | 0
unit                    | text                        | YES         | null
progress_percentage     | integer                     | YES         | 0
status                  | text                        | YES         | 'in-progress'::text
priority                | text                        | YES         | 'medium'::text
start_date              | date                        | YES         | null
end_date                | date                        | YES         | null
completed_at            | timestamp without time zone | YES         | null
is_private              | boolean                     | YES         | true
metadata                | jsonb                       | YES         | '{}'::jsonb
created_at              | timestamp without time zone | YES         | now()
updated_at              | timestamp without time zone | YES         | now()
display_order           | integer                     | YES         | 0
linked_parameter_id     | text                        | YES         | null (FK → analytics_parameters.id)
show_on_dashboard       | boolean                     | YES         | false
deleted_at              | timestamp with time zone    | YES         | null
practiceid              | text                        | YES         | null (DUPLICATE - do not use)
```

**TABLES THAT DO NOT EXIST**:
- `goal_milestones` - DOES NOT EXIST (use parent_goal_id for hierarchy)
- `key_results` - DOES NOT EXIST

**RELATED TABLES THAT EXIST**:
- `goal_templates` - Templates for creating goals
- `user_goal_order` - Custom ordering per user

### CHECK Constraints
| Column | Allowed Values |
|--------|----------------|
| goal_type | `'practice'`, `'personal'`, `'team'` |
| priority | `'low'`, `'medium'`, `'high'` |
| status | `'not-started'`, `'in-progress'`, `'completed'`, `'cancelled'` |
| progress_percentage | 0-100 (integer) |

### Foreign Keys
- `practice_id` → practices.id
- `parent_goal_id` → goals.id (self-referential for sub-goals)
- `linked_parameter_id` → analytics_parameters.id

### Important Notes
- The table has BOTH `practice_id` (NOT NULL) AND `practiceid` (nullable) - **ALWAYS use `practice_id`**
- `practice_id` is TEXT type (not integer)
- Sub-goals use `parent_goal_id` to reference parent goals
- `created_by` is REQUIRED (NOT NULL) - must pass user ID when creating goals

### Common Issues
- **"null value in column created_by"**: Must pass the user ID when creating a goal
- **"violates check constraint goals_goal_type_check"**: Use only 'practice', 'personal', or 'team'
- **"violates check constraint goals_status_check"**: Use only 'not-started', 'in-progress', 'completed', or 'cancelled'

## Candidates (Hiring) Database Schema

### candidates table
```
column_name            | data_type                   | is_nullable | column_default
-----------------------|-----------------------------|-------------|----------------
id                     | text                        | NO          | gen_random_uuid()::text
practice_id            | text                        | NO          | null
first_name             | text                        | NO          | null
last_name              | text                        | NO          | null
email                  | text                        | NO          | null
phone                  | text                        | YES         | null
mobile                 | text                        | YES         | null
address                | text                        | YES         | null
city                   | text                        | YES         | null
postal_code            | text                        | YES         | null
country                | text                        | YES         | 'Germany'::text
linkedin_url           | text                        | YES         | null
portfolio_url          | text                        | YES         | null
resume_url             | text                        | YES         | null
cover_letter           | text                        | YES         | null
current_position       | text                        | YES         | null
current_company        | text                        | YES         | null
years_of_experience    | integer                     | YES         | null
education              | text                        | YES         | null
skills                 | jsonb                       | YES         | '[]'::jsonb
languages              | jsonb                       | YES         | '[]'::jsonb
certifications         | jsonb                       | YES         | '[]'::jsonb
availability_date      | date                        | YES         | null
salary_expectation     | integer                     | YES         | null
notes                  | text                        | YES         | null
source                 | text                        | YES         | null
status                 | text                        | NO          | 'new'::text
rating                 | integer                     | YES         | null (CHECK: 1-5)
created_by             | text                        | YES         | null
created_at             | timestamp without time zone | YES         | now()
updated_at             | timestamp without time zone | YES         | now()
search_vector          | tsvector                    | YES         | null
documents              | jsonb                       | YES         | '[]'::jsonb
image_url              | text                        | YES         | null
date_of_birth          | date                        | YES         | null
weekly_hours           | numeric                     | YES         | null
first_contact_date     | date                        | YES         | null
deleted_at             | timestamp with time zone    | YES         | null
```

### CHECK Constraints
| Column | Constraint |
|--------|------------|
| rating | CHECK ((rating >= 1) AND (rating <= 5)) |

### Foreign Keys
- `practice_id` → practices(id) ON DELETE CASCADE

### Status Values Used in Pipeline:
| Status Value | Stage Name (German) |
|--------------|---------------------|
| new | Bewerbung eingegangen |
| contacted | Bewerbung eingegangen |
| first_interview | Erstgespräch |
| trial_work | Probearbeiten |
| second_interview | Zweitgespräch |
| offer_extended | Angebot |
| rejected | Abgelehnt |
| archived | Abgelehnt |

### Related Tables

**`hiring_pipeline_stages` table:**
- EXISTS and works
- Columns: id, practice_id, job_posting_id, name, color, stage_order, is_active
- FK: practice_id → practices(id), job_posting_id → job_postings(id)

**`job_postings` table:**
- EXISTS

**TABLES THAT DO NOT EXIST:**
- `hiring_pipeline` - DOES NOT EXIST (use `hiring_pipeline_stages` instead)

### Pipeline Drag & Drop Flow:
1. User drags candidate card to new stage
2. Frontend maps stage name to status value using `stageToStatusMap`
3. PATCH `/api/hiring/candidates/${candidateId}` with `{ status: newStatus }`
4. API updates `candidates.status` column

### Notes:
- `practice_id` is TEXT type
- All JSONB fields (skills, languages, certifications, documents) default to empty array `[]`
- Soft delete via `deleted_at` column
