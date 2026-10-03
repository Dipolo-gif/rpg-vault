import {
  auth,
  fail,
  loadOwnedCharacter,
  NOT_FOUND,
  ok,
  parseBody,
  UNAUTHORIZED,
} from "@/lib/api";
import { buscaMagia } from "@/lib/spell-catalog";
import { createSpellSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/characters/[id]/spells */
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data, error } = await supabase
    .from("spells")
    .select("*")
    .eq("character_id", id)
    .order("level")
    .order("sort_order")
    .order("name");

  if (error) return fail(error.message, 500);

  return ok({ spells: data ?? [] });
}

/**
 * POST /api/characters/[id]/spells
 *
 * Aceita dos dois jeitos: `catalog_slug` para pegar do guia, ou os campos na
 * mão para a magia que a sua mesa inventou. Vindo do guia, o servidor é quem
 * completa os dados, então o cliente não precisa carregar o catálogo inteiro.
 */
export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const character = await loadOwnedCharacter(supabase, user.id, id);
  if (!character) return NOT_FOUND();

  const { data: body, error: badBody } = await parseBody(
    request,
    createSpellSchema,
  );
  if (badBody) return badBody;

  const doGuia = body.catalog_slug ? buscaMagia(body.catalog_slug) : undefined;
  if (body.catalog_slug && !doGuia) {
    return fail("Magia não encontrada no guia", 404);
  }

  // Na ficha vale o nome em português; o inglês fica no slug, para achar a
  // página de novo.
  const name = body.name?.trim() || doGuia?.nome_pt || doGuia?.nome;
  if (!name) return fail("A magia precisa de um nome", 422);

  const { count } = await supabase
    .from("spells")
    .select("id", { count: "exact", head: true })
    .eq("character_id", id);

  const { data, error } = await supabase
    .from("spells")
    .insert({
      character_id: id,
      name,
      level: body.level ?? doGuia?.nivel ?? 0,
      school: body.school ?? doGuia?.escola ?? null,
      casting_time: body.casting_time ?? doGuia?.tempo ?? null,
      range: body.range ?? doGuia?.alcance ?? null,
      components: body.components ?? doGuia?.componentes ?? null,
      duration: body.duration ?? doGuia?.duracao ?? null,
      concentration: body.concentration ?? doGuia?.concentracao ?? false,
      ritual: body.ritual ?? false,
      prepared: body.prepared ?? true,
      always_prepared: body.always_prepared ?? false,
      catalog_slug: doGuia?.slug ?? null,
      reference_url: body.reference_url ?? doGuia?.link ?? null,
      description_html: body.description_html ?? null,
      description_text: body.description_text ?? null,
      sort_order: count ?? 0,
    })
    .select("*")
    .single();

  // O índice único guarda contra a mesma magia entrar duas vezes.
  if (error?.code === "23505") {
    return fail(`"${name}" já está na lista deste personagem`, 409);
  }
  if (error) return fail(error.message, 500);

  return ok({ spell: data }, 201);
}
