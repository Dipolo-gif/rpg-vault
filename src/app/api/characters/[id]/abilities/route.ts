import {
  auth,
  fail,
  loadOwnedCharacter,
  NOT_FOUND,
  ok,
  parseBody,
  UNAUTHORIZED,
} from "@/lib/api";
import { createAbilitySchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/characters/[id]/abilities :: habilidades de item, fluxo e talento. */
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data, error } = await supabase
    .from("abilities")
    .select("*")
    .eq("character_id", id)
    .order("sort_order")
    .order("created_at");

  if (error) return fail(error.message, 500);

  return ok({ abilities: data ?? [] });
}

/** POST /api/characters/[id]/abilities */
export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const character = await loadOwnedCharacter(supabase, user.id, id);
  if (!character) return NOT_FOUND();

  const { data: body, error: badBody } = await parseBody(
    request,
    createAbilitySchema,
  );
  if (badBody) return badBody;

  // O banco tem um check para isso, mas errar aqui devolve mensagem melhor.
  if (body.source === "item" && body.item_id) {
    const { data: item } = await supabase
      .from("magic_items")
      .select("id")
      .eq("id", body.item_id)
      .eq("character_id", id)
      .maybeSingle();

    if (!item) return fail("Item não encontrado nesse personagem", 404);
  }

  const { count } = await supabase
    .from("abilities")
    .select("id", { count: "exact", head: true })
    .eq("character_id", id)
    .eq("source", body.source);

  const passive = body.kind === "passive";

  const { data, error } = await supabase
    .from("abilities")
    .insert({
      character_id: id,
      item_id: body.item_id ?? null,
      source: body.source,
      kind: body.kind,
      name: body.name,
      // Passiva nunca liga nem custa carga: vale enquanto a fonte valer.
      charge_cost: passive ? 0 : (body.charge_cost ?? 0),
      is_active: false,
      action_type: body.action_type ?? null,
      uses_current: body.uses_current ?? body.uses_max ?? null,
      uses_max: body.uses_max ?? null,
      uses_note: body.uses_note ?? null,
      effects: body.effects ?? {},
      description_html: body.description_html ?? null,
      description_text: body.description_text ?? null,
      sort_order: count ?? 0,
    })
    .select("*")
    .single();

  if (error) return fail(error.message, 500);

  return ok({ ability: data }, 201);
}
