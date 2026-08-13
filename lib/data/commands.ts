import { createClient } from "@/lib/supabase/server";
import type { Action, Command } from "@/lib/types/database";

export interface CommandWithActions extends Command {
  actions: Pick<Action, "id" | "status" | "platform" | "action_type">[];
}

/**
 * Lista os comandos mais recentes registrados pelos usuários, com as
 * actions vinculadas (join manual — o cliente Supabase/PostgREST aqui usa
 * a mesma FK actions.command_id -> commands.id já existente no schema).
 * Esta função só faz SELECT em commands e actions; nunca insere/atualiza
 * actions (isso é reservado ao worker, via service_role).
 */
export async function getRecentCommands(
  limit = 20
): Promise<CommandWithActions[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("commands")
    .select("*, actions ( id, status, platform, action_type )")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentCommands] erro ao consultar commands", error);
    return [];
  }

  return (data ?? []) as unknown as CommandWithActions[];
}
