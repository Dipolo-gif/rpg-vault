"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Gauge,
  Loader2,
  Pencil,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { VitalsSheet } from "@/components/character/vitals-sheet";
import { Badge } from "@/components/ui/badge";
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
import { apiFetch, apiJson } from "@/lib/client-api";
import type {
  CharacterStatsRow,
  CharacterWithSignedUrls,
} from "@/lib/database.types";
import { getSystem, SYSTEM_ITEMS, SYSTEMS, type SystemDef } from "@/lib/systems";
import { readVital, vitalPercent } from "@/lib/vitals";

export function CharacterHero({
  character,
  onCharacterChange,
  stats,
  onStatsChange,
  system,
}: {
  character: CharacterWithSignedUrls;
  onCharacterChange: (character: CharacterWithSignedUrls) => void;
  stats: CharacterStatsRow;
  onStatsChange: (stats: CharacterStatsRow) => void;
  system: SystemDef;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showVitals, setShowVitals] = useState(false);

  const [name, setName] = useState(character.name);
  const [systemId, setSystemId] = useState(character.system);
  const [level, setLevel] = useState(character.level ?? "");
  const [saving, setSaving] = useState(false);

  // Primeiro medidor com máximo: é o que aparece no cabeçalho.
  const mainVital = system.vitals.find((vital) => vital.hasMax);
  const mainValue = mainVital ? readVital(stats.vitals, mainVital) : null;

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const payload = await apiFetch<{ character: CharacterWithSignedUrls }>(
        `/api/characters/${character.id}/avatar`,
        { method: "POST", body: form },
      );
      onCharacterChange(payload.character);
      toast.success("Avatar atualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  async function saveIdentity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = await apiFetch<{ character: CharacterWithSignedUrls }>(
        `/api/characters/${character.id}`,
        apiJson("PATCH", {
          name: name.trim(),
          system: systemId,
          level: level.trim() || null,
        }),
      );
      onCharacterChange({
        ...payload.character,
        avatar_url: character.avatar_url,
      });
      toast.success("Ficha atualizada");
      setEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao cofre
      </Link>

      <section className="vault-panel flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="relative shrink-0">
          <div className="size-24 overflow-hidden rounded-xl border border-border bg-secondary/40">
            {character.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={character.avatar_url}
                alt={character.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground/40">
                <User className="size-8" />
              </div>
            )}
          </div>

          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -right-2 -bottom-2 rounded-full shadow"
            aria-label="Trocar avatar"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
          </Button>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadAvatar(file);
              event.target.value = "";
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-display truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {character.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              {getSystem(character.system).label}
            </Badge>
            {character.level && (
              <Badge variant="secondary">{character.level}</Badge>
            )}
          </div>

          {mainVital && mainValue && (
            <div className="mt-4 max-w-xs">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{mainVital.label}</span>
                <span className="font-mono">
                  {mainValue.current} / {mainValue.max ?? 0}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all ${mainVital.bar}`}
                  style={{ width: `${vitalPercent(mainValue)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => setShowVitals(true)}>
            <Gauge />
            Status
          </Button>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil />
            Editar
          </Button>
        </div>
      </section>

      <VitalsSheet
        open={showVitals}
        onOpenChange={setShowVitals}
        characterId={character.id}
        system={system}
        stats={stats}
        onSaved={onStatsChange}
      />

      <Sheet open={editing} onOpenChange={setEditing}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-display">Editar personagem</SheetTitle>
            <SheetDescription>
              Nome, sistema e nível. Trocar o sistema muda os campos sugeridos,
              sem apagar o que já estava salvo.
            </SheetDescription>
          </SheetHeader>

          <form
            id="identity-form"
            onSubmit={saveIdentity}
            className="flex-1 space-y-4 overflow-y-auto px-4"
          >
            <div className="space-y-2">
              <Label htmlFor="hero-name">Nome</Label>
              <Input
                id="hero-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero-system">Sistema</Label>
              <Select
                items={SYSTEM_ITEMS}
                value={systemId}
                onValueChange={(value) => setSystemId(value as string)}
              >
                <SelectTrigger id="hero-system" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYSTEMS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero-level">
                {getSystem(systemId).levelLabel}
              </Label>
              <Input
                id="hero-level"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                placeholder={getSystem(systemId).levelPlaceholder}
              />
            </div>
          </form>

          <SheetFooter>
            <Button type="submit" form="identity-form" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Salvar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
