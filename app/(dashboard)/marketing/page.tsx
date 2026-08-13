import { Card, KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { InsightsList } from "@/components/ui/InsightsList";
import {
  getLatestMarketingSnapshot,
  getPromotionCampaigns,
  getLatestAdsSnapshot,
} from "@/lib/data/marketing";
import { getRecentAdCampaigns } from "@/lib/data/social";
import { getActiveInsights } from "@/lib/data/insights";
import {
  formatBRL,
  formatDecimal,
  formatInt,
  formatPeriod,
  formatDateTime,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [marketing, promotions, ads, adCampaigns, insights] = await Promise.all([
    getLatestMarketingSnapshot(),
    getPromotionCampaigns(30),
    getLatestAdsSnapshot(),
    getRecentAdCampaigns(20),
    getActiveInsights("marketing", 6),
  ]);

  const mktPeriodLabel =
    marketing.rows.length > 0
      ? `${formatPeriod(marketing.rows[0].periodStart, marketing.rows[0].periodEnd)} (granularity: ${marketing.rows[0].granularity})`
      : "Nenhum snapshot de marketing coletado ainda";

  const totalInvested =
    marketing.rows.length === 0
      ? null
      : marketing.rows.reduce((acc, r) => acc + (r.investedTotal ?? 0), 0);

  const avgRoi =
    marketing.rows.length === 0
      ? null
      : marketing.rows.reduce((acc, r) => acc + (r.roi ?? 0), 0) / marketing.rows.length;

  const adsPeriodLabel = ads
    ? `${formatPeriod(ads.periodStart, ads.periodEnd)} · coletado em ${formatDateTime(ads.collectedAt)}`
    : "Nenhum snapshot da conta de anúncios coletado ainda";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-acai-900">Marketing</h1>
        <p className="text-sm text-gray-500">
          Duas frentes distintas, mantidas separadas de propósito: promoções
          dentro das plataformas de venda (cupons, campanhas do iFood) e
          anúncios pagos no Meta Ads. Somar as duas num único &quot;investimento
          em marketing&quot; misturaria períodos e formas de medir resultado
          diferentes.
        </p>
      </div>

      {!marketing.isDaily && marketing.rows.length > 0 && (
        <div className="rounded-lg border border-acai-200 bg-acai-50 px-4 py-3 text-sm text-acai-800">
          Os números de promoções ainda não existem em granularidade diária. O
          que aparece abaixo é o snapshot mais recente disponível
          (<strong>{marketing.rows[0].granularity}</strong>) — exibido como tal, sem
          ser disfarçado de dado de dia fechado.
        </div>
      )}

      {/* -------------------- Promoções nas plataformas -------------------- */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-acai-700">
          Promoções nas plataformas de venda
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KpiCard
            label="Investimento em promoções"
            value={formatBRL(totalInvested)}
            periodLabel={mktPeriodLabel}
          />
          <KpiCard
            label="ROI médio"
            value={avgRoi === null ? "—" : formatDecimal(avgRoi, 2)}
            periodLabel={mktPeriodLabel}
            hint="Média simples entre canais — não é ponderada por investimento"
          />
        </div>

        <Card title="Por canal" subtitle={mktPeriodLabel}>
          <DataTable
            rows={marketing.rows}
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
                render: (row) => <Badge tone="neutral">{row.granularity}</Badge>,
              },
              {
                key: "invested",
                header: "Investido",
                render: (row) => formatBRL(row.investedTotal),
              },
              {
                key: "roi",
                header: "ROI",
                render: (row) => formatDecimal(row.roi, 2),
              },
            ]}
          />
        </Card>

        <Card
          title="Campanhas promocionais"
          subtitle="Cada campanha tem o próprio período — por isso são listadas uma a uma, sem total somado entre janelas diferentes"
        >
          <DataTable
            rows={promotions}
            rowKey={(row) => String(row.id)}
            emptyMessage="Nenhuma campanha promocional coletada ainda."
            columns={[
              {
                key: "name",
                header: "Campanha",
                render: (row) => (
                  <span className="font-medium text-gray-800">
                    {row.campaignName ?? "—"}
                  </span>
                ),
              },
              { key: "channel", header: "Canal", render: (row) => row.channel.name },
              {
                key: "period",
                header: "Período",
                render: (row) => formatPeriod(row.periodStart, row.periodEnd),
              },
              { key: "orders", header: "Pedidos", render: (row) => formatInt(row.orders) },
              {
                key: "sales",
                header: "Vendas",
                render: (row) => formatBRL(row.salesValue),
              },
              {
                key: "invested",
                header: "Investido",
                render: (row) => formatBRL(row.invested),
              },
              { key: "roi", header: "ROI", render: (row) => formatDecimal(row.roi, 2) },
            ]}
          />
        </Card>
      </section>

      {/* ----------------------------- Meta Ads ----------------------------- */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-acai-700">
          Anúncios pagos (Meta Ads)
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Saldo da conta"
            value={formatBRL(ads?.balance ?? null)}
            periodLabel={adsPeriodLabel}
            hint={ads?.accountName ?? undefined}
          />
          <KpiCard
            label="Gasto no período"
            value={formatBRL(ads?.amountSpentPeriod ?? null)}
            periodLabel={adsPeriodLabel}
          />
          <KpiCard
            label="Campanhas ativas"
            value={formatInt(ads?.activeCampaigns ?? null)}
            periodLabel={adsPeriodLabel}
          />
        </div>

        <Card
          title="Campanhas do Meta Ads"
          subtitle="Nível campanha. A hierarquia conjunto/anúncio (ad_sets, ads) existe no banco mas ainda não é coletada."
        >
          <DataTable
            rows={adCampaigns}
            rowKey={(row) => `${row.campaignName}-${row.periodEnd}`}
            emptyMessage="Nenhuma campanha de Meta Ads coletada ainda."
            columns={[
              {
                key: "name",
                header: "Campanha",
                render: (row) => (
                  <span className="font-medium text-gray-800">{row.campaignName}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge tone={row.status === "ACTIVE" ? "success" : "neutral"}>
                    {row.status ?? "—"}
                  </Badge>
                ),
              },
              {
                key: "period",
                header: "Período",
                render: (row) => formatPeriod(row.periodStart, row.periodEnd),
              },
              {
                key: "spent",
                header: "Gasto",
                render: (row) => formatBRL(row.amountSpent),
              },
              {
                key: "results",
                header: "Resultados",
                render: (row) => formatInt(row.results),
              },
              {
                key: "cpr",
                header: "Custo por resultado",
                render: (row) => formatBRL(row.costPerResult),
              },
              { key: "cpm", header: "CPM", render: (row) => formatBRL(row.cpm) },
            ]}
          />
        </Card>
      </section>

      <Card title="Insights de marketing">
        <InsightsList insights={insights} />
      </Card>
    </div>
  );
}
