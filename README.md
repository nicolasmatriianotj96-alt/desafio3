# Studio Flow — Desafio Técnico Fullstack Júnior (Watch Brasil)

Aplicação de gerenciamento de tarefas colaborativa: contas de usuário, tarefas
categorizadas com prioridade/status/prazo, colaboração entre usuários e
relatórios agregados. Backend Node.js/Express + PostgreSQL pronto para rodar
localmente ou como função AWS Lambda; frontend em Vue 3 + Tailwind CSS.

## Demo publicado

- **Aplicação (frontend)**: https://d2mdqwrxr1861a.cloudfront.net
  (servida via CloudFront, com HTTPS — o endpoint de site estático do S3 sozinho só serve HTTP, o que bloqueia o link em apps como WhatsApp e navegadores de celular)
- **API (backend, AWS Lambda + API Gateway)**: https://lhz7s6kdbg.execute-api.sa-east-1.amazonaws.com
  - Healthcheck: `/api/health` — spec OpenAPI: `/openapi.json`
  - `/docs` (Swagger UI interativo) não é servido no Lambda de propósito — rode localmente ou via Docker para usá-lo (ver seções abaixo).

> Esses recursos rodam numa conta AWS pessoal, dentro da faixa sempre-gratuita
> para este volume de uso, e podem ser desativados a qualquer momento
> (`npm run remove` no backend / exclusão do bucket S3).

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
- [Deploy do frontend (S3)](#deploy-do-frontend-s3)
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

Fluxo de uso: crie uma conta em **Cadastro** (toda conta nova já vem com 5
categorias padrão de um fluxo de produção de conteúdo — Roteiro, Gravação,
Edição, Pós-produção, Publicação — como sugestão de uso, pensando no domínio
de um cliente de streaming/mídia), faça login, crie tarefas (associando
categoria/prioridade/prazo), adicione colaboradores por e-mail em uma tarefa
(apenas o dono pode gerenciar colaboradores) e acompanhe o progresso em
**Relatórios**.

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

A especificação completa está em `backend/src/docs/openapi.yaml` (fonte
editável, também copiada em `docs/openapi.yaml` para referência avulsa). O
endpoint `/openapi.json` (spec em JSON, gerada a partir do YAML) fica
disponível em qualquer ambiente, inclusive na Lambda. Já a UI interativa
do Swagger (`/docs`) só é montada fora do Lambda (local ou Docker) — assim o
pacote de deploy serverless não precisa carregar os assets estáticos do
`swagger-ui-express`. Depois de editar o `openapi.yaml`, rode
`npm run docs:build` para regenerar o `openapi.json`.

Todas as rotas marcadas **Auth** exigem o cabeçalho
`Authorization: Bearer <token>`, obtido em `/auth/login` ou `/auth/register`.

Base: `/api` · versão `1.0.0` · formato `JSON`

### Auth

**POST `/auth/register`** — Cria uma nova conta de usuário

```json
// Request body
{ "name": "Ana", "email": "ana@exemplo.com", "password": "senha123" }

// Resposta 201
{ "user": { "id": "...", "name": "...", "email": "...", "created_at": "..." }, "token": "..." }
```

**POST `/auth/login`** — Autentica e retorna um token JWT

```json
// Request body
{ "email": "ana@exemplo.com", "password": "senha123" }

// Resposta 200 / 401
{ "user": { ... }, "token": "..." }  // ou 401 se credenciais inválidas
```

**GET `/auth/me`** `Auth` — Dados do usuário autenticado

### Users

**GET `/users/search?email=`** `Auth` — Busca usuários por e-mail (para adicionar colaborador)

### Categories

**GET `/categories`** `Auth` — Lista as categorias do usuário

**POST `/categories`** `Auth` — Cria uma categoria

```json
// Request body
{ "name": "Roteiro", "color": "#f97316" }
```

**GET `/categories/{id}`** `Auth` — Consulta uma categoria

**PUT `/categories/{id}`** `Auth` — Atualiza uma categoria

**DELETE `/categories/{id}`** `Auth` — Remove uma categoria

### Tasks

**GET `/tasks`** `Auth` — Lista tarefas visíveis ao usuário

```
// Query params (opcionais)
status=pending|in_progress|done  categoryId=<uuid>  search=<texto>
```

**POST `/tasks`** `Auth` — Cria uma tarefa

```json
// Request body
{ "title": "...", "description?": "...", "status?": "...", "priority?": "...", "dueDate?": "...", "categoryId?": "..." }
```

**GET `/tasks/{id}`** `Auth` — Consulta uma tarefa

**PUT `/tasks/{id}`** `Auth` — Atualiza uma tarefa (dono ou colaborador)

**DELETE `/tasks/{id}`** `Auth` — Remove uma tarefa (somente o dono)

**POST `/tasks/{id}/collaborators`** `Auth` — Adiciona colaborador por e-mail (somente o dono)

```json
// Request body
{ "email": "colaborador@exemplo.com" }
```

**DELETE `/tasks/{id}/collaborators/{userId}`** `Auth` — Remove um colaborador (somente o dono)

### Reports

**GET `/reports/summary`** `Auth` — Resumo agregado das tarefas

```json
// Resposta 200
{ "total": 0, "byStatus": { ... }, "byPriority": { ... }, "overdue": 0, "completionRate": 0 }
```

**GET `/reports/by-category`** `Auth` — Distribuição de tarefas por categoria

### Health

**GET `/api/health`** — Healthcheck da API (sem autenticação)

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

Pré-requisitos: um usuário/role IAM com permissão para criar Lambda, API
Gateway, IAM roles, CloudFormation e CloudWatch Logs (não é obrigatório ter o
AWS CLI instalado — o Serverless Framework só precisa das credenciais via
variáveis de ambiente); e uma `DATABASE_URL` de produção acessível pela
internet.

O empacotamento usa **`serverless-esbuild`**, que faz *bundling* (tree-shaking)
do código em vez de zipar o `node_modules` inteiro. Isso evita um problema real
que apareceu durante o desenvolvimento: com o pacote "ingênuo" (zip de todo o
`node_modules`, ~48 mil arquivos — incluindo devDependencies como Jest e o
próprio Serverless Framework, e a árvore de auto-instrumentação do
OpenTelemetry, sozinha com ~15 mil arquivos), o deploy falhava no Windows com
`EMFILE: too many open files`. As dependências pesadas e opcionais
(`@opentelemetry/*`, `swagger-ui-express`, `pg-native`) são carregadas via
`require` dinâmico e só em tempo de execução fora do Lambda — então nem
precisam existir no pacote de deploy (ver `custom.esbuild.external` em
`serverless.yml`, `src/app.js` e `src/telemetry/tracing.js`).

```bash
cd backend
export DATABASE_URL="postgresql://..."
export JWT_SECRET="$(openssl rand -hex 32)"
export FRONTEND_URL="https://seu-frontend.exemplo.com"
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."

npm run deploy   # serverless deploy — cria os recursos na sua conta AWS
```

Ao final, o Serverless Framework imprime a URL pública da API (API Gateway),
por exemplo `https://xxxxxxxxxx.execute-api.sa-east-1.amazonaws.com`. Nessa URL,
`/api/health`, `/openapi.json` e todos os endpoints `/api/*` funcionam
normalmente; `/docs` (Swagger UI interativo) não é servido no Lambda — use-o
localmente ou via Docker (ver seções acima). Para desfazer o deploy e remover
os recursos criados: `npm run remove`.

> **Nota sobre Postgres IPv6-only:** se o seu provedor publicar só um endereço
> IPv6 para a conexão "direta" (é o caso do Supabase), o Lambda (sem VPC) não
> consegue alcançá-lo — use a connection string do **connection pooler**
> (IPv4) do provedor, não a conexão direta.

> **Atenção:** este comando cria recursos reais e cobráveis na sua conta AWS
> (embora dentro da faixa sempre-gratuita para esse volume de uso). Rode-o
> apenas quando tiver revisado as variáveis de ambiente acima, e considere
> rodar `npm run remove` depois de validar o deploy.

## Deploy do frontend (S3)

O frontend é só HTML/CSS/JS estático (build do Vite), então também pode ser
publicado de graça num bucket S3 com static website hosting, sem precisar de
servidor:

```bash
cd frontend
echo "VITE_API_URL=https://SEU-ENDPOINT.execute-api.SEU-REGIAO.amazonaws.com/api" > .env
npm run build   # gera frontend/dist
```

Depois, crie um bucket S3 (nome globalmente único), desabilite o "Block Public
Access", aplique uma bucket policy de leitura pública (`s3:GetObject` para
`*`), habilite "Static website hosting" (index document `index.html`, error
document também `index.html` — importante para o roteamento do Vue Router) e
suba o conteúdo de `frontend/dist/` para o bucket. A URL final segue o formato
`http://<bucket>.s3-website-<regiao>.amazonaws.com`.

> Lembre-se de configurar `FRONTEND_URL` no backend (seção anterior) com essa
> URL — ou deixe como `*` (usado neste demo) — e rodar `serverless deploy`
> completo, já que o CORS do API Gateway é definido na infraestrutura e não é
> atualizado por um `serverless deploy function`.

> **Nota sobre HTTPS:** o endpoint de site estático do S3 (`s3-website-*`)
> só serve HTTP — sem certificado, sem HTTPS. Isso faz o link ser recusado
> por diversos aplicativos modernos (WhatsApp, navegadores de celular com
> "sempre usar conexão segura"). A solução é colocar uma distribuição
> **CloudFront** na frente do bucket (origem customizada apontando para o
> endpoint de site estático, `ViewerProtocolPolicy: redirect-to-https`, e
> `CustomErrorResponses` 403/404 → `index.html` com status 200, necessário
> para o roteamento do Vue Router). O CloudFront oferece HTTPS de graça
> (dentro da faixa gratuita) com um domínio `*.cloudfront.net`.

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
