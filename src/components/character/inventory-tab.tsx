"use client";

import { useMemo, useState } from "react";
import {
  BatteryCharging,
  ChevronDown,
  Link2,
  Minus,
  Package,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

import { AbilityList } from "@/components/character/ability-list";
import { AbilitySheet } from "@/components/character/ability-sheet";
import { ItemSheet } from "@/components/character/item-sheet";
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
import type { AbilityRow, MagicItemWithUrl } from "@/lib/database.types";
import { describeEffects, readEffects } from "@/lib/effects";
import { rarityStyle, type SystemDef } from "@/lib/systems";
import { cn } from "@/lib/utils";

export function InventoryTab({
  characterId,
  system,
  items,
  abilities,
  onItemSaved,
  onItemDelete,
  onItemToggle,
  onItemCharges,
  onItemQuantity,
  onAbilityToggle,
  onAbilitySaved,
  onAbilityDelete,
  onAbilityRecharge,
}: {
  characterId: string;
  system: SystemDef;
  items: MagicItemWithUrl[];
  abilities: AbilityRow[];
  onItemSaved: (item: MagicItemWithUrl, created: boolean) => void;
  onItemDelete: (item: MagicItemWithUrl) => void;
  onItemToggle: (item: MagicItemWithUrl, next: boolean) => void;
  onItemCharges: (item: MagicItemWithUrl, value: number) => void;
  onItemQuantity: (item: MagicItemWithUrl, value: number) => void;
  onAbilityToggle: (ability: AbilityRow, next: boolean) => void;
  onAbilitySaved: (ability: AbilityRow, created: boolean) => void;
  onAbilityDelete: (ability: AbilityRow) => void;
  onAbilityRecharge: (ability: AbilityRow) => void;
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MagicItemWithUrl | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MagicItemWithUrl | null>(
    null,
  );
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});
  // Editar habilidade abre a habilidade, nao o item inteiro.
  const [abilityEditing, setAbilityEditing] = useState<AbilityRow | null>(null);
  const [abilitySheetOpen, setAbilitySheetOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.name, item.type ?? "", item.rarity ?? "", item.description_text ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-display mr-auto text-lg font-semibold">
          Inventário
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </span>
        </h2>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar item"
          className="w-40 sm:w-56"
          aria-label="Buscar item"
        />
        <Button
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
        >
          <Plus />
          Adicionar item
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="vault-panel flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <Package className="mb-3 size-9 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "Nenhum item guardado ainda."
              : "Nenhum item corresponde à busca."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const efeitos = describeEffects(readEffects(item.passive_effects));
            const arma = readEffects(item.passive_effects).arma;
            const minhas = abilities.filter(
              (ability) => ability.item_id === item.id,
            );
            const ligadas = minhas.filter((ability) => ability.is_active).length;
            const aberto = expandido[item.id] ?? false;

            return (
              <article
                key={item.id}
                className={cn(
                  "vault-panel rounded-2xl border border-border bg-card p-4 transition-colors",
                  item.equipped ? "border-primary/30" : "opacity-75",
                )}
              >
                <div className="flex gap-4">
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/40">
                    {item.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.image_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground/40">
                        <Package className="size-6" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-display text-base font-semibold">
                        {item.name}
                      </h3>
                      {item.rarity && (
                        <Badge variant="outline" className={rarityStyle(item.rarity)}>
                          {item.rarity}
                        </Badge>
                      )}
                      {item.type && <Badge variant="secondary">{item.type}</Badge>}
                      {arma && (
                        <Badge
                          variant="outline"
                          className="border-primary/40 font-mono text-primary"
                        >
                          {arma.dados} {arma.tipo}
                        </Badge>
                      )}
                      {item.attuned && (
                        <Badge
                          variant="outline"
                          className="border-violet-500/40 text-violet-300"
                        >
                          <Link2 className="size-3" />
                          Sintonizado
                        </Badge>
                      )}
                    </div>

                    {efeitos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {efeitos.map((efeito) => (
                          <span
                            key={efeito}
                            className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground"
                          >
                            {efeito}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.description_html && (
                      <div
                        className="item-prose mt-2"
                        dangerouslySetInnerHTML={{
                          __html: item.description_html,
                        }}
                      />
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Button
                      size="sm"
                      variant={item.equipped ? "default" : "outline"}
                      onClick={() => onItemToggle(item, !item.equipped)}
                    >
                      <Power className="size-3.5" />
                      {item.equipped ? "Ativado" : "Desativado"}
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Usar uma unidade"
                        onClick={() =>
                          onItemQuantity(item, Math.max(0, item.quantity - 1))
                        }
                        disabled={item.quantity === 0}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center font-mono text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Adicionar uma unidade"
                        onClick={() => onItemQuantity(item, item.quantity + 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Editar item"
                        onClick={() => {
                          setEditing(item);
                          setSheetOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remover item"
                        onClick={() => setPendingDelete(item)}
                      >
                        <Trash2 className="size-3.5 hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Cargas */}
                {item.charges_max !== null && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                    <span className="text-xs tracking-wide text-muted-foreground uppercase">
                      Cargas
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Gastar uma carga"
                      onClick={() =>
                        onItemCharges(
                          item,
                          Math.max(0, (item.charges_current ?? 0) - 1),
                        )
                      }
                      disabled={(item.charges_current ?? 0) === 0}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="font-mono text-sm">
                      {item.charges_current ?? 0}
                      <span className="text-muted-foreground">
                        {" "}
                        / {item.charges_max}
                      </span>
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Recuperar uma carga"
                      onClick={() =>
                        onItemCharges(
                          item,
                          Math.min(
                            item.charges_max ?? 0,
                            (item.charges_current ?? 0) + 1,
                          ),
                        )
                      }
                      disabled={(item.charges_current ?? 0) >= item.charges_max}
                    >
                      <Plus className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onItemCharges(item, item.charges_max ?? 0)}
                      disabled={item.charges_current === item.charges_max}
                    >
                      <BatteryCharging className="size-3.5" />
                      Recarregar
                    </Button>
                    {item.charges_note && (
                      <span className="text-xs text-muted-foreground">
                        {item.charges_note}
                      </span>
                    )}
                  </div>
                )}

                {/* Habilidades */}
                {minhas.length > 0 && (
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandido((current) => ({
                          ...current,
                          [item.id]: !aberto,
                        }))
                      }
                    >
                      <ChevronDown
                        className={cn(
                          "size-3.5 transition-transform",
                          aberto && "rotate-180",
                        )}
                      />
                      {minhas.length}{" "}
                      {minhas.length === 1 ? "habilidade" : "habilidades"}
                      {ligadas > 0 && (
                        <span className="text-primary">· {ligadas} ligada{ligadas > 1 ? "s" : ""}</span>
                      )}
                    </Button>

                    {aberto && (
                      <div className="mt-3">
                        <AbilityList
                          abilities={minhas}
                          onToggle={onAbilityToggle}
                          onEdit={(ability) => {
                            setAbilityEditing(ability);
                            setAbilitySheetOpen(true);
                          }}
                          onDelete={onAbilityDelete}
                          onRecharge={onAbilityRecharge}
                          blockedReason={
                            item.equipped ? null : "O item está desativado."
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ItemSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        characterId={characterId}
        system={system}
        item={editing}
        abilities={abilities}
        onSaved={(saved, created) => {
          onItemSaved(saved, created);
          // Mantém o painel apontando para o item salvo, para as habilidades.
          setEditing(saved);
        }}
        onAbilityToggle={onAbilityToggle}
        onAbilitySaved={onAbilitySaved}
        onAbilityDelete={onAbilityDelete}
        onAbilityRecharge={onAbilityRecharge}
      />

      {/* Editar habilidade de item sem passar pelo painel do item. */}
      {abilityEditing && (
        <AbilitySheet
          open={abilitySheetOpen}
          onOpenChange={setAbilitySheetOpen}
          characterId={characterId}
          source="item"
          system={system}
          itemId={abilityEditing.item_id}
          itemHasCharges={
            items.find((entry) => entry.id === abilityEditing.item_id)
              ?.charges_max !== null
          }
          ability={abilityEditing}
          onSaved={onAbilitySaved}
        />
      )}

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
              O item, a arte e as habilidades dele saem do cofre. Não dá para
              desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) onItemDelete(pendingDelete);
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
