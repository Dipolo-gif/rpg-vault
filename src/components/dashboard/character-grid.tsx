"use client";

import { useMemo, useState } from "react";
import { Search, ShieldPlus } from "lucide-react";
import { toast } from "sonner";

import { CharacterCard } from "@/components/dashboard/character-card";
import { NewCharacterDialog } from "@/components/dashboard/new-character-dialog";
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
import { Input } from "@/components/ui/input";
import type { CharacterWithSignedUrls } from "@/lib/database.types";
import { systemLabel } from "@/lib/systems";

export function CharacterGrid({
  initialCharacters,
}: {
  initialCharacters: CharacterWithSignedUrls[];
}) {
  const [characters, setCharacters] = useState(initialCharacters);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] =
    useState<CharacterWithSignedUrls | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return characters;
    return characters.filter((character) =>
      [character.name, character.level ?? "", systemLabel(character.system)]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [characters, query]);

  function sortCharacters(list: CharacterWithSignedUrls[]) {
    return [...list].sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
      return b.created_at.localeCompare(a.created_at);
    });
  }

  async function toggleFavorite(character: CharacterWithSignedUrls) {
    const next = !character.is_favorite;

    // Atualiza na hora e desfaz se a API reclamar.
    setCharacters((current) =>
      sortCharacters(
        current.map((item) =>
          item.id === character.id ? { ...item, is_favorite: next } : item,
        ),
      ),
    );

    const response = await fetch(`/api/characters/${character.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: next }),
    });

    if (!response.ok) {
      setCharacters((current) =>
        sortCharacters(
          current.map((item) =>
            item.id === character.id
              ? { ...item, is_favorite: !next }
              : item,
          ),
        ),
      );
      toast.error("Não foi possível salvar o favorito");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    const response = await fetch(`/api/characters/${target.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Não foi possível apagar o personagem");
      return;
    }

    setCharacters((current) => current.filter((item) => item.id !== target.id));
    toast.success(`${target.name} saiu do cofre`);
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">
            Meus personagens
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {characters.length === 0
              ? "O cofre está vazio."
              : `${characters.length} ${characters.length === 1 ? "ficha guardada" : "fichas guardadas"}.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar"
              className="w-44 pl-8 sm:w-56"
              aria-label="Buscar personagem"
            />
          </div>
          <NewCharacterDialog
            onCreated={(character) =>
              setCharacters((current) => sortCharacters([character, ...current]))
            }
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="vault-panel flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-20 text-center">
          <ShieldPlus className="mb-4 size-10 text-muted-foreground/50" />
          <h2 className="text-display text-xl font-semibold">
            {characters.length === 0
              ? "Nenhum personagem ainda"
              : "Nada encontrado"}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {characters.length === 0
              ? "Crie a primeira ficha e depois anexe atributos, itens mágicos, o PDF da ficha e a galeria de tokens."
              : "Tente outro termo de busca."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onToggleFavorite={toggleFavorite}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Apagar {pendingDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              A ficha, os atributos, os itens mágicos, o PDF e todas as imagens
              desse personagem serão apagados. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
