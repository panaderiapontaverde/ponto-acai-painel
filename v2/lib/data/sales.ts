import { createClient } from "@/lib/supabase/server";
import type { Channel, SalesSnapshot } from "@/lib/types/database";

export interface YesterdaySalesRow {
  channel: Pick<Channel, "id" | "name" | "slug">;
  revenue: number | null;
  ordersCount: number | null;
  averageTicket: number | null;
  periodStart: string;
  periodEnd: string;
}

/**
 * Busca o snapshot de vendas de granularidade 'daily' do dia fechado mais
 * recente (ontem, no fuso America/Sao_Paulo), por canal.
 *
 * Regra de negócio: NUNCA misturar dado de dia em andamento com dado de dia
 * fechado, e NUNCA comparar granularidades diferentes. Por isso esta função
 * filtra explicitamente granularity = 'daily' e um período fechado (ontem).
 */
export async function getYesterdaySales(): Promise<{
  referenceDate: string;
  rows: YesterdaySalesRow[];
}> {
  const supabase = createClient();

  const yesterday = getYesterdayDateSaoPaulo();

  const { data, error } = await supabase
    .from("sales_snapshots")
    .select(
      "id, channel_id, period_start, period_end, granularity, revenue, orders_count, average_ticket, channels ( id, name, slug )"
    )
    .eq("granularity", "daily")
    .eq("period_start", yesterday)
    .eq("period_end", yesterday);

  if (error) {
    console.error("[getYesterdaySales] erro ao consultar sales_snapshots", error);
    return { referenceDate: yesterday, rows: [] };
  }

  const rows: YesterdaySalesRow[] = (data ?? []).map((row: any) => ({
    channel: {
      id: row.channels?.id ?? row.channel_id,
      name: row.channels?.name ?? "Canal desconhecido",
      slug: row.channels?.slug ?? null,
    },
    revenue: row.revenue,
    ordersCount: row.orders_count,
    averageTicket: row.average_ticket,
    periodStart: row.period_start,
    periodEnd: row.period_end,
  }));

  return { referenceDate: yesterday, rows };
}

/** Retorna a data de ontem (YYYY-MM-DD) no fuso America/Sao_Paulo. */
function getYesterdayDateSaoPaulo(): string {
  const now = new Date();
  const saoPauloNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  saoPauloNow.setDate(saoPauloNow.getDate() - 1);

  const yyyy = saoPauloNow.getFullYear();
  const mm = String(saoPauloNow.getMonth() + 1).padStart(2, "0");
  const dd = String(saoPauloNow.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
