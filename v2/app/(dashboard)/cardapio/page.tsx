import { Card, KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getCatalog } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

function formatBRL(value: number | null) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function CardapioPage() {
  const items = await getCatalog();
  const ativos = items.filter((i) => i.status === "ativo").length;
  const pausados = items.filter((i) => i.status !== "ativo").length;
  const categorias = new Set(items.map((i) => i.categoria)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-acai-900">Cardápio</h1>
        <p className="text-sm text-gray-500">
          Fonte oficial: <code className="text-xs">menu_catalog</code>. A tabela legada{" "}
          <code className="text-xs">products</code> está deprecated e não é usada aqui. Preços por canal
          mostrados lado a lado; product_channel_mapping (IDs externos reais) ainda em população
          progressiva.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="SKUs cadastrados" value={String(items.length)} periodLabel="Total no catálogo oficial" />
        <KpiCard label="Ativos / Pausados" value={`${ativos} / ${pausados}`} periodLabel="Status atual" />
        <KpiCard label="Categorias" value={String(categorias)} periodLabel="Distintas no catálogo" />
      </div>

      <Card title="Itens do cardápio" subtitle={`${items.length} SKUs (máx. 300 exibidos)`}>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Sem dado disponível.</p>
        ) : (
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-acai-100 text-left text-xs uppercase text-gray-500">
                  <th className="py-2 pr-3">Categoria</th>
                  <th className="py-2 pr-3">Produto</th>
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">iFood</th>
                  <th className="py-2 pr-3">99Food</th>
                  <th className="py-2 pr-3">Anota Aí</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-acai-50">
                    <td className="py-2 pr-3 text-gray-500">{i.categoria ?? "—"}</td>
                    <td className="py-2 pr-3 font-medium text-acai-800">{i.produto ?? "—"}</td>
                    <td className="py-2 pr-3 text-gray-500">{i.sku ?? "—"}</td>
                    <td className="py-2 pr-3">
                      <Badge tone={i.status === "ativo" ? "success" : "neutral"}>{i.status ?? "—"}</Badge>
                    </td>
                    <td className="py-2 pr-3 text-gray-600">{formatBRL(i.preco_atual)}</td>
                    <td className="py-2 pr-3 text-gray-600">{formatBRL(i.preco_99food)}</td>
                    <td className="py-2 pr-3 text-gray-600">{formatBRL(i.preco_anotaai)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
