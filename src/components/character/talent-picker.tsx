"use client";

import { useMemo, useState } from "react";
import { BookMarked, Check, Loader2, Search, TriangleAlert } from "lucide-react";
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
import type { AbilityRow } from "@/lib/database.types";
import { describeEffects, readEffects } from "@/lib/effects";
import { buscaTalentos, type TalentoCatalogo } from "@/lib/talents";
import { cn } from "@/lib/utils";

/**
 * Escolher um talento do guia da mesa.
 *
 * O que dá para ligar sozinho (aumento de atributo, proficiência em perícia)
 * já vem preenchido, então a aba Perícias e a aba Combate mudam na hora que o
 * talento entra. O que depende de escolha sua aparece como aviso.
 */
export function TalentPicker({
  open,
  onOpenChange,
  characterId,
  jaTenho,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  /** Nomes que o personagem já tem, para não repetir. */
  jaTenho: string[];
  onAdded: (ability: AbilityRow) => void;
}) {
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState<string | null>(null);

  const resultados = useMemo(() => buscaTalentos(busca), [busca]);
  const tenho = useMemo(
    () => new Set(jaTenho.map((nome) => nome.toLowerCase())),
    [jaTenho],
  );

  async function adicionar(talento: TalentoCatalogo) {
    setSalvando(talento.key);
    try {
      const payload = await apiFetch<{ ability: AbilityRow }>(
        `/api/characters/${characterId}/abilities`,
        apiJson("POST", {
          source: "talento",
          kind: "passive",
          name: talento.nome,
          effects: talento.effects,
          description_html: paragrafos(talento),
          description_text: talento.texto,
        }),
      );
      onAdded(payload.ability);
      toast.success(`${talento.nome} adicionado`);
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
            Talentos do guia
          </DialogTitle>
          <DialogDescription>
            {resultados.length} de {buscaTalentos("").length} talentos. O que dá
            para calcular entra sozinho na ficha.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por nome ou pelo que o talento faz"
            className="pl-8"
            autoFocus
          />
        </div>

        <div className="-mx-2 flex-1 space-y-2 overflow-y-auto px-2">
          {resultados.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum talento com esse termo.
            </p>
          )}

          {resultados.map((talento) => {
            const chips = describeEffects(readEffects(talento.effects));
            const possuo = tenho.has(talento.nome.toLowerCase());

            return (
              <div
                key={talento.key}
                className={cn(
                  "rounded-xl border border-border bg-card/60 p-3",
                  possuo && "opacity-60",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-display text-sm font-semibold">
                    {talento.nome}
                  </h4>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[0.65rem]",
                      talento.fonte === "campanha"
                        ? "border-primary/40 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {talento.fonte === "campanha" ? "guia da mesa" : "compêndio"}
                  </Badge>
                  {talento.requisito && (
                    <span className="text-[0.65rem] text-muted-foreground">
                      requer {talento.requisito}
                    </span>
                  )}

                  <Button
                    size="xs"
                    variant={possuo ? "ghost" : "outline"}
                    className="ml-auto"
                    disabled={possuo || salvando !== null}
                    onClick={() => adicionar(talento)}
                  >
                    {salvando === talento.key ? (
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
                  {talento.texto}
                </p>

                {talento.avisos.map((aviso) => (
                  <p
                    key={aviso}
                    className="mt-1.5 flex items-start gap-1.5 text-[0.7rem] text-amber-300"
                  >
                    <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                    {aviso}. Ajuste na mão depois de adicionar.
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** O texto do PDF vem com marcadores virando espaço duplo. */
function paragrafos(talento: TalentoCatalogo): string {
  return talento.texto
    .split(/\s{2,}/)
    .map((trecho) => trecho.trim())
    .filter(Boolean)
    .map((trecho) => `<p>${escapa(trecho)}</p>`)
    .join("");
}

function escapa(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
