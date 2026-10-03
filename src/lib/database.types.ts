/**
 * Tipos do banco escritos a mao para casar com supabase/migrations/*.sql.
 *
 * Quando o projeto estiver linkado, da para regenerar com:
 *   npx supabase gen types typescript --project-id SEU_ID > src/lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AssetKind =
  | "token"
  | "portrait"
  | "full_body"
  | "map"
  | "handout"
  | "other";

export type CharacterRow = {
  id: string;
  user_id: string;
  name: string;
  system: string;
  level: string | null;
  background_story: string | null;
  avatar_path: string | null;
  pdf_path: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type CharacterStatsRow = {
  id: string;
  character_id: string;
  user_id: string;
  attributes: Record<string, number | string | null>;
  vitals: Record<string, { current: number; max: number | null }>;
  /** Acerto, CD, CA, atributo de ataque e armas. Formato em src/lib/effects.ts */
  combat: Json;
  /** Proficiencia e estado de cada pericia. Formato em src/lib/skills.ts */
  skills: Json;
  /** Atributos e pericias proprios da mesa. Formato em src/lib/systems.ts */
  custom: Json;
  /** Espacos por circulo e atributo de conjuracao. Formato em src/lib/spells.ts */
  magias: Json;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MagicItemRow = {
  id: string;
  character_id: string;
  user_id: string;
  name: string;
  type: string | null;
  rarity: string | null;
  description_html: string | null;
  description_text: string | null;
  image_path: string | null;
  quantity: number;
  attuned: boolean;
  /** Interruptor do item. Desligado, nada dele entra na conta de combate. */
  equipped: boolean;
  charges_current: number | null;
  charges_max: number | null;
  /** Como recupera, ex: "ao amanhecer". */
  charges_note: string | null;
  /** Efeitos do próprio item. Formato em src/lib/effects.ts */
  passive_effects: Json;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type AbilitySource = "item" | "fluxo" | "talento" | "classe";
export type AbilityKind = "active" | "passive";

export type AbilityRow = {
  id: string;
  character_id: string;
  /** Preenchido apenas quando source é "item". */
  item_id: string | null;
  user_id: string;
  source: AbilitySource;
  kind: AbilityKind;
  name: string;
  /** Cargas do item consumidas ao ligar. Só vale para habilidade ativa. */
  charge_cost: number;
  is_active: boolean;
  /** Acao, Acao Bonus, Reacao, Livre. So texto, para bater com o PDF do item. */
  action_type: string | null;
  /** Habilidade limitada por uso proprio, e nao por carga do item (1/semana). */
  uses_current: number | null;
  uses_max: number | null;
  /** Como recupera o uso, ex: "1 por dia". */
  uses_note: string | null;
  /** Formato em src/lib/effects.ts */
  effects: Json;
  description_html: string | null;
  description_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type SpellRow = {
  id: string;
  character_id: string;
  user_id: string;
  /** 0 é truque, que não gasta espaço. */
  level: number;
  name: string;
  school: string | null;
  casting_time: string | null;
  range: string | null;
  components: string | null;
  duration: string | null;
  concentration: boolean;
  ritual: boolean;
  /** O que está preparado hoje. */
  prepared: boolean;
  /** Magia de domínio, juramento ou item: não ocupa a lista do dia. */
  always_prepared: boolean;
  /** Chave no catálogo, quando veio de lá. */
  catalog_slug: string | null;
  reference_url: string | null;
  description_html: string | null;
  description_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type AssetRow = {
  id: string;
  character_id: string;
  user_id: string;
  file_path: string;
  file_type: AssetKind;
  mime_type: string | null;
  size_bytes: number | null;
  title: string | null;
  created_at: string;
}

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

type Insert<T, Optional extends keyof T> = Omit<T, Optional> &
  Partial<Pick<T, Optional>>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insert<ProfileRow, "created_at" | "updated_at">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      characters: {
        Row: CharacterRow;
        Insert: Insert<
          CharacterRow,
          | "id"
          | "user_id"
          | "level"
          | "background_story"
          | "avatar_path"
          | "pdf_path"
          | "is_favorite"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<CharacterRow>;
        Relationships: [];
      };
      abilities: {
        Row: AbilityRow;
        Insert: Insert<
          AbilityRow,
          | "id"
          | "user_id"
          | "item_id"
          | "source"
          | "kind"
          | "charge_cost"
          | "is_active"
          | "action_type"
          | "uses_current"
          | "uses_max"
          | "uses_note"
          | "effects"
          | "description_html"
          | "description_text"
          | "sort_order"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<AbilityRow>;
        Relationships: [];
      };
      character_stats: {
        Row: CharacterStatsRow;
        Insert: Insert<
          CharacterStatsRow,
          | "id"
          | "user_id"
          | "attributes"
          | "vitals"
          | "combat"
          | "skills"
          | "custom"
          | "magias"
          | "notes"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<CharacterStatsRow>;
        Relationships: [];
      };
      spells: {
        Row: SpellRow;
        Insert: Insert<
          SpellRow,
          | "id"
          | "user_id"
          | "level"
          | "school"
          | "casting_time"
          | "range"
          | "components"
          | "duration"
          | "concentration"
          | "ritual"
          | "prepared"
          | "always_prepared"
          | "catalog_slug"
          | "reference_url"
          | "description_html"
          | "description_text"
          | "sort_order"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<SpellRow>;
        Relationships: [];
      };
      magic_items: {
        Row: MagicItemRow;
        Insert: Insert<
          MagicItemRow,
          | "id"
          | "user_id"
          | "type"
          | "rarity"
          | "description_html"
          | "description_text"
          | "image_path"
          | "quantity"
          | "attuned"
          | "equipped"
          | "charges_current"
          | "charges_max"
          | "charges_note"
          | "passive_effects"
          | "sort_order"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<MagicItemRow>;
        Relationships: [];
      };
      assets: {
        Row: AssetRow;
        Insert: Insert<
          AssetRow,
          | "id"
          | "user_id"
          | "file_type"
          | "mime_type"
          | "size_bytes"
          | "title"
          | "created_at"
        >;
        Update: Partial<AssetRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      /** Desconta cargas do item em uma instrução só. null = saldo insuficiente. */
      consome_cargas: {
        Args: { p_item: string; p_custo: number };
        Returns: number | null;
      };
    };
    Enums: {
      asset_kind: AssetKind;
      ability_source: AbilitySource;
      ability_kind: AbilityKind;
    };
    CompositeTypes: Record<never, never>;
  };
}

/* ------------------------------------------------------------------ */
/* Tipos de dominio usados pela UI                                      */
/* ------------------------------------------------------------------ */

/** Personagem ja com as URLs assinadas resolvidas pelo servidor. */
export type CharacterWithSignedUrls = CharacterRow & {
  avatar_url: string | null;
};

export type AssetWithUrl = AssetRow & { url: string | null };

export type MagicItemWithUrl = MagicItemRow & { image_url: string | null };
