import { Card, KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { InsightsList } from "@/components/ui/InsightsList";
import { getDailySales, getRolling7dSales, getMonthlyRevenue } from "@/lib/data/sales";
import { getActiveInsights } from "@/lib/data/insights";
import {
  formatBRL,
  formatInt,
  formatDate,
  formatMonth,
  formatPeriod,
  computeDelta,
  formatDelta,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VendasPage() {
  const [daily, rolling, monthly, insights] = await Promise.all([
    getDailySales(),
    getRolling7dSales(),
    getMonthlyRevenue(12),
    getActiveInsights("vendas", 6),
  ]);

  const sum = (rows: { totalValue: number | null }[]) =>
    rows.reduce((acc, r) => acc + (r.totalValue ?? 0), 0);
  const countOrders = (rows: { totalSales: number | null }[]) =>
    rows.reduce((acc, r) => acc + (r.totalSales ?? 0), 0);

  const hasDaily = daily.rows.length > 0;
  const totalValue = hasDaily ? sum(daily.rows) : null;
  const totalOrders = hasDaily ? countOrders(daily.rows) : null;
  const blendedTicket =
    totalOrders && totalOrders > 0 && totalValue !== null ? totalValue / totalOrders : null;

  const hasPrevious = daily.previousRows.length > 0;
  const prevValue = hasPrevious ? sum(daily.previousRows) : null;
  const prevOrders = hasPrevious ? countOrders(daily.previousRows) : null;
  const prevTicket =
    prevOrders && prevOrders > 0 && prevValue !== null ? prevValue / prevOrders : null;

  const periodLabel = daily.referenceDate
    ? `Dia fechado — ${formatDate(daily.referenceDate)} (granularity: daily)`
    : "Nenhum dia fechado coletado ainda";

  const previousByChannel = new Map(
    daily.previousRows.map((r) => [r.channel.id, r] as const)
  );

  const rollingPeriodLabel =
    rolling.periodEnd !== null
      ? `Janela móvel de 7 dias — ${formatPeriod(rolling.periodStart, rolling.periodEnd)} (granularity: rolling_7d)`
      : "Nenhuma janela de 7 dias coletada ainda";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-acai-900">Vendas</h1>
        <p className="text-sm text-gray-500">
          Faturamento por canal em três granularidades mantidas separadas: dia
          fechado, janela móvel de 7 dias e mês. Elas nunca são somadas nem
          comparadas entre si — cada bloco diz explicitamente o período que
          está mostrando.
        </p>
      </div>

      {daily.referenceDate && !daily.isYesterday && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Coleta atrasada.</strong> O dia fechado mais recente no banco é{" "}
          {formatDate(daily.referenceDate)}, e não ontem. Os números abaixo são reais,
          mas não são de ontem — provavelmente a rotina de coleta não rodou ou falhou.
          Confira em <span className="font-medium">Problemas</span>.
        </div>
      )}

      {/* --------------------------- Dia fechado --------------------------- */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-acai-700">
            Dia fechado
          </h2>
          <Badge tone="info">daily</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Faturamento (todos os canais)"
            value={formatBRL(totalValue)}
            periodLabel={periodLabel}
            hint={
              formatDelta(computeDelta(totalValue, prevValue), "vs dia fechado anterior") ??
              (hasDaily ? "Sem dia anterior coletado para comparar" : undefined)
            }
          />
          <KpiCard
            label="Pedidos"
            value={formatInt(totalOrders)}
            periodLabel={periodLabel}
            hint={formatDelta(computeDelta(totalOrders, prevOrders), "vs dia fechado anterior")}
          />
          <KpiCard
            label="Ticket médio (blended)"
            value={formatBRL(blendedTicket)}
            periodLabel={periodLabel}
            hint={formatDelta(computeDelta(blendedTicket, prevTicket), "vs dia fechado anterior")}
          />
        </div>

        <Card
          title="Por canal"
          subtitle={
            daily.previousDate
              ? `${periodLabel} · comparado com ${formatDate(daily.previousDate)}`
              : periodLabel
          }
        >
          <DataTable
            rows={daily.rows}
            rowKey={(row) => String(row.channel.id)}
            emptyMessage="Nenhum snapshot 'daily' encontrado. Verifique se a rotina de coleta já rodou."
            columns={[
              {
                key: "channel",
                header: "Canal",
                render: (row) => (
                  <span className="font-medium text-gray-800">{row.channel.name}</span>
                ),
              },
              {
                key: "value",
                header: "Faturamento",
                render: (row) => formatBRL(row.totalValue),
              },
              {
                key: "delta",
                header: "vs dia anterior",
                render: (row) => {
                  const previous = previousByChannel.get(row.channel.id);
                  const delta = computeDelta(row.totalValue, previous?.totalValue ?? null);
                  if (!delta) return <span className="text-gray-400">sem base</span>;
                  return (
                    <Badge
                      tone={
                        delta.direction === "up"
                          ? "success"
                          : delta.direction === "down"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {formatDelta(delta, "")?.trim()}
                    </Badge>
                  );
                },
              },
              {
                key: "orders",
                header: "Pedidos",
                render: (row) => formatInt(row.totalSales),
              },
              {
                key: "ticket",
                header: "Ticket médio",
                render: (row) => formatBRL(row.avgTicket),
              },
              {
                key: "new",
                header: "Clientes novos",
                render: (row) => formatInt(row.newCustomers),
              },
            ]}
          />
        </Card>
      </section>

      {/* ------------------------- Janela de 7 dias ------------------------- */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-acai-700">
            Últimos 7 dias
          </h2>
          <Badge tone="neutral">rolling_7d</Badge>
        </div>
        <Card title="Por canal" subtitle={rollingPeriodLabel}>
          <DataTable
            rows={rolling.rows}
            rowKey={(row) => String(row.channel.id)}
            emptyMessage="Nenhuma janela móvel de 7 dias coletada ainda."
            columns={[
              {
                key: "channel",
                header: "Canal",
                render: (row) => (
                  <span className="font-medium text-gray-800">{row.channel.name}</span>
                ),
              },
              {
                key: "value",
                header: "Faturamento",
                render: (row) => formatBRL(row.totalValue),
              },
              {
                key: "orders",
                header: "Pedidos",
                render: (row) => formatInt(row.totalSales),
              },
              {
                key: "ticket",
                header: "Ticket médio",
                render: (row) => formatBRL(row.avgTicket),
              },
            ]}
          />
        </Card>
      </section>

      {/* ------------------------------ Mensal ------------------------------ */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-acai-700">
          Faturamento mensal
        </h2>
        <Card
          title="Por mês e canal"
          subtitle="Meses marcados como 'em andamento' ainda não fecharam — não compare com meses fechados."
        >
          <DataTable
            rows={monthly}
            rowKey={(row) => `${row.channel.id}-${row.month}`}
            emptyMessage="Nenhum faturamento mensal coletado ainda."
            columns={[
              {
                key: "month",
                header: "Mês",
                render: (row) => (
                  <span className="font-medium text-gray-800">{formatMonth(row.month)}</span>
                ),
              },
              {
                key: "channel",
                header: "Canal",
                render: (row) => row.channel.name,
              },
              {
                key: "status",
                header: "Situação",
                render: (row) =>
                  row.isClosed ? (
                    <Badge tone="success">fechado</Badge>
                  ) : (
                    <Badge tone="warning">em andamento</Badge>
                  ),
              },
              {
                key: "value",
                header: "Faturamento",
                render: (row) => formatBRL(row.totalValue),
              },
              {
                key: "orders",
                header: "Pedidos",
                render: (row) => formatInt(row.totalSales),
              },
              {
                key: "ticket",
                header: "Ticket médio",
                render: (row) => formatBRL(row.avgTicket),
              },
              {
                key: "new",
                header: "Clientes novos",
                render: (row) => formatInt(row.newCustomers),
              },
            ]}
          />
        </Card>
      </section>

      <Card
        title="Insights de vendas"
        subtitle="Gerados de forma determinística após cada coleta — sem chamada de IA no carregamento da página"
      >
        <InsightsList insights={insights} />
      </Card>
    </div>
  );
}
