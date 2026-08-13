import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import {
  getOpenIssues,
  getFilteredIssues,
  getIssueFilterOptions,
} from "@/lib/data/issues";
import type { CollectionIssue } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function severityTone(severity: string | null) {
  switch (severity) {
    case "critical":
    case "high":
      return "danger" as const;
    case "medium":
      return "warning" as const;
    case "low":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

function statusTone(status: string | null, resolved: boolean | null) {
  const effective = status ?? (resolved ? "resolved" : "open");
  switch (effective) {
    case "open":
      return "danger" as const;
    case "investigating":
      return "warning" as const;
    case "resolved":
      return "success" as const;
    case "wont_fix":
    case "ignored":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

interface ProblemasPageProps {
  searchParams: {
    severity?: string;
    module?: string;
    platform?: string;
    status?: string;
  };
}

/**
 * Lista collection_issues, com filtros opcionais por severity, module,
 * platform e status (aberto/resolvido) via query string
 * (?severity=&module=&platform=&status=). Sem nenhum filtro aplicado, o
 * comportamento é idêntico ao original: lista as issues em aberto
 * (status open/investigating, ou registros antigos com resolved=false).
 */
export default async function ProblemasPage({
  searchParams,
}: ProblemasPageProps) {
  const { severity, module: moduleFilter, platform, status } = searchParams;
  const hasFilters = Boolean(severity || moduleFilter || platform || status);

  const [issues, filterOptions] = await Promise.all([
    hasFilters
      ? getFilteredIssues({
          severity,
          module: moduleFilter,
          platform,
          status: status === "resolved" ? "resolved" : status === "open" ? "open" : undefined,
        })
      : getOpenIssues(),
    getIssueFilterOptions(),
  ]);

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { severity, module: moduleFilter, platform, status, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/problemas?${qs}` : "/problemas";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-acai-800">Problemas de coleta</h1>
        <p className="text-sm text-gray-500">
          {hasFilters
            ? "Listagem filtrada. Sem filtros, mostra as issues em aberto (status open/investigating, ou registros antigos com resolved = false)."
            : "Issues em aberto (status: open/investigating, ou registros antigos com resolved = false)."}
        </p>
      </div>

      <Card title="Filtros">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500" htmlFor="severity">
              Severidade
            </label>
            <select
              id="severity"
              name="severity"
              defaultValue={severity ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Todas</option>
              {filterOptions.severities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500" htmlFor="module">
              Módulo
            </label>
            <select
              id="module"
              name="module"
              defaultValue={moduleFilter ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {filterOptions.modules.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500" htmlFor="platform">
              Plataforma
            </label>
            <select
              id="platform"
              name="platform"
              defaultValue={platform ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Todas</option>
              {filterOptions.platforms.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status ?? ""}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              <option value="open">Em aberto</option>
              <option value="resolved">Resolvido</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-acai-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-acai-800"
            >
              Filtrar
            </button>
            <a
              href="/problemas"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Limpar
            </a>
          </div>
        </form>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
            <span>Atalhos:</span>
            <a className="text-acai-700 hover:underline" href={buildHref({ status: "open" })}>
              status=open
            </a>
            <a className="text-acai-700 hover:underline" href={buildHref({ status: "resolved" })}>
              status=resolved
            </a>
            <a className="text-acai-700 hover:underline" href="/problemas">
              limpar tudo
            </a>
          </div>
        )}
      </Card>

      <Card title={hasFilters ? "Resultado filtrado" : "Em aberto"} subtitle={`${issues.length} issue(s)`}>
        <DataTable<CollectionIssue>
          rows={issues}
          rowKey={(row) => row.id}
          emptyMessage={
            hasFilters
              ? "Nenhum problema encontrado para os filtros aplicados."
              : "Nenhum problema em aberto. Pipeline saudável."
          }
          columns={[
            {
              key: "module",
              header: "Módulo",
              render: (row) => row.module ?? row.source ?? "—",
            },
            {
              key: "platform",
              header: "Plataforma",
              render: (row) => row.platform ?? "—",
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <Badge tone={statusTone(row.status, row.resolved)}>
                  {row.status ?? (row.resolved ? "resolved" : "open")}
                </Badge>
              ),
            },
            {
              key: "severity",
              header: "Severidade",
              render: (row) => (
                <Badge tone={severityTone(row.severity)}>
                  {row.severity ?? "—"}
                </Badge>
              ),
            },
            {
              key: "description",
              header: "Descrição",
              render: (row) => (
                <span className="text-sm text-gray-700">
                  {row.description ?? "—"}
                </span>
              ),
              className: "max-w-md",
            },
            {
              key: "attempts",
              header: "Tentativas",
              render: (row) => row.attempts ?? "—",
            },
            {
              key: "created_at",
              header: "Criado em",
              render: (row) => formatDateTime(row.created_at),
            },
          ]}
        />
      </Card>
    </div>
  );
}
