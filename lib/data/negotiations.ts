import { createClient } from "@/lib/supabase/server";

export interface NegotiationDailyRow {
  channel: { id: number; name: string };
  problemOrders: number | null;
  storeResponseRate: number | null;
  clientAcceptRate: number | null;
  refundsValue: number | null;
  periodStart: string;
  periodEnd: string;
}

/**
 * Busca os snapshots de negociações (pedidos com problema, taxa de
 * resposta da loja) de granularidade 'daily' do dia fechado mais recente,
 * por canal. Assim como em operations.ts, nunca mistura granularidades:
 * se não houver nenhuma linha 'daily' ainda coletada, retorna lista vazia
 * para a página exibir um empty state honesto (em vez de disfarçar dado de
 * outra granularidade como se fosse diário).
 */
export async function getLatestNegotiationDaily(): Promise<{
  referenceDate: string | null;
  rows: NegotiationDailyRow[];
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("negotiation_snapshots")
    .select(
      "channel_id, period_start, period_end, granularity, problem_orders, store_response_rate, client_accept_rate, refunds_value, channels ( id, name )"
    )
    .eq("granularity", "daily")
    .order("period_end", { ascending: false })
    .limit(50);

  if (error) {
    console.error(
      "[getLatestNegotiationDaily] erro ao consultar negotiation_snapshots",
      error
    );
    return { referenceDate: null, rows: [] };
  }

  const allRows = (data ?? []) as any[];
  if (allRows.length === 0) {
    return { referenceDate: null, rows: [] };
  }

  const mostRecentPeriodEnd = allRows[0].period_end as string;
  const rows: NegotiationDailyRow[] = allRows
    .filter((row: any) => row.period_end === mostRecentPeriodEnd)
    .map((row: any) => ({
      channel: {
        id: row.channels?.id ?? row.channel_id,
        name: row.channels?.name ?? "Canal desconhecido",
      },
      problemOrders: row.problem_orders,
      storeResponseRate:
        row.store_response_rate === null ? null : Number(row.store_response_rate),
      clientAcceptRate:
        row.client_accept_rate === null ? null : Number(row.client_accept_rate),
      refundsValue: row.refunds_value === null ? null : Number(row.refunds_value),
      periodStart: row.period_start,
      periodEnd: row.period_end,
    }));

  return { referenceDate: mostRecentPeriodEnd, rows };
}
