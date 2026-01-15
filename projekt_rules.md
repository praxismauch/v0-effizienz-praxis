### Notes
- All `practice_id` and `user_id` columns are TEXT type
- Use `.maybeSingle()` instead of `.single()` when data might not exist
- Location types: 'office', 'homeoffice', 'mobile' (UI labels: Praxis vor Ort, Homeoffice, Mobil/Außentermin)

// Adding comprehensive database audit results

## Responsibilities Database Schema

### responsibilities table
```
column_name                        | data_type                   | is_nullable | column_default
-----------------------------------|-----------------------------| -----------|----------------
id                                 | text                        | NO          | gen_random_uuid()
practice_id                        | text                        | NO          | null
name                               | text                        | NO          | null
description                        | text                        | YES         | null
group_name                         | text                        | YES         | null
estimated_time_minutes             | integer                     | YES         | null
estimated_time_period              | text                        | YES         | null
cannot_complete_during_consultation| boolean                     | YES         | false
is_active                          | boolean                     | YES         | true
created_at                         | timestamp with time zone    | YES         | now()
updated_at                         | timestamp with time zone    | YES         | now()
```

**CHECK Constraints:**
| Column | Allowed Values |
|--------|----------------|
| estimated_time_period | `'Monat'`, `'Quartal'`, `'Jahr'` (GERMAN!) |

**Important Field Mapping:**
- Database uses `group_name` → API should return `category: group_name` for frontend compatibility
- Frontend expects `category` but database stores `group_name`

## Todos Database Schema

### todos table
**CHECK Constraints:**
| Column | Allowed Values |
|--------|----------------|
| status | `'offen'`, `'in_bearbeitung'`, `'erledigt'`, `'abgebrochen'` (GERMAN!) |

**Notes:**
- Has both `practice_id` AND `practiceid` columns - **ALWAYS use `practice_id`**
- Default status: `'offen'`

## Employee Appraisals Database Schema

### employee_appraisals table
```
column_name     | data_type | is_nullable
----------------|-----------|------------
id              | text      | NO
practice_id     | text      | NO
employee_id     | text      | NO (NOT team_member_id!)
appraiser_id    | text      | YES
appraisal_date  | date      | YES
appraisal_type  | text      | YES
status          | text      | YES
overall_rating  | numeric   | YES
skill_rating_1-10| numeric  | YES
```

### skill_definitions table
```
column_name           | data_type | is_nullable
----------------------|-----------|------------
id                    | text      | NO
practice_id           | text      | NO
name                  | text      | NO
category              | text      | YES
description           | text      | YES
level_0-3_description | text      | YES
is_active             | boolean   | YES
display_order         | integer   | YES
```

## Calendar Events Database Schema

**CHECK Constraints:**
| Column | Allowed Values |
|--------|----------------|
| type | `'meeting'`, `'training'`, `'maintenance'`, `'holiday'`, `'announcement'`, `'other'` |
| priority | `'low'`, `'medium'`, `'high'` |
| recurrence_type | `'none'`, `'daily'`, `'weekly'`, `'monthly'`, `'yearly'` |

## CRITICAL: Tables with INTEGER or UUID practice_id (NOT TEXT)

These tables use INTEGER or UUID for practice_id instead of TEXT:

| Table | practice_id Type | Fix Needed |
|-------|-----------------|------------|
| academy_courses | INTEGER | Use `Number.parseInt(practiceId)` |
| academy_enrollments | INTEGER | Use `Number.parseInt(practiceId)` |
| academy_user_badges | INTEGER | Use `Number.parseInt(practiceId)` |
| user_preferences | INTEGER | Use `Number.parseInt(practiceId)` |
| user_self_checks | INTEGER | Use `Number.parseInt(practiceId)` |
| roadmap_idea_feedback | INTEGER | Use `Number.parseInt(practiceId)` |
| cockpit_card_settings | UUID | Different handling needed |
| role_permissions | UUID | Different handling needed |
| smtp_settings | UUID | Different handling needed |
| user_profiles | UUID | Different handling needed |

## User ID Column Variations

Different tables use different column names for user references:

| Table | Column Name | Type |
|-------|-------------|------|
| time_blocks, time_stamps, overtime_accounts | `user_id` | TEXT |
| employee_appraisals | `employee_id` | TEXT |
| shift_schedules, employee_availability | `team_member_id` | UUID |
| compliance_violations | `team_member_id` | UUID |
| contracts | `team_member_id` | TEXT |

## API Pattern: createAdminClient() is ASYNC

**CRITICAL**: `createAdminClient()` returns a Promise and MUST be awaited:

```typescript
// WRONG - causes "TypeError: i.from is not a function"
const supabase = createAdminClient()

// CORRECT
const supabase = await createAdminClient()
```

## Hiring / Personalsuche Database Schema

### candidates table
```
column_name         | data_type                   | is_nullable
--------------------|-----------------------------|-----------
id                  | uuid                        | NO
practice_id         | text                        | NO
first_name          | text                        | YES
last_name           | text                        | YES
email               | text                        | YES
phone               | text                        | YES
mobile              | text                        | YES
address             | text                        | YES
city                | text                        | YES
postal_code         | text                        | YES
country             | text                        | YES
linkedin_url        | text                        | YES
portfolio_url       | text                        | YES
resume_url          | text                        | YES
cover_letter        | text                        | YES
current_position    | text                        | YES
current_company     | text                        | YES
years_of_experience | integer                     | YES
education           | text                        | YES
skills              | jsonb                       | YES
languages           | jsonb                       | YES
certifications      | jsonb                       | YES
availability_date   | date                        | YES
salary_expectation  | text                        | YES
notes               | text                        | YES
source              | text                        | YES
status              | text                        | YES
rating              | integer                     | YES
created_by          | text                        | YES
created_at          | timestamp with time zone    | YES
updated_at          | timestamp with time zone    | YES
documents           | jsonb                       | YES
image_url           | text                        | YES
date_of_birth       | date                        | YES
weekly_hours        | numeric                     | YES
first_contact_date  | date                        | YES
deleted_at          | timestamp with time zone    | YES
```

### applications table
```
column_name      | data_type                   | is_nullable
-----------------|-----------------------------|-----------
id               | uuid                        | NO
job_posting_id   | uuid                        | YES
candidate_id     | uuid                        | YES
practice_id      | text                        | YES
status           | text                        | YES
stage            | text                        | YES
applied_at       | timestamp with time zone    | YES
reviewed_at      | timestamp with time zone    | YES
reviewed_by      | uuid                        | YES
notes            | text                        | YES
rejection_reason | text                        | YES
created_at       | timestamp with time zone    | YES
updated_at       | timestamp with time zone    | YES
deleted_at       | timestamp with time zone    | YES
```

### Existing Hiring Tables (Confirmed in DB)
- `candidates` - Candidate profiles
- `applications` - Job applications
- `job_postings` - Job listings
- `hiring_pipeline_stages` - Pipeline stage definitions
- `questionnaires` - Candidate questionnaires
- `interview_templates` - Interview template definitions

### Tables NOT in Database (Do not query)
- `interviews` - Does NOT exist, removed from details API
- `questionnaire_responses` - May not exist, handle errors gracefully

### Hiring API Patterns

**Always include soft-delete filter:**
```typescript
.is("deleted_at", null)
```

**Candidate status values:**
- `new` - New candidate
- `screening` - Being screened
- `interview` - In interview process
- `offer` - Offer stage
- `hired` - Hired
- `rejected` - Rejected
- `archived` - Archived

**Field name mapping:**
- API returns `name` combined from `first_name` + `last_name`
- Database stores `first_name` and `last_name` separately

// ... rest of code here ...
