import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * ATENÇÃO — login obrigatório TEMPORARIAMENTE desativado (decisão explícita do
 * dono do negócio, para acelerar QA/desenvolvimento da V2). O código de Auth
 * (Supabase Auth magic link, app_allowed_emails, app_users, roles) continua
 * intacto e pronto para ser reativado — só o redirecionamento forçado foi
 * removido. Leitura dos dashboards fica aberta; escrita sensível continua
 * protegida por RLS (só authenticated/service_role escrevem em tabelas
 * operacionais) e comandos criados sem sessão são sempre dry_run=true,
 * reforçado também no banco (policy com WITH CHECK).
 *
 * Para reativar a exigência de login: descomente o bloco de redirect abaixo.
 */
export async function middleware(request: NextRequest) {
  const { response } = await updateSession(request);

  // const pathname = request.nextUrl.pathname;
  // const isPublicPath =
  //   pathname.startsWith("/login") ||
  //   pathname.startsWith("/auth") ||
  //   pathname === "/";
  // if (!user && !isPublicPath) {
  //   const loginUrl = new URL("/login", request.url);
  //   loginUrl.searchParams.set("next", pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware a tudo, exceto arquivos estáticos e de imagem
     * do Next.js, para evitar overhead desnecessário.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
