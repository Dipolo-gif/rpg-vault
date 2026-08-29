"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { diceProblems } from "@/lib/dice";
import type { Effects, SkillGrant } from "@/lib/effects";
import { getSkills, type SkillDef, type SystemDef } from "@/lib/systems";
import { cn } from "@/lib/utils";

/**
 * Formulário do que uma fonte soma no personagem.
 * Usado pelos efeitos passivos do item e por cada habilidade.
 *
 * O texto solto (regras sem número, tipo "vantagem em Furtividade") não mora
 * aqui: vai na descrição, que aparece na listagem e na aba Combate.
 */
export function EffectsForm({
  value,
  onChange,
  system,
  /** Só item tem bônus mágico, que entra em acerto e dano. */
  showBonus = false,
}: {
  value: Effects;
  onChange: (effects: Effects) => void;
  /** O sistema já com os campos próprios da mesa, quando houver. */
  system: SystemDef & { skills?: SkillDef[] };
  showBonus?: boolean;
}) {
  const pericias = system.skills ?? getSkills(system.id);

  function setNumber(field: "bonus" | "acerto" | "cd" | "ca", raw: string) {
    const parsed = raw === "" || raw === "-" ? undefined : Number(raw);
    onChange({
      ...value,
      [field]: Number.isFinite(parsed) ? parsed : undefined,
    });
  }

  function setDamage(
    index: number,
    patch: Partial<{ dados: string; tipo: string }>,
  ) {
    const dano = [...(value.dano ?? [])];
    dano[index] = { ...dano[index], ...patch };
    onChange({ ...value, dano });
  }

  function addDamage() {
    onChange({ ...value, dano: [...(value.dano ?? []), { dados: "", tipo: "" }] });
  }

  function removeDamage(index: number) {
    const dano = (value.dano ?? []).filter((_, position) => position !== index);
    onChange({ ...value, dano: dano.length > 0 ? dano : undefined });
  }

  /** Nenhum > proficiente > dobrada, em ciclo. */
  function cyclePericia(key: string) {
    const atual = value.pericias?.[key];
    const proximo: SkillGrant | undefined =
      atual === undefined
        ? "proficiente"
        : atual === "proficiente"
          ? "especialista"
          : undefined;

    const pericias = { ...(value.pericias ?? {}) };
    if (proximo) pericias[key] = proximo;
    else delete pericias[key];

    onChange({
      ...value,
      pericias: Object.keys(pericias).length > 0 ? pericias : undefined,
    });
  }

  return (
    <div className="space-y-4">
      {showBonus && (
        <div className="space-y-1.5">
          <Label htmlFor="ef-bonus" className="text-xs">
            Bônus mágico
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="ef-bonus"
              type="number"
              value={value.bonus ?? ""}
              onChange={(event) => setNumber("bonus", event.target.value)}
              placeholder="0"
              className="w-20 text-center font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Entra no acerto e no dano. Entre itens ativados vale só o maior,
              não a soma.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["acerto", "Acerto"],
            ["cd", "CD"],
            ["ca", "CA"],
          ] as const
        ).map(([field, label]) => (
          <div key={field} className="space-y-1.5">
            <Label htmlFor={`ef-${field}`} className="text-xs">
              {label}
            </Label>
            <Input
              id={`ef-${field}`}
              type="number"
              value={value[field] ?? ""}
              onChange={(event) => setNumber(field, event.target.value)}
              placeholder="0"
              className="text-center font-mono"
            />
          </div>
        ))}
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Estes três somam normalmente, inclusive entre itens.
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Dano adicional</Label>
          <Button type="button" variant="ghost" size="xs" onClick={addDamage}>
            <Plus className="size-3" />
            Parcela
          </Button>
        </div>

        {(value.dano ?? []).length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhuma. Aceita dado (2d6) ou número puro (3).
          </p>
        )}

        {(value.dano ?? []).map((part, index) => {
          const problemas = diceProblems(part.dados);
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <Input
                  value={part.dados}
                  onChange={(event) =>
                    setDamage(index, { dados: event.target.value })
                  }
                  placeholder="2d6"
                  className="w-24 font-mono"
                  aria-label="Dados"
                />
                <Input
                  value={part.tipo ?? ""}
                  onChange={(event) =>
                    setDamage(index, { tipo: event.target.value })
                  }
                  placeholder="tipo (fogo, radiante...)"
                  className="flex-1"
                  aria-label="Tipo do dano"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remover parcela"
                  onClick={() => removeDamage(index)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              {problemas.length > 0 && (
                <p className="text-xs text-destructive">
                  Não entendi: {problemas.join(", ")}. Use algo como 2d6 ou 1d8+2.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ef-tipo" className="text-xs">
          Converter o tipo do dano da arma
        </Label>
        <Input
          id="ef-tipo"
          value={value.tipo_dano ?? ""}
          onChange={(event) =>
            onChange({ ...value, tipo_dano: event.target.value || undefined })
          }
          placeholder="deixe vazio para não converter"
        />
      </div>

      {pericias.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Perícias concedidas</Label>
          <p className="text-xs text-muted-foreground">
            Clique para alternar: nada, proficiente, proficiência dobrada.
            Qualquer fonte pode dobrar, seja item, classe, fluxo ou talento, e a
            ficha recalcula sozinha.
          </p>
          <div className="flex flex-wrap gap-1">
            {pericias.map((pericia) => {
              const grau = value.pericias?.[pericia.key];
              return (
                <Button
                  key={pericia.key}
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => cyclePericia(pericia.key)}
                  className={cn(
                    grau === "proficiente" &&
                      "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
                    grau === "especialista" &&
                      "border-primary/50 bg-primary/10 text-primary",
                  )}
                >
                  {pericia.label}
                  {grau === "especialista" && " ×2"}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
