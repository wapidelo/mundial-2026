-- ============================================================
-- Fix: Equipos y partidos reales del Mundial 2026
-- Fuente: Sorteo oficial FIFA, 5 diciembre 2025 (Kennedy Center, Washington D.C.)
-- Calendario verificado: SportBusy.com + bracketmundial2026.com
-- Todos los horarios en ET (UTC-4, horario de verano de la Costa Este)
-- ============================================================

-- 1. Limpiar predicciones (tienen FK a matches y teams)
DELETE FROM bonus_predictions;
DELETE FROM predictions;

-- 2. Resetear asignaciones de equipos en partidos eliminatorios (FK a teams)
UPDATE matches SET home_team_id = NULL, away_team_id = NULL
WHERE round != 'group';

-- 3. Borrar todos los partidos de fase de grupos (son incorrectos)
DELETE FROM matches WHERE round = 'group';

-- 4. Borrar todos los equipos (son incorrectos)
DELETE FROM teams;

-- ============================================================
-- 5. Re-insertar los 48 equipos clasificados oficiales
-- ============================================================

-- GRUPO A: México, Sudáfrica, Corea del Sur, Chequia
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('México',        '🇲🇽', (SELECT id FROM groups WHERE name = 'A')),
  ('Sudáfrica',     '🇿🇦', (SELECT id FROM groups WHERE name = 'A')),
  ('Corea del Sur', '🇰🇷', (SELECT id FROM groups WHERE name = 'A')),
  ('Chequia',       '🇨🇿', (SELECT id FROM groups WHERE name = 'A'));

-- GRUPO B: Canadá, Bosnia y Herzegovina, Qatar, Suiza
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('Canadá',               '🇨🇦', (SELECT id FROM groups WHERE name = 'B')),
  ('Bosnia y Herzegovina', '🇧🇦', (SELECT id FROM groups WHERE name = 'B')),
  ('Qatar',                '🇶🇦', (SELECT id FROM groups WHERE name = 'B')),
  ('Suiza',                '🇨🇭', (SELECT id FROM groups WHERE name = 'B'));

-- GRUPO C: Brasil, Marruecos, Haití, Escocia
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('Brasil',    '🇧🇷',        (SELECT id FROM groups WHERE name = 'C')),
  ('Marruecos', '🇲🇦',        (SELECT id FROM groups WHERE name = 'C')),
  ('Haití',     '🇭🇹',        (SELECT id FROM groups WHERE name = 'C')),
  ('Escocia',   '🏴󠁧󠁢󠁳󠁣󠁴󠁿', (SELECT id FROM groups WHERE name = 'C'));

-- GRUPO D: Estados Unidos, Paraguay, Australia, Turquía
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('Estados Unidos', '🇺🇸', (SELECT id FROM groups WHERE name = 'D')),
  ('Paraguay',       '🇵🇾', (SELECT id FROM groups WHERE name = 'D')),
  ('Australia',      '🇦🇺', (SELECT id FROM groups WHERE name = 'D')),
  ('Turquía',        '🇹🇷', (SELECT id FROM groups WHERE name = 'D'));

-- GRUPO E: Alemania, Curazao, Costa de Marfil, Ecuador
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('Alemania',        '🇩🇪', (SELECT id FROM groups WHERE name = 'E')),
  ('Curazao',         '🇨🇼', (SELECT id FROM groups WHERE name = 'E')),
  ('Costa de Marfil', '🇨🇮', (SELECT id FROM groups WHERE name = 'E')),
  ('Ecuador',         '🇪🇨', (SELECT id FROM groups WHERE name = 'E'));

-- GRUPO F: Países Bajos, Japón, Túnez, Suecia
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('Países Bajos', '🇳🇱', (SELECT id FROM groups WHERE name = 'F')),
  ('Japón',        '🇯🇵', (SELECT id FROM groups WHERE name = 'F')),
  ('Túnez',        '🇹🇳', (SELECT id FROM groups WHERE name = 'F')),
  ('Suecia',       '🇸🇪', (SELECT id FROM groups WHERE name = 'F'));

-- GRUPO G: Bélgica, Egipto, Irán, Nueva Zelanda
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('Bélgica',       '🇧🇪', (SELECT id FROM groups WHERE name = 'G')),
  ('Egipto',        '🇪🇬', (SELECT id FROM groups WHERE name = 'G')),
  ('Irán',          '🇮🇷', (SELECT id FROM groups WHERE name = 'G')),
  ('Nueva Zelanda', '🇳🇿', (SELECT id FROM groups WHERE name = 'G'));

-- GRUPO H: España, Cabo Verde, Arabia Saudita, Uruguay
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('España',         '🇪🇸', (SELECT id FROM groups WHERE name = 'H')),
  ('Cabo Verde',     '🇨🇻', (SELECT id FROM groups WHERE name = 'H')),
  ('Arabia Saudita', '🇸🇦', (SELECT id FROM groups WHERE name = 'H')),
  ('Uruguay',        '🇺🇾', (SELECT id FROM groups WHERE name = 'H'));

-- GRUPO I: Francia, Senegal, Noruega, Iraq
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('Francia', '🇫🇷', (SELECT id FROM groups WHERE name = 'I')),
  ('Senegal', '🇸🇳', (SELECT id FROM groups WHERE name = 'I')),
  ('Noruega', '🇳🇴', (SELECT id FROM groups WHERE name = 'I')),
  ('Iraq',    '🇮🇶', (SELECT id FROM groups WHERE name = 'I'));

-- GRUPO J: Argentina, Argelia, Austria, Jordania
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('Argentina', '🇦🇷', (SELECT id FROM groups WHERE name = 'J')),
  ('Argelia',   '🇩🇿', (SELECT id FROM groups WHERE name = 'J')),
  ('Austria',   '🇦🇹', (SELECT id FROM groups WHERE name = 'J')),
  ('Jordania',  '🇯🇴', (SELECT id FROM groups WHERE name = 'J'));

-- GRUPO K: Portugal, Congo RD, Uzbekistán, Colombia
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('Portugal',   '🇵🇹', (SELECT id FROM groups WHERE name = 'K')),
  ('Congo RD',   '🇨🇩', (SELECT id FROM groups WHERE name = 'K')),
  ('Uzbekistán', '🇺🇿', (SELECT id FROM groups WHERE name = 'K')),
  ('Colombia',   '🇨🇴', (SELECT id FROM groups WHERE name = 'K'));

-- GRUPO L: Inglaterra, Croacia, Ghana, Panamá
INSERT INTO teams (name, flag_emoji, group_id) VALUES
  ('Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', (SELECT id FROM groups WHERE name = 'L')),
  ('Croacia',    '🇭🇷',        (SELECT id FROM groups WHERE name = 'L')),
  ('Ghana',      '🇬🇭',        (SELECT id FROM groups WHERE name = 'L')),
  ('Panamá',     '🇵🇦',        (SELECT id FROM groups WHERE name = 'L'));

-- ============================================================
-- 6. Re-insertar los 72 partidos de fase de grupos (calendario oficial)
-- ============================================================

-- GRUPO A (México, Sudáfrica, Corea del Sur, Chequia)
-- J1: Jun 11-12 | J2: Jun 18-19 | J3: Jun 25 (simultáneos)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (1, (SELECT id FROM groups WHERE name='A'),
      (SELECT id FROM teams WHERE name='Sudáfrica'),    (SELECT id FROM teams WHERE name='México'),        '2026-06-11 15:00:00-04', 'group', 'scheduled'),
  (2, (SELECT id FROM groups WHERE name='A'),
      (SELECT id FROM teams WHERE name='Chequia'),      (SELECT id FROM teams WHERE name='Corea del Sur'), '2026-06-12 22:00:00-04', 'group', 'scheduled'),
  (3, (SELECT id FROM groups WHERE name='A'),
      (SELECT id FROM teams WHERE name='Sudáfrica'),    (SELECT id FROM teams WHERE name='Chequia'),       '2026-06-18 12:00:00-04', 'group', 'scheduled'),
  (4, (SELECT id FROM groups WHERE name='A'),
      (SELECT id FROM teams WHERE name='Corea del Sur'),(SELECT id FROM teams WHERE name='México'),        '2026-06-19 21:00:00-04', 'group', 'scheduled'),
  (5, (SELECT id FROM groups WHERE name='A'),
      (SELECT id FROM teams WHERE name='Corea del Sur'),(SELECT id FROM teams WHERE name='Sudáfrica'),     '2026-06-25 21:00:00-04', 'group', 'scheduled'),
  (6, (SELECT id FROM groups WHERE name='A'),
      (SELECT id FROM teams WHERE name='México'),       (SELECT id FROM teams WHERE name='Chequia'),       '2026-06-25 21:00:00-04', 'group', 'scheduled');

-- GRUPO B (Canadá, Bosnia y Herzegovina, Qatar, Suiza)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (7,  (SELECT id FROM groups WHERE name='B'),
       (SELECT id FROM teams WHERE name='Bosnia y Herzegovina'), (SELECT id FROM teams WHERE name='Canadá'),               '2026-06-12 15:00:00-04', 'group', 'scheduled'),
  (8,  (SELECT id FROM groups WHERE name='B'),
       (SELECT id FROM teams WHERE name='Suiza'),                (SELECT id FROM teams WHERE name='Qatar'),                '2026-06-13 15:00:00-04', 'group', 'scheduled'),
  (9,  (SELECT id FROM groups WHERE name='B'),
       (SELECT id FROM teams WHERE name='Bosnia y Herzegovina'), (SELECT id FROM teams WHERE name='Suiza'),                '2026-06-18 15:00:00-04', 'group', 'scheduled'),
  (10, (SELECT id FROM groups WHERE name='B'),
       (SELECT id FROM teams WHERE name='Qatar'),                (SELECT id FROM teams WHERE name='Canadá'),               '2026-06-18 18:00:00-04', 'group', 'scheduled'),
  (11, (SELECT id FROM groups WHERE name='B'),
       (SELECT id FROM teams WHERE name='Canadá'),               (SELECT id FROM teams WHERE name='Suiza'),                '2026-06-24 15:00:00-04', 'group', 'scheduled'),
  (12, (SELECT id FROM groups WHERE name='B'),
       (SELECT id FROM teams WHERE name='Qatar'),                (SELECT id FROM teams WHERE name='Bosnia y Herzegovina'), '2026-06-24 15:00:00-04', 'group', 'scheduled');

-- GRUPO C (Brasil, Marruecos, Haití, Escocia)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (13, (SELECT id FROM groups WHERE name='C'),
       (SELECT id FROM teams WHERE name='Marruecos'), (SELECT id FROM teams WHERE name='Brasil'),    '2026-06-13 18:00:00-04', 'group', 'scheduled'),
  (14, (SELECT id FROM groups WHERE name='C'),
       (SELECT id FROM teams WHERE name='Escocia'),   (SELECT id FROM teams WHERE name='Haití'),     '2026-06-14 21:00:00-04', 'group', 'scheduled'),
  (15, (SELECT id FROM groups WHERE name='C'),
       (SELECT id FROM teams WHERE name='Marruecos'), (SELECT id FROM teams WHERE name='Escocia'),   '2026-06-19 18:00:00-04', 'group', 'scheduled'),
  (16, (SELECT id FROM groups WHERE name='C'),
       (SELECT id FROM teams WHERE name='Haití'),     (SELECT id FROM teams WHERE name='Brasil'),    '2026-06-20 20:30:00-04', 'group', 'scheduled'),
  (17, (SELECT id FROM groups WHERE name='C'),
       (SELECT id FROM teams WHERE name='Brasil'),    (SELECT id FROM teams WHERE name='Escocia'),   '2026-06-24 18:00:00-04', 'group', 'scheduled'),
  (18, (SELECT id FROM groups WHERE name='C'),
       (SELECT id FROM teams WHERE name='Haití'),     (SELECT id FROM teams WHERE name='Marruecos'), '2026-06-24 18:00:00-04', 'group', 'scheduled');

-- GRUPO D (Estados Unidos, Paraguay, Australia, Turquía)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (19, (SELECT id FROM groups WHERE name='D'),
       (SELECT id FROM teams WHERE name='Paraguay'),       (SELECT id FROM teams WHERE name='Estados Unidos'), '2026-06-13 21:00:00-04', 'group', 'scheduled'),
  (20, (SELECT id FROM groups WHERE name='D'),
       (SELECT id FROM teams WHERE name='Turquía'),        (SELECT id FROM teams WHERE name='Australia'),      '2026-06-14 00:00:00-04', 'group', 'scheduled'),
  (21, (SELECT id FROM groups WHERE name='D'),
       (SELECT id FROM teams WHERE name='Australia'),      (SELECT id FROM teams WHERE name='Estados Unidos'), '2026-06-19 15:00:00-04', 'group', 'scheduled'),
  (22, (SELECT id FROM groups WHERE name='D'),
       (SELECT id FROM teams WHERE name='Paraguay'),       (SELECT id FROM teams WHERE name='Turquía'),        '2026-06-20 23:00:00-04', 'group', 'scheduled'),
  (23, (SELECT id FROM groups WHERE name='D'),
       (SELECT id FROM teams WHERE name='Estados Unidos'), (SELECT id FROM teams WHERE name='Turquía'),        '2026-06-26 22:00:00-04', 'group', 'scheduled'),
  (24, (SELECT id FROM groups WHERE name='D'),
       (SELECT id FROM teams WHERE name='Australia'),      (SELECT id FROM teams WHERE name='Paraguay'),       '2026-06-26 22:00:00-04', 'group', 'scheduled');

-- GRUPO E (Alemania, Curazao, Costa de Marfil, Ecuador)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (25, (SELECT id FROM groups WHERE name='E'),
       (SELECT id FROM teams WHERE name='Curazao'),        (SELECT id FROM teams WHERE name='Alemania'),        '2026-06-14 13:00:00-04', 'group', 'scheduled'),
  (26, (SELECT id FROM groups WHERE name='E'),
       (SELECT id FROM teams WHERE name='Ecuador'),        (SELECT id FROM teams WHERE name='Costa de Marfil'), '2026-06-14 19:00:00-04', 'group', 'scheduled'),
  (27, (SELECT id FROM groups WHERE name='E'),
       (SELECT id FROM teams WHERE name='Costa de Marfil'),(SELECT id FROM teams WHERE name='Alemania'),        '2026-06-20 16:00:00-04', 'group', 'scheduled'),
  (28, (SELECT id FROM groups WHERE name='E'),
       (SELECT id FROM teams WHERE name='Curazao'),        (SELECT id FROM teams WHERE name='Ecuador'),         '2026-06-21 20:00:00-04', 'group', 'scheduled'),
  (29, (SELECT id FROM groups WHERE name='E'),
       (SELECT id FROM teams WHERE name='Alemania'),       (SELECT id FROM teams WHERE name='Ecuador'),         '2026-06-25 16:00:00-04', 'group', 'scheduled'),
  (30, (SELECT id FROM groups WHERE name='E'),
       (SELECT id FROM teams WHERE name='Costa de Marfil'),(SELECT id FROM teams WHERE name='Curazao'),        '2026-06-25 16:00:00-04', 'group', 'scheduled');

-- GRUPO F (Países Bajos, Japón, Túnez, Suecia)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (31, (SELECT id FROM groups WHERE name='F'),
       (SELECT id FROM teams WHERE name='Japón'),        (SELECT id FROM teams WHERE name='Países Bajos'), '2026-06-14 16:00:00-04', 'group', 'scheduled'),
  (32, (SELECT id FROM groups WHERE name='F'),
       (SELECT id FROM teams WHERE name='Túnez'),        (SELECT id FROM teams WHERE name='Suecia'),       '2026-06-15 22:00:00-04', 'group', 'scheduled'),
  (33, (SELECT id FROM groups WHERE name='F'),
       (SELECT id FROM teams WHERE name='Suecia'),       (SELECT id FROM teams WHERE name='Países Bajos'), '2026-06-20 13:00:00-04', 'group', 'scheduled'),
  (34, (SELECT id FROM groups WHERE name='F'),
       (SELECT id FROM teams WHERE name='Japón'),        (SELECT id FROM teams WHERE name='Túnez'),        '2026-06-21 00:00:00-04', 'group', 'scheduled'),
  (35, (SELECT id FROM groups WHERE name='F'),
       (SELECT id FROM teams WHERE name='Países Bajos'), (SELECT id FROM teams WHERE name='Túnez'),        '2026-06-25 19:00:00-04', 'group', 'scheduled'),
  (36, (SELECT id FROM groups WHERE name='F'),
       (SELECT id FROM teams WHERE name='Suecia'),       (SELECT id FROM teams WHERE name='Japón'),        '2026-06-25 19:00:00-04', 'group', 'scheduled');

-- GRUPO G (Bélgica, Egipto, Irán, Nueva Zelanda)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (37, (SELECT id FROM groups WHERE name='G'),
       (SELECT id FROM teams WHERE name='Egipto'),        (SELECT id FROM teams WHERE name='Bélgica'),       '2026-06-15 15:00:00-04', 'group', 'scheduled'),
  (38, (SELECT id FROM groups WHERE name='G'),
       (SELECT id FROM teams WHERE name='Nueva Zelanda'), (SELECT id FROM teams WHERE name='Irán'),          '2026-06-16 21:00:00-04', 'group', 'scheduled'),
  (39, (SELECT id FROM groups WHERE name='G'),
       (SELECT id FROM teams WHERE name='Irán'),          (SELECT id FROM teams WHERE name='Bélgica'),       '2026-06-21 15:00:00-04', 'group', 'scheduled'),
  (40, (SELECT id FROM groups WHERE name='G'),
       (SELECT id FROM teams WHERE name='Egipto'),        (SELECT id FROM teams WHERE name='Nueva Zelanda'), '2026-06-22 21:00:00-04', 'group', 'scheduled'),
  (41, (SELECT id FROM groups WHERE name='G'),
       (SELECT id FROM teams WHERE name='Bélgica'),       (SELECT id FROM teams WHERE name='Nueva Zelanda'), '2026-06-27 23:00:00-04', 'group', 'scheduled'),
  (42, (SELECT id FROM groups WHERE name='G'),
       (SELECT id FROM teams WHERE name='Irán'),          (SELECT id FROM teams WHERE name='Egipto'),        '2026-06-27 23:00:00-04', 'group', 'scheduled');

-- GRUPO H (España, Cabo Verde, Arabia Saudita, Uruguay)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (43, (SELECT id FROM groups WHERE name='H'),
       (SELECT id FROM teams WHERE name='Cabo Verde'),     (SELECT id FROM teams WHERE name='España'),         '2026-06-15 12:00:00-04', 'group', 'scheduled'),
  (44, (SELECT id FROM groups WHERE name='H'),
       (SELECT id FROM teams WHERE name='Uruguay'),        (SELECT id FROM teams WHERE name='Arabia Saudita'), '2026-06-15 18:00:00-04', 'group', 'scheduled'),
  (45, (SELECT id FROM groups WHERE name='H'),
       (SELECT id FROM teams WHERE name='Arabia Saudita'), (SELECT id FROM teams WHERE name='España'),         '2026-06-21 12:00:00-04', 'group', 'scheduled'),
  (46, (SELECT id FROM groups WHERE name='H'),
       (SELECT id FROM teams WHERE name='Cabo Verde'),     (SELECT id FROM teams WHERE name='Uruguay'),        '2026-06-21 18:00:00-04', 'group', 'scheduled'),
  (47, (SELECT id FROM groups WHERE name='H'),
       (SELECT id FROM teams WHERE name='España'),         (SELECT id FROM teams WHERE name='Uruguay'),        '2026-06-27 20:00:00-04', 'group', 'scheduled'),
  (48, (SELECT id FROM groups WHERE name='H'),
       (SELECT id FROM teams WHERE name='Arabia Saudita'), (SELECT id FROM teams WHERE name='Cabo Verde'),     '2026-06-27 20:00:00-04', 'group', 'scheduled');

-- GRUPO I (Francia, Senegal, Noruega, Iraq)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (49, (SELECT id FROM groups WHERE name='I'),
       (SELECT id FROM teams WHERE name='Senegal'), (SELECT id FROM teams WHERE name='Francia'), '2026-06-16 15:00:00-04', 'group', 'scheduled'),
  (50, (SELECT id FROM groups WHERE name='I'),
       (SELECT id FROM teams WHERE name='Noruega'), (SELECT id FROM teams WHERE name='Iraq'),    '2026-06-16 18:00:00-04', 'group', 'scheduled'),
  (51, (SELECT id FROM groups WHERE name='I'),
       (SELECT id FROM teams WHERE name='Iraq'),    (SELECT id FROM teams WHERE name='Francia'), '2026-06-22 17:00:00-04', 'group', 'scheduled'),
  (52, (SELECT id FROM groups WHERE name='I'),
       (SELECT id FROM teams WHERE name='Senegal'), (SELECT id FROM teams WHERE name='Noruega'), '2026-06-23 20:00:00-04', 'group', 'scheduled'),
  (53, (SELECT id FROM groups WHERE name='I'),
       (SELECT id FROM teams WHERE name='Francia'), (SELECT id FROM teams WHERE name='Noruega'), '2026-06-26 15:00:00-04', 'group', 'scheduled'),
  (54, (SELECT id FROM groups WHERE name='I'),
       (SELECT id FROM teams WHERE name='Iraq'),    (SELECT id FROM teams WHERE name='Senegal'), '2026-06-26 15:00:00-04', 'group', 'scheduled');

-- GRUPO J (Argentina, Argelia, Austria, Jordania)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (55, (SELECT id FROM groups WHERE name='J'),
       (SELECT id FROM teams WHERE name='Argelia'),  (SELECT id FROM teams WHERE name='Argentina'), '2026-06-17 21:00:00-04', 'group', 'scheduled'),
  (56, (SELECT id FROM groups WHERE name='J'),
       (SELECT id FROM teams WHERE name='Jordania'), (SELECT id FROM teams WHERE name='Austria'),   '2026-06-17 00:00:00-04', 'group', 'scheduled'),
  (57, (SELECT id FROM groups WHERE name='J'),
       (SELECT id FROM teams WHERE name='Austria'),  (SELECT id FROM teams WHERE name='Argentina'), '2026-06-22 13:00:00-04', 'group', 'scheduled'),
  (58, (SELECT id FROM groups WHERE name='J'),
       (SELECT id FROM teams WHERE name='Argelia'),  (SELECT id FROM teams WHERE name='Jordania'),  '2026-06-23 23:00:00-04', 'group', 'scheduled'),
  (59, (SELECT id FROM groups WHERE name='J'),
       (SELECT id FROM teams WHERE name='Austria'),  (SELECT id FROM teams WHERE name='Argelia'),   '2026-06-28 22:00:00-04', 'group', 'scheduled'),
  (60, (SELECT id FROM groups WHERE name='J'),
       (SELECT id FROM teams WHERE name='Argentina'),(SELECT id FROM teams WHERE name='Jordania'),  '2026-06-28 22:00:00-04', 'group', 'scheduled');

-- GRUPO K (Portugal, Congo RD, Uzbekistán, Colombia)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (61, (SELECT id FROM groups WHERE name='K'),
       (SELECT id FROM teams WHERE name='Congo RD'),   (SELECT id FROM teams WHERE name='Portugal'),   '2026-06-17 13:00:00-04', 'group', 'scheduled'),
  (62, (SELECT id FROM groups WHERE name='K'),
       (SELECT id FROM teams WHERE name='Colombia'),   (SELECT id FROM teams WHERE name='Uzbekistán'), '2026-06-18 22:00:00-04', 'group', 'scheduled'),
  (63, (SELECT id FROM groups WHERE name='K'),
       (SELECT id FROM teams WHERE name='Uzbekistán'), (SELECT id FROM teams WHERE name='Portugal'),   '2026-06-23 13:00:00-04', 'group', 'scheduled'),
  (64, (SELECT id FROM groups WHERE name='K'),
       (SELECT id FROM teams WHERE name='Congo RD'),   (SELECT id FROM teams WHERE name='Colombia'),   '2026-06-24 22:00:00-04', 'group', 'scheduled'),
  (65, (SELECT id FROM groups WHERE name='K'),
       (SELECT id FROM teams WHERE name='Portugal'),   (SELECT id FROM teams WHERE name='Colombia'),   '2026-06-27 19:30:00-04', 'group', 'scheduled'),
  (66, (SELECT id FROM groups WHERE name='K'),
       (SELECT id FROM teams WHERE name='Uzbekistán'), (SELECT id FROM teams WHERE name='Congo RD'),   '2026-06-27 19:30:00-04', 'group', 'scheduled');

-- GRUPO L (Inglaterra, Croacia, Ghana, Panamá)
INSERT INTO matches (match_number, group_id, home_team_id, away_team_id, scheduled_at, round, status) VALUES
  (67, (SELECT id FROM groups WHERE name='L'),
       (SELECT id FROM teams WHERE name='Croacia'),    (SELECT id FROM teams WHERE name='Inglaterra'), '2026-06-17 16:00:00-04', 'group', 'scheduled'),
  (68, (SELECT id FROM groups WHERE name='L'),
       (SELECT id FROM teams WHERE name='Panamá'),     (SELECT id FROM teams WHERE name='Ghana'),      '2026-06-17 19:00:00-04', 'group', 'scheduled'),
  (69, (SELECT id FROM groups WHERE name='L'),
       (SELECT id FROM teams WHERE name='Ghana'),      (SELECT id FROM teams WHERE name='Inglaterra'), '2026-06-23 16:00:00-04', 'group', 'scheduled'),
  (70, (SELECT id FROM groups WHERE name='L'),
       (SELECT id FROM teams WHERE name='Croacia'),    (SELECT id FROM teams WHERE name='Panamá'),     '2026-06-23 19:00:00-04', 'group', 'scheduled'),
  (71, (SELECT id FROM groups WHERE name='L'),
       (SELECT id FROM teams WHERE name='Ghana'),      (SELECT id FROM teams WHERE name='Croacia'),    '2026-06-27 17:00:00-04', 'group', 'scheduled'),
  (72, (SELECT id FROM groups WHERE name='L'),
       (SELECT id FROM teams WHERE name='Inglaterra'), (SELECT id FROM teams WHERE name='Panamá'),     '2026-06-27 17:00:00-04', 'group', 'scheduled');
