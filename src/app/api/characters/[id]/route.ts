import {
  auth,
  fail,
  loadOwnedCharacter,
  NOT_FOUND,
  ok,
  parseBody,
  UNAUTHORIZED,
} from "@/lib/api";
import { characterFolder, removeFolder, signPath, signPaths } from "@/lib/storage";
import { updateCharacterSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/characters/[id] :: ficha completa com URLs assinadas. */
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const character = await loadOwnedCharacter(supabase, user.id, id);
  if (!character) return NOT_FOUND();

  const [{ data: stats }, { data: items }, { data: assets }, { data: abilities }] =
    await Promise.all([
      supabase
        .from("character_stats")
        .select("*")
        .eq("character_id", id)
        .maybeSingle(),
      supabase
        .from("magic_items")
        .select("*")
        .eq("character_id", id)
        .order("sort_order")
        .order("created_at"),
      supabase
        .from("assets")
        .select("*")
        .eq("character_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("abilities")
        .select("*")
        .eq("character_id", id)
        .order("sort_order")
        .order("created_at"),
    ]);

  const urls = await signPaths(supabase, [
    character.avatar_path,
    ...(items ?? []).map((i) => i.image_path),
    ...(assets ?? []).map((a) => a.file_path),
  ]);

  return ok({
    character: {
      ...character,
      avatar_url: character.avatar_path
        ? (urls.get(character.avatar_path) ?? null)
        : null,
    },
    stats: stats ?? null,
    items: (items ?? []).map((item) => ({
      ...item,
      image_url: item.image_path ? (urls.get(item.image_path) ?? null) : null,
    })),
    assets: (assets ?? []).map((asset) => ({
      ...asset,
      url: urls.get(asset.file_path) ?? null,
    })),
    abilities: abilities ?? [],
    pdf_url: await signPath(supabase, character.pdf_path),
  });
}

/** PATCH /api/characters/[id] :: edita dados basicos e a lore. */
export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data: body, error: badBody } = await parseBody(
    request,
    updateCharacterSchema,
  );
  if (badBody) return badBody;

  const { data, error } = await supabase
    .from("characters")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) return fail(error.message, 500);
  if (!data) return NOT_FOUND();

  return ok({ character: data });
}

/** DELETE /api/characters/[id] :: apaga a ficha e os arquivos do Storage. */
export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const character = await loadOwnedCharacter(supabase, user.id, id);
  if (!character) return NOT_FOUND();

  // O cascade do Postgres limpa stats, itens e assets. Os binarios do Storage
  // ficam de fora do cascade, entao precisam ser removidos na mao.
  await removeFolder(supabase, characterFolder(user.id, id));

  const { error } = await supabase
    .from("characters")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return fail(error.message, 500);

  return ok({ deleted: id });
}
