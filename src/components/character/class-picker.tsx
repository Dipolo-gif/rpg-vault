"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  GraduationCap,
  Loader2,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiFetch, apiJson } from "@/lib/client-api";
import { CLASSES, type ClasseCatalogo, type ClasseFeature } from "@/lib/classes";
import type { AbilityRow } from "@/lib/database.types";
import { describeEffects, readEffects, type Effects } from "@/lib/effects";
import { ENGENHOCAS, TIERS, type Engenhoca } from "@/lib/gadgets";
import { getSkills, type SkillDef, type SystemDef } from "@/lib/systems";
import { cn } from "@/lib/utils";

/**
 * Guia das classes padrão. Escolhe a classe, vê as habilidades por nível e
 * adiciona as que o personagem já tem. O que dá para calcular entra ligado.
 *
 * Habilidade que manda escolher perícias (a Especialização do Ladino, as
 * perícias iniciais da classe) traz a escolha aqui dentro: as perícias marcadas
 * viram efeito da própria habilidade, então cada uma dobra as suas e a ficha
 * soma sozinha.
 */
export function ClassPicker({
  open,
  onOpenChange,
  characterId,
  system,
  existentes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  system: SystemDef & { skills?: SkillDef[] };
  /** Habilidades de classe que o personagem já tem. */
  existentes: AbilityRow[];
  onSaved: (ability: AbilityRow, created: boolean) => void;
}) {
  const [classe, setClasse] = useState<ClasseCatalogo | null>(null);
  /** A classe pode ter uma lista à parte, como as engenhocas do engenheiro. */
  const [vendo, setVendo] = useState<"habilidades" | "engenhocas">(
    "habilidades",
  );
  const [nivel, setNivel] = useState(20);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [emLote, setEmLote] = useState(false);
  /** O que você marcou agora. Vale por cima da habilidade até ela responder. */
  const [rascunho, setRascunho] = useState<Record<string, string[]>>({});
  /** Quantas gravações estão no ar por habilidade, para mostrar o giro. */
  const [gravando, setGravando] = useState<Record<string, number>>({});
  /**
   * Uma fila só: dois cliques seguidos precisam chegar no banco na ordem em
   * que você clicou, senão o primeiro apaga o segundo.
   */
  const fila = useRef<Promise<void>>(Promise.resolve());

  const pericias = system.skills ?? getSkills(system.id);
  const porNome = new Map(
    existentes.map((ability) => [ability.name.toLowerCase(), ability]),
  );

  function nomeCompleto(feature: ClasseFeature, atual: ClasseCatalogo) {
    return `${atual.nome} ${feature.nivel}: ${feature.nome}`;
  }

  /** A habilidade já criada a partir desta entrada do guia, se existir. */
  function jaCriada(feature: ClasseFeature, atual: ClasseCatalogo) {
    return porNome.get(nomeCompleto(feature, atual).toLowerCase()) ?? null;
  }

  /** Perícias que a habilidade oferece para escolher. */
  function candidatas(feature: ClasseFeature): SkillDef[] {
    const escolhas = feature.escolhas;
    if (!escolhas) return pericias;
    if (escolhas.atributo) {
      return pericias.filter(
        (pericia) => pericia.attribute === escolhas.atributo,
      );
    }
    if (escolhas.entre.length === 0) return pericias;
    return pericias.filter((pericia) => escolhas.entre.includes(pericia.key));
  }

  /**
   * O que está marcado agora: o que você acabou de clicar, ou o que já está
   * gravado na habilidade.
   */
  function marcadas(feature: ClasseFeature, atual: ClasseCatalogo): string[] {
    const meu = rascunho[feature.key];
    if (meu) return meu;

    const criada = jaCriada(feature, atual);
    if (!criada) return [];

    const doGuia = Object.keys(feature.effects.pericias ?? {});
    return Object.keys(readEffects(criada.effects).pericias ?? {}).filter(
      (key) => !doGuia.includes(key),
    );
  }

  /** Junta as perícias escolhidas nos efeitos, sem perder o resto. */
  function comPericias(
    base: Effects,
    feature: ClasseFeature,
    escolhidas: string[],
  ): Effects {
    const grau = feature.escolhas?.grau ?? "proficiente";
    const daLista = new Set(candidatas(feature).map((pericia) => pericia.key));

    // O que você marcou na mão fora da lista da classe continua valendo.
    const preservadas = Object.entries(base.pericias ?? {}).filter(
      ([key]) => !daLista.has(key),
    );

    const pericias = Object.fromEntries([
      ...preservadas,
      ...escolhidas.map((key) => [key, grau] as const),
    ]);

    return {
      ...base,
      pericias: Object.keys(pericias).length > 0 ? pericias : undefined,
    };
  }

  function alterna(feature: ClasseFeature, atual: ClasseCatalogo, key: string) {
    const atuais = marcadas(feature, atual);
    const proximas = atuais.includes(key)
      ? atuais.filter((outra) => outra !== key)
      : [...atuais, key];

    // A marca aparece na hora: quem clica duas vezes rápido não perde a
    // primeira só porque a resposta do banco ainda não voltou.
    setRascunho((current) => ({ ...current, [feature.key]: proximas }));

    const criada = jaCriada(feature, atual);
    if (!criada) return;

    // Já adicionada: grava direto na habilidade, que é quem concede.
    const efeitos = comPericias(
      readEffects(criada.effects),
      feature,
      proximas,
    );
    setGravando((current) => ({
      ...current,
      [feature.key]: (current[feature.key] ?? 0) + 1,
    }));

    fila.current = fila.current.then(async () => {
      try {
        const payload = await apiFetch<{ ability: AbilityRow }>(
          `/api/abilities/${criada.id}`,
          apiJson("PATCH", { effects: efeitos }),
        );
        onSaved(payload.ability, false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao salvar");
        setRascunho((current) => ({ ...current, [feature.key]: atuais }));
      } finally {
        setGravando((current) => ({
          ...current,
          [feature.key]: Math.max(0, (current[feature.key] ?? 1) - 1),
        }));
      }
    });
  }

  async function adicionar(feature: ClasseFeature, atual: ClasseCatalogo) {
    const nome = nomeCompleto(feature, atual);
    const escolhidas = rascunho[feature.key] ?? [];
    const effects =
      feature.escolhas && escolhidas.length > 0
        ? comPericias(feature.effects, feature, escolhidas)
        : feature.effects;

    setSalvando(feature.key);
    try {
      const payload = await apiFetch<{ ability: AbilityRow }>(
        `/api/characters/${characterId}/abilities`,
        apiJson("POST", {
          source: "classe",
          kind: feature.kind,
          name: nome,
          action_type: feature.kind === "active" ? "Ação" : "Passiva",
          effects,
          description_html: `<p>${feature.texto}</p>`,
          description_text: feature.texto,
        }),
      );
      onSaved(payload.ability, true);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao adicionar");
      return false;
    } finally {
      setSalvando(null);
    }
  }

  function nomeDaEngenhoca(gadget: Engenhoca) {
    return `Engenhoca: ${gadget.nome}`;
  }

  async function adicionarEngenhoca(gadget: Engenhoca) {
    setSalvando(gadget.key);
    try {
      const payload = await apiFetch<{ ability: AbilityRow }>(
        `/api/characters/${characterId}/abilities`,
        apiJson("POST", {
          source: "classe",
          kind: gadget.kind,
          name: nomeDaEngenhoca(gadget),
          action_type: gadget.kind === "active" ? "Ação" : "Passiva",
          effects: gadget.effects,
          description_html: `<p>${gadget.texto}</p>`,
          description_text: gadget.texto,
        }),
      );
      onSaved(payload.ability, true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao adicionar");
    } finally {
      setSalvando(null);
    }
  }

  async function adicionarTudo(atual: ClasseCatalogo) {
    const faltando = atual.features.filter(
      (feature) => feature.nivel <= nivel && !jaCriada(feature, atual),
    );
    if (faltando.length === 0) {
      toast.info("Você já tem todas até esse nível");
      return;
    }

    setEmLote(true);
    let ok = 0;
    for (const feature of faltando) {
      if (await adicionar(feature, atual)) ok += 1;
    }
    setEmLote(false);
    toast.success(`${ok} habilidades adicionadas`);
  }

  function fechar(aberto: boolean) {
    if (!aberto) {
      setClasse(null);
      setVendo("habilidades");
      // Ao reabrir, o que vale é o que está gravado nas habilidades.
      setRascunho({});
    }
    onOpenChange(aberto);
  }

  function voltar() {
    if (vendo === "engenhocas") setVendo("habilidades");
    else setClasse(null);
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-display flex items-center gap-2">
            {classe && (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Voltar para a lista"
                onClick={voltar}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            {vendo === "engenhocas" ? (
              <Wrench className="size-4 text-primary" />
            ) : (
              <GraduationCap className="size-4 text-primary" />
            )}
            {vendo === "engenhocas"
              ? "Engenhocas"
              : classe
                ? classe.nome
                : "Guia das classes"}
          </DialogTitle>
          <DialogDescription>
            {vendo === "engenhocas"
              ? "Você tem 3 no nível 1, e mais 3 a cada tier que liberar. Enquanto estiverem com você, estão valendo."
              : classe
                ? `Dado de vida ${classe.dadoDeVida}. Resistências de ${classe.saves.map((s) => system.attributes.find((a) => a.key === s)?.label ?? s).join(" e ")}.`
                : "Escolha a classe para ver as habilidades por nível."}
          </DialogDescription>
        </DialogHeader>

        {!classe ? (
          <div className="grid flex-1 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {CLASSES.map((entrada) => (
              <button
                key={entrada.key}
                type="button"
                onClick={() => setClasse(entrada)}
                className="rounded-xl border border-border bg-card/60 p-3 text-left transition-colors hover:border-primary/40"
              >
                <span className="text-display block text-sm font-semibold">
                  {entrada.nome}
                </span>
                <span className="mt-1 block text-[0.7rem] text-muted-foreground">
                  {entrada.dadoDeVida} · {entrada.features.length} habilidades
                </span>
              </button>
            ))}
          </div>
        ) : vendo === "engenhocas" ? (
          <div className="-mx-2 flex-1 space-y-4 overflow-y-auto px-2">
            {TIERS.map((faixa) => {
              const lista = ENGENHOCAS.filter(
                (gadget) => gadget.tier === faixa.tier,
              );
              const liberado = nivel >= faixa.nivel;

              return (
                <section key={faixa.tier} className="space-y-2">
                  <h4 className="text-display flex flex-wrap items-baseline gap-2 border-b border-border pb-1 text-sm font-semibold">
                    Tier {faixa.tier}
                    <span
                      className={cn(
                        "font-mono text-[0.7rem] font-normal",
                        liberado ? "text-muted-foreground" : "text-amber-300",
                      )}
                    >
                      {faixa.nivel === 1
                        ? "desde o nível 1"
                        : `libera no nível ${faixa.nivel}`}{" "}
                      · {faixa.custo}
                    </span>
                  </h4>

                  {lista.map((gadget) => {
                    const chips = describeEffects(readEffects(gadget.effects));
                    const possuo = porNome.has(
                      nomeDaEngenhoca(gadget).toLowerCase(),
                    );

                    return (
                      <div
                        key={gadget.key}
                        className={cn(
                          "rounded-xl border border-border bg-card/60 p-3",
                          possuo && "border-emerald-500/20",
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="text-display text-sm font-semibold">
                            {gadget.nome}
                          </h5>
                          {gadget.kind === "active" && (
                            <Badge
                              variant="secondary"
                              className="text-[0.65rem]"
                            >
                              ativa
                            </Badge>
                          )}

                          <Button
                            size="xs"
                            variant={possuo ? "ghost" : "outline"}
                            className="ml-auto"
                            disabled={possuo || salvando !== null}
                            onClick={() => adicionarEngenhoca(gadget)}
                          >
                            {salvando === gadget.key ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : possuo ? (
                              <Check className="size-3" />
                            ) : null}
                            {possuo ? "Já tenho" : "Adicionar"}
                          </Button>
                        </div>

                        {chips.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {chips.map((chip) => (
                              <span
                                key={chip}
                                className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[0.7rem] text-emerald-300"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {gadget.texto}
                        </p>

                        {gadget.avisos.map((aviso) => (
                          <p
                            key={aviso}
                            className="mt-1.5 flex items-start gap-1.5 text-[0.7rem] text-amber-300"
                          >
                            <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                            {aviso}.
                          </p>
                        ))}
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-2 border-b border-border pb-3">
              <div className="space-y-1">
                <label
                  htmlFor="nivel-classe"
                  className="text-xs text-muted-foreground"
                >
                  Até o nível
                </label>
                <Input
                  id="nivel-classe"
                  type="number"
                  min={1}
                  max={20}
                  value={nivel}
                  onChange={(event) =>
                    setNivel(
                      Math.min(20, Math.max(1, Number(event.target.value) || 1)),
                    )
                  }
                  className="w-20 text-center font-mono"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => adicionarTudo(classe)}
                disabled={emLote}
              >
                {emLote && <Loader2 className="size-3.5 animate-spin" />}
                Adicionar tudo até o nível {nivel}
              </Button>

              {classe.engenhocas && (
                <Button variant="outline" onClick={() => setVendo("engenhocas")}>
                  <Wrench className="size-3.5" />
                  Ver as {ENGENHOCAS.length} engenhocas
                </Button>
              )}

              <p className="w-full text-xs text-muted-foreground">
                As perícias que a classe manda escolher ficam na própria
                habilidade, aqui embaixo. Marque e a ficha soma sozinha.
              </p>
            </div>

            <div className="-mx-2 flex-1 space-y-2 overflow-y-auto px-2">
              {classe.features
                .filter((feature) => feature.nivel <= nivel)
                .map((feature) => {
                  const criada = jaCriada(feature, classe);
                  const escolhidas = marcadas(feature, classe);
                  const chips = describeEffects(
                    readEffects(
                      feature.escolhas
                        ? comPericias(feature.effects, feature, escolhidas)
                        : feature.effects,
                    ),
                  );

                  return (
                    <div
                      key={feature.key}
                      className={cn(
                        "rounded-xl border border-border bg-card/60 p-3",
                        criada && "border-emerald-500/20",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-primary/40 font-mono text-[0.65rem] text-primary"
                        >
                          nível {feature.nivel}
                        </Badge>
                        <h4 className="text-display text-sm font-semibold">
                          {feature.nome}
                        </h4>
                        {feature.kind === "active" && (
                          <Badge variant="secondary" className="text-[0.65rem]">
                            ativa
                          </Badge>
                        )}

                        <Button
                          size="xs"
                          variant={criada ? "ghost" : "outline"}
                          className="ml-auto"
                          disabled={Boolean(criada) || salvando !== null || emLote}
                          onClick={() => adicionar(feature, classe)}
                        >
                          {salvando === feature.key ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : criada ? (
                            <Check className="size-3" />
                          ) : null}
                          {criada ? "Já tenho" : "Adicionar"}
                        </Button>
                      </div>

                      {chips.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {chips.map((chip) => (
                            <span
                              key={chip}
                              className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[0.7rem] text-emerald-300"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {feature.texto}
                      </p>

                      {feature.escolhas && candidatas(feature).length > 0 && (
                        <div className="mt-2 rounded-lg border border-dashed border-border p-2">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-xs text-muted-foreground">
                              {feature.escolhas.rotulo}
                            </span>
                            <span
                              className={cn(
                                "font-mono text-[0.7rem]",
                                escolhidas.length === feature.escolhas.quantidade
                                  ? "text-emerald-300"
                                  : "text-amber-300",
                              )}
                            >
                              {escolhidas.length} de{" "}
                              {feature.escolhas.quantidade}
                            </span>
                            {(gravando[feature.key] ?? 0) > 0 && (
                              <Loader2 className="size-3 animate-spin text-muted-foreground" />
                            )}
                          </div>

                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {candidatas(feature).map((pericia) => {
                              const marcada = escolhidas.includes(pericia.key);
                              return (
                                <Button
                                  key={pericia.key}
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  disabled={emLote}
                                  onClick={() =>
                                    alterna(feature, classe, pericia.key)
                                  }
                                  className={cn(
                                    marcada &&
                                      (feature.escolhas!.grau === "proficiente"
                                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                                        : "border-primary/50 bg-primary/10 text-primary"),
                                  )}
                                >
                                  {pericia.label}
                                  {marcada &&
                                    feature.escolhas!.grau === "especialista" &&
                                    " ×2"}
                                </Button>
                              );
                            })}
                          </div>

                          {!criada && escolhidas.length > 0 && (
                            <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
                              Entram junto quando você adicionar a habilidade.
                            </p>
                          )}
                        </div>
                      )}

                      {feature.avisos.map((aviso) => (
                        <p
                          key={aviso}
                          className="mt-1.5 flex items-start gap-1.5 text-[0.7rem] text-amber-300"
                        >
                          <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                          {aviso}.
                        </p>
                      ))}
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
