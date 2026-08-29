import { formatDice, mergeDice, parseDice, type DiceExpression } from "@/lib/dice";
import type { AbilityRow, MagicItemRow } from "@/lib/database.types";
import type { SystemDef } from "@/lib/systems";

/* ------------------------------------------------------------------ */
/* Formato dos efeitos                                                  */
/* ------------------------------------------------------------------ */

export type DamagePart = {
  /** Expressão de dado ou número puro: "2d6", "1d8+1", "3". */
  dados: string;
  /** Tipo do dano, ex: "fogo". Vazio herda o tipo da arma. */
  tipo?: string;
};

/** Declara que o item é uma arma, com o dano base dele. */
export type WeaponProfile = {
  dados: string;
  tipo?: string;
  /** Chave do atributo usado no ataque, quando o item troca. Ex: "int". */
  atributo?: string;
};

/**
 * Como uma fonte mexe numa pericia.
 *  - proficiente / especialista: crava o grau
 *  - dobra_se_ja_tiver: a regra classica dos talentos, "voce ganha proficiencia,
 *    e se ja tiver, o bonus e dobrado"
 */
export type SkillGrant = "proficiente" | "especialista" | "dobra_se_ja_tiver";

/**
 * O que uma fonte (item, habilidade, talento, classe) soma no personagem.
 * Guardado em JSONB, então todo campo é opcional.
 */
export type Effects = {
  /**
   * Bônus mágico do item: entra em acerto e em dano.
   * Entre itens ativados vale só o maior, não a soma.
   */
  bonus?: number;
  /** Estes somam normalmente, inclusive entre itens. */
  acerto?: number;
  cd?: number;
  ca?: number;
  dano?: DamagePart[];
  /** Converte o tipo do dano da arma. Ex: golpe cortante vira radiante. */
  tipo_dano?: string;
  /** Só no item: transforma ele em arma. */
  arma?: WeaponProfile;
  /** Concede proficiência ou especialização em perícias. */
  pericias?: Record<string, SkillGrant>;
  /** Concede proficiência em testes de resistência, como faz a classe. */
  saves?: Record<string, SkillGrant>;
  /** Aumenta o valor de um atributo, como fazem os talentos. */
  atributos?: Record<string, number>;
  /** Legado: hoje o texto solto vive na descrição. */
  extra?: string;
};

/** Arma que não é item do inventário, digitada direto no combate. */
export type LooseWeapon = {
  id: string;
  nome: string;
  dados: string;
  tipo: string;
};

export type CombatBlock = {
  acerto_base: number;
  cd_base: number;
  ca_base: number;
  iniciativa_base: number;
  deslocamento: string;
  /** Chave do atributo de ataque padrão. A arma pode trocar. */
  atributo_ataque: string;
  armas: LooseWeapon[];
  /** Arma em destaque: "item:<id>" ou "avulsa:<id>". */
  arma_ativa: string | null;
};

export const EMPTY_COMBAT: CombatBlock = {
  acerto_base: 0,
  cd_base: 0,
  ca_base: 0,
  iniciativa_base: 0,
  deslocamento: "",
  atributo_ataque: "",
  armas: [],
  arma_ativa: null,
};

/** Regra do D&D: o valor do atributo vira modificador. 20 vira +5. */
export function attributeMod(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.floor((parsed - 10) / 2);
}

export function formatMod(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function readCombat(raw: unknown): CombatBlock {
  const value = (raw ?? {}) as Partial<CombatBlock>;
  return {
    acerto_base: Number(value.acerto_base ?? 0),
    cd_base: Number(value.cd_base ?? 0),
    ca_base: Number(value.ca_base ?? 0),
    iniciativa_base: Number(value.iniciativa_base ?? 0),
    deslocamento:
      typeof value.deslocamento === "string" ? value.deslocamento : "",
    atributo_ataque:
      typeof value.atributo_ataque === "string" ? value.atributo_ataque : "",
    armas: Array.isArray(value.armas) ? value.armas : [],
    arma_ativa: value.arma_ativa ?? null,
  };
}

export function readEffects(raw: unknown): Effects {
  const value = (raw ?? {}) as Effects;
  return {
    bonus: numberOrUndefined(value.bonus),
    acerto: numberOrUndefined(value.acerto),
    cd: numberOrUndefined(value.cd),
    ca: numberOrUndefined(value.ca),
    dano: Array.isArray(value.dano)
      ? value.dano.filter((part) => part && typeof part.dados === "string")
      : undefined,
    tipo_dano: value.tipo_dano || undefined,
    arma: value.arma?.dados ? value.arma : undefined,
    pericias:
      value.pericias && Object.keys(value.pericias).length > 0
        ? value.pericias
        : undefined,
    saves:
      value.saves && Object.keys(value.saves).length > 0
        ? value.saves
        : undefined,
    atributos:
      value.atributos && Object.keys(value.atributos).length > 0
        ? value.atributos
        : undefined,
    extra: value.extra || undefined,
  };
}

function numberOrUndefined(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed !== 0 ? parsed : undefined;
}

export function hasAnyEffect(effects: Effects): boolean {
  return Boolean(
    effects.bonus ||
      effects.acerto ||
      effects.cd ||
      effects.ca ||
      effects.tipo_dano ||
      effects.extra ||
      effects.arma?.dados ||
      effects.pericias ||
      effects.saves ||
      effects.atributos ||
      (effects.dano && effects.dano.length > 0),
  );
}

/** Resumo curto dos efeitos, para virar etiquetas na listagem. */
export function describeEffects(effects: Effects): string[] {
  const labels: string[] = [];

  if (effects.bonus) labels.push(`${formatMod(effects.bonus)} mágico`);
  if (effects.acerto) labels.push(`${formatMod(effects.acerto)} acerto`);
  if (effects.cd) labels.push(`${formatMod(effects.cd)} CD`);
  if (effects.ca) labels.push(`${formatMod(effects.ca)} CA`);

  for (const part of effects.dano ?? []) {
    if (!part.dados?.trim()) continue;
    labels.push(`+${part.dados}${part.tipo ? ` ${part.tipo}` : ""}`);
  }

  if (effects.tipo_dano) labels.push(`dano vira ${effects.tipo_dano}`);

  for (const [atributo, valor] of Object.entries(effects.atributos ?? {})) {
    labels.push(`${formatMod(valor)} ${atributo.toUpperCase()}`);
  }

  for (const atributo of Object.keys(effects.saves ?? {})) {
    labels.push(`resistência de ${atributo.toUpperCase()}`);
  }

  for (const [pericia, grau] of Object.entries(effects.pericias ?? {})) {
    labels.push(
      grau === "especialista"
        ? `${pericia}: dobrada`
        : grau === "dobra_se_ja_tiver"
          ? `${pericia}: proficiente, dobra se já tiver`
          : `${pericia}: proficiente`,
    );
  }

  return labels;
}

/**
 * Valor de cada atributo já com o que os talentos somaram.
 *
 * Talento que dá "+1 em Destreza" mexe no valor, não em um bônus solto: ele
 * precisa passar pelo modificador para chegar no dano e nas perícias.
 */
export function effectiveAttributes(
  attributes: Record<string, number | string | null>,
  sources: ActiveSource[],
): Record<string, number> {
  const total: Record<string, number> = {};

  for (const [chave, valor] of Object.entries(attributes ?? {})) {
    const numero = Number(valor);
    if (Number.isFinite(numero)) total[chave] = numero;
  }

  for (const source of sources) {
    for (const [chave, ganho] of Object.entries(source.effects.atributos ?? {})) {
      total[chave] = (total[chave] ?? 0) + ganho;
    }
  }

  return total;
}

/* ------------------------------------------------------------------ */
/* Quem está valendo agora                                              */
/* ------------------------------------------------------------------ */

export type ActiveSource = {
  key: string;
  label: string;
  origin: "item" | "fluxo" | "talento" | "classe";
  effects: Effects;
  /** Texto da descrição, que é onde as regras sem número são escritas. */
  descricao: string | null;
};

/**
 * Junta tudo que está entrando na conta neste momento.
 *
 * Regras:
 *  - item desativado não entra, nem ele nem as habilidades dele;
 *  - habilidade passiva vale sempre que a fonte dela estiver valendo;
 *  - habilidade ativa só vale quando ligada.
 */
export function collectActiveSources(
  items: MagicItemRow[],
  abilities: AbilityRow[],
): ActiveSource[] {
  const sources: ActiveSource[] = [];
  const activeItemIds = new Set(
    items.filter((item) => item.equipped).map((item) => item.id),
  );

  for (const item of items) {
    if (!item.equipped) continue;
    const effects = readEffects(item.passive_effects);
    if (!hasAnyEffect(effects) && !item.description_html) continue;
    sources.push({
      key: `item:${item.id}`,
      label: item.name,
      origin: "item",
      effects,
      descricao: item.description_html,
    });
  }

  for (const ability of abilities) {
    const fromItem = ability.source === "item";
    if (fromItem && (!ability.item_id || !activeItemIds.has(ability.item_id))) {
      continue;
    }
    if (ability.kind === "active" && !ability.is_active) continue;

    const effects = readEffects(ability.effects);
    if (!hasAnyEffect(effects) && !ability.description_html) continue;

    const parentName = fromItem
      ? items.find((item) => item.id === ability.item_id)?.name
      : null;

    sources.push({
      key: `ability:${ability.id}`,
      label: parentName ? `${ability.name} (${parentName})` : ability.name,
      origin: fromItem ? "item" : ability.source,
      effects,
      descricao: ability.description_html,
    });
  }

  return sources;
}

/* ------------------------------------------------------------------ */
/* Armas                                                                */
/* ------------------------------------------------------------------ */

export type WeaponChoice = {
  key: string;
  nome: string;
  dados: string;
  tipo: string;
  /** Chave do atributo, quando a arma troca o de ataque. */
  atributo?: string;
  origem: "item" | "avulsa";
  /** Item desativado continua na lista, mas avisando. */
  disponivel: boolean;
};

export function listWeapons(
  combat: CombatBlock,
  items: MagicItemRow[],
): WeaponChoice[] {
  const doInventario = items
    .map((item) => ({ item, arma: readEffects(item.passive_effects).arma }))
    .filter((entry) => Boolean(entry.arma?.dados))
    .map<WeaponChoice>(({ item, arma }) => ({
      key: `item:${item.id}`,
      nome: item.name,
      dados: arma!.dados,
      tipo: arma!.tipo ?? "",
      atributo: arma!.atributo,
      origem: "item",
      disponivel: item.equipped,
    }));

  const avulsas = combat.armas.map<WeaponChoice>((weapon) => ({
    key: `avulsa:${weapon.id}`,
    nome: weapon.nome,
    dados: weapon.dados,
    tipo: weapon.tipo,
    origem: "avulsa",
    disponivel: true,
  }));

  return [...doInventario, ...avulsas];
}

/* ------------------------------------------------------------------ */
/* Números finais                                                       */
/* ------------------------------------------------------------------ */

export type NumberBreakdown = {
  base: number;
  bonus: number;
  total: number;
  fontes: { label: string; valor: number; regra?: "maior" }[];
};

export type DamageLine = {
  key: string;
  dados: string;
  tipo: string;
  label: string;
  origin: "arma" | "atributo" | "magico" | "item" | "fluxo" | "talento" | "classe";
};

export type WeaponDamage = {
  weapon: WeaponChoice;
  emUso: boolean;
  /** Expressão pronta, ex: "2d8 + 5d2 + 3". */
  expressao: string;
  parcelas: DamageLine[];
  porTipo: { tipo: string; expressao: string }[];
  conversao: { de: string; para: string; label: string } | null;
  atributo: { chave: string; label: string; mod: number; trocadoPor?: string } | null;
};

export type CombatSummary = {
  acerto: NumberBreakdown;
  cd: NumberBreakdown;
  ca: NumberBreakdown;
  /** Uma entrada por arma: o dano muda conforme a arma usada. */
  armas: WeaponDamage[];
  /** Maior bônus mágico entre os itens ativados. */
  bonusMagico: { valor: number; label: string } | null;
  fontes: ActiveSource[];
};

function attributeLabel(system: SystemDef, key: string): string {
  return system.attributes.find((attr) => attr.key === key)?.label ?? key;
}

/**
 * Bônus mágico dos itens não soma: entre dois itens ativados vale o maior.
 * Ele entra tanto no acerto quanto no dano de qualquer arma.
 */
function highestItemBonus(sources: ActiveSource[]) {
  let melhor: { valor: number; label: string } | null = null;
  for (const source of sources) {
    if (source.origin !== "item") continue;
    const valor = source.effects.bonus ?? 0;
    if (valor === 0) continue;
    if (!melhor || valor > melhor.valor) {
      melhor = { valor, label: source.label };
    }
  }
  return melhor;
}

function sumNumber(
  base: number,
  sources: ActiveSource[],
  field: "acerto" | "cd" | "ca",
  extra: { label: string; valor: number; regra: "maior" } | null,
): NumberBreakdown {
  const fontes = sources
    .filter((source) => typeof source.effects[field] === "number")
    .map((source) => ({
      label: source.label,
      valor: source.effects[field] as number,
    }));

  if (extra) fontes.unshift(extra);

  const bonus = fontes.reduce((total, item) => total + item.valor, 0);
  return { base, bonus, total: base + bonus, fontes };
}

function damageForWeapon({
  arma,
  combat,
  sources,
  attributes,
  system,
  bonusMagico,
  emUso,
}: {
  arma: WeaponChoice | null;
  combat: CombatBlock;
  sources: ActiveSource[];
  attributes: Record<string, number | string | null>;
  system: SystemDef;
  bonusMagico: { valor: number; label: string } | null;
  emUso: boolean;
}): WeaponDamage {
  const parcelas: DamageLine[] = [];

  // A conversão de tipo mais recente vence, e vale só para o dano da arma.
  const conversores = sources.filter((source) => source.effects.tipo_dano);
  const conversor = conversores[conversores.length - 1] ?? null;
  const tipoArma = arma?.tipo?.trim() || "sem tipo";
  const tipoFinal = conversor?.effects.tipo_dano ?? tipoArma;

  if (arma?.dados?.trim()) {
    parcelas.push({
      key: `arma:${arma.key}`,
      dados: arma.dados,
      tipo: tipoFinal,
      label: arma.nome || "Arma",
      origin: "arma",
    });
  }

  // A arma pode trocar o atributo de ataque (Felix ataca com Inteligência).
  const chaveAtributo = arma?.atributo || combat.atributo_ataque;
  let atributo: WeaponDamage["atributo"] = null;

  if (chaveAtributo) {
    const mod = attributeMod(attributes?.[chaveAtributo]);
    atributo = {
      chave: chaveAtributo,
      label: attributeLabel(system, chaveAtributo),
      mod,
      trocadoPor:
        arma?.atributo && arma.atributo !== combat.atributo_ataque
          ? arma.nome
          : undefined,
    };

    // Regra da casa: o modificador entra rolado em d2, então +5 vira 5d2.
    if (mod > 0) {
      parcelas.push({
        key: "atributo",
        dados: `${mod}d2`,
        tipo: tipoFinal,
        label: `${atributo.label} ${formatMod(mod)}`,
        origin: "atributo",
      });
    }
  }

  if (bonusMagico) {
    parcelas.push({
      key: "magico",
      dados: String(bonusMagico.valor),
      tipo: tipoFinal,
      label: `${bonusMagico.label} (bônus mágico)`,
      origin: "magico",
    });
  }

  for (const source of sources) {
    for (const [index, part] of (source.effects.dano ?? []).entries()) {
      if (!part.dados?.trim()) continue;
      parcelas.push({
        key: `${source.key}:${index}`,
        dados: part.dados,
        tipo: part.tipo?.trim() || tipoFinal,
        label: source.label,
        origin: source.origin,
      });
    }
  }

  const grupos = new Map<string, DiceExpression[]>();
  for (const line of parcelas) {
    const atual = grupos.get(line.tipo) ?? [];
    atual.push(parseDice(line.dados));
    grupos.set(line.tipo, atual);
  }

  return {
    weapon:
      arma ??
      {
        key: "nenhuma",
        nome: "Sem arma",
        dados: "",
        tipo: "",
        origem: "avulsa",
        disponivel: true,
      },
    emUso,
    expressao: formatDice(
      mergeDice(...parcelas.map((line) => parseDice(line.dados))),
    ),
    parcelas,
    porTipo: [...grupos.entries()].map(([tipo, expressions]) => ({
      tipo,
      expressao: formatDice(mergeDice(...expressions)),
    })),
    conversao:
      conversor && tipoFinal !== tipoArma
        ? { de: tipoArma, para: tipoFinal, label: conversor.label }
        : null,
    atributo,
  };
}

export function summarizeCombat({
  combat,
  items,
  abilities,
  attributes,
  system,
}: {
  combat: CombatBlock;
  items: MagicItemRow[];
  abilities: AbilityRow[];
  attributes: Record<string, number | string | null>;
  system: SystemDef;
}): CombatSummary {
  const sources = collectActiveSources(items, abilities);
  const bonusMagico = highestItemBonus(sources);
  // Talento que aumenta atributo entra antes de qualquer conta.
  const valores = effectiveAttributes(attributes, sources);
  const disponiveis = listWeapons(combat, items).filter(
    (weapon) => weapon.disponivel,
  );

  const armas = (disponiveis.length > 0 ? disponiveis : [null]).map((arma) =>
    damageForWeapon({
      arma,
      combat,
      sources,
      attributes: valores,
      system,
      bonusMagico,
      emUso: arma ? arma.key === combat.arma_ativa : false,
    }),
  );

  // Sem escolha explícita, a primeira disponível fica em destaque.
  if (armas.length > 0 && !armas.some((entry) => entry.emUso)) {
    armas[0].emUso = true;
  }

  const extraAcerto = bonusMagico
    ? { label: `${bonusMagico.label} (mágico)`, valor: bonusMagico.valor, regra: "maior" as const }
    : null;

  return {
    acerto: sumNumber(combat.acerto_base, sources, "acerto", extraAcerto),
    cd: sumNumber(combat.cd_base, sources, "cd", null),
    ca: sumNumber(combat.ca_base, sources, "ca", null),
    armas,
    bonusMagico,
    fontes: sources,
  };
}
