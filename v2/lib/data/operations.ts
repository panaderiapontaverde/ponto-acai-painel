import { createClient } from "@/lib/supabase/server";

export interface OperationDailyRow {
  channel: { id: number; name: string };
  cancelRate: number | null;
  callsRate: number | null;
  periodStart: string;
  periodEnd: string;
}

/**
 * Busca os snapshots operacionais (cancelamento, chamados) de granularidade
 * 'daily' do dia fechado mais recente disponível, por canal. Nunca mistura
 * com outras granularidades — se não houver nenhuma linha 'daily', retorna
 * lista vazia (a página deve mostrar um empty state honesto).
 */
export async function getLatestOperationDaily(): Promise<{
  referenceDate: string | null;
  rows: OperationDailyRow[];
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("operation_snapshots")
    .select(
      "channel_id, period_start, period_end, granularity, cancel_rate, calls_rate, channels ( id, name )"
    )
    .eq("granularity", "daily")
    .order("period_end", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[getLatestOperationDaily] erro ao consultar operation_snapshots", error);
    return { referenceDate: null, rows: [] };
  }

  const allRows = (data ?? []) as any[];
  if (allRows.length === 0) {
    return { referenceDate: null, rows: [] };
  }

  const mostRecentPeriodEnd = allRows[0].period_end as string;
  const rows: OperationDailyRow[] = allRows
    .filter((row: any) => row.period_end === mostRecentPeriodEnd)
    .map((row: any) => ({
      channel: {
        id: row.channels?.id ?? row.channel_id,
        name: row.channels?.name ?? "Canal desconhecido",
      },
      cancelRate: row.cancel_rate,
      callsRate: row.calls_rate,
      periodStart: row.period_start,
      periodEnd: row.period_end,
    }));

  return { referenceDate: mostRecentPeriodEnd, rows };
}
