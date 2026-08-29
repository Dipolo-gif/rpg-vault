import { auth, fail, ok, parseBody, UNAUTHORIZED } from "@/lib/api";
import { signPaths } from "@/lib/storage";
import { createCharacterSchema } from "@/lib/validation";

/** GET /api/characters :: lista os personagens do usuario logado. */
export async function GET() {
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return fail(error.message, 500);

  const urls = await signPaths(
    supabase,
    (data ?? []).map((c) => c.avatar_path),
  );

  return ok({
    characters: (data ?? []).map((character) => ({
      ...character,
      avatar_url: character.avatar_path
        ? (urls.get(character.avatar_path) ?? null)
        : null,
    })),
  });
}

/** POST /api/characters :: cria um personagem (o trigger cria os stats). */
export async function POST(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const { data: body, error: badBody } = await parseBody(
    request,
    createCharacterSchema,
  );
  if (badBody) return badBody;

  const { data, error } = await supabase
    .from("characters")
    .insert({
      user_id: user.id,
      name: body.name,
      system: body.system,
      level: body.level ?? null,
    })
    .select("*")
    .single();

  if (error) return fail(error.message, 500);

  return ok({ character: { ...data, avatar_url: null } }, 201);
}
