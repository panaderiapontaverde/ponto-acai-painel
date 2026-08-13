import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/lib/types/database";

export interface CustomerFilters {
  search?: string;
  status?: string;
}

/**
 * Lista clientes do CRM v2 (`customers`), com busca por nome/telefone e
 * filtro de status. Os agregados (orders_count, total_spent, avg_ticket,
 * first_order_at, last_order_at) são calculados automaticamente pelo
 * trigger `orders_update_customer_aggregates` sempre que um pedido real é
 * inserido/atualizado — hoje `orders` está vazia, então esses campos
 * aparecem zerados/nulos para todos os clientes migrados do CRM legado.
 */
export async function getCustomers(filters: CustomerFilters = {}): Promise<Customer[]> {
  const supabase = createClient();

  let query = supabase
    .from("customers")
    .select("*")
    .order("total_spent", { ascending: false })
    .order("full_name", { ascending: true })
    .limit(200);

  if (filters.search) {
    const term = filters.search.replace(/[%_]/g, "");
    query = query.or(`full_name.ilike.%${term}%,phone_raw.ilike.%${term}%,phone_normalized.ilike.%${term}%`);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getCustomers] erro ao consultar customers", error);
    return [];
  }

  return (data ?? []) as Customer[];
}

export async function getCustomerStats(): Promise<{
  total: number;
  comPedidoReal: number;
  totalGastoConhecido: number;
}> {
  const supabase = createClient();

  const { count: total } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true });

  const { count: comPedidoReal } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .gt("orders_count", 0);

  const { data: gastoRows } = await supabase.from("customers").select("total_spent");
  const totalGastoConhecido = (gastoRows ?? []).reduce(
    (acc, r) => acc + (Number((r as { total_spent: number | null }).total_spent) || 0),
    0
  );

  return {
    total: total ?? 0,
    comPedidoReal: comPedidoReal ?? 0,
    totalGastoConhecido,
  };
}
