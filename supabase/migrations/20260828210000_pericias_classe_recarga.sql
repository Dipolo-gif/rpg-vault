-- =====================================================================
-- RPG VAULT :: pericias automatizadas, habilidade de classe e recarga
-- =====================================================================

-- Habilidade de classe entra como quarta fonte, ao lado de item,
-- fluxo e talento.
alter type public.ability_source add value if not exists 'classe';

-- Uso proprio tambem recarrega ("1 por dia", "1 por semana"), igual as
-- cargas do item ja tinham a nota de recuperacao.
alter table public.abilities
  add column if not exists uses_note text check (char_length(uses_note) <= 200);

-- Pericias: bonus de proficiencia, estado de cada pericia e ajustes na mao.
-- A lista de pericias e o atributo de cada uma vivem no preset do sistema,
-- em src/lib/systems.ts, entao mudar de sistema nao exige migration.
-- Formato do JSONB em src/lib/skills.ts
alter table public.character_stats
  add column if not exists skills jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------
-- Atributos e pericias que a mesa inventou, por personagem.
-- O preset do sistema e o ponto de partida, e este campo e o que a ficha
-- daquela mesa acrescenta por cima. Assim uma casa que cria uma pericia
-- nova nao precisa de migration nem de um preset novo.
-- Formato: { "attributes": [{key,label,short}], "skills": [{key,label,attribute}] }
-- ---------------------------------------------------------------------
alter table public.character_stats
  add column if not exists custom jsonb not null default '{}'::jsonb;
