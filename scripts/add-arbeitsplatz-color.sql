-- Add color column to arbeitsplaetze table
ALTER TABLE arbeitsplaetze 
ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT 'green';

-- Update existing records to have varied colors based on their id
UPDATE arbeitsplaetze 
SET color = CASE 
  WHEN (CAST(SUBSTRING(id::text, 1, 1) AS INT) % 8) = 0 THEN 'green'
  WHEN (CAST(SUBSTRING(id::text, 1, 1) AS INT) % 8) = 1 THEN 'blue'
  WHEN (CAST(SUBSTRING(id::text, 1, 1) AS INT) % 8) = 2 THEN 'purple'
  WHEN (CAST(SUBSTRING(id::text, 1, 1) AS INT) % 8) = 3 THEN 'orange'
  WHEN (CAST(SUBSTRING(id::text, 1, 1) AS INT) % 8) = 4 THEN 'red'
  WHEN (CAST(SUBSTRING(id::text, 1, 1) AS INT) % 8) = 5 THEN 'teal'
  WHEN (CAST(SUBSTRING(id::text, 1, 1) AS INT) % 8) = 6 THEN 'pink'
  ELSE 'yellow'
END
WHERE color IS NULL OR color = 'green';
