"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AbilityList } from "@/components/character/ability-list";
import { AbilitySheet } from "@/components/character/ability-sheet";
import { EffectsForm } from "@/components/character/effects-form";
import { RichTextEditor } from "@/components/character/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch, apiJson } from "@/lib/client-api";
import type { AbilityRow, MagicItemWithUrl } from "@/lib/database.types";
import { readEffects, type Effects } from "@/lib/effects";
import { diceProblems } from "@/lib/dice";
import type { SystemDef } from "@/lib/systems";
import { cn } from "@/lib/utils";

type Draft = {
  name: string;
  type: string;
  rarity: string;
  quantity: number;
  attuned: boolean;
  equipped: boolean;
  charges_current: number | null;
  charges_max: number | null;
  charges_note: string;
  effects: Effects;
  description_html: string;
  description_text: string;
};

const emptyDraft: Draft = {
  name: "",
  type: "",
  rarity: "",
  quantity: 1,
  attuned: false,
  equipped: true,
  charges_current: null,
  charges_max: null,
  charges_note: "",
  effects: {},
  description_html: "",
  description_text: "",
};

export function ItemSheet({
  open,
  onOpenChange,
  characterId,
  system,
  item,
  abilities,
  onSaved,
  onAbilityToggle,
  onAbilitySaved,
  onAbilityDelete,
  onAbilityRecharge,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  system: SystemDef;
  /** null significa "criar item novo". */
  item: MagicItemWithUrl | null;
  abilities: AbilityRow[];
  onSaved: (item: MagicItemWithUrl, created: boolean) => void;
  onAbilityToggle: (ability: AbilityRow, next: boolean) => void;
  onAbilitySaved: (ability: AbilityRow, created: boolean) => void;
  onAbilityDelete: (ability: AbilityRow) => void;
  onAbilityRecharge: (ability: AbilityRow) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [abilityOpen, setAbilityOpen] = useState(false);
  const [editingAbility, setEditingAbility] = useState<AbilityRow | null>(null);

  useEffect(() => {
    if (!open) return;
    setPendingImage(null);
    if (item) {
      setDraft({
        name: item.name,
        type: item.type ?? "",
        rarity: item.rarity ?? "",
        quantity: item.quantity,
        attuned: item.attuned,
        equipped: item.equipped,
        charges_current: item.charges_current,
        charges_max: item.charges_max,
        charges_note: item.charges_note ?? "",
        effects: readEffects(item.passive_effects),
        description_html: item.description_html ?? "",
        description_text: item.description_text ?? "",
      });
      setPreview(item.image_url);
    } else {
      setDraft(emptyDraft);
      setPreview(null);
    }
  }, [open, item]);

  const typeItems = Object.fromEntries(system.itemTypes.map((t) => [t, t]));
  const rarityItems = Object.fromEntries(system.rarities.map((r) => [r, r]));
  const minhasHabilidades = abilities.filter(
    (ability) => ability.item_id === item?.id,
  );
  const arma = draft.effects.arma;

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setArma(patch: Partial<NonNullable<Effects["arma"]>> | null) {
    setDraft((current) => ({
      ...current,
      effects: {
        ...current.effects,
        arma: patch === null ? undefined : { dados: "", ...current.effects.arma, ...patch },
      },
    }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim()) {
      toast.error("O item precisa de um nome");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: draft.name.trim(),
        type: draft.type || null,
        rarity: draft.rarity || null,
        quantity: draft.quantity,
        attuned: draft.attuned,
        equipped: draft.equipped,
        charges_current: draft.charges_current,
        charges_max: draft.charges_max,
        charges_note: draft.charges_note.trim() || null,
        passive_effects: draft.effects,
        description_html: draft.description_html || null,
        description_text: draft.description_text || null,
      };

      let saved: MagicItemWithUrl;
      const created = !item;

      if (item) {
        const payload = await apiFetch<{ item: MagicItemWithUrl }>(
          `/api/items/${item.id}`,
          apiJson("PATCH", body),
        );
        saved = { ...payload.item, image_url: item.image_url };
      } else {
        const payload = await apiFetch<{ item: MagicItemWithUrl }>(
          `/api/characters/${characterId}/items`,
          apiJson("POST", body),
        );
        saved = payload.item;
      }

      if (pendingImage) {
        const form = new FormData();
        form.append("file", pendingImage);
        const withImage = await apiFetch<{ item: MagicItemWithUrl }>(
          `/api/items/${saved.id}/image`,
          { method: "POST", body: form },
        );
        saved = withImage.item;
      }

      onSaved(saved, created);
      toast.success(created ? "Item adicionado" : "Item atualizado");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-display flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {item ? "Editar item" : "Novo item"}
          </SheetTitle>
          <SheetDescription>
            Enquanto o item estiver ativado, o que estiver em Arma e efeitos
            entra sozinho na aba Combate.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <Tabs defaultValue="basico">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="efeitos">Arma e efeitos</TabsTrigger>
              <TabsTrigger value="habilidades">
                Habilidades
                <span className="ml-1 text-xs text-muted-foreground">
                  {minhasHabilidades.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <form id="item-form" onSubmit={save} className="mt-4">
              <TabsContent value="basico" className="space-y-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="size-20 shrink-0 overflow-hidden rounded-xl border border-dashed border-border bg-secondary/40"
                    aria-label="Escolher arte do item"
                  >
                    {preview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={preview} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <ImagePlus className="size-5" />
                      </span>
                    )}
                  </button>

                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        setPendingImage(file);
                        setPreview(URL.createObjectURL(file));
                      }
                      event.target.value = "";
                    }}
                  />

                  <div className="flex-1 space-y-2">
                    <Label htmlFor="item-name">Nome</Label>
                    <Input
                      id="item-name"
                      value={draft.name}
                      onChange={(event) => update("name", event.target.value)}
                      placeholder="Ex: Felix, o Martelo que Tudo Resolve"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="item-type">Tipo</Label>
                    <Select
                      items={typeItems}
                      value={draft.type}
                      onValueChange={(value) =>
                        update("type", (value as string) ?? "")
                      }
                    >
                      <SelectTrigger id="item-type" className="w-full">
                        <SelectValue placeholder="Escolher" />
                      </SelectTrigger>
                      <SelectContent>
                        {system.itemTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item-rarity">Raridade</Label>
                    <Select
                      items={rarityItems}
                      value={draft.rarity}
                      onValueChange={(value) =>
                        update("rarity", (value as string) ?? "")
                      }
                    >
                      <SelectTrigger id="item-rarity" className="w-full">
                        <SelectValue placeholder="Escolher" />
                      </SelectTrigger>
                      <SelectContent>
                        {system.rarities.map((rarity) => (
                          <SelectItem key={rarity} value={rarity}>
                            {rarity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="item-quantity">Quantidade</Label>
                    <Input
                      id="item-quantity"
                      type="number"
                      min={0}
                      value={draft.quantity}
                      onChange={(event) =>
                        update("quantity", Number(event.target.value) || 0)
                      }
                      className="w-24"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => update("equipped", !draft.equipped)}
                    className={cn(
                      draft.equipped &&
                        "border-primary/50 bg-primary/10 text-primary",
                    )}
                  >
                    {draft.equipped ? "Ativado" : "Desativado"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => update("attuned", !draft.attuned)}
                    className={cn(
                      draft.attuned &&
                        "border-violet-500/50 bg-violet-500/10 text-violet-300",
                    )}
                  >
                    <Link2 className="size-3.5" />
                    {draft.attuned ? "Sintonizado" : "Sem sintonia"}
                  </Button>
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
                  />
                </div>
              </TabsContent>

              <TabsContent value="efeitos" className="space-y-5">
                {/* Arma */}
                <div className="space-y-3 rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-display text-sm">
                      Este item é uma arma
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setArma(arma ? null : { dados: "" })}
                      className={cn(
                        arma && "border-primary/50 bg-primary/10 text-primary",
                      )}
                    >
                      {arma ? "Sim" : "Não"}
                    </Button>
                  </div>

                  {arma && (
                    <>
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="arma-dados" className="text-xs">
                            Dano base
                          </Label>
                          <Input
                            id="arma-dados"
                            value={arma.dados}
                            onChange={(event) =>
                              setArma({ dados: event.target.value })
                            }
                            placeholder="2d8"
                            className="w-24 font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="arma-tipo" className="text-xs">
                            Tipo
                          </Label>
                          <Input
                            id="arma-tipo"
                            value={arma.tipo ?? ""}
                            onChange={(event) =>
                              setArma({ tipo: event.target.value })
                            }
                            placeholder="concussão"
                            className="w-36"
                          />
                        </div>
                      </div>

                      {diceProblems(arma.dados).length > 0 && (
                        <p className="text-xs text-destructive">
                          Não entendi: {diceProblems(arma.dados).join(", ")}
                        </p>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Ataca com outro atributo
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {system.attributes.map((attribute) => (
                            <Button
                              key={attribute.key}
                              type="button"
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                setArma({
                                  atributo:
                                    arma.atributo === attribute.key
                                      ? undefined
                                      : attribute.key,
                                })
                              }
                              className={cn(
                                arma.atributo === attribute.key &&
                                  "border-violet-500/50 bg-violet-500/10 text-violet-300",
                              )}
                            >
                              {attribute.short}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Vazio usa o atributo escolhido na aba Combate.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Cargas */}
                <div className="space-y-3 rounded-xl border border-border p-3">
                  <Label className="text-display text-sm">Cargas</Label>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cargas-atual" className="text-xs">
                        Atual
                      </Label>
                      <Input
                        id="cargas-atual"
                        type="number"
                        min={0}
                        value={draft.charges_current ?? ""}
                        onChange={(event) =>
                          update(
                            "charges_current",
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                          )
                        }
                        className="w-20 text-center font-mono"
                      />
                    </div>
                    <span className="pb-2 text-muted-foreground">de</span>
                    <div className="space-y-1.5">
                      <Label htmlFor="cargas-max" className="text-xs">
                        Máximo
                      </Label>
                      <Input
                        id="cargas-max"
                        type="number"
                        min={0}
                        value={draft.charges_max ?? ""}
                        onChange={(event) =>
                          update(
                            "charges_max",
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                          )
                        }
                        className="w-20 text-center font-mono"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="cargas-nota" className="text-xs">
                        Recuperação
                      </Label>
                      <Input
                        id="cargas-nota"
                        value={draft.charges_note}
                        onChange={(event) =>
                          update("charges_note", event.target.value)
                        }
                        placeholder="ao amanhecer"
                      />
                    </div>
                  </div>
                </div>

                {/* Efeitos passivos */}
                <div className="space-y-3 rounded-xl border border-border p-3">
                  <div>
                    <Label className="text-display text-sm">
                      Efeitos passivos
                    </Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Valem enquanto o item estiver ativado. Ex: o bônus mágico
                      de +3 em ataque e dano entra como acerto 3 e uma parcela de
                      dano 3.
                    </p>
                  </div>
                  <EffectsForm
                    value={draft.effects}
                    onChange={(effects) =>
                      setDraft((current) => ({
                        ...current,
                        effects: { ...effects, arma: current.effects.arma },
                      }))
                    }
                    system={system}
                    showBonus
                  />
                </div>
              </TabsContent>
            </form>

            <TabsContent value="habilidades" className="mt-4 space-y-3">
              {!item ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Salve o item primeiro. Depois dá para pendurar as habilidades
                  ativas e passivas dele aqui.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      As ativas ligam e desligam pelo inventário, e o custo sai
                      das cargas do item.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setEditingAbility(null);
                        setAbilityOpen(true);
                      }}
                    >
                      <Plus className="size-3.5" />
                      Habilidade
                    </Button>
                  </div>

                  <AbilityList
                    abilities={minhasHabilidades}
                    onToggle={onAbilityToggle}
                    onEdit={(ability) => {
                      setEditingAbility(ability);
                      setAbilityOpen(true);
                    }}
                    onDelete={onAbilityDelete}
                    onRecharge={onAbilityRecharge}
                    blockedReason={
                      draft.equipped ? null : "O item está desativado."
                    }
                    emptyHint="Nenhuma habilidade neste item."
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter>
          <Button type="submit" form="item-form" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {item ? "Salvar item" : "Adicionar ao inventário"}
          </Button>
        </SheetFooter>

        {item && (
          <AbilitySheet
            open={abilityOpen}
            onOpenChange={setAbilityOpen}
            characterId={characterId}
            source="item"
            system={system}
            itemId={item.id}
            itemHasCharges={draft.charges_max !== null}
            ability={editingAbility}
            onSaved={onAbilitySaved}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
