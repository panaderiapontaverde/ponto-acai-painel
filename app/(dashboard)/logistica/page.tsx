import { Card, KpiCard } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { InsightsList } from "@/components/ui/InsightsList";
import { getLatestLogisticsSnapshot } from "@/lib/data/logistics";
import { getActiveInsights } from "@/lib/data/insights";
import { formatBRL, formatInt, formatPeriod, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LogisticaPage() {
  const [{ snapshot, divergence }, insights] = await Promise.all([
    getLatestLogisticsSnapshot(),
    getActiveInsights("logistica", 6),
  ]);

  const periodLabel = snapshot
    ? `${formatPeriod(snapshot.period_start, snapshot.period_end)} — esta tabela não tem coluna de granularidade`
    : "Nenhum snapshot de logística coletado ainda";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-acai-900">Logística</h1>
        <p className="text-sm text-gray-500">
          Entregas e custo por entrega do parceiro logístico. A conferência que
          importa aqui é a divergência entre o número de entregas cobradas pelo
          parceiro e o número de pedidos entregues registrado na plataforma de
          venda — é onde aparece cobrança a mais.
        </p>
      </div>

      {!snapshot ? (
        <Card title="Logística">
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Nenhum snapshot de logística coletado ainda.
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label={`Entregas (${snapshot.provider ?? "parceiro"})`}
              value={formatInt(snapshot.deliveries_count)}
              periodLabel={periodLabel}
            />
            <KpiCard
              label="Custo total"
              value={formatBRL(snapshot.total_cost)}
              periodLabel={periodLabel}
              hint={
                snapshot.cost_per_delivery !== null
                  ? `${formatBRL(snapshot.cost_per_delivery)} por entrega`
                  : undefined
              }
            />
            <KpiCard
              label="Divergência vs plataforma"
              value={
                divergence !== null
                  ? `${divergence > 0 ? "+" : ""}${formatInt(divergence)}`
                  : "Sem base de comparação"
              }
              periodLabel={periodLabel}
              hint={
                snapshot.ifood_deliveries_count === null
                  ? "O número de entregas do lado da plataforma (ifood_deliveries_count) ainda não é coletado — sem ele não dá para conferir cobrança."
                  : "Positivo = parceiro cobrou mais entregas do que a plataforma registrou."
              }
            />
          </div>

          <Card title="Detalhe do snapshot" subtitle={periodLabel}>
            <DataTable
              rows={[snapshot]}
              rowKey={(row) => String(row.id)}
              columns={[
                {
                  key: "provider",
                  header: "Provedor",
                  render: (row) => (
                    <span className="font-medium text-gray-800">
                      {row.provider ?? "—"}
                    </span>
                  ),
                },
                {
                  key: "period",
                  header: "Período",
                  render: (row) => formatPeriod(row.period_start, row.period_end),
                },
                {
                  key: "deliveries",
                  header: "Entregas (parceiro)",
                  render: (row) => formatInt(row.deliveries_count),
                },
                {
                  key: "ifood",
                  header: "Entregas (plataforma)",
                  render: (row) =>
                    row.ifood_deliveries_count === null
                      ? "sem dado"
                      : formatInt(row.ifood_deliveries_count),
                },
                {
                  key: "cost",
                  header: "Custo total",
                  render: (row) => formatBRL(row.total_cost),
                },
                {
                  key: "unit",
                  header: "Custo por entrega",
                  render: (row) => formatBRL(row.cost_per_delivery),
                },
              ]}
            />
            <p className="mt-3 text-[11px] text-gray-400">
              Coletado em {formatDateTime(snapshot.collected_at)}.
            </p>
          </Card>
        </>
      )}

      <Card title="Insights de logística">
        <InsightsList insights={insights} />
      </Card>
    </div>
  );
}
