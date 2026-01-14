# Datenbank-Schema Dokumentation

> **WICHTIG:** Diese Datei enthält die echte Datenbankstruktur aus Supabase.
> Bei API-Änderungen IMMER zuerst diese Datei konsultieren!

---

## Tabellen-Übersicht

### 1. team_members

| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| id | TEXT | NO | Primary Key (UUID-Format) |
| practice_id | TEXT | NO | FK -> practices.id |
| user_id | TEXT | **YES** | FK -> users.id (NULL = kein Login) |
| first_name | TEXT | YES | Vorname |
| last_name | TEXT | YES | Nachname |
| email | TEXT | YES | E-Mail |
| role | TEXT | YES | user, admin, manager, owner, superadmin |
| status | TEXT | YES | active, inactive |
| department_id | TEXT | YES | FK -> departments.id |
| avatar_url | TEXT | YES | Profilbild URL |
| candidate_id | TEXT | YES | FK -> candidates.id |
| created_at | TIMESTAMP | YES | |
| updated_at | TIMESTAMP | YES | |
| deleted_at | TIMESTAMP | YES | Soft Delete |

**Wichtig:**
- `user_id` ist NULLABLE - Team-Members ohne Login haben NULL
- ID ist TEXT, nicht UUID (auch wenn Werte wie UUIDs aussehen)

---

### 2. users

| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| id | UUID | NO | Primary Key |
| email | TEXT | YES | E-Mail (unique) |
| first_name | TEXT | YES | Vorname |
| last_name | TEXT | YES | Nachname |
| avatar_url | TEXT | YES | Profilbild |
| is_active | BOOLEAN | YES | Aktiv-Status |
| role | TEXT | YES | Globale Rolle |
| created_at | TIMESTAMP | YES | |
| updated_at | TIMESTAMP | YES | |

---

### 3. teams (Teamgruppen)

| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| id | TEXT | NO | Primary Key |
| practice_id | TEXT | NO | FK -> practices.id |
| practiceid | TEXT | YES | **DUPLIKAT - nicht verwenden!** |
| name | TEXT | YES | Team-Name |
| description | TEXT | YES | Beschreibung |
| color | TEXT | YES | Farbe (hex) |
| is_active | BOOLEAN | YES | Aktiv-Status |
| sort_order | INTEGER | YES | Sortierung |
| created_at | TIMESTAMP | YES | |
| updated_at | TIMESTAMP | YES | |
| deleted_at | TIMESTAMP | YES | Soft Delete |

---

### 4. team_assignments

| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| id | TEXT | NO | Primary Key |
| team_id | TEXT | YES | FK -> teams.id |
| user_id | TEXT | **NO** | Referenziert User, NICHT team_member! |
| practice_id | TEXT | YES | FK -> practices.id |
| practiceid | TEXT | YES | **DUPLIKAT - nicht verwenden!** |
| assigned_at | TIMESTAMP | YES | Zuweisungsdatum |

**WICHTIG:**
- `user_id` referenziert `users.id`, NICHT `team_members.id`!
- Um ein Team-Member zuzuweisen, muss dessen `user_id` verwendet werden
- Team-Members ohne `user_id` können NICHT zu Teams zugewiesen werden

---

### 5. todos

| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| id | TEXT | NO | Primary Key |
| practice_id | TEXT | NO | FK -> practices.id |
| practiceid | TEXT | YES | **DUPLIKAT - nicht verwenden!** |
| title | TEXT | YES | Titel |
| description | TEXT | YES | Beschreibung |
| status | TEXT | YES | pending, in_progress, completed |
| priority | TEXT | YES | low, medium, high, urgent |
| assigned_to | TEXT | YES | User ID |
| completed | BOOLEAN | YES | Erledigt-Status |
| due_date | DATE | YES | Fälligkeitsdatum |
| created_by | TEXT | YES | FK -> users.id |
| created_at | TIMESTAMP | YES | |
| updated_at | TIMESTAMP | YES | |
| deleted_at | TIMESTAMP | YES | Soft Delete |

---

### 6. workflows

| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| id | TEXT | NO | Primary Key |
| practice_id | TEXT | NO | FK -> practices.id |
| practiceid | TEXT | YES | **DUPLIKAT - nicht verwenden!** |
| name | TEXT | YES | Name |
| description | TEXT | YES | Beschreibung |
| is_template | BOOLEAN | YES | Template-Flag |
| status | TEXT | YES | active, inactive, archived |
| category | TEXT | YES | Kategorie |
| created_at | TIMESTAMP | YES | |
| updated_at | TIMESTAMP | YES | |
| deleted_at | TIMESTAMP | YES | Soft Delete |

**WICHTIG:**
- **KEIN `is_active` Feld!** Verwende `status` stattdessen
- Templates: `is_template = true`

---

### 7. calendar_events

| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| id | TEXT | NO | Primary Key |
| practice_id | TEXT | NO | FK -> practices.id |
| title | TEXT | YES | Titel |
| description | TEXT | YES | Beschreibung |
| type | TEXT | YES | meeting, holiday, training, etc. |
| start_date | DATE | YES | Startdatum |
| end_date | DATE | YES | Enddatum |
| start_time | TIME | YES | Startzeit |
| end_time | TIME | YES | Endzeit |
| all_day | BOOLEAN | YES | Ganztägig |
| priority | TEXT | YES | Priorität |
| created_at | TIMESTAMP | YES | |
| updated_at | TIMESTAMP | YES | |
| deleted_at | TIMESTAMP | YES | Soft Delete |

**WICHTIG:**
- **KEIN `event_type` Feld!** Verwende `type` stattdessen
- **KEIN `status` Feld!**

---

## Foreign Keys

\`\`\`
team_members.practice_id -> practices.id
team_members.candidate_id -> candidates.id
team_members.user_id -> users.id (NULLABLE!)

teams.practice_id -> practices.id

team_assignments.team_id -> teams.id
team_assignments.user_id -> ??? (KEIN FK definiert, aber referenziert users.id)

todos.practice_id -> practices.id
todos.created_by -> users.id

workflows.practice_id -> practices.id

calendar_events.practice_id -> practices.id
\`\`\`

---

## Häufige Fehler vermeiden

### 1. Spalten die NICHT existieren
| Tabelle | Falsche Spalte | Richtige Spalte |
|---------|----------------|-----------------|
| workflows | `is_active` | `status` |
| calendar_events | `event_type` | `type` |
| calendar_events | `status` | - (nicht vorhanden) |

### 2. ID-Typen
- **ALLE IDs sind TEXT** (auch wenn sie wie UUIDs aussehen)
- Vergleiche: `WHERE id = '...'` (mit Quotes)

### 3. practice_id Typ
- **IMMER TEXT**, nicht INTEGER
- Richtig: `WHERE practice_id = '1'`
- Falsch: `WHERE practice_id = 1`

### 4. Doppelte Spalten
Einige Tabellen haben `practice_id` UND `practiceid`:
- **IMMER `practice_id` verwenden** (mit Unterstrich)
- `practiceid` ist Legacy und sollte ignoriert werden

### 5. team_assignments Logik
- `user_id` in `team_assignments` = `users.id`, NICHT `team_members.id`
- Um Team-Member einem Team zuzuweisen:
  1. Hole `team_members.user_id`
  2. Falls NULL → Zuweisung nicht möglich
  3. Falls vorhanden → INSERT in `team_assignments` mit `users.id`

---

## Sample Queries

### Team-Member mit User-Daten
\`\`\`sql
SELECT 
  tm.id,
  tm.first_name,
  tm.last_name,
  tm.email,
  tm.user_id,
  u.email as user_email
FROM team_members tm
LEFT JOIN users u ON tm.user_id = u.id
WHERE tm.practice_id = '1'
  AND tm.deleted_at IS NULL;
\`\`\`

### Team-Zuweisungen
\`\`\`sql
SELECT 
  ta.id,
  ta.team_id,
  t.name as team_name,
  ta.user_id,
  tm.first_name,
  tm.last_name
FROM team_assignments ta
JOIN teams t ON ta.team_id = t.id
LEFT JOIN team_members tm ON tm.user_id = ta.user_id
WHERE ta.practice_id = '1';
\`\`\`

### Workflows (kein is_active!)
\`\`\`sql
SELECT id, name, is_template, status
FROM workflows
WHERE practice_id = '1'
  AND deleted_at IS NULL
  AND status = 'active';  -- NICHT is_active = true!
\`\`\`

---

## Letzte Aktualisierung
Datum: Januar 2026
Quelle: Direkte Supabase-Abfragen
