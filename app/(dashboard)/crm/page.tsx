import { Card, KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getCustomers, getCustomerStats } from "@/lib/data/customers";

export const dynamic = "force-dynamic";

function formatBRL(value: number | null) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function CrmPage({
  searchParams,
}: {
  searchParams: { busca?: string; status?: string };
}) {
  const [customers, stats] = await Promise.all([
    getCustomers({ search: searchParams.busca, status: searchParams.status }),
    getCustomerStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-acai-900">CRM</h1>
        <p className="text-sm text-gray-500">
          {stats.total} clientes cadastrados ({stats.comPedidoReal} com pedido
          real vinculado). Agregados (gasto total, ticket médio, recorrência)
          são calculados automaticamente a partir de pedidos reais em `orders`
          — hoje essa tabela está vazia (coleta granular de pedidos ainda não
          implementada), então os valores abaixo refletem apenas o que já
          existia no CRM legado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Clientes cadastrados" value={String(stats.total)} periodLabel="Total acumulado" />
        <KpiCard
          label="Com pedido real vinculado"
          value={String(stats.comPedidoReal)}
          periodLabel="Depende da coleta granular de pedidos (pendente)"
        />
        <KpiCard
          label="Gasto total conhecido"
          value={formatBRL(stats.totalGastoConhecido)}
          periodLabel="Soma do campo total_spent"
        />
      </div>

      <Card title="Buscar cliente">
        <form className="flex gap-2" action="/crm">
          <input
            type="text"
            name="busca"
            defaultValue={searchParams.busca}
            placeholder="Nome ou telefone"
            className="w-full rounded-lg border border-acai-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-acai-700 px-4 py-2 text-sm font-medium text-white hover:bg-acai-800"
          >
            Buscar
          </button>
        </form>
      </Card>

      <Card title="Clientes" subtitle={`${customers.length} exibidos (máx. 200)`}>
        {customers.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum cliente encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-acai-100 text-left text-xs uppercase text-gray-500">
                  <th className="py-2 pr-3">Nome</th>
                  <th className="py-2 pr-3">Telefone</th>
                  <th className="py-2 pr-3">Origem</th>
                  <th className="py-2 pr-3">Pedidos</th>
                  <th className="py-2 pr-3">Gasto total</th>
                  <th className="py-2 pr-3">Última compra</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-acai-50">
                    <td className="py-2 pr-3 font-medium text-acai-800">{c.full_name ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray-600">{c.phone_raw ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray-600">{c.origin ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray-600">{c.orders_count}</td>
                    <td className="py-2 pr-3 text-gray-600">{formatBRL(c.total_spent)}</td>
                    <td className="py-2 pr-3 text-gray-600">{c.last_order_at ?? "sem pedido vinculado"}</td>
                    <td className="py-2 pr-3">
                      <Badge tone={c.status === "ativo" ? "success" : "neutral"}>{c.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
