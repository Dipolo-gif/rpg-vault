import { CharacterGrid } from "@/components/dashboard/character-grid";
import type { CharacterWithSignedUrls } from "@/lib/database.types";
import { signPaths } from "@/lib/storage";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Meus personagens | RPG Vault" };

// A galeria muda a cada acao do usuario, entao nada de cache estatico.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase } = await requireUser();

  // A RLS ja limita ao dono, entao o select nao precisa de where por usuario.
  const { data } = await supabase
    .from("characters")
    .select("*")
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false });

  const characters = data ?? [];
  const urls = await signPaths(
    supabase,
    characters.map((c) => c.avatar_path),
  );

  const withUrls: CharacterWithSignedUrls[] = characters.map((character) => ({
    ...character,
    avatar_url: character.avatar_path
      ? (urls.get(character.avatar_path) ?? null)
      : null,
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <CharacterGrid initialCharacters={withUrls} />
    </main>
  );
}
