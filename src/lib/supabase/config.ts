/**
 * Leitura das variaveis publicas do Supabase.
 *
 * As referencias a `process.env.NEXT_PUBLIC_*` precisam ser literais para o
 * Next inlinar o valor no bundle do cliente, por isso as duas linhas abaixo
 * sao escritas por extenso em vez de montadas dinamicamente.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export function assertSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase não configurado. Copie .env.example para .env.local e preencha NEXT_PUBLIC_SUPABASE_URL e a chave pública.",
    );
  }
}
