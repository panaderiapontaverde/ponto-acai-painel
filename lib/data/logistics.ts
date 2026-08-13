import { createClient } from "@/lib/supabase/server";
import type { LogisticsSnapshot } from "@/lib/types/database";

/**
 * Busca o snapshot de logística mais recente disponível (período mais
 * recente por period_end). logistics_snapshots ainda não tem coluna
 * `granularity` — o período (period_start/period_end) é a única
 * referência temporal. Também calcula a divergência Gami x iFood quando
 * ambos os números existirem; se `ifood_deliveries_count` estiver nulo (o
 * caso hoje), não inventa a divergência — deixa explícito que só há dado
 * do lado Gami.
 */
export async function getLatestLogisticsSnapshot(): Promise<{
  snapshot: LogisticsSnapshot | null;
  divergence: number | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("logistics_snapshots")
    .select("*")
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "[getLatestLogisticsSnapshot] erro ao consultar logistics_snapshots",
      error
    );
    return { snapshot: null, divergence: null };
  }

  const snapshot = (data as LogisticsSnapshot | null) ?? null;

  let divergence: number | null = null;
  if (
    snapshot &&
    snapshot.deliveries_count !== null &&
    snapshot.ifood_deliveries_count !== null
  ) {
    divergence = snapshot.deliveries_count - snapshot.ifood_deliveries_count;
  }

  return { snapshot, divergence };
}
