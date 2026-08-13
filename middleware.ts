import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Login obrigatório. Sem sessão Supabase válida, tudo que não for a própria
 * tela de login redireciona para /login.
 *
 * Isso não é só cosmético: a maior parte das tabelas (customers, brain_entries,
 * commands, insights, reviews) só libera SELECT para o papel `authenticated`
 * no RLS. Sem sessão real, essas telas viriam vazias — e o CRM, com nome e
 * telefone de cliente, ficaria acessível a qualquer um com a URL.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const isPublicPath = pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware a tudo, exceto arquivos estáticos e de imagem do
     * Next.js. O site legado (/legado/index.html) fica DENTRO da proteção de
     * propósito: ele lê as mesmas tabelas, incluindo a lista de clientes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
