import { auth, fail, ok, UNAUTHORIZED } from "@/lib/api";
import { buildPath, IMAGE_MIME, signPath } from "@/lib/storage";
import { putObject, readUpload, removeObjects } from "@/lib/upload";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/items/[id]/image :: troca a arte do item (multipart, campo "file"). */
export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data: item } = await supabase
    .from("magic_items")
    .select("id, character_id, image_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!item) return fail("Item nao encontrado", 404);

  const { file, error: badUpload } = await readUpload(request, IMAGE_MIME);
  if (badUpload) return badUpload;

  const path = buildPath(user.id, item.character_id, "items", file);
  const { error: uploadError } = await putObject(supabase, path, file);
  if (uploadError) return fail(uploadError.message, 500);

  const { data, error } = await supabase
    .from("magic_items")
    .update({ image_path: path })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    await removeObjects(supabase, [path]);
    return fail(error.message, 500);
  }

  await removeObjects(supabase, [item.image_path]);

  return ok({ item: { ...data, image_url: await signPath(supabase, path) } });
}
