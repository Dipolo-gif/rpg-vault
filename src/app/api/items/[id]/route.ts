import { auth, fail, ok, parseBody, UNAUTHORIZED } from "@/lib/api";
import { removeObjects } from "@/lib/upload";
import { updateItemSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/items/[id] :: edita um item magico. */
export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data: body, error: badBody } = await parseBody(
    request,
    updateItemSchema,
  );
  if (badBody) return badBody;

  const { data, error } = await supabase
    .from("magic_items")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) return fail(error.message, 500);
  if (!data) return fail("Item nao encontrado", 404);

  return ok({ item: data });
}

/** DELETE /api/items/[id] */
export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data: item } = await supabase
    .from("magic_items")
    .select("image_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!item) return fail("Item nao encontrado", 404);

  await removeObjects(supabase, [item.image_path]);

  const { error } = await supabase
    .from("magic_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return fail(error.message, 500);

  return ok({ deleted: id });
}
