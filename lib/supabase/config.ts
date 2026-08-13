/**
 * Endereço e chave pública do projeto Supabase.
 *
 * Por que os valores estão no código e não só em variável de ambiente:
 * qualquer valor `NEXT_PUBLIC_*` é embutido no bundle que vai para o
 * navegador — ou seja, a chave anon JÁ é pública por definição, exatamente
 * como era no painel legado. Quem protege os dados é o RLS do Postgres, que
 * só libera as tabelas sensíveis para o papel `authenticated`. Deixar o
 * padrão aqui evita que um deploy sem variável configurada suba um painel
 * quebrado.
 *
 * As variáveis de ambiente continuam tendo prioridade, então dá para
 * apontar para outro projeto (staging, por exemplo) sem tocar no código.
 *
 * O que NUNCA pode aparecer aqui é a chave `service_role`: ela ignora RLS e
 * daria acesso total ao banco.
 */

const DEFAULT_SUPABASE_URL = "https://vzwzgbxgkgucqmpkfwki.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d3pnYnhna2d1Y3FtcGtmd2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNTk1NTcsImV4cCI6MjEwMTYzNTU1N30.V1e1Pzf-x4uRBDb5aBbEA7E_oa25pheS_oH7xCRBGxw";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
