## Dienstplan Loading Issues - Diagnostic Info (Added 2026-01-14)

### Root Cause of Empty Loading State

The dienstplan page requires **shift_types** to be defined for a practice before it can display properly. If a practice has zero shift types, the page will show an infinite loading spinner.

### Database State Reference

As of 2026-01-14, the following practices exist:

**Practices Table:**
- Practice ID 5: "Yahya's TestPraxis" (created 2026-01-01)
- Practice ID 1: "Praxis Dr. Mauch - ID 1" (created 2025-11-26)
- Practice ID 0: "Praxis Dr. Mauch - ID 0" (created 2025-11-11)
- Practice ID 3: "Hauptpraxis Berlin" (created 2025-10-11)
- Practice ID 4: "Facharztpraxis Muenchen" (created 2025-10-11)

**Shift Types by Practice:**
- Practice ID 5: **0 shift types** ❌ (causes loading issue)
- Practice ID 0: **0 shift types** ❌ (causes loading issue)
- Practice ID 1: 9 shift types ✓
- Practice ID 2: 5 shift types ✓
- Practice ID 4: 4 shift types ✓
- Practice ID 1766815427836: 5 shift types ✓

### Required Setup for New Practices

Before using the dienstplan feature, a practice MUST have:

1. **Shift Types** (minimum 3-5 types recommended):
   - Frühdienst (Early Shift)
   - Spätdienst (Late Shift)
   - Tagdienst (Day Shift)
   - Nachtdienst (Night Shift)
   
2. **Team Members** linked to the practice (from users table)

3. Optional but recommended:
   - employee_availability records
   - Initial shift_schedules

### Diagnostic SQL Scripts

To check if a practice is ready for dienstplan:

```sql
-- Check comprehensive setup for a practice
WITH practice_stats AS (
    SELECT 'YOUR_PRACTICE_ID' as practice_id
)
SELECT 
    'shift_types' as table_name,
    COUNT(*) as record_count
FROM shift_types st, practice_stats ps
WHERE st.practice_id = ps.practice_id

UNION ALL

SELECT 'shift_schedules', COUNT(*)
FROM shift_schedules ss, practice_stats ps
WHERE ss.practice_id = ps.practice_id

UNION ALL

SELECT 'employee_availability', COUNT(*)
FROM employee_availability ea, practice_stats ps
WHERE ea.practice_id = ps.practice_id

UNION ALL

SELECT 'team_members', COUNT(*)
FROM users u, practice_stats ps
WHERE u.practice_id = ps.practice_id;
```

### API Dependencies

The dienstplan page makes 6 parallel API calls:
1. `/api/practices/[practiceId]/team-members`
2. `/api/practices/[practiceId]/dienstplan/shift-types` ← **Critical: Must return data**
3. `/api/practices/[practiceId]/dienstplan/schedules`
4. `/api/practices/[practiceId]/dienstplan/availability`
5. `/api/practices/[practiceId]/dienstplan/swap-requests`
6. `/api/practices/[practiceId]/dienstplan/compliance`

If shift-types returns empty, the UI cannot initialize the schedule view.

### Fix for Empty Dienstplan

To fix a practice with no shift types, run a seeding script or use the shift type creation UI to add default shift types before accessing the dienstplan page.
