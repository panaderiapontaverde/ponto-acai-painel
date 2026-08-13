"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Página de login via magic link (OTP por e-mail), sem senha.
 * Usuário único por enquanto: João (joaovitorrc10102002@gmail.com).
 * O primeiro login com esse e-mail autocria o usuário no Supabase Auth
 * (comportamento padrão do signInWithOtp com shouldCreateUser: true).
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-acai-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-acai-100 bg-white p-8 shadow-md">
        <h1 className="text-xl font-bold text-acai-800">Ponto do Açaí Farol</h1>
        <p className="mt-1 text-sm text-gray-500">
          Painel de gestão — acesso por link mágico (sem senha).
        </p>

        {status === "sent" ? (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            Link de acesso enviado para <strong>{email}</strong>. Confira sua
            caixa de entrada (e o spam) e clique no link para entrar.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-acai-500 focus:outline-none focus:ring-1 focus:ring-acai-500"
              />
            </div>

            {status === "error" && errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-lg bg-acai-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-acai-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? "Enviando..." : "Enviar link de acesso"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
