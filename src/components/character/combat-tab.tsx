"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Save, Swords, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, apiJson } from "@/lib/client-api";
import type {
  AbilityRow,
  CharacterStatsRow,
  MagicItemWithUrl,
} from "@/lib/database.types";
import { diceProblems } from "@/lib/dice";
import {
  formatMod,
  readCombat,
  summarizeCombat,
  type CombatBlock,
  type LooseWeapon,
  type WeaponDamage,
} from "@/lib/effects";
import type { SystemDef } from "@/lib/systems";
import { cn } from "@/lib/utils";

const ORIGEM: Record<string, string> = {
  arma: "arma",
  atributo: "atributo",
  magico: "mágico",
  item: "item",
  fluxo: "fluxo",
  talento: "talento",
  classe: "classe",
};

export function CombatTab({
  characterId,
  system,
  stats,
  onStatsChange,
  items,
  abilities,
}: {
  characterId: string;
  system: SystemDef;
  stats: CharacterStatsRow;
  onStatsChange: (stats: CharacterStatsRow) => void;
  items: MagicItemWithUrl[];
  abilities: AbilityRow[];
}) {
  const [combat, setCombat] = useState<CombatBlock>(() =>
    readCombat(stats.combat),
  );
  const [saving, setSaving] = useState(false);

  const dirty =
    JSON.stringify(combat) !== JSON.stringify(readCombat(stats.combat));

  // Recalcula a cada tecla: o cálculo é local e barato.
  const resumo = useMemo(
    () =>
      summarizeCombat({
        combat,
        items,
        abilities,
        attributes: stats.attributes ?? {},
        system,
      }),
    [combat, items, abilities, stats.attributes, system],
  );

  function setBase(field: "acerto_base" | "cd_base", raw: string) {
    const parsed = raw === "" || raw === "-" ? 0 : Number(raw);
    if (!Number.isFinite(parsed)) return;
    setCombat((current) => ({ ...current, [field]: parsed }));
  }

  function setWeapon(index: number, patch: Partial<LooseWeapon>) {
    setCombat((current) => {
      const armas = [...current.armas];
      armas[index] = { ...armas[index], ...patch };
      return { ...current, armas };
    });
  }

  function addWeapon() {
    setCombat((current) => ({
      ...current,
      armas: [
        ...current.armas,
        { id: crypto.randomUUID(), nome: "", dados: "", tipo: "" },
      ],
    }));
  }

  function removeWeapon(id: string) {
    setCombat((current) => ({
      ...current,
      armas: current.armas.filter((weapon) => weapon.id !== id),
      arma_ativa:
        current.arma_ativa === `avulsa:${id}` ? null : current.arma_ativa,
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload = await apiFetch<{ stats: CharacterStatsRow }>(
        `/api/characters/${characterId}/stats`,
        apiJson("PUT", { combat }),
      );
      onStatsChange(payload.stats);
      toast.success("Combate salvo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Swords className="size-4 text-primary" />
        <h2 className="text-display mr-auto text-lg font-semibold">Combate</h2>
        <Button onClick={save} disabled={saving || !dirty} size="sm">
          {saving ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          Salvar
        </Button>
      </div>

      {/* Acerto, CD e CA: base digitada por você, bônus somado sozinho. */}
      <section className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["acerto_base", "Acerto", resumo.acerto],
            ["cd_base", "CD", resumo.cd],
            ["ca_base", "CA", resumo.ca],
          ] as const
        ).map(([field, label, breakdown]) => (
          <div
            key={field}
            className="vault-panel rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-baseline justify-between">
              <Label
                htmlFor={`combat-${field}`}
                className="text-xs tracking-widest text-muted-foreground uppercase"
              >
                {label}
              </Label>
              <span className="text-display text-3xl font-semibold text-primary">
                {breakdown.total}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {field === "ca_base" ? (
                <span className="font-mono text-sm text-muted-foreground">
                  {combat.ca_base} de base, na aba Ficha
                </span>
              ) : (
                <Input
                  id={`combat-${field}`}
                  type="number"
                  value={combat[field]}
                  onChange={(event) => setBase(field, event.target.value)}
                  className="w-20 text-center font-mono"
                  aria-label={`${label} base`}
                />
              )}
              <span className="text-sm text-muted-foreground">
                {field === "ca_base" ? "" : "base"}
                {breakdown.bonus !== 0 && (
                  <>
                    {" "}
                    <span className="font-mono text-primary">
                      {formatMod(breakdown.bonus)}
                    </span>{" "}
                    de fontes
                  </>
                )}
              </span>
            </div>

            {breakdown.fontes.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {breakdown.fontes.map((fonte) => (
                  <li
                    key={fonte.label}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">
                      {fonte.label}
                      {fonte.regra === "maior" && (
                        <span className="ml-1 text-[0.65rem] text-primary/70">
                          (pega o maior)
                        </span>
                      )}
                    </span>
                    <span className="font-mono">{formatMod(fonte.valor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      {/* Armas avulsas */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-display mr-auto text-base font-semibold">
            Armas fora do inventário
          </h3>
          <Button variant="outline" size="sm" onClick={addWeapon}>
            <Plus className="size-3.5" />
            Arma avulsa
          </Button>
        </div>

        {combat.armas.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Item do inventário marcado como arma já entra sozinho aqui embaixo.
            Use esta lista para armas comuns, que não são itens do cofre.
          </p>
        ) : (
          combat.armas.map((weapon, index) => {
            const problemas = diceProblems(weapon.dados);
            return (
              <div
                key={weapon.id}
                className="rounded-xl border border-border bg-card p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={weapon.nome}
                    onChange={(event) =>
                      setWeapon(index, { nome: event.target.value })
                    }
                    placeholder="Nome da arma"
                    className="w-44"
                    aria-label="Nome da arma"
                  />
                  <Input
                    value={weapon.dados}
                    onChange={(event) =>
                      setWeapon(index, { dados: event.target.value })
                    }
                    placeholder="1d8"
                    className="w-24 font-mono"
                    aria-label="Dano base"
                  />
                  <Input
                    value={weapon.tipo}
                    onChange={(event) =>
                      setWeapon(index, { tipo: event.target.value })
                    }
                    placeholder="cortante"
                    className="w-32"
                    aria-label="Tipo do dano"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remover arma"
                    onClick={() => removeWeapon(weapon.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                {problemas.length > 0 && (
                  <p className="mt-1 text-xs text-destructive">
                    Não entendi: {problemas.join(", ")}
                  </p>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* O resultado, uma coluna por arma */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="text-display text-base font-semibold">
            Dano por arma
          </h3>
          {resumo.bonusMagico && (
            <Badge
              variant="outline"
              className="border-primary/40 text-[0.7rem] text-primary"
            >
              bônus mágico {formatMod(resumo.bonusMagico.valor)} de{" "}
              {resumo.bonusMagico.label}
            </Badge>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {resumo.armas.map((entrada) => (
            <CardDano
              key={entrada.weapon.key}
              entrada={entrada}
              onUsar={() =>
                setCombat((current) => ({
                  ...current,
                  arma_ativa: entrada.weapon.key,
                }))
              }
            />
          ))}
        </div>
      </section>

      {/* O que está valendo, com o texto que você escreveu */}
      {resumo.fontes.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-display text-base font-semibold">
            O que está valendo agora
          </h3>
          {resumo.fontes.map((fonte) => (
            <div
              key={fonte.key}
              className="rounded-xl border border-border bg-card/60 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{fonte.label}</span>
                <Badge variant="secondary" className="text-[0.65rem]">
                  {ORIGEM[fonte.origin]}
                </Badge>
              </div>
              {fonte.descricao && (
                <div
                  className="item-prose mt-1.5"
                  dangerouslySetInnerHTML={{ __html: fonte.descricao }}
                />
              )}
              {fonte.effects.extra && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {fonte.effects.extra}
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function CardDano({
  entrada,
  onUsar,
}: {
  entrada: WeaponDamage;
  onUsar: () => void;
}) {
  const semArma = entrada.weapon.key === "nenhuma";

  return (
    <div
      className={cn(
        "vault-panel rounded-2xl border border-border bg-card p-4",
        entrada.emUso && "border-primary/40",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-display text-base font-semibold">
          {entrada.weapon.nome}
        </h4>
        {entrada.weapon.dados && (
          <Badge variant="secondary" className="font-mono text-[0.7rem]">
            {entrada.weapon.dados} {entrada.weapon.tipo}
          </Badge>
        )}
        {!semArma && (
          <Button
            size="xs"
            variant={entrada.emUso ? "default" : "ghost"}
            className="ml-auto"
            onClick={onUsar}
          >
            {entrada.emUso ? "Em uso" : "Marcar"}
          </Button>
        )}
        {entrada.conversao && (
          <Badge
            variant="outline"
            className="border-violet-500/40 text-[0.65rem] text-violet-300"
          >
            {entrada.conversao.de} vira {entrada.conversao.para}
          </Badge>
        )}
      </div>

      <p className="text-display mt-2 font-mono text-2xl font-semibold text-primary">
        {entrada.expressao}
      </p>

      {entrada.porTipo.length > 1 && (
        <p className="mt-1 text-xs text-muted-foreground">
          {entrada.porTipo
            .map((grupo) => `${grupo.expressao} ${grupo.tipo}`)
            .join("  ·  ")}
        </p>
      )}

      {entrada.parcelas.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Marque um item como arma, ou adicione uma arma avulsa.
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
          {entrada.parcelas.map((parcela) => (
            <li
              key={parcela.key}
              className="flex items-center gap-2 border-t border-border/60 pt-1 text-xs first:border-0 first:pt-0"
            >
              <span className="w-16 shrink-0 font-mono text-primary">
                {parcela.dados}
              </span>
              <span className="w-20 shrink-0 truncate text-muted-foreground">
                {parcela.tipo}
              </span>
              <span className="truncate">{parcela.label}</span>
              <span className="ml-auto shrink-0 text-muted-foreground">
                {ORIGEM[parcela.origin]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {entrada.atributo?.trocadoPor && (
        <p className="mt-2 text-xs text-violet-300">
          {entrada.atributo.trocadoPor} ataca com {entrada.atributo.label}.
        </p>
      )}
    </div>
  );
}
