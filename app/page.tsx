import { redirect } from "next/navigation";

/**
 * Rota raiz: apenas manda para o Desktop. Quem não tem sessão é barrado
 * antes disso, pelo middleware, que redireciona para /login.
 */
export default function RootPage() {
  redirect("/desktop");
}
