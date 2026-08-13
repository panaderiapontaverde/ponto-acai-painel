import { createClient } from "@/lib/supabase/server";

export interface CatalogRow {
  id: number;
  categoria: string | null;
  produto: string | null;
  skuTamanho: string | null;
  status: string | null;
  precoTabela: number | null;
  precoAtual: number | null;
  preco99food: number | null;
  precoAnotaai: number | null;
  nComplementos: number | null;
  grupoEquivalencia: string | null;
  observacoes: string | null;
}

/**
 * Cardápio real (`menu_catalog` — fonte oficial). A tabela `products`
 * continua deprecated e não é lida aqui.
 *
 * Atenção ao nome real da coluna de SKU: é `sku_tamanho`, não `sku`. Pedir
 * `sku` fazia o PostgREST rejeitar o select inteiro e a página inteira
 * aparecia vazia.
 */
export async function getCatalog(): Promise<CatalogRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("menu_catalog")
    .select(
      "id, categoria, produto, sku_tamanho, status, preco_tabela, preco_atual, preco_99food, preco_anotaai, n_complementos, grupo_equivalencia, observacoes"
    )
    .order("categoria", { ascending: true })
    .order("produto", { ascending: true })
    .limit(500);

  if (error) {
    console.error("[getCatalog] erro ao consultar menu_catalog", error);
    return [];
  }

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    categoria: row.categoria,
    produto: row.produto,
    skuTamanho: row.sku_tamanho,
    status: row.status,
    precoTabela: row.preco_tabela === null ? null : Number(row.preco_tabela),
    precoAtual: row.preco_atual === null ? null : Number(row.preco_atual),
    preco99food: row.preco_99food === null ? null : Number(row.preco_99food),
    precoAnotaai: row.preco_anotaai === null ? null : Number(row.preco_anotaai),
    nComplementos: row.n_complementos,
    grupoEquivalencia: row.grupo_equivalencia,
    observacoes: row.observacoes,
  }));
}

export interface MenuFunnelRow {
  channel: { id: number; name: string };
  periodStart: string;
  periodEnd: string;
  granularity: string | null;
  visits: number | null;
  views: number | null;
  cart: number | null;
  review: number | null;
  completed: number | null;
}

/**
 * Funil do cardápio (visitas → visualizações → carrinho → revisão →
 * concluído) do período mais recente coletado. A granularidade vem junto
 * porque hoje essa família é coletada em janela móvel de 7 dias, não em dia
 * fechado — a UI precisa deixar isso explícito.
 */
export async function getLatestMenuFunnel(): Promise<{
  periodStart: string | null;
  periodEnd: string | null;
  rows: MenuFunnelRow[];
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("menu_funnel_snapshots")
    .select(
      "channel_id, period_start, period_end, granularity, visits, views, cart, review, completed, channels ( id, name )"
    )
    .order("period_end", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[getLatestMenuFunnel] erro ao consultar menu_funnel_snapshots", error);
    return { periodStart: null, periodEnd: null, rows: [] };
  }

  const allRows = (data ?? []) as any[];
  if (allRows.length === 0) return { periodStart: null, periodEnd: null, rows: [] };

  const mostRecent = allRows[0].period_end as string;
  const rows: MenuFunnelRow[] = allRows
    .filter((r) => r.period_end === mostRecent)
    .map((row) => ({
      channel: {
        id: row.channels?.id ?? row.channel_id,
        name: row.channels?.name ?? "Canal desconhecido",
      },
      periodStart: row.period_start,
      periodEnd: row.period_end,
      granularity: row.granularity,
      visits: row.visits,
      views: row.views,
      cart: row.cart,
      review: row.review,
      completed: row.completed,
    }));

  return { periodStart: rows[0]?.periodStart ?? null, periodEnd: mostRecent, rows };
}

export interface TopItemRow {
  rank: number | null;
  itemName: string | null;
  visits: number | null;
  sales: number | null;
  revenue: number | null;
  snapshotDate: string;
  channel: { id: number; name: string };
}

/** Itens mais vendidos do snapshot mais recente (`top_items`). */
export async function getTopItems(limit = 15): Promise<{
  snapshotDate: string | null;
  rows: TopItemRow[];
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("top_items")
    .select(
      "rank, item_name, visits, sales, revenue, snapshot_date, channel_id, channels ( id, name )"
    )
    .order("snapshot_date", { ascending: false })
    .order("rank", { ascending: true })
    .limit(60);

  if (error) {
    console.error("[getTopItems] erro ao consultar top_items", error);
    return { snapshotDate: null, rows: [] };
  }

  const allRows = (data ?? []) as any[];
  if (allRows.length === 0) return { snapshotDate: null, rows: [] };

  const mostRecent = allRows[0].snapshot_date as string;
  const rows: TopItemRow[] = allRows
    .filter((r) => r.snapshot_date === mostRecent)
    .slice(0, limit)
    .map((row) => ({
      rank: row.rank,
      itemName: row.item_name,
      visits: row.visits,
      sales: row.sales,
      revenue: row.revenue === null ? null : Number(row.revenue),
      snapshotDate: row.snapshot_date,
      channel: {
        id: row.channels?.id ?? row.channel_id,
        name: row.channels?.name ?? "Canal desconhecido",
      },
    }));

  return { snapshotDate: mostRecent, rows };
}
