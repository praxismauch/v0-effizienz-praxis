-- Add 'to_test' status to tickets table
-- Step 1: Drop the existing CHECK constraint and recreate with the new value
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
  CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed', 'wont_fix', 'to_test'));

-- Step 2: Insert 'to_test' into ticket_statuses configuration table
INSERT INTO ticket_statuses (value, label_de, label_en, color_class, icon_name, sort_order, is_active, is_system)
VALUES ('to_test', 'Zu testen', 'To Test', 'bg-purple-500', 'FlaskConical', 3, true, true)
ON CONFLICT (value) DO UPDATE SET
  label_de = EXCLUDED.label_de,
  label_en = EXCLUDED.label_en,
  color_class = EXCLUDED.color_class,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Step 3: Update sort_order for statuses that come after 'to_test'
UPDATE ticket_statuses SET sort_order = 4 WHERE value = 'resolved';
UPDATE ticket_statuses SET sort_order = 5 WHERE value = 'closed';
UPDATE ticket_statuses SET sort_order = 6 WHERE value = 'wont_fix';
