-- =====================================================================
-- RPG VAULT :: schema inicial
-- Postgres 15+ (Supabase). Rode no SQL Editor do painel ou via CLI.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Funcoes utilitarias
-- ---------------------------------------------------------------------

-- Mantem updated_at coerente sem depender da aplicacao.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Copia o dono do personagem para as tabelas filhas.
-- SECURITY DEFINER porque precisa ler characters ignorando a RLS.
-- A policy WITH CHECK roda depois do trigger, entao quem nao for o dono
-- do personagem toma erro de RLS mesmo que force o character_id na mao.
create or replace function public.set_owner_from_character()
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

-- ---------------------------------------------------------------------
-- profiles :: espelho publico de auth.users
-- A senha (password_hash) fica em auth.users, gerenciada pelo Supabase Auth.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text check (char_length(display_name) <= 80),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, 'aventureiro'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- characters
-- ---------------------------------------------------------------------
create table if not exists public.characters (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name             text not null check (char_length(trim(name)) between 1 and 120),
  system           text not null default 'dnd5e' check (char_length(system) <= 60),
  level            text check (char_length(level) <= 80), -- nivel (D&D) ou ocupacao (CoC)
  background_story text,
  avatar_path      text, -- caminho dentro do bucket privado, nao URL publica
  pdf_path         text,
  is_favorite      boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists characters_user_id_idx on public.characters (user_id, created_at desc);

drop trigger if exists characters_set_updated_at on public.characters;
create trigger characters_set_updated_at
  before update on public.characters
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- character_stats :: atributos dinamicos por sistema (JSONB)
-- ---------------------------------------------------------------------
create table if not exists public.character_stats (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null unique references public.characters (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  attributes   jsonb not null default '{}'::jsonb, -- { "for": 16, "des": 14, ... }
  vitals       jsonb not null default '{}'::jsonb, -- { "hp": { "current": 12, "max": 22 } }
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists character_stats_user_id_idx on public.character_stats (user_id);

drop trigger if exists character_stats_set_owner on public.character_stats;
create trigger character_stats_set_owner
  before insert on public.character_stats
  for each row execute function public.set_owner_from_character();

drop trigger if exists character_stats_set_updated_at on public.character_stats;
create trigger character_stats_set_updated_at
  before update on public.character_stats
  for each row execute function public.set_updated_at();

-- Toda ficha nasce com uma linha de stats.
create or replace function public.handle_new_character()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.character_stats (character_id, user_id)
  values (new.id, new.user_id)
  on conflict (character_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_character_created on public.characters;
create trigger on_character_created
  after insert on public.characters
  for each row execute function public.handle_new_character();

-- ---------------------------------------------------------------------
-- magic_items
-- ---------------------------------------------------------------------
create table if not exists public.magic_items (
  id               uuid primary key default gen_random_uuid(),
  character_id     uuid not null references public.characters (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  name             text not null check (char_length(trim(name)) between 1 and 160),
  type             text check (char_length(type) <= 60),
  rarity           text check (char_length(rarity) <= 40),
  description_html text, -- rich text vindo do editor
  description_text text, -- versao limpa, usada em busca
  image_path       text,
  quantity         integer not null default 1 check (quantity >= 0),
  attuned          boolean not null default false,
  equipped         boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists magic_items_character_idx on public.magic_items (character_id, sort_order, created_at);
create index if not exists magic_items_user_id_idx on public.magic_items (user_id);

drop trigger if exists magic_items_set_owner on public.magic_items;
create trigger magic_items_set_owner
  before insert on public.magic_items
  for each row execute function public.set_owner_from_character();

drop trigger if exists magic_items_set_updated_at on public.magic_items;
create trigger magic_items_set_updated_at
  before update on public.magic_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- assets :: imagens, tokens e arquivos ligados ao personagem
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'asset_kind') then
    create type public.asset_kind as enum ('token', 'portrait', 'full_body', 'map', 'handout', 'other');
  end if;
end
$$;

create table if not exists public.assets (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  file_path    text not null unique, -- <user_id>/<character_id>/<kind>/<uuid>.<ext>
  file_type    public.asset_kind not null default 'other',
  mime_type    text,
  size_bytes   bigint check (size_bytes >= 0),
  title        text check (char_length(title) <= 160),
  created_at   timestamptz not null default now()
);

create index if not exists assets_character_idx on public.assets (character_id, created_at desc);
create index if not exists assets_user_id_idx on public.assets (user_id);
create index if not exists assets_type_idx on public.assets (character_id, file_type);

drop trigger if exists assets_set_owner on public.assets;
create trigger assets_set_owner
  before insert on public.assets
  for each row execute function public.set_owner_from_character();

-- =====================================================================
-- ROW LEVEL SECURITY
-- auth.uid() vem dentro de (select ...) para o planner avaliar uma vez
-- por query, e nao uma vez por linha.
-- =====================================================================

alter table public.profiles        enable row level security;
alter table public.characters      enable row level security;
alter table public.character_stats enable row level security;
alter table public.magic_items     enable row level security;
alter table public.assets          enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- characters
drop policy if exists characters_select_own on public.characters;
create policy characters_select_own on public.characters
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists characters_insert_own on public.characters;
create policy characters_insert_own on public.characters
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists characters_update_own on public.characters;
create policy characters_update_own on public.characters
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists characters_delete_own on public.characters;
create policy characters_delete_own on public.characters
  for delete to authenticated using ((select auth.uid()) = user_id);

-- character_stats
drop policy if exists character_stats_select_own on public.character_stats;
create policy character_stats_select_own on public.character_stats
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists character_stats_insert_own on public.character_stats;
create policy character_stats_insert_own on public.character_stats
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists character_stats_update_own on public.character_stats;
create policy character_stats_update_own on public.character_stats
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists character_stats_delete_own on public.character_stats;
create policy character_stats_delete_own on public.character_stats
  for delete to authenticated using ((select auth.uid()) = user_id);

-- magic_items
drop policy if exists magic_items_select_own on public.magic_items;
create policy magic_items_select_own on public.magic_items
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists magic_items_insert_own on public.magic_items;
create policy magic_items_insert_own on public.magic_items
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists magic_items_update_own on public.magic_items;
create policy magic_items_update_own on public.magic_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists magic_items_delete_own on public.magic_items;
create policy magic_items_delete_own on public.magic_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- assets
drop policy if exists assets_select_own on public.assets;
create policy assets_select_own on public.assets
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists assets_insert_own on public.assets;
create policy assets_insert_own on public.assets
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists assets_update_own on public.assets;
create policy assets_update_own on public.assets
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists assets_delete_own on public.assets;
create policy assets_delete_own on public.assets
  for delete to authenticated using ((select auth.uid()) = user_id);

-- =====================================================================
-- GRANTS explicitos, para nao depender do default privileges do projeto
-- =====================================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete
  on public.characters, public.character_stats, public.magic_items, public.assets
  to authenticated;
grant select, update on public.profiles to authenticated;


-- =====================================================================
-- Funcoes de trigger nao podem virar RPC publica em /rest/v1/rpc.
-- O trigger continua disparando: o Postgres confere EXECUTE na criacao do
-- trigger, e nao a cada linha processada.
-- =====================================================================
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.set_owner_from_character() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_character() from public, anon, authenticated;

-- =====================================================================
-- STORAGE :: bucket privado unico
-- Convencao de caminho: <user_id>/<character_id>/<pasta>/<arquivo>
-- A primeira pasta e o id do dono, e a policy usa isso como chave.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vault',
  'vault',
  false,
  26214400, -- 25 MB
  array[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'image/avif', 'image/svg+xml', 'application/pdf'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists vault_select_own on storage.objects;
create policy vault_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists vault_insert_own on storage.objects;
create policy vault_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists vault_update_own on storage.objects;
create policy vault_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists vault_delete_own on storage.objects;
create policy vault_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);
