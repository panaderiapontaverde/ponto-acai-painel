import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { getRecentCommands, type CommandWithActions } from "@/lib/data/commands";
import { CommandForm } from "./CommandForm";

export const dynamic = "force-dynamic";

function statusTone(status: string) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "failed":
    case "cancelled":
      return "danger" as const;
    case "executing":
    case "pending":
    case "interpreted":
      return "warning" as const;
    case "intervention_required":
      return "danger" as const;
    case "partially_completed":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function actionsSummary(command: CommandWithActions): string {
  const actions = command.actions ?? [];
  if (actions.length === 0) return "0 ações ainda";
  const done = actions.filter((a) => a.status === "completed").length;
  return `${done}/${actions.length} concluído(s)`;
}

/**
 * Página de comandos em linguagem natural (motor de comandos, Fase 2).
 * Só faz SELECT em commands/actions e INSERT em commands — nunca insere ou
 * atualiza actions a partir do cliente (RLS não permite mesmo, e o worker
 * que faria a execução real ainda não existe).
 */
export default async function ComandosPage() {
  const commands = await getRecentCommands(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-acai-800">Comandos</h1>
        <p className="text-sm text-gray-500">
          Registre um comando em linguagem natural para a infraestrutura de
          automação em construção. Nesta versão, todo comando é gravado como
          dry-run — só registra a intenção, não executa nada.
        </p>
      </div>

      <Card title="Novo comando">
        <CommandForm />
      </Card>

      <Card title="Comandos recentes" subtitle={`${commands.length} registro(s)`}>
        <DataTable<CommandWithActions>
          rows={commands}
          rowKey={(row) => row.id}
          emptyMessage="Nenhum comando registrado ainda."
          columns={[
            {
              key: "raw_text",
              header: "Comando",
              render: (row) => (
                <span className="text-sm text-gray-800">{row.raw_text}</span>
              ),
              className: "max-w-md",
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
              ),
            },
            {
              key: "dry_run",
              header: "Dry-run",
              render: (row) => (
                <Badge tone={row.dry_run ? "info" : "danger"}>
                  {row.dry_run ? "sim" : "não"}
                </Badge>
              ),
            },
            {
              key: "actions",
              header: "Ações",
              render: (row) => actionsSummary(row),
            },
            {
              key: "created_by",
              header: "Criado por",
              render: (row) => row.created_by,
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
