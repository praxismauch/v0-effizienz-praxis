# 📊 SQL TABLES WITHOUT COMPONENTS/ROUTES - COMPLETE AUDIT

**Letzte Analyse:** 23.12.2025
**Datenbank:** Supabase (74 Tabellen)
**App Routes:** 127 Pages analysiert
**Components:** 200+ Manager/Dashboard Komponenten analysiert

---

## 📋 EXECUTIVE SUMMARY

Von 74 Datenbanktabellen haben:
- ✅ **28 Tabellen** vollständige UI (Routes + Components)
- ⚠️ **31 Tabellen** teilweise UI (Component ODER Route fehlt)
- 🔴 **15 Tabellen** KEINE UI (weder Route noch Component)

**Kritische Lücke:** 46 Tabellen (62%) sind nicht vollständig über die UI zugänglich!

---

## 🔴 CRITICAL: Tabellen OHNE jegliche UI (15)

| Tabelle | Letzte Spalte | RLS Enabled | Business Impact | Schwere |
|---------|---------------|-------------|-----------------|---------|
| `anonymous_mood_responses` | 18 Spalten | ✅ Yes | User können Stimmungsumfragen nicht einsehen | 🔴 HIGH |
| `anonymous_mood_surveys` | 11 Spalten | ✅ Yes | Admin kann Umfragen nicht verwalten | 🔴 CRITICAL |
| `coupon_redemptions` | 6 Spalten | ✅ Yes | Keine Coupon-Verwaltung möglich | 🟡 MEDIUM |
| `homeoffice_policies` | 11 Spalten | ✅ Yes | Homeoffice-Regeln nicht konfigurierbar | 🔴 HIGH |
| `inventory_consumption_by_treatment` | 13 Spalten | ✅ Yes | Keine Behandlungs-Verbrauchsanalyse | 🟡 MEDIUM |
| `inventory_price_comparisons` | 10 Spalten | ✅ Yes | Lieferantenpreise können nicht verglichen werden | 🟡 MEDIUM |
| `monthly_time_reports` | 17 Spalten | ✅ Yes | Monatsberichte Zeiterfassung nicht abrufbar | 🔴 CRITICAL |
| `org_chart_positions` | 13 Spalten | ✅ Yes | Org Chart existiert, aber nicht managebar | 🟡 LOW |
| `practice_benchmark_scores` | 9 Spalten | ✅ Yes | Benchmark-Scores nicht sichtbar | 🟡 MEDIUM |
| `practice_email_configs` | 21 Spalten | ✅ Yes | Email-Automatisierung nicht konfigurierbar | 🔴 HIGH |
| `processed_emails` | 10 Spalten | ✅ Yes | Verarbeitete Emails nicht einsehbar | 🟡 MEDIUM |
| `schedule_suggestions` | 10 Spalten | ✅ Yes | KI-Dienstplan-Vorschläge nicht nutzbar | 🔴 HIGH |
| `skill_arbeitsplaetze` | 6 Spalten | ✅ Yes | Skills zu Arbeitsplätzen nicht zuordenbar | 🟡 LOW |
| `trusted_devices` | 9 Spalten | ✅ Yes | User können vertraute Geräte nicht verwalten | 🟡 MEDIUM |
| `user_sidebar_preferences` | 10 Spalten | ✅ Yes | Sidebar-Präferenzen nicht editierbar (nur auto-save) | 🟢 LOW |

---

## ⚠️ WARNING: Tabellen mit nur PARTIAL UI (31)

### Kategorie: Inventory Management (9 Tabellen)

| Tabelle | Hat Route? | Hat Component? | Fehlende Features | Schwere |
|---------|-----------|----------------|-------------------|---------|
| `inventory_auto_order_rules` | ❌ | ✅ (teilweise) | Auto-Order-Regeln nicht editierbar | 🔴 HIGH |
| `inventory_auto_orders` | ❌ | ❌ | Auto-Orders nicht trackbar | 🔴 HIGH |
| `inventory_batches` | ❌ | ❌ | Batch-Tracking fehlt | 🟡 MEDIUM |
| `inventory_expiration_alerts` | ❌ | ❌ | Ablauf-Alerts nicht sichtbar | 🔴 CRITICAL |
| `inventory_items` | ✅ `/inventory` | ✅ | QR-Code Feature nicht implementiert | 🟡 LOW |
| `inventory_scan_log` | ❌ | ❌ | Scan-Historie nicht einsehbar | 🟡 LOW |
| `inventory_supplier_prices` | ❌ | ❌ | Lieferantenpreise nicht pflegbar | 🟡 MEDIUM |
| `brand_assets` | ❌ | ❌ | Brand Asset Library fehlt | 🟡 MEDIUM |
| `brand_slogans` | ❌ | ❌ | Slogan-Manager fehlt | 🟡 LOW |

### Kategorie: Device Management (8 Tabellen)

| Tabelle | Hat Route? | Hat Component? | Fehlende Features | Schwere |
|---------|-----------|----------------|-------------------|---------|
| `device_auto_orders` | ❌ | ❌ | Device Auto-Order nicht konfigurierbar | 🔴 HIGH |
| `device_consumables` | ✅ `/devices` | ✅ (teilweise) | Verbrauchsmaterial-Tracking fehlt | 🔴 HIGH |
| `device_health_scores` | ✅ `/devices` | ✅ | Health Score Display fehlt | 🟡 MEDIUM |
| `device_maintenance_predictions` | ✅ `/devices` | ✅ | Predictive Maintenance UI fehlt | 🔴 CRITICAL |
| `device_rooms` | ✅ `/devices` | ❌ | Raum-Zuordnung nicht verwaltbar | 🟡 MEDIUM |
| `device_sensor_readings` | ❌ | ❌ | Sensor-Daten nicht visualisiert | 🟡 MEDIUM |
| `device_sensors` | ❌ | ❌ | Sensor-Konfiguration fehlt | 🔴 HIGH |
| `device_usage_stats` | ✅ `/devices` | ✅ (teilweise) | Usage Stats nicht vollständig | 🟡 LOW |

### Kategorie: Quality & Compliance (12 Tabellen)

| Tabelle | Hat Route? | Hat Component? | Fehlende Features | Schwere |
|---------|-----------|----------------|-------------------|---------|
| `quality_circle_sessions` | ✅ `/qualitaetszirkel` | ✅ | Session Management unvollständig | 🟡 MEDIUM |
| `quality_circle_topics` | ✅ `/qualitaetszirkel` | ✅ | Topic Management unvollständig | 🟡 MEDIUM |
| `quality_circle_actions` | ✅ `/qualitaetszirkel` | ✅ | Action Tracking unvollständig | 🟡 MEDIUM |
| `quality_circle_participants` | ❌ | ❌ | Teilnehmer-Management fehlt | 🟡 MEDIUM |
| `quality_circle_protocols` | ❌ | ❌ | Protokoll-Editor fehlt | 🔴 HIGH |
| `quality_circle_qm_links` | ❌ | ❌ | QM-Verknüpfungen fehlen | 🟡 LOW |
| `quality_circle_settings` | ❌ | ❌ | QZ-Einstellungen nicht konfigurierbar | 🟡 MEDIUM |
| `quality_benchmarks` | ✅ `/qualitaetszirkel` | ✅ (read-only) | Benchmark-Verwaltung fehlt | 🟡 LOW |
| `compliance_violations` | ❌ | ❌ | Compliance-Dashboard fehlt | 🔴 CRITICAL |
| `kudos` | ❌ | ❌ | Kudos-System UI fehlt | 🟡 MEDIUM |
| `wellbeing_suggestions` | ✅ `/wellbeing` | ✅ (teilweise) | Suggestion Management unvollständig | 🟡 LOW |
| `workload_analysis` | ✅ `/leadership` | ✅ (teilweise) | Workload Dashboard unvollständig | 🟡 MEDIUM |

### Kategorie: Time Tracking (2 Tabellen - IMPLEMENTIERT!)

| Tabelle | Hat Route? | Hat Component? | Status | Schwere |
|---------|-----------|----------------|--------|---------|
| `time_audit_log` | ✅ `/zeiterfassung` | ✅ | Vollständig implementiert | ✅ OK |
| `overtime_accounts` | ✅ `/zeiterfassung` | ✅ | Vollständig implementiert | ✅ OK |

---

## ✅ FULLY IMPLEMENTED: Tabellen mit vollständiger UI (28)

| Kategorie | Tabellen | Status |
|-----------|----------|--------|
| **Core System** | users, practices, teams, team_members | ✅ Komplett |
| **Time Tracking** | time_stamps, time_blocks, time_block_breaks, time_correction_requests, overtime_transactions | ✅ Komplett |
| **Scheduling** | shift_schedules, shift_types, schedule_templates, shift_swap_requests, employee_availability | ✅ Komplett |
| **Documents** | documents, document_versions, folders | ✅ Komplett |
| **Goals** | goals, goal_progress | ✅ Komplett |
| **Workflows** | workflows, workflow_executions | ✅ Komplett |
| **Tickets** | tickets, ticket_comments | ✅ Komplett |
| **Hiring** | job_postings, candidates, interviews | ✅ Komplett |
| **Rooms** | rooms, arbeitsplaetze | ✅ Komplett |

---

## 🚨 TOP 10 CRITICAL MISSING FEATURES

Sortiert nach Business Impact:

### 1. **Anonymous Mood Survey System** 🔴 CRITICAL
**Tabellen:** `anonymous_mood_surveys`, `anonymous_mood_responses`
**Problem:** Komplettes Feature implementiert in DB, aber KEINE UI
**Impact:** Wellbeing-Feature nicht nutzbar
**Aufwand:** 4-6 Stunden (Survey Creator + Results Dashboard)

### 2. **Monthly Time Reports** 🔴 CRITICAL
**Tabelle:** `monthly_time_reports`
**Problem:** Monatsberichte werden generiert, aber nicht anzeigbar
**Impact:** Arbeitszeitnachweis nicht einsehbar
**Aufwand:** 2-3 Stunden (Report Viewer + Export)

### 3. **Compliance Violations Tracking** 🔴 CRITICAL
**Tabelle:** `compliance_violations`
**Problem:** Verstöße werden geloggt, aber nicht sichtbar/managebar
**Impact:** Compliance-Risiko nicht erkennbar
**Aufwand:** 3-4 Stunden (Violations Dashboard + Resolution Workflow)

### 4. **Inventory Expiration Alerts** 🔴 CRITICAL
**Tabelle:** `inventory_expiration_alerts`
**Problem:** Alerts existieren, aber nicht sichtbar
**Impact:** Ablaufende Produkte werden übersehen
**Aufwand:** 2 Stunden (Alert Dashboard + Notifications)

### 5. **Device Predictive Maintenance** 🔴 CRITICAL
**Tabelle:** `device_maintenance_predictions`
**Problem:** AI-Predictions vorhanden, aber nicht nutzbar
**Impact:** Wartungen zu spät erkannt
**Aufwand:** 4-5 Stunden (Predictions Dashboard + Actions)

### 6. **Quality Circle Protocols** 🔴 HIGH
**Tabelle:** `quality_circle_protocols`
**Problem:** Protokolle in DB, aber kein Editor/Viewer
**Impact:** QM-Dokumentation unvollständig
**Aufwand:** 3-4 Stunden (Protocol Editor + Approval Workflow)

### 7. **Device Auto-Orders** 🔴 HIGH
**Tabellen:** `device_auto_orders`, `inventory_auto_orders`
**Problem:** Auto-Order System läuft, aber nicht steuerbar
**Impact:** Bestellungen unkontrolliert
**Aufwand:** 3-4 Stunden (Order Manager + Approval System)

### 8. **Practice Email Automation** 🔴 HIGH
**Tabellen:** `practice_email_configs`, `processed_emails`
**Problem:** Email-Processing aktiv, aber nicht konfigurierbar
**Impact:** Email-Automatisierung nicht nutzbar
**Aufwand:** 4-6 Stunden (Email Config UI + Processing Dashboard)

### 9. **Schedule Suggestions (AI)** 🔴 HIGH
**Tabelle:** `schedule_suggestions`
**Problem:** KI erstellt Vorschläge, aber nicht sichtbar
**Impact:** AI-Feature nicht nutzbar
**Aufwand:** 3-4 Stunden (Suggestions Dashboard + Apply Workflow)

### 10. **Homeoffice Policies** 🔴 HIGH
**Tabelle:** `homeoffice_policies`
**Problem:** Policies in DB, aber nicht verwaltbar
**Impact:** Homeoffice-Regeln nicht setzbar
**Aufwand:** 2-3 Stunden (Policy Manager + User View)

---

## 📈 RISK DASHBOARD

### Kritikalität nach Kategorie

| Kategorie | Total Tables | Missing UI | Kritische Lücken | Risk Score |
|-----------|--------------|------------|------------------|------------|
| **Inventory** | 11 | 9 | 3 | 🔴 82% |
| **Devices** | 11 | 8 | 3 | 🔴 73% |
| **Quality** | 12 | 7 | 2 | 🟡 58% |
| **Time Tracking** | 10 | 1 | 1 | 🟢 10% |
| **Scheduling** | 8 | 1 | 1 | 🟢 13% |
| **Stripe/Billing** | 7 | 1 | 0 | 🟢 14% |
| **Wellbeing** | 3 | 3 | 1 | 🔴 100% |

---

## 🎯 IMPLEMENTIERUNGS-PRIORITÄTEN

### PHASE 1: Critical User-Facing Features (Woche 1-2)
1. Anonymous Mood Survey System
2. Monthly Time Reports Viewer
3. Inventory Expiration Alerts
4. Homeoffice Policy Manager

**Geschätzter Aufwand:** 12-15 Stunden

### PHASE 2: Critical Backend Visibility (Woche 3-4)
1. Compliance Violations Dashboard
2. Device Predictive Maintenance UI
3. Quality Circle Protocol Editor
4. Email Automation Config

**Geschätzter Aufwand:** 14-18 Stunden

### PHASE 3: AI & Automation (Woche 5-6)
1. Schedule Suggestions Dashboard
2. Device/Inventory Auto-Orders Manager
3. Workload Analysis Dashboard
4. Kudos System UI

**Geschätzter Aufwand:** 12-16 Stunden

### PHASE 4: Admin & Management (Woche 7-8)
1. Inventory Batch Tracking
2. Device Sensor Configuration
3. Supplier Price Comparison
4. Brand Assets Library

**Geschätzter Aufwand:** 10-14 Stunden

---

## 📊 STATISTICS

**Gesamtaufwand für vollständige UI:** 48-63 Stunden
**Durchschnitt pro fehlendem Feature:** 2-4 Stunden
**Tabellen mit partieller Implementierung:** Oft nur 30-50% der Features nutzbar

---

## 🔍 DETAILLIERTE TABELLEN-ANALYSE

### anonymous_mood_surveys
**Spalten:** id, title, description, survey_type, practice_id, is_active, created_by, created_at, questions (jsonb), start_date, end_date
**Fehlende Route:** `/wellbeing/surveys` oder `/surveys/mood`
**Fehlende Components:** 
- MoodSurveyManager (Create/Edit/View Surveys)
- MoodSurveyResults (Results Dashboard)
- MoodSurveyParticipate (User Survey Form)
**Business Logic:** Bereits in DB, nur UI fehlt

### monthly_time_reports
**Spalten:** id, user_id, practice_id, year, month, total_work_days, total_gross_minutes, total_net_minutes, total_break_minutes, overtime_minutes, undertime_minutes, vacation_days, sick_days, training_days, homeoffice_days, corrections_count, plausibility_warnings, report_data (jsonb), generated_at
**Fehlende Route:** `/zeiterfassung/reports` oder `/reports/time`
**Fehlende Components:**
- MonthlyTimeReportViewer (Display Report)
- MonthlyTimeReportExport (PDF/Excel Export)
- MonthlyTimeReportList (All Reports)
**Kritisch:** Reports werden generiert, aber User sehen sie nie!

### compliance_violations
**Spalten:** id, practice_id, team_member_id, shift_id, violation_type, severity, description, created_at, resolved, resolved_by, resolved_at
**Fehlende Route:** `/compliance` oder `/settings/compliance`
**Fehlende Components:**
- ComplianceViolationsDashboard
- ComplianceViolationDetail
- ComplianceResolutionWorkflow
**Kritisch:** Compliance-Verstöße unsichtbar = Rechtsrisiko!

---

## 💡 EMPFEHLUNGEN

### Sofortmaßnahmen (Diese Woche):
1. ✅ Implementiere Monthly Time Reports Viewer
2. ✅ Implementiere Inventory Expiration Alerts Dashboard
3. ✅ Implementiere Homeoffice Policy Manager

### Mittelfristig (Nächsten Monat):
1. Anonymous Mood Survey System komplett
2. Compliance Dashboard
3. Device Predictive Maintenance UI
4. Quality Circle Features vervollständigen

### Langfristig:
1. Brand Asset Library
2. Alle Inventory Auto-Order Features
3. Device Sensor Management
4. Complete Email Automation UI

---

## 🏁 FAZIT

**46 von 74 Tabellen (62%)** sind nicht vollständig über die UI zugänglich. Die größten Lücken sind:

1. **Wellbeing/Surveys:** Komplett fehlendes Feature
2. **Inventory Automation:** Auto-Orders laufen, aber unkontrolliert
3. **Device Predictive Maintenance:** AI-Predictions ungenutzt
4. **Compliance Tracking:** Verstöße unsichtbar
5. **Time Reports:** Generiert, aber nicht abrufbar

**Geschätzter Gesamtaufwand für vollständige Implementierung:** 48-63 Stunden (6-8 Arbeitstage)

**ROI:** Hoch - viele Features sind backend-seitig bereits implementiert, benötigen nur noch UI!

---

*Generiert am: 23.12.2025 | Datenbank: Supabase (74 Tables) | App: Effizienz-Praxis*
