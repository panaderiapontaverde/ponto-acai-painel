import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getActiveBrainEntries } from "@/lib/data/brain";

export const dynamic = "force-dynamic";

const typeTone: Record<string, "info" | "neutral" | "warning" | "success"> = {
  procedimento: "info",
  regra: "warning",
  preferencia: "neutral",
  decisao: "success",
  workflow: "info",
  excecao: "warning",
  hipotese: "neutral",
  aprendizado: "success",
  insight_historico: "neutral",
};

export default async function CerebroPage() {
  const entries = await getActiveBrainEntries();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-acai-900">Cérebro</h1>
        <p className="text-sm text-gray-500">
          Conhecimento operacional versionado (regras, workflows, decisões, aprendizados) — nunca dado
          transacional. A leitura exige sessão autenticada por RLS; é por isso que o painel pede login.
        </p>
      </div>

      <Card title="Entradas ativas" subtitle={`${entries.length} registros`}>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500">Sem dado disponível.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <li key={e.id} className="rounded-lg border border-acai-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-acai-800">{e.title}</p>
                  <div className="flex shrink-0 gap-1">
                    <Badge tone={typeTone[e.type] ?? "neutral"}>{e.type}</Badge>
                    <Badge tone="neutral">v{e.version}</Badge>
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600">{e.content}</p>
                <p className="mt-1 text-[11px] text-gray-400">
                  origem: {e.origin} · confiança: {e.confidence}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
