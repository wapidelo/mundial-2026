-- ============================================================
-- Quiniela Mundial 2026 — Seed Data
-- ⚠️  Verifica los grupos y horarios con el calendario oficial:
--     https://www.fifa.com/en/tournaments/mens/worldcup/canada-mexico-usa2026
-- ============================================================

-- Grupos
insert into groups (name) values
  ('A'), ('B'), ('C'), ('D'), ('E'), ('F'),
  ('G'), ('H'), ('I'), ('J'), ('K'), ('L');

-- ============================================================
-- Equipos (48 equipos — verifica las asignaciones de grupo)
-- ============================================================
-- GRUPO A
insert into teams (name, flag_emoji, group_id) values
  ('México',         '🇲🇽', (select id from groups where name = 'A')),
  ('Ecuador',        '🇪🇨', (select id from groups where name = 'A')),
  ('Mali',           '🇲🇱', (select id from groups where name = 'A')),
  ('Islandia',       '🇮🇸', (select id from groups where name = 'A'));

-- GRUPO B
insert into teams (name, flag_emoji, group_id) values
  ('Argentina',      '🇦🇷', (select id from groups where name = 'B')),
  ('Chile',          '🇨🇱', (select id from groups where name = 'B')),
  ('Marruecos',      '🇲🇦', (select id from groups where name = 'B')),
  ('Eslovaquia',     '🇸🇰', (select id from groups where name = 'B'));

-- GRUPO C
insert into teams (name, flag_emoji, group_id) values
  ('Brasil',         '🇧🇷', (select id from groups where name = 'C')),
  ('Colombia',       '🇨🇴', (select id from groups where name = 'C')),
  ('Nigeria',        '🇳🇬', (select id from groups where name = 'C')),
  ('Costa Rica',     '🇨🇷', (select id from groups where name = 'C'));

-- GRUPO D
insert into teams (name, flag_emoji, group_id) values
  ('Estados Unidos', '🇺🇸', (select id from groups where name = 'D')),
  ('Uruguay',        '🇺🇾', (select id from groups where name = 'D')),
  ('Panamá',         '🇵🇦', (select id from groups where name = 'D')),
  ('Argelia',        '🇩🇿', (select id from groups where name = 'D'));

-- GRUPO E
insert into teams (name, flag_emoji, group_id) values
  ('España',         '🇪🇸', (select id from groups where name = 'E')),
  ('Alemania',       '🇩🇪', (select id from groups where name = 'E')),
  ('Japón',          '🇯🇵', (select id from groups where name = 'E')),
  ('Honduras',       '🇭🇳', (select id from groups where name = 'E'));

-- GRUPO F
insert into teams (name, flag_emoji, group_id) values
  ('Francia',        '🇫🇷', (select id from groups where name = 'F')),
  ('Portugal',       '🇵🇹', (select id from groups where name = 'F')),
  ('Senegal',        '🇸🇳', (select id from groups where name = 'F')),
  ('Jamaica',        '🇯🇲', (select id from groups where name = 'F'));

-- GRUPO G
insert into teams (name, flag_emoji, group_id) values
  ('Inglaterra',     '🏴󠁧󠁢󠁥󠁮󠁧󠁿', (select id from groups where name = 'G')),
  ('Países Bajos',   '🇳🇱', (select id from groups where name = 'G')),
  ('Arabia Saudita', '🇸🇦', (select id from groups where name = 'G')),
  ('Venezuela',      '🇻🇪', (select id from groups where name = 'G'));

-- GRUPO H
insert into teams (name, flag_emoji, group_id) values
  ('Canadá',         '🇨🇦', (select id from groups where name = 'H')),
  ('Bélgica',        '🇧🇪', (select id from groups where name = 'H')),
  ('Camerún',        '🇨🇲', (select id from groups where name = 'H')),
  ('Nueva Zelanda',  '🇳🇿', (select id from groups where name = 'H'));

-- GRUPO I
insert into teams (name, flag_emoji, group_id) values
  ('Italia',         '🇮🇹', (select id from groups where name = 'I')),
  ('Croacia',        '🇭🇷', (select id from groups where name = 'I')),
  ('Egipto',         '🇪🇬', (select id from groups where name = 'I')),
  ('Paraguay',       '🇵🇾', (select id from groups where name = 'I'));

-- GRUPO J
insert into teams (name, flag_emoji, group_id) values
  ('Corea del Sur',  '🇰🇷', (select id from groups where name = 'J')),
  ('Polonia',        '🇵🇱', (select id from groups where name = 'J')),
  ('Ghana',          '🇬🇭', (select id from groups where name = 'J')),
  ('El Salvador',    '🇸🇻', (select id from groups where name = 'J'));

-- GRUPO K
insert into teams (name, flag_emoji, group_id) values
  ('Turquía',        '🇹🇷', (select id from groups where name = 'K')),
  ('Austria',        '🇦🇹', (select id from groups where name = 'K')),
  ('Irán',           '🇮🇷', (select id from groups where name = 'K')),
  ('Costa de Marfil','🇨🇮', (select id from groups where name = 'K'));

-- GRUPO L
insert into teams (name, flag_emoji, group_id) values
  ('Australia',      '🇦🇺', (select id from groups where name = 'L')),
  ('Dinamarca',      '🇩🇰', (select id from groups where name = 'L')),
  ('Sudáfrica',      '🇿🇦', (select id from groups where name = 'L')),
  ('Suiza',          '🇨🇭', (select id from groups where name = 'L'));

-- ============================================================
-- Partidos (72 partidos de fase de grupos)
-- Jornada 1: Jun 11-15 | Jornada 2: Jun 16-20 | Jornada 3: Jun 21-26
-- Ajusta las fechas según el calendario oficial de FIFA
-- ============================================================

-- GRUPO A (México, Ecuador, Mali, Islandia)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (1,  (select id from groups where name='A'), (select id from teams where name='México'),  (select id from teams where name='Islandia'),  '2026-06-11 19:00:00-05'),
  (2,  (select id from groups where name='A'), (select id from teams where name='Ecuador'), (select id from teams where name='Mali'),       '2026-06-12 16:00:00-05'),
  (3,  (select id from groups where name='A'), (select id from teams where name='México'),  (select id from teams where name='Ecuador'),    '2026-06-16 16:00:00-05'),
  (4,  (select id from groups where name='A'), (select id from teams where name='Islandia'),(select id from teams where name='Mali'),       '2026-06-16 19:00:00-05'),
  (5,  (select id from groups where name='A'), (select id from teams where name='México'),  (select id from teams where name='Mali'),       '2026-06-21 16:00:00-05'),
  (6,  (select id from groups where name='A'), (select id from teams where name='Islandia'),(select id from teams where name='Ecuador'),    '2026-06-21 16:00:00-05');

-- GRUPO B (Argentina, Chile, Marruecos, Eslovaquia)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (7,  (select id from groups where name='B'), (select id from teams where name='Argentina'),  (select id from teams where name='Eslovaquia'), '2026-06-12 13:00:00-04'),
  (8,  (select id from groups where name='B'), (select id from teams where name='Marruecos'),  (select id from teams where name='Chile'),      '2026-06-13 13:00:00-04'),
  (9,  (select id from groups where name='B'), (select id from teams where name='Argentina'),  (select id from teams where name='Marruecos'),  '2026-06-17 16:00:00-04'),
  (10, (select id from groups where name='B'), (select id from teams where name='Chile'),      (select id from teams where name='Eslovaquia'), '2026-06-17 13:00:00-04'),
  (11, (select id from groups where name='B'), (select id from teams where name='Argentina'),  (select id from teams where name='Chile'),      '2026-06-22 16:00:00-04'),
  (12, (select id from groups where name='B'), (select id from teams where name='Eslovaquia'),(select id from teams where name='Marruecos'),  '2026-06-22 16:00:00-04');

-- GRUPO C (Brasil, Colombia, Nigeria, Costa Rica)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (13, (select id from groups where name='C'), (select id from teams where name='Brasil'),    (select id from teams where name='Costa Rica'), '2026-06-12 19:00:00-04'),
  (14, (select id from groups where name='C'), (select id from teams where name='Colombia'),  (select id from teams where name='Nigeria'),     '2026-06-13 16:00:00-04'),
  (15, (select id from groups where name='C'), (select id from teams where name='Brasil'),    (select id from teams where name='Colombia'),    '2026-06-17 19:00:00-04'),
  (16, (select id from groups where name='C'), (select id from teams where name='Nigeria'),   (select id from teams where name='Costa Rica'),  '2026-06-18 13:00:00-04'),
  (17, (select id from groups where name='C'), (select id from teams where name='Brasil'),    (select id from teams where name='Nigeria'),     '2026-06-23 16:00:00-04'),
  (18, (select id from groups where name='C'), (select id from teams where name='Costa Rica'),(select id from teams where name='Colombia'),    '2026-06-23 16:00:00-04');

-- GRUPO D (Estados Unidos, Uruguay, Panamá, Argelia)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (19, (select id from groups where name='D'), (select id from teams where name='Estados Unidos'),(select id from teams where name='Argelia'),  '2026-06-13 19:00:00-04'),
  (20, (select id from groups where name='D'), (select id from teams where name='Uruguay'),       (select id from teams where name='Panamá'),   '2026-06-14 13:00:00-04'),
  (21, (select id from groups where name='D'), (select id from teams where name='Estados Unidos'),(select id from teams where name='Panamá'),   '2026-06-18 16:00:00-04'),
  (22, (select id from groups where name='D'), (select id from teams where name='Argelia'),       (select id from teams where name='Uruguay'),  '2026-06-18 19:00:00-04'),
  (23, (select id from groups where name='D'), (select id from teams where name='Estados Unidos'),(select id from teams where name='Uruguay'),  '2026-06-23 19:00:00-04'),
  (24, (select id from groups where name='D'), (select id from teams where name='Panamá'),        (select id from teams where name='Argelia'),  '2026-06-23 19:00:00-04');

-- GRUPO E (España, Alemania, Japón, Honduras)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (25, (select id from groups where name='E'), (select id from teams where name='España'),   (select id from teams where name='Honduras'), '2026-06-14 16:00:00-04'),
  (26, (select id from groups where name='E'), (select id from teams where name='Alemania'), (select id from teams where name='Japón'),    '2026-06-14 19:00:00-04'),
  (27, (select id from groups where name='E'), (select id from teams where name='España'),   (select id from teams where name='Japón'),    '2026-06-19 13:00:00-04'),
  (28, (select id from groups where name='E'), (select id from teams where name='Honduras'), (select id from teams where name='Alemania'), '2026-06-19 16:00:00-04'),
  (29, (select id from groups where name='E'), (select id from teams where name='España'),   (select id from teams where name='Alemania'), '2026-06-24 16:00:00-04'),
  (30, (select id from groups where name='E'), (select id from teams where name='Japón'),    (select id from teams where name='Honduras'), '2026-06-24 16:00:00-04');

-- GRUPO F (Francia, Portugal, Senegal, Jamaica)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (31, (select id from groups where name='F'), (select id from teams where name='Francia'),  (select id from teams where name='Jamaica'),  '2026-06-14 13:00:00-05'),
  (32, (select id from groups where name='F'), (select id from teams where name='Portugal'), (select id from teams where name='Senegal'),  '2026-06-15 13:00:00-04'),
  (33, (select id from groups where name='F'), (select id from teams where name='Francia'),  (select id from teams where name='Senegal'),  '2026-06-19 19:00:00-04'),
  (34, (select id from groups where name='F'), (select id from teams where name='Jamaica'),  (select id from teams where name='Portugal'), '2026-06-20 13:00:00-04'),
  (35, (select id from groups where name='F'), (select id from teams where name='Francia'),  (select id from teams where name='Portugal'), '2026-06-24 19:00:00-04'),
  (36, (select id from groups where name='F'), (select id from teams where name='Senegal'),  (select id from teams where name='Jamaica'),  '2026-06-24 19:00:00-04');

-- GRUPO G (Inglaterra, Países Bajos, Arabia Saudita, Venezuela)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (37, (select id from groups where name='G'), (select id from teams where name='Inglaterra'),    (select id from teams where name='Venezuela'),      '2026-06-15 16:00:00-04'),
  (38, (select id from groups where name='G'), (select id from teams where name='Países Bajos'),  (select id from teams where name='Arabia Saudita'), '2026-06-15 19:00:00-04'),
  (39, (select id from groups where name='G'), (select id from teams where name='Inglaterra'),    (select id from teams where name='Arabia Saudita'), '2026-06-20 16:00:00-04'),
  (40, (select id from groups where name='G'), (select id from teams where name='Venezuela'),     (select id from teams where name='Países Bajos'),   '2026-06-20 19:00:00-04'),
  (41, (select id from groups where name='G'), (select id from teams where name='Inglaterra'),    (select id from teams where name='Países Bajos'),   '2026-06-25 16:00:00-04'),
  (42, (select id from groups where name='G'), (select id from teams where name='Arabia Saudita'),(select id from teams where name='Venezuela'),      '2026-06-25 16:00:00-04');

-- GRUPO H (Canadá, Bélgica, Camerún, Nueva Zelanda)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (43, (select id from groups where name='H'), (select id from teams where name='Canadá'),       (select id from teams where name='Nueva Zelanda'), '2026-06-15 13:00:00-05'),
  (44, (select id from groups where name='H'), (select id from teams where name='Bélgica'),      (select id from teams where name='Camerún'),       '2026-06-15 16:00:00-05'),
  (45, (select id from groups where name='H'), (select id from teams where name='Canadá'),       (select id from teams where name='Camerún'),       '2026-06-20 13:00:00-05'),
  (46, (select id from groups where name='H'), (select id from teams where name='Nueva Zelanda'),(select id from teams where name='Bélgica'),       '2026-06-20 16:00:00-05'),
  (47, (select id from groups where name='H'), (select id from teams where name='Canadá'),       (select id from teams where name='Bélgica'),       '2026-06-25 13:00:00-05'),
  (48, (select id from groups where name='H'), (select id from teams where name='Camerún'),      (select id from teams where name='Nueva Zelanda'), '2026-06-25 13:00:00-05');

-- GRUPO I (Italia, Croacia, Egipto, Paraguay)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (49, (select id from groups where name='I'), (select id from teams where name='Italia'),   (select id from teams where name='Paraguay'), '2026-06-15 19:00:00-05'),
  (50, (select id from groups where name='I'), (select id from teams where name='Croacia'),  (select id from teams where name='Egipto'),   '2026-06-16 13:00:00-05'),
  (51, (select id from groups where name='I'), (select id from teams where name='Italia'),   (select id from teams where name='Egipto'),   '2026-06-20 19:00:00-05'),
  (52, (select id from groups where name='I'), (select id from teams where name='Paraguay'), (select id from teams where name='Croacia'),  '2026-06-21 13:00:00-05'),
  (53, (select id from groups where name='I'), (select id from teams where name='Italia'),   (select id from teams where name='Croacia'),  '2026-06-25 19:00:00-05'),
  (54, (select id from groups where name='I'), (select id from teams where name='Egipto'),   (select id from teams where name='Paraguay'), '2026-06-25 19:00:00-05');

-- GRUPO J (Corea del Sur, Polonia, Ghana, El Salvador)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (55, (select id from groups where name='J'), (select id from teams where name='Corea del Sur'),(select id from teams where name='El Salvador'), '2026-06-16 16:00:00-06'),
  (56, (select id from groups where name='J'), (select id from teams where name='Polonia'),      (select id from teams where name='Ghana'),        '2026-06-16 19:00:00-06'),
  (57, (select id from groups where name='J'), (select id from teams where name='Corea del Sur'),(select id from teams where name='Ghana'),        '2026-06-21 16:00:00-06'),
  (58, (select id from groups where name='J'), (select id from teams where name='El Salvador'),  (select id from teams where name='Polonia'),      '2026-06-21 19:00:00-06'),
  (59, (select id from groups where name='J'), (select id from teams where name='Corea del Sur'),(select id from teams where name='Polonia'),      '2026-06-26 16:00:00-06'),
  (60, (select id from groups where name='J'), (select id from teams where name='Ghana'),        (select id from teams where name='El Salvador'),  '2026-06-26 16:00:00-06');

-- GRUPO K (Turquía, Austria, Irán, Costa de Marfil)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (61, (select id from groups where name='K'), (select id from teams where name='Turquía'),        (select id from teams where name='Costa de Marfil'), '2026-06-12 16:00:00-06'),
  (62, (select id from groups where name='K'), (select id from teams where name='Austria'),         (select id from teams where name='Irán'),            '2026-06-12 19:00:00-06'),
  (63, (select id from groups where name='K'), (select id from teams where name='Turquía'),         (select id from teams where name='Irán'),            '2026-06-17 16:00:00-06'),
  (64, (select id from groups where name='K'), (select id from teams where name='Costa de Marfil'), (select id from teams where name='Austria'),         '2026-06-17 19:00:00-06'),
  (65, (select id from groups where name='K'), (select id from teams where name='Turquía'),         (select id from teams where name='Austria'),         '2026-06-22 19:00:00-06'),
  (66, (select id from groups where name='K'), (select id from teams where name='Irán'),             (select id from teams where name='Costa de Marfil'), '2026-06-22 19:00:00-06');

-- GRUPO L (Australia, Dinamarca, Sudáfrica, Suiza)
insert into matches (match_number, group_id, home_team_id, away_team_id, scheduled_at) values
  (67, (select id from groups where name='L'), (select id from teams where name='Australia'),  (select id from teams where name='Suiza'),      '2026-06-11 13:00:00-07'),
  (68, (select id from groups where name='L'), (select id from teams where name='Dinamarca'),  (select id from teams where name='Sudáfrica'),  '2026-06-11 16:00:00-07'),
  (69, (select id from groups where name='L'), (select id from teams where name='Australia'),  (select id from teams where name='Sudáfrica'),  '2026-06-16 13:00:00-07'),
  (70, (select id from groups where name='L'), (select id from teams where name='Suiza'),      (select id from teams where name='Dinamarca'),  '2026-06-16 16:00:00-07'),
  (71, (select id from groups where name='L'), (select id from teams where name='Australia'),  (select id from teams where name='Dinamarca'),  '2026-06-21 19:00:00-07'),
  (72, (select id from groups where name='L'), (select id from teams where name='Sudáfrica'),  (select id from teams where name='Suiza'),      '2026-06-21 19:00:00-07');
