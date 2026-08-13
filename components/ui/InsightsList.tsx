import type { Insight } from "@/lib/types/database";
import { Badge } from "./Badge";

const severityTone: Record<Insight["severity"], "info" | "warning" | "danger"> = {
  info: "info",
  atencao: "warning",
  critico: "danger",
};

const typeLabel: Record<Insight["type"], string> = {
  fato: "Fato",
  hipotese: "Hipótese",
  projecao: "Projeção",
  recomendacao: "Recomendação",
};

/**
 * Lista de insights determinísticos (nunca gráfico de linha, sempre com
 * período/evidência explícitos). Quando vazia, mostra um empty-state
 * honesto explicando o motivo real (dado insuficiente para comparação),
 * em vez de esconder a seção ou inventar um número.
 */
export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nenhum insight ativo no momento. O gerador determinístico só produz
        insights quando há dados suficientes para comparação (ex.: pelo menos
        2 pontos de coleta diária no mesmo canal). Isso é esperado enquanto o
        histórico de coleta diária ainda é curto.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {insights.map((insight) => (
        <li key={insight.id} className="rounded-lg border border-acai-100 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-acai-800">{insight.title}</p>
            <div className="flex shrink-0 gap-1">
              <Badge tone="neutral">{typeLabel[insight.type]}</Badge>
              <Badge tone={severityTone[insight.severity]}>{insight.severity}</Badge>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-600">{insight.description}</p>
          {(insight.period_start || insight.period_end) && (
            <p className="mt-1 text-[11px] text-gray-400">
              Período: {insight.period_start ?? "?"} a {insight.period_end ?? "?"}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
