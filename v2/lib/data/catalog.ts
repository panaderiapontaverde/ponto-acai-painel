import { createClient } from "@/lib/supabase/server";

export interface CatalogRow {
  id: number;
  categoria: string | null;
  produto: string | null;
  sku: string | null;
  status: string | null;
  preco_atual: number | null;
  preco_99food: number | null;
  preco_anotaai: number | null;
  observacoes: string | null;
}

/** Cardápio real (`menu_catalog` — fonte oficial). `products` permanece deprecated e não é lido aqui. */
export async function getCatalog(): Promise<CatalogRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("menu_catalog")
    .select("id, categoria, produto, sku, status, preco_atual, preco_99food, preco_anotaai, observacoes")
    .order("categoria", { ascending: true })
    .limit(300);

  if (error) {
    console.error("[getCatalog] erro ao consultar menu_catalog", error);
    return [];
  }
  return (data ?? []) as CatalogRow[];
}
