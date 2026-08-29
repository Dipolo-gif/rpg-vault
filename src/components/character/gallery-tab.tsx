"use client";

import { useMemo, useRef, useState } from "react";
import {
  Download,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
  UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, apiJson } from "@/lib/client-api";
import type {
  AssetKind,
  AssetWithUrl,
  CharacterWithSignedUrls,
} from "@/lib/database.types";
import { ASSET_KIND_ITEMS } from "@/lib/systems";
import { cn } from "@/lib/utils";

const FILTERS: { id: AssetKind | "all"; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "token", label: "Tokens" },
  { id: "portrait", label: "Retratos" },
  { id: "full_body", label: "Corpo inteiro" },
  { id: "map", label: "Mapas" },
  { id: "handout", label: "Handouts" },
  { id: "other", label: "Outros" },
];

export function GalleryTab({
  characterId,
  assets,
  onAssetsChange,
  onAvatarChange,
}: {
  characterId: string;
  assets: AssetWithUrl[];
  onAssetsChange: (assets: AssetWithUrl[]) => void;
  onAvatarChange: (character: CharacterWithSignedUrls) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<AssetKind>("token");
  const [filter, setFilter] = useState<AssetKind | "all">("all");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [lightbox, setLightbox] = useState<AssetWithUrl | null>(null);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? assets
        : assets.filter((asset) => asset.file_type === filter),
    [assets, filter],
  );

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (list.length === 0) {
      toast.error("Envie arquivos de imagem");
      return;
    }

    setUploading(true);
    const uploaded: AssetWithUrl[] = [];

    try {
      // Sequencial de propósito: mantém a ordem e evita estourar o Storage.
      for (const file of list) {
        const form = new FormData();
        form.append("file", file);
        form.append("file_type", kind);
        form.append("title", file.name);

        const payload = await apiFetch<{ asset: AssetWithUrl }>(
          `/api/characters/${characterId}/assets`,
          { method: "POST", body: form },
        );
        uploaded.push(payload.asset);
      }

      onAssetsChange([...uploaded.reverse(), ...assets]);
      toast.success(
        list.length === 1 ? "Imagem enviada" : `${list.length} imagens enviadas`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no upload");
      if (uploaded.length > 0) onAssetsChange([...uploaded.reverse(), ...assets]);
    } finally {
      setUploading(false);
    }
  }

  async function setAsAvatar(asset: AssetWithUrl) {
    try {
      const payload = await apiFetch<{ character: CharacterWithSignedUrls }>(
        `/api/characters/${characterId}/avatar`,
        apiJson("PUT", { asset_id: asset.id }),
      );
      onAvatarChange(payload.character);
      toast.success("Avatar definido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao definir");
    }
  }

  async function remove(asset: AssetWithUrl) {
    try {
      await apiFetch(`/api/assets/${asset.id}`, { method: "DELETE" });
      onAssetsChange(assets.filter((item) => item.id !== asset.id));
      toast.success("Imagem removida");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao remover");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-display mr-auto text-lg font-semibold">
          Galeria
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {assets.length} {assets.length === 1 ? "arquivo" : "arquivos"}
          </span>
        </h2>

        <Select
          items={ASSET_KIND_ITEMS}
          value={kind}
          onValueChange={(value) => setKind(value as AssetKind)}
        >
          <SelectTrigger className="w-40" aria-label="Categoria do upload">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ASSET_KIND_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
          Enviar imagens
        </Button>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) void uploadFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files?.length) {
            void uploadFiles(event.dataTransfer.files);
          }
        }}
        className={cn(
          "vault-panel rounded-2xl border border-dashed border-border px-6 py-8 text-center transition-colors",
          dragging && "border-primary/60 bg-primary/5",
        )}
      >
        <ImageIcon className="mx-auto mb-2 size-7 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Arraste imagens aqui. Elas entram como{" "}
          <span className="text-foreground">
            {ASSET_KIND_ITEMS[kind]?.toLowerCase()}
          </span>{" "}
          e ficam vinculadas a este personagem.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((option) => (
          <Button
            key={option.id}
            size="sm"
            variant={filter === option.id ? "secondary" : "ghost"}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nada nesta categoria ainda.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {filtered.map((asset) => (
            <figure
              key={asset.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-secondary/30"
            >
              <button
                type="button"
                onClick={() => setLightbox(asset)}
                className="block w-full"
                aria-label={`Ver ${asset.title ?? "imagem"}`}
              >
                <div
                  className={cn(
                    "flex items-center justify-center",
                    asset.file_type === "token"
                      ? "aspect-square p-3"
                      : "aspect-[3/4]",
                  )}
                >
                  {asset.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={asset.url}
                      alt={asset.title ?? ""}
                      className={cn(
                        "size-full",
                        asset.file_type === "token"
                          ? "rounded-full object-contain"
                          : "object-cover",
                      )}
                    />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground/40" />
                  )}
                </div>
              </button>

              <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-background/95 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon-sm"
                  variant="secondary"
                  aria-label="Usar como avatar"
                  title="Usar como avatar"
                  onClick={() => setAsAvatar(asset)}
                >
                  <UserRoundCheck className="size-3.5" />
                </Button>
                {asset.url && (
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    nativeButton={false}
                    aria-label="Baixar"
                    title="Baixar"
                    render={
                      <a
                        href={`${asset.url}&download=${encodeURIComponent(asset.title ?? "asset")}`}
                      />
                    }
                  >
                    <Download className="size-3.5" />
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="secondary"
                  aria-label="Remover"
                  title="Remover"
                  className="ml-auto"
                  onClick={() => remove(asset)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </figcaption>

              <Badge
                variant="secondary"
                className="pointer-events-none absolute top-1.5 left-1.5 text-[0.65rem]"
              >
                {ASSET_KIND_ITEMS[asset.file_type]}
              </Badge>
            </figure>
          ))}
        </div>
      )}

      <Dialog
        open={lightbox !== null}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">
              {lightbox?.title ?? "Imagem"}
            </DialogTitle>
          </DialogHeader>
          {lightbox?.url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={lightbox.url}
              alt={lightbox.title ?? ""}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
