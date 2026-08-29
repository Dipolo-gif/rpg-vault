"use client";

import { useState } from "react";
import { BookMarked, Plus } from "lucide-react";

import { AbilityList } from "@/components/character/ability-list";
import { AbilitySheet } from "@/components/character/ability-sheet";
import { ClassPicker } from "@/components/character/class-picker";
import { TalentPicker } from "@/components/character/talent-picker";
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
import { Button } from "@/components/ui/button";
import type { AbilityRow } from "@/lib/database.types";
import type { SystemDef } from "@/lib/systems";

const TEXTOS = {
  classe: {
    titulo: "Habilidades de classe",
    descricao:
      "O que a classe dá em cada nível. Passiva vale sempre, ativa você liga na hora do uso.",
    botao: "Adicionar habilidade",
    vazio: "Nenhuma habilidade de classe ainda.",
  },
  fluxo: {
    titulo: "Fluxo",
    descricao:
      "Habilidades que o personagem tem por si, sem depender de item. Nem todo personagem tem.",
    botao: "Adicionar fluxo",
    vazio: "Este personagem não tem habilidades de fluxo.",
  },
  talento: {
    titulo: "Talentos",
    descricao: "Talentos adquiridos ao longo da campanha.",
    botao: "Adicionar talento",
    vazio: "Nenhum talento ainda.",
  },
} as const;

export function AbilityTab({
  characterId,
  source,
  system,
  abilities,
  onToggle,
  onSaved,
  onDelete,
  onRecharge,
}: {
  characterId: string;
  source: "fluxo" | "talento" | "classe";
  system: SystemDef;
  /** Lista completa: a aba filtra pela própria fonte. */
  abilities: AbilityRow[];
  onToggle: (ability: AbilityRow, next: boolean) => void;
  onSaved: (ability: AbilityRow, created: boolean) => void;
  onDelete: (ability: AbilityRow) => void;
  onRecharge: (ability: AbilityRow) => void;
}) {
  const [editing, setEditing] = useState<AbilityRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AbilityRow | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const texto = TEXTOS[source];
  const minhas = abilities.filter((ability) => ability.source === source);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mr-auto">
          <h2 className="text-display text-lg font-semibold">
            {texto.titulo}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {minhas.length}
            </span>
          </h2>
          <p className="mt-0.5 max-w-lg text-sm text-muted-foreground">
            {texto.descricao}
          </p>
        </div>
        <div className="flex gap-2">
          {(source === "talento" || source === "classe") && (
            <Button variant="outline" onClick={() => setPickerOpen(true)}>
              <BookMarked />
              Do guia
            </Button>
          )}
          <Button
            onClick={() => {
              setEditing(null);
              setSheetOpen(true);
            }}
          >
            <Plus />
            {texto.botao}
          </Button>
        </div>
      </div>

      <AbilityList
        abilities={minhas}
        onToggle={onToggle}
        onEdit={(ability) => {
          setEditing(ability);
          setSheetOpen(true);
        }}
        onDelete={setPendingDelete}
        onRecharge={onRecharge}
        emptyHint={texto.vazio}
      />

      <AbilitySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        characterId={characterId}
        source={source}
        system={system}
        ability={editing}
        onSaved={onSaved}
      />

      {source === "talento" && (
        <TalentPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          characterId={characterId}
          jaTenho={minhas.map((ability) => ability.name)}
          onAdded={(ability) => onSaved(ability, true)}
        />
      )}

      {source === "classe" && (
        <ClassPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          characterId={characterId}
          system={system}
          existentes={minhas}
          onSaved={onSaved}
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
              Os efeitos dela saem da conta de combate. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) onDelete(pendingDelete);
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
