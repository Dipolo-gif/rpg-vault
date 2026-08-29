/**
 * Leitura e soma de expressões de dado.
 *
 * O dano do personagem nunca é digitado inteiro: ele nasce da arma, do
 * atributo de ataque e das fontes que estiverem ligadas naquele momento.
 * Este arquivo é o que junta tudo em uma expressão só.
 */

export type DiceGroup = { count: number; sides: number };

export type DiceExpression = {
  dice: DiceGroup[];
  /** Parcela fixa, como o "+3" de "1d8+3". */
  flat: number;
};

export const EMPTY_DICE: DiceExpression = { dice: [], flat: 0 };

/**
 * Aceita "1d8", "2d6+3", "d4", "-1d4 + 2", "5".
 * Trecho que não faz sentido é ignorado, então campo meio digitado não quebra
 * a tela. Use `diceProblems` quando quiser avisar o usuário.
 */
export function parseDice(input: string | null | undefined): DiceExpression {
  const result: DiceExpression = { dice: [], flat: 0 };
  if (!input) return result;

  const cleaned = input.replace(/\s+/g, "").toLowerCase();
  const tokens = cleaned.match(/[+-]?[^+-]+/g) ?? [];

  for (const token of tokens) {
    const negative = token.startsWith("-");
    const body = token.replace(/^[+-]/, "");
    if (!body) continue;

    const die = /^(\d*)d(\d+)$/.exec(body);
    if (die) {
      const count = (die[1] === "" ? 1 : Number(die[1])) * (negative ? -1 : 1);
      const sides = Number(die[2]);
      if (sides > 0 && count !== 0) result.dice.push({ count, sides });
      continue;
    }

    const flat = Number(body);
    if (Number.isFinite(flat)) result.flat += negative ? -flat : flat;
  }

  return result;
}

/** Trechos que o parser não entendeu, para mostrar como aviso no formulário. */
export function diceProblems(input: string | null | undefined): string[] {
  if (!input?.trim()) return [];
  const cleaned = input.replace(/\s+/g, "").toLowerCase();
  const tokens = cleaned.match(/[+-]?[^+-]+/g) ?? [];

  return tokens
    .map((token) => token.replace(/^[+-]/, ""))
    .filter(
      (body) =>
        body.length > 0 &&
        !/^\d*d\d+$/.test(body) &&
        !Number.isFinite(Number(body)),
    );
}

/** Junta várias expressões somando os dados de mesmo lado. */
export function mergeDice(...expressions: DiceExpression[]): DiceExpression {
  const bySides = new Map<number, number>();
  let flat = 0;

  for (const expression of expressions) {
    for (const group of expression.dice) {
      bySides.set(group.sides, (bySides.get(group.sides) ?? 0) + group.count);
    }
    flat += expression.flat;
  }

  const dice = [...bySides.entries()]
    .filter(([, count]) => count !== 0)
    .map(([sides, count]) => ({ sides, count }))
    // Dado maior primeiro: "1d8 + 5d2" lê melhor que "5d2 + 1d8".
    .sort((a, b) => b.sides - a.sides);

  return { dice, flat };
}

export function formatDice(expression: DiceExpression): string {
  const parts: string[] = [];

  for (const group of expression.dice) {
    const magnitude = `${Math.abs(group.count)}d${group.sides}`;
    parts.push(
      parts.length === 0
        ? group.count < 0
          ? `-${magnitude}`
          : magnitude
        : `${group.count < 0 ? "-" : "+"} ${magnitude}`,
    );
  }

  if (expression.flat !== 0) {
    const magnitude = String(Math.abs(expression.flat));
    parts.push(
      parts.length === 0
        ? expression.flat < 0
          ? `-${magnitude}`
          : magnitude
        : `${expression.flat < 0 ? "-" : "+"} ${magnitude}`,
    );
  }

  return parts.length > 0 ? parts.join(" ") : "0";
}

export function isEmptyDice(expression: DiceExpression): boolean {
  return expression.dice.length === 0 && expression.flat === 0;
}

/** Menor e maior resultado possível, útil para mostrar a faixa do dano. */
export function diceRange(expression: DiceExpression): {
  min: number;
  max: number;
} {
  let min = expression.flat;
  let max = expression.flat;

  for (const group of expression.dice) {
    const low = group.count * (group.count < 0 ? group.sides : 1);
    const high = group.count * (group.count < 0 ? 1 : group.sides);
    min += Math.min(low, high);
    max += Math.max(low, high);
  }

  return { min, max };
}
