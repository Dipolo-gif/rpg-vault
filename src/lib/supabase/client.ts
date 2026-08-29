"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { SUPABASE_KEY, SUPABASE_URL, assertSupabaseEnv } from "./config";

/** Client para uso dentro de componentes "use client". */
export function createClient() {
  assertSupabaseEnv();
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_KEY);
}
