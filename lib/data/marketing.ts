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

export interface PromotionCampaignRow {
  id: number;
  channel: { id: number; name: string };
  campaignName: string | null;
  periodStart: string;
  periodEnd: string;
  orders: number | null;
  salesValue: number | null;
  invested: number | null;
  roi: number | null;
}

/**
 * Campanhas promocionais das plataformas de venda (`promotion_campaigns`),
 * cada uma com o próprio período — por isso a listagem é por campanha, sem
 * somar campanhas de janelas diferentes num total único.
 */
export async function getPromotionCampaigns(limit = 30): Promise<PromotionCampaignRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("promotion_campaigns")
    .select(
      "id, channel_id, campaign_name, period_start, period_end, orders, sales_value, invested, roi, channels ( id, name )"
    )
    .order("period_end", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getPromotionCampaigns] erro ao consultar promotion_campaigns", error);
    return [];
  }

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    channel: {
      id: row.channels?.id ?? row.channel_id,
      name: row.channels?.name ?? "Canal desconhecido",
    },
    campaignName: row.campaign_name,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    orders: row.orders,
    salesValue: row.sales_value === null ? null : Number(row.sales_value),
    invested: row.invested === null ? null : Number(row.invested),
    roi: row.roi === null ? null : Number(row.roi),
  }));
}

export interface AdsAccountSnapshot {
  accountName: string | null;
  balance: number | null;
  activeCampaigns: number | null;
  amountSpentPeriod: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  collectedAt: string | null;
}

/** Saldo e gasto da conta de anúncios (Meta Ads) no snapshot mais recente. */
export async function getLatestAdsSnapshot(): Promise<AdsAccountSnapshot | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ads_snapshots")
    .select(
      "account_name, balance, active_campaigns, amount_spent_period, period_start, period_end, collected_at"
    )
    .order("collected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[getLatestAdsSnapshot] erro ao consultar ads_snapshots", error);
    return null;
  }

  const row = data as any;
  return {
    accountName: row.account_name,
    balance: row.balance === null ? null : Number(row.balance),
    activeCampaigns: row.active_campaigns,
    amountSpentPeriod:
      row.amount_spent_period === null ? null : Number(row.amount_spent_period),
    periodStart: row.period_start,
    periodEnd: row.period_end,
    collectedAt: row.collected_at,
  };
}
