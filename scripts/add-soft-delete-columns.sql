-- Add deleted_at column to all major tables for soft delete support
-- This migration is idempotent - safe to run multiple times

DO $$ 
DECLARE
  tables_to_update TEXT[] := ARRAY[
    'todos',
    'goals',
    'documents',
    'team_members',
    'teams',
    'rooms',
    'devices',
    'workflows',
    'knowledge_base',
    'contacts',
    'calendar_events',
    'protocols',
    'responsibilities',
    'skills',
    'changelogs',
    'blog_posts',
    'brand_assets',
    'tickets',
    'testing_categories',
    'test_checklist_templates',
    'waitlist',
    'notifications',
    'leitbild',
    'questionnaires',
    'hiring_pipeline_stages',
    'job_postings',
    'hiring_candidates',
    'hiring_applications',
    'popups',
    'contracts',
    'departments',
    'hygiene_plans',
    'kv_abrechnung',
    'roi_analyses',
    'cirs_incidents',
    'orga_categories',
    'interview_templates',
    'staffing_plan',
    'shift_types',
    'surveys',
    'appraisals',
    'sick_leaves',
    'holiday_requests',
    'document_folders',
    'inventory_items',
    'training_courses',
    'training_events',
    'certifications',
    'training_budgets',
    'schedule_templates',
    'staffing_plans',
    'parameter_groups',
    'parameter_values',
    'parameters',
    'translations',
    'roadmap_items',
    'ai_analysis_history',
    'messages',
    'global_parameter_templates',
    'global_parameter_groups',
    'subscription_plans',
    'seo_keywords',
    'ai_training_files',
    'default_teams',
    'ui_test_runs',
    'practice_types',
    'backups',
    'stripe_coupons',
    'bank_transactions',
    'bank_transaction_categories',
    'arbeitsplaetze',
    'arbeitsmittel',
    'competitor_analyses',
    'time_blocks',
    'widgets',
    'document_permissions',
    'org_chart_positions',
    'locations',
    'homeoffice_policies',
    'email_upload_configs',
    'reviews',
    'recruiting_form_fields',
    'dienstplan_schedules',
    'dienstplan_availability'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_to_update
  LOOP
    -- Check if table exists before trying to alter it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      -- Add deleted_at column if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = t AND column_name = 'deleted_at' AND table_schema = 'public'
      ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL', t);
        RAISE NOTICE 'Added deleted_at column to %', t;
      ELSE
        RAISE NOTICE 'Column deleted_at already exists on %', t;
      END IF;
      
      -- Create index on deleted_at if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = t AND indexname = format('idx_%s_deleted_at', t)
      ) THEN
        EXECUTE format('CREATE INDEX idx_%s_deleted_at ON public.%I (deleted_at)', t, t);
        RAISE NOTICE 'Created index idx_%s_deleted_at', t;
      END IF;
    ELSE
      RAISE NOTICE 'Table % does not exist, skipping', t;
    END IF;
  END LOOP;
END $$;
