-- Remove any existing knockout matches and predictions (clean slate)
DELETE FROM predictions WHERE match_id IN (SELECT id FROM matches WHERE round != 'group');
DELETE FROM matches WHERE round != 'group';

-- Make team IDs nullable so bracket slots can exist before real teams qualify
ALTER TABLE matches ALTER COLUMN home_team_id DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN away_team_id DROP NOT NULL;

-- Add slot label columns (display text until real teams are known)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_slot TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_slot TEXT;

-- Seed all 32 knockout bracket matches
-- Users can predict all rounds from day 1; admin assigns real teams as groups finish
INSERT INTO matches (match_number, home_team_id, away_team_id, group_id, round, scheduled_at, status, home_slot, away_slot)
VALUES
-- ── Ronda de 32: pares de grupos (12 partidos) ──────────────────────────────
(73,  NULL, NULL, NULL, 'round_of_32', '2026-07-04 18:00:00+00', 'scheduled', '1° Grupo A', '2° Grupo B'),
(74,  NULL, NULL, NULL, 'round_of_32', '2026-07-04 21:00:00+00', 'scheduled', '2° Grupo A', '1° Grupo B'),
(75,  NULL, NULL, NULL, 'round_of_32', '2026-07-05 18:00:00+00', 'scheduled', '1° Grupo C', '2° Grupo D'),
(76,  NULL, NULL, NULL, 'round_of_32', '2026-07-05 21:00:00+00', 'scheduled', '2° Grupo C', '1° Grupo D'),
(77,  NULL, NULL, NULL, 'round_of_32', '2026-07-06 18:00:00+00', 'scheduled', '1° Grupo E', '2° Grupo F'),
(78,  NULL, NULL, NULL, 'round_of_32', '2026-07-06 21:00:00+00', 'scheduled', '2° Grupo E', '1° Grupo F'),
(79,  NULL, NULL, NULL, 'round_of_32', '2026-07-07 18:00:00+00', 'scheduled', '1° Grupo G', '2° Grupo H'),
(80,  NULL, NULL, NULL, 'round_of_32', '2026-07-07 21:00:00+00', 'scheduled', '2° Grupo G', '1° Grupo H'),
(81,  NULL, NULL, NULL, 'round_of_32', '2026-07-08 18:00:00+00', 'scheduled', '1° Grupo I', '2° Grupo J'),
(82,  NULL, NULL, NULL, 'round_of_32', '2026-07-08 21:00:00+00', 'scheduled', '2° Grupo I', '1° Grupo J'),
(83,  NULL, NULL, NULL, 'round_of_32', '2026-07-09 18:00:00+00', 'scheduled', '1° Grupo K', '2° Grupo L'),
(84,  NULL, NULL, NULL, 'round_of_32', '2026-07-09 21:00:00+00', 'scheduled', '2° Grupo K', '1° Grupo L'),
-- ── Ronda de 32: mejores 3os lugares (4 partidos, admin asigna equipos) ─────
(85,  NULL, NULL, NULL, 'round_of_32', '2026-07-04 15:00:00+00', 'scheduled', '3° (TBD)', '3° (TBD)'),
(86,  NULL, NULL, NULL, 'round_of_32', '2026-07-05 15:00:00+00', 'scheduled', '3° (TBD)', '3° (TBD)'),
(87,  NULL, NULL, NULL, 'round_of_32', '2026-07-06 15:00:00+00', 'scheduled', '3° (TBD)', '3° (TBD)'),
(88,  NULL, NULL, NULL, 'round_of_32', '2026-07-07 15:00:00+00', 'scheduled', '3° (TBD)', '3° (TBD)'),
-- ── Octavos de Final (8 partidos) ────────────────────────────────────────────
(89,  NULL, NULL, NULL, 'round_of_16', '2026-07-12 18:00:00+00', 'scheduled', 'W Partido 73', 'W Partido 74'),
(90,  NULL, NULL, NULL, 'round_of_16', '2026-07-12 21:00:00+00', 'scheduled', 'W Partido 75', 'W Partido 76'),
(91,  NULL, NULL, NULL, 'round_of_16', '2026-07-13 18:00:00+00', 'scheduled', 'W Partido 77', 'W Partido 78'),
(92,  NULL, NULL, NULL, 'round_of_16', '2026-07-13 21:00:00+00', 'scheduled', 'W Partido 79', 'W Partido 80'),
(93,  NULL, NULL, NULL, 'round_of_16', '2026-07-14 18:00:00+00', 'scheduled', 'W Partido 81', 'W Partido 82'),
(94,  NULL, NULL, NULL, 'round_of_16', '2026-07-14 21:00:00+00', 'scheduled', 'W Partido 83', 'W Partido 84'),
(95,  NULL, NULL, NULL, 'round_of_16', '2026-07-15 18:00:00+00', 'scheduled', 'W Partido 85', 'W Partido 86'),
(96,  NULL, NULL, NULL, 'round_of_16', '2026-07-15 21:00:00+00', 'scheduled', 'W Partido 87', 'W Partido 88'),
-- ── Cuartos de Final (4 partidos) ────────────────────────────────────────────
(97,  NULL, NULL, NULL, 'quarter_final', '2026-07-18 18:00:00+00', 'scheduled', 'W Partido 89', 'W Partido 90'),
(98,  NULL, NULL, NULL, 'quarter_final', '2026-07-18 21:00:00+00', 'scheduled', 'W Partido 91', 'W Partido 92'),
(99,  NULL, NULL, NULL, 'quarter_final', '2026-07-19 18:00:00+00', 'scheduled', 'W Partido 93', 'W Partido 94'),
(100, NULL, NULL, NULL, 'quarter_final', '2026-07-19 21:00:00+00', 'scheduled', 'W Partido 95', 'W Partido 96'),
-- ── Semifinales (2 partidos) ──────────────────────────────────────────────────
(101, NULL, NULL, NULL, 'semi_final', '2026-07-22 21:00:00+00', 'scheduled', 'W Partido 97', 'W Partido 98'),
(102, NULL, NULL, NULL, 'semi_final', '2026-07-23 21:00:00+00', 'scheduled', 'W Partido 99', 'W Partido 100'),
-- ── Tercer Lugar ──────────────────────────────────────────────────────────────
(103, NULL, NULL, NULL, 'third_place', '2026-07-25 21:00:00+00', 'scheduled', 'L Partido 101', 'L Partido 102'),
-- ── Final ─────────────────────────────────────────────────────────────────────
(104, NULL, NULL, NULL, 'final', '2026-07-26 21:00:00+00', 'scheduled', 'W Partido 101', 'W Partido 102');
