"use client";

import { useState } from "react";
import { BatteryCharging, Pencil, Power, Trash2, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AbilityRow } from "@/lib/database.types";
import { describeEffects, readEffects } from "@/lib/effects";
import { cn } from "@/lib/utils";

/**
 * Lista de habilidades separada em Ativas e Passivas, como no PDF dos itens.
 * Serve tanto para o item quanto para as abas de Fluxo e Talentos.
 */
export function AbilityList({
  abilities,
  onToggle,
  onEdit,
  onDelete,
  onRecharge,
  blockedReason = null,
  emptyHint,
}: {
  abilities: AbilityRow[];
  onToggle: (ability: AbilityRow, next: boolean) => void;
  onEdit: (ability: AbilityRow) => void;
  onDelete: (ability: AbilityRow) => void;
  onRecharge: (ability: AbilityRow) => void;
  /** Preenchido quando não dá para ligar agora, ex: item desativado. */
  blockedReason?: string | null;
  emptyHint?: string;
}) {
  const ativas = abilities.filter((ability) => ability.kind === "active");
  const passivas = abilities.filter((ability) => ability.kind === "passive");

  // Abrir em "Ativas" quando só existem passivas mostraria uma lista vazia.
  // Controlada de propósito: mudar o defaultValue depois de montada faz o
  // Base UI reclamar, e a escolha do usuário tem que ser respeitada.
  const [aba, setAba] = useState(ativas.length > 0 ? "ativas" : "passivas");

  return (
    <Tabs value={aba} onValueChange={(valor) => setAba(valor as string)}>
      <TabsList variant="line">
        <TabsTrigger value="ativas">
          <Zap className="size-3.5" />
          Ativas
          <span className="ml-1 text-xs text-muted-foreground">
            {ativas.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="passivas">
          Passivas
          <span className="ml-1 text-xs text-muted-foreground">
            {passivas.length}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ativas" className="mt-3 space-y-2">
        {ativas.length === 0 ? (
          <Vazio texto={emptyHint ?? "Nenhuma habilidade ativa."} />
        ) : (
          ativas.map((ability) => (
            <Linha
              key={ability.id}
              ability={ability}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onRecharge={onRecharge}
              blockedReason={blockedReason}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="passivas" className="mt-3 space-y-2">
        {passivas.length === 0 ? (
          <Vazio texto="Nenhuma habilidade passiva." />
        ) : (
          passivas.map((ability) => (
            <Linha
              key={ability.id}
              ability={ability}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onRecharge={onRecharge}
              blockedReason={blockedReason}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {texto}
    </p>
  );
}

function Linha({
  ability,
  onToggle,
  onEdit,
  onDelete,
  onRecharge,
  blockedReason,
}: {
  ability: AbilityRow;
  onToggle: (ability: AbilityRow, next: boolean) => void;
  onEdit: (ability: AbilityRow) => void;
  onDelete: (ability: AbilityRow) => void;
  onRecharge: (ability: AbilityRow) => void;
  blockedReason: string | null;
}) {
  const ativa = ability.kind === "active";
  const efeitos = describeEffects(readEffects(ability.effects));
  const semUsos = ability.uses_max !== null && (ability.uses_current ?? 0) <= 0;
  const impedida = Boolean(blockedReason) || (semUsos && !ability.is_active);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/60 p-3 transition-colors",
        ability.is_active && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-medium">{ability.name}</h4>

        {ability.action_type && (
          <Badge variant="secondary" className="text-[0.65rem]">
            {ability.action_type}
          </Badge>
        )}

        {ability.charge_cost > 0 && (
          <Badge
            variant="outline"
            className="border-amber-500/40 text-[0.65rem] text-amber-300"
          >
            {ability.charge_cost}{" "}
            {ability.charge_cost === 1 ? "carga" : "cargas"}
          </Badge>
        )}

        {ability.uses_max !== null && (
          <>
            <Badge
              variant="outline"
              className="border-sky-500/40 text-[0.65rem] text-sky-300"
            >
              {ability.uses_current ?? 0} de {ability.uses_max} usos
            </Badge>
            {ability.uses_note && (
              <span className="text-[0.65rem] text-muted-foreground">
                {ability.uses_note}
              </span>
            )}
            {(ability.uses_current ?? 0) < ability.uses_max && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => onRecharge(ability)}
                title="Devolver todos os usos"
              >
                <BatteryCharging className="size-3" />
                Recarregar
              </Button>
            )}
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          {ativa && (
            <Button
              size="sm"
              variant={ability.is_active ? "default" : "outline"}
              onClick={() => onToggle(ability, !ability.is_active)}
              disabled={impedida && !ability.is_active}
              title={
                impedida && !ability.is_active
                  ? (blockedReason ?? "Sem usos restantes")
                  : undefined
              }
            >
              <Power className="size-3.5" />
              {ability.is_active ? "Ligada" : "Ligar"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Editar habilidade"
            onClick={() => onEdit(ability)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remover habilidade"
            onClick={() => onDelete(ability)}
          >
            <Trash2 className="size-3.5 hover:text-destructive" />
          </Button>
        </div>
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

      {ability.description_html && (
        <div
          className="item-prose mt-2"
          dangerouslySetInnerHTML={{ __html: ability.description_html }}
        />
      )}

      {impedida && !ability.is_active && (
        <p className="mt-2 text-xs text-muted-foreground">
          {blockedReason ?? "Sem usos restantes."}
        </p>
      )}
    </div>
  );
}
