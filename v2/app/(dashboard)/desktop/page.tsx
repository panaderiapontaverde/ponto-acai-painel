import { KpiCard, Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { getYesterdaySales } from "@/lib/data/sales";
import { countOpenIssues } from "@/lib/data/issues";
import { getLatestOperationDaily } from "@/lib/data/operations";
import { getLatestNegotiationDaily } from "@/lib/data/negotiations";
import { getLatestMarketingSnapshot } from "@/lib/data/marketing";
import { getLatestLogisticsSnapshot } from "@/lib/data/logistics";
import { getActiveInsights } from "@/lib/data/insights";
import { InsightsList } from "@/components/ui/InsightsList";

export const dynamic = "force-dynamic";

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "—";
  // As colunas de taxa (cancel_rate, calls_rate, store_response_rate) vêm
  // do banco já como percentual (ex: 1 = 1%, 100 = 100%), não como fração
  // 0-1 — mantemos o valor cru formatado com 1 casa decimal e o símbolo %.
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function formatDateLabel(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatPeriodLabel(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  if (start === end) return formatDateLabel(start);
  return `${formatDateLabel(start)} a ${formatDateLabel(end)}`;
}

/**
 * Página inicial pós-login. Mostra os KPIs mais recentes de dia fechado
 * (granularity = 'daily') organizados por seção: Vendas, Operação,
 * Marketing e Logística. Cada card/tabela sempre expõe o período e a
 * granularidade do dado exibido. Quando uma família de KPI ainda não tem
 * dado 'daily' coletado, mostra um empty state explícito em vez de
 * inventar número ou disfarçar outra granularidade como se fosse diária.
 */
export default async function DesktopPage() {
  const [
    { referenceDate: salesDate, rows: salesRows },
    openIssuesCount,
    { referenceDate: opDate, rows: opRows },
    { referenceDate: negDate, rows: negRows },
    { referenceDate: mktDate, isDaily: mktIsDaily, rows: mktRows },
    { snapshot: logisticsSnapshot, divergence: logisticsDivergence },
    insights,
  ] = await Promise.all([
    getYesterdaySales(),
    countOpenIssues(),
    getLatestOperationDaily(),
    getLatestNegotiationDaily(),
    getLatestMarketingSnapshot(),
    getLatestLogisticsSnapshot(),
    getActiveInsights(undefined, 6),
  ]);

  const totalRevenue = salesRows.reduce((acc, r) => acc + (r.revenue ?? 0), 0);
  const totalOrders = salesRows.reduce((acc, r) => acc + (r.ordersCount ?? 0), 0);
  const blendedTicket = totalOrders > 0 ? totalRevenue / totalOrders : null;
  const salesPeriodLabel = `Dia fechado — ${formatDateLabel(salesDate)} (granularity: daily)`;

  const opPeriodLabel = opDate
    ? `Dia fechado — ${formatDateLabel(opDate)} (granularity: daily)`
    : "Sem dado diário disponível";

  const negPeriodLabel = negDate
    ? `Dia fechado — ${formatDateLabel(negDate)} (granularity: daily)`
    : "Sem dado diário disponível";

  const mktPeriodLabel = mktDate
    ? mktIsDaily
      ? `Dia fechado — ${formatDateLabel(mktDate)} (granularity: daily)`
      : `Snapshot mais recente disponível (granularity: ${mktRows[0]?.granularity ?? "?"}) — período ${formatPeriodLabel(
          mktRows[0]?.periodStart ?? null,
          mktRows[0]?.periodEnd ?? null
        )}. Ainda não há linha 'daily' coletada para marketing.`
    : "Sem nenhum snapshot de marketing disponível ainda";

  const totalInvested = mktRows.reduce((acc, r) => acc + (r.investedTotal ?? 0), 0);
  const avgRoi =
    mktRows.length > 0
      ? mktRows.reduce((acc, r) => acc + (r.roi ?? 0), 0) / mktRows.length
      : null;

  const logisticsPeriodLabel = logisticsSnapshot
    ? `Período mais recente disponível — ${formatPeriodLabel(
        logisticsSnapshot.period_start,
        logisticsSnapshot.period_end
      )} (sem coluna de granularidade nesta tabela)`
    : "Sem nenhum snapshot de logística disponível ainda";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-acai-800">Desktop</h1>
        <p className="text-sm text-gray-500">
          Visão geral com os KPIs mais recentes de dia fechado. Nunca mistura
          dados de dia em andamento nem granularidades diferentes — quando um
          dado diário ainda não existe, isso é mostrado explicitamente.
        </p>
      </div>

      <Card title="Insights" subtitle="Gerados de forma determinística após cada coleta — sem chamada de IA no carregamento da página">
        <InsightsList insights={insights} />
      </Card>

      {/* ---------------------------- Vendas ---------------------------- */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-acai-700">
          Vendas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Faturamento (todos os canais)"
            value={formatCurrency(totalRevenue)}
            periodLabel={salesPeriodLabel}
          />
          <KpiCard
            label="Ticket médio (blended)"
            value={formatCurrency(blendedTicket)}
            periodLabel={salesPeriodLabel}
            hint={`${totalOrders} pedido(s)`}
          />
          <KpiCard
            label="Issues em aberto"
            value={String(openIssuesCount)}
            periodLabel="Snapshot atual"
          />
        </div>

        <Card title="Faturamento de ontem por canal" subtitle={salesPeriodLabel}>
          <DataTable
            rows={salesRows}
            rowKey={(row) => row.channel.id}
            emptyMessage="Nenhum snapshot 'daily' encontrado para o dia fechado mais recente. Verifique se a coleta de ontem já rodou."
            columns={[
              {
                key: "channel",
                header: "Canal",
                render: (row) => (
                  <span className="font-medium text-gray-800">
                    {row.channel.name}
                  </span>
                ),
              },
              {
                key: "revenue",
                header: "Faturamento",
                render: (row) => formatCurrency(row.revenue),
              },
              {
                key: "orders",
                header: "Pedidos",
                render: (row) => row.ordersCount ?? "—",
              },
              {
                key: "ticket",
                header: "Ticket médio",
                render: (row) => formatCurrency(row.averageTicket),
              },
            ]}
          />
        </Card>
      </section>

      {/* --------------------------- Operação --------------------------- */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-acai-700">
          Operação
        </h2>
        <Card title="Cancelamento e chamados por canal" subtitle={opPeriodLabel}>
          <DataTable
            rows={opRows}
            rowKey={(row) => String(row.channel.id)}
            emptyMessage="Nenhum snapshot operacional com granularity='daily' encontrado ainda. Assim que a coleta gerar um dia fechado, este card passa a mostrar dado real."
            columns={[
              {
                key: "channel",
                header: "Canal",
                render: (row) => (
                  <span className="font-medium text-gray-800">{row.channel.name}</span>
                ),
              },
              {
                key: "cancel_rate",
                header: "Taxa de cancelamento",
                render: (row) => formatPercent(row.cancelRate),
              },
              {
                key: "calls_rate",
                header: "Taxa de chamados",
                render: (row) => formatPercent(row.callsRate),
              },
            ]}
          />
        </Card>

        <Card title="Negociações — pedidos com problema" subtitle={negPeriodLabel}>
          <DataTable
            rows={negRows}
            rowKey={(row) => String(row.channel.id)}
            emptyMessage="Nenhum snapshot de negociações com granularity='daily' encontrado ainda. Hoje só existe dado rolling_7d para essa família, que não é exibido aqui para não misturar granularidades — assim que houver um dia fechado, aparece aqui."
            columns={[
              {
                key: "channel",
                header: "Canal",
                render: (row) => (
                  <span className="font-medium text-gray-800">{row.channel.name}</span>
                ),
              },
              {
                key: "problem_orders",
                header: "Pedidos com problema",
                render: (row) => row.problemOrders ?? "—",
              },
              {
                key: "store_response_rate",
                header: "Taxa de resposta da loja",
                render: (row) => formatPercent(row.storeResponseRate),
              },
            ]}
          />
        </Card>
      </section>

      {/* --------------------------- Marketing --------------------------- */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-acai-700">
          Marketing
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KpiCard
            label="Investimento total"
            value={formatCurrency(mktRows.length > 0 ? totalInvested : null)}
            periodLabel={mktPeriodLabel}
          />
          <KpiCard
            label="ROI médio"
            value={avgRoi !== null ? avgRoi.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "—"}
            periodLabel={mktPeriodLabel}
          />
        </div>
        <Card title="Marketing por canal" subtitle={mktPeriodLabel}>
          <DataTable
            rows={mktRows}
            rowKey={(row) => String(row.channel.id)}
            emptyMessage="Nenhum snapshot de marketing disponível ainda."
            columns={[
              {
                key: "channel",
                header: "Canal",
                render: (row) => (
                  <span className="font-medium text-gray-800">{row.channel.name}</span>
                ),
              },
              {
                key: "granularity",
                header: "Granularidade",
                render: (row) => row.granularity,
              },
              {
                key: "invested_total",
                header: "Investimento",
                render: (row) => formatCurrency(row.investedTotal),
              },
              {
                key: "roi",
                header: "ROI",
                render: (row) =>
                  row.roi !== null && row.roi !== undefined
                    ? row.roi.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                    : "—",
              },
            ]}
          />
        </Card>
      </section>

      {/* --------------------------- Logística --------------------------- */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-acai-700">
          Logística
        </h2>
        {logisticsSnapshot ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard
                label="Entregas Gami"
                value={
                  logisticsSnapshot.deliveries_count !== null
                    ? String(logisticsSnapshot.deliveries_count)
                    : "—"
                }
                periodLabel={logisticsPeriodLabel}
              />
              <KpiCard
                label="Custo total"
                value={formatCurrency(logisticsSnapshot.total_cost)}
                periodLabel={logisticsPeriodLabel}
                hint={
                  logisticsSnapshot.cost_per_delivery !== null
                    ? `${formatCurrency(logisticsSnapshot.cost_per_delivery)} por entrega`
                    : undefined
                }
              />
              <KpiCard
                label="Divergência Gami × iFood"
                value={
                  logisticsDivergence !== null
                    ? String(logisticsDivergence)
                    : "Sem dado de iFood para comparar"
                }
                periodLabel={logisticsPeriodLabel}
                hint={
                  logisticsSnapshot.ifood_deliveries_count === null
                    ? "ifood_deliveries_count ainda não foi coletado — só temos o lado Gami."
                    : undefined
                }
              />
            </div>
            <Card title="Detalhe do snapshot de logística" subtitle={logisticsPeriodLabel}>
              <DataTable
                rows={[logisticsSnapshot]}
                rowKey={(row) => String(row.id)}
                columns={[
                  {
                    key: "provider",
                    header: "Provedor",
                    render: (row) => row.provider ?? "—",
                  },
                  {
                    key: "deliveries_count",
                    header: "Entregas (Gami)",
                    render: (row) => row.deliveries_count ?? "—",
                  },
                  {
                    key: "ifood_deliveries_count",
                    header: "Entregas (iFood)",
                    render: (row) => row.ifood_deliveries_count ?? "sem dado",
                  },
                  {
                    key: "total_cost",
                    header: "Custo total",
                    render: (row) => formatCurrency(row.total_cost),
                  },
                  {
                    key: "cost_per_delivery",
                    header: "Custo por entrega",
                    render: (row) => formatCurrency(row.cost_per_delivery),
                  },
                ]}
              />
            </Card>
          </>
        ) : (
          <Card title="Logística">
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Nenhum snapshot de logística disponível ainda.
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
