import type { CharacterStatsRow } from "@/lib/database.types";
import type { SystemDef, VitalDef } from "@/lib/systems";

export type VitalValue = { current: number; max: number | null };

/** Le um vital do JSONB caindo no default do sistema quando ainda nao existe. */
export function readVital(
  vitals: CharacterStatsRow["vitals"],
  def: VitalDef,
): VitalValue {
  const raw = vitals?.[def.key];
  if (raw && typeof raw === "object") {
    return {
      current: Number(raw.current ?? 0),
      max: def.hasMax ? (raw.max ?? def.defaultMax ?? null) : null,
    };
  }
  return {
    current: def.hasMax ? (def.defaultMax ?? 0) : 0,
    max: def.hasMax ? (def.defaultMax ?? null) : null,
  };
}

export function clampVital(value: VitalValue): VitalValue {
  const max = value.max;
  const current = Math.max(-999, Math.min(value.current, max ?? 9999));
  return { current, max };
}

export function vitalPercent(value: VitalValue): number {
  if (!value.max || value.max <= 0) return 0;
  return Math.max(0, Math.min(100, (value.current / value.max) * 100));
}

/**
 * Junta os vitals salvos com os do preset, para a UI sempre mostrar as barras
 * do sistema mesmo antes do primeiro save, e ainda listar campos criados a mao.
 */
export function mergeVitalDefs(
  system: SystemDef,
  vitals: CharacterStatsRow["vitals"],
): VitalDef[] {
  const extras = Object.keys(vitals ?? {})
    .filter((key) => !system.vitals.some((def) => def.key === key))
    .map<VitalDef>((key) => ({
      key,
      label: key,
      hasMax: typeof vitals[key]?.max === "number",
      bar: "bg-zinc-400",
    }));

  return [...system.vitals, ...extras];
}
