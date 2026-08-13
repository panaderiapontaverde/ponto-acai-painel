"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";
import type { Database } from "@/lib/types/database";

/**
 * Cliente Supabase para uso em Client Components (browser).
 * Usa apenas a chave "anon" pública — nunca a service_role.
 */
export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}
