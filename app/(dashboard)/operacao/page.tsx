import { Card, KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { InsightsList } from "@/components/ui/InsightsList";
import {
  getLatestOperationDaily,
  getLatestReviewSnapshots,
  getRecentCollectionRuns,
} from "@/lib/data/operations";
import { getLatestNegotiationDaily } from "@/lib/data/negotiations";
import { getActiveInsights } from "@/lib/data/insights";
import {
  formatBRL,
  formatDate,
  formatDateTime,
  formatDecimal,
  formatInt,
  formatPercent,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OperacaoPage() {
  const [operation, negotiation, reviews, runs, insights] = await Promise.all([
    getLatestOperationDaily(),
    getLatestNegotiationDaily(),
    getLatestReviewSnapshots(),
    getRecentCollectionRuns(8),
    getActiveInsights("operacao", 6),
  ]);

  const opPeriodLabel = operation.referenceDate
    ? `Dia fechado — ${formatDate(operation.referenceDate)} (granularity: daily)`
    : "Sem dado diário de operação coletado ainda";

  const negPeriodLabel = negotiation.referenceDate
    ? `Dia fechado — ${formatDate(negotiation.referenceDate)} (granularity: daily)`
    : "Sem dado diário de negociações coletado ainda";

  const worstCancel = operation.rows
    .filter((r) => r.cancelRate !== null)
    .sort((a, b) => (b.cancelRate ?? 0) - (a.cancelRate ?? 0))[0];

  const totalProblemOrders =
    negotiation.rows.length === 0
      ? null
      : negotiation.rows.reduce((acc, r) => acc + (r.problemOrders ?? 0), 0);

  const totalRefunds =
    negotiation.rows.length === 0
      ? null
      : negotiation.rows.reduce((acc, r) => acc + (r.refundsValue ?? 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-acai-900">Operação</h1>
        <p className="text-sm text-gray-500">
          Saúde da operação no dia fechado: cancelamentos, chamados, pedidos com
          problema e nota da loja. A nota vem de uma janela própria da
          plataforma (normalmente 90 dias) — está separada dos KPIs diários de
          propósito, para não sugerir que ela reage a um único dia.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Maior taxa de cancelamento"
          value={worstCancel ? formatPercent(worstCancel.cancelRate) : "—"}
          periodLabel={opPeriodLabel}
          hint={worstCancel ? `Canal: ${worstCancel.channel.name}` : undefined}
        />
        <KpiCard
          label="Pedidos com problema"
          value={formatInt(totalProblemOrders)}
          periodLabel={negPeriodLabel}
        />
        <KpiCard
          label="Valor reembolsado"
          value={formatBRL(totalRefunds)}
          periodLabel={negPeriodLabel}
        />
      </div>

      <Card title="Cancelamento, chamados e horas abertas" subtitle={opPeriodLabel}>
        <DataTable
          rows={operation.rows}
          rowKey={(row) => String(row.channel.id)}
          emptyMessage="Nenhum snapshot operacional com granularity='daily' encontrado ainda."
          columns={[
            {
              key: "channel",
              header: "Canal",
              render: (row) => (
                <span className="font-medium text-gray-800">{row.channel.name}</span>
              ),
            },
            {
              key: "cancel",
              header: "Taxa de cancelamento",
              render: (row) => formatPercent(row.cancelRate),
            },
            {
              key: "calls",
              header: "Taxa de chamados",
              render: (row) => formatPercent(row.callsRate),
            },
            {
              key: "hours",
              header: "Horas aberto",
              render: (row) =>
                row.openHours === null ? "—" : `${formatDecimal(row.openHours, 1)} h`,
            },
            {
              key: "dispatch",
              header: "Melhor dia de despacho",
              render: (row) =>
                row.topDispatchDay
                  ? `${formatDate(row.topDispatchDay)} (${formatInt(row.topDispatchCount)})`
                  : "—",
            },
          ]}
        />
      </Card>

      <Card title="Negociações — pedidos com problema" subtitle={negPeriodLabel}>
        <DataTable
          rows={negotiation.rows}
          rowKey={(row) => String(row.channel.id)}
          emptyMessage="Nenhum snapshot de negociações com granularity='daily' encontrado ainda. Só existe dado em janela móvel para essa família, que não é exibido aqui para não misturar granularidades."
          columns={[
            {
              key: "channel",
              header: "Canal",
              render: (row) => (
                <span className="font-medium text-gray-800">{row.channel.name}</span>
              ),
            },
            {
              key: "problems",
              header: "Pedidos com problema",
              render: (row) => formatInt(row.problemOrders),
            },
            {
              key: "store",
              header: "Resposta da loja",
              render: (row) => formatPercent(row.storeResponseRate),
            },
            {
              key: "client",
              header: "Aceite do cliente",
              render: (row) => formatPercent(row.clientAcceptRate),
            },
            {
              key: "refunds",
              header: "Reembolsos",
              render: (row) => formatBRL(row.refundsValue),
            },
          ]}
        />
      </Card>

      <Card
        title="Nota da loja"
        subtitle="Janela definida pela própria plataforma — não é dia fechado"
      >
        <DataTable
          rows={reviews}
          rowKey={(row) => String(row.channel.id)}
          emptyMessage="Nenhuma nota de loja coletada ainda."
          columns={[
            {
              key: "channel",
              header: "Canal",
              render: (row) => (
                <span className="font-medium text-gray-800">{row.channel.name}</span>
              ),
            },
            {
              key: "window",
              header: "Janela",
              render: (row) =>
                row.periodDays === null ? "—" : `últimos ${row.periodDays} dias`,
            },
            {
              key: "store",
              header: "Nota da loja",
              render: (row) =>
                row.storeRating === null
                  ? "—"
                  : `${formatDecimal(row.storeRating, 1)} ★ (${formatInt(row.storeCount)} avaliações)`,
            },
            {
              key: "delivery",
              header: "Nota da entrega",
              render: (row) =>
                row.deliveryRating === null
                  ? "sem dado"
                  : `${formatDecimal(row.deliveryRating, 1)} ★ (${formatInt(row.deliveryCount)})`,
            },
            {
              key: "irregular",
              header: "Irregulares",
              render: (row) => formatInt(row.irregularCount),
            },
          ]}
        />
      </Card>

      <Card
        title="Execuções da coleta"
        subtitle="Responde 'a coleta terminou completa?' sem precisar inferir isso pela presença de linhas nas tabelas de negócio"
      >
        <DataTable
          rows={runs}
          rowKey={(row) => row.id}
          emptyMessage="Nenhuma execução de coleta registrada em collection_runs ainda. Enquanto a rotina de coleta não gravar aqui, a única forma de saber se ela rodou é olhar a data do dado mais recente em cada tela."
          columns={[
            {
              key: "routine",
              header: "Rotina",
              render: (row) => (
                <span className="font-medium text-gray-800">{row.routine ?? "—"}</span>
              ),
            },
            {
              key: "reference",
              header: "Data de referência",
              render: (row) => formatDate(row.referenceDate),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <Badge
                  tone={
                    row.status === "ok" || row.status === "completed"
                      ? "success"
                      : row.status === "partial"
                        ? "warning"
                        : row.status === "failed"
                          ? "danger"
                          : "neutral"
                  }
                >
                  {row.status ?? "—"}
                </Badge>
              ),
            },
            {
              key: "failed",
              header: "Fontes com falha",
              render: (row) =>
                row.sourcesFailed && row.sourcesFailed.length > 0
                  ? row.sourcesFailed.join(", ")
                  : "nenhuma",
            },
            {
              key: "records",
              header: "Registros",
              render: (row) => formatInt(row.recordsCollected),
            },
            {
              key: "finished",
              header: "Terminou em",
              render: (row) => formatDateTime(row.finishedAt),
            },
          ]}
        />
      </Card>

      <Card title="Insights de operação">
        <InsightsList insights={insights} />
      </Card>
    </div>
  );
}
