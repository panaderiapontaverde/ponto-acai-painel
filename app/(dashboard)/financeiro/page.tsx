import { Card, KpiCard } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { InsightsList } from "@/components/ui/InsightsList";
import { getLatestFinancialSnapshots } from "@/lib/data/financial";
import { getActiveInsights } from "@/lib/data/insights";
import { formatBRL, formatDate, formatMonth, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const [{ periodMonth, rows }, insights] = await Promise.all([
    getLatestFinancialSnapshots(),
    getActiveInsights("financeiro", 6),
  ]);

  const periodLabel = periodMonth
    ? `Mês de referência — ${formatMonth(periodMonth)} (granularidade: mensal)`
    : "Nenhum repasse financeiro coletado ainda";

  const sum = (pick: (row: (typeof rows)[number]) => number | null) =>
    rows.length === 0 ? null : rows.reduce((acc, r) => acc + (pick(r) ?? 0), 0);

  const totalSales = sum((r) => r.salesValue);
  const totalFees = sum((r) => r.feesValue);
  const totalNet = sum((r) => r.netRevenue);
  const totalReceivable = sum((r) => r.receivableValue);

  const effectiveFeeRate =
    totalSales && totalSales > 0 && totalFees !== null
      ? (totalFees / totalSales) * 100
      : null;

  const nextPayment = rows
    .map((r) => r.nextPaymentDate)
    .filter((d): d is string => Boolean(d))
    .sort()[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-acai-900">Financeiro</h1>
        <p className="text-sm text-gray-500">
          Repasse das plataformas: quanto foi vendido, quanto ficou em taxas e
          serviços, e quanto sobra líquido. Este bloco é <strong>mensal</strong> —
          não deve ser comparado com os KPIs de dia fechado da tela de Vendas,
          que medem outra coisa em outro período.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Vendas brutas"
          value={formatBRL(totalSales)}
          periodLabel={periodLabel}
        />
        <KpiCard
          label="Taxas e comissões"
          value={formatBRL(totalFees)}
          periodLabel={periodLabel}
          hint={
            effectiveFeeRate !== null
              ? `${effectiveFeeRate.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% das vendas brutas`
              : undefined
          }
        />
        <KpiCard
          label="Receita líquida"
          value={formatBRL(totalNet)}
          periodLabel={periodLabel}
        />
        <KpiCard
          label="A receber"
          value={formatBRL(totalReceivable)}
          periodLabel={periodLabel}
          hint={nextPayment ? `Próximo pagamento em ${formatDate(nextPayment)}` : undefined}
        />
      </div>

      <Card title="Repasse por canal" subtitle={periodLabel}>
        <DataTable
          rows={rows}
          rowKey={(row) => `${row.channel.id}-${row.periodMonth}`}
          emptyMessage="Nenhum snapshot financeiro coletado ainda. Esta tela depende da coleta do extrato de repasse de cada plataforma."
          columns={[
            {
              key: "channel",
              header: "Canal",
              render: (row) => (
                <span className="font-medium text-gray-800">{row.channel.name}</span>
              ),
            },
            { key: "sales", header: "Vendas", render: (row) => formatBRL(row.salesValue) },
            { key: "fees", header: "Taxas", render: (row) => formatBRL(row.feesValue) },
            {
              key: "promo",
              header: "Promoções/serviços",
              render: (row) => formatBRL(row.promoServicesValue),
            },
            {
              key: "adjust",
              header: "Ajustes",
              render: (row) => formatBRL(row.adjustments),
            },
            { key: "net", header: "Líquido", render: (row) => formatBRL(row.netRevenue) },
            {
              key: "received",
              header: "Recebido",
              render: (row) => formatBRL(row.receivedValue),
            },
            {
              key: "retained",
              header: "Retido",
              render: (row) => formatBRL(row.retainedValue),
            },
            {
              key: "receivable",
              header: "A receber",
              render: (row) => formatBRL(row.receivableValue),
            },
            {
              key: "next",
              header: "Próx. pagamento",
              render: (row) => formatDate(row.nextPaymentDate),
            },
          ]}
        />
        {rows.length > 0 && (
          <p className="mt-3 text-[11px] text-gray-400">
            Coletado em {formatDateTime(rows[0].collectedAt)}.
          </p>
        )}
      </Card>

      <Card title="Insights financeiros">
        <InsightsList insights={insights} />
      </Card>
    </div>
  );
}
