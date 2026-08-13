import { createClient } from "@/lib/supabase/server";
import type { Review, InstagramPost, InstagramDirectMessage } from "@/lib/types/database";

/**
 * Avaliações granulares (`reviews`). A tabela existe e está com RLS/índices
 * testados, mas a coleta ao vivo (iFood/99Food) ainda não foi implementada
 * — por isso esta função hoje sempre retorna [] em produção. Mantida aqui
 * para que a UI já esteja pronta assim que a coleta for ligada.
 */
export async function getRecentReviews(limit = 50): Promise<Review[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("reviewed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentReviews] erro ao consultar reviews", error);
    return [];
  }
  return (data ?? []) as Review[];
}

export async function getReviewsSummary(): Promise<{ total: number; avgRating: number | null }> {
  const supabase = createClient();
  const { data, error } = await supabase.from("reviews").select("rating");
  if (error || !data || data.length === 0) {
    return { total: 0, avgRating: null };
  }
  const ratings = data
    .map((r) => (r as { rating: number | null }).rating)
    .filter((r): r is number => r !== null);
  const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  return { total: data.length, avgRating: avg };
}

/**
 * Posts granulares do Instagram (`instagram_posts`). Mesma situação das
 * reviews: schema e RLS prontos, coleta por conteúdo ainda não implementada
 * (a rotina atual só coleta o agregado diário em `social_snapshots`).
 */
export async function getRecentInstagramPosts(limit = 20): Promise<InstagramPost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("posted_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentInstagramPosts] erro ao consultar instagram_posts", error);
    return [];
  }
  return (data ?? []) as InstagramPost[];
}

/** Conversas recentes do Instagram Direct (somente metadados — nunca abrimos threads para não marcar como lido). */
export async function getRecentDirectMessages(limit = 20): Promise<InstagramDirectMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("instagram_direct_messages")
    .select("*")
    .order("message_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentDirectMessages] erro ao consultar instagram_direct_messages", error);
    return [];
  }
  return (data ?? []) as InstagramDirectMessage[];
}

export interface OrganicSnapshot {
  periodStart: string;
  periodEnd: string;
  followers: number | null;
  followersDelta: number | null;
  reach: number | null;
  interactionsTotal: number | null;
}

/** Snapshot orgânico mais recente do Instagram (agregado — a rotina atual não coleta por post). */
export async function getLatestOrganicSnapshot(): Promise<OrganicSnapshot | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("social_snapshots")
    .select("period_start, period_end, followers, followers_delta, reach, interactions_total")
    .eq("platform", "instagram")
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as any;
  return {
    periodStart: row.period_start,
    periodEnd: row.period_end,
    followers: row.followers,
    followersDelta: row.followers_delta,
    reach: row.reach,
    interactionsTotal: row.interactions_total,
  };
}

export interface AdCampaignRow {
  campaignName: string;
  status: string | null;
  amountSpent: number | null;
  results: number | null;
  costPerResult: number | null;
  cpm: number | null;
  periodStart: string;
  periodEnd: string;
}

/** Campanhas Meta Ads mais recentes (nível campanha — hierarquia conjunto/anúncio ainda não coletada). */
export async function getRecentAdCampaigns(limit = 20): Promise<AdCampaignRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ad_campaigns_snapshots")
    .select("campaign_name, status, amount_spent, results, cost_per_result, cpm, period_start, period_end")
    .order("period_end", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((r: any) => ({
    campaignName: r.campaign_name,
    status: r.status,
    amountSpent: r.amount_spent,
    results: r.results,
    costPerResult: r.cost_per_result,
    cpm: r.cpm,
    periodStart: r.period_start,
    periodEnd: r.period_end,
  }));
}
