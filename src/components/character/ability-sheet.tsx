"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { EffectsForm } from "@/components/character/effects-form";
import { RichTextEditor } from "@/components/character/rich-text-editor";
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
import type { AbilityKind, AbilityRow, AbilitySource } from "@/lib/database.types";
import { readEffects, type Effects } from "@/lib/effects";
import type { SystemDef } from "@/lib/systems";
import { cn } from "@/lib/utils";

const ACOES = ["Ação", "Ação Bônus", "Reação", "Ação Livre", "Passiva"];

const RECARGAS = [
  "1 por dia",
  "1 por semana",
  "descanso curto",
  "descanso longo",
  "ao amanhecer",
];

const TITULO: Record<AbilitySource, string> = {
  item: "habilidade do item",
  classe: "habilidade de classe",
  fluxo: "habilidade de fluxo",
  talento: "talento",
};

type Draft = {
  name: string;
  kind: AbilityKind;
  action_type: string;
  charge_cost: number;
  uses_max: number | null;
  uses_note: string;
  effects: Effects;
  description_html: string;
  description_text: string;
};

const emptyDraft: Draft = {
  name: "",
  kind: "active",
  action_type: "",
  charge_cost: 0,
  uses_max: null,
  uses_note: "",
  effects: {},
  description_html: "",
  description_text: "",
};

export function AbilitySheet({
  open,
  onOpenChange,
  characterId,
  source,
  system,
  itemId = null,
  /** Item tem cargas, então o custo por ativação faz sentido. */
  itemHasCharges = false,
  ability,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  source: AbilitySource;
  system: SystemDef;
  itemId?: string | null;
  itemHasCharges?: boolean;
  ability: AbilityRow | null;
  onSaved: (ability: AbilityRow, created: boolean) => void;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (ability) {
      setDraft({
        name: ability.name,
        kind: ability.kind,
        action_type: ability.action_type ?? "",
        charge_cost: ability.charge_cost,
        uses_max: ability.uses_max,
        uses_note: ability.uses_note ?? "",
        effects: readEffects(ability.effects),
        description_html: ability.description_html ?? "",
        description_text: ability.description_text ?? "",
      });
    } else {
      setDraft(emptyDraft);
    }
  }, [open, ability]);

  const ativa = draft.kind === "active";

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim()) {
      toast.error("A habilidade precisa de um nome");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: draft.name.trim(),
        kind: draft.kind,
        action_type: draft.action_type.trim() || null,
        charge_cost: ativa ? draft.charge_cost : 0,
        uses_max: ativa ? draft.uses_max : null,
        uses_note: ativa ? draft.uses_note.trim() || null : null,
        effects: draft.effects,
        description_html: draft.description_html || null,
        description_text: draft.description_text || null,
      };

      const payload = ability
        ? await apiFetch<{ ability: AbilityRow }>(
            `/api/abilities/${ability.id}`,
            apiJson("PATCH", body),
          )
        : await apiFetch<{ ability: AbilityRow }>(
            `/api/characters/${characterId}/abilities`,
            apiJson("POST", {
              ...body,
              source,
              item_id: source === "item" ? itemId : null,
              uses_current: body.uses_max,
            }),
          );

      onSaved(payload.ability, !ability);
      toast.success(ability ? "Habilidade salva" : "Habilidade criada");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-display flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {ability ? "Editar" : "Nova"} {TITULO[source]}
          </SheetTitle>
          <SheetDescription>
            O que estiver preenchido em efeitos entra sozinho na aba Combate
            enquanto a habilidade estiver valendo.
          </SheetDescription>
        </SheetHeader>

        <form
          id="ability-form"
          onSubmit={save}
          className="flex-1 space-y-4 overflow-y-auto px-4"
        >
          <div className="space-y-2">
            <Label htmlFor="ability-name">Nome</Label>
            <Input
              id="ability-name"
              value={draft.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Ex: Batida que Conserta"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => update("kind", "active")}
                className={cn(
                  "flex-1",
                  ativa && "border-primary/50 bg-primary/10 text-primary",
                )}
              >
                Ativa
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => update("kind", "passive")}
                className={cn(
                  "flex-1",
                  !ativa &&
                    "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
                )}
              >
                Passiva
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {ativa
                ? "Você liga e desliga na hora do uso. Só conta enquanto estiver ligada."
                : "Vale sozinha enquanto a fonte estiver valendo."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ability-action">Tipo de ação</Label>
              <Input
                id="ability-action"
                list="acoes-sugeridas"
                value={draft.action_type}
                onChange={(event) => update("action_type", event.target.value)}
                placeholder="Ação"
              />
              <datalist id="acoes-sugeridas">
                {ACOES.map((acao) => (
                  <option key={acao} value={acao} />
                ))}
              </datalist>
            </div>

            {ativa && itemHasCharges && (
              <div className="space-y-2">
                <Label htmlFor="ability-cost">Custo em cargas</Label>
                <Input
                  id="ability-cost"
                  type="number"
                  min={0}
                  value={draft.charge_cost}
                  onChange={(event) =>
                    update("charge_cost", Number(event.target.value) || 0)
                  }
                  className="font-mono"
                />
              </div>
            )}
          </div>

          {ativa && (
            <div className="space-y-2">
              <Label htmlFor="ability-uses">Usos próprios</Label>
              <Input
                id="ability-uses"
                type="number"
                min={0}
                value={draft.uses_max ?? ""}
                onChange={(event) =>
                  update(
                    "uses_max",
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                placeholder="vazio = sem limite próprio"
                className="w-40 font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Para habilidade que não gasta carga e sim um contador próprio,
                como uma Ultimate 1 por semana.
              </p>

              {draft.uses_max !== null && (
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="ability-uses-note" className="text-xs">
                    Quando recupera
                  </Label>
                  <Input
                    id="ability-uses-note"
                    value={draft.uses_note}
                    onChange={(event) =>
                      update("uses_note", event.target.value)
                    }
                    list="recargas-sugeridas"
                    placeholder="1 por dia"
                  />
                  <datalist id="recargas-sugeridas">
                    {RECARGAS.map((recarga) => (
                      <option key={recarga} value={recarga} />
                    ))}
                  </datalist>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 rounded-xl border border-border p-3">
            <Label className="text-display text-sm">Efeitos</Label>
            <EffectsForm
              value={draft.effects}
              onChange={(effects) => update("effects", effects)}
              system={system}
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <RichTextEditor
              value={draft.description_html}
              onChange={(html, text) =>
                setDraft((current) => ({
                  ...current,
                  description_html: html,
                  description_text: text,
                }))
              }
              placeholder="O que a habilidade faz, na íntegra..."
            />
          </div>
        </form>

        <SheetFooter>
          <Button type="submit" form="ability-form" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {ability ? "Salvar" : "Criar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
