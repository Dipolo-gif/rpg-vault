"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Save, ScrollText, Trash2 } from "lucide-react";
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
import {
  attributeMod,
  collectActiveSources,
  formatMod,
  readCombat,
  type CombatBlock,
} from "@/lib/effects";
import {
  computeSaves,
  computeSkills,
  labelMultiplos,
  nextSkillState,
  readSkills,
  SKILL_STATE_LABEL,
  type SkillsBlock,
  type SkillState,
} from "@/lib/skills";
import {
  readCustom,
  slugify,
  type CustomFields,
  type SkillDef,
  type SystemDef,
} from "@/lib/systems";
import { mergeVitalDefs, readVital, vitalPercent } from "@/lib/vitals";
import { cn } from "@/lib/utils";

const CORES: Record<SkillState, string> = {
  none: "border-border text-muted-foreground",
  proficiente: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  especialista: "border-primary/50 bg-primary/10 text-primary",
};

const PONTO: Record<SkillState, string> = {
  none: "bg-transparent ring-1 ring-border",
  proficiente: "bg-emerald-400",
  especialista: "bg-primary",
};

/**
 * A ficha inteira: atributos, proficiência, CA, medidores, testes de
 * resistência e perícias. É aqui que você preenche, e as outras abas leem.
 */
export function SheetTab({
  characterId,
  system,
  stats,
  onStatsChange,
  items,
  abilities,
}: {
  characterId: string;
  system: SystemDef & { skills: SkillDef[] };
  stats: CharacterStatsRow;
  onStatsChange: (stats: CharacterStatsRow) => void;
  items: MagicItemWithUrl[];
  abilities: AbilityRow[];
}) {
  const [combat, setCombat] = useState<CombatBlock>(() =>
    readCombat(stats.combat),
  );
  const [attributes, setAttributes] = useState(stats.attributes ?? {});
  const [vitals, setVitals] = useState(stats.vitals ?? {});
  const [skills, setSkills] = useState<SkillsBlock>(() =>
    readSkills(stats.skills),
  );
  const [custom, setCustom] = useState<CustomFields>(() =>
    readCustom(stats.custom),
  );
  const [novoAtributo, setNovoAtributo] = useState("");
  const [novaPericia, setNovaPericia] = useState({ label: "", attribute: "" });
  const [saving, setSaving] = useState(false);

  const dirty =
    JSON.stringify(combat) !== JSON.stringify(readCombat(stats.combat)) ||
    JSON.stringify(attributes) !== JSON.stringify(stats.attributes ?? {}) ||
    JSON.stringify(vitals) !== JSON.stringify(stats.vitals ?? {}) ||
    JSON.stringify(skills) !== JSON.stringify(readSkills(stats.skills)) ||
    JSON.stringify(custom) !== JSON.stringify(readCustom(stats.custom));

  const sources = useMemo(
    () => collectActiveSources(items, abilities),
    [items, abilities],
  );

  const linhas = useMemo(
    () =>
      computeSkills({
        system,
        skills,
        attributes,
        sources,
        lista: system.skills,
      }),
    [system, skills, attributes, sources],
  );

  const saves = useMemo(
    () => computeSaves({ system, skills, attributes, sources }),
    [system, skills, attributes, sources],
  );

  const vitalDefs = mergeVitalDefs(system, vitals);

  async function save() {
    setSaving(true);
    try {
      const payload = await apiFetch<{ stats: CharacterStatsRow }>(
        `/api/characters/${characterId}/stats`,
        apiJson("PUT", { combat, attributes, vitals, skills, custom }),
      );
      onStatsChange(payload.stats);
      toast.success("Ficha salva");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function cyclePericia(key: string) {
    setSkills((current) => {
      const proximo = nextSkillState(current.estados[key] ?? "none");
      const estados = { ...current.estados };
      if (proximo === "none") delete estados[key];
      else estados[key] = proximo;
      return { ...current, estados };
    });
  }

  function cycleSave(key: string) {
    setSkills((current) => {
      const proximo = nextSkillState(current.saves[key] ?? "none");
      const saves = { ...current.saves };
      if (proximo === "none") delete saves[key];
      else saves[key] = proximo;
      return { ...current, saves };
    });
  }

  function setVital(key: string, campo: "current" | "max", raw: string) {
    const parsed = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(parsed)) return;
    setVitals((current) => {
      const atual = current[key] ?? { current: 0, max: null };
      return { ...current, [key]: { ...atual, [campo]: parsed } };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ScrollText className="size-4 text-primary" />
        <h2 className="text-display mr-auto text-lg font-semibold">Ficha</h2>
        <Button onClick={save} disabled={saving || !dirty} size="sm">
          {saving ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          Salvar ficha
        </Button>
      </div>

      {/* Números do topo da ficha */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["ca_base", "Classe de armadura", "CA"],
            ["iniciativa_base", "Iniciativa", "INI"],
          ] as const
        ).map(([campo, label, curto]) => (
          <div
            key={campo}
            className="vault-panel rounded-2xl border border-border bg-card p-3 text-center"
          >
            <Label
              htmlFor={`ficha-${campo}`}
              className="justify-center text-[0.65rem] tracking-widest text-muted-foreground uppercase"
            >
              {curto}
            </Label>
            <Input
              id={`ficha-${campo}`}
              type="number"
              value={combat[campo]}
              onChange={(event) =>
                setCombat((current) => ({
                  ...current,
                  [campo]: Number(event.target.value) || 0,
                }))
              }
              className="mt-1 h-10 border-0 bg-transparent text-center font-mono !text-2xl shadow-none focus-visible:ring-0"
            />
            <p className="text-[0.7rem] text-muted-foreground">{label}</p>
          </div>
        ))}

        <div className="vault-panel rounded-2xl border border-border bg-card p-3 text-center">
          <Label
            htmlFor="ficha-prof"
            className="justify-center text-[0.65rem] tracking-widest text-muted-foreground uppercase"
          >
            Prof
          </Label>
          <Input
            id="ficha-prof"
            type="number"
            value={skills.prof_bonus}
            onChange={(event) =>
              setSkills((current) => ({
                ...current,
                prof_bonus: Number(event.target.value) || 0,
              }))
            }
            className="mt-1 h-10 border-0 bg-transparent text-center font-mono !text-2xl shadow-none focus-visible:ring-0"
          />
          <p className="text-[0.7rem] text-muted-foreground">Proficiência</p>
        </div>

        <div className="vault-panel rounded-2xl border border-border bg-card p-3 text-center">
          <Label
            htmlFor="ficha-desloc"
            className="justify-center text-[0.65rem] tracking-widest text-muted-foreground uppercase"
          >
            Desloc
          </Label>
          <Input
            id="ficha-desloc"
            value={combat.deslocamento}
            onChange={(event) =>
              setCombat((current) => ({
                ...current,
                deslocamento: event.target.value,
              }))
            }
            placeholder="9 m"
            className="mt-1 h-10 border-0 bg-transparent text-center font-mono !text-xl shadow-none focus-visible:ring-0"
          />
          <p className="text-[0.7rem] text-muted-foreground">Deslocamento</p>
        </div>
      </section>

      {/* Atributos */}
      <section>
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <h3 className="text-display text-base font-semibold">Atributos</h3>
          <p className="text-xs text-muted-foreground">
            digite o valor, o modificador sai sozinho. Talento que dá +1 já
            entra na conta.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {system.attributes.map((attribute) => {
            const escolhido = combat.atributo_ataque === attribute.key;
            const bruto = Number(attributes[attribute.key] ?? 0);
            const ganho = sources.reduce(
              (total, fonte) =>
                total + (fonte.effects.atributos?.[attribute.key] ?? 0),
              0,
            );
            const mod = attributeMod(bruto + ganho);

            return (
              <div
                key={attribute.key}
                className={cn(
                  "vault-panel rounded-xl border border-border bg-card p-2 text-center transition-colors",
                  escolhido && "border-primary/60 bg-primary/10",
                )}
              >
                <span className="block text-[0.65rem] tracking-widest text-muted-foreground uppercase">
                  {attribute.short}
                </span>
                {/* O ganho de talento entra no próprio valor, então o número
                    grande já é o total. O campo menor é o valor base. */}
                <span
                  className={cn(
                    "text-display mt-1 block text-2xl font-semibold",
                    ganho !== 0 ? "text-emerald-300" : "text-foreground",
                  )}
                  title={
                    ganho !== 0
                      ? `${bruto} de base ${formatMod(ganho)} de talento`
                      : undefined
                  }
                >
                  {bruto + ganho}
                </span>
                <span className="text-display block text-lg font-semibold text-primary">
                  {formatMod(mod)}
                </span>
                <Input
                  type="number"
                  value={attributes[attribute.key] ?? ""}
                  onChange={(event) =>
                    setAttributes((current) => ({
                      ...current,
                      [attribute.key]:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    }))
                  }
                  className="mt-1 h-7 text-center font-mono text-xs"
                  placeholder="base"
                  aria-label={`${attribute.label} base`}
                />
                {ganho !== 0 && (
                  <span className="block text-[0.6rem] text-emerald-300">
                    {formatMod(ganho)} de talento
                  </span>
                )}
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  className="mt-1 h-5 w-full text-[0.6rem]"
                  onClick={() =>
                    setCombat((current) => ({
                      ...current,
                      atributo_ataque: escolhido ? "" : attribute.key,
                    }))
                  }
                >
                  {escolhido ? "ataque" : "usar"}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Medidores */}
      <section>
        <h3 className="text-display mb-2 text-base font-semibold">Medidores</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {vitalDefs.map((def) => {
            const valor = readVital(vitals, def);
            return (
              <div
                key={def.key}
                className="rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="mr-auto text-sm">{def.label}</span>
                  <Input
                    type="number"
                    value={valor.current}
                    onChange={(event) =>
                      setVital(def.key, "current", event.target.value)
                    }
                    className="h-7 w-16 text-center font-mono text-sm"
                    aria-label={`${def.label} atual`}
                  />
                  {def.hasMax && (
                    <>
                      <span className="text-muted-foreground">/</span>
                      <Input
                        type="number"
                        value={valor.max ?? 0}
                        onChange={(event) =>
                          setVital(def.key, "max", event.target.value)
                        }
                        className="h-7 w-16 text-center font-mono text-sm"
                        aria-label={`${def.label} máximo`}
                      />
                    </>
                  )}
                </div>
                {def.hasMax && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full", def.bar)}
                      style={{ width: `${vitalPercent(valor)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Testes de resistência */}
      <section>
        <h3 className="text-display mb-2 text-base font-semibold">
          Testes de resistência
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {saves.map((save) => (
            <button
              key={save.key}
              type="button"
              onClick={() => cycleSave(save.key)}
              title={labelMultiplos(save.multiplos)}
              className={cn(
                "rounded-xl border bg-card p-2 text-center transition-colors",
                CORES[save.state],
              )}
            >
              <span className="flex items-center justify-center gap-1.5 text-[0.65rem] tracking-widest uppercase">
                <span
                  className={cn(
                    "inline-block size-1.5 rounded-full",
                    PONTO[save.state],
                  )}
                />
                {save.short}
              </span>
              <span className="text-display block text-lg font-semibold text-primary">
                {formatMod(save.total)}
              </span>
              {save.concedidoPor.length > 0 && (
                <span
                  className="block truncate text-[0.6rem] text-emerald-300"
                  title={save.concedidoPor
                    .map(
                      (fonte) =>
                        `${fonte.por} ${formatMod(fonte.soma * skills.prof_bonus)}`,
                    )
                    .join(", ")}
                >
                  {save.concedidoPor[0].por}
                  {save.concedidoPor.length > 1 &&
                    ` +${save.concedidoPor.length - 1}`}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Perícias */}
      <section>
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <h3 className="text-display text-base font-semibold">Perícias</h3>
          <p className="text-xs text-muted-foreground">
            clique para alternar entre nada, proficiente e dobrada. Cada fonte
            que dá a perícia soma mais um bônus de proficiência, então talento,
            classe e item empilham em cima da sua marca.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          {linhas.map((linha, index) => (
            <div
              key={linha.def.key}
              className={cn(
                "flex flex-wrap items-center gap-2 px-3 py-1.5",
                index % 2 === 1 && "bg-card/40",
                linha.state !== "none" && "bg-primary/5",
              )}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cyclePericia(linha.def.key)}
                title={`Sua marca: ${SKILL_STATE_LABEL[linha.manual].toLowerCase()}. Valendo: ${labelMultiplos(linha.multiplos).toLowerCase()}`}
                className={cn("min-w-44 justify-start", CORES[linha.state])}
              >
                <span
                  className={cn(
                    "mr-1.5 inline-block size-2 rounded-full",
                    PONTO[linha.state],
                  )}
                />
                {linha.def.label}
              </Button>

              <Badge variant="secondary" className="text-[0.65rem]">
                {linha.attributeShort}
              </Badge>

              <span className="w-10 text-center font-mono text-xs text-muted-foreground">
                {formatMod(linha.mod)}
              </span>

              {linha.prof !== 0 && (
                <span
                  className="font-mono text-xs text-emerald-300"
                  title={labelMultiplos(linha.multiplos)}
                >
                  {formatMod(linha.prof)}
                  {linha.multiplos > 1 && ` (×${linha.multiplos})`}
                </span>
              )}

              {linha.concedidoPor.map((fonte) => (
                <span
                  key={fonte.por}
                  className="text-[0.65rem] text-emerald-300"
                  title={`${fonte.por} soma ${fonte.soma === 1 ? "uma proficiência" : `${fonte.soma} proficiências`}`}
                >
                  {fonte.por}{" "}
                  <span className="font-mono">
                    {formatMod(fonte.soma * skills.prof_bonus)}
                  </span>
                </span>
              ))}

              <Input
                type="number"
                value={skills.extras[linha.def.key] ?? ""}
                onChange={(event) => {
                  const raw = event.target.value;
                  setSkills((current) => {
                    const extras = { ...current.extras };
                    const parsed = Number(raw);
                    if (raw === "" || !Number.isFinite(parsed) || parsed === 0) {
                      delete extras[linha.def.key];
                    } else {
                      extras[linha.def.key] = parsed;
                    }
                    return { ...current, extras };
                  });
                }}
                placeholder="0"
                className="ml-auto h-7 w-14 text-center font-mono text-xs"
                aria-label={`Ajuste em ${linha.def.label}`}
              />

              <span className="text-display w-12 text-right text-lg font-semibold text-primary">
                {formatMod(linha.total)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Campos próprios da mesa */}
      <section className="grid gap-3 rounded-2xl border border-dashed border-border p-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div>
            <h3 className="text-display text-sm font-semibold">
              Atributo próprio
            </h3>
            <p className="text-xs text-muted-foreground">
              Para o que a sua mesa criou, como Sanidade.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {custom.attributes.map((atributo) => (
              <span
                key={atributo.key}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1 text-xs"
              >
                {atributo.label}
                <button
                  type="button"
                  aria-label={`Remover ${atributo.label}`}
                  onClick={() =>
                    setCustom((current) => ({
                      ...current,
                      attributes: current.attributes.filter(
                        (a) => a.key !== atributo.key,
                      ),
                    }))
                  }
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={novoAtributo}
              onChange={(event) => setNovoAtributo(event.target.value)}
              placeholder="Ex: Sanidade"
              className="w-40"
              aria-label="Nome do atributo"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!novoAtributo.trim()}
              onClick={() => {
                const key = slugify(novoAtributo);
                if (!key) return;
                if (system.attributes.some((a) => a.key === key)) {
                  toast.error("Já existe um atributo com esse nome");
                  return;
                }
                setCustom((current) => ({
                  ...current,
                  attributes: [
                    ...current.attributes,
                    {
                      key,
                      label: novoAtributo.trim(),
                      short: novoAtributo.trim().slice(0, 3).toUpperCase(),
                    },
                  ],
                }));
                setNovoAtributo("");
              }}
            >
              <Plus className="size-3.5" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <h3 className="text-display text-sm font-semibold">
              Perícia própria
            </h3>
            <p className="text-xs text-muted-foreground">
              Entra na lista acima e aceita proficiência de talento.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {custom.skills.map((pericia) => (
              <span
                key={pericia.key}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1 text-xs"
              >
                {pericia.label}
                <Badge variant="secondary" className="text-[0.6rem]">
                  {system.attributes.find((a) => a.key === pericia.attribute)
                    ?.short ?? pericia.attribute}
                </Badge>
                <button
                  type="button"
                  aria-label={`Remover ${pericia.label}`}
                  onClick={() =>
                    setCustom((current) => ({
                      ...current,
                      skills: current.skills.filter(
                        (s) => s.key !== pericia.key,
                      ),
                    }))
                  }
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={novaPericia.label}
              onChange={(event) =>
                setNovaPericia((current) => ({
                  ...current,
                  label: event.target.value,
                }))
              }
              placeholder="Ex: Ciências"
              className="w-40"
              aria-label="Nome da perícia"
            />
            <div className="flex flex-wrap gap-1">
              {system.attributes.map((attribute) => (
                <Button
                  key={attribute.key}
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    setNovaPericia((current) => ({
                      ...current,
                      attribute: attribute.key,
                    }))
                  }
                  className={cn(
                    novaPericia.attribute === attribute.key &&
                      "border-primary/50 bg-primary/10 text-primary",
                  )}
                >
                  {attribute.short}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!novaPericia.label.trim() || !novaPericia.attribute}
              onClick={() => {
                const key = slugify(novaPericia.label);
                if (!key) return;
                if (system.skills.some((s) => s.key === key)) {
                  toast.error("Já existe uma perícia com esse nome");
                  return;
                }
                setCustom((current) => ({
                  ...current,
                  skills: [
                    ...current.skills,
                    {
                      key,
                      label: novaPericia.label.trim(),
                      attribute: novaPericia.attribute,
                    },
                  ],
                }));
                setNovaPericia({ label: "", attribute: "" });
              }}
            >
              <Plus className="size-3.5" />
              Adicionar
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
