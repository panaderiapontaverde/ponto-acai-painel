import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Rota raiz: apenas redireciona para /desktop (se autenticado) ou /login.
 * Toda a navegação real de dashboard vive em app/(dashboard).
 */
export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/desktop");
  } else {
    redirect("/login");
  }
}
