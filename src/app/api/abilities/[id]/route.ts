import { auth, fail, ok, parseBody, UNAUTHORIZED } from "@/lib/api";
import type { MagicItemRow } from "@/lib/database.types";
import { updateAbilitySchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/abilities/[id]
 *
 * Também é por aqui que se liga e desliga uma habilidade ativa. Ligar uma que
 * custa carga desconta do item, e desligar não devolve: cada ativação custa,
 * como na mesa.
 */
export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data: body, error: badBody } = await parseBody(
    request,
    updateAbilitySchema,
  );
  if (badBody) return badBody;

  const { data: ability } = await supabase
    .from("abilities")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ability) return fail("Habilidade não encontrada", 404);

  const kind = body.kind ?? ability.kind;
  const passive = kind === "passive";
  const ligando = body.is_active === true && !ability.is_active;

  let item: MagicItemRow | null = null;
  if (ability.item_id) {
    const { data } = await supabase
      .from("magic_items")
      .select("*")
      .eq("id", ability.item_id)
      .eq("user_id", user.id)
      .maybeSingle();
    item = data ?? null;
  }

  if (ligando) {
    if (passive) {
      return fail("Habilidade passiva não liga nem desliga", 422);
    }
    if (item && !item.equipped) {
      return fail(`Ative o item "${item.name}" antes da habilidade`, 409);
    }

    // Habilidade com uso proprio (a Ultimate 1/semana) gasta um uso.
    const usoMaximo = body.uses_max ?? ability.uses_max;
    if (usoMaximo !== null) {
      const restante = body.uses_current ?? ability.uses_current ?? 0;
      if (restante <= 0) {
        return fail(`"${ability.name}" nao tem usos restantes`, 409);
      }
      body.uses_current = restante - 1;
    }

    const custo = body.charge_cost ?? ability.charge_cost;
    if (custo > 0) {
      if (!item) {
        return fail("Custo em cargas só existe em habilidade de item", 422);
      }
      if (item.charges_current === null) {
        return fail(`O item "${item.name}" não controla cargas`, 409);
      }

      // Desconto atômico: ler e gravar em passos separados deixa duas
      // ativações seguidas lerem o mesmo saldo e gastarem só uma vez.
      const { data: restante, error: chargeError } = await supabase.rpc(
        "consome_cargas",
        { p_item: item.id, p_custo: custo },
      );

      if (chargeError) return fail(chargeError.message, 500);
      if (restante === null) {
        return fail(
          `Cargas insuficientes: ${item.charges_current} de ${custo}`,
          409,
        );
      }

      item = { ...item, charges_current: restante };
    }
  }

  const patch = {
    ...body,
    ...(body.kind ? { kind: body.kind } : {}),
    // O banco recusa passiva ligada ou com custo, então normaliza antes.
    ...(passive ? { is_active: false, charge_cost: 0 } : {}),
  };

  const { data, error } = await supabase
    .from("abilities")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) return fail(error.message, 500);
  if (!data) return fail("Habilidade não encontrada", 404);

  return ok({ ability: data, item });
}

/** DELETE /api/abilities/[id] */
export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { error, count } = await supabase
    .from("abilities")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return fail(error.message, 500);
  if (!count) return fail("Habilidade não encontrada", 404);

  return ok({ deleted: id });
}
