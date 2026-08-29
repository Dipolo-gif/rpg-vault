import {
  auth,
  fail,
  loadOwnedCharacter,
  NOT_FOUND,
  ok,
  UNAUTHORIZED,
} from "@/lib/api";
import { buildPath, IMAGE_MIME, signPath } from "@/lib/storage";
import { putObject, readUpload, removeObjects } from "@/lib/upload";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/characters/[id]/avatar :: sobe uma imagem nova como avatar. */
export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const character = await loadOwnedCharacter(supabase, user.id, id);
  if (!character) return NOT_FOUND();

  const { file, error: badUpload } = await readUpload(request, IMAGE_MIME);
  if (badUpload) return badUpload;

  const path = buildPath(user.id, id, "avatar", file);
  const { error: uploadError } = await putObject(supabase, path, file);
  if (uploadError) return fail(uploadError.message, 500);

  const { data, error } = await supabase
    .from("characters")
    .update({ avatar_path: path })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    await removeObjects(supabase, [path]);
    return fail(error.message, 500);
  }

  // So apaga o avatar antigo se ele nao for tambem um asset da galeria.
  if (character.avatar_path?.includes("/avatar/")) {
    await removeObjects(supabase, [character.avatar_path]);
  }

  return ok({
    character: { ...data, avatar_url: await signPath(supabase, path) },
  });
}

/** PUT /api/characters/[id]/avatar :: promove um asset da galeria a avatar. */
export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  let assetId: string | undefined;
  try {
    const body = (await request.json()) as { asset_id?: string };
    assetId = body.asset_id;
  } catch {
    return fail("Envie { asset_id }");
  }

  if (!assetId) return fail("Envie { asset_id }");

  const { data: asset } = await supabase
    .from("assets")
    .select("file_path")
    .eq("id", assetId)
    .eq("character_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!asset) return fail("Asset nao encontrado", 404);

  const { data, error } = await supabase
    .from("characters")
    .update({ avatar_path: asset.file_path })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) return fail(error.message, 500);
  if (!data) return NOT_FOUND();

  return ok({
    character: {
      ...data,
      avatar_url: await signPath(supabase, asset.file_path),
    },
  });
}
