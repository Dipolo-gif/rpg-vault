"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Languages, Loader2, Save, Sparkles } from "lucide-react";
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
import { apiFetch, apiJson } from "@/lib/client-api";
import type { SpellRow } from "@/lib/database.types";
import { NOME_CIRCULO } from "@/lib/spells";

type Destaque = { rotulo: string; valor: string };

type Lida = {
  /** Em português. */
  texto: string;
  /** Como está na página, em inglês. */
  original: string;
  traduzido: boolean;
  marcas: Destaque[];
};

/** Serve para a magia que já está na ficha e para a que está no guia. */
export type AlvoDetalhe = {
  slug: string | null;
  nome: string;
  nivel: number;
  escola: string | null;
  tempo: string | null;
  alcance: string | null;
  duracao: string | null;
  componentes: string | null;
  concentracao: boolean;
  ritual: boolean;
  link: string | null;
  /** O que você escreveu, quando a magia já está na ficha. */
  descricaoHtml: string | null;
  /** Preenchido quando a magia é do personagem, para poder guardar o texto. */
  spellId: string | null;
};

export function alvoDaMagia(spell: SpellRow): AlvoDetalhe {
  return {
    slug: spell.catalog_slug,
    nome: spell.name,
    nivel: spell.level,
    escola: spell.school,
    tempo: spell.casting_time,
    alcance: spell.range,
    duracao: spell.duration,
    componentes: spell.components,
    concentracao: spell.concentration,
    ritual: spell.ritual,
    link: spell.reference_url,
    descricaoHtml: spell.description_html,
    spellId: spell.id,
  };
}

/**
 * Detalhe de uma magia: os dados da ficha em cima, os destaques do que
 * importa na hora (dano, resistência, área) e o texto completo embaixo.
 *
 * O texto não mora no app: ele é buscado na página da magia quando você abre,
 * e o botão "Guardar na ficha" grava na sua descrição para ficar offline.
 */
export function SpellDetails({
  alvo,
  onOpenChange,
  onSaved,
}: {
  alvo: AlvoDetalhe | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: (spell: SpellRow) => void;
}) {
  /** O texto fica guardado por magia, então reabrir não busca de novo. */
  const [lidas, setLidas] = useState<Record<string, Lida>>({});
  const [carregando, setCarregando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [emIngles, setEmIngles] = useState(false);
  const buscando = useRef<string | null>(null);

  const slug = alvo?.slug ?? null;
  const lida = slug ? lidas[slug] : undefined;
  const texto = (emIngles ? lida?.original : lida?.texto) ?? null;
  const marcas = lida?.marcas ?? [];

  useEffect(() => {
    if (!slug || lidas[slug] || buscando.current === slug) return;

    buscando.current = slug;
    apiFetch<{
      texto: string;
      original: string;
      traduzido: boolean;
      destaques: Destaque[];
    }>(`/api/spells/catalog/${slug}`)
      .then((payload) =>
        setLidas((current) => ({
          ...current,
          [slug]: {
            texto: payload.texto,
            original: payload.original,
            traduzido: payload.traduzido,
            marcas: payload.destaques,
          },
        })),
      )
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Falha ao abrir o texto",
        ),
      )
      .finally(() => {
        buscando.current = null;
        setCarregando(false);
      });

    setCarregando(true);
  }, [slug, lidas]);

  async function guardar() {
    if (!alvo?.spellId || !texto) return;

    setGuardando(true);
    try {
      const html = texto
        .split("\n\n")
        .map((paragrafo) => `<p>${paragrafo}</p>`)
        .join("");

      const payload = await apiFetch<{ spell: SpellRow }>(
        `/api/spells/${alvo.spellId}`,
        apiJson("PATCH", {
          description_html: html,
          description_text: texto,
        }),
      );
      onSaved?.(payload.spell);
      toast.success("Texto guardado na ficha");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao guardar");
    } finally {
      setGuardando(false);
    }
  }

  const dados = alvo
    ? [
        ["Círculo", NOME_CIRCULO[alvo.nivel]],
        ["Escola", alvo.escola],
        ["Tempo", alvo.tempo],
        ["Alcance", alvo.alcance],
        ["Duração", alvo.duracao],
        ["Componentes", alvo.componentes],
      ].filter(([, valor]) => Boolean(valor))
    : [];

  return (
    <Dialog open={alvo !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-display flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {alvo?.nome}
            {alvo?.concentracao && (
              <Badge variant="secondary" className="text-[0.65rem]">
                concentração
              </Badge>
            )}
            {alvo?.ritual && (
              <Badge variant="secondary" className="text-[0.65rem]">
                ritual
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {alvo ? NOME_CIRCULO[alvo.nivel] : ""}
            {alvo?.escola ? ` de ${alvo.escola.toLowerCase()}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-2 flex-1 space-y-4 overflow-y-auto px-2">
          {/* Dados da ficha */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {dados.map(([rotulo, valor]) => (
              <div
                key={rotulo}
                className="rounded-lg border border-border bg-card/60 p-2"
              >
                <span className="block text-[0.6rem] tracking-widest text-muted-foreground uppercase">
                  {rotulo}
                </span>
                <span className="text-sm">{valor}</span>
              </div>
            ))}
          </div>

          {/* O que importa na hora de usar */}
          {marcas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {marcas.map((marca) => (
                <span
                  key={marca.rotulo}
                  className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300"
                >
                  <span className="text-[0.65rem] text-emerald-300/70 uppercase">
                    {marca.rotulo}
                  </span>{" "}
                  {marca.valor}
                </span>
              ))}
            </div>
          )}

          {/* A sua descrição, quando existe */}
          {alvo?.descricaoHtml && (
            <section className="space-y-1">
              <h4 className="text-display text-sm font-semibold">
                Na sua ficha
              </h4>
              <div
                className="prose-rpg text-sm"
                dangerouslySetInnerHTML={{ __html: alvo.descricaoHtml }}
              />
            </section>
          )}

          {/* Texto do guia */}
          <section className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-display text-sm font-semibold">
                Texto do guia
              </h4>
              {carregando && (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              )}

              {lida && !lida.traduzido && (
                <span className="text-[0.65rem] text-amber-300">
                  sem tradução agora, segue o original
                </span>
              )}

              {lida?.traduzido && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setEmIngles((atual) => !atual)}
                >
                  <Languages className="size-3" />
                  {emIngles ? "Ver em português" : "Ver o original"}
                </Button>
              )}

              {texto && alvo?.spellId && (
                <Button
                  size="xs"
                  variant="outline"
                  className="ml-auto"
                  onClick={guardar}
                  disabled={guardando}
                >
                  {guardando ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Save className="size-3" />
                  )}
                  Guardar na ficha
                </Button>
              )}

              {alvo?.link && (
                <Button
                  size="xs"
                  variant="ghost"
                  nativeButton={false}
                  className={texto && alvo?.spellId ? "" : "ml-auto"}
                  render={
                    <a href={alvo.link} target="_blank" rel="noreferrer noopener" />
                  }
                >
                  <ExternalLink className="size-3" />
                  Abrir a página
                </Button>
              )}
            </div>

            {!slug && (
              <p className="text-xs text-muted-foreground">
                Esta magia é da sua mesa, então não tem página no guia. O que
                você escreveu na descrição é o que vale.
              </p>
            )}

            {texto && (
              <div className="space-y-2 text-sm leading-relaxed">
                {texto.split("\n\n").map((paragrafo, indice) => (
                  <p
                    key={indice}
                    className={
                      /^(At Higher Levels|Spell Lists|Em círculos maiores|Listas de magia)/i.test(
                        paragrafo,
                      )
                        ? "text-muted-foreground"
                        : undefined
                    }
                  >
                    {paragrafo}
                  </p>
                ))}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
