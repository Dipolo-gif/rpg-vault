"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookMarked,
  ExternalLink,
  Loader2,
  Moon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  alvoDaMagia,
  SpellDetails,
  type AlvoDetalhe,
} from "@/components/character/spell-details";
import { SpellPicker } from "@/components/character/spell-picker";
import { SpellSheet } from "@/components/character/spell-sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, apiJson } from "@/lib/client-api";
import type {
  AbilityRow,
  CharacterStatsRow,
  MagicItemRow,
  SpellRow,
} from "@/lib/database.types";
import {
  collectActiveSources,
  effectiveAttributes,
  formatMod,
} from "@/lib/effects";
import { readSkills } from "@/lib/skills";
import {
  CIRCULOS,
  describeSpell,
  NOME_CIRCULO,
  porCirculo,
  readSpells,
  restantes,
  spellMath,
  type Espaco,
  type SpellsBlock,
} from "@/lib/spells";
import type { SystemDef } from "@/lib/systems";
import { cn } from "@/lib/utils";

/**
 * Aba de magias, no formato da ficha de papel.
 *
 * Cada círculo tem a fileira de espaços em cima e as magias dele embaixo. O
 * gasto fica salvo, então o que você queimou na sessão continua queimado
 * quando voltar. Truque fica no topo e não gasta espaço.
 */
export function SpellTab({
  characterId,
  system,
  stats,
  onStatsChange,
  spells,
  items,
  abilities,
  onSpellSaved,
  onSpellDelete,
}: {
  characterId: string;
  system: SystemDef;
  stats: CharacterStatsRow;
  onStatsChange: (stats: CharacterStatsRow) => void;
  spells: SpellRow[];
  /** Para o atributo entrar na conta já com o que talento e item somam. */
  items: MagicItemRow[];
  abilities: AbilityRow[];
  onSpellSaved: (spell: SpellRow, created: boolean) => void;
  onSpellDelete: (spell: SpellRow) => void;
}) {
  const [magias, setMagias] = useState<SpellsBlock>(() =>
    readSpells(stats.magias),
  );
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState<SpellRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [nivelAlvo, setNivelAlvo] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<SpellRow | null>(null);
  const [detalhe, setDetalhe] = useState<AlvoDetalhe | null>(null);

  const primeiraRenderizacao = useRef(true);
  const fila = useRef<ReturnType<typeof setTimeout> | null>(null);

  const skills = readSkills(stats.skills);
  const grupos = useMemo(() => porCirculo(spells), [spells]);

  // O valor que vale é o mesmo da Ficha: base mais o que talento e item somam.
  const atributos = useMemo(
    () =>
      effectiveAttributes(
        stats.attributes,
        collectActiveSources(items, abilities),
      ),
    [stats.attributes, items, abilities],
  );

  const conta = spellMath({
    block: magias,
    attributes: atributos,
    profBonus: skills.prof_bonus,
    attributeLabel: (key) =>
      system.attributes.find((attr) => attr.key === key)?.label ?? key,
  });

  /**
   * Espaço gasto no meio da luta não espera botão de salvar: grava sozinho,
   * com uma folga para quem clica em três de uma vez.
   */
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    if (fila.current) clearTimeout(fila.current);
    fila.current = setTimeout(async () => {
      setSalvando(true);
      try {
        const payload = await apiFetch<{ stats: CharacterStatsRow }>(
          `/api/characters/${characterId}/stats`,
          apiJson("PUT", { magias }),
        );
        onStatsChange(payload.stats);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Falha ao salvar os espaços",
        );
      } finally {
        setSalvando(false);
      }
    }, 600);

    return () => {
      if (fila.current) clearTimeout(fila.current);
    };
    // onStatsChange muda a cada render do pai, e stats volta desta própria
    // gravação: depender deles aqui criaria laço.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magias, characterId]);

  function mudaEspaco(circulo: number, patch: Partial<Espaco>) {
    setMagias((current) => {
      const atual = current.espacos[circulo] ?? { total: 0, usados: 0 };
      const proximo = { ...atual, ...patch };
      proximo.total = Math.max(0, Math.min(99, proximo.total));
      proximo.usados = Math.max(0, Math.min(proximo.total, proximo.usados));
      return {
        ...current,
        espacos: { ...current.espacos, [circulo]: proximo },
      };
    });
  }

  /** Clicar no espaço n: gasta até ele, ou devolve a partir dele. */
  function alternaEspaco(circulo: number, indice: number) {
    const atual = magias.espacos[circulo] ?? { total: 0, usados: 0 };
    mudaEspaco(circulo, {
      usados: indice < atual.usados ? indice : indice + 1,
    });
  }

  function descansoLongo() {
    setMagias((current) => ({
      ...current,
      espacos: Object.fromEntries(
        Object.entries(current.espacos).map(([circulo, espaco]) => [
          circulo,
          { ...espaco, usados: 0 },
        ]),
      ),
      pontos: { ...current.pontos, usados: 0 },
    }));
    toast.success("Espaços recuperados");
  }

  async function alternaPreparada(spell: SpellRow) {
    try {
      const payload = await apiFetch<{ spell: SpellRow }>(
        `/api/spells/${spell.id}`,
        apiJson("PATCH", { prepared: !spell.prepared }),
      );
      onSpellSaved(payload.spell, false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao preparar");
    }
  }

  function abreNova(nivel: number) {
    setNivelAlvo(nivel);
    setEditando(null);
    setSheetOpen(true);
  }

  function abreGuia(nivel: number) {
    setNivelAlvo(nivel);
    setPickerOpen(true);
  }

  /**
   * Mostra os círculos que já têm espaço ou magia, mais o próximo, para você
   * sempre ter onde montar o seguinte sem a página virar nove seções vazias.
   */
  const comConteudo = CIRCULOS.filter(
    (circulo) =>
      (magias.espacos[circulo]?.total ?? 0) > 0 ||
      (grupos.get(circulo)?.length ?? 0) > 0,
  );
  const ateOCirculo = Math.min(9, Math.max(1, ...comConteudo) + 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mr-auto">
          <h2 className="text-display flex items-center gap-2 text-lg font-semibold">
            Magias
            <span className="text-sm font-normal text-muted-foreground">
              {spells.length}
            </span>
            {salvando && (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            )}
          </h2>
          <p className="mt-0.5 max-w-lg text-sm text-muted-foreground">
            Os espaços gastos ficam salvos, do mesmo jeito que na ficha de
            papel. O que você queimar hoje continua queimado amanhã, até o
            descanso.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={descansoLongo}>
            <Moon />
            Descanso longo
          </Button>
          <Button variant="outline" onClick={() => abreGuia(0)}>
            <BookMarked />
            Do guia
          </Button>
          <Button onClick={() => abreNova(0)}>
            <Plus />
            Nova magia
          </Button>
        </div>
      </div>

      {/* Atributo, CD e acerto */}
      <section className="grid gap-3 rounded-2xl border border-border bg-card/40 p-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-3">
          <span className="text-[0.65rem] tracking-widest text-muted-foreground uppercase">
            Atributo de conjuração
          </span>
          <div className="flex flex-wrap gap-1">
            {system.attributes.map((attribute) => (
              <Button
                key={attribute.key}
                type="button"
                size="xs"
                variant="outline"
                onClick={() =>
                  setMagias((current) => ({
                    ...current,
                    atributo:
                      current.atributo === attribute.key ? "" : attribute.key,
                  }))
                }
                className={cn(
                  magias.atributo === attribute.key &&
                    "border-primary/50 bg-primary/10 text-primary",
                )}
              >
                {attribute.short}
              </Button>
            ))}
          </div>
        </div>

        {conta ? (
          <>
            <Card titulo="CD de magia" valor={String(conta.cd)}>
              8 + {skills.prof_bonus} de proficiência {formatMod(conta.mod)} de{" "}
              {conta.label}
            </Card>
            <Card titulo="Acerto com magia" valor={formatMod(conta.acerto)}>
              {skills.prof_bonus} de proficiência {formatMod(conta.mod)} de{" "}
              {conta.label}
            </Card>
            <Card titulo="Modificador" valor={formatMod(conta.mod)}>
              {conta.label}
            </Card>
          </>
        ) : (
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Escolha o atributo acima para a CD e o acerto saírem sozinhos.
          </p>
        )}
      </section>

      {/* Truques */}
      <Secao
        titulo={NOME_CIRCULO[0]}
        nota="não gastam espaço"
        onGuia={() => abreGuia(0)}
        onNova={() => abreNova(0)}
      >
        <Lista
          spells={grupos.get(0) ?? []}
          onEdit={(spell) => {
            setEditando(spell);
            setSheetOpen(true);
          }}
          onDelete={setPendingDelete}
          onPrepare={alternaPreparada}
          onDetalhe={(spell) => setDetalhe(alvoDaMagia(spell))}
          mostraPreparada={false}
        />
      </Secao>

      {/* Um bloco por círculo, como na ficha */}
      {CIRCULOS.map((circulo) => {
        if (circulo > ateOCirculo) return null;

        const espaco = magias.espacos[circulo] ?? { total: 0, usados: 0 };
        const lista = grupos.get(circulo) ?? [];

        return (
          <Secao
            key={circulo}
            titulo={NOME_CIRCULO[circulo]}
            nota={
              espaco.total > 0
                ? `${restantes(espaco)} de ${espaco.total} espaços`
                : "sem espaços"
            }
            onGuia={() => abreGuia(circulo)}
            onNova={() => abreNova(circulo)}
            extra={
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: espaco.total }, (_, indice) => {
                    const gasto = indice < espaco.usados;
                    return (
                      <button
                        key={indice}
                        type="button"
                        onClick={() => alternaEspaco(circulo, indice)}
                        title={gasto ? "Gasto, clique para devolver" : "Livre"}
                        aria-label={`Espaço ${indice + 1} do ${NOME_CIRCULO[circulo]}`}
                        className={cn(
                          "size-5 rounded-full border transition-colors",
                          gasto
                            ? "border-primary/60 bg-primary/70"
                            : "border-border bg-background hover:border-primary/50",
                        )}
                      />
                    );
                  })}
                </div>

                <Input
                  type="number"
                  min={0}
                  max={99}
                  value={espaco.total}
                  onChange={(event) =>
                    mudaEspaco(circulo, {
                      total: Number(event.target.value) || 0,
                    })
                  }
                  className="h-7 w-14 text-center font-mono text-xs"
                  aria-label={`Total de espaços do ${NOME_CIRCULO[circulo]}`}
                />
              </div>
            }
          >
            <Lista
              spells={lista}
              onEdit={(spell) => {
                setEditando(spell);
                setSheetOpen(true);
              }}
              onDelete={setPendingDelete}
              onPrepare={alternaPreparada}
              onDetalhe={(spell) => setDetalhe(alvoDaMagia(spell))}
              mostraPreparada
            />
          </Secao>
        );
      })}

      <SpellDetails
        alvo={detalhe}
        onOpenChange={(open) => {
          if (!open) setDetalhe(null);
        }}
        onSaved={(spell) => {
          onSpellSaved(spell, false);
          setDetalhe(alvoDaMagia(spell));
        }}
      />

      <SpellSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        characterId={characterId}
        spell={editando}
        nivelInicial={nivelAlvo}
        onSaved={onSpellSaved}
      />

      <SpellPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        characterId={characterId}
        nivelInicial={nivelAlvo}
        jaTenho={spells.flatMap((spell) =>
          spell.catalog_slug ? [spell.catalog_slug, spell.name] : [spell.name],
        )}
        onAdded={(spell) => onSpellSaved(spell, true)}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Ela sai da lista deste personagem. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) onSpellDelete(pendingDelete);
                setPendingDelete(null);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}



function Card({
  titulo,
  valor,
  children,
}: {
  titulo: string;
  valor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <span className="text-[0.65rem] tracking-widest text-muted-foreground uppercase">
        {titulo}
      </span>
      <span className="text-display mt-1 block text-2xl font-semibold text-primary">
        {valor}
      </span>
      <span className="text-[0.7rem] text-muted-foreground">{children}</span>
    </div>
  );
}

function Secao({
  titulo,
  nota,
  extra,
  onGuia,
  onNova,
  children,
}: {
  titulo: string;
  nota: string;
  extra?: React.ReactNode;
  onGuia: () => void;
  onNova: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <h3 className="text-display text-base font-semibold">{titulo}</h3>
        <span className="font-mono text-[0.7rem] text-muted-foreground">
          {nota}
        </span>
        {extra}
        <div className="ml-auto flex gap-1">
          <Button size="xs" variant="ghost" onClick={onGuia}>
            <BookMarked className="size-3" />
            Do guia
          </Button>
          <Button size="xs" variant="ghost" onClick={onNova}>
            <Plus className="size-3" />
            Nova
          </Button>
        </div>
      </div>
      {children}
    </section>
  );
}

function Lista({
  spells,
  onEdit,
  onDelete,
  onPrepare,
  onDetalhe,
  mostraPreparada,
}: {
  spells: SpellRow[];
  onEdit: (spell: SpellRow) => void;
  onDelete: (spell: SpellRow) => void;
  onPrepare: (spell: SpellRow) => void;
  onDetalhe: (spell: SpellRow) => void;
  mostraPreparada: boolean;
}) {
  if (spells.length === 0) {
    return (
      <p className="py-1 text-xs text-muted-foreground">
        Nenhuma magia aqui ainda.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {spells.map((spell, index) => (
        <div
          key={spell.id}
          className={cn(
            "flex flex-wrap items-center gap-2 px-3 py-2",
            index % 2 === 1 && "bg-card/40",
          )}
        >
          {mostraPreparada && (
            <button
              type="button"
              onClick={() => onPrepare(spell)}
              title={
                spell.always_prepared
                  ? "Sempre preparada"
                  : spell.prepared
                    ? "Preparada hoje"
                    : "Não preparada"
              }
              disabled={spell.always_prepared}
              aria-label={`Preparar ${spell.name}`}
              className={cn(
                "size-3.5 shrink-0 rotate-45 border transition-colors",
                spell.always_prepared
                  ? "border-primary/60 bg-primary/40"
                  : spell.prepared
                    ? "border-primary/60 bg-primary/70"
                    : "border-border bg-background hover:border-primary/50",
              )}
            />
          )}

          <button
            type="button"
            onClick={() => onDetalhe(spell)}
            title="Ver o texto completo"
            className={cn(
              "text-display cursor-pointer text-left text-sm font-semibold underline-offset-4 hover:underline",
              mostraPreparada &&
                !spell.prepared &&
                !spell.always_prepared &&
                "text-muted-foreground",
            )}
          >
            {spell.name}
          </button>

          {spell.concentration && (
            <Badge variant="secondary" className="text-[0.6rem]">
              conc.
            </Badge>
          )}
          {spell.ritual && (
            <Badge variant="secondary" className="text-[0.6rem]">
              ritual
            </Badge>
          )}
          {spell.always_prepared && (
            <Badge variant="outline" className="text-[0.6rem]">
              sempre
            </Badge>
          )}

          <span className="w-full text-[0.7rem] text-muted-foreground sm:w-auto">
            {describeSpell(spell).join(" · ")}
          </span>

          <div className="ml-auto flex items-center gap-0.5">
            {spell.reference_url && (
              <Button
                size="icon-sm"
                variant="ghost"
                nativeButton={false}
                render={
                  <a
                    href={spell.reference_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`Abrir ${spell.name} no guia`}
                  />
                }
              >
                <ExternalLink className="size-3.5" />
              </Button>
            )}
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Editar ${spell.name}`}
              onClick={() => onEdit(spell)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Remover ${spell.name}`}
              onClick={() => onDelete(spell)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
