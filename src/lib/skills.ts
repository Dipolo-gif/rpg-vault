import {
  attributeMod,
  effectiveAttributes,
  type ActiveSource,
  type SkillGrant,
} from "@/lib/effects";
import type { SkillDef, SystemDef } from "@/lib/systems";

/**
 * Perícias calculadas.
 *
 * O total de uma perícia é: modificador do atributo + proficiência + ajuste na
 * mão.
 *
 * Regra da mesa: a proficiência empilha. Cada fonte que concede a perícia soma
 * mais um bônus de proficiência, então marcada na mão (1), mais um talento (2),
 * mais a Especialização do ladino (3) dá o bônus três vezes. A fonte que diz
 * "dobrada" garante pelo menos duas. Quem concede pode ser habilidade de
 * classe, talento, fluxo ou item, e sai da conta sozinho quando a fonte
 * desliga.
 */

export type SkillState = "none" | "proficiente" | "especialista";

/** Quantos bônus de proficiência cada marcação sua vale. */
const MULTIPLO: Record<SkillState, number> = {
  none: 0,
  proficiente: 1,
  especialista: 2,
};

export type SkillsBlock = {
  /** Bônus de proficiência, digitado por você. */
  prof_bonus: number;
  /** O que você marcou na mão. */
  estados: Record<string, SkillState>;
  /** Ajuste fixo por perícia, para o que a regra não cobre. */
  extras: Record<string, number>;
  /** Proficiência nos testes de resistência, por atributo. */
  saves: Record<string, SkillState>;
};

export const EMPTY_SKILLS: SkillsBlock = {
  prof_bonus: 2,
  estados: {},
  extras: {},
  saves: {},
};

export function readSkills(raw: unknown): SkillsBlock {
  const value = (raw ?? {}) as Partial<SkillsBlock>;
  return {
    prof_bonus: Number.isFinite(Number(value.prof_bonus))
      ? Number(value.prof_bonus)
      : 2,
    estados: value.estados ?? {},
    extras: value.extras ?? {},
    saves: value.saves ?? {},
  };
}

/** Uma fonte que concede a perícia, e quanta proficiência ela somou. */
export type SkillGrantInfo = {
  grau: SkillGrant;
  por: string;
  /** Quantos bônus de proficiência esta fonte acrescentou. */
  soma: number;
};

/** Quanto uma fonte soma por cima do que já valia. */
function aplica(atual: number, grau: SkillGrant): number {
  // "Dobrada" garante pelo menos dois, mesmo quando é a única fonte.
  return grau === "especialista" ? Math.max(atual + 1, 2) : atual + 1;
}

/**
 * Quantas vezes o bônus de proficiência entra: o que você marcou mais uma por
 * fonte. É o que faz talento, classe e item somarem em vez de um cobrir o
 * outro.
 */
function resolveMultiplos(
  manual: SkillState,
  grants: { grau: SkillGrant }[],
): number {
  return grants.reduce(
    (total, entrada) => aplica(total, entrada.grau),
    MULTIPLO[manual],
  );
}

/** O quanto cada fonte somou, na ordem, para a ficha mostrar a conta. */
function comImpacto(
  manual: SkillState,
  grants: { grau: SkillGrant; por: string }[],
): SkillGrantInfo[] {
  let atual = MULTIPLO[manual];

  return grants.map((entrada) => {
    const proximo = aplica(atual, entrada.grau);
    const soma = proximo - atual;
    atual = proximo;
    return { ...entrada, soma };
  });
}

/** Grau para cor e rótulo: de 2 para cima já é proficiência dobrada. */
function grauDe(multiplos: number): SkillState {
  if (multiplos <= 0) return "none";
  return multiplos === 1 ? "proficiente" : "especialista";
}

export type SkillLine = {
  def: SkillDef;
  attributeShort: string;
  /** Modificador do atributo que rege a perícia. */
  mod: number;
  /** O que você marcou na mão. */
  manual: SkillState;
  /** Quem concedeu proficiência, e quanto cada um somou. */
  concedidoPor: SkillGrantInfo[];
  /** Quantas vezes o bônus de proficiência entrou. */
  multiplos: number;
  /** Grau para cor e rótulo, derivado dos múltiplos. */
  state: SkillState;
  prof: number;
  extra: number;
  total: number;
};

export function computeSkills({
  system,
  skills,
  attributes,
  sources,
  lista,
}: {
  system: SystemDef;
  skills: SkillsBlock;
  attributes: Record<string, number | string | null>;
  sources: ActiveSource[];
  lista: SkillDef[];
}): SkillLine[] {
  // Junta o que cada fonte ativa concede, guardando de quem veio.
  const concessoes = new Map<string, { grau: SkillGrant; por: string }[]>();
  for (const source of sources) {
    for (const [key, grau] of Object.entries(source.effects.pericias ?? {})) {
      const atual = concessoes.get(key) ?? [];
      atual.push({ grau, por: source.label });
      concessoes.set(key, atual);
    }
  }

  // Talento que aumenta atributo já entra no modificador.
  const valores = effectiveAttributes(attributes, sources);

  return lista.map((def) => {
    const manual = skills.estados[def.key] ?? "none";
    const grants = concessoes.get(def.key) ?? [];
    const multiplos = resolveMultiplos(manual, grants);
    const concedidoPor = comImpacto(manual, grants);

    const mod = attributeMod(valores[def.attribute]);
    const prof = multiplos * skills.prof_bonus;
    const extra = Number(skills.extras[def.key] ?? 0) || 0;

    return {
      def,
      attributeShort:
        system.attributes.find((attr) => attr.key === def.attribute)?.short ??
        def.attribute.toUpperCase(),
      mod,
      manual,
      concedidoPor,
      multiplos,
      state: grauDe(multiplos),
      prof,
      extra,
      total: mod + prof + extra,
    };
  });
}

export type SaveLine = {
  key: string;
  label: string;
  short: string;
  mod: number;
  /** O que voce marcou na mao. */
  manual: SkillState;
  /** Quem concedeu, normalmente a classe. */
  concedidoPor: SkillGrantInfo[];
  /** Quantas vezes o bônus de proficiência entrou. */
  multiplos: number;
  state: SkillState;
  prof: number;
  total: number;
};

/**
 * Testes de resistência: um por atributo, com a mesma conta das perícias.
 * A proficiência aqui é marcada na mão, como na ficha de papel.
 */
export function computeSaves({
  system,
  skills,
  attributes,
  sources,
}: {
  system: SystemDef;
  skills: SkillsBlock;
  attributes: Record<string, number | string | null>;
  sources: ActiveSource[];
}): SaveLine[] {
  const valores = effectiveAttributes(attributes, sources);

  // Classe costuma dar proficiência em dois testes de resistência.
  const concessoes = new Map<string, { grau: SkillGrant; por: string }[]>();
  for (const source of sources) {
    for (const [key, grau] of Object.entries(source.effects.saves ?? {})) {
      const atual = concessoes.get(key) ?? [];
      atual.push({ grau, por: source.label });
      concessoes.set(key, atual);
    }
  }

  return system.attributes.map((attribute) => {
    const manual = skills.saves[attribute.key] ?? "none";
    const grants = concessoes.get(attribute.key) ?? [];
    const multiplos = resolveMultiplos(manual, grants);
    const concedidoPor = comImpacto(manual, grants);

    const mod = attributeMod(valores[attribute.key]);
    const prof = multiplos * skills.prof_bonus;

    return {
      key: attribute.key,
      label: attribute.label,
      short: attribute.short,
      mod,
      manual,
      concedidoPor,
      multiplos,
      state: grauDe(multiplos),
      prof,
      total: mod + prof,
    };
  });
}

export const SKILL_STATE_LABEL: Record<SkillState, string> = {
  none: "Sem proficiência",
  proficiente: "Proficiente",
  especialista: "Proficiência dobrada",
};

/** Rótulo do que está valendo, contando as fontes. */
export function labelMultiplos(multiplos: number): string {
  if (multiplos <= 0) return "Sem proficiência";
  if (multiplos === 1) return "Proficiente";
  if (multiplos === 2) return "Proficiência dobrada";
  return `Proficiência ${multiplos} vezes`;
}

/** Próximo estado ao clicar, em ciclo. */
export function nextSkillState(state: SkillState): SkillState {
  if (state === "none") return "proficiente";
  if (state === "proficiente") return "especialista";
  return "none";
}
