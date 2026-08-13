import { createClient } from "@/lib/supabase/server";

export interface FinancialRow {
  channel: { id: number; name: string };
  periodMonth: string;
  salesValue: number | null;
  feesValue: number | null;
  promoServicesValue: number | null;
  adjustments: number | null;
  netRevenue: number | null;
  receivedValue: number | null;
  retainedValue: number | null;
  receivableValue: number | null;
  nextPaymentDate: string | null;
  collectedAt: string | null;
}

function toNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * Repasse financeiro por canal (`financial_snapshots`), do mês mais recente
 * coletado. O período aqui é MENSAL (`period_month`) — nunca comparar estes
 * valores com os KPIs de dia fechado da tela de Vendas.
 */
export async function getLatestFinancialSnapshots(): Promise<{
  periodMonth: string | null;
  rows: FinancialRow[];
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("financial_snapshots")
    .select(
      "channel_id, period_month, sales_value, fees_value, promo_services_value, adjustments, net_revenue, received_value, retained_value, receivable_value, next_payment_date, collected_at, channels ( id, name )"
    )
    .order("period_month", { ascending: false })
    .limit(20);

  if (error) {
    console.error(
      "[getLatestFinancialSnapshots] erro ao consultar financial_snapshots",
      error
    );
    return { periodMonth: null, rows: [] };
  }

  const allRows = (data ?? []) as any[];
  if (allRows.length === 0) return { periodMonth: null, rows: [] };

  const mostRecent = allRows[0].period_month as string;
  const rows: FinancialRow[] = allRows
    .filter((r) => r.period_month === mostRecent)
    .map((row) => ({
      channel: {
        id: row.channels?.id ?? row.channel_id,
        name: row.channels?.name ?? "Canal desconhecido",
      },
      periodMonth: row.period_month,
      salesValue: toNumber(row.sales_value),
      feesValue: toNumber(row.fees_value),
      promoServicesValue: toNumber(row.promo_services_value),
      adjustments: toNumber(row.adjustments),
      netRevenue: toNumber(row.net_revenue),
      receivedValue: toNumber(row.received_value),
      retainedValue: toNumber(row.retained_value),
      receivableValue: toNumber(row.receivable_value),
      nextPaymentDate: row.next_payment_date,
      collectedAt: row.collected_at,
    }));

  return { periodMonth: mostRecent, rows };
}
