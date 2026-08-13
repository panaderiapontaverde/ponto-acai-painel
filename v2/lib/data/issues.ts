import { createClient } from "@/lib/supabase/server";
import type { CollectionIssue } from "@/lib/types/database";

/**
 * Busca issues de coleta em aberto, considerando tanto o campo novo
 * `status` (ex: 'open' | 'investigating') quanto o campo antigo `resolved`
 * (para issues criadas antes da migração que adicionou `status`).
 */
export async function getOpenIssues(): Promise<CollectionIssue[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("collection_issues")
    .select("*")
    .or("status.eq.open,status.eq.investigating,and(status.is.null,resolved.eq.false)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[getOpenIssues] erro ao consultar collection_issues", error);
    return [];
  }

  return (data ?? []) as CollectionIssue[];
}

export async function countOpenIssues(): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from("collection_issues")
    .select("id", { count: "exact", head: true })
    .or("status.eq.open,status.eq.investigating,and(status.is.null,resolved.eq.false)");

  if (error) {
    console.error("[countOpenIssues] erro ao consultar collection_issues", error);
    return 0;
  }

  return count ?? 0;
}

export interface IssueFilters {
  severity?: string;
  module?: string;
  platform?: string;
  /** 'open' (em aberto: status open/investigating OU status nulo com resolved=false) | 'resolved' (status resolved/wont_fix OU status nulo com resolved=true) */
  status?: "open" | "resolved";
}

/**
 * Busca collection_issues aplicando filtros opcionais de severity, module,
 * platform e status (aberto/resolvido). Quando nenhum filtro é passado,
 * o comportamento é equivalente a `getOpenIssues` mas SEM o filtro de
 * status — ou seja, lista as issues mais recentes de qualquer status. Isso
 * é usado pela página /problemas quando o usuário limpa os filtros; a
 * listagem "padrão" (sem query string) continua chamando getOpenIssues()
 * diretamente, então este comportamento só é acionado quando algum filtro
 * é explicitamente aplicado.
 *
 * O filtro de status considera tanto o campo novo `status` quanto o campo
 * antigo `resolved`, para não quebrar registros criados antes da migração
 * que adicionou `status`.
 */
export async function getFilteredIssues(
  filters: IssueFilters
): Promise<CollectionIssue[]> {
  const supabase = createClient();

  let query = supabase
    .from("collection_issues")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.severity) {
    query = query.eq("severity", filters.severity);
  }
  if (filters.module) {
    query = query.eq("module", filters.module);
  }
  if (filters.platform) {
    query = query.eq("platform", filters.platform);
  }
  if (filters.status === "open") {
    query = query.or(
      "status.eq.open,status.eq.investigating,and(status.is.null,resolved.eq.false)"
    );
  } else if (filters.status === "resolved") {
    query = query.or(
      "status.eq.resolved,status.eq.wont_fix,and(status.is.null,resolved.eq.true)"
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getFilteredIssues] erro ao consultar collection_issues", error);
    return [];
  }

  return (data ?? []) as CollectionIssue[];
}

/**
 * Retorna os valores distintos de severity/module/platform já usados em
 * collection_issues, para popular as opções de filtro na UI sem
 * hardcodar uma lista que pode ficar desatualizada.
 */
export async function getIssueFilterOptions(): Promise<{
  severities: string[];
  modules: string[];
  platforms: string[];
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("collection_issues")
    .select("severity, module, platform")
    .limit(1000);

  if (error) {
    console.error(
      "[getIssueFilterOptions] erro ao consultar collection_issues",
      error
    );
    return { severities: [], modules: [], platforms: [] };
  }

  const severities = new Set<string>();
  const modules = new Set<string>();
  const platforms = new Set<string>();

  for (const row of (data ?? []) as any[]) {
    if (row.severity) severities.add(row.severity);
    if (row.module) modules.add(row.module);
    if (row.platform) platforms.add(row.platform);
  }

  return {
    severities: Array.from(severities).sort(),
    modules: Array.from(modules).sort(),
    platforms: Array.from(platforms).sort(),
  };
}
