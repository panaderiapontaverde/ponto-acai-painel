# Ponto do Açaí Farol — Painel v2 (scaffold)

Scaffold inicial do **novo** frontend do Ecossistema Ponto do Açaí Farol, em
Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase.

## Importante: este projeto roda EM PARALELO ao site atual

Este projeto **não substitui** o `index.html` / site atual em produção.
É um código novo, isolado, ainda sem repositório Git próprio e sem projeto
Vercel próprio. Nada aqui afeta o que já está publicado. A migração real
(deploy em um novo projeto Vercel, DNS, etc.) só deve acontecer depois de
aprovação explícita do dono do negócio.

## Stack

- Next.js 14 (App Router), TypeScript, React 18
- Tailwind CSS (classes puras, sem shadcn/ui instalado — os componentes em
  `components/ui` foram escritos à mão para não depender de um passo de
  instalação extra)
- `@supabase/ssr` + `@supabase/supabase-js` para autenticação e queries
  (Server Components / Route Handlers)
- Autenticação: Supabase Auth com magic link (OTP por e-mail), sem senha.
  Usuário único por enquanto: João (joaovitorrc10102002@gmail.com)

## Estrutura de pastas

```
app/
  login/                    página de login (magic link)
  auth/callback/route.ts    troca o código do magic link pela sessão
  (dashboard)/              grupo de rotas autenticadas (protegidas pelo middleware)
    layout.tsx              header + navegação + checagem de sessão
    desktop/                página inicial pós-login (KPIs de dia fechado)
    problemas/              lista de collection_issues em aberto
components/ui/              Card, KpiCard, Badge, DataTable (Tailwind puro)
lib/supabase/               clients Supabase (browser, server, middleware)
lib/types/database.ts       tipos TypeScript básicos das tabelas usadas
lib/data/                   funções de acesso a dados (server-side), ex:
                             getYesterdaySales(), getOpenIssues()
middleware.ts                protege tudo dentro de (dashboard)
```

## Regras de negócio já embutidas no código

- **Nunca mistura granularidade diferente**: `getYesterdaySales()` filtra
  explicitamente `granularity = 'daily'` e o período do dia fechado mais
  recente (ontem, fuso America/Sao_Paulo). Qualquer novo KPI deve seguir o
  mesmo padrão — nunca comparar `daily` com `rolling_7d`/`rolling_30d` etc.
  num mesmo comparativo.
- **Todo KPI mostra o período/granularidade** explicitamente
  (`KpiCard` tem um campo obrigatório `periodLabel`).
- **Sem gráficos de linha**: nenhuma dependência de biblioteca de gráficos
  foi adicionada neste scaffold. Quando forem construídos gráficos (fases
  seguintes), usar apenas barras/barras horizontais/funil/cards/tabelas —
  nunca LineChart/AreaChart.

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` (o `.env.local` já vem
preenchido neste scaffold com a URL e a chave **anon** públicas do projeto
Supabase `vzwzgbxgkgucqmpkfwki`, só para acelerar o setup local — mas ele
está no `.gitignore` e nunca deve ir para um repositório):

```
NEXT_PUBLIC_SUPABASE_URL=https://vzwzgbxgkgucqmpkfwki.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave anon/publishable, não a service_role>
```

**Nunca** usar a chave `service_role` (secreta) neste frontend — ela dá
acesso total ao banco, ignorando RLS, e não deve existir em nenhum client
código que roda no navegador nem em Server Components que respondem a
requests públicos.

## Como rodar localmente

Pré-requisitos: Node.js 18.18+ (recomendado 20+) e npm.

```bash
cd ponto-acai-v2
npm install
npm run dev
```

Abra http://localhost:3000 — você será redirecionado para `/login`.

Para build de produção:

```bash
npm run build
npm start
```

> Neste ambiente de scaffold (sandbox), `npm install` foi executado com
> sucesso ou, se a rede estiver indisponível, precisa ser rodado na máquina
> do usuário antes do primeiro uso — veja o relatório da tarefa para o
> resultado real da validação.

## Login / autenticação

- A tela `/login` chama `supabase.auth.signInWithOtp({ email, options: {
  shouldCreateUser: true } })`. No primeiro login do e-mail autorizado, o
  Supabase Auth **autocria o usuário** automaticamente — não é necessário
  criar o usuário manualmente antes.
- O callback `/auth/callback` troca o código do link recebido por e-mail
  pela sessão (cookies), e redireciona para `/desktop`.
- `middleware.ts` protege tudo dentro do grupo `(dashboard)`: sem sessão
  válida, redireciona para `/login`.

### Restrição real de quem pode entrar (não só na UI)

"Apenas meu usuário por enquanto" é aplicado **no banco**, não só escondendo
o formulário: existe uma tabela `public.app_allowed_emails` (hoje só com
`joaovitorrc10102002@gmail.com`, papel `owner`) e um trigger
`BEFORE INSERT ON auth.users` que rejeita a criação de qualquer conta cujo
e-mail não esteja nessa lista — mesmo que alguém chame
`supabase.auth.signInWithOtp` diretamente, contornando esta UI. Testado (via
transação revertida, sem afetar dados reais): e-mail fora da lista foi
bloqueado com erro; e-mail autorizado passou e gerou automaticamente uma
linha em `public.app_users` (id, email, role).

Para dar acesso a mais alguém no futuro (equipe, papéis diferentes), basta
adicionar uma linha em `app_allowed_emails` com o e-mail e o `role`
(`owner`/`operator`/`viewer`) — a tabela `app_users` e o middleware já estão
preparados para múltiplos usuários, só falta a UI de gestão de usuários (fora
do escopo deste scaffold).

## O que este scaffold já faz

- `/login` — login via magic link (sem senha)
- `/desktop` — KPIs simples de dia fechado: faturamento por canal (ontem,
  granularity=daily), ticket médio blended, contagem de issues em aberto
- `/problemas` — lista de `collection_issues` em aberto (usa `status` novo
  e cai para `resolved` antigo em registros mais velhos)

## Próximos passos (fora do escopo deste scaffold)

1. Validar `npm install` / `npm run build` na máquina do usuário (rede
   liberada) e rodar `npm run dev` para conferir visualmente as 3 páginas.
2. Criar/confirmar o usuário João no Supabase Auth (ou simplesmente fazer
   o primeiro login pelo magic link, que autocria).
3. Só com aprovação explícita do usuário: criar um **novo** repositório Git
   e um **novo** projeto Vercel dedicados a este frontend (sem tocar no
   projeto/deploy atual), configurar as env vars lá, e então apontar um
   subdomínio ou rota de teste para ele.
4. Expandir as páginas com o restante das seções mapeadas na proposta de
   arquitetura (operação, negociações, funil de cardápio, marketing,
   financeiro, clientes, redes sociais, catálogo etc.), sempre seguindo as
   mesmas regras de granularidade/período visíveis por KPI e sem gráficos
   de linha.
5. Gerar `lib/types/database.ts` automaticamente a partir do schema real
   (via `supabase gen types typescript` ou a tool MCP
   `generate_typescript_types`) para substituir os tipos manuais atuais,
   que cobrem só as tabelas usadas neste scaffold.
