import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/supabase/server";

/** Casca das telas privadas. Sem sessao, requireUser manda para o login. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "Aventureiro";

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader email={user.email ?? ""} displayName={displayName} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
