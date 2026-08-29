/**
 * Presets por sistema de RPG.
 *
 * Os valores em si vivem em JSONB (character_stats.attributes / vitals), entao
 * este arquivo so descreve quais campos a UI oferece por padrao. Adicionar um
 * sistema novo aqui nao exige migration, e o usuario ainda pode criar campos
 * proprios em qualquer ficha.
 */

export type AttributeDef = {
  key: string;
  label: string;
  short: string;
};

export type VitalDef = {
  key: string;
  label: string;
  /** Barras com max viram medidor. Sem max, viram contador simples. */
  hasMax: boolean;
  /** Classe utilitaria do Tailwind usada na barra. */
  bar: string;
  defaultMax?: number;
};

export type SkillDef = {
  key: string;
  label: string;
  /** Chave do atributo que rege a pericia. */
  attribute: string;
};

export type SystemDef = {
  id: string;
  label: string;
  /** "Nivel" em D&D, "Ocupação" em Call of Cthulhu, etc. */
  levelLabel: string;
  levelPlaceholder: string;
  attributes: AttributeDef[];
  vitals: VitalDef[];
  itemTypes: string[];
  rarities: string[];
};

const DND_RARITIES = [
  "Comum",
  "Incomum",
  "Raro",
  "Muito raro",
  "Lendário",
  "Artefato",
];

export const SYSTEMS: SystemDef[] = [
  {
    id: "dnd5e",
    label: "D&D 5e",
    levelLabel: "Nível e classe",
    levelPlaceholder: "Ex: Bardo 7",
    attributes: [
      { key: "for", label: "Força", short: "FOR" },
      { key: "des", label: "Destreza", short: "DES" },
      { key: "con", label: "Constituição", short: "CON" },
      { key: "int", label: "Inteligência", short: "INT" },
      { key: "sab", label: "Sabedoria", short: "SAB" },
      { key: "car", label: "Carisma", short: "CAR" },
    ],
    vitals: [
      { key: "hp", label: "Pontos de vida", hasMax: true, bar: "bg-rose-500", defaultMax: 20 },
      { key: "slots", label: "Espaços de magia", hasMax: true, bar: "bg-violet-500", defaultMax: 4 },
      { key: "insp", label: "Inspiração", hasMax: false, bar: "bg-amber-500" },
    ],
    itemTypes: [
      "Arma",
      "Armadura",
      "Escudo",
      "Anel",
      "Varinha",
      "Cajado",
      "Poção",
      "Pergaminho",
      "Item maravilhoso",
    ],
    rarities: DND_RARITIES,
  },
  {
    id: "coc7e",
    label: "Call of Cthulhu 7e",
    levelLabel: "Ocupação",
    levelPlaceholder: "Ex: Jornalista",
    attributes: [
      { key: "str", label: "Força", short: "STR" },
      { key: "con", label: "Constituição", short: "CON" },
      { key: "siz", label: "Tamanho", short: "SIZ" },
      { key: "dex", label: "Destreza", short: "DEX" },
      { key: "app", label: "Aparência", short: "APP" },
      { key: "int", label: "Inteligência", short: "INT" },
      { key: "pow", label: "Poder", short: "POW" },
      { key: "edu", label: "Educação", short: "EDU" },
    ],
    vitals: [
      { key: "hp", label: "Pontos de vida", hasMax: true, bar: "bg-rose-500", defaultMax: 12 },
      { key: "sanity", label: "Sanidade", hasMax: true, bar: "bg-violet-500", defaultMax: 60 },
      { key: "mp", label: "Pontos de magia", hasMax: true, bar: "bg-sky-500", defaultMax: 12 },
      { key: "luck", label: "Sorte", hasMax: true, bar: "bg-amber-500", defaultMax: 60 },
    ],
    itemTypes: ["Arma", "Ferramenta", "Tomo", "Artefato", "Pista", "Posse"],
    rarities: ["Mundano", "Estranho", "Ocultista", "Mítico"],
  },
  {
    id: "tormenta20",
    label: "Tormenta 20",
    levelLabel: "Nível e classe",
    levelPlaceholder: "Ex: Cavaleiro 5",
    attributes: [
      { key: "for", label: "Força", short: "FOR" },
      { key: "des", label: "Destreza", short: "DES" },
      { key: "con", label: "Constituição", short: "CON" },
      { key: "int", label: "Inteligência", short: "INT" },
      { key: "sab", label: "Sabedoria", short: "SAB" },
      { key: "car", label: "Carisma", short: "CAR" },
    ],
    vitals: [
      { key: "pv", label: "Pontos de vida", hasMax: true, bar: "bg-rose-500", defaultMax: 20 },
      { key: "pm", label: "Pontos de mana", hasMax: true, bar: "bg-sky-500", defaultMax: 10 },
      { key: "defesa", label: "Defesa", hasMax: false, bar: "bg-emerald-500" },
    ],
    itemTypes: ["Arma", "Armadura", "Escudo", "Item mágico", "Consumível", "Geral"],
    rarities: DND_RARITIES,
  },
  {
    id: "vampiro5e",
    label: "Vampiro: A Máscara 5e",
    levelLabel: "Clã e geração",
    levelPlaceholder: "Ex: Toreador, 11ª geração",
    attributes: [
      { key: "forca", label: "Força", short: "FOR" },
      { key: "destreza", label: "Destreza", short: "DES" },
      { key: "vigor", label: "Vigor", short: "VIG" },
      { key: "carisma", label: "Carisma", short: "CAR" },
      { key: "manipulacao", label: "Manipulação", short: "MAN" },
      { key: "autocontrole", label: "Autocontrole", short: "AUT" },
      { key: "inteligencia", label: "Inteligência", short: "INT" },
      { key: "raciocinio", label: "Raciocínio", short: "RAC" },
      { key: "determinacao", label: "Determinação", short: "DET" },
    ],
    vitals: [
      { key: "vitalidade", label: "Vitalidade", hasMax: true, bar: "bg-rose-500", defaultMax: 7 },
      { key: "vontade", label: "Força de vontade", hasMax: true, bar: "bg-sky-500", defaultMax: 6 },
      { key: "fome", label: "Fome", hasMax: true, bar: "bg-red-700", defaultMax: 5 },
      { key: "humanidade", label: "Humanidade", hasMax: true, bar: "bg-amber-500", defaultMax: 10 },
    ],
    itemTypes: ["Arma", "Recurso", "Contato", "Relíquia", "Documento"],
    rarities: ["Trivial", "Incomum", "Raro", "Único"],
  },
  {
    id: "generico",
    label: "Genérico / outro sistema",
    levelLabel: "Nível ou ocupação",
    levelPlaceholder: "Ex: Veterano",
    attributes: [
      { key: "corpo", label: "Corpo", short: "COR" },
      { key: "mente", label: "Mente", short: "MEN" },
      { key: "espirito", label: "Espírito", short: "ESP" },
    ],
    vitals: [
      { key: "hp", label: "Vida", hasMax: true, bar: "bg-rose-500", defaultMax: 10 },
      { key: "recurso", label: "Recurso", hasMax: true, bar: "bg-sky-500", defaultMax: 10 },
    ],
    itemTypes: ["Arma", "Equipamento", "Consumível", "Tesouro"],
    rarities: ["Comum", "Incomum", "Raro", "Lendário"],
  },
  {
    id: "chamas",
    label: "Chamas da Guerra (D&D 5e)",
    levelLabel: "Nível e classe",
    levelPlaceholder: "Ex: Artífice 7",
    attributes: [
      { key: "for", label: "Força", short: "FOR" },
      { key: "des", label: "Destreza", short: "DES" },
      { key: "con", label: "Constituição", short: "CON" },
      { key: "int", label: "Inteligência", short: "INT" },
      { key: "sab", label: "Sabedoria", short: "SAB" },
      { key: "car", label: "Carisma", short: "CAR" },
      { key: "san", label: "Sanidade", short: "SAN" },
    ],
    vitals: [
      { key: "pv", label: "Pontos de vida", hasMax: true, bar: "bg-rose-500", defaultMax: 20 },
      { key: "pv_temp", label: "PV temporários", hasMax: false, bar: "bg-emerald-500" },
      { key: "insp", label: "Inspiração", hasMax: false, bar: "bg-amber-500" },
    ],
    itemTypes: [
      "Arma",
      "Armadura",
      "Escudo",
      "Ferramenta",
      "Implante",
      "Poção",
      "Pergaminho",
      "Item maravilhoso",
    ],
    rarities: DND_RARITIES,
  },
];

export const DEFAULT_SYSTEM_ID = "dnd5e";

export function getSystem(id: string | null | undefined): SystemDef {
  return SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[SYSTEMS.length - 1];
}

export function systemLabel(id: string | null | undefined): string {
  return SYSTEMS.find((s) => s.id === id)?.label ?? "Sistema próprio";
}

/** Record<value, label> no formato que o Select do Base UI espera. */
export const SYSTEM_ITEMS: Record<string, string> = Object.fromEntries(
  SYSTEMS.map((s) => [s.id, s.label]),
);

export const ASSET_KIND_ITEMS: Record<string, string> = {
  token: "Token",
  portrait: "Retrato",
  full_body: "Corpo inteiro",
  map: "Mapa",
  handout: "Handout",
  other: "Outro",
};

export const RARITY_STYLES: Record<string, string> = {
  comum: "border-zinc-600/60 text-zinc-300",
  incomum: "border-emerald-500/50 text-emerald-300",
  raro: "border-sky-500/50 text-sky-300",
  "muito raro": "border-violet-500/50 text-violet-300",
  lendario: "border-amber-500/50 text-amber-300",
  artefato: "border-rose-500/50 text-rose-300",
  unico: "border-fuchsia-500/50 text-fuchsia-300",
  mitico: "border-fuchsia-500/50 text-fuchsia-300",
};

export function rarityStyle(rarity: string | null | undefined) {
  if (!rarity) return "border-zinc-700 text-zinc-400";
  // Faixa dos acentos combinantes, montada por codigo para o arquivo ficar ASCII.
  const combining = `[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`;
  const stripAccents = new RegExp(combining, "g");
  const key = rarity.toLowerCase().normalize("NFD").replace(stripAccents, "");
  return RARITY_STYLES[key] ?? "border-zinc-700 text-zinc-400";
}

/* ------------------------------------------------------------------ */
/* Perícias por sistema                                                 */
/* ------------------------------------------------------------------ */

/**
 * As chaves batem com os campos do PDF da ficha (SK_ACROBACIA vira
 * "acrobacia"), para um dia dar para preencher o PDF a partir daqui.
 */
const PERICIAS_DND: SkillDef[] = [
  { key: "acrobacia", label: "Acrobacia", attribute: "des" },
  { key: "arcanismo", label: "Arcanismo", attribute: "int" },
  { key: "atletismo", label: "Atletismo", attribute: "for" },
  { key: "atuacao", label: "Atuação", attribute: "car" },
  { key: "blefar", label: "Blefar", attribute: "car" },
  { key: "furtividade", label: "Furtividade", attribute: "des" },
  { key: "historia", label: "História", attribute: "int" },
  { key: "intimidacao", label: "Intimidação", attribute: "car" },
  { key: "intuicao", label: "Intuição", attribute: "sab" },
  { key: "investigacao", label: "Investigação", attribute: "int" },
  { key: "lidar_animais", label: "Lidar com Animais", attribute: "sab" },
  { key: "medicina", label: "Medicina", attribute: "sab" },
  { key: "natureza", label: "Natureza", attribute: "int" },
  { key: "percepcao", label: "Percepção", attribute: "sab" },
  { key: "persuasao", label: "Persuasão", attribute: "car" },
  { key: "prestidigitacao", label: "Prestidigitação", attribute: "des" },
  { key: "religiao", label: "Religião", attribute: "int" },
  { key: "sobrevivencia", label: "Sobrevivência", attribute: "sab" },
];

/** Lista da ficha "Chamas da Guerra", extraída dos campos do PDF. */
const PERICIAS_CHAMAS: SkillDef[] = [
  { key: "acrobacia", label: "Acrobacia", attribute: "des" },
  { key: "arcanismo", label: "Arcanismo", attribute: "int" },
  { key: "atletismo", label: "Atletismo", attribute: "for" },
  { key: "atuacao", label: "Atuação", attribute: "car" },
  { key: "autocontrole", label: "Autocontrole", attribute: "san" },
  { key: "blefar", label: "Blefar", attribute: "car" },
  { key: "ciencias", label: "Ciências", attribute: "int" },
  { key: "cyberarcanismo", label: "Cyberarcanismo", attribute: "int" },
  { key: "engenharia", label: "Engenharia", attribute: "int" },
  { key: "esquiva", label: "Esquiva", attribute: "des" },
  { key: "furtividade", label: "Furtividade", attribute: "des" },
  { key: "hacking", label: "Hacking", attribute: "int" },
  { key: "historia", label: "História", attribute: "int" },
  { key: "intimidacao", label: "Intimidação", attribute: "car" },
  { key: "intuicao", label: "Intuição", attribute: "sab" },
  { key: "investigacao", label: "Investigação", attribute: "int" },
  { key: "lidar_animais", label: "Lidar com Animais", attribute: "sab" },
  { key: "malandragem", label: "Malandragem", attribute: "sab" },
  { key: "medicina", label: "Medicina", attribute: "sab" },
  { key: "metabolismo", label: "Metabolismo", attribute: "con" },
  { key: "natureza", label: "Natureza", attribute: "int" },
  { key: "percepcao", label: "Percepção", attribute: "sab" },
  { key: "persuasao", label: "Persuasão", attribute: "car" },
  { key: "pilotagem", label: "Pilotagem", attribute: "des" },
  { key: "prestidigitacao", label: "Prestidigitação", attribute: "des" },
  { key: "religiao", label: "Religião", attribute: "int" },
  { key: "sobrevivencia", label: "Sobrevivência", attribute: "sab" },
];

const SKILLS_BY_SYSTEM: Record<string, SkillDef[]> = {
  dnd5e: PERICIAS_DND,
  chamas: PERICIAS_CHAMAS,
  tormenta20: PERICIAS_DND,
};

/** Sistema sem lista devolve vazio, e a aba Perícias avisa. */
export function getSkills(systemId: string | null | undefined): SkillDef[] {
  return SKILLS_BY_SYSTEM[systemId ?? ""] ?? [];
}

/* ------------------------------------------------------------------ */
/* Campos próprios da mesa                                              */
/* ------------------------------------------------------------------ */

/**
 * O que a ficha de uma mesa acrescenta por cima do preset.
 *
 * Toda mesa mexe no sistema: cria uma perícia, inventa um atributo. Em vez de
 * pedir um preset novo a cada mudança, o personagem carrega os próprios campos
 * e o app junta os dois antes de calcular qualquer coisa.
 */
export type CustomFields = {
  attributes: AttributeDef[];
  skills: SkillDef[];
};

export const EMPTY_CUSTOM: CustomFields = { attributes: [], skills: [] };

export function readCustom(raw: unknown): CustomFields {
  const value = (raw ?? {}) as Partial<CustomFields>;
  return {
    attributes: Array.isArray(value.attributes)
      ? value.attributes.filter((a) => a?.key && a?.label)
      : [],
    skills: Array.isArray(value.skills)
      ? value.skills.filter((s) => s?.key && s?.label && s?.attribute)
      : [],
  };
}

/** Preset + o que a mesa acrescentou, sem repetir chave. */
export function mergeSystem(
  system: SystemDef,
  custom: CustomFields,
): SystemDef & { skills: SkillDef[] } {
  const chavesAtributo = new Set(system.attributes.map((a) => a.key));
  const base = getSkills(system.id);
  const chavesPericia = new Set(base.map((s) => s.key));

  return {
    ...system,
    attributes: [
      ...system.attributes,
      ...custom.attributes.filter((a) => !chavesAtributo.has(a.key)),
    ],
    skills: [
      ...base,
      ...custom.skills.filter((s) => !chavesPericia.has(s.key)),
    ].sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
  };
}

/** Vira uma chave estável a partir do que a pessoa digitou. */
export function slugify(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, "g"), "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
