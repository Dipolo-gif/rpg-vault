import { attributeMod, formatMod } from "@/lib/effects";
import type { SpellRow } from "@/lib/database.types";

/**
 * Magias e espaços de magia.
 *
 * A ficha de papel separa por círculo: cada um tem a fileira de espaços no
 * topo e as magias daquele círculo embaixo. Aqui é igual, com a diferença de
 * que os gastos ficam salvos, então o que você queimou na sessão continua
 * queimado quando você voltar.
 *
 * Truque é círculo 0 e não gasta espaço nenhum.
 */

export const CIRCULOS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export type Espaco = {
  /** Quantos você tem no círculo. */
  total: number;
  /** Quantos já foram gastos. */
  usados: number;
};

export type SpellsBlock = {
  /** Chave do atributo que conjura, ex: "int". */
  atributo: string;
  /** Espaços por círculo, do 1 ao 9. A chave é o número do círculo. */
  espacos: Record<string, Espaco>;
  /** Para a mesa que usa pontos de feitiçaria ou parecido. */
  pontos: Espaco;
  /** Nome do recurso de pontos, quando a mesa usa um. */
  pontos_label: string;
};

export const EMPTY_SPELLS: SpellsBlock = {
  atributo: "",
  espacos: {},
  pontos: { total: 0, usados: 0 },
  pontos_label: "",
};

function lerEspaco(raw: unknown): Espaco {
  const valor = (raw ?? {}) as Partial<Espaco>;
  const total = Math.max(0, Number(valor.total) || 0);
  const usados = Math.max(0, Number(valor.usados) || 0);
  // Gasto nunca passa do que existe: um espaço removido não deixa dívida.
  return { total, usados: Math.min(usados, total) };
}

export function readSpells(raw: unknown): SpellsBlock {
  const valor = (raw ?? {}) as Partial<SpellsBlock>;
  const espacos: Record<string, Espaco> = {};

  for (const circulo of CIRCULOS) {
    espacos[circulo] = lerEspaco(valor.espacos?.[circulo]);
  }

  return {
    atributo: typeof valor.atributo === "string" ? valor.atributo : "",
    espacos,
    pontos: lerEspaco(valor.pontos),
    pontos_label:
      typeof valor.pontos_label === "string" ? valor.pontos_label : "",
  };
}

/** Quanto resta no círculo. */
export function restantes(espaco: Espaco): number {
  return Math.max(0, espaco.total - espaco.usados);
}

/** Tem espaço em algum círculo? Serve para esconder a seção de quem não conjura. */
export function temEspacos(block: SpellsBlock): boolean {
  return CIRCULOS.some((circulo) => block.espacos[circulo]?.total > 0);
}

/**
 * CD e acerto de magia, pela conta padrão:
 *   CD = 8 + proficiência + modificador do atributo
 *   acerto = proficiência + modificador do atributo
 */
export type SpellMath = {
  mod: number;
  cd: number;
  acerto: number;
  /** Rótulo do atributo, para a tela dizer de onde veio. */
  label: string;
};

export function spellMath({
  block,
  attributes,
  profBonus,
  attributeLabel,
}: {
  block: SpellsBlock;
  attributes: Record<string, number | string | null>;
  profBonus: number;
  attributeLabel: (key: string) => string;
}): SpellMath | null {
  if (!block.atributo) return null;

  const mod = attributeMod(attributes?.[block.atributo]);
  return {
    mod,
    cd: 8 + profBonus + mod,
    acerto: profBonus + mod,
    label: attributeLabel(block.atributo),
  };
}

export const NOME_CIRCULO: Record<number, string> = {
  0: "Truques",
  1: "1º círculo",
  2: "2º círculo",
  3: "3º círculo",
  4: "4º círculo",
  5: "5º círculo",
  6: "6º círculo",
  7: "7º círculo",
  8: "8º círculo",
  9: "9º círculo",
};

/** Resumo de uma magia em uma linha, para a listagem. */
export function describeSpell(spell: SpellRow): string[] {
  const partes: string[] = [];
  if (spell.school) partes.push(spell.school);
  if (spell.casting_time) partes.push(spell.casting_time);
  if (spell.range) partes.push(spell.range);
  if (spell.duration) partes.push(spell.duration);
  if (spell.components) partes.push(spell.components);
  return partes;
}

/** Agrupa as magias por círculo, do truque ao 9. */
export function porCirculo(spells: SpellRow[]): Map<number, SpellRow[]> {
  const grupos = new Map<number, SpellRow[]>();

  for (const spell of spells) {
    const atual = grupos.get(spell.level) ?? [];
    atual.push(spell);
    grupos.set(spell.level, atual);
  }

  for (const lista of grupos.values()) {
    lista.sort(
      (a, b) =>
        a.sort_order - b.sort_order || a.name.localeCompare(b.name, "pt-BR"),
    );
  }

  return grupos;
}

export { formatMod };
