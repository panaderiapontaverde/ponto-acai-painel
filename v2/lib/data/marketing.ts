import { createClient } from "@/lib/supabase/server";
import type { Granularity } from "@/lib/types/database";

export interface MarketingLatestRow {
  channel: { id: number; name: string };
  investedTotal: number | null;
  roi: number | null;
  periodStart: string;
  periodEnd: string;
  granularity: Granularity;
}

/**
 * Busca o snapshot de marketing mais recente por canal (investimento e
 * ROI). marketing_snapshots hoje só é alimentada com granularidade
 * 'rolling_7d' — não existe (ainda) linha 'daily'. Diferente de
 * operations/negotiations, aqui NÃO filtramos por 'daily': pegamos o
 * snapshot mais recente disponível, qualquer que seja a granularidade, mas
 * sempre retornando essa granularidade e o período exato junto do dado,
 * para a UI deixar claro que não é necessariamente "dia fechado" — nunca
 * disfarçando um rolling_7d como se fosse diário.
 */
export async function getLatestMarketingSnapshot(): Promise<{
  referenceDate: string | null;
  isDaily: boolean;
  rows: MarketingLatestRow[];
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("marketing_snapshots")
    .select(
      "channel_id, period_start, period_end, granularity, invested_total, roi, channels ( id, name )"
    )
    .order("period_end", { ascending: false })
    .limit(50);

  if (error) {
    console.error(
      "[getLatestMarketingSnapshot] erro ao consultar marketing_snapshots",
      error
    );
    return { referenceDate: null, isDaily: false, rows: [] };
  }

  const allRows = (data ?? []) as any[];
  if (allRows.length === 0) {
    return { referenceDate: null, isDaily: false, rows: [] };
  }

  const mostRecentPeriodEnd = allRows[0].period_end as string;
  const filtered = allRows.filter(
    (row: any) => row.period_end === mostRecentPeriodEnd
  );

  const rows: MarketingLatestRow[] = filtered.map((row: any) => ({
    channel: {
      id: row.channels?.id ?? row.channel_id,
      name: row.channels?.name ?? "Canal desconhecido",
    },
    investedTotal: row.invested_total,
    roi: row.roi,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    granularity: row.granularity,
  }));

  return {
    referenceDate: mostRecentPeriodEnd,
    isDaily: rows.length > 0 && rows[0].granularity === "daily",
    rows,
  };
}
