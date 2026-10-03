import { auth, fail, ok, parseBody, UNAUTHORIZED } from "@/lib/api";
import { updateSpellSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/spells/[id] :: também é por aqui que se prepara e desprepara. */
export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data: body, error: badBody } = await parseBody(
    request,
    updateSpellSchema,
  );
  if (badBody) return badBody;

  const { data, error } = await supabase
    .from("spells")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error?.code === "23505") {
    return fail("Já existe uma magia com esse nome neste personagem", 409);
  }
  if (error) return fail(error.message, 500);
  if (!data) return fail("Magia não encontrada", 404);

  return ok({ spell: data });
}

/** DELETE /api/spells/[id] */
export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { error, count } = await supabase
    .from("spells")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return fail(error.message, 500);
  if (!count) return fail("Magia não encontrada", 404);

  return ok({ deleted: id });
}
