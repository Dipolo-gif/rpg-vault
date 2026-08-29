import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import { getSessionUser, type SupabaseServerClient } from "@/lib/supabase/server";
import type { CharacterRow } from "@/lib/database.types";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ error: message, details: extra }, { status });
}

/**
 * Autentica a requisicao. Devolve `null` no lugar do usuario quando nao ha
 * sessao, e quem chamou responde 401.
 */
export async function auth() {
  const { supabase, user } = await getSessionUser();
  return { supabase, user };
}

/**
 * Confere se o personagem existe e pertence a quem chamou.
 *
 * A RLS ja bloqueia o acesso no banco, mas conferir aqui deixa a resposta
 * explicita (404 em vez de uma lista vazia silenciosa).
 */
export async function loadOwnedCharacter(
  supabase: SupabaseServerClient,
  userId: string,
  characterId: string,
): Promise<CharacterRow | null> {
  const { data } = await supabase
    .from("characters")
    .select("*")
    .eq("id", characterId)
    .eq("user_id", userId)
    .maybeSingle();

  return data ?? null;
}

/** Le e valida o corpo JSON. Devolve `{ error }` pronto para retornar. */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { data: null, error: fail("Corpo da requisicao nao e JSON valido") };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      data: null,
      error: fail("Dados invalidos", 422, parsed.error.issues),
    };
  }

  return { data: parsed.data, error: null };
}

export const UNAUTHORIZED = () => fail("Faca login para continuar", 401);
export const NOT_FOUND = () => fail("Personagem nao encontrado", 404);
