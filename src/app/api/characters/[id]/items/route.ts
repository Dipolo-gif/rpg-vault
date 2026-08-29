import {
  auth,
  fail,
  loadOwnedCharacter,
  NOT_FOUND,
  ok,
  parseBody,
  UNAUTHORIZED,
} from "@/lib/api";
import { signPaths } from "@/lib/storage";
import { createItemSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/characters/[id]/items */
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data, error } = await supabase
    .from("magic_items")
    .select("*")
    .eq("character_id", id)
    .order("sort_order")
    .order("created_at");

  if (error) return fail(error.message, 500);

  const urls = await signPaths(
    supabase,
    (data ?? []).map((i) => i.image_path),
  );

  return ok({
    items: (data ?? []).map((item) => ({
      ...item,
      image_url: item.image_path ? (urls.get(item.image_path) ?? null) : null,
    })),
  });
}

/** POST /api/characters/[id]/items :: cria um item magico. */
export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const character = await loadOwnedCharacter(supabase, user.id, id);
  if (!character) return NOT_FOUND();

  const { data: body, error: badBody } = await parseBody(
    request,
    createItemSchema,
  );
  if (badBody) return badBody;

  const { count } = await supabase
    .from("magic_items")
    .select("id", { count: "exact", head: true })
    .eq("character_id", id);

  const { data, error } = await supabase
    .from("magic_items")
    .insert({ character_id: id, sort_order: count ?? 0, ...body })
    .select("*")
    .single();

  if (error) return fail(error.message, 500);

  return ok({ item: { ...data, image_url: null } }, 201);
}
