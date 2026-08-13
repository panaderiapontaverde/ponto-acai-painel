import { Card, KpiCard } from "@/components/ui/Card";
import { InsightsList } from "@/components/ui/InsightsList";
import {
  getLatestOrganicSnapshot,
  getRecentAdCampaigns,
  getRecentInstagramPosts,
  getRecentDirectMessages,
} from "@/lib/data/social";
import { getActiveInsights } from "@/lib/data/insights";

export const dynamic = "force-dynamic";

function formatBRL(value: number | null) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function RedesSociaisPage() {
  const [organic, campaigns, posts, directMessages, insights] = await Promise.all([
    getLatestOrganicSnapshot(),
    getRecentAdCampaigns(20),
    getRecentInstagramPosts(20),
    getRecentDirectMessages(20),
    getActiveInsights("social"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-acai-900">Redes sociais</h1>
        <p className="text-sm text-gray-500">
          Orgânico e Meta Ads separados abaixo. Hoje a coleta é agregada
          (snapshot diário/rolling por conta); a hierarquia granular Conta →
          Campanha → Conjunto → Anúncio e a coleta por post/Reel/Story ainda
          não foram implementadas nesta rodada.
        </p>
      </div>

      <Card title="Orgânico (Instagram)" subtitle={organic ? `Período: ${organic.periodStart} a ${organic.periodEnd}` : "Sem dado disponível"}>
        {organic ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label="Seguidores" value={String(organic.followers ?? "—")} periodLabel="Snapshot mais recente" />
            <KpiCard label="Variação" value={String(organic.followersDelta ?? "—")} periodLabel="vs. período anterior" />
            <KpiCard label="Alcance" value={String(organic.reach ?? "—")} periodLabel="Snapshot mais recente" />
            <KpiCard label="Interações" value={String(organic.interactionsTotal ?? "—")} periodLabel="Snapshot mais recente" />
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sem dado disponível.</p>
        )}
      </Card>

      <Card title="Meta Ads — campanhas recentes">
        {campaigns.length === 0 ? (
          <p className="text-sm text-gray-500">Sem dado disponível.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-acai-100 text-left text-xs uppercase text-gray-500">
                  <th className="py-2 pr-3">Campanha</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Investido</th>
                  <th className="py-2 pr-3">Resultados</th>
                  <th className="py-2 pr-3">Custo/resultado</th>
                  <th className="py-2 pr-3">CPM</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr key={i} className="border-b border-acai-50">
                    <td className="py-2 pr-3 font-medium text-acai-800">{c.campaignName}</td>
                    <td className="py-2 pr-3 text-gray-600">{c.status ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray-600">{formatBRL(c.amountSpent)}</td>
                    <td className="py-2 pr-3 text-gray-600">{c.results ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray-600">{formatBRL(c.costPerResult)}</td>
                    <td className="py-2 pr-3 text-gray-600">{formatBRL(c.cpm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Conteúdo granular (posts/Reels/Stories)">
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Coleta por conteúdo ainda não implementada — schema pronto em
            `instagram_posts`, aguardando coleta ao vivo.
          </p>
        ) : (
          <p className="text-sm text-gray-500">{posts.length} posts coletados.</p>
        )}
      </Card>

      <Card title="Instagram Direct (somente leitura)" subtitle={`${directMessages.length} conversas recentes — nunca respondidas automaticamente`}>
        {directMessages.length === 0 ? (
          <p className="text-sm text-gray-500">Sem dado disponível.</p>
        ) : (
          <ul className="divide-y divide-acai-50">
            {directMessages.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-acai-800">{m.sender ?? "—"}</p>
                  <p className="truncate text-xs text-gray-500">{m.preview ?? "—"}</p>
                </div>
                <span className="shrink-0 text-[11px] text-gray-400">{m.category ?? "não classificado"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Insights">
        <InsightsList insights={insights} />
      </Card>
    </div>
  );
}
