# Ponto do Açaí Farol — Painel (V2)

Painel de gestão do Ecossistema Ponto do Açaí Farol em Next.js 14 (App
Router) + TypeScript + Tailwind CSS + Supabase.

Esta é a **V2**, que assumiu a raiz do repositório. O painel legado (um
`index.html` único) foi preservado e continua acessível, autenticado, em
`/legado/index.html`.

## Stack

- Next.js 14 (App Router), TypeScript, React 18
- Tailwind CSS (classes puras, sem shadcn/ui — os componentes em
  `components/ui` são escritos à mão, sem passo de instalação extra)
- `@supabase/ssr` + `@supabase/supabase-js` (Server Components, Server
  Actions e Route Handlers)
- Autenticação: Supabase Auth por **senha**, com uma conta única (o dono)

## Estrutura

```
app/
  login/                    tela de senha + server actions (signIn/signOut)
  auth/callback/route.ts    callback de magic link (mantido para uso futuro)
  (dashboard)/              rotas autenticadas
    layout.tsx              sidebar + header + sessão
    desktop/                resumo do dia fechado + atalhos
    vendas/                 diário, janela de 7 dias e mensal
    financeiro/             repasse, taxas, retido e a receber
    operacao/               cancelamento, chamados, nota e execuções da coleta
    cardapio/               catálogo, funil e itens mais vendidos
    marketing/              promoções das plataformas + Meta Ads
    logistica/              entregas, custo e divergência
    crm/                    clientes
    avaliacoes/             avaliações granulares
    redes-sociais/          Instagram e anúncios
    comandos/               registro de comandos (dry-run)
    problemas/              collection_issues
    cerebro/                conhecimento operacional versionado
    nextfood/               integração ainda não iniciada
components/ui/              Card, KpiCard, Badge, DataTable, InsightsList
lib/format.ts               formatação e cálculo de variação compartilhados
lib/supabase/               clients (browser, server, middleware) + config
lib/data/                   acesso a dados por família (server-side)
middleware.ts               exige sessão em tudo que não é /login e /auth
public/legado/index.html    painel antigo, preservado
```

## Regras de negócio embutidas no código

- **Nunca misturar granularidades.** Dia fechado (`daily`), janela móvel
  (`rolling_7d`) e mês vivem em blocos separados na tela de Vendas e nunca
  são somados nem comparados entre si. O mesmo vale para a nota da loja, que
  vem de uma janela própria da plataforma (~90 dias).
- **Todo KPI mostra período e granularidade** — `KpiCard` tem o campo
  obrigatório `periodLabel`.
- **Ausência de dado nunca vira zero.** `null` é exibido como `—` ou com um
  texto explicando por que não existe. "Não coletamos" e "foi zero" são
  coisas diferentes.
- **Coleta atrasada é dita, não escondida.** Se o dia fechado mais recente
  não for ontem, as telas mostram um aviso em vez de aparecerem vazias.
- **Sem gráficos de linha.** Nenhuma biblioteca de gráficos é usada; o funil
  de cardápio é desenhado com barras proporcionais em CSS.
- **Comandos são sempre dry-run** nesta versão do frontend — nenhuma ação é
  enviada para iFood, 99Food, Gami ou qualquer plataforma a partir daqui.

## Autenticação e acesso

- Conta única, login por senha, validado pelo Supabase Auth
  (`signInWithPassword`). A senha não vive em variável de ambiente da
  aplicação: só existe como hash no Supabase.
- `middleware.ts` exige sessão em tudo, inclusive no painel legado servido
  de `/legado`.
- Quem pode ter conta é controlado **no banco**: a tabela
  `public.app_allowed_emails` mais um trigger `BEFORE INSERT ON auth.users`
  rejeitam qualquer e-mail fora da lista. O perfil em `public.app_users`
  (com o papel) é criado automaticamente por trigger no primeiro acesso.
- Para dar acesso a mais alguém: inserir a linha em `app_allowed_emails` com
  o papel (`owner`/`operator`/`viewer`) e criar o usuário correspondente no
  Supabase Auth. Falta ainda a UI de gestão de usuários.

Isso não é só cosmético: a maior parte das tabelas (`customers`,
`brain_entries`, `commands`, `insights`, `reviews`, `instagram_*`) só libera
`SELECT` para o papel `authenticated` no RLS. Sem sessão real essas telas
viriam vazias — e o CRM, com nome e telefone de cliente, ficaria acessível a
qualquer um com a URL.

Para trocar a senha:

```sql
update auth.users
   set encrypted_password = extensions.crypt('NOVA_SENHA', extensions.gen_salt('bf')),
       updated_at = now()
 where email = 'joaovitorrc10102002@gmail.com';
```

## Variáveis de ambiente

Nenhuma é obrigatória. `lib/supabase/config.ts` já traz a URL e a chave
**anon** públicas do projeto como padrão — valores que, por definição, vão
para o navegador em qualquer app Supabase e que o RLS é quem protege. Assim
um deploy sem configuração manual não sobe quebrado.

Podem ser sobrescritas (por exemplo, para apontar para um projeto de
staging):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
PANEL_LOGIN_EMAIL=...        # e-mail da conta usada no login por senha
```

**Nunca** usar a chave `service_role` aqui — ela ignora RLS.

## Rodando localmente

Requer Node.js 18.18+ (recomendado 20+).

```bash
npm install
npm run dev     # http://localhost:3000
```

Produção:

```bash
npm run build
npm start
```

## Deploy

Projeto Next.js na raiz do repositório, com `vercel.json` fixando o
framework. Push na branch de produção dispara o deploy na Vercel.

## O que ainda não existe

1. Coleta granular de pedidos (`orders`/`order_items` com item por pedido) —
   por isso os agregados por cliente no CRM ainda vêm só do CRM legado.
2. Coleta de avaliações individuais (`reviews`) — hoje só existe a nota
   agregada por janela da plataforma.
3. Coleta por post do Instagram e hierarquia conjunto/anúncio do Meta Ads.
4. `product_channel_mapping` populado — enquanto vazio, a correspondência de
   produto entre canais depende do grupo de equivalência.
5. Motor que executa comandos de verdade (worker com `service_role`).
6. Integração com o NextFood.
7. `lib/types/database.ts` gerado automaticamente a partir do schema real,
   em vez dos tipos manuais atuais.
