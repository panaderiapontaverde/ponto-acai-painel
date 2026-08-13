import { createClient } from "@/lib/supabase/server";

export interface SalesRow {
  channel: { id: number; name: string; slug: string | null };
  totalValue: number | null;
  totalSales: number | null;
  avgTicket: number | null;
  newCustomers: number | null;
  periodStart: string;
  periodEnd: string;
}

export interface DailySalesResult {
  /** Dia fechado efetivamente encontrado (period_end da linha 'daily' mais recente). */
  referenceDate: string | null;
  /** Dia fechado imediatamente anterior ao de referência, quando existir. */
  previousDate: string | null;
  rows: SalesRow[];
  previousRows: SalesRow[];
  /** true quando o dia de referência é literalmente ontem (coleta em dia). */
  isYesterday: boolean;
}

/** Retorna a data de ontem (YYYY-MM-DD) no fuso America/Sao_Paulo. */
export function getYesterdayDateSaoPaulo(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [y, m, d] = parts.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function mapRow(row: any): SalesRow {
  return {
    channel: {
      id: row.channels?.id ?? row.channel_id,
      name: row.channels?.name ?? "Canal desconhecido",
      slug: row.channels?.slug ?? null,
    },
    totalValue: row.total_value === null ? null : Number(row.total_value),
    totalSales: row.total_sales,
    avgTicket: row.avg_ticket === null ? null : Number(row.avg_ticket),
    newCustomers: row.new_customers ?? null,
    periodStart: row.period_start,
    periodEnd: row.period_end,
  };
}

/**
 * Vendas do dia fechado mais recente com granularidade 'daily', por canal,
 * mais o dia fechado anterior para comparação.
 *
 * Regra de negócio: NUNCA misturar granularidades num mesmo comparativo, e
 * nunca usar dado de dia em andamento. Por isso o filtro em
 * `granularity = 'daily'` é explícito e a comparação só acontece entre dois
 * dias fechados.
 *
 * Diferente de assumir cegamente "ontem": buscamos o dia fechado mais
 * recente que EXISTE no banco e devolvemos `isYesterday` para a UI dizer,
 * sem disfarce, quando a coleta está atrasada — em vez de mostrar uma tela
 * vazia que parece "não vendemos nada".
 */
export async function getDailySales(): Promise<DailySalesResult> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("sales_snapshots")
    .select(
      "channel_id, period_start, period_end, granularity, total_value, total_sales, avg_ticket, new_customers, channels ( id, name, slug )"
    )
    .eq("granularity", "daily")
    .order("period_end", { ascending: false })
    .limit(60);

  if (error) {
    console.error("[getDailySales] erro ao consultar sales_snapshots", error);
    return {
      referenceDate: null,
      previousDate: null,
      rows: [],
      previousRows: [],
      isYesterday: false,
    };
  }

  const allRows = (data ?? []) as any[];
  if (allRows.length === 0) {
    return {
      referenceDate: null,
      previousDate: null,
      rows: [],
      previousRows: [],
      isYesterday: false,
    };
  }

  const dates = Array.from(new Set(allRows.map((r) => r.period_end as string))).sort(
    (a, b) => (a < b ? 1 : -1)
  );
  const referenceDate = dates[0];
  const previousDate = dates[1] ?? null;

  return {
    referenceDate,
    previousDate,
    rows: allRows.filter((r) => r.period_end === referenceDate).map(mapRow),
    previousRows: previousDate
      ? allRows.filter((r) => r.period_end === previousDate).map(mapRow)
      : [],
    isYesterday: referenceDate === getYesterdayDateSaoPaulo(),
  };
}

/**
 * Compatibilidade com o nome antigo usado pelo Desktop. Mantém a mesma
 * semântica de "dia fechado mais recente", já corrigida para as colunas
 * reais da tabela (`total_value`/`total_sales`/`avg_ticket`).
 */
export async function getYesterdaySales(): Promise<{
  referenceDate: string | null;
  rows: SalesRow[];
  isYesterday: boolean;
}> {
  const { referenceDate, rows, isYesterday } = await getDailySales();
  return { referenceDate, rows, isYesterday };
}

/**
 * Janela móvel de 7 dias mais recente, por canal. Exposta SEPARADAMENTE do
 * dado diário — nunca somada nem comparada com ele.
 */
export async function getRolling7dSales(): Promise<{
  periodStart: string | null;
  periodEnd: string | null;
  rows: SalesRow[];
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("sales_snapshots")
    .select(
      "channel_id, period_start, period_end, granularity, total_value, total_sales, avg_ticket, new_customers, channels ( id, name, slug )"
    )
    .eq("granularity", "rolling_7d")
    .order("period_end", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[getRolling7dSales] erro ao consultar sales_snapshots", error);
    return { periodStart: null, periodEnd: null, rows: [] };
  }

  const allRows = (data ?? []) as any[];
  if (allRows.length === 0) return { periodStart: null, periodEnd: null, rows: [] };

  const mostRecent = allRows[0].period_end as string;
  const rows = allRows.filter((r) => r.period_end === mostRecent).map(mapRow);

  return {
    periodStart: rows[0]?.periodStart ?? null,
    periodEnd: mostRecent,
    rows,
  };
}

export interface MonthlyRevenueRow {
  channel: { id: number; name: string };
  month: string;
  totalValue: number | null;
  totalSales: number | null;
  avgTicket: number | null;
  newCustomers: number | null;
  isClosed: boolean;
}

/**
 * Faturamento mensal (`monthly_revenue`). `is_closed = false` marca o mês
 * corrente, que ainda está em andamento — a UI é obrigada a sinalizar isso
 * e nunca comparar um mês aberto com meses fechados como se fossem iguais.
 */
export async function getMonthlyRevenue(limit = 12): Promise<MonthlyRevenueRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("monthly_revenue")
    .select(
      "channel_id, month, total_value, total_sales, avg_ticket, new_customers, is_closed, channels ( id, name )"
    )
    .order("month", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getMonthlyRevenue] erro ao consultar monthly_revenue", error);
    return [];
  }

  return ((data ?? []) as any[]).map((row) => ({
    channel: {
      id: row.channels?.id ?? row.channel_id,
      name: row.channels?.name ?? "Canal desconhecido",
    },
    month: row.month,
    totalValue: row.total_value === null ? null : Number(row.total_value),
    totalSales: row.total_sales,
    avgTicket: row.avg_ticket === null ? null : Number(row.avg_ticket),
    newCustomers: row.new_customers,
    isClosed: Boolean(row.is_closed),
  }));
}
