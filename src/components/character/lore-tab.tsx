"use client";

import { useState } from "react";
import { BookOpen, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, apiJson } from "@/lib/client-api";
import type { CharacterWithSignedUrls } from "@/lib/database.types";

export function LoreTab({
  character,
  onCharacterChange,
}: {
  character: CharacterWithSignedUrls;
  onCharacterChange: (character: CharacterWithSignedUrls) => void;
}) {
  const [story, setStory] = useState(character.background_story ?? "");
  const [saving, setSaving] = useState(false);

  const dirty = story !== (character.background_story ?? "");
  const words = story.trim() ? story.trim().split(/\s+/).length : 0;

  async function save() {
    setSaving(true);
    try {
      const payload = await apiFetch<{ character: CharacterWithSignedUrls }>(
        `/api/characters/${character.id}`,
        apiJson("PATCH", { background_story: story || null }),
      );
      onCharacterChange({
        ...payload.character,
        avatar_url: character.avatar_url,
      });
      toast.success("História salva");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-primary" />
        <h2 className="text-display mr-auto text-lg font-semibold">
          História e lore
        </h2>
        <span className="text-xs text-muted-foreground">
          {words} {words === 1 ? "palavra" : "palavras"}
        </span>
        <Button onClick={save} disabled={saving || !dirty} size="sm">
          {saving ? <Loader2 className="animate-spin" /> : <Save className="size-3.5" />}
          Salvar
        </Button>
      </div>

      <Textarea
        value={story}
        onChange={(event) => setStory(event.target.value)}
        placeholder="Origem, motivações, vínculos, defeitos, o que aconteceu na última sessão..."
        className="min-h-[55vh] leading-relaxed"
      />
    </div>
  );
}
