import Link from "next/link";
import { Card, KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { InsightsList } from "@/components/ui/InsightsList";
import { getDailySales } from "@/lib/data/sales";
import { countOpenIssues } from "@/lib/data/issues";
import { getLatestOperationDaily, getLatestReviewSnapshots } from "@/lib/data/operations";
import { getLatestFinancialSnapshots } from "@/lib/data/financial";
import { getActiveInsights } from "@/lib/data/insights";
import {
  formatBRL,
  formatDate,
  formatDecimal,
  formatInt,
  formatMonth,
  formatPercent,
  computeDelta,
  formatDelta,
} from "@/lib/format";

export const dynamic = "force-dynamic";

const SECTIONS: { label: string; href: string; description: string }[] = [
  { label: "Vendas", href: "/vendas", description: "Dia fechado, 7 dias e mês" },
  { label: "Financeiro", href: "/financeiro", description: "Repasse, taxas e a receber" },
  { label: "Operação", href: "/operacao", description: "Cancelamentos, chamados e nota" },
  { label: "Cardápio", href: "/cardapio", description: "Catálogo, funil e top itens" },
  { label: "Marketing", href: "/marketing", description: "Promoções e Meta Ads" },
  { label: "Logística", href: "/logistica", description: "Entregas e divergência" },
];

/**
 * Página inicial pós-login: um resumo honesto do dia fechado mais recente,
 * com atalhos para as telas onde cada família de dado é detalhada. Todo KPI
 * carrega o período e a granularidade — e quando o dado não existe, isso é
 * dito com todas as letras em vez de virar zero.
 */
export default async function DesktopPage() {
  const [daily, openIssuesCount, operation, financial, reviews, insights] =
    await Promise.all([
      getDailySales(),
      countOpenIssues(),
      getLatestOperationDaily(),
      getLatestFinancialSnapshots(),
      getLatestReviewSnapshots(),
      getActiveInsights(undefined, 6),
    ]);

  const hasDaily = daily.rows.length > 0;
  const totalValue = hasDaily
    ? daily.rows.reduce((acc, r) => acc + (r.totalValue ?? 0), 0)
    : null;
  const totalOrders = hasDaily
    ? daily.rows.reduce((acc, r) => acc + (r.totalSales ?? 0), 0)
    : null;
  const blendedTicket =
    totalOrders && totalOrders > 0 && totalValue !== null ? totalValue / totalOrders : null;

  const hasPrevious = daily.previousRows.length > 0;
  const prevValue = hasPrevious
    ? daily.previousRows.reduce((acc, r) => acc + (r.totalValue ?? 0), 0)
    : null;

  const salesPeriodLabel = daily.referenceDate
    ? `Dia fechado — ${formatDate(daily.referenceDate)} (granularity: daily)`
    : "Nenhum dia fechado coletado ainda";

  const worstCancel = operation.rows
    .filter((r) => r.cancelRate !== null)
    .sort((a, b) => (b.cancelRate ?? 0) - (a.cancelRate ?? 0))[0];

  const receivable =
    financial.rows.length === 0
      ? null
      : financial.rows.reduce((acc, r) => acc + (r.receivableValue ?? 0), 0);

  const mainReview = reviews[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-acai-900">Desktop</h1>
        <p className="text-sm text-gray-500">
          Resumo do dia fechado mais recente. Nunca mistura dia em andamento
          com dia fechado, nem granularidades diferentes num mesmo comparativo.
        </p>
      </div>

      {daily.referenceDate && !daily.isYesterday && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Coleta atrasada.</strong> O dia fechado mais recente é{" "}
          {formatDate(daily.referenceDate)}, e não ontem.{" "}
          <Link href="/problemas" className="underline">
            Ver problemas
          </Link>
          .
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Faturamento (todos os canais)"
          value={formatBRL(totalValue)}
          periodLabel={salesPeriodLabel}
          hint={
            formatDelta(computeDelta(totalValue, prevValue), "vs dia fechado anterior") ??
            (hasDaily ? "Sem dia anterior coletado para comparar" : undefined)
          }
        />
        <KpiCard
          label="Ticket médio (blended)"
          value={formatBRL(blendedTicket)}
          periodLabel={salesPeriodLabel}
          hint={totalOrders !== null ? `${formatInt(totalOrders)} pedido(s)` : undefined}
        />
        <KpiCard
          label="Maior taxa de cancelamento"
          value={worstCancel ? formatPercent(worstCancel.cancelRate) : "—"}
          periodLabel={
            operation.referenceDate
              ? `Dia fechado — ${formatDate(operation.referenceDate)}`
              : "Sem dado diário de operação"
          }
          hint={worstCancel ? `Canal: ${worstCancel.channel.name}` : undefined}
        />
        <KpiCard
          label="Issues em aberto"
          value={formatInt(openIssuesCount)}
          periodLabel="Situação atual"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <KpiCard
          label="A receber das plataformas"
          value={formatBRL(receivable)}
          periodLabel={
            financial.periodMonth
              ? `Mês de referência — ${formatMonth(financial.periodMonth)}`
              : "Nenhum repasse coletado ainda"
          }
        />
        <KpiCard
          label="Nota da loja"
          value={
            mainReview?.storeRating !== undefined && mainReview?.storeRating !== null
              ? `${formatDecimal(mainReview.storeRating, 1)} ★`
              : "—"
          }
          periodLabel={
            mainReview?.periodDays
              ? `Janela da plataforma — últimos ${mainReview.periodDays} dias`
              : "Nenhuma nota coletada ainda"
          }
          hint={
            mainReview
              ? `${mainReview.channel.name} · ${formatInt(mainReview.storeCount)} avaliações`
              : undefined
          }
        />
      </div>

      <Card
        title="Faturamento de ontem por canal"
        subtitle={salesPeriodLabel}
      >
        <DataTable
          rows={daily.rows}
          rowKey={(row) => String(row.channel.id)}
          emptyMessage="Nenhum snapshot 'daily' encontrado para o dia fechado mais recente. Verifique se a coleta já rodou."
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
            { key: "orders", header: "Pedidos", render: (row) => formatInt(row.totalSales) },
            {
              key: "ticket",
              header: "Ticket médio",
              render: (row) => formatBRL(row.avgTicket),
            },
          ]}
        />
        <p className="mt-3 text-xs text-gray-500">
          Detalhe completo, comparativos e mensal em{" "}
          <Link href="/vendas" className="font-medium text-acai-600 hover:underline">
            Vendas
          </Link>
          .
        </p>
      </Card>

      <Card
        title="Insights"
        subtitle="Gerados de forma determinística após cada coleta — sem chamada de IA no carregamento da página"
      >
        <InsightsList insights={insights} />
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-acai-700">
          Seções
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-xl border border-acai-100 bg-white p-4 shadow-sm transition-colors hover:border-acai-300 hover:bg-acai-50/50"
            >
              <p className="text-sm font-semibold text-acai-800">{section.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{section.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {openIssuesCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Badge tone="danger">{openIssuesCount} em aberto</Badge>
          <Link href="/problemas" className="text-acai-600 hover:underline">
            Ver problemas de coleta
          </Link>
        </div>
      )}
    </div>
  );
}
