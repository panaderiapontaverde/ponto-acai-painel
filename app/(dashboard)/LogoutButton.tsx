import { signOut } from "@/app/login/actions";

/**
 * Sair. Usa a mesma server action do login, então a sessão é encerrada no
 * servidor (cookies limpos) — não só no cliente.
 */
export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        Sair
      </button>
    </form>
  );
}
