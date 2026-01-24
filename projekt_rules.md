### Notes
- All `practice_id` and `user_id` columns are TEXT type
- Use `.maybeSingle()` instead of `.single()` when data might not exist
- Location types: 'office', 'homeoffice', 'mobile' (UI labels: Praxis vor Ort, Homeoffice, Mobil/Außentermin)

// Adding comprehensive database audit results

## Responsibilities Database Schema

### responsibilities table
\`\`\`
column_name                        | data_type                   | is_nullable | column_default
-----------------------------------|-----------------------------| -----------|----------------
id                                 | text                        | NO          | gen_random_uuid()
practice_id                        | text                        | NO          | null
name                               | text                        | NO          | null
description                        | text                        | YES         | null
group_name                         | text                        | YES         | null
responsible_user_id                | text                        | YES         | null
deputy_user_id                     | text                        | YES         | null
team_member_ids                    | jsonb                       | YES         | '[]'
assigned_teams                     | jsonb                       | YES         | '[]'
priority                           | varchar(20)                 | YES         | 'medium'
suggested_hours_per_week           | numeric                     | YES         | null
status                             | varchar(50)                 | YES         | null
estimated_time_amount              | numeric                     | YES         | null
estimated_time_period              | text                        | YES         | null
cannot_complete_during_consultation| boolean                     | YES         | false
calculate_time_automatically       | boolean                     | YES         | false
optimization_suggestions           | text                        | YES         | null
is_active                          | boolean                     | YES         | true
assigned_to                        | uuid                        | YES         | null
created_by                         | text                        | YES         | null
created_at                         | timestamp with time zone    | YES         | now()
updated_at                         | timestamp with time zone    | YES         | now()
deleted_at                         | timestamp with time zone    | YES         | null
\`\`\`

**Priority Values:**
- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority

**Assignment Fields:**
- `responsible_user_id` - Primary responsible team member ID
- `deputy_user_id` - Deputy/backup team member ID
- `team_member_ids` - JSONB array of additional team member IDs
- `assigned_teams` - JSONB array of team IDs for team-based assignment

**CHECK Constraints:**
| Column | Allowed Values |
|--------|----------------|
| estimated_time_period | `'Monat'`, `'Quartal'`, `'Jahr'` (GERMAN!) |

**Important Field Mapping:**
- Database uses `group_name` → API should return `category: group_name` for frontend compatibility
- Frontend expects `category` but database stores `group_name`

**Indexes:**
- `idx_responsibilities_practice_id` (practice_id)
- `idx_responsibilities_assigned_teams` (assigned_teams) GIN index WHERE deleted_at IS NULL
- `idx_responsibilities_responsible_user` (responsible_user_id) WHERE deleted_at IS NULL

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
\`\`\`
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
\`\`\`

### skill_definitions table
\`\`\`
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
\`\`\`

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

\`\`\`typescript
// WRONG - causes "TypeError: i.from is not a function"
const supabase = createAdminClient()

// CORRECT
const supabase = await createAdminClient()
\`\`\`

## Hiring / Personalsuche Database Schema

### candidates table
\`\`\`
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
deleted_at          | timestamp with time zone    | YES
\`\`\`

### applications table
\`\`\`
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
\`\`\`

### questionnaire_responses table (Created 2026-01-15)
\`\`\`
column_name      | data_type                   | is_nullable
-----------------|-----------------------------|-----------
id               | uuid                        | NO (PK, gen_random_uuid())
practice_id      | text                        | NO (FK -> practices.id)
questionnaire_id | text                        | NO (FK -> questionnaires.id)
candidate_id     | text                        | NO (FK -> candidates.id)
responses        | jsonb                       | YES (default '[]')
status           | varchar(50)                 | YES (default 'pending')
sent_at          | timestamp with time zone    | YES
started_at       | timestamp with time zone    | YES
completed_at     | timestamp with time zone    | YES
score            | numeric(5,2)                | YES
max_score        | numeric(5,2)                | YES
notes            | text                        | YES
created_by       | text                        | YES
created_at       | timestamp with time zone    | YES (default NOW())
updated_at       | timestamp with time zone    | YES (default NOW())
deleted_at       | timestamp with time zone    | YES
\`\`\`

**Status values:** `pending`, `in_progress`, `completed`, `expired`

**Indexes:**
- `idx_questionnaire_responses_practice` (practice_id) WHERE deleted_at IS NULL
- `idx_questionnaire_responses_questionnaire` (questionnaire_id) WHERE deleted_at IS NULL
- `idx_questionnaire_responses_candidate` (candidate_id) WHERE deleted_at IS NULL
- `idx_questionnaire_responses_practice_candidate` (practice_id, candidate_id) WHERE deleted_at IS NULL
- `idx_questionnaire_responses_status` (status) WHERE deleted_at IS NULL
- `idx_questionnaire_responses_sent_at` (sent_at DESC) WHERE deleted_at IS NULL
- `idx_questionnaire_responses_completed_at` (completed_at DESC) WHERE deleted_at IS NULL

### Existing Hiring Tables (Confirmed in DB)
- `candidates` - Candidate profiles
- `applications` - Job applications
- `job_postings` - Job listings
- `hiring_pipeline_stages` - Pipeline stage definitions
- `questionnaires` - Candidate questionnaires
- `interview_templates` - Interview template definitions
- `questionnaire_responses` - Candidate responses to questionnaires (NEW)

### Tables NOT in Database (Do not query)
- `interviews` - Does NOT exist, removed from details API

### Hiring API Patterns

**Always include soft-delete filter:**
\`\`\`typescript
.is("deleted_at", null)
\`\`\`

**Files with soft-delete filters (verified 2026-01-15):**
- `candidates/route.ts` - GET list
- `candidates/[id]/route.ts` - GET, PUT
- `candidates/[id]/details/route.ts` - GET candidate, GET applications
- `candidates/[id]/documents/route.ts` - GET, POST
- `candidates/[id]/convert-to-team/route.ts` - POST
- `job-postings/route.ts` - GET list
- `job-postings/[id]/route.ts` - GET, PUT
- `applications/route.ts` - GET list, POST duplicate check
- `applications/[id]/route.ts` - GET, PUT, DELETE (soft-delete)
- `questionnaires/route.ts` - GET list
- `counts/route.ts` - All count queries
- `ai-analyze-candidates/route.ts` - GET candidates
- `send-questionnaire/route.ts` - GET candidate

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
