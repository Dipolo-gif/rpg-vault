"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
import type { SpellRow } from "@/lib/database.types";
import { NOME_CIRCULO } from "@/lib/spells";
import { cn } from "@/lib/utils";

const ESCOLAS = [
  "Abjuração",
  "Adivinhação",
  "Conjuração",
  "Encantamento",
  "Evocação",
  "Ilusão",
  "Necromancia",
  "Transmutação",
];

const TEMPOS = ["1 ação", "1 ação bônus", "1 reação", "1 minuto", "10 minutos"];
const ALCANCES = ["Pessoal", "Toque", "9 m", "18 m", "36 m"];
const DURACOES = [
  "Instantânea",
  "1 rodada",
  "Concentração, até 1 minuto",
  "Concentração, até 10 minutos",
  "1 hora",
  "Até ser dissipada",
];

type Draft = {
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  always_prepared: boolean;
  description_html: string;
  description_text: string;
};

const vazio: Draft = {
  name: "",
  level: 0,
  school: "",
  casting_time: "",
  range: "",
  components: "",
  duration: "",
  concentration: false,
  ritual: false,
  always_prepared: false,
  description_html: "",
  description_text: "",
};

/** Cria uma magia da sua mesa, ou edita uma que já está na lista. */
export function SpellSheet({
  open,
  onOpenChange,
  characterId,
  spell,
  nivelInicial = 0,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  spell: SpellRow | null;
  /** Círculo em que o botão foi clicado, para já vir escolhido. */
  nivelInicial?: number;
  onSaved: (spell: SpellRow, created: boolean) => void;
}) {
  const [draft, setDraft] = useState<Draft>(vazio);
  const [saving, setSaving] = useState(false);
  const [aberto, setAberto] = useState(false);

  // Abrir preenche o formulário. Fica no corpo do render em vez de um efeito
  // porque é estado derivado: o React já refaz o render antes de pintar.
  if (open !== aberto) {
    setAberto(open);
    if (open) {
      setDraft(
        spell
          ? {
              name: spell.name,
              level: spell.level,
              school: spell.school ?? "",
              casting_time: spell.casting_time ?? "",
              range: spell.range ?? "",
              components: spell.components ?? "",
              duration: spell.duration ?? "",
              concentration: spell.concentration,
              ritual: spell.ritual,
              always_prepared: spell.always_prepared,
              description_html: spell.description_html ?? "",
              description_text: spell.description_text ?? "",
            }
          : { ...vazio, level: nivelInicial },
      );
    }
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim()) {
      toast.error("A magia precisa de um nome");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: draft.name.trim(),
        level: draft.level,
        school: draft.school.trim() || null,
        casting_time: draft.casting_time.trim() || null,
        range: draft.range.trim() || null,
        components: draft.components.trim() || null,
        duration: draft.duration.trim() || null,
        concentration: draft.concentration,
        ritual: draft.ritual,
        always_prepared: draft.always_prepared,
        description_html: draft.description_html || null,
        description_text: draft.description_text || null,
      };

      const payload = spell
        ? await apiFetch<{ spell: SpellRow }>(
            `/api/spells/${spell.id}`,
            apiJson("PATCH", body),
          )
        : await apiFetch<{ spell: SpellRow }>(
            `/api/characters/${characterId}/spells`,
            apiJson("POST", body),
          );

      onSaved(payload.spell, !spell);
      toast.success(spell ? "Magia salva" : "Magia criada");
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
            {spell ? "Editar magia" : "Nova magia"}
          </SheetTitle>
          <SheetDescription>
            Para a magia que a sua mesa inventou, ou para ajustar o que veio do
            guia.
          </SheetDescription>
        </SheetHeader>

        <form
          id="spell-form"
          onSubmit={save}
          className="flex-1 space-y-4 overflow-y-auto px-4"
        >
          <div className="space-y-2">
            <Label htmlFor="spell-name">Nome</Label>
            <Input
              id="spell-name"
              value={draft.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Ex: Lança Arcana da Mesa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Círculo</Label>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 10 }, (_, nivel) => (
                <Button
                  key={nivel}
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => update("level", nivel)}
                  className={cn(
                    "font-mono",
                    draft.level === nivel &&
                      "border-primary/50 bg-primary/10 text-primary",
                  )}
                >
                  {nivel === 0 ? "truque" : nivel}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {NOME_CIRCULO[draft.level]}
              {draft.level === 0 && ", não gasta espaço"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="spell-school">Escola</Label>
              <Input
                id="spell-school"
                list="escolas-sugeridas"
                value={draft.school}
                onChange={(event) => update("school", event.target.value)}
                placeholder="Evocação"
              />
              <datalist id="escolas-sugeridas">
                {ESCOLAS.map((escola) => (
                  <option key={escola} value={escola} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spell-time">Tempo de conjuração</Label>
              <Input
                id="spell-time"
                list="tempos-sugeridos"
                value={draft.casting_time}
                onChange={(event) => update("casting_time", event.target.value)}
                placeholder="1 ação"
              />
              <datalist id="tempos-sugeridos">
                {TEMPOS.map((tempo) => (
                  <option key={tempo} value={tempo} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spell-range">Alcance</Label>
              <Input
                id="spell-range"
                list="alcances-sugeridos"
                value={draft.range}
                onChange={(event) => update("range", event.target.value)}
                placeholder="18 m"
              />
              <datalist id="alcances-sugeridos">
                {ALCANCES.map((alcance) => (
                  <option key={alcance} value={alcance} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spell-components">Componentes</Label>
              <Input
                id="spell-components"
                value={draft.components}
                onChange={(event) => update("components", event.target.value)}
                placeholder="V, S, M"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spell-duration">Duração</Label>
            <Input
              id="spell-duration"
              list="duracoes-sugeridas"
              value={draft.duration}
              onChange={(event) => {
                const valor = event.target.value;
                setDraft((current) => ({
                  ...current,
                  duration: valor,
                  // Quem digita "concentração" já quer a marca ligada.
                  concentration: /concentra/i.test(valor)
                    ? true
                    : current.concentration,
                }));
              }}
              placeholder="Instantânea"
            />
            <datalist id="duracoes-sugeridas">
              {DURACOES.map((duracao) => (
                <option key={duracao} value={duracao} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["concentration", "Concentração"],
                ["ritual", "Ritual"],
                ["always_prepared", "Sempre preparada"],
              ] as const
            ).map(([campo, label]) => (
              <Button
                key={campo}
                type="button"
                size="xs"
                variant="outline"
                onClick={() => update(campo, !draft[campo])}
                className={cn(
                  draft[campo] &&
                    "border-primary/50 bg-primary/10 text-primary",
                )}
              >
                {label}
              </Button>
            ))}
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Sempre preparada é a magia de domínio, juramento ou item: ela não
            ocupa a sua lista do dia.
          </p>

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
              placeholder="O que a magia faz, do jeito que a sua mesa usa..."
            />
          </div>
        </form>

        <SheetFooter>
          <Button type="submit" form="spell-form" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {spell ? "Salvar" : "Criar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
