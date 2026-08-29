"use client";

import Link from "next/link";
import { Star, Trash2, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CharacterWithSignedUrls } from "@/lib/database.types";
import { systemLabel } from "@/lib/systems";

export function CharacterCard({
  character,
  onToggleFavorite,
  onDelete,
}: {
  character: CharacterWithSignedUrls;
  onToggleFavorite: (character: CharacterWithSignedUrls) => void;
  onDelete: (character: CharacterWithSignedUrls) => void;
}) {
  return (
    <div className="group vault-panel relative overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
      <Link
        href={`/characters/${character.id}`}
        className="block focus-visible:outline-none"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary/40">
          {character.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={character.avatar_url}
              alt={character.name}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/40">
              <User className="size-12" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="text-display truncate text-lg leading-tight font-semibold">
              {character.name}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {character.level || "Sem nivel definido"}
            </p>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 border-t border-border/60 px-3 py-2">
        <Badge
          variant="outline"
          className="truncate border-primary/30 text-primary"
        >
          {systemLabel(character.system)}
        </Badge>

        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              character.is_favorite
                ? "Remover dos favoritos"
                : "Marcar como favorito"
            }
            onClick={() => onToggleFavorite(character)}
          >
            <Star
              className={
                character.is_favorite
                  ? "size-4 fill-primary text-primary"
                  : "size-4 text-muted-foreground"
              }
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Apagar personagem"
            onClick={() => onDelete(character)}
          >
            <Trash2 className="size-4 text-muted-foreground transition-colors hover:text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
