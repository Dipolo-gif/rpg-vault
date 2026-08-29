import { auth, fail, ok, parseBody, UNAUTHORIZED } from "@/lib/api";
import { removeObjects } from "@/lib/upload";
import { updateAssetSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/assets/[id] :: renomeia ou reclassifica um asset. */
export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data: body, error: badBody } = await parseBody(
    request,
    updateAssetSchema,
  );
  if (badBody) return badBody;

  const { data, error } = await supabase
    .from("assets")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) return fail(error.message, 500);
  if (!data) return fail("Asset nao encontrado", 404);

  return ok({ asset: data });
}

/** DELETE /api/assets/[id] :: remove o registro e o binario. */
export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data: asset } = await supabase
    .from("assets")
    .select("file_path, character_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!asset) return fail("Asset nao encontrado", 404);

  const { error } = await supabase
    .from("assets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return fail(error.message, 500);

  await removeObjects(supabase, [asset.file_path]);

  // Se esse arquivo era o avatar do personagem, o avatar volta a ficar vazio.
  await supabase
    .from("characters")
    .update({ avatar_path: null })
    .eq("id", asset.character_id)
    .eq("user_id", user.id)
    .eq("avatar_path", asset.file_path);

  return ok({ deleted: id });
}
