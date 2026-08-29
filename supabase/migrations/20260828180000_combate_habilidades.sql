-- =====================================================================
-- RPG VAULT :: combate, cargas e habilidades
--
-- Modelo: tudo que soma no personagem (acerto, CD, CA, parcelas de dano)
-- vira uma linha em `abilities` ou o campo passive_effects do item.
-- O dano final e montado somando o que estiver valendo naquele momento.
-- =====================================================================

-- ---------------------------------------------------------------------
-- magic_items :: cargas e efeitos passivos do item em si
-- `equipped` passa a ser o interruptor do item (ativado/desativado):
-- com ele desligado, nada do item entra na conta.
-- ---------------------------------------------------------------------
alter table public.magic_items
  add column if not exists charges_current integer check (charges_current >= 0),
  add column if not exists charges_max     integer check (charges_max >= 0),
  add column if not exists passive_effects jsonb not null default '{}'::jsonb;

comment on column public.magic_items.equipped is
  'Interruptor do item. Desligado, nem os efeitos passivos nem as habilidades entram na conta.';
comment on column public.magic_items.passive_effects is
  'Efeitos do proprio item, valendo enquanto ele estiver ativado. Formato em src/lib/effects.ts';

-- ---------------------------------------------------------------------
-- abilities :: habilidades de item, de fluxo e de talento
--
-- Uma tabela so, porque as tres se comportam igual na hora de somar:
-- passiva vale sempre que a fonte estiver valendo, ativa precisa ser ligada.
--   source = 'item'    -> item_id preenchido, depende do item estar ativado
--   source = 'fluxo'   -> habilidade que o personagem tem de nascenca
--   source = 'talento' -> talento adquirido
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'ability_source') then
    create type public.ability_source as enum ('item', 'fluxo', 'talento');
  end if;
  if not exists (select 1 from pg_type where typname = 'ability_kind') then
    create type public.ability_kind as enum ('active', 'passive');
  end if;
end
$$;

create table if not exists public.abilities (
  id               uuid primary key default gen_random_uuid(),
  character_id     uuid not null references public.characters (id) on delete cascade,
  item_id          uuid references public.magic_items (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  source           public.ability_source not null default 'fluxo',
  kind             public.ability_kind not null default 'passive',
  name             text not null check (char_length(trim(name)) between 1 and 160),
  charge_cost      integer not null default 0 check (charge_cost >= 0),
  is_active        boolean not null default false,
  effects          jsonb not null default '{}'::jsonb,
  description_html text,
  description_text text,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- item_id existe se, e somente se, a fonte for item
  constraint abilities_item_coerente
    check ((source = 'item') = (item_id is not null)),

  -- so habilidade ativa fica ligada, e so ela pode custar carga
  constraint abilities_passiva_nao_liga
    check (kind = 'active' or (is_active = false and charge_cost = 0))
);

create index if not exists abilities_character_idx
  on public.abilities (character_id, source, sort_order, created_at);
create index if not exists abilities_item_idx on public.abilities (item_id);
create index if not exists abilities_user_id_idx on public.abilities (user_id);

-- ---------------------------------------------------------------------
-- Dono e coerencia do item, na mesma passada
-- ---------------------------------------------------------------------
create or replace function public.set_ability_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id  uuid;
  item_char uuid;
begin
  select c.user_id into owner_id
    from public.characters c
   where c.id = new.character_id;

  if owner_id is null then
    raise exception 'Personagem % nao encontrado', new.character_id using errcode = '23503';
  end if;

  -- Habilidade de item precisa apontar para item do mesmo personagem.
  if new.item_id is not null then
    select m.character_id into item_char
      from public.magic_items m
     where m.id = new.item_id;

    if item_char is distinct from new.character_id then
      raise exception 'O item % nao pertence ao personagem %', new.item_id, new.character_id
        using errcode = '23514';
    end if;
  end if;

  new.user_id = owner_id;
  return new;
end;
$$;

drop trigger if exists abilities_set_owner on public.abilities;
create trigger abilities_set_owner
  before insert or update of character_id, item_id on public.abilities
  for each row execute function public.set_ability_owner();

drop trigger if exists abilities_set_updated_at on public.abilities;
create trigger abilities_set_updated_at
  before update on public.abilities
  for each row execute function public.set_updated_at();

-- Desligar o item desliga as habilidades ativas dele, senao o dano
-- continuaria contando uma fonte que o usuario acabou de guardar.
create or replace function public.desliga_habilidades_do_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.equipped and not new.equipped then
    update public.abilities
       set is_active = false
     where item_id = new.id
       and is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists magic_items_desliga_habilidades on public.magic_items;
create trigger magic_items_desliga_habilidades
  after update of equipped on public.magic_items
  for each row execute function public.desliga_habilidades_do_item();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.abilities enable row level security;

drop policy if exists abilities_select_own on public.abilities;
create policy abilities_select_own on public.abilities
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists abilities_insert_own on public.abilities;
create policy abilities_insert_own on public.abilities
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists abilities_update_own on public.abilities;
create policy abilities_update_own on public.abilities
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists abilities_delete_own on public.abilities;
create policy abilities_delete_own on public.abilities
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.abilities to authenticated;

-- Funcoes de trigger nao viram RPC publica.
revoke execute on function public.set_ability_owner() from public, anon, authenticated;
revoke execute on function public.desliga_habilidades_do_item() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- character_stats.combat :: acerto, CD, CA, atributo de ataque e armas
-- JSONB porque a lista de armas varia e o formato ainda vai mudar.
-- Formato em src/lib/effects.ts (tipo CombatBlock).
-- ---------------------------------------------------------------------
alter table public.character_stats
  add column if not exists combat jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------
-- Ajustes vindos de um item real (Felix, o Martelo que Tudo Resolve):
--   - habilidade tem tipo de acao (Acao, Acao Bonus, Reacao)
--   - existe habilidade limitada por uso, e nao por carga (1/semana)
--   - o item costuma dizer como recupera as cargas ("ao amanhecer")
-- ---------------------------------------------------------------------
alter table public.abilities
  add column if not exists action_type  text check (char_length(action_type) <= 40),
  add column if not exists uses_current integer check (uses_current >= 0),
  add column if not exists uses_max     integer check (uses_max >= 0);

alter table public.magic_items
  add column if not exists charges_note text check (char_length(charges_note) <= 200);

-- ---------------------------------------------------------------------
-- Desconto de cargas em uma unica instrucao.
-- Ler, subtrair e gravar em passos separados abre corrida quando o jogador
-- liga duas habilidades seguidas: as duas leem o mesmo saldo.
-- SECURITY INVOKER (padrao): a RLS de magic_items continua valendo.
-- ---------------------------------------------------------------------
create or replace function public.consome_cargas(p_item uuid, p_custo integer)
returns integer
language sql
set search_path = ''
as $$
  update public.magic_items
     set charges_current = charges_current - p_custo
   where id = p_item
     and charges_current is not null
     and charges_current >= p_custo
  returning charges_current;
$$;

grant execute on function public.consome_cargas(uuid, integer) to authenticated;
