import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signIn } from "./actions";

export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  vazio: "Digite a senha do painel.",
  invalida: "Senha incorreta. Tente de novo.",
  falha:
    "Não foi a senha: o serviço de autenticação do Supabase respondeu com erro. Tente de novo em instantes; se persistir, confira os logs de Auth no painel do Supabase.",
};

/**
 * Login por senha única. O painel tem uma conta só (o dono), então não faz
 * sentido pedir e-mail: o e-mail é fixo no servidor e aqui só se digita a
 * senha, que é validada pelo Supabase Auth.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: { erro?: string; next?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(searchParams.next ?? "/desktop");
  }

  const erro = searchParams.erro ? ERROS[searchParams.erro] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-acai-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-acai-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-acai-700 text-sm font-bold text-white">
            PA
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-acai-900">Ponto do Açaí</p>
            <p className="text-xs text-gray-400">Farol · Sistema Operacional</p>
          </div>
        </div>

        <h1 className="text-lg font-bold text-acai-900">Entrar no painel</h1>
        <p className="mt-1 text-sm text-gray-500">
          Acesso restrito. A senha é validada pelo Supabase Auth e cria uma
          sessão real — é ela que libera a leitura de CRM, Cérebro e Comandos.
        </p>

        <form action={signIn} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={searchParams.next ?? "/desktop"} />
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              className="mt-1 w-full rounded-lg border border-acai-200 px-3 py-2 text-sm outline-none focus:border-acai-500 focus:ring-1 focus:ring-acai-500"
            />
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-acai-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-acai-800"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-[11px] leading-relaxed text-gray-400">
          Quem pode entrar é controlado no banco (tabela{" "}
          <code>app_allowed_emails</code> + trigger em <code>auth.users</code>), não
          apenas escondendo esta tela.
        </p>
      </div>
    </main>
  );
}
