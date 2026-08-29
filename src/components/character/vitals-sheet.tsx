"use client";

import { useEffect, useState } from "react";
import { Heart, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiFetch, apiJson } from "@/lib/client-api";
import type { CharacterStatsRow } from "@/lib/database.types";
import type { SystemDef } from "@/lib/systems";
import {
  clampVital,
  mergeVitalDefs,
  readVital,
  vitalPercent,
  type VitalValue,
} from "@/lib/vitals";

/**
 * Painel lateral de status. Serve para o caso mais comum na mesa: levar dano,
 * curar, gastar mana ou perder sanidade sem sair da tela do personagem.
 */
export function VitalsSheet({
  open,
  onOpenChange,
  characterId,
  system,
  stats,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  system: SystemDef;
  stats: CharacterStatsRow;
  onSaved: (stats: CharacterStatsRow) => void;
}) {
  const defs = mergeVitalDefs(system, stats.vitals);
  const [draft, setDraft] = useState<Record<string, VitalValue>>({});
  const [saving, setSaving] = useState(false);

  // Recarrega o rascunho toda vez que o painel abre.
  useEffect(() => {
    if (!open) return;
    const next: Record<string, VitalValue> = {};
    for (const def of defs) next[def.key] = readVital(stats.vitals, def);
    setDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stats]);

  function bump(key: string, delta: number) {
    setDraft((current) => {
      const value = current[key];
      if (!value) return current;
      return {
        ...current,
        [key]: clampVital({ ...value, current: value.current + delta }),
      };
    });
  }

  function setField(key: string, field: "current" | "max", raw: string) {
    const parsed = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(parsed)) return;
    setDraft((current) => {
      const value = current[key];
      if (!value) return current;
      return { ...current, [key]: { ...value, [field]: parsed } };
    });
  }

  async function save() {
    setSaving(true);
    try {
      const payload = await apiFetch<{ stats: CharacterStatsRow }>(
        `/api/characters/${characterId}/stats`,
        apiJson("PUT", { vitals: draft }),
      );
      onSaved(payload.stats);
      toast.success("Status atualizado");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-display flex items-center gap-2">
            <Heart className="size-4 text-rose-400" />
            Status rápido
          </SheetTitle>
          <SheetDescription>
            Ajuste os medidores da ficha. Salva tudo de uma vez ao confirmar.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4">
          {defs.map((def) => {
            const value = draft[def.key] ?? readVital(stats.vitals, def);
            return (
              <div key={def.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{def.label}</Label>
                  <span className="font-mono text-xs text-muted-foreground">
                    {value.current}
                    {def.hasMax ? ` / ${value.max ?? 0}` : ""}
                  </span>
                </div>

                {def.hasMax && (
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${def.bar}`}
                      style={{ width: `${vitalPercent(value)}%` }}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Diminuir ${def.label}`}
                    onClick={() => bump(def.key, -1)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    type="number"
                    value={value.current}
                    onChange={(event) =>
                      setField(def.key, "current", event.target.value)
                    }
                    className="w-20 text-center font-mono"
                    aria-label={`${def.label} atual`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Aumentar ${def.label}`}
                    onClick={() => bump(def.key, 1)}
                  >
                    <Plus className="size-4" />
                  </Button>

                  {def.hasMax && (
                    <>
                      <span className="text-muted-foreground">/</span>
                      <Input
                        type="number"
                        value={value.max ?? 0}
                        onChange={(event) =>
                          setField(def.key, "max", event.target.value)
                        }
                        className="w-20 text-center font-mono"
                        aria-label={`${def.label} máximo`}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <SheetFooter>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Salvar status
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
