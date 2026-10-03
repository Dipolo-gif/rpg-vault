-- =====================================================================
-- RPG VAULT :: magias e espaços de magia
--
-- A ficha oficial separa as magias por círculo, com os espaços de cada
-- um no topo. Aqui é a mesma coisa: cada magia é uma linha com o nível
-- dela, e os espaços ficam em character_stats.magias, junto com o
-- atributo de conjuração.
-- =====================================================================

create table if not exists public.spells (
  id               uuid primary key default gen_random_uuid(),
  character_id     uuid not null references public.characters (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,

  -- 0 é truque, que não gasta espaço.
  level            smallint not null default 0 check (level between 0 and 9),
  name             text not null check (char_length(trim(name)) between 1 and 160),
  school           text check (char_length(school) <= 40),
  casting_time     text check (char_length(casting_time) <= 80),
  range            text check (char_length(range) <= 80),
  components       text check (char_length(components) <= 120),
  duration         text check (char_length(duration) <= 80),
  concentration    boolean not null default false,
  ritual           boolean not null default false,

  -- Preparada é o que vale hoje; sempre preparada é a magia de domínio,
  -- de juramento, de item, que não ocupa a lista do dia.
  prepared         boolean not null default true,
  always_prepared  boolean not null default false,

  /* Chave da magia no catálogo (src/lib/spell-catalog.json), quando veio
     de lá. Magia inventada na mesa fica com nulo. */
  catalog_slug     text check (char_length(catalog_slug) <= 120),
  reference_url    text check (char_length(reference_url) <= 300),

  description_html text,
  description_text text,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists spells_character_idx
  on public.spells (character_id, level, sort_order, name);
create index if not exists spells_user_id_idx on public.spells (user_id);

-- A mesma magia não entra duas vezes no mesmo personagem.
create unique index if not exists spells_sem_repetir
  on public.spells (character_id, lower(trim(name)));

-- ---------------------------------------------------------------------
-- Dono vem do personagem, nunca do cliente
-- ---------------------------------------------------------------------
create or replace function public.set_spell_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin
  select c.user_id into owner_id
    from public.characters c
   where c.id = new.character_id;

  if owner_id is null then
    raise exception 'Personagem % nao encontrado', new.character_id using errcode = '23503';
  end if;

  new.user_id = owner_id;
  return new;
end;
$$;

drop trigger if exists spells_set_owner on public.spells;
create trigger spells_set_owner
  before insert or update of character_id on public.spells
  for each row execute function public.set_spell_owner();

drop trigger if exists spells_set_updated_at on public.spells;
create trigger spells_set_updated_at
  before update on public.spells
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Espaços de magia e atributo de conjuração
-- ---------------------------------------------------------------------
alter table public.character_stats
  add column if not exists magias jsonb not null default '{}'::jsonb;

comment on column public.character_stats.magias is
  'Espaços por círculo e atributo de conjuração. Formato em src/lib/spells.ts';

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.spells enable row level security;

drop policy if exists spells_select_own on public.spells;
create policy spells_select_own on public.spells
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists spells_insert_own on public.spells;
create policy spells_insert_own on public.spells
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists spells_update_own on public.spells;
create policy spells_update_own on public.spells
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists spells_delete_own on public.spells;
create policy spells_delete_own on public.spells
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.spells to authenticated;

-- Função de trigger não vira RPC pública.
revoke execute on function public.set_spell_owner() from public, anon, authenticated;
