import { createClient } from "@/lib/supabase/server";

export interface OperationDailyRow {
  channel: { id: number; name: string };
  cancelRate: number | null;
  callsRate: number | null;
  openHours: number | null;
  topDispatchDay: string | null;
  topDispatchCount: number | null;
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
      "channel_id, period_start, period_end, granularity, cancel_rate, calls_rate, open_hours, top_dispatch_day, top_dispatch_count, channels ( id, name )"
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
      cancelRate: row.cancel_rate === null ? null : Number(row.cancel_rate),
      callsRate: row.calls_rate === null ? null : Number(row.calls_rate),
      openHours: row.open_hours === null ? null : Number(row.open_hours),
      topDispatchDay: row.top_dispatch_day ?? null,
      topDispatchCount: row.top_dispatch_count ?? null,
      periodStart: row.period_start,
      periodEnd: row.period_end,
    }));

  return { referenceDate: mostRecentPeriodEnd, rows };
}

export interface ReviewSnapshotRow {
  channel: { id: number; name: string };
  periodDays: number | null;
  storeRating: number | null;
  storeCount: number | null;
  deliveryRating: number | null;
  deliveryCount: number | null;
  irregularCount: number | null;
  collectedAt: string | null;
}

/**
 * Nota da loja agregada por canal (`review_snapshots`). `period_days` é a
 * janela que a própria plataforma usa para calcular a nota (ex.: 90 dias) —
 * não é dia fechado, e a UI precisa dizer isso.
 */
export async function getLatestReviewSnapshots(): Promise<ReviewSnapshotRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("review_snapshots")
    .select(
      "channel_id, period_days, store_rating, store_count, delivery_rating, delivery_count, irregular_count, collected_at, channels ( id, name )"
    )
    .order("collected_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[getLatestReviewSnapshots] erro ao consultar review_snapshots", error);
    return [];
  }

  const seen = new Set<number>();
  const rows: ReviewSnapshotRow[] = [];
  for (const row of (data ?? []) as any[]) {
    const channelId = row.channels?.id ?? row.channel_id;
    if (seen.has(channelId)) continue;
    seen.add(channelId);
    rows.push({
      channel: { id: channelId, name: row.channels?.name ?? "Canal desconhecido" },
      periodDays: row.period_days,
      storeRating: row.store_rating === null ? null : Number(row.store_rating),
      storeCount: row.store_count,
      deliveryRating: row.delivery_rating === null ? null : Number(row.delivery_rating),
      deliveryCount: row.delivery_count,
      irregularCount: row.irregular_count,
      collectedAt: row.collected_at,
    });
  }

  return rows;
}

export interface CollectionRunRow {
  id: string;
  routine: string | null;
  referenceDate: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  status: string | null;
  sourcesPlanned: string[] | null;
  sourcesCompleted: string[] | null;
  sourcesFailed: string[] | null;
  recordsCollected: number | null;
  notes: string | null;
}

/**
 * Últimas execuções da rotina de coleta (`collection_runs`) — responde
 * "a coleta de ontem terminou completa?" sem inferir isso indiretamente
 * pela presença de linhas nas tabelas de negócio.
 */
export async function getRecentCollectionRuns(limit = 10): Promise<CollectionRunRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("collection_runs")
    .select(
      "id, routine, reference_date, started_at, finished_at, status, sources_planned, sources_completed, sources_failed, records_collected, notes"
    )
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentCollectionRuns] erro ao consultar collection_runs", error);
    return [];
  }

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    routine: row.routine,
    referenceDate: row.reference_date,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    status: row.status,
    sourcesPlanned: row.sources_planned,
    sourcesCompleted: row.sources_completed,
    sourcesFailed: row.sources_failed,
    recordsCollected: row.records_collected,
    notes: row.notes,
  }));
}
