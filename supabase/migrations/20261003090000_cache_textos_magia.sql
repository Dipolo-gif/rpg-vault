-- =====================================================================
-- RPG VAULT :: cache do texto das magias
--
-- O texto vem da página do guia e passa por tradução, que é lenta e tem
-- cota diária por IP no serviço gratuito. Guardar o resultado aqui faz
-- cada magia ser traduzida uma vez só, para sempre, e valer em qualquer
-- aparelho onde você abrir o cofre.
--
-- É regra pública de jogo, não dado de personagem, então a tabela fica
-- fora da RLS por usuário: qualquer conta logada lê e grava.
-- =====================================================================

create table if not exists public.spell_texts (
  slug       text primary key,
  /** Em português, já com o glossário de D&D aplicado. */
  texto      text not null,
  /** Como está na página, em inglês. */
  original   text not null,
  /** Falso quando o serviço de tradução não respondeu e sobrou o inglês. */
  traduzido  boolean not null default false,
  /** Dano, resistência, área e afins, calculados do texto em inglês. */
  destaques  jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists spell_texts_set_updated_at on public.spell_texts;
create trigger spell_texts_set_updated_at
  before update on public.spell_texts
  for each row execute function public.set_updated_at();

alter table public.spell_texts enable row level security;

drop policy if exists spell_texts_select on public.spell_texts;
create policy spell_texts_select on public.spell_texts
  for select to authenticated using (true);

drop policy if exists spell_texts_insert on public.spell_texts;
create policy spell_texts_insert on public.spell_texts
  for insert to authenticated with check (true);

drop policy if exists spell_texts_update on public.spell_texts;
create policy spell_texts_update on public.spell_texts
  for update to authenticated using (true) with check (true);

grant select, insert, update on public.spell_texts to authenticated;
