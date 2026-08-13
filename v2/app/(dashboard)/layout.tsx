import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";

const NAV_SECTIONS: { label: string; href: string; badge?: string }[] = [
  { label: "Desktop", href: "/desktop" },
  { label: "Cardápio", href: "/cardapio" },
  { label: "CRM", href: "/crm" },
  { label: "Avaliações", href: "/avaliacoes" },
  { label: "Redes sociais", href: "/redes-sociais" },
  { label: "Comandos", href: "/comandos" },
  { label: "Problemas", href: "/problemas" },
  { label: "Cérebro", href: "/cerebro" },
  { label: "NextFood", href: "/nextfood", badge: "Em implantação" },
];

/**
 * Shell principal da V2 — sidebar fixa + header, no padrão de um produto
 * empresarial (não um dashboard experimental). Login obrigatório está
 * temporariamente desativado (decisão explícita do dono do negócio para
 * acelerar QA); quando há sessão, mostra o e-mail e o botão de logout; sem
 * sessão, mostra um selo "QA sem login" e um link discreto para /login.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-acai-50 lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-acai-100 bg-white lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b border-acai-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-acai-700 text-sm font-bold text-white">
            PA
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-acai-900">Ponto do Açaí</p>
            <p className="text-[11px] text-gray-400">Farol · Sistema Operacional</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV_SECTIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-acai-50 hover:text-acai-800"
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-acai-100 px-5 py-3 text-[11px] text-gray-400">
          v2 · QA paralelo ao legado
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-acai-100 bg-white px-4 py-3 lg:px-6">
          <span className="text-sm font-bold text-acai-800 lg:hidden">
            Ponto do Açaí Farol
          </span>
          <nav className="flex gap-4 overflow-x-auto text-sm lg:hidden">
            {NAV_SECTIONS.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap text-gray-600 hover:text-acai-700">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <>
                <span className="text-xs text-gray-500">{user.email}</span>
                <LogoutButton />
              </>
            ) : (
              <>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  QA sem login
                </span>
                <Link href="/login" className="text-xs text-acai-600 hover:underline">
                  Entrar
                </Link>
              </>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
