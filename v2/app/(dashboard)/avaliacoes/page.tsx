import { Card, KpiCard } from "@/components/ui/Card";
import { InsightsList } from "@/components/ui/InsightsList";
import { getRecentReviews, getReviewsSummary } from "@/lib/data/social";
import { getActiveInsights } from "@/lib/data/insights";

export const dynamic = "force-dynamic";

export default async function AvaliacoesPage() {
  const [reviews, summary, insights] = await Promise.all([
    getRecentReviews(50),
    getReviewsSummary(),
    getActiveInsights("avaliacoes"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-acai-900">Avaliações</h1>
        <p className="text-sm text-gray-500">
          Estrutura granular (`reviews`) pronta e com RLS testada, mas a
          coleta ao vivo no iFood/99Food (nota, comentário, categoria,
          resposta da loja) ainda não foi implementada nesta rodada — por
          isso os números abaixo estão zerados hoje. Esta tela já está
          pronta para exibir dados reais assim que a coleta for ligada.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          label="Avaliações coletadas"
          value={String(summary.total)}
          periodLabel="Total acumulado (granular)"
          hint={summary.total === 0 ? "Coleta ainda não implementada" : undefined}
        />
        <KpiCard
          label="Nota média"
          value={summary.avgRating !== null ? summary.avgRating.toFixed(2) : "Sem dado disponível"}
          periodLabel="Calculada sobre avaliações granulares"
        />
      </div>

      <Card title="Insights">
        <InsightsList insights={insights} />
      </Card>

      <Card title="Avaliações recentes">
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">
            Coleta pendente. Nenhuma avaliação granular foi persistida ainda —
            hoje o painel legado só mostra nota média agregada por período.
          </p>
        ) : (
          <ul className="space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-acai-100 p-3 text-sm">
                <p className="font-semibold">{r.rating ?? "?"} ★ — {r.category ?? "sem categoria"}</p>
                <p className="text-gray-600">{r.comment ?? "sem comentário"}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
