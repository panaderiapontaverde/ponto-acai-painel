import { Card, KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { getCatalog, getLatestMenuFunnel, getTopItems } from "@/lib/data/catalog";
import { formatBRL, formatInt, formatPeriod, formatDate, formatDecimal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CardapioPage() {
  const [items, funnel, topItems] = await Promise.all([
    getCatalog(),
    getLatestMenuFunnel(),
    getTopItems(15),
  ]);

  const ativos = items.filter((i) => i.status === "ativo").length;
  const pausados = items.length - ativos;
  const categorias = new Set(items.map((i) => i.categoria)).size;

  const funnelPeriodLabel =
    funnel.periodEnd !== null
      ? `${formatPeriod(funnel.periodStart, funnel.periodEnd)}${
          funnel.rows[0]?.granularity ? ` (granularity: ${funnel.rows[0].granularity})` : ""
        }`
      : "Nenhum funil de cardápio coletado ainda";

  /** Taxa de conversão de uma etapa para a seguinte, em pontos percentuais. */
  const rate = (numerator: number | null, denominator: number | null) =>
    numerator === null || denominator === null || denominator === 0
      ? null
      : (numerator / denominator) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-acai-900">Cardápio</h1>
        <p className="text-sm text-gray-500">
          Fonte oficial: <code className="text-xs">menu_catalog</code>. A tabela
          legada <code className="text-xs">products</code> está deprecated e não é
          lida aqui. Preços por canal aparecem lado a lado; o mapeamento
          determinístico de IDs externos (product_channel_mapping) ainda está em
          população, então a correspondência entre canais depende do grupo de
          equivalência.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="SKUs cadastrados"
          value={formatInt(items.length)}
          periodLabel="Total no catálogo oficial"
        />
        <KpiCard
          label="Ativos / Pausados"
          value={`${formatInt(ativos)} / ${formatInt(pausados)}`}
          periodLabel="Status atual"
        />
        <KpiCard
          label="Categorias"
          value={formatInt(categorias)}
          periodLabel="Distintas no catálogo"
        />
      </div>

      {/* ------------------------------ Funil ------------------------------ */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-acai-700">
          Funil do cardápio
        </h2>
        <Card
          title="Da visita ao pedido concluído"
          subtitle={funnelPeriodLabel}
        >
          {funnel.rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Nenhum funil de cardápio coletado ainda.
            </div>
          ) : (
            <div className="space-y-6">
              {funnel.rows.map((row) => {
                const steps = [
                  { label: "Visitas", value: row.visits },
                  { label: "Visualizações", value: row.views },
                  { label: "Carrinho", value: row.cart },
                  { label: "Revisão", value: row.review },
                  { label: "Concluídos", value: row.completed },
                ];
                const top = row.visits ?? 0;

                return (
                  <div key={row.channel.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-acai-800">
                        {row.channel.name}
                      </p>
                      <Badge tone="neutral">
                        conversão total:{" "}
                        {rate(row.completed, row.visits) === null
                          ? "—"
                          : `${formatDecimal(rate(row.completed, row.visits), 1)}%`}
                      </Badge>
                    </div>
                    {steps.map((step, index) => {
                      const previous = index === 0 ? null : steps[index - 1].value;
                      const stepRate = index === 0 ? null : rate(step.value, previous);
                      const width =
                        top > 0 && step.value !== null
                          ? Math.max((step.value / top) * 100, 2)
                          : 0;
                      return (
                        <div key={step.label} className="flex items-center gap-3">
                          <span className="w-28 shrink-0 text-xs text-gray-500">
                            {step.label}
                          </span>
                          <div className="h-6 flex-1 overflow-hidden rounded bg-acai-50">
                            <div
                              className="h-full rounded bg-acai-500"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="w-16 shrink-0 text-right text-xs font-medium text-gray-700">
                            {formatInt(step.value)}
                          </span>
                          <span className="w-20 shrink-0 text-right text-[11px] text-gray-400">
                            {stepRate === null ? "" : `${formatDecimal(stepRate, 1)}% da etapa anterior`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      {/* ---------------------------- Top itens ---------------------------- */}
      <Card
        title="Itens mais vendidos"
        subtitle={
          topItems.snapshotDate
            ? `Snapshot de ${formatDate(topItems.snapshotDate)}`
            : "Nenhum ranking de itens coletado ainda"
        }
      >
        <DataTable
          rows={topItems.rows}
          rowKey={(row) => `${row.channel.id}-${row.rank}-${row.itemName}`}
          emptyMessage="Nenhum ranking de itens coletado ainda."
          columns={[
            { key: "rank", header: "#", render: (row) => formatInt(row.rank) },
            {
              key: "item",
              header: "Item",
              render: (row) => (
                <span className="font-medium text-gray-800">{row.itemName ?? "—"}</span>
              ),
            },
            { key: "channel", header: "Canal", render: (row) => row.channel.name },
            { key: "visits", header: "Visitas", render: (row) => formatInt(row.visits) },
            { key: "sales", header: "Vendas", render: (row) => formatInt(row.sales) },
            {
              key: "revenue",
              header: "Faturamento",
              render: (row) => formatBRL(row.revenue),
            },
          ]}
        />
      </Card>

      {/* ----------------------------- Catálogo ----------------------------- */}
      <Card title="Itens do cardápio" subtitle={`${items.length} SKUs`}>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Sem dado disponível.</p>
        ) : (
          <div className="max-h-[600px] overflow-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2">Categoria</th>
                  <th className="px-4 py-2">Produto</th>
                  <th className="px-4 py-2">SKU / tamanho</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Tabela</th>
                  <th className="px-4 py-2">iFood</th>
                  <th className="px-4 py-2">99Food</th>
                  <th className="px-4 py-2">Anota Aí</th>
                  <th className="px-4 py-2">Grupo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-acai-50/50">
                    <td className="px-4 py-2 text-gray-500">{i.categoria ?? "—"}</td>
                    <td className="px-4 py-2 font-medium text-acai-800">
                      {i.produto ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{i.skuTamanho ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Badge tone={i.status === "ativo" ? "success" : "neutral"}>
                        {i.status ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{formatBRL(i.precoTabela)}</td>
                    <td className="px-4 py-2 text-gray-600">{formatBRL(i.precoAtual)}</td>
                    <td className="px-4 py-2 text-gray-600">{formatBRL(i.preco99food)}</td>
                    <td className="px-4 py-2 text-gray-600">{formatBRL(i.precoAnotaai)}</td>
                    <td className="px-4 py-2 text-[11px] text-gray-400">
                      {i.grupoEquivalencia ?? "—"}
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
