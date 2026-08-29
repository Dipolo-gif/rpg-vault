import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { SUPABASE_KEY, SUPABASE_URL, assertSupabaseEnv } from "./config";

/**
 * Client para Server Components, Route Handlers e Server Actions.
 * Sempre chamado por requisicao: ele carrega os cookies daquele usuario,
 * entao a RLS do Postgres enxerga o auth.uid() correto.
 */
export async function createClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component nao pode escrever cookie. O proxy ja renova a
          // sessao antes da renderizacao, entao aqui da para ignorar.
        }
      },
    },
  });
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Usado em paginas: sem sessao valida, manda para o login. */
export async function requireUser(): Promise<{
  supabase: SupabaseServerClient;
  user: User;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

/** Usado em rotas de API: sem sessao valida, devolve null para virar 401. */
export async function getSessionUser(): Promise<{
  supabase: SupabaseServerClient;
  user: User | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}
