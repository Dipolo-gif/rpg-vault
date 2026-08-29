import {
  auth,
  fail,
  loadOwnedCharacter,
  NOT_FOUND,
  ok,
  UNAUTHORIZED,
} from "@/lib/api";
import { buildPath, IMAGE_MIME, signPath, signPaths } from "@/lib/storage";
import { putObject, readUpload, removeObjects } from "@/lib/upload";
import { assetKindSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/characters/[id]/assets :: galeria com URLs assinadas. */
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: false });

  if (error) return fail(error.message, 500);

  const urls = await signPaths(
    supabase,
    (data ?? []).map((a) => a.file_path),
  );

  return ok({
    assets: (data ?? []).map((asset) => ({
      ...asset,
      url: urls.get(asset.file_path) ?? null,
    })),
  });
}

/**
 * POST /api/characters/[id]/assets
 * multipart/form-data com "file", e opcionalmente "file_type" e "title".
 */
export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const character = await loadOwnedCharacter(supabase, user.id, id);
  if (!character) return NOT_FOUND();

  const { file, form, error: badUpload } = await readUpload(request, IMAGE_MIME);
  if (badUpload) return badUpload;

  const kind = assetKindSchema.safeParse(form.get("file_type"));
  const rawTitle = form.get("title");
  const title =
    typeof rawTitle === "string" && rawTitle.trim().length > 0
      ? rawTitle.trim().slice(0, 160)
      : file.name.slice(0, 160);

  const path = buildPath(user.id, id, "assets", file);
  const { error: uploadError } = await putObject(supabase, path, file);
  if (uploadError) return fail(uploadError.message, 500);

  const { data, error } = await supabase
    .from("assets")
    .insert({
      character_id: id,
      file_path: path,
      file_type: kind.success ? kind.data : "other",
      mime_type: file.type,
      size_bytes: file.size,
      title,
    })
    .select("*")
    .single();

  if (error) {
    // Se a linha nao entrou, o binario orfao sai junto.
    await removeObjects(supabase, [path]);
    return fail(error.message, 500);
  }

  return ok({ asset: { ...data, url: await signPath(supabase, path) } }, 201);
}
