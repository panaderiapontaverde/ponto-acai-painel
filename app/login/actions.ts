"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * E-mail da conta do painel. A senha NÃO fica aqui nem em nenhuma variável
 * de ambiente da aplicação: ela vive apenas como hash no Supabase Auth, que
 * é quem valida o login. Assim a sessão criada é uma sessão Supabase real e
 * o RLS passa a enxergar o usuário como `authenticated` — que é o que
 * libera CRM, Cérebro, Comandos e Insights.
 */
const PANEL_EMAIL =
  process.env.PANEL_LOGIN_EMAIL ?? "joaovitorrc10102002@gmail.com";

function sanitizeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  // Só aceita caminho interno — evita open redirect via ?next=https://...
  if (!value.startsWith("/") || value.startsWith("//")) return "/desktop";
  return value;
}

export async function signIn(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNext(formData.get("next"));

  if (!password) {
    redirect(`/login?erro=vazio&next=${encodeURIComponent(next)}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: PANEL_EMAIL,
    password,
  });

  if (error) {
    console.error("[signIn] falha de autenticação", error.message);
    redirect(`/login?erro=invalida&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
