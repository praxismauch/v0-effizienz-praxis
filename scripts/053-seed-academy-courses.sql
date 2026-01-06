-- Seed professional academy courses (tables already exist)
-- This script only inserts sample data

-- Clear existing data first (optional - comment out if you want to keep existing data)
-- DELETE FROM academy_lessons;
-- DELETE FROM academy_modules;
-- DELETE FROM academy_courses;
-- DELETE FROM academy_badges;

-- Insert badges for course completion
INSERT INTO academy_badges (id, name, description, icon, category, xp_reward, criteria_type, criteria_value)
VALUES 
  ('badge-praxis-org', 'Praxisorganisations-Profi', 'Kurs Praxisorganisation abgeschlossen', 'Building2', 'course_completion', 500, 'course_complete', 'course-praxis-org'),
  ('badge-digital', 'Digitalisierungs-Champion', 'Kurs Digitalisierung abgeschlossen', 'Laptop', 'course_completion', 500, 'course_complete', 'course-digital'),
  ('badge-kommunikation', 'Kommunikations-Experte', 'Kurs Patientenkommunikation abgeschlossen', 'MessageSquare', 'course_completion', 500, 'course_complete', 'course-kommunikation'),
  ('badge-qm', 'QM-Spezialist', 'Kurs Qualitätsmanagement abgeschlossen', 'Award', 'course_completion', 500, 'course_complete', 'course-qm'),
  ('badge-recht', 'Rechts-Kenner', 'Kurs Arbeitsrecht abgeschlossen', 'Scale', 'course_completion', 500, 'course_complete', 'course-recht'),
  ('badge-hygiene', 'Hygiene-Experte', 'Kurs Hygiene & Infektionsschutz abgeschlossen', 'Shield', 'course_completion', 500, 'course_complete', 'course-hygiene'),
  ('badge-first-course', 'Erster Kurs', 'Den ersten Kurs abgeschlossen', 'Star', 'milestone', 100, 'courses_completed', '1'),
  ('badge-five-courses', 'Wissensdurst', 'Fünf Kurse abgeschlossen', 'Trophy', 'milestone', 300, 'courses_completed', '5'),
  ('badge-streak-7', 'Wochenlerner', '7 Tage Lernstreak', 'Flame', 'streak', 150, 'streak_days', '7'),
  ('badge-streak-30', 'Monatslerner', '30 Tage Lernstreak', 'Zap', 'streak', 500, 'streak_days', '30')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  xp_reward = EXCLUDED.xp_reward;

-- Course 1: Praxisorganisation & Workflow-Optimierung
INSERT INTO academy_courses (id, title, description, category, difficulty, duration_minutes, xp_reward, thumbnail_url, is_published, is_featured, instructor_name, instructor_title, learning_objectives, prerequisites, tags)
VALUES (
  'course-praxis-org',
  'Praxisorganisation & Workflow-Optimierung',
  'Lernen Sie, wie Sie Ihre Praxisabläufe systematisch analysieren und optimieren können. Dieser Kurs vermittelt bewährte Methoden zur Steigerung der Effizienz und Patientenzufriedenheit.',
  'Organisation',
  'Einsteiger',
  180,
  500,
  '/placeholder.svg?height=400&width=600',
  true,
  true,
  'Dr. Maria Schmidt',
  'Praxismanagement-Expertin',
  ARRAY['Praxisabläufe analysieren und dokumentieren', 'Engpässe identifizieren und beseitigen', 'Lean-Methoden in der Praxis anwenden', 'Terminmanagement optimieren'],
  ARRAY['Keine Vorkenntnisse erforderlich'],
  ARRAY['Praxismanagement', 'Effizienz', 'Workflow', 'Organisation']
) ON CONFLICT (id) DO UPDATE SET is_published = true;

-- Course 2: Digitalisierung in der Arztpraxis
INSERT INTO academy_courses (id, title, description, category, difficulty, duration_minutes, xp_reward, thumbnail_url, is_published, is_featured, instructor_name, instructor_title, learning_objectives, prerequisites, tags)
VALUES (
  'course-digital',
  'Digitalisierung in der Arztpraxis',
  'Entdecken Sie die Möglichkeiten der digitalen Transformation für Ihre Praxis. Von der elektronischen Patientenakte bis zur Telemedizin - werden Sie fit für die Zukunft.',
  'Technologie',
  'Fortgeschritten',
  240,
  600,
  '/placeholder.svg?height=400&width=600',
  true,
  true,
  'Thomas Müller',
  'IT-Berater für Gesundheitswesen',
  ARRAY['Digitale Patientenakte verstehen und nutzen', 'Telemedizin rechtssicher einsetzen', 'Praxissoftware effektiv nutzen', 'Datenschutz bei digitalen Lösungen'],
  ARRAY['Grundkenntnisse PC-Nutzung'],
  ARRAY['Digitalisierung', 'ePA', 'Telemedizin', 'Software']
) ON CONFLICT (id) DO UPDATE SET is_published = true;

-- Course 3: Patientenkommunikation Excellence
INSERT INTO academy_courses (id, title, description, category, difficulty, duration_minutes, xp_reward, thumbnail_url, is_published, is_featured, instructor_name, instructor_title, learning_objectives, prerequisites, tags)
VALUES (
  'course-kommunikation',
  'Patientenkommunikation Excellence',
  'Professionelle Kommunikation ist der Schlüssel zu zufriedenen Patienten. Lernen Sie Techniken für schwierige Gespräche, Beschwerdemanagement und empathische Kommunikation.',
  'Kommunikation',
  'Einsteiger',
  150,
  400,
  '/placeholder.svg?height=400&width=600',
  true,
  false,
  'Sarah Wagner',
  'Kommunikationstrainerin',
  ARRAY['Aktives Zuhören praktizieren', 'Schwierige Gespräche führen', 'Beschwerden professionell behandeln', 'Nonverbale Kommunikation verstehen'],
  ARRAY['Keine Vorkenntnisse erforderlich'],
  ARRAY['Kommunikation', 'Patientenzufriedenheit', 'Soft Skills']
) ON CONFLICT (id) DO UPDATE SET is_published = true;

-- Course 4: Qualitätsmanagement nach QM-Richtlinie
INSERT INTO academy_courses (id, title, description, category, difficulty, duration_minutes, xp_reward, thumbnail_url, is_published, is_featured, instructor_name, instructor_title, learning_objectives, prerequisites, tags)
VALUES (
  'course-qm',
  'Qualitätsmanagement nach QM-Richtlinie',
  'Erfüllen Sie die gesetzlichen Anforderungen an das Qualitätsmanagement in Ihrer Praxis. Dieser Kurs führt Sie durch alle relevanten Aspekte der QM-Richtlinie.',
  'Qualität',
  'Fortgeschritten',
  300,
  700,
  '/placeholder.svg?height=400&width=600',
  true,
  true,
  'Prof. Dr. Hans Becker',
  'QM-Auditor & Berater',
  ARRAY['QM-Richtlinie verstehen und umsetzen', 'QM-Handbuch erstellen', 'Interne Audits durchführen', 'Kontinuierliche Verbesserung etablieren'],
  ARRAY['Grundkenntnisse Praxisorganisation'],
  ARRAY['QM', 'Qualität', 'Zertifizierung', 'Compliance']
) ON CONFLICT (id) DO UPDATE SET is_published = true;

-- Course 5: Arbeitsrecht für Praxisinhaber
INSERT INTO academy_courses (id, title, description, category, difficulty, duration_minutes, xp_reward, thumbnail_url, is_published, is_featured, instructor_name, instructor_title, learning_objectives, prerequisites, tags)
VALUES (
  'course-recht',
  'Arbeitsrecht für Praxisinhaber',
  'Rechtssicherheit im Personalmanagement: Von der Einstellung bis zur Kündigung - alles was Sie als Arbeitgeber wissen müssen.',
  'Recht',
  'Fortgeschritten',
  210,
  550,
  '/placeholder.svg?height=400&width=600',
  true,
  false,
  'RA Dr. Julia Klein',
  'Fachanwältin für Arbeitsrecht',
  ARRAY['Arbeitsverträge rechtssicher gestalten', 'Kündigungsschutz verstehen', 'Arbeitszeitgesetz einhalten', 'Mutterschutz und Elternzeit'],
  ARRAY['Keine Vorkenntnisse erforderlich'],
  ARRAY['Arbeitsrecht', 'Personal', 'Compliance', 'Verträge']
) ON CONFLICT (id) DO UPDATE SET is_published = true;

-- Course 6: Hygiene & Infektionsschutz
INSERT INTO academy_courses (id, title, description, category, difficulty, duration_minutes, xp_reward, thumbnail_url, is_published, is_featured, instructor_name, instructor_title, learning_objectives, prerequisites, tags)
VALUES (
  'course-hygiene',
  'Hygiene & Infektionsschutz',
  'Aktuelles Wissen zu Hygienevorschriften und Infektionsschutz in der Arztpraxis. Pflichtschulung für alle Mitarbeiter.',
  'Hygiene',
  'Einsteiger',
  120,
  350,
  '/placeholder.svg?height=400&width=600',
  true,
  false,
  'Dr. Petra Hoffmann',
  'Hygienefachärztin',
  ARRAY['Hygieneplan erstellen und umsetzen', 'Händehygiene korrekt durchführen', 'Desinfektionsmaßnahmen anwenden', 'RKI-Empfehlungen kennen'],
  ARRAY['Keine Vorkenntnisse erforderlich'],
  ARRAY['Hygiene', 'Infektionsschutz', 'RKI', 'Pflichtschulung']
) ON CONFLICT (id) DO UPDATE SET is_published = true;

-- Modules for Course 1: Praxisorganisation
INSERT INTO academy_modules (id, course_id, title, description, order_index, duration_minutes, xp_reward)
VALUES 
  ('mod-praxis-1', 'course-praxis-org', 'Grundlagen der Praxisorganisation', 'Einführung in die Prinzipien effektiver Praxisorganisation', 1, 45, 100),
  ('mod-praxis-2', 'course-praxis-org', 'Prozessanalyse & Dokumentation', 'Methoden zur Analyse und Dokumentation von Arbeitsabläufen', 2, 45, 100),
  ('mod-praxis-3', 'course-praxis-org', 'Terminmanagement', 'Optimierung der Terminplanung für maximale Effizienz', 3, 45, 150),
  ('mod-praxis-4', 'course-praxis-org', 'Lean Management in der Praxis', 'Anwendung von Lean-Prinzipien im Praxisalltag', 4, 45, 150)
ON CONFLICT (id) DO NOTHING;

-- Modules for Course 2: Digitalisierung
INSERT INTO academy_modules (id, course_id, title, description, order_index, duration_minutes, xp_reward)
VALUES 
  ('mod-digital-1', 'course-digital', 'Digitale Grundlagen', 'Überblick über digitale Technologien im Gesundheitswesen', 1, 60, 120),
  ('mod-digital-2', 'course-digital', 'Elektronische Patientenakte (ePA)', 'Einführung und Nutzung der elektronischen Patientenakte', 2, 60, 150),
  ('mod-digital-3', 'course-digital', 'Telemedizin & Videosprechstunde', 'Rechtliche und praktische Aspekte der Telemedizin', 3, 60, 150),
  ('mod-digital-4', 'course-digital', 'Datenschutz & IT-Sicherheit', 'DSGVO-konforme digitale Praxisführung', 4, 60, 180)
ON CONFLICT (id) DO NOTHING;

-- Modules for Course 3: Kommunikation
INSERT INTO academy_modules (id, course_id, title, description, order_index, duration_minutes, xp_reward)
VALUES 
  ('mod-komm-1', 'course-kommunikation', 'Grundlagen der Kommunikation', 'Kommunikationsmodelle und ihre Anwendung', 1, 40, 80),
  ('mod-komm-2', 'course-kommunikation', 'Aktives Zuhören', 'Techniken für empathisches Zuhören', 2, 35, 100),
  ('mod-komm-3', 'course-kommunikation', 'Schwierige Gespräche', 'Umgang mit Beschwerden und Konflikten', 3, 40, 120),
  ('mod-komm-4', 'course-kommunikation', 'Nonverbale Kommunikation', 'Körpersprache verstehen und einsetzen', 4, 35, 100)
ON CONFLICT (id) DO NOTHING;

-- Modules for Course 4: QM
INSERT INTO academy_modules (id, course_id, title, description, order_index, duration_minutes, xp_reward)
VALUES 
  ('mod-qm-1', 'course-qm', 'QM-Richtlinie Grundlagen', 'Gesetzliche Anforderungen und Grundprinzipien', 1, 60, 140),
  ('mod-qm-2', 'course-qm', 'QM-Handbuch erstellen', 'Schritt-für-Schritt zum eigenen QM-Handbuch', 2, 75, 180),
  ('mod-qm-3', 'course-qm', 'Interne Audits', 'Planung und Durchführung interner Audits', 3, 60, 160),
  ('mod-qm-4', 'course-qm', 'PDCA-Zyklus', 'Kontinuierliche Verbesserung implementieren', 4, 45, 120),
  ('mod-qm-5', 'course-qm', 'Zertifizierung vorbereiten', 'Vorbereitung auf externe Zertifizierung', 5, 60, 100)
ON CONFLICT (id) DO NOTHING;

-- Modules for Course 5: Arbeitsrecht
INSERT INTO academy_modules (id, course_id, title, description, order_index, duration_minutes, xp_reward)
VALUES 
  ('mod-recht-1', 'course-recht', 'Arbeitsvertrag', 'Rechtssichere Gestaltung von Arbeitsverträgen', 1, 50, 110),
  ('mod-recht-2', 'course-recht', 'Arbeitszeitrecht', 'Arbeitszeitgesetz und flexible Arbeitsmodelle', 2, 50, 110),
  ('mod-recht-3', 'course-recht', 'Kündigungsrecht', 'Kündigung und Kündigungsschutz', 3, 55, 150),
  ('mod-recht-4', 'course-recht', 'Besondere Schutzrechte', 'Mutterschutz, Elternzeit, Schwerbehinderung', 4, 55, 180)
ON CONFLICT (id) DO NOTHING;

-- Modules for Course 6: Hygiene
INSERT INTO academy_modules (id, course_id, title, description, order_index, duration_minutes, xp_reward)
VALUES 
  ('mod-hyg-1', 'course-hygiene', 'Hygieneplan Grundlagen', 'Erstellung und Pflege des Hygieneplans', 1, 30, 70),
  ('mod-hyg-2', 'course-hygiene', 'Händehygiene', 'Die 5 Momente der Händehygiene', 2, 30, 90),
  ('mod-hyg-3', 'course-hygiene', 'Flächendesinfektion', 'Korrekte Durchführung der Flächendesinfektion', 3, 30, 90),
  ('mod-hyg-4', 'course-hygiene', 'Aufbereitung von Medizinprodukten', 'Reinigung, Desinfektion, Sterilisation', 4, 30, 100)
ON CONFLICT (id) DO NOTHING;

-- Lessons for Module 1 of Praxisorganisation
INSERT INTO academy_lessons (id, module_id, title, content_type, content, order_index, duration_minutes, xp_reward)
VALUES 
  ('les-praxis-1-1', 'mod-praxis-1', 'Einführung in die Praxisorganisation', 'video', '{"videoUrl": "/videos/praxis-intro.mp4", "transcript": "Willkommen zum Kurs Praxisorganisation..."}', 1, 10, 20),
  ('les-praxis-1-2', 'mod-praxis-1', 'Die 5 Säulen effizienter Praxisführung', 'text', '# Die 5 Säulen effizienter Praxisführung\n\n## 1. Prozessoptimierung\nStandardisierte Abläufe reduzieren Fehler und sparen Zeit.\n\n## 2. Mitarbeiterführung\nMotivierte Teams sind produktiver.\n\n## 3. Patientenorientierung\nZufriedene Patienten sind loyale Patienten.\n\n## 4. Digitalisierung\nNutzen Sie moderne Tools zur Effizienzsteigerung.\n\n## 5. Qualitätsmanagement\nKontinuierliche Verbesserung als Prinzip.', 2, 15, 30),
  ('les-praxis-1-3', 'mod-praxis-1', 'Selbsttest: Wie organisiert ist Ihre Praxis?', 'interactive', '{"type": "assessment", "questions": 10}', 3, 10, 25),
  ('les-praxis-1-4', 'mod-praxis-1', 'Checkliste: Quick Wins für sofortige Verbesserung', 'document', '{"downloadUrl": "/docs/quick-wins-checkliste.pdf"}', 4, 10, 25)
ON CONFLICT (id) DO NOTHING;

-- Lessons for Module 2 of Praxisorganisation
INSERT INTO academy_lessons (id, module_id, title, content_type, content, order_index, duration_minutes, xp_reward)
VALUES 
  ('les-praxis-2-1', 'mod-praxis-2', 'Prozessmapping Grundlagen', 'video', '{"videoUrl": "/videos/prozessmapping.mp4"}', 1, 12, 25),
  ('les-praxis-2-2', 'mod-praxis-2', 'Swimlane-Diagramme erstellen', 'text', '# Swimlane-Diagramme\n\nSwimlane-Diagramme visualisieren Prozesse und Verantwortlichkeiten...', 2, 15, 30),
  ('les-praxis-2-3', 'mod-praxis-2', 'Praxisübung: Ihren ersten Prozess dokumentieren', 'interactive', '{"type": "exercise", "template": "process-template"}', 3, 18, 45)
ON CONFLICT (id) DO NOTHING;

-- Lessons for Digital Module 1
INSERT INTO academy_lessons (id, module_id, title, content_type, content, order_index, duration_minutes, xp_reward)
VALUES 
  ('les-digital-1-1', 'mod-digital-1', 'Die digitale Transformation im Gesundheitswesen', 'video', '{"videoUrl": "/videos/digital-transform.mp4"}', 1, 15, 30),
  ('les-digital-1-2', 'mod-digital-1', 'Übersicht: Digitale Tools für die Praxis', 'text', '# Digitale Tools für die moderne Praxis\n\n## Praxisverwaltungssysteme\n- Terminplanung\n- Patientendokumentation\n- Abrechnung\n\n## Kommunikationstools\n- Videosprechstunde\n- Patientenportal\n- Messenger', 2, 20, 35),
  ('les-digital-1-3', 'mod-digital-1', 'Digitalisierungsstrategie entwickeln', 'interactive', '{"type": "workshop", "steps": 5}', 3, 25, 55)
ON CONFLICT (id) DO NOTHING;

-- Lessons for Kommunikation Module 1
INSERT INTO academy_lessons (id, module_id, title, content_type, content, order_index, duration_minutes, xp_reward)
VALUES 
  ('les-komm-1-1', 'mod-komm-1', 'Das 4-Ohren-Modell', 'video', '{"videoUrl": "/videos/vier-ohren.mp4"}', 1, 12, 25),
  ('les-komm-1-2', 'mod-komm-1', 'Sender-Empfänger-Modell verstehen', 'text', '# Das Sender-Empfänger-Modell\n\nJede Kommunikation besteht aus Sender, Nachricht und Empfänger...', 2, 10, 20),
  ('les-komm-1-3', 'mod-komm-1', 'Übung: Kommunikationsanalyse', 'interactive', '{"type": "case-study", "scenarios": 3}', 3, 18, 35)
ON CONFLICT (id) DO NOTHING;

-- Lessons for QM Module 1
INSERT INTO academy_lessons (id, module_id, title, content_type, content, order_index, duration_minutes, xp_reward)
VALUES 
  ('les-qm-1-1', 'mod-qm-1', 'Die QM-Richtlinie des G-BA', 'video', '{"videoUrl": "/videos/qm-richtlinie.mp4"}', 1, 15, 35),
  ('les-qm-1-2', 'mod-qm-1', 'Die 5 Grundelemente des QM', 'text', '# Die 5 Grundelemente\n\n1. Patientenorientierung\n2. Mitarbeiterorientierung\n3. Prozessorientierung\n4. Fehlermanagement\n5. Kommunikation', 2, 20, 40),
  ('les-qm-1-3', 'mod-qm-1', 'Selbstbewertung: QM-Status Ihrer Praxis', 'interactive', '{"type": "self-assessment", "criteria": 15}', 3, 25, 65)
ON CONFLICT (id) DO NOTHING;

-- Lessons for Hygiene Module 2 (Händehygiene)
INSERT INTO academy_lessons (id, module_id, title, content_type, content, order_index, duration_minutes, xp_reward)
VALUES 
  ('les-hyg-2-1', 'mod-hyg-2', 'Die 5 Momente der Händehygiene', 'video', '{"videoUrl": "/videos/haendehygiene.mp4"}', 1, 10, 25),
  ('les-hyg-2-2', 'mod-hyg-2', 'Korrekte Händedesinfektion Schritt für Schritt', 'text', '# Händedesinfektion\n\n## Die 6 Schritte\n1. Handfläche auf Handfläche\n2. Rechte Handfläche über linkem Handrücken\n3. Handfläche auf Handfläche mit verschränkten Fingern\n4. Außenseite der Finger\n5. Kreisende Bewegung des Daumens\n6. Kreisende Bewegung mit geschlossenen Fingern', 2, 8, 20),
  ('les-hyg-2-3', 'mod-hyg-2', 'Quiz: Händehygiene', 'quiz', '{"quizId": "quiz-haende"}', 3, 12, 45)
ON CONFLICT (id) DO NOTHING;

-- Create Quiz for Händehygiene
INSERT INTO academy_quizzes (id, lesson_id, title, description, passing_score, time_limit_minutes, xp_reward)
VALUES 
  ('quiz-haende', 'les-hyg-2-3', 'Händehygiene-Quiz', 'Testen Sie Ihr Wissen zur korrekten Händehygiene', 80, 10, 50)
ON CONFLICT (id) DO NOTHING;

-- Quiz Questions
INSERT INTO academy_quiz_questions (id, quiz_id, question, question_type, order_index, points)
VALUES 
  ('qq-1', 'quiz-haende', 'Wie lange sollte eine Händedesinfektion mindestens dauern?', 'single_choice', 1, 10),
  ('qq-2', 'quiz-haende', 'Welche der folgenden gehören zu den 5 Momenten der Händehygiene?', 'multiple_choice', 2, 15),
  ('qq-3', 'quiz-haende', 'Wann ist Händewaschen der Händedesinfektion vorzuziehen?', 'single_choice', 3, 10),
  ('qq-4', 'quiz-haende', 'Wie viel Desinfektionsmittel sollte verwendet werden?', 'single_choice', 4, 10),
  ('qq-5', 'quiz-haende', 'Welche Bereiche werden bei der Händedesinfektion oft vergessen?', 'multiple_choice', 5, 15)
ON CONFLICT (id) DO NOTHING;

-- Quiz Options
INSERT INTO academy_quiz_options (id, question_id, option_text, is_correct, order_index)
VALUES 
  -- Question 1 options
  ('qo-1-1', 'qq-1', '10 Sekunden', false, 1),
  ('qo-1-2', 'qq-1', '30 Sekunden', true, 2),
  ('qo-1-3', 'qq-1', '1 Minute', false, 3),
  ('qo-1-4', 'qq-1', '5 Sekunden', false, 4),
  -- Question 2 options
  ('qo-2-1', 'qq-2', 'Vor Patientenkontakt', true, 1),
  ('qo-2-2', 'qq-2', 'Nach Patientenkontakt', true, 2),
  ('qo-2-3', 'qq-2', 'Nach dem Mittagessen', false, 3),
  ('qo-2-4', 'qq-2', 'Vor aseptischen Tätigkeiten', true, 4),
  -- Question 3 options
  ('qo-3-1', 'qq-3', 'Bei sichtbarer Verschmutzung', true, 1),
  ('qo-3-2', 'qq-3', 'Nach jedem Patientenkontakt', false, 2),
  ('qo-3-3', 'qq-3', 'Vor sterilen Eingriffen', false, 3),
  ('qo-3-4', 'qq-3', 'Niemals', false, 4),
  -- Question 4 options
  ('qo-4-1', 'qq-4', '1 ml', false, 1),
  ('qo-4-2', 'qq-4', '3-5 ml (eine Hohlhand voll)', true, 2),
  ('qo-4-3', 'qq-4', '10 ml', false, 3),
  ('qo-4-4', 'qq-4', 'So wenig wie möglich', false, 4),
  -- Question 5 options
  ('qo-5-1', 'qq-5', 'Fingerspitzen', true, 1),
  ('qo-5-2', 'qq-5', 'Daumen', true, 2),
  ('qo-5-3', 'qq-5', 'Handgelenke', true, 3),
  ('qo-5-4', 'qq-5', 'Handflächen', false, 4)
ON CONFLICT (id) DO NOTHING;

-- Update course statistics
UPDATE academy_courses SET 
  total_modules = (SELECT COUNT(*) FROM academy_modules WHERE course_id = academy_courses.id),
  total_lessons = (SELECT COUNT(*) FROM academy_lessons l JOIN academy_modules m ON l.module_id = m.id WHERE m.course_id = academy_courses.id);
