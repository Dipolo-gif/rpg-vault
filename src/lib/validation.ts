import { z } from "zod";

const trimmed = (max: number) => z.string().trim().min(1).max(max);

/**
 * Limpeza basica do HTML vindo do editor.
 *
 * O conteudo e sempre do proprio dono da ficha e o Tiptap ja normaliza a saida
 * para o schema dele, entao aqui a intencao e so nao guardar script, iframe ou
 * handler inline caso alguem poste direto na API.
 */
function scrubHtml(html: string): string {
  return html
    .replace(
      /<\s*(script|iframe|object|embed|link|style)\b[\s\S]*?<\s*\/\s*\1\s*>/gi,
      "",
    )
    .replace(/<\s*(script|iframe|object|embed|link|style)\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, "");
}

const richText = z
  .string()
  .max(50000)
  .transform(scrubHtml)
  .nullable()
  .optional();

export const createCharacterSchema = z.object({
  name: trimmed(120),
  system: z.string().trim().min(1).max(60),
  level: z.string().trim().max(80).optional().nullable(),
});

export const updateCharacterSchema = z
  .object({
    name: trimmed(120).optional(),
    system: z.string().trim().min(1).max(60).optional(),
    level: z.string().trim().max(80).nullable().optional(),
    background_story: z.string().max(20000).nullable().optional(),
    is_favorite: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nada para atualizar",
  });

/* ------------------------------------------------------------------ */
/* Efeitos e combate                                                    */
/* ------------------------------------------------------------------ */

const damagePartSchema = z.object({
  dados: z.string().trim().max(40),
  tipo: z.string().trim().max(40).optional(),
});

export const effectsSchema = z.object({
  acerto: z.number().int().min(-99).max(99).optional(),
  cd: z.number().int().min(-99).max(99).optional(),
  ca: z.number().int().min(-99).max(99).optional(),
  dano: z.array(damagePartSchema).max(20).optional(),
  bonus: z.number().int().min(-99).max(99).optional(),
  tipo_dano: z.string().trim().max(40).optional(),
  /** Concede proficiencia ou proficiencia dobrada em pericias. */
  pericias: z
    .record(
      z.string().max(60),
      z.enum(["proficiente", "especialista", "dobra_se_ja_tiver"]),
    )
    .optional(),
  /** Proficiencia em teste de resistencia, como faz a classe. */
  saves: z
    .record(
      z.string().max(40),
      z.enum(["proficiente", "especialista", "dobra_se_ja_tiver"]),
    )
    .optional(),
  /** Aumento de atributo, como fazem os talentos. */
  atributos: z
    .record(z.string().max(40), z.number().int().min(-10).max(10))
    .optional(),
  /** Presente quando o item e a propria arma. */
  arma: z
    .object({
      dados: z.string().trim().max(40),
      tipo: z.string().trim().max(40).optional(),
      atributo: z.string().trim().max(40).optional(),
    })
    .optional(),
  extra: z.string().trim().max(2000).optional(),
});

const looseWeaponSchema = z.object({
  id: z.string().min(1).max(60),
  nome: z.string().trim().max(120),
  dados: z.string().trim().max(40),
  tipo: z.string().trim().max(40),
  descricao: z.string().max(2000).optional(),
});

export const combatSchema = z.object({
  acerto_base: z.number().int().min(-99).max(999),
  cd_base: z.number().int().min(-99).max(999),
  ca_base: z.number().int().min(-99).max(999),
  iniciativa_base: z.number().int().min(-99).max(999),
  deslocamento: z.string().trim().max(40),
  atributo_ataque: z.string().trim().max(40),
  armas: z.array(looseWeaponSchema).max(30),
  arma_ativa: z.string().max(90).nullable(),
});

export const skillsSchema = z.object({
  prof_bonus: z.number().int().min(-20).max(20),
  estados: z.record(
    z.string().max(60),
    z.enum(["none", "proficiente", "especialista"]),
  ),
  extras: z.record(z.string().max(60), z.number().int().min(-99).max(99)),
  saves: z.record(
    z.string().max(40),
    z.enum(["none", "proficiente", "especialista"]),
  ),
});



export const customFieldsSchema = z.object({
  attributes: z
    .array(
      z.object({
        key: z.string().min(1).max(40),
        label: z.string().trim().min(1).max(60),
        short: z.string().trim().min(1).max(6),
      }),
    )
    .max(20),
  skills: z
    .array(
      z.object({
        key: z.string().min(1).max(60),
        label: z.string().trim().min(1).max(80),
        attribute: z.string().min(1).max(40),
      }),
    )
    .max(60),
});

const espacoSchema = z.object({
  total: z.number().int().min(0).max(99),
  usados: z.number().int().min(0).max(99),
});

export const spellsBlockSchema = z.object({
  atributo: z.string().trim().max(40),
  /** A chave é o número do círculo, de 1 a 9. */
  espacos: z.record(z.string().max(2), espacoSchema),
  pontos: espacoSchema,
  pontos_label: z.string().trim().max(60),
});

const vitalSchema = z.object({
  current: z.number().int().min(-999).max(9999),
  max: z.number().int().min(0).max(9999).nullable(),
});

export const updateStatsSchema = z
  .object({
    attributes: z
      .record(
        z.string().max(40),
        z.union([z.number(), z.string().max(60), z.null()]),
      )
      .optional(),
    vitals: z.record(z.string().max(40), vitalSchema).optional(),
    combat: combatSchema.optional(),
    skills: skillsSchema.optional(),
    custom: customFieldsSchema.optional(),
    magias: spellsBlockSchema.optional(),
    notes: z.string().max(20000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nada para atualizar",
  });

export const abilitySourceSchema = z.enum([
  "item",
  "fluxo",
  "talento",
  "classe",
]);
export const abilityKindSchema = z.enum(["active", "passive"]);

export const createAbilitySchema = z
  .object({
    source: abilitySourceSchema,
    item_id: z.string().uuid().nullable().optional(),
    kind: abilityKindSchema,
    name: trimmed(160),
    charge_cost: z.number().int().min(0).max(999).optional(),
    action_type: z.string().trim().max(40).nullable().optional(),
    uses_current: z.number().int().min(0).max(999).nullable().optional(),
    uses_max: z.number().int().min(0).max(999).nullable().optional(),
    uses_note: z.string().trim().max(200).nullable().optional(),
    effects: effectsSchema.optional(),
    description_html: richText,
    description_text: z.string().max(50000).nullable().optional(),
  })
  .refine((value) => (value.source === "item") === Boolean(value.item_id), {
    message: "Habilidade de item precisa apontar para um item, e só ela",
  });

export const updateAbilitySchema = z
  .object({
    name: trimmed(160).optional(),
    kind: abilityKindSchema.optional(),
    charge_cost: z.number().int().min(0).max(999).optional(),
    is_active: z.boolean().optional(),
    action_type: z.string().trim().max(40).nullable().optional(),
    uses_current: z.number().int().min(0).max(999).nullable().optional(),
    uses_max: z.number().int().min(0).max(999).nullable().optional(),
    uses_note: z.string().trim().max(200).nullable().optional(),
    effects: effectsSchema.optional(),
    description_html: richText,
    description_text: z.string().max(50000).nullable().optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nada para atualizar",
  });

export const createItemSchema = z.object({
  name: trimmed(160),
  type: z.string().trim().max(60).nullable().optional(),
  rarity: z.string().trim().max(40).nullable().optional(),
  description_html: richText,
  description_text: z.string().max(50000).nullable().optional(),
  quantity: z.number().int().min(0).max(9999).optional(),
  attuned: z.boolean().optional(),
  /** Interruptor do item: desligado, os efeitos dele saem da conta. */
  equipped: z.boolean().optional(),
  charges_current: z.number().int().min(0).max(999).nullable().optional(),
  charges_max: z.number().int().min(0).max(999).nullable().optional(),
  charges_note: z.string().trim().max(200).nullable().optional(),
  passive_effects: effectsSchema.optional(),
});

export const updateItemSchema = createItemSchema
  .partial()
  .extend({ sort_order: z.number().int().min(0).max(9999).optional() })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nada para atualizar",
  });

export const assetKindSchema = z.enum([
  "token",
  "portrait",
  "full_body",
  "map",
  "handout",
  "other",
]);

export const updateAssetSchema = z
  .object({
    title: z.string().trim().max(160).nullable().optional(),
    file_type: assetKindSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nada para atualizar",
  });

/* ------------------------------------------------------------------ */
/* Magias                                                               */
/* ------------------------------------------------------------------ */

const spellTexto = (max: number) =>
  z.string().trim().max(max).nullable().optional();

export const createSpellSchema = z.object({
  /** Quando vem do guia, o servidor completa o resto a partir do catálogo. */
  catalog_slug: z.string().trim().max(120).optional(),
  name: trimmed(160).optional(),
  level: z.number().int().min(0).max(9).optional(),
  school: spellTexto(40),
  casting_time: spellTexto(80),
  range: spellTexto(80),
  components: spellTexto(120),
  duration: spellTexto(80),
  concentration: z.boolean().optional(),
  ritual: z.boolean().optional(),
  prepared: z.boolean().optional(),
  always_prepared: z.boolean().optional(),
  reference_url: z.string().trim().url().max(300).nullable().optional(),
  description_html: richText,
  description_text: z.string().max(50000).nullable().optional(),
});

export const updateSpellSchema = z
  .object({
    name: trimmed(160).optional(),
    level: z.number().int().min(0).max(9).optional(),
    school: spellTexto(40),
    casting_time: spellTexto(80),
    range: spellTexto(80),
    components: spellTexto(120),
    duration: spellTexto(80),
    concentration: z.boolean().optional(),
    ritual: z.boolean().optional(),
    prepared: z.boolean().optional(),
    always_prepared: z.boolean().optional(),
    reference_url: z.string().trim().url().max(300).nullable().optional(),
    description_html: richText,
    description_text: z.string().max(50000).nullable().optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nada para atualizar",
  });

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;
export type UpdateStatsInput = z.infer<typeof updateStatsSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
