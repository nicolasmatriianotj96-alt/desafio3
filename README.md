# Task Manager — Desafio Técnico Fullstack Júnior

Aplicação de gerenciamento de tarefas colaborativa: contas de usuário, tarefas
categorizadas com prioridade/status/prazo, colaboração entre usuários e
relatórios agregados. Backend Node.js/Express + PostgreSQL pronto para rodar
localmente ou como função AWS Lambda; frontend em Vue 3 + Tailwind CSS.

## Sumário

- [Arquitetura](#arquitetura)
- [Stack utilizada](#stack-utilizada)
- [Modelo de dados](#modelo-de-dados)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do banco de dados (Postgres)](#configuração-do-banco-de-dados-postgres)
- [Rodando o backend localmente](#rodando-o-backend-localmente)
- [Rodando com Docker](#rodando-com-docker)
- [Rodando o frontend](#rodando-o-frontend)
- [Testes](#testes)
- [Documentação da API (OpenAPI/Swagger)](#documentação-da-api-openapiswagger)
- [Observabilidade (OpenTelemetry + Jaeger)](#observabilidade-opentelemetry--jaeger)
- [Rodando como AWS Lambda (serverless-offline)](#rodando-como-aws-lambda-serverless-offline)
- [Deploy real na AWS](#deploy-real-na-aws)
- [Decisões de arquitetura e trade-offs](#decisões-de-arquitetura-e-trade-offs)

## Arquitetura

```
desafio3/
├── docker-compose.yml       # API + Jaeger (Postgres é um serviço cloud, ex: Neon)
├── backend/                 # API RESTful (Node.js + Express)
│   ├── src/
│   │   ├── app.js           # Configuração do Express (rotas, middlewares, swagger)
│   │   ├── server.js        # Entry point local (app.listen)
│   │   ├── lambda.js        # Entry point para AWS Lambda (serverless-http)
│   │   ├── config/          # Variáveis de ambiente e pool de conexão Postgres
│   │   ├── telemetry/       # Setup do OpenTelemetry
│   │   ├── middlewares/     # Autenticação JWT, validação (zod), tratamento de erros
│   │   ├── modules/         # auth, users, categories, tasks, reports
│   │   │                    #   (repository -> service -> controller -> routes)
│   │   └── docs/openapi.yaml
│   ├── migrations/          # node-pg-migrate
│   ├── tests/               # Jest (unitários + integração com supertest)
│   └── serverless.yml
└── frontend/                # SPA em Vue 3 + Vite + Tailwind + Pinia
    └── src/
        ├── api/client.js    # Instância axios com interceptor de JWT
        ├── stores/          # Pinia: auth, tasks, categories, reports
        ├── views/           # Login, Register, Dashboard, Categories, Reports
        └── components/
```

O backend segue uma arquitetura em camadas por módulo de domínio
(`repository` → acesso a dados via SQL parametrizado; `service` → regras de
negócio; `controller` → tradução HTTP; `routes` → validação + montagem), com
`app.js` compartilhado entre o servidor local e o handler Lambda — o mesmo
código roda nos dois ambientes sem duplicação.

## Stack utilizada

**Backend:** Node.js, Express, PostgreSQL (`pg`, sem ORM), `node-pg-migrate`,
JWT (`jsonwebtoken`), `bcryptjs`, `zod` (validação), `swagger-ui-express`,
OpenTelemetry, Jest + Supertest, Serverless Framework + `serverless-http`.

**Frontend:** Vue 3 (`<script setup>`), Vite, Vue Router, Pinia, Tailwind CSS,
Axios.

> **Por que `pg` puro em vez de um ORM (Prisma/Sequelize)?** O objetivo é rodar
> em AWS Lambda. ORMs com engine binário (Prisma) exigem cuidados extras de
> bundling por plataforma/arquitetura e aumentam o tamanho do pacote e o cold
> start. Usando `pg` com SQL explícito, o pacote fica menor, não há binários
> nativos para gerenciar, e o rastreamento com OpenTelemetry
> (`@opentelemetry/instrumentation-pg`) funciona sem configuração adicional.

## Modelo de dados

- **users**: `id, name, email (único), password_hash, created_at`
- **categories**: `id, name, color, owner_id -> users`
- **tasks**: `id, title, description, status (pending|in_progress|done), priority (low|medium|high), due_date, category_id, owner_id, created_at, updated_at`
- **task_collaborators**: tabela de junção `(task_id, user_id)` — usuários
  adicionados por e-mail pelo dono da tarefa passam a visualizar e editar o
  conteúdo dela (mas não podem excluí-la ou gerenciar outros colaboradores).

## Pré-requisitos

- Node.js 20+
- Uma instância PostgreSQL acessível (recomendado: [Neon](https://neon.tech)
  ou [Supabase](https://supabase.com), ambos com camada gratuita e prontos
  para uso serverless)
- Docker (opcional, para rodar a API em container + Jaeger)
- Conta AWS + [AWS CLI configurado](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) (apenas se for fazer o deploy real)

## Configuração do banco de dados (Postgres)

1. Crie um projeto gratuito no [Neon](https://neon.tech) (ou Supabase).
2. Copie a **connection string** (no Neon, prefira a variante *pooled*, com
   `-pooler` no host — ela é otimizada para conexões serverless/efêmeras).
3. Cole essa string na variável `DATABASE_URL` do arquivo `.env` do backend
   (veja o passo a passo abaixo).

## Rodando o backend localmente

```bash
cd backend
cp .env.example .env
# edite o .env e preencha DATABASE_URL com a connection string do seu Postgres
# gere um segredo forte para JWT_SECRET, ex:
openssl rand -hex 32

npm install
npm run migrate:up   # cria as tabelas (users, categories, tasks, task_collaborators)
npm run dev           # inicia em http://localhost:3000
```

Endpoints úteis após subir:

- `GET http://localhost:3000/api/health` — healthcheck
- `GET http://localhost:3000/docs` — documentação Swagger interativa

## Rodando com Docker

O `docker-compose.yml` na raiz sobe a API (a partir do `backend/Dockerfile`) e
o Jaeger para tracing. O Postgres continua sendo o serviço cloud configurado
no `.env` (não é containerizado, para simplificar e refletir o cenário real de
produção serverless).

```bash
cd backend
cp .env.example .env   # preencha DATABASE_URL e JWT_SECRET
npm run migrate:up     # rode as migrations uma vez, fora do container
cd ..
docker compose up --build
```

- API: http://localhost:3000
- Jaeger UI: http://localhost:16686

## Rodando o frontend

```bash
cd frontend
cp .env.example .env   # ajuste VITE_API_URL se a API não estiver em localhost:3000/api
npm install
npm run dev             # http://localhost:5173
```

Fluxo de uso: crie uma conta em **Cadastro**, faça login, crie categorias,
crie tarefas (associando categoria/prioridade/prazo), adicione colaboradores
por e-mail em uma tarefa (apenas o dono pode gerenciar colaboradores) e
acompanhe o progresso em **Relatórios**.

## Testes

```bash
cd backend
npm test               # roda todos os testes (unitários + integração)
npm run test:coverage  # com relatório de cobertura
```

Os testes usam **Jest** e mockam a camada de acesso a dados (`pg`), então não
é necessário um banco real para rodá-los — nem em CI. Cobrem:

- Utilitários (`hashPassword`/`comparePassword`, `signToken`/`verifyToken`)
- Regras de negócio dos serviços (`auth`, `tasks`, `categories`), incluindo a
  regra de autorização de colaboradores (só o dono adiciona/remove)
- Rotas HTTP críticas via `supertest` (validação de payload, autenticação,
  fluxo de registro/login, CRUD de tarefas)

## Documentação da API (OpenAPI/Swagger)

A especificação completa está em `backend/src/docs/openapi.yaml` e é servida
interativamente em `/docs` (Swagger UI) sempre que a API está no ar — tanto
localmente quanto na Lambda. O JSON bruto fica disponível em `/openapi.json`.

## Observabilidade (OpenTelemetry + Jaeger)

O backend é instrumentado com `@opentelemetry/sdk-node` e instrumentações
automáticas para HTTP, Express e `pg`, exportando spans via OTLP/HTTP. Ao
rodar com `docker compose up`, o Jaeger recebe os traces em
`http://jaeger:4318/v1/traces` e fica navegável em
`http://localhost:16686`. Para desabilitar, defina `OTEL_ENABLED=false` no
`.env`.

## Rodando como AWS Lambda (serverless-offline)

Antes de um deploy real, é possível simular o ambiente Lambda localmente:

```bash
cd backend
npm run offline   # sobe via serverless-offline em http://localhost:3000
```

O handler (`src/lambda.js`) usa `serverless-http` para adaptar o mesmo
`app.js` do Express ao formato de evento do API Gateway — não há lógica
duplicada entre o modo servidor e o modo serverless.

## Deploy real na AWS

Pré-requisitos: AWS CLI configurado (`aws configure`) com um usuário/role com
permissão para criar Lambda, API Gateway, IAM roles e CloudWatch Logs; e uma
`DATABASE_URL` de produção válida (o Postgres precisa ser acessível pela
internet — Neon/Supabase já vêm assim).

```bash
cd backend
export DATABASE_URL="postgresql://..."
export JWT_SECRET="$(openssl rand -hex 32)"
export FRONTEND_URL="https://seu-frontend.exemplo.com"

npm run deploy   # serverless deploy — cria os recursos na sua conta AWS
```

Ao final, o Serverless Framework imprime a URL pública da API (API Gateway).
Para desfazer o deploy e remover os recursos criados: `npm run remove`.

> **Atenção:** este comando cria recursos reais e cobráveis na sua conta AWS.
> Rode-o apenas quando tiver revisado as variáveis de ambiente acima.

## Decisões de arquitetura e trade-offs

- **`pg` em vez de ORM**: ver seção [Stack utilizada](#stack-utilizada).
- **`bcryptjs` em vez de `bcrypt`**: implementação 100% JavaScript, sem
  necessidade de compilar módulos nativos — evita problemas de compatibilidade
  entre a arquitetura da máquina de desenvolvimento e o runtime do Lambda.
- **Postgres gerenciado (Neon/Supabase) em vez de container local**: reflete o
  cenário real de uma API serverless, que não pode depender de um banco
  rodando na mesma máquina; o pool de conexões (`backend/src/config/db.js`) já
  é ajustado para `max: 1` quando executado dentro do Lambda (uma invocação
  por vez) e um pool maior no servidor local.
- **Colaboração via tabela de junção simples**: qualquer colaborador pode
  visualizar e editar o conteúdo da tarefa; apenas o dono pode excluir a
  tarefa ou gerenciar (adicionar/remover) colaboradores.
