/**
 * Tipos TypeScript básicos para as tabelas do Supabase usadas neste
 * scaffold. Cobre apenas as tabelas consumidas pelas páginas já
 * construídas (desktop e problemas). Conforme o frontend crescer, o ideal
 * é gerar este arquivo automaticamente via
 * `supabase gen types typescript` (ou a ferramenta MCP
 * generate_typescript_types) a partir do schema real.
 */

export type Granularity =
  | "daily"
  | "rolling_7d"
  | "rolling_30d"
  | "monthly"
  | "realtime_snapshot"
  | "rolling_custom"
  | "unknown";

export interface Channel {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
  active: boolean | null;
  created_at: string | null;
}

export interface SalesSnapshot {
  id: string;
  channel_id: string;
  period_start: string; // date
  period_end: string; // date
  granularity: Granularity;
  revenue: number | null;
  orders_count: number | null;
  average_ticket: number | null;
  created_at: string | null;
  collected_at: string | null;
}

export interface CollectionIssue {
  id: string;
  module: string | null;
  platform: string | null;
  run_id: string | null;
  status: string | null; // novo campo (ex: 'open' | 'investigating' | 'resolved' | 'ignored')
  attempts: number | null;
  context: Record<string, unknown> | null;
  resolution: string | null;
  source: string | null; // campo antigo, mantido por compatibilidade
  severity: string | null;
  description: string | null;
  resolved: boolean | null; // campo antigo, mantido por compatibilidade
  resolved_at: string | null;
  created_at: string | null;
}

export interface CollectionRun {
  id: string;
  routine: string | null;
  started_at: string | null;
  finished_at: string | null;
  reference_date: string | null;
  sources_planned: string[] | null;
  sources_completed: string[] | null;
  sources_failed: string[] | null;
  records_collected: number | null;
  status: string | null;
}

/**
 * Snapshots operacionais (cancelamento, chamados, horas abertas) por canal.
 * `granularity` deve ser sempre filtrada explicitamente nas queries —
 * nunca misturar 'daily' com 'rolling_7d' no mesmo comparativo.
 */
export interface OperationSnapshot {
  id: number;
  channel_id: number | null;
  period_start: string | null;
  period_end: string | null;
  granularity: Granularity;
  cancel_rate: number | null;
  calls_rate: number | null;
  open_hours: number | null;
  top_dispatch_day: string | null;
  top_dispatch_count: number | null;
  source_status: string | null;
  collected_at: string | null;
}

/** Snapshots de negociações/pedidos com problema por canal. */
export interface NegotiationSnapshot {
  id: number;
  channel_id: number | null;
  period_start: string | null;
  period_end: string | null;
  granularity: Granularity;
  problem_orders: number | null;
  store_response_rate: number | null;
  client_accept_rate: number | null;
  refunds_value: number | null;
  source_status: string | null;
  collected_at: string | null;
}

/** Snapshots de investimento/ROI em marketing (promoções, ads) por canal. */
export interface MarketingSnapshot {
  id: number;
  channel_id: number | null;
  period_start: string | null;
  period_end: string | null;
  granularity: Granularity;
  promo_orders: number | null;
  invested_total: number | null;
  roi: number | null;
  avg_ticket_promo: number | null;
  source_status: string | null;
  collected_at: string | null;
}

/**
 * Snapshots de logística (entregas Gami x iFood). Ainda não tem coluna
 * `granularity` — o período é definido só por period_start/period_end.
 */
export interface LogisticsSnapshot {
  id: number;
  provider: string | null;
  period_start: string | null;
  period_end: string | null;
  deliveries_count: number | null;
  ifood_deliveries_count: number | null;
  total_cost: number | null;
  cost_per_delivery: number | null;
  source_status: string | null;
  collected_at: string | null;
}

/**
 * Comando em linguagem natural registrado pelo usuário. Nesta versão do
 * frontend, todo comando é criado com dry_run = true (apenas registro de
 * intenção — não existe execução real ainda).
 */
export interface Command {
  id: string;
  raw_text: string;
  interpreted_intent: Record<string, unknown> | null;
  scope: "temporary" | "permanent" | null;
  status: CommandStatus;
  dry_run: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CommandStatus =
  | "received"
  | "interpreted"
  | "pending"
  | "executing"
  | "completed"
  | "partially_completed"
  | "failed"
  | "cancelled"
  | "intervention_required";

/**
 * Ação concreta derivada de um comando. Somente o worker (service_role)
 * pode inserir/atualizar; o frontend só lê para acompanhar progresso.
 */
export interface Action {
  id: string;
  command_id: string;
  platform: string;
  action_type: string;
  target: string | null;
  payload: Record<string, unknown> | null;
  status: CommandStatus;
  dry_run: boolean;
  idempotency_key: string | null;
  attempts: number;
  max_attempts: number;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
  evidence: Record<string, unknown> | null;
  created_at: string;
}

/** Cliente do CRM v2 (tabela `customers`), com agregados calculados a partir de `orders` reais. */
export interface Customer {
  id: string;
  full_name: string | null;
  phone_normalized: string | null;
  phone_raw: string | null;
  origin: string | null;
  first_contact_at: string | null;
  first_order_at: string | null;
  last_order_at: string | null;
  orders_count: number;
  total_spent: number;
  avg_ticket: number | null;
  status: string;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Insight gerado pelo motor determinístico (e futuramente por IA) em `insights`. */
export interface Insight {
  id: string;
  module: string;
  type: "fato" | "hipotese" | "projecao" | "recomendacao";
  title: string;
  description: string;
  evidence: Record<string, unknown> | null;
  severity: "info" | "atencao" | "critico";
  period_start: string | null;
  period_end: string | null;
  generated_by: string;
  generated_at: string;
  active: boolean;
}

/** Avaliação granular (iFood/99Food) — tabela `reviews`, ainda sem coleta ao vivo implementada. */
export interface Review {
  id: string;
  channel_id: number | null;
  external_review_id: string | null;
  rating: number | null;
  comment: string | null;
  category: string | null;
  sentiment: string | null;
  severity: string | null;
  store_response: string | null;
  order_external_id: string | null;
  reviewed_at: string | null;
  collected_at: string | null;
}

/** Post/Reel/Story granular do Instagram — tabela `instagram_posts`, ainda sem coleta ao vivo. */
export interface InstagramPost {
  id: string;
  external_post_id: string | null;
  post_type: string | null;
  caption: string | null;
  posted_at: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  reach: number | null;
  impressions: number | null;
  collected_at: string | null;
}

/** Conversa do Instagram Direct — tabela `instagram_direct_messages`, somente leitura, sem resposta automática. */
export interface InstagramDirectMessage {
  id: string;
  external_thread_id: string | null;
  sender: string | null;
  preview: string | null;
  message_at: string | null;
  category: string | null;
  status: "novo" | "lido" | "classificado" | "respondido_manual";
  customer_id: string | null;
  collected_at: string;
}

/**
 * Estrutura mínima compatível com o formato esperado por
 * `createBrowserClient<Database>()` / `createServerClient<Database>()`
 * do @supabase/ssr. Não é o schema completo do banco — apenas o
 * suficiente para tipar as queries usadas neste scaffold.
 */
export interface Database {
  public: {
    Tables: {
      channels: {
        Row: Channel;
        Insert: Partial<Channel>;
        Update: Partial<Channel>;
      };
      sales_snapshots: {
        Row: SalesSnapshot;
        Insert: Partial<SalesSnapshot>;
        Update: Partial<SalesSnapshot>;
      };
      collection_issues: {
        Row: CollectionIssue;
        Insert: Partial<CollectionIssue>;
        Update: Partial<CollectionIssue>;
      };
      collection_runs: {
        Row: CollectionRun;
        Insert: Partial<CollectionRun>;
        Update: Partial<CollectionRun>;
      };
      operation_snapshots: {
        Row: OperationSnapshot;
        Insert: Partial<OperationSnapshot>;
        Update: Partial<OperationSnapshot>;
      };
      negotiation_snapshots: {
        Row: NegotiationSnapshot;
        Insert: Partial<NegotiationSnapshot>;
        Update: Partial<NegotiationSnapshot>;
      };
      marketing_snapshots: {
        Row: MarketingSnapshot;
        Insert: Partial<MarketingSnapshot>;
        Update: Partial<MarketingSnapshot>;
      };
      logistics_snapshots: {
        Row: LogisticsSnapshot;
        Insert: Partial<LogisticsSnapshot>;
        Update: Partial<LogisticsSnapshot>;
      };
      commands: {
        Row: Command;
        Insert: Partial<Command>;
        Update: Partial<Command>;
      };
      actions: {
        Row: Action;
        Insert: Partial<Action>;
        Update: Partial<Action>;
      };
      customers: {
        Row: Customer;
        Insert: Partial<Customer>;
        Update: Partial<Customer>;
      };
      insights: {
        Row: Insight;
        Insert: Partial<Insight>;
        Update: Partial<Insight>;
      };
      reviews: {
        Row: Review;
        Insert: Partial<Review>;
        Update: Partial<Review>;
      };
      instagram_posts: {
        Row: InstagramPost;
        Insert: Partial<InstagramPost>;
        Update: Partial<InstagramPost>;
      };
      instagram_direct_messages: {
        Row: InstagramDirectMessage;
        Insert: Partial<InstagramDirectMessage>;
        Update: Partial<InstagramDirectMessage>;
      };
    };
  };
}
