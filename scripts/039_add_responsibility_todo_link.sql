-- Add responsibility_id column to todos table to link todos with responsibilities
-- A responsibility can have multiple linked todos
-- Removed foreign key constraint since responsibilities table may not exist yet

ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS responsibility_id UUID;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_todos_responsibility_id ON todos(responsibility_id);

-- Comment for documentation
COMMENT ON COLUMN todos.responsibility_id IS 'Links this todo to a responsibility. One responsibility can have multiple todos.';
