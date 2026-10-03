"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookMarked, Check, Eye, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import {
  SpellDetails,
  type AlvoDetalhe,
} from "@/components/character/spell-details";
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
import type { SpellRow } from "@/lib/database.types";
import { NOME_CIRCULO } from "@/lib/spells";
import { cn } from "@/lib/utils";

type MagiaCatalogo = {
  slug: string;
  /** Em inglês, como está no guia. */
  nome: string;
  /** Em português, que é o que entra na ficha. */
  nome_pt: string;
  nivel: number;
  escola: string;
  tempo: string;
  alcance: string;
  duracao: string;
  componentes: string;
  concentracao: boolean;
  link: string;
};

/** Quantas aparecem de uma vez. A busca é que afunila o resto. */
const LIMITE = 60;

/** A magia do guia no formato que o painel de detalhes entende. */
function paraDetalhe(magia: MagiaCatalogo): AlvoDetalhe {
  return {
    slug: magia.slug,
    nome: magia.nome_pt || magia.nome,
    nivel: magia.nivel,
    escola: magia.escola,
    tempo: magia.tempo,
    alcance: magia.alcance,
    duracao: magia.duracao,
    componentes: magia.componentes,
    concentracao: magia.concentracao,
    ritual: false,
    link: magia.link,
    descricaoHtml: null,
    spellId: null,
  };
}

/**
 * Guia de magias, com as 574 do dnd5e.wikidot.com.
 *
 * A lista é grande demais para viajar no bundle, então ela é pedida à API na
 * primeira vez que você abre o seletor, e fica em memória daí em diante.
 */
export function SpellPicker({
  open,
  onOpenChange,
  characterId,
  nivelInicial = 0,
  jaTenho,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  nivelInicial?: number;
  /** Nomes das magias que o personagem já tem. */
  jaTenho: string[];
  onAdded: (spell: SpellRow) => void;
}) {
  const [catalogo, setCatalogo] = useState<MagiaCatalogo[] | null>(null);
  const [nivel, setNivel] = useState<number | "todos">(nivelInicial);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<AlvoDetalhe | null>(null);
  const buscando = useRef(false);

  // Vale tanto o nome quanto o slug: a magia pode ter sido renomeada na ficha.
  const tenho = useMemo(
    () => new Set(jaTenho.map((chave) => chave.toLowerCase())),
    [jaTenho],
  );

  // Abrir pelo botão de um círculo já mostra aquele círculo. Estado derivado,
  // então fica no render em vez de um efeito.
  if (open !== aberto) {
    setAberto(open);
    if (open) setNivel(nivelInicial);
  }

  // A lista vem uma vez por sessão e fica em memória.
  useEffect(() => {
    if (!open || catalogo || buscando.current) return;

    buscando.current = true;
    apiFetch<{ spells: MagiaCatalogo[] }>("/api/spells/catalog")
      .then((payload) => setCatalogo(payload.spells))
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Falha ao abrir o guia",
        ),
      )
      .finally(() => {
        buscando.current = false;
      });
  }, [open, catalogo]);

  const filtradas = useMemo(() => {
    if (!catalogo) return [];
    const termo = busca.trim().toLowerCase();

    return catalogo.filter((magia) => {
      if (nivel !== "todos" && magia.nivel !== nivel) return false;
      if (!termo) return true;
      // Busca pelos dois nomes: você lembra "Bola de Fogo" ou "Fireball".
      return (
        magia.nome_pt.toLowerCase().includes(termo) ||
        magia.nome.toLowerCase().includes(termo) ||
        magia.escola.toLowerCase().includes(termo)
      );
    });
  }, [catalogo, nivel, busca]);

  async function adicionar(magia: MagiaCatalogo) {
    setSalvando(magia.slug);
    try {
      const payload = await apiFetch<{ spell: SpellRow }>(
        `/api/characters/${characterId}/spells`,
        apiJson("POST", { catalog_slug: magia.slug }),
      );
      onAdded(payload.spell);
      toast.success(`${magia.nome} adicionada`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao adicionar");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-display flex items-center gap-2">
            <BookMarked className="size-4 text-primary" />
            Guia de magias
          </DialogTitle>
          <DialogDescription>
            {catalogo
              ? `${catalogo.length} magias. Escolha o círculo ou busque pelo nome.`
              : "Carregando a lista..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 border-b border-border pb-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar pelo nome ou escola"
              className="pl-8"
              aria-label="Buscar magia"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {(["todos", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((opcao) => (
              <Button
                key={opcao}
                type="button"
                size="xs"
                variant="outline"
                onClick={() => setNivel(opcao)}
                className={cn(
                  "font-mono",
                  nivel === opcao &&
                    "border-primary/50 bg-primary/10 text-primary",
                )}
              >
                {opcao === "todos" ? "todos" : opcao === 0 ? "truque" : opcao}
              </Button>
            ))}
          </div>
        </div>

        <div className="-mx-2 flex-1 space-y-1.5 overflow-y-auto px-2">
          {!catalogo && (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Abrindo o guia...
            </p>
          )}

          {catalogo && filtradas.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">
              Nada com esse nome. Se for magia da sua mesa, use o botão Nova
              magia.
            </p>
          )}

          {filtradas.slice(0, LIMITE).map((magia) => {
            const possuo =
              tenho.has(magia.slug) || tenho.has(magia.nome_pt.toLowerCase());

            return (
              <div
                key={magia.slug}
                className="rounded-xl border border-border bg-card/60 p-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/40 font-mono text-[0.65rem] text-primary"
                  >
                    {magia.nivel === 0 ? "truque" : `círculo ${magia.nivel}`}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setDetalhe(paraDetalhe(magia))}
                    title="Ver o texto completo"
                    className="text-display cursor-pointer text-sm font-semibold underline-offset-4 hover:underline"
                  >
                    {magia.nome_pt || magia.nome}
                  </button>

                  {magia.nome_pt && magia.nome_pt !== magia.nome && (
                    <span className="text-[0.65rem] text-muted-foreground">
                      {magia.nome}
                    </span>
                  )}
                  {magia.concentracao && (
                    <Badge variant="secondary" className="text-[0.65rem]">
                      concentração
                    </Badge>
                  )}

                  <Button
                    size="xs"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => setDetalhe(paraDetalhe(magia))}
                  >
                    <Eye className="size-3" />
                    Ver
                  </Button>

                  <Button
                    size="xs"
                    variant={possuo ? "ghost" : "outline"}
                    disabled={possuo || salvando !== null}
                    onClick={() => adicionar(magia)}
                  >
                    {salvando === magia.slug ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : possuo ? (
                      <Check className="size-3" />
                    ) : null}
                    {possuo ? "Já tenho" : "Adicionar"}
                  </Button>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {[
                    magia.escola,
                    magia.tempo,
                    magia.alcance,
                    magia.duracao,
                    magia.componentes,
                  ].join(" · ")}
                </p>
              </div>
            );
          })}

          {filtradas.length > LIMITE && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              Mostrando {LIMITE} de {filtradas.length}. Refine a busca para ver
              o resto.
            </p>
          )}
        </div>

        <p className="border-t border-border pt-2 text-[0.7rem] text-muted-foreground">
          Clique no nome para ver o texto completo da magia. Cada uma
          adicionada vem com o link da página, e dá para guardar o texto na
          sua ficha. Círculo atual:{" "}
          {nivel === "todos" ? "todos" : NOME_CIRCULO[nivel]}.
        </p>

        <SpellDetails
          alvo={detalhe}
          onOpenChange={(aberto) => {
            if (!aberto) setDetalhe(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
