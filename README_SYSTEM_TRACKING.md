# System Change Tracking

## Overview
This system automatically tracks all changes made to the application and allows super admins to aggregate them into user-facing changelogs.

## How It Works

### 1. Track Changes Automatically
Use the `trackSystemChange` function to log any system change:

\`\`\`typescript
import { trackSystemChange, trackFeatureAddition, trackBugFix } from '@/lib/track-system-change'

// Track a new feature
await trackFeatureAddition(
  "KI-Analyse für Praxisdaten",
  "Neue KI-gestützte Analyse für Praxisdaten hinzugefügt",
  practiceId,
  userId
)

// Track a bug fix
await trackBugFix(
  "Kalender-Synchronisierung",
  "Problem mit Kalender-Synchronisierung behoben",
  userId
)

// Track custom changes
await trackSystemChange({
  title: "Neue Funktion: Team-Dashboard",
  description: "Interaktives Team-Dashboard mit Echtzeit-Updates",
  changeType: "feature",
  practiceId,
  userId,
  isUserFacing: true,
})
\`\`\`

### 2. View System Changes
Super admins can view all tracked changes in the "Änderungsprotokoll" tab:
- Filter by change type (feature, bugfix, improvement, etc.)
- See which changes are user-facing
- View change details and metadata

### 3. Create Changelogs
Super admins can:
1. Select multiple system changes
2. Click "Changelog erstellen"
3. Optionally provide a version number
4. System automatically groups changes by category
5. Creates a draft changelog for review

### 4. Publish Changelogs
After reviewing the automatically generated changelog:
1. Edit title and description if needed
2. Toggle "Sofort veröffentlichen" to make it visible to users
3. Save the changelog

## Change Categories

- `feature` - Neue Funktionen
- `bugfix` - Fehlerbehebungen
- `improvement` - Verbesserungen
- `security` - Sicherheit
- `database` - Datenbank-Änderungen
- `api` - API-Änderungen
- `ui` - Benutzeroberfläche
- `configuration` - Konfiguration

## Best Practices

1. **Track Important Changes**: Track all user-facing changes and significant system updates
2. **Use Descriptive Titles**: Make titles clear and concise
3. **Include Context**: Add detailed descriptions for complex changes
4. **Mark User-Facing Changes**: Set `isUserFacing: true` for changes that affect users
5. **Regular Aggregation**: Periodically aggregate changes into changelogs (e.g., weekly/monthly)

## Database Schema

The `system_changes` table stores:
- `title` - Short description of the change
- `description` - Detailed explanation
- `change_type` - Category of change
- `is_user_facing` - Whether users should see this
- `is_aggregated` - Whether it's been added to a changelog
- `metadata` - Additional context (JSON)
- `practice_id` - If specific to a practice
- `user_id` - Who made the change

## API Endpoints

- `GET /api/system-changes` - Fetch system changes (super admin only)
- `POST /api/system-changes` - Aggregate changes into changelog (super admin only)
