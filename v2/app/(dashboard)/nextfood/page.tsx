import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function NextFoodPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-acai-900">NextFood</h1>
        <Badge tone="warning">Em implantação</Badge>
      </div>
      <Card title="Integração planejada">
        <p className="text-sm text-gray-600">
          O NextFood (ERP da 3A Solution, usado hoje na Panaderia) está previsto como o futuro coração
          operacional/financeiro do ecossistema, mas ainda não está conectado ao Ponto do Açaí Farol.
          Nenhum workflow foi ensinado ainda para esta loja — nenhuma automação será criada aqui até
          isso acontecer, para não inventar comportamento sem validação real.
        </p>
      </Card>
    </div>
  );
}
