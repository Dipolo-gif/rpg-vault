import type { SupabaseServerClient } from "@/lib/supabase/server";

export const BUCKET = "vault";

/** Uma hora. As URLs assinadas sao geradas a cada render, entao nao precisam durar mais. */
export const SIGNED_URL_TTL = 60 * 60;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const IMAGE_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
];

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

export function extensionFor(file: File): string {
  const fromMime = EXT_BY_MIME[file.type];
  if (fromMime) return fromMime;
  const fromName = file.name.split(".").pop();
  return fromName && fromName.length <= 5 ? fromName.toLowerCase() : "bin";
}

/**
 * Caminho no bucket. A primeira pasta e sempre o id do dono porque a policy
 * de storage.objects compara (storage.foldername(name))[1] com auth.uid().
 */
export function buildPath(
  userId: string,
  characterId: string,
  folder: string,
  file: File,
): string {
  const id = crypto.randomUUID();
  return `${userId}/${characterId}/${folder}/${id}.${extensionFor(file)}`;
}

export function characterFolder(userId: string, characterId: string) {
  return `${userId}/${characterId}`;
}

export async function signPath(
  supabase: SupabaseServerClient,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

/** Assina varios caminhos de uma vez e devolve um mapa path -> url. */
export async function signPaths(
  supabase: SupabaseServerClient,
  paths: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean) as string[])];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL);

  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) map.set(entry.path, entry.signedUrl);
  }
  return map;
}

/** Remove recursivamente tudo que estiver embaixo de um prefixo. */
export async function removeFolder(
  supabase: SupabaseServerClient,
  prefix: string,
) {
  const folders = ["avatar", "sheet", "assets", "items"];
  const paths: string[] = [];

  for (const folder of folders) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .list(`${prefix}/${folder}`, { limit: 1000 });
    for (const file of data ?? []) {
      if (file.name) paths.push(`${prefix}/${folder}/${file.name}`);
    }
  }

  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }
}
