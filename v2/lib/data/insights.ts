import { createClient } from "@/lib/supabase/server";
import type { Insight } from "@/lib/types/database";

/**
 * Busca os insights ativos mais recentes (gerados pela função determinística
 * `generate_deterministic_insights`, rodada via SQL após cada coleta).
 * Nunca chama IA no carregamento da página — os insights já estão
 * pré-calculados e persistidos.
 */
export async function getActiveInsights(module?: string, limit = 10): Promise<Insight[]> {
  const supabase = createClient();

  let query = supabase
    .from("insights")
    .select("*")
    .eq("active", true)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (module) {
    query = query.eq("module", module);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getActiveInsights] erro ao consultar insights", error);
    return [];
  }

  return (data ?? []) as Insight[];
}
