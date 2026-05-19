-- Agregar confederación a cada equipo
ALTER TABLE teams ADD COLUMN IF NOT EXISTS confederation TEXT;

UPDATE teams SET confederation = 'UEFA' WHERE name IN (
  'Alemania','España','Francia','Inglaterra','Países Bajos','Portugal',
  'Bélgica','Croacia','Suiza','Austria','Noruega','Suecia','Escocia',
  'Bosnia y Herzegovina','Chequia','Turquía'
);

UPDATE teams SET confederation = 'CAF' WHERE name IN (
  'Sudáfrica','Marruecos','Senegal','Egipto','Ghana',
  'Costa de Marfil','Congo RD','Cabo Verde','Argelia','Túnez'
);

UPDATE teams SET confederation = 'CONCACAF' WHERE name IN (
  'México','Estados Unidos','Canadá','Panamá','Curazao','Haití'
);

UPDATE teams SET confederation = 'CONMEBOL' WHERE name IN (
  'Argentina','Brasil','Colombia','Ecuador','Paraguay','Uruguay'
);

UPDATE teams SET confederation = 'AFC' WHERE name IN (
  'Japón','Corea del Sur','Arabia Saudita','Irán',
  'Jordania','Australia','Iraq','Qatar','Uzbekistán'
);

UPDATE teams SET confederation = 'OFC' WHERE name = 'Nueva Zelanda';
