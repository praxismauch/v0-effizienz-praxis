# Soft Delete System Guide

## Overview

The soft delete system prevents permanent data loss by marking records as deleted instead of removing them from the database. This allows for:

- **Data Recovery**: Restore accidentally deleted items
- **Audit Trails**: Maintain complete history of all data
- **Compliance**: Meet data retention requirements
- **Safety**: Prevent irreversible mistakes

## How It Works

Instead of using `DELETE FROM table`, records are updated with a `deleted_at` timestamp:

\`\`\`sql
-- ❌ Hard delete (permanent)
DELETE FROM todos WHERE id = '123';

-- ✅ Soft delete (recoverable)
UPDATE todos SET deleted_at = NOW() WHERE id = '123';
\`\`\`

## Implementation Details

### Database Changes

All tables now have:
- `deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL` column
- Index on `deleted_at` for query performance

### Querying Data

**Always filter out deleted records:**

\`\`\`typescript
// ✅ Correct - excludes deleted records
const { data } = await supabase
  .from('todos')
  .select('*')
  .is('deleted_at', null)

// ❌ Wrong - includes deleted records
const { data } = await supabase
  .from('todos')
  .select('*')
\`\`\`

### Using the Utility Functions

\`\`\`typescript
import { 
  softDelete, 
  restoreDeleted, 
  getDeletedRecords,
  excludeDeleted 
} from '@/lib/utils/soft-delete'

// Soft delete a record
await softDelete('todos', todoId)

// Restore a deleted record
await restoreDeleted('todos', todoId)

// Get all deleted records
const deleted = await getDeletedRecords('todos')

// Query with automatic filtering
const { data } = await supabase
  .from('todos')
  .select('*')
  .match(excludeDeleted())
\`\`\`

## API Route Pattern

### DELETE Route Example

\`\`\`typescript
// app/api/todos/[id]/route.ts
import { softDelete } from '@/lib/utils/soft-delete'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete instead of permanent delete
    const deleted = await softDelete('todos', params.id)
    
    return Response.json(deleted)
  } catch (error) {
    return Response.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    )
  }
}
\`\`\`

### GET Route Example

\`\`\`typescript
// app/api/todos/route.ts
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createServerClient()
  
  // Always filter deleted records
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .is('deleted_at', null)  // <-- Filter deleted
    .order('created_at', { ascending: false })

  if (error) throw error
  return Response.json(data)
}
\`\`\`

## Frontend Patterns

### Showing Deleted Items (Trash/Recycle Bin)

\`\`\`typescript
'use client'

import { useState } from 'react'
import { getDeletedRecords, restoreDeleted } from '@/lib/utils/soft-delete'

export function DeletedTodosView() {
  const [deleted, setDeleted] = useState([])

  async function loadDeleted() {
    const data = await getDeletedRecords('todos')
    setDeleted(data)
  }

  async function restore(id: string) {
    await restoreDeleted('todos', id)
    loadDeleted() // Refresh list
  }

  return (
    <div>
      {deleted.map(todo => (
        <div key={todo.id}>
          {todo.title}
          <button onClick={() => restore(todo.id)}>
            Restore
          </button>
        </div>
      ))}
    </div>
  )
}
\`\`\`

### Delete Confirmation Dialog

\`\`\`typescript
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function DeleteConfirmDialog({ 
  open, 
  onOpenChange, 
  onConfirm 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Wirklich löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Dieser Eintrag wird gelöscht, kann aber später wiederhergestellt werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
\`\`\`

## Maintenance

### Permanent Deletion

Soft-deleted records older than 30 days can be permanently removed:

\`\`\`typescript
import { permanentlyDeleteOldRecords } from '@/lib/utils/soft-delete'

// Delete records older than 30 days
await permanentlyDeleteOldRecords('todos', 30)
\`\`\`

### Cron Job (Optional)

Create a cron job to automatically clean up old deleted records:

\`\`\`typescript
// app/api/cron/cleanup-deleted/route.ts
import { permanentlyDeleteOldRecords } from '@/lib/utils/soft-delete'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tables = ['todos', 'goals', 'documents', 'team_members']
  const results = []

  for (const table of tables) {
    const count = await permanentlyDeleteOldRecords(table, 30)
    results.push({ table, deleted: count })
  }

  return Response.json({ results })
}
\`\`\`

## Migration Checklist

- [x] Run `implement-soft-delete-system.sql` to add columns and indexes
- [ ] Update all DELETE API routes to use `softDelete()`
- [ ] Update all GET/SELECT queries to filter `WHERE deleted_at IS NULL`
- [ ] Add "Trash" or "Gelöschte Einträge" UI views
- [ ] Add restore functionality to UI
- [ ] Set up cron job for permanent deletion (optional)
- [ ] Test all delete and restore operations

## Best Practices

1. **Always Filter**: Every SELECT query should filter `deleted_at IS NULL`
2. **Use Utilities**: Use the provided utility functions instead of raw SQL
3. **User Feedback**: Show confirmation dialogs before deleting
4. **Trash View**: Provide a UI to view and restore deleted items
5. **Audit Logs**: Log who deleted what and when
6. **Permissions**: Only allow admins to permanently delete
7. **Performance**: Use the indexes for efficient queries

## Common Pitfalls

❌ **Forgetting to filter deleted records**
\`\`\`typescript
// This includes deleted records!
const { data } = await supabase.from('todos').select('*')
\`\`\`

✅ **Always filter**
\`\`\`typescript
const { data } = await supabase
  .from('todos')
  .select('*')
  .is('deleted_at', null)
\`\`\`

❌ **Using hard delete**
\`\`\`typescript
await supabase.from('todos').delete().eq('id', id)
\`\`\`

✅ **Use soft delete**
\`\`\`typescript
await softDelete('todos', id)
\`\`\`

## Support

For questions or issues with the soft delete system, contact the development team or refer to the codebase examples.
