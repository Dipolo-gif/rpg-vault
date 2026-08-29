import {
  auth,
  fail,
  loadOwnedCharacter,
  NOT_FOUND,
  ok,
  parseBody,
  UNAUTHORIZED,
} from "@/lib/api";
import { updateStatsSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PUT /api/characters/[id]/stats
 * Grava atributos e vitals. Como sao JSONB, o formato varia por sistema.
 */
export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const character = await loadOwnedCharacter(supabase, user.id, id);
  if (!character) return NOT_FOUND();

  const { data: body, error: badBody } = await parseBody(
    request,
    updateStatsSchema,
  );
  if (badBody) return badBody;

  const { data, error } = await supabase
    .from("character_stats")
    .update(body)
    .eq("character_id", id)
    .select("*")
    .maybeSingle();

  if (error) return fail(error.message, 500);

  // Rede de seguranca: fichas criadas antes do trigger nao tem linha de stats.
  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from("character_stats")
      .insert({ character_id: id, ...body })
      .select("*")
      .single();

    if (insertError) return fail(insertError.message, 500);
    return ok({ stats: created }, 201);
  }

  return ok({ stats: data });
}
