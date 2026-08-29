"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CharacterWithSignedUrls } from "@/lib/database.types";
import {
  DEFAULT_SYSTEM_ID,
  getSystem,
  SYSTEM_ITEMS,
  SYSTEMS,
} from "@/lib/systems";

export function NewCharacterDialog({
  onCreated,
}: {
  onCreated: (character: CharacterWithSignedUrls) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [system, setSystem] = useState(DEFAULT_SYSTEM_ID);
  const [level, setLevel] = useState("");
  const [saving, setSaving] = useState(false);

  const preset = getSystem(system);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Dê um nome ao personagem");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          system,
          level: level.trim() || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Falha ao criar");

      onCreated(payload.character as CharacterWithSignedUrls);
      toast.success(`${payload.character.name} entrou no cofre`);

      setName("");
      setLevel("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao criar personagem",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Criar personagem
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-display">Novo personagem</DialogTitle>
            <DialogDescription>
              O resto da ficha (atributos, itens, imagens) você preenche depois,
              dentro do personagem.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="char-name">Nome</Label>
              <Input
                id="char-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Vandrel, o Errante"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="char-system">Sistema</Label>
              <Select
                items={SYSTEM_ITEMS}
                value={system}
                onValueChange={(value) => setSystem(value as string)}
              >
                <SelectTrigger id="char-system" className="w-full">
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
              <Label htmlFor="char-level">{preset.levelLabel}</Label>
              <Input
                id="char-level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder={preset.levelPlaceholder}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
