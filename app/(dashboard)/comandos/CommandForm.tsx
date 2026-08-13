"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/**
 * Formulário de registro de comando em linguagem natural. Esta versão do
 * frontend NUNCA executa nada de verdade: todo comando é gravado com
 * dry_run = true e status = 'received'. A execução real depende de um
 * worker (service_role) que ainda não existe — por isso o aviso na UI é
 * permanente e visível, não um detalhe escondido.
 */
export function CommandForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const rawText = text.trim();
    if (!rawText) return;

    setState({ kind: "submitting" });

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("commands").insert({
      raw_text: rawText,
      dry_run: true,
      status: "received",
      created_by: user?.email ?? "desconhecido",
    } as never);

    if (error) {
      console.error("[CommandForm] erro ao registrar comando", error);
      setState({ kind: "error", message: error.message });
      return;
    }

    setState({ kind: "success" });
    setText("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        <strong>Isto ainda não executa nada de verdade.</strong> O comando é
        apenas registrado (dry-run) para a infraestrutura de automação que
        está em construção. Nenhuma ação é enviada a iFood, 99Food, Gami ou
        qualquer outra plataforma a partir deste formulário.
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder='Ex: "Pausar o produto Açaí Tradicional 300ml no iFood até domingo"'
        rows={3}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-acai-500 focus:outline-none"
        disabled={state.kind === "submitting"}
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state.kind === "submitting" || text.trim().length === 0}
          className="rounded-md bg-acai-700 px-4 py-2 text-sm font-medium text-white hover:bg-acai-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.kind === "submitting" ? "Registrando..." : "Registrar (dry-run)"}
        </button>

        {state.kind === "success" && (
          <span className="text-sm text-green-700">
            Comando registrado como dry-run. Nada foi executado.
          </span>
        )}
        {state.kind === "error" && (
          <span className="text-sm text-red-700">Erro: {state.message}</span>
        )}
      </div>
    </form>
  );
}
