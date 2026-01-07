-- =====================================================
-- DEMO HAUSARZTPRAXIS - COMPLETE DEMO DATA SEED
-- Praxis Dr. med. Sarah Müller & Team
-- A sophisticated demo for a general practice
-- =====================================================

-- Set the demo practice ID (using ID 2 to avoid conflicts)
-- We'll use practice_id = 2 for all demo data

-- =====================================================
-- 1. ROOMS - Behandlungsräume, Wartezimmer, etc.
-- =====================================================

INSERT INTO rooms (id, practice_id, name, description, floor, room_number, created_at, updated_at) VALUES
('demo-room-001', '2', 'Empfang & Anmeldung', 'Zentraler Empfangsbereich mit zwei Arbeitsplätzen für die Patientenanmeldung', 'EG', '001', NOW(), NOW()),
('demo-room-002', '2', 'Wartezimmer 1', 'Großes Wartezimmer mit 15 Sitzplätzen, Zeitschriften und Kinderspielecke', 'EG', '002', NOW(), NOW()),
('demo-room-003', '2', 'Behandlungsraum 1', 'Hauptbehandlungsraum von Dr. Müller mit EKG und Ultraschall', 'EG', '101', NOW(), NOW()),
('demo-room-004', '2', 'Behandlungsraum 2', 'Behandlungsraum für Routineuntersuchungen und Impfungen', 'EG', '102', NOW(), NOW()),
('demo-room-005', '2', 'Behandlungsraum 3', 'Raum für kleinere chirurgische Eingriffe und Wundversorgung', 'EG', '103', NOW(), NOW()),
('demo-room-006', '2', 'Labor', 'Praxiseigenes Labor für Blutuntersuchungen und Schnelltests', 'EG', '104', NOW(), NOW()),
('demo-room-007', '2', 'EKG-Raum', 'Spezieller Raum für Belastungs-EKG und Langzeit-EKG', 'EG', '105', NOW(), NOW()),
('demo-room-008', '2', 'Sozialraum', 'Pausenraum für Mitarbeiter mit Küche', 'OG', '201', NOW()),
('demo-room-009', '2', 'Lager & Apotheke', 'Medikamentenlager und Verbrauchsmaterialien', 'EG', '106', NOW(), NOW()),
('demo-room-010', '2', 'Büro Praxisleitung', 'Verwaltungsbüro der Praxisleitung', 'OG', '202', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. ARBEITSPLÄTZE - Workstations
-- =====================================================

INSERT INTO arbeitsplaetze (id, practice_id, name, beschreibung, raum_id, raum_name, is_active, created_at, updated_at) VALUES
('demo-ap-001', '2', 'Empfang Arbeitsplatz 1', 'Hauptarbeitsplatz am Empfang mit Telefon und Kartenterminal', 'demo-room-001', 'Empfang & Anmeldung', true, NOW(), NOW()),
('demo-ap-002', '2', 'Empfang Arbeitsplatz 2', 'Zweiter Empfangsarbeitsplatz für Stoßzeiten', 'demo-room-001', 'Empfang & Anmeldung', true, NOW(), NOW()),
('demo-ap-003', '2', 'Behandlungsplatz Dr. Müller', 'Hauptarbeitsplatz im Behandlungsraum 1', 'demo-room-003', 'Behandlungsraum 1', true, NOW(), NOW()),
('demo-ap-004', '2', 'Behandlungsplatz MFA 1', 'Assistenzarbeitsplatz für MFA in Behandlungsraum 2', 'demo-room-004', 'Behandlungsraum 2', true, NOW(), NOW()),
('demo-ap-005', '2', 'Behandlungsplatz MFA 2', 'Arbeitsplatz für Wundversorgung und kleine Eingriffe', 'demo-room-005', 'Behandlungsraum 3', true, NOW(), NOW()),
('demo-ap-006', '2', 'Laborarbeitsplatz', 'Arbeitsplatz im Labor für Blutentnahme und Analysen', 'demo-room-006', 'Labor', true, NOW(), NOW()),
('demo-ap-007', '2', 'EKG-Arbeitsplatz', 'Spezialisierter Arbeitsplatz für EKG-Untersuchungen', 'demo-room-007', 'EKG-Raum', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. SHIFT TYPES - Schichttypen
-- =====================================================

INSERT INTO shift_types (id, practice_id, name, short_name, description, start_time, end_time, break_minutes, color, min_staff, max_staff, is_active, created_at, updated_at) VALUES
('a1b2c3d4-0001-4000-8000-000000000001', '2', 'Frühschicht', 'FS', 'Morgendliche Schicht für Praxisöffnung und Patientenaufnahme', '07:00', '14:00', 30, '#10b981', 3, 5, true, NOW(), NOW()),
('a1b2c3d4-0002-4000-8000-000000000002', '2', 'Spätschicht', 'SS', 'Nachmittagsschicht bis Praxisschluss', '12:00', '19:00', 30, '#3b82f6', 2, 4, true, NOW(), NOW()),
('a1b2c3d4-0003-4000-8000-000000000003', '2', 'Tagschicht', 'TS', 'Ganztägige Schicht für Ärzte', '08:00', '17:00', 60, '#8b5cf6', 1, 2, true, NOW(), NOW()),
('a1b2c3d4-0004-4000-8000-000000000004', '2', 'Notdienst', 'ND', 'Bereitschaftsdienst außerhalb der Sprechzeiten', '17:00', '22:00', 0, '#ef4444', 1, 2, true, NOW(), NOW()),
('a1b2c3d4-0005-4000-8000-000000000005', '2', 'Samstagsschicht', 'SA', 'Samstags-Notsprechstunde', '09:00', '12:00', 0, '#f59e0b', 2, 3, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. TEAMS - Abteilungen
-- =====================================================

INSERT INTO teams (id, practice_id, name, description, color, sort_order, is_active, created_at, updated_at) VALUES
('team-demo-001', '2', 'Ärzte', 'Ärztliches Personal der Praxis', '#8b5cf6', 1, true, NOW(), NOW()),
('team-demo-002', '2', 'MFA', 'Medizinische Fachangestellte', '#10b981', 2, true, NOW(), NOW()),
('team-demo-003', '2', 'Empfang', 'Rezeption und Patientenservice', '#3b82f6', 3, true, NOW(), NOW()),
('team-demo-004', '2', 'Labor', 'Laborpersonal', '#f59e0b', 4, true, NOW(), NOW()),
('team-demo-005', '2', 'Verwaltung', 'Praxismanagement und Administration', '#6366f1', 5, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. TODOS - Aufgaben
-- =====================================================

INSERT INTO todos (id, practice_id, title, description, status, priority, category, due_date, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 'Quartalsabrechnung vorbereiten', 'KV-Abrechnung für Q4 2025 zusammenstellen und prüfen', 'offen', 'hoch', 'Verwaltung', CURRENT_DATE + INTERVAL '7 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Defibrillator-Wartung', 'Jährliche Wartung des AED im Wartezimmer durch Medizintechniker', 'offen', 'hoch', 'Geräte', CURRENT_DATE + INTERVAL '14 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Impfstoff-Bestellung Grippe', 'Grippeimpfstoffe für die kommende Saison nachbestellen', 'in_bearbeitung', 'mittel', 'Bestellung', CURRENT_DATE + INTERVAL '3 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Hygieneschulung planen', 'Jährliche Hygieneschulung für alle MFA organisieren', 'offen', 'mittel', 'Qualität', CURRENT_DATE + INTERVAL '30 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Praxis-Website aktualisieren', 'Neue Sprechzeiten und Urlaubszeiten auf der Website eintragen', 'offen', 'niedrig', 'Marketing', CURRENT_DATE + INTERVAL '5 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Notfallkoffer überprüfen', 'Verfallsdaten der Medikamente im Notfallkoffer kontrollieren', 'offen', 'hoch', 'Qualität', CURRENT_DATE + INTERVAL '2 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Mitarbeitergespräch Frau Weber', 'Halbjährliches Feedbackgespräch mit Maria Weber', 'geplant', 'mittel', 'Personal', CURRENT_DATE + INTERVAL '10 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Röntgenverordnung beantragen', 'Antrag für Röntgengenehmigung beim Landesamt einreichen', 'in_bearbeitung', 'mittel', 'Verwaltung', CURRENT_DATE + INTERVAL '21 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'QM-Handbuch aktualisieren', 'Neue SOPs in das Qualitätsmanagement-Handbuch einpflegen', 'offen', 'niedrig', 'Qualität', CURRENT_DATE + INTERVAL '45 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Patientenbefragung auswerten', 'Ergebnisse der Patientenzufriedenheitsbefragung zusammenfassen', 'erledigt', 'mittel', 'Qualität', CURRENT_DATE - INTERVAL '3 days', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. GOALS - Ziele
-- =====================================================

INSERT INTO goals (id, practice_id, title, description, category, status, priority, target_value, current_value, unit, progress, start_date, due_date, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 'Patientenzufriedenheit steigern', 'Durchschnittliche Bewertung auf Google und Jameda auf 4.8 Sterne verbessern', 'Qualität', 'in_progress', 'high', 4.8, 4.5, 'Sterne', 75, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '90 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Wartezeit reduzieren', 'Durchschnittliche Wartezeit im Wartezimmer auf unter 15 Minuten senken', 'Effizienz', 'in_progress', 'high', 15, 22, 'Minuten', 45, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '120 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'IGeL-Umsatz erhöhen', 'Monatlicher IGeL-Umsatz um 20% steigern', 'Finanzen', 'in_progress', 'medium', 20, 12, 'Prozent', 60, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '180 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Digitale Terminbuchung', '50% aller Termine über Online-Buchung', 'Digital', 'in_progress', 'medium', 50, 35, 'Prozent', 70, CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE + INTERVAL '60 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Fortbildungsstunden erreichen', 'Alle MFA erreichen 40 Fortbildungspunkte pro Jahr', 'Personal', 'on_track', 'medium', 40, 32, 'Punkte', 80, CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE + INTERVAL '60 days', NOW(), NOW()),
(gen_random_uuid(), 2, 'Energiekosten senken', 'Stromverbrauch um 15% reduzieren durch effizientere Geräte', 'Nachhaltigkeit', 'in_progress', 'low', 15, 8, 'Prozent', 53, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '270 days', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. KNOWLEDGE BASE - Praxishandbuch
-- =====================================================

INSERT INTO knowledge_base (id, practice_id, title, content, category, subcategory, status, is_published, view_count, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 'Notfallmanagement - Anaphylaxie', 
E'# Notfallprotokoll: Anaphylaktische Reaktion\n\n## Sofortmaßnahmen\n\n1. **Notruf absetzen** - 112 anrufen\n2. **Adrenalin verabreichen** - Adrenalin-Autoinjektor (EpiPen) in Oberschenkel-Außenseite\n3. **Flache Lagerung** - Beine hochlagern (außer bei Atemnot)\n4. **Sauerstoff** - 6-8 L/min über Maske\n5. **Venöser Zugang** - Volumen mit NaCl 0,9%\n\n## Medikamente\n- Adrenalin 1:1000 - 0,3-0,5 mg i.m.\n- Clemastin 2 mg i.v.\n- Prednisolon 250 mg i.v.\n\n## Dokumentation\nAlle Maßnahmen mit Uhrzeit dokumentieren!',
'Notfall', 'Anaphylaxie', 'published', true, 45, NOW(), NOW()),

(gen_random_uuid(), 2, 'Hygieneanweisung - Händedesinfektion', 
E'# Händehygiene in der Praxis\n\n## Wann desinfizieren?\n\n**Die 5 Momente der Händehygiene:**\n1. VOR Patientenkontakt\n2. VOR aseptischen Tätigkeiten\n3. NACH Kontakt mit Körperflüssigkeiten\n4. NACH Patientenkontakt\n5. NACH Kontakt mit der Patientenumgebung\n\n## Richtige Technik\n\n- Mindestens **3 ml** Desinfektionsmittel\n- **30 Sekunden** Einwirkzeit\n- Alle Fingerzwischenräume einbeziehen\n- Daumen separat umfassen\n- Fingerkuppen in der Handfläche reiben\n\n## Händewaschen\nNur bei sichtbarer Verschmutzung!',
'Hygiene', 'Händehygiene', 'published', true, 128, NOW(), NOW()),

(gen_random_uuid(), 2, 'Impfplan nach STIKO', 
E'# STIKO-Impfempfehlungen 2025\n\n## Standardimpfungen Erwachsene\n\n| Impfung | Intervall |\n|---------|----------|\n| Tetanus/Diphtherie/Pertussis | alle 10 Jahre |\n| Influenza | jährlich (ab 60 J.) |\n| Pneumokokken | einmalig (ab 60 J.) |\n| Herpes zoster | ab 60 Jahren |\n| COVID-19 | nach aktueller Empfehlung |\n\n## Indikationsimpfungen\n\n- FSME: Bei Exposition in Risikogebieten\n- Hepatitis A/B: Bei beruflicher Exposition\n- Meningokokken: Bei Immundefizienz\n\n## Dokumentation\nAlle Impfungen im Impfpass UND in der Praxis-EDV dokumentieren!',
'Behandlung', 'Impfungen', 'published', true, 89, NOW(), NOW()),

(gen_random_uuid(), 2, 'Einarbeitung neue MFA', 
E'# Einarbeitungsplan für neue MFA\n\n## Woche 1: Grundlagen\n- [ ] Praxisrundgang und Vorstellung im Team\n- [ ] Einweisung in Praxis-EDV\n- [ ] Telefonschulung und Terminvergabe\n- [ ] Hygieneschulung\n\n## Woche 2: Patientenversorgung\n- [ ] Blutentnahme unter Anleitung\n- [ ] EKG-Ableitung\n- [ ] Verbandswechsel\n- [ ] Impfassistenz\n\n## Woche 3-4: Selbstständigkeit\n- [ ] Eigenständige Patientenaufnahme\n- [ ] Labor-Routine\n- [ ] Rezeptmanagement\n- [ ] Abrechnung (Basics)\n\n## Probezeit-Gespräch\nNach 4 Wochen: Feedbackgespräch mit Praxisleitung',
'Personal', 'Einarbeitung', 'published', true, 34, NOW(), NOW()),

(gen_random_uuid(), 2, 'Datenschutz DSGVO', 
E'# Datenschutz in der Praxis\n\n## Grundsätze\n\n1. **Datenminimierung** - Nur notwendige Daten erheben\n2. **Zweckbindung** - Daten nur für den angegebenen Zweck nutzen\n3. **Vertraulichkeit** - Kein unbefugter Zugriff\n\n## Patientenrechte\n\n- Recht auf **Auskunft**\n- Recht auf **Berichtigung**\n- Recht auf **Löschung**\n- Recht auf **Datenübertragbarkeit**\n\n## Praktische Umsetzung\n\n- Bildschirme vom Empfang abgewandt\n- Patientenakten nie offen liegen lassen\n- Telefonate nicht im Wartebereich\n- Faxversand nur verschlüsselt\n- E-Mail nur mit Einwilligung\n\n## Meldepflicht\nDatenpannen innerhalb von 72 Stunden an Aufsichtsbehörde melden!',
'Verwaltung', 'Datenschutz', 'published', true, 67, NOW(), NOW()),

(gen_random_uuid(), 2, 'Rezepte und Verordnungen', 
E'# Verordnungsleitfaden\n\n## Rezeptarten\n\n### Kassenrezept (Muster 16)\n- Gültigkeit: 28 Tage\n- Für GKV-Versicherte\n- Aut-idem beachten\n\n### Privatrezept (blau)\n- Gültigkeit: 3 Monate\n- Für PKV und IGeL-Leistungen\n\n### BtM-Rezept\n- Gültigkeit: 7 Tage\n- Nur bestimmte Ärzte\n- Höchstmengen beachten\n\n## Häufige Fehler vermeiden\n\n- Vollständige Patientendaten\n- Dosierungsangabe nicht vergessen\n- Bei Hilfsmitteln: Diagnose angeben\n- Unterschrift + Arztstempel\n\n## Heilmittelverordnung\n- Erst nach Diagnostik ausstellen\n- Begründung bei extrabudgetär',
'Behandlung', 'Verordnungen', 'published', true, 156, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. PROTOCOLS - Besprechungsprotokolle
-- =====================================================

INSERT INTO protocols (id, practice_id, title, content, meeting_type, status, meeting_date, location, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 'Teambesprechung Januar 2026', 
E'# Teambesprechung vom 06.01.2026\n\n## Teilnehmer\nDr. Müller, Frau Weber, Herr Schmidt, Frau Klein\n\n## Themen\n\n### 1. Urlaubsplanung Ostern\n- Frau Weber: 14.-18.04.\n- Herr Schmidt: 21.-25.04.\n- Vertretung geklärt\n\n### 2. Neue Sprechzeiten\n- Ab Februar: Mittwochs bis 18:00 Uhr\n- Zusätzliche Termine für Berufstätige\n\n### 3. Qualitätszirkel\n- Nächster Termin: 15.02.2026\n- Thema: Impfmanagement\n\n## Beschlüsse\n- Neue Sprechzeiten ab 01.02.2026\n- Aktualisierung der Website bis 15.01.',
'Teambesprechung', 'approved', NOW() - INTERVAL '1 day', 'Sozialraum', NOW(), NOW()),

(gen_random_uuid(), 2, 'Qualitätszirkel Q4 2025', 
E'# Qualitätszirkel 15.12.2025\n\n## Agenda\n1. Auswertung Patientenbefragung\n2. Fehlermeldesystem CIRS\n3. Hygiene-Audit Ergebnisse\n\n## Ergebnisse Patientenbefragung\n- Gesamtzufriedenheit: 4.5/5\n- Wartezeit: 3.8/5 (Verbesserungsbedarf)\n- Freundlichkeit: 4.9/5\n- Kompetenz: 4.7/5\n\n## Maßnahmen\n- Terminslots um 10 Min. verlängern\n- Wartezimmer-Anzeige einrichten\n- Feedback-System digitalisieren\n\n## Nächster Termin\n15.03.2026 - Thema: Arzneimitteltherapiesicherheit',
'Qualitätszirkel', 'approved', NOW() - INTERVAL '23 days', 'Besprechungsraum', NOW(), NOW()),

(gen_random_uuid(), 2, 'Hygieneunterweisung 2025', 
E'# Jährliche Hygieneunterweisung\n\n## Datum: 01.12.2025\n\n## Inhalte\n\n### Händehygiene\n- 5 Momente der Händedesinfektion\n- Praktische Übung mit UV-Lampe\n\n### Flächendesinfektion\n- Wischdesinfektion Behandlungsliegen\n- Konzentration und Einwirkzeit\n\n### Aufbereitung Medizinprodukte\n- Kritische vs. semikritische Produkte\n- Dokumentationspflichten\n\n### Abfallentsorgung\n- Kategorien A/B/C\n- Entsorgungswege\n\n## Teilnehmer\nAlle Mitarbeiter (Unterschriftenliste im Anhang)\n\n## Nächste Schulung\n01.12.2026',
'Schulung', 'approved', NOW() - INTERVAL '37 days', 'Wartezimmer 1', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. CONTACTS - Kontakte
-- =====================================================

INSERT INTO contacts (id, practice_id, first_name, last_name, company, position, email, phone, mobile, category, address, city, postal_code, notes, is_favorite, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 'Thomas', 'Bergmann', 'Labor Dr. Bergmann & Partner', 'Laborleiter', 'bergmann@labor-bergmann.de', '089 12345678', '0171 1234567', 'Labor', 'Laborstraße 15', 'München', '80333', 'Unser Hauptlabor für alle externen Analysen. Abholdienst täglich 11:00 und 16:00 Uhr.', true, NOW(), NOW()),
(gen_random_uuid(), 2, 'Anna', 'Schneider', 'Radiologie Zentrum München', 'Anmeldung', 'anmeldung@radiologie-muenchen.de', '089 23456789', NULL, 'Radiologie', 'Röntgenweg 8', 'München', '80336', 'CT/MRT-Überweisungen. Wartezeit aktuell ca. 2 Wochen.', true, NOW(), NOW()),
(gen_random_uuid(), 2, 'Michael', 'Hofmann', 'Kardiologie Praxis Hofmann', 'Kardiologe', 'praxis@kardio-hofmann.de', '089 34567890', '0172 2345678', 'Facharzt', 'Herzstraße 22', 'München', '80339', 'Bevorzugter Kardiologe für Überweisungen. Echo + Belastungs-EKG.', true, NOW(), NOW()),
(gen_random_uuid(), 2, 'Sandra', 'Krause', 'Sanitätshaus Krause', 'Geschäftsführerin', 's.krause@sanitaetshaus-krause.de', '089 45678901', '0173 3456789', 'Lieferant', 'Hilfsmittelstraße 5', 'München', '80469', 'Kompressionsstrümpfe, Bandagen, Gehilfen. Lieferung innerhalb 2 Tage.', false, NOW(), NOW()),
(gen_random_uuid(), 2, 'Peter', 'Wagner', 'Medizintechnik Wagner GmbH', 'Servicetechniker', 'service@medtech-wagner.de', '089 56789012', '0174 4567890', 'Service', 'Gerätepark 12', 'Garching', '85748', 'Wartung für EKG, Ultraschall und Defibrillator. 24h Notfall-Hotline.', true, NOW(), NOW()),
(gen_random_uuid(), 2, 'Julia', 'Braun', 'Apotheke am Markt', 'Apothekerin', 'info@apotheke-markt.de', '089 67890123', NULL, 'Apotheke', 'Marktplatz 3', 'München', '80331', 'Nächste Apotheke zur Praxis. Botendienst für Patienten möglich.', false, NOW(), NOW()),
(gen_random_uuid(), 2, 'Frank', 'Richter', 'KV Bayern', 'Berater Niederlassung', 'richter@kvb.de', '089 78901234', NULL, 'KV', 'Elsenheimerstr. 39', 'München', '80687', 'Ansprechpartner für Abrechnungsfragen und Zulassungsangelegenheiten.', false, NOW(), NOW()),
(gen_random_uuid(), 2, 'Lisa', 'Meyer', 'Physiotherapie Meyer', 'Praxisleitung', 'termine@physio-meyer.de', '089 89012345', '0175 5678901', 'Therapie', 'Bewegungsweg 7', 'München', '80335', 'Physiotherapie-Überweisungen. Kurze Wartezeit, gutes Feedback.', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. CALENDAR EVENTS - Termine
-- =====================================================

INSERT INTO calendar_events (id, practice_id, title, description, event_type, start_time, end_time, location, is_recurring, color, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 'Teambesprechung', 'Wöchentliche Teambesprechung zur Abstimmung', 'meeting', (CURRENT_DATE + INTERVAL '2 days')::date + TIME '08:00', (CURRENT_DATE + INTERVAL '2 days')::date + TIME '08:30', 'Sozialraum', true, '#8b5cf6', NOW(), NOW()),
(gen_random_uuid(), 2, 'QM-Audit extern', 'Externes Qualitätsaudit durch TÜV Süd', 'appointment', (CURRENT_DATE + INTERVAL '30 days')::date + TIME '09:00', (CURRENT_DATE + INTERVAL '30 days')::date + TIME '12:00', 'Praxis', false, '#ef4444', NOW(), NOW()),
(gen_random_uuid(), 2, 'Fortbildung: Diabetes Update', 'Online-Fortbildung Diabetologie 2026', 'training', (CURRENT_DATE + INTERVAL '14 days')::date + TIME '18:00', (CURRENT_DATE + INTERVAL '14 days')::date + TIME '20:00', 'Online', false, '#10b981', NOW(), NOW()),
(gen_random_uuid(), 2, 'Praxisurlaub', 'Betriebsurlaub Weihnachten/Neujahr', 'holiday', '2026-12-23'::date + TIME '00:00', '2027-01-02'::date + TIME '23:59', 'Praxis', false, '#f59e0b', NOW(), NOW()),
(gen_random_uuid(), 2, 'Labor Abholdienst', 'Tägliche Laborproben-Abholung', 'reminder', CURRENT_DATE::date + TIME '11:00', CURRENT_DATE::date + TIME '11:15', 'Labor', true, '#3b82f6', NOW(), NOW()),
(gen_random_uuid(), 2, 'Wartung Ultraschall', 'Jährliche Wartung Ultraschallgerät', 'maintenance', (CURRENT_DATE + INTERVAL '21 days')::date + TIME '14:00', (CURRENT_DATE + INTERVAL '21 days')::date + TIME '16:00', 'Behandlungsraum 1', false, '#6366f1', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. INVENTORY ITEMS - Lagerbestand
-- =====================================================

INSERT INTO inventory_items (id, practice_id, name, description, category, unit, current_stock, min_stock, max_stock, price, supplier, is_active, created_at, updated_at) VALUES
('inv-demo-001', 2, 'Einmalhandschuhe Nitril M', 'Nitril-Handschuhe puderfrei Größe M', 'Schutzausrüstung', 'Box', 45, 20, 100, 12.50, 'Medizin Großhandel', true, NOW(), NOW()),
('inv-demo-002', 2, 'Desinfektionsmittel Hände 500ml', 'Sterillium classic pure Händedesinfektionsmittel', 'Hygiene', 'Flasche', 28, 15, 50, 8.90, 'Bode Chemie', true, NOW(), NOW()),
('inv-demo-003', 2, 'Kanülen Blutentnahme 21G', 'Vacutainer Kanülen grün 21G', 'Labor', 'Packung', 35, 20, 80, 15.60, 'BD Medical', true, NOW(), NOW()),
('inv-demo-004', 2, 'EKG-Elektroden', 'Einmal-Klebeelektroden für EKG', 'Diagnostik', 'Beutel', 12, 10, 30, 22.40, 'Medizin Großhandel', true, NOW(), NOW()),
('inv-demo-005', 2, 'Verbandsmull steril 10x10', 'Sterile Mullkompressen 10x10cm', 'Verbandsmaterial', 'Packung', 65, 30, 100, 4.80, 'Hartmann', true, NOW(), NOW()),
('inv-demo-006', 2, 'Infusionsbesteck', 'Schwerkraft-Infusionsset mit Tropfkammer', 'Infusion', 'Stück', 40, 25, 80, 1.90, 'B.Braun', true, NOW(), NOW()),
('inv-demo-007', 2, 'Impfstoff Influenza', 'Vaxigrip Tetra Grippeimpfstoff', 'Impfstoffe', 'Dosis', 85, 50, 200, 14.50, 'Sanofi', true, NOW(), NOW()),
('inv-demo-008', 2, 'Druckerpatrone Rezeptdrucker', 'Originalpatrone für Rezeptdrucker', 'Büro', 'Stück', 4, 2, 8, 35.00, 'Bürotechnik Müller', true, NOW(), NOW()),
('inv-demo-009', 2, 'Ultraschallgel 250ml', 'Kontaktgel für Ultraschalluntersuchungen', 'Diagnostik', 'Flasche', 18, 10, 30, 5.40, 'Medizin Großhandel', true, NOW(), NOW()),
('inv-demo-010', 2, 'Blutdruckmanschetten Einmal', 'Einmal-Manschetten Erwachsene Standard', 'Diagnostik', 'Stück', 95, 50, 150, 1.20, 'Hartmann', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 12. DOCUMENTS - Dokumente
-- =====================================================

INSERT INTO documents (id, practice_id, name, description, category, file_url, mime_type, file_size, is_favorite, view_count, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 'QM-Handbuch 2026', 'Aktuelles Qualitätsmanagement-Handbuch der Praxis', 'QM', '/documents/qm-handbuch-2026.pdf', 'application/pdf', 2450000, true, 45, NOW(), NOW()),
(gen_random_uuid(), 2, 'Hygieneplan', 'Vollständiger Hygieneplan nach RKI-Empfehlungen', 'Hygiene', '/documents/hygieneplan.pdf', 'application/pdf', 890000, true, 89, NOW(), NOW()),
(gen_random_uuid(), 2, 'Arbeitsanweisungen Labor', 'SOPs für alle Laboruntersuchungen', 'Labor', '/documents/sop-labor.pdf', 'application/pdf', 1230000, false, 34, NOW(), NOW()),
(gen_random_uuid(), 2, 'Notfallplan', 'Notfallablaufplan mit Zuständigkeiten', 'Notfall', '/documents/notfallplan.pdf', 'application/pdf', 560000, true, 67, NOW(), NOW()),
(gen_random_uuid(), 2, 'Datenschutzkonzept', 'DSGVO-konformes Datenschutzkonzept', 'Datenschutz', '/documents/datenschutz.pdf', 'application/pdf', 780000, false, 23, NOW(), NOW()),
(gen_random_uuid(), 2, 'Medizinprodukte-Verzeichnis', 'Übersicht aller Medizinprodukte mit MPG-Dokumentation', 'Geräte', '/documents/medizinprodukte.xlsx', 'application/vnd.ms-excel', 340000, false, 12, NOW(), NOW()),
(gen_random_uuid(), 2, 'Musterverträge Arbeitsverträge', 'Vorlagen für Arbeitsverträge MFA', 'Personal', '/documents/arbeitsvertrag-vorlage.docx', 'application/msword', 125000, false, 8, NOW(), NOW()),
(gen_random_uuid(), 2, 'Gefahrstoffverzeichnis', 'Liste aller Gefahrstoffe mit Sicherheitsdatenblättern', 'Arbeitssicherheit', '/documents/gefahrstoffe.pdf', 'application/pdf', 1890000, false, 15, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 13. LEITBILD - Mission & Vision
-- =====================================================

INSERT INTO leitbild (id, practice_id, mission_statement, vision_statement, leitbild_one_sentence, core_values, is_active, version, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 
'Wir sind Ihre erste Anlaufstelle für ganzheitliche hausärztliche Versorgung. Mit modernster Medizin, persönlicher Zuwendung und einem engagierten Team begleiten wir Sie und Ihre Familie durch alle Lebensphasen – präventiv, heilend und beratend.',
'Unsere Vision ist eine Hausarztpraxis, die medizinische Exzellenz mit menschlicher Wärme verbindet. Wir wollen der vertrauensvolle Gesundheitspartner unserer Patienten sein – heute und für kommende Generationen.',
'Ihr Hausarzt mit Herz und Verstand – modern, persönlich, nah.',
'[
  {"value": "Patientenorientierung", "description": "Der Patient steht im Mittelpunkt all unseres Handelns"},
  {"value": "Qualität", "description": "Wir arbeiten nach höchsten medizinischen Standards"},
  {"value": "Teamgeist", "description": "Gemeinsam sind wir stark für unsere Patienten"},
  {"value": "Innovation", "description": "Wir nutzen moderne Technologien zum Wohle unserer Patienten"},
  {"value": "Vertrauen", "description": "Diskretion und Verlässlichkeit sind unser Fundament"}
]'::jsonb,
true, 1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 14. WORKFLOWS - Arbeitsabläufe
-- =====================================================

INSERT INTO workflows (id, practice_id, title, description, category, status, priority, current_step, steps, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 'Neue Patienten Aufnahme', 'Standardprozess für die Aufnahme neuer Patienten', 'Patientenmanagement', 'active', 'high', 1,
'[
  {"order": 1, "title": "Stammdaten erfassen", "description": "Personalien, Versicherung, Kontaktdaten aufnehmen", "status": "completed"},
  {"order": 2, "title": "Datenschutzerklärung", "description": "DSGVO-Einwilligung einholen und dokumentieren", "status": "completed"},
  {"order": 3, "title": "Anamnese aufnehmen", "description": "Erstanamnese mit Vorerkrankungen und Medikamenten", "status": "in_progress"},
  {"order": 4, "title": "Impfpass prüfen", "description": "Impfstatus erfassen und Empfehlungen aussprechen", "status": "pending"},
  {"order": 5, "title": "Hausarztvertrag anbieten", "description": "Bei GKV-Patienten HzV-Vertrag erläutern", "status": "pending"}
]'::jsonb, NOW(), NOW()),

(gen_random_uuid(), 2, 'Check-up 35+', 'Gesundheits-Check-up für Patienten ab 35 Jahren', 'Vorsorge', 'active', 'medium', 1,
'[
  {"order": 1, "title": "Termin vereinbaren", "description": "Termin für Check-up mit ausreichend Zeit einplanen (45 Min)", "status": "completed"},
  {"order": 2, "title": "Fragebogen zusenden", "description": "Anamnesebogen vorab per Post oder E-Mail", "status": "completed"},
  {"order": 3, "title": "Labor durchführen", "description": "Blutentnahme nüchtern: Blutbild, BZ, Cholesterin, Kreatinin", "status": "in_progress"},
  {"order": 4, "title": "Urinuntersuchung", "description": "Urinstix auf Eiweiß, Zucker, Blut", "status": "pending"},
  {"order": 5, "title": "Körperliche Untersuchung", "description": "Ganzkörperstatus inkl. RR, Gewicht, BMI", "status": "pending"},
  {"order": 6, "title": "Beratungsgespräch", "description": "Befundbesprechung und präventive Beratung", "status": "pending"}
]'::jsonb, NOW(), NOW()),

(gen_random_uuid(), 2, 'Praxis-Tagesstart', 'Checkliste für den Praxisbeginn jeden Morgen', 'Organisation', 'template', 'medium', 1,
'[
  {"order": 1, "title": "Wartezimmer vorbereiten", "description": "Licht, Lüften, Zeitschriften ordnen", "status": "pending"},
  {"order": 2, "title": "Behandlungsräume checken", "description": "Material auffüllen, Liegen beziehen", "status": "pending"},
  {"order": 3, "title": "Labor vorbereiten", "description": "Kühlschrank-Temperatur prüfen, Material bereitlegen", "status": "pending"},
  {"order": 4, "title": "EDV hochfahren", "description": "Computer starten, Drucker checken", "status": "pending"},
  {"order": 5, "title": "Terminplan sichten", "description": "Besondere Termine und Notizen für heute", "status": "pending"}
]'::jsonb, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 15. QUALITY CIRCLE SESSIONS - QM-Zirkel
-- =====================================================

INSERT INTO quality_circle_sessions (id, practice_id, title, description, scheduled_date, meeting_type, status, location, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 'QZ: Arzneimitteltherapiesicherheit', 'Besprechung von AMTS-Maßnahmen und Medikationsplan', (CURRENT_DATE + INTERVAL '45 days')::timestamp, 'quality_circle', 'scheduled', 'Besprechungsraum', NOW(), NOW()),
(gen_random_uuid(), 2, 'QZ: Patientenkommunikation', 'Verbesserung der Arzt-Patienten-Kommunikation', (CURRENT_DATE + INTERVAL '90 days')::timestamp, 'quality_circle', 'scheduled', 'Besprechungsraum', NOW(), NOW()),
(gen_random_uuid(), 2, 'QZ: Hygienemanagement', 'Review der Hygienemaßnahmen und aktuelle RKI-Empfehlungen', (CURRENT_DATE - INTERVAL '30 days')::timestamp, 'quality_circle', 'completed', 'Besprechungsraum', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 16. ORG CHART POSITIONS - Organigramm
-- =====================================================

INSERT INTO org_chart_positions (id, practice_id, position_title, department, level, is_management, is_active, display_order, created_at, updated_at) VALUES
('org-demo-001', '2', 'Praxisleitung / Ärztliche Leitung', 'Geschäftsführung', 1, true, true, 1, NOW(), NOW()),
('org-demo-002', '2', 'Stellv. Ärztliche Leitung', 'Geschäftsführung', 2, true, true, 2, NOW(), NOW()),
('org-demo-003', '2', 'Praxismanagement', 'Verwaltung', 2, true, true, 3, NOW(), NOW()),
('org-demo-004', '2', 'Teamleitung MFA', 'MFA', 3, true, true, 4, NOW(), NOW()),
('org-demo-005', '2', 'MFA Empfang', 'MFA', 4, false, true, 5, NOW(), NOW()),
('org-demo-006', '2', 'MFA Labor', 'MFA', 4, false, true, 6, NOW(), NOW()),
('org-demo-007', '2', 'MFA Behandlung', 'MFA', 4, false, true, 7, NOW(), NOW()),
('org-demo-008', '2', 'Auszubildende', 'MFA', 5, false, true, 8, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Set hierarchy
UPDATE org_chart_positions SET reports_to_position_id = 'org-demo-001' WHERE id = 'org-demo-002' AND practice_id = '2';
UPDATE org_chart_positions SET reports_to_position_id = 'org-demo-001' WHERE id = 'org-demo-003' AND practice_id = '2';
UPDATE org_chart_positions SET reports_to_position_id = 'org-demo-003' WHERE id = 'org-demo-004' AND practice_id = '2';
UPDATE org_chart_positions SET reports_to_position_id = 'org-demo-004' WHERE id IN ('org-demo-005', 'org-demo-006', 'org-demo-007') AND practice_id = '2';
UPDATE org_chart_positions SET reports_to_position_id = 'org-demo-004' WHERE id = 'org-demo-008' AND practice_id = '2';

-- =====================================================
-- 17. ROI ANALYSES - Investitionsanalysen
-- =====================================================

INSERT INTO roi_analyses (id, practice_id, title, description, investment_type, initial_investment, expected_revenue, recurring_costs, roi_percentage, time_to_roi_months, roi_score, status, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 'Online-Terminbuchung System', 'Implementierung eines digitalen Terminbuchungssystems zur Entlastung des Empfangs', 'Software', 2400.00, 8500.00, 79.00, 254, 8, 85, 'approved',  NOW(), NOW()),
(gen_random_uuid(), 2, 'Neues Ultraschallgerät', 'Anschaffung eines modernen Ultraschallgeräts mit 3D-Funktion für erweiterte Diagnostik', 'Gerät', 35000.00, 48000.00, 1200.00, 37, 18, 72, 'in_review', NOW(), NOW()),
(gen_random_uuid(), 2, 'LED-Beleuchtung Praxis', 'Umrüstung der gesamten Praxisbeleuchtung auf energieeffiziente LED', 'Infrastruktur', 4800.00, 1800.00, 0, 38, 32, 58, 'approved', NOW(), NOW()),
(gen_random_uuid(), 2, 'Telemedizin-Plattform', 'Einführung von Videosprechstunden für ausgewählte Konsultationen', 'Software', 1200.00, 12000.00, 150.00, 900, 3, 92, 'implemented', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 18. WELLBEING SUGGESTIONS - Team-Wohlbefinden
-- =====================================================

INSERT INTO wellbeing_suggestions (id, practice_id, title, description, category, impact_level, effort_level, estimated_cost, created_at) VALUES
(gen_random_uuid(), 2, 'Ergonomische Arbeitsplätze', 'Höhenverstellbare Schreibtische und ergonomische Stühle für alle Arbeitsplätze', 'Arbeitsplatz', 'high', 'medium', '2000-5000€', NOW()),
(gen_random_uuid(), 2, 'Teamfrühstück monatlich', 'Gemeinsames Teamfrühstück einmal pro Monat zur Stärkung des Zusammenhalts', 'Team', 'medium', 'low', '<500€', NOW()),
(gen_random_uuid(), 2, 'Ruheraum einrichten', 'Kleinen Ruheraum für Pausen mit Entspannungsmöglichkeit schaffen', 'Arbeitsplatz', 'high', 'high', '>5000€', NOW()),
(gen_random_uuid(), 2, 'Flexible Arbeitszeiten', 'Gleitzeit-Modell einführen wo organisatorisch möglich', 'Work-Life-Balance', 'high', 'medium', 'keine', NOW()),
(gen_random_uuid(), 2, 'Obstkorb & Getränke', 'Kostenlose Getränke und wöchentlicher Obstkorb für das Team', 'Verpflegung', 'low', 'low', '500-1000€', NOW()),
(gen_random_uuid(), 2, 'Fortbildungsbudget erhöhen', 'Individuelles Fortbildungsbudget von 500€ pro Jahr und Mitarbeiter', 'Entwicklung', 'medium', 'medium', '2000-5000€', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 19. COMPETITOR ANALYSES - Wettbewerbsanalyse
-- =====================================================

INSERT INTO competitor_analyses (id, practice_id, name, specialty, location, status, created_at, updated_at,
swot_analysis, market_insights, recommendations) VALUES
(gen_random_uuid(), 2, 'Wettbewerbsanalyse München Zentrum 2026', 'Allgemeinmedizin', 'München', 'completed', NOW(), NOW(),
'{
  "strengths": ["Zentrale Lage", "Moderne Ausstattung", "Erfahrenes Team", "Gute Online-Bewertungen"],
  "weaknesses": ["Begrenzte Parkplätze", "Längere Wartezeiten zu Stoßzeiten", "Keine Samstags-Sprechstunde"],
  "opportunities": ["Telemedizin ausbauen", "Präventionsangebote erweitern", "Kooperation mit Apotheken"],
  "threats": ["Neue MVZ-Gründung in der Nähe", "Ärztemangel bei Nachfolgersuche", "Digitale Konkurrenz"]
}'::jsonb,
'{
  "market_size": "ca. 15.000 potenzielle Patienten im Einzugsgebiet",
  "competition": "4 Hausarztpraxen im Umkreis von 1km",
  "trends": ["Steigende Nachfrage nach Präventionsleistungen", "Wachsender IGeL-Markt", "Telemedizin-Akzeptanz steigt"]
}'::jsonb,
'{
  "short_term": ["Online-Terminbuchung optimieren", "Wartezeit-Management verbessern"],
  "medium_term": ["Samstags-Notsprechstunde einführen", "IGeL-Angebot erweitern"],
  "long_term": ["MVZ-Struktur prüfen", "Nachfolgeplanung starten"]
}'::jsonb)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 20. PRACTICE SETTINGS - Praxiseinstellungen
-- =====================================================

INSERT INTO practice_settings (id, practice_id, ai_enabled, analytics_enabled, notification_settings, system_settings, security_settings, created_at, updated_at) VALUES
(gen_random_uuid(), 2, true, true,
'{
  "email_notifications": true,
  "push_notifications": true,
  "reminder_before_days": 1,
  "weekly_summary": true,
  "instant_alerts": true
}'::jsonb,
'{
  "language": "de",
  "timezone": "Europe/Berlin",
  "date_format": "DD.MM.YYYY",
  "time_format": "24h",
  "currency": "EUR"
}'::jsonb,
'{
  "two_factor_auth": false,
  "session_timeout_minutes": 60,
  "password_expiry_days": 90,
  "min_password_length": 12
}'::jsonb,
NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- DONE! Demo Hausarztpraxis erfolgreich angelegt
-- =====================================================

-- Summary:
-- Practice ID: 2
-- Name: Hausarztpraxis Dr. med. Sarah Müller
-- 10 Rooms
-- 7 Workplaces
-- 5 Shift Types
-- 5 Teams
-- 10 Todos
-- 6 Goals
-- 6 Knowledge Base Articles
-- 3 Protocols
-- 8 Contacts
-- 6 Calendar Events
-- 10 Inventory Items
-- 8 Documents
-- 1 Mission/Vision Statement
-- 3 Workflows
-- 3 Quality Circle Sessions
-- 8 Org Chart Positions
-- 4 ROI Analyses
-- 6 Wellbeing Suggestions
-- 1 Competitor Analysis
-- 1 Practice Settings
