# Studio Flow — Relatório do Projeto

> Desafio Técnico — Desenvolvedor Fullstack Júnior — Watch Brasil

## Sumário

1. [Descrição do projeto](#1-descrição-do-projeto)
2. [Arquitetura do projeto](#2-arquitetura-do-projeto)
3. [Tecnologias e programas utilizados](#3-tecnologias-e-programas-utilizados)
4. [O que foi desenvolvido](#4-o-que-foi-desenvolvido)
5. [Como o projeto foi construído (processo e decisões)](#5-como-o-projeto-foi-construído)
6. [Desafios encontrados e soluções](#6-desafios-encontrados-e-soluções)
7. [Uso de Inteligência Artificial](#7-uso-de-inteligência-artificial)
8. [Testes e qualidade](#8-testes-e-qualidade)
9. [Como executar o projeto](#9-como-executar-o-projeto)
10. [Documentação da API](#10-documentação-da-api)
11. [Recursos e ambientes publicados](#11-recursos-e-ambientes-publicados)
12. [Conclusão](#12-conclusão)

## 1. Descrição do Projeto

Studio Flow é um sistema de gerenciamento de tarefas colaborativo, desenvolvido como resposta
ao desafio técnico de Desenvolvedor Fullstack Júnior da Watch Brasil. A aplicação permite que
usuários criem contas, organizem tarefas em categorias, colaborem entre si e acompanhem o
progresso do trabalho por meio de relatórios agregados.

O projeto foi construído em Node.js, seguindo uma arquitetura em camadas, e implantado em
ambiente serverless real na AWS Lambda — atendendo integralmente ao objetivo proposto pelo
desafio. Além dos requisitos obrigatórios (CRUD completo, frontend em Vue.js, testes
automatizados, banco relacional, documentação OpenAPI e deploy serverless), todos os itens
desejáveis também foram implementados: autenticação com JWT, uso de contêiner (Docker) e
instrumentação de rastreamento com OpenTelemetry e Jaeger.

Como diferencial de produto, o sistema foi adaptado ao contexto de negócio da empresa: as
categorias padrão de uma conta nova seguem um fluxo real de produção de conteúdo audiovisual
(Roteiro, Gravação, Edição, Pós-produção, Publicação), e a identidade visual foi construída
especificamente para o projeto.

## 2. Arquitetura do Projeto

### 2.1 Visão geral

O backend segue uma arquitetura em camadas, organizada por módulo de domínio (autenticação,
usuários, categorias, tarefas, relatórios). Cada módulo é dividido em quatro camadas: rota
(recebe a requisição e valida os dados de entrada), controller (traduz a requisição HTTP),
service (aplica a regra de negócio) e repository (executa as consultas no banco de dados).

Um único arquivo central de aplicação (`app.js`) concentra toda a configuração do Express —
rotas, middlewares, CORS e documentação — e é reaproveitado por dois pontos de entrada
diferentes: um servidor HTTP tradicional, usado no desenvolvimento local, e um adaptador para
AWS Lambda, usado em produção. Isso elimina qualquer duplicação de lógica entre os dois
ambientes de execução.

### 2.2 Estrutura de diretórios

```
backend/src/
  app.js          configuração central do Express (rotas, middlewares, CORS, docs)
  server.js       ponto de entrada local (servidor HTTP tradicional)
  lambda.js       ponto de entrada para a AWS Lambda
  config/         variáveis de ambiente e conexão com o PostgreSQL
  middlewares/    autenticação (JWT), validação de dados, tratamento de erros
  modules/        um módulo por domínio: auth, users, categories, tasks, reports
  telemetry/      instrumentação de rastreamento (OpenTelemetry)
backend/migrations/   versionamento do schema do banco de dados
backend/tests/         testes automatizados (Jest e Supertest)

frontend/src/
  api/client.js   comunicação com a API (Axios)
  stores/         estado da aplicação (Pinia)
  views/          telas: login, cadastro, dashboard, categorias, relatórios
  components/     componentes reutilizáveis da interface
```

### 2.3 Modelo de dados

O banco de dados relacional (PostgreSQL) é composto por quatro tabelas principais:

```
users              (id, name, email, password_hash, created_at)
categories         (id, name, color, owner_id -> users)
tasks              (id, title, description, status, priority,
                    due_date, category_id -> categories, owner_id -> users)
task_collaborators (task_id -> tasks, user_id -> users)
```

A tabela `task_collaborators` representa um relacionamento de muitos para muitos entre tarefas
e usuários, permitindo que uma mesma tarefa tenha vários colaboradores além do dono, com
exclusão em cascata para manter a consistência dos dados.

### 2.4 Fluxo de uma requisição

1. O frontend envia a requisição com o token de autenticação no cabeçalho.
2. O middleware de autenticação confere o token e identifica o usuário.
3. O middleware de validação confere se os dados enviados estão no formato esperado.
4. O controller repassa a chamada para o service correspondente.
5. O service aplica a regra de negócio (por exemplo, verificar se o usuário tem permissão sobre a tarefa).
6. O repository executa a consulta no banco de dados.
7. A resposta percorre o caminho inverso até o frontend, em formato JSON.

### 2.5 Arquitetura de implantação

A infraestrutura de produção é inteiramente gerenciada, sem servidores dedicados:

- **AWS Lambda + API Gateway** — executam o backend, empacotado como um pacote único e otimizado.
- **AWS S3 + CloudFront** — hospedam o frontend como site estático, com HTTPS.
- **Banco de dados PostgreSQL na nuvem** — acessado por uma conexão compatível com ambientes serverless.
- **Jaeger** — recebe os dados de rastreamento das requisições, quando habilitado.

### 2.6 Segurança

- Senhas protegidas por hash (bcrypt), nunca armazenadas em texto simples.
- Autenticação sem estado, usando token assinado (JWT) — não depende de sessão guardada no servidor.
- Cada consulta de tarefa confere se o usuário é o dono ou um colaborador antes de liberar o dado.
- Cabeçalhos de segurança HTTP aplicados a todas as respostas (Helmet).
- Validação estrita de todos os dados recebidos pela API.

## 3. Tecnologias e Programas Utilizados

| Área | Ferramentas e tecnologias |
|---|---|
| Linguagem e runtime | JavaScript, Node.js 20 |
| Backend | Express (servidor web), PostgreSQL acessado via consultas SQL diretas |
| Autenticação e segurança | JWT (login sem sessão), bcryptjs (proteção de senha), Helmet (cabeçalhos de segurança) |
| Validação de dados | Zod |
| Banco de dados | PostgreSQL (gerenciado na nuvem via Supabase), migrations com node-pg-migrate |
| Documentação | OpenAPI 3.0 (Swagger), servida via swagger-ui-express |
| Observabilidade | OpenTelemetry (instrumentação) e Jaeger (visualização de rastreamento) |
| Testes | Jest (testes unitários) e Supertest (testes de rotas HTTP) |
| Frontend | Vue 3, Vite (build), Tailwind CSS (estilo), Pinia (estado), Vue Router, Axios |
| Contêiner | Docker e Docker Compose |
| Empacotamento para nuvem | Serverless Framework e esbuild (empacotamento otimizado) |
| Nuvem (AWS) | Lambda, API Gateway, S3, CloudFront, IAM, CloudFormation |
| Controle de versão | Git e GitHub |

## 4. O que foi Desenvolvido

- **Contas de usuário** — cadastro e login por e-mail e senha, com senha protegida por hash.
- **Categorias** — criação, edição, listagem e exclusão, com cor personalizável. Toda conta nova recebe automaticamente cinco categorias de exemplo, seguindo um fluxo de produção de conteúdo.
- **Tarefas** — criação, edição, listagem e exclusão, com título, descrição, status, prioridade, prazo e categoria.
- **Colaboração entre usuários** — o dono de uma tarefa pode adicionar ou remover colaboradores por e-mail. Colaboradores podem visualizar e editar a tarefa, mas não podem excluí-la nem gerenciar outros colaboradores.
- **Relatórios** — resumo com total de tarefas, distribuição por status e prioridade, tarefas atrasadas, taxa de conclusão, e distribuição por categoria — apresentados com gráficos.
- **Busca e filtros** — filtragem de tarefas por status, categoria e busca por título.
- **Identidade visual própria** — paleta de cores e nome de marca ("Studio Flow") desenvolvidos especificamente para o projeto, com interface responsiva para celular.

## 5. Como o Projeto foi Construído

O desenvolvimento seguiu uma ordem lógica, com validação real a cada etapa concluída.

1. **Planejamento** — definição da stack tecnológica e da estrutura de pastas antes de iniciar a implementação, com alinhamento explícito sobre quais funcionalidades extras seriam incluídas.
2. **Construção do backend** — implementado módulo por módulo (autenticação, categorias, tarefas, relatórios), sempre seguindo a mesma estrutura em camadas, com testes automatizados escritos junto de cada módulo.
3. **Construção do frontend** — iniciada somente após o backend estar funcional e testado, com as telas de login, cadastro, painel de tarefas, categorias e relatórios.
4. **Verificação com infraestrutura real** — além dos testes automatizados, foi realizada uma verificação manual completa com um banco de dados PostgreSQL real, o que revelou um erro que os testes automatizados não conseguiriam detectar (descrito na seção de Desafios).
5. **Uso de contêiner (Docker)** — criação do ambiente Docker para a API, o que revelou um problema de conectividade de rede com o banco de dados.
6. **Deploy real na AWS Lambda** — configuração de credenciais, primeira tentativa de deploy (que revelou um problema de empacotamento), correção, e novo deploy validado com testes reais contra a API pública.
7. **Publicação do frontend** — build do frontend apontando para a API real, publicação em um bucket S3, e configuração de permissões entre domínios (CORS).
8. **Ajuste de segurança de acesso (HTTPS)** — identificado que o endereço padrão do S3 não oferece conexão segura (HTTPS), o que impedia o acesso pelo link em determinados aplicativos e navegadores. Corrigido com a adição de uma camada de distribuição de conteúdo (CloudFront) na frente do site.
9. **Refinamento a partir de feedback** — ajustes de identidade visual, paleta de cores e adaptação para celular, cada mudança validada visualmente antes de ser publicada novamente.
10. **Controle de versão** — histórico de mudanças organizado por assunto, com verificação constante para nenhuma senha ou credencial ser enviada ao repositório por engano.

## 6. Desafios Encontrados e Soluções

Esta seção documenta, com transparência, os problemas reais enfrentados durante o
desenvolvimento e a implantação do projeto.

### 6.1. Falha ao iniciar o servidor (erro de rastreamento)
**O que aconteceu:** A versão da biblioteca de rastreamento instalada usava uma forma diferente de configuração da que havia sido escrita inicialmente.
**Como foi resolvido:** Ajuste do código de inicialização para a forma compatível com a versão instalada.

### 6.2. Cadastro de usuário retornava erro
**O que aconteceu:** As tabelas do banco de dados de produção ainda não existiam — o script de criação das tabelas nunca havia sido executado contra esse banco.
**Como foi resolvido:** Execução do script de criação das tabelas (migration) contra o banco real.

### 6.3. Falha de conexão dentro do Docker
**O que aconteceu:** O endereço de conexão "direta" do banco de dados só funcionava por um tipo de rede (IPv6) que o Docker não conseguia usar.
**Como foi resolvido:** Substituição pela conexão em modo "pooler" do mesmo banco, compatível com IPv4.

### 6.4. Erro ao criar ou editar uma tarefa
**O que aconteceu:** Um campo do banco de dados (status da tarefa) exigia uma conversão de tipo explícita numa consulta específica. Esse erro não foi identificado pelos testes automatizados, pois eles não executam consultas reais no banco — só apareceu numa verificação manual contra o banco real.
**Como foi resolvido:** Adição da conversão de tipo correta na consulta.

### 6.5. Deploy na nuvem falhava com erro de excesso de arquivos abertos
**O que aconteceu:** O processo padrão de empacotamento tentava incluir todos os arquivos do projeto no pacote de deploy, incluindo ferramentas usadas apenas localmente — mais de 40 mil arquivos ao todo.
**Como foi resolvido:** Troca da forma de empacotamento para uma que inclui somente o código realmente necessário em produção, reduzindo o pacote final para cerca de 45 MB.

### 6.6. Deploy negado por falta de permissão
**O que aconteceu:** O usuário criado na AWS para realizar o deploy ainda não tinha a permissão necessária aplicada.
**Como foi resolvido:** Verificação e correção da permissão do usuário antes de tentar novamente.

### 6.7. Credenciais da AWS expostas onde não deveriam
**O que aconteceu:** O arquivo de configuração do Docker estava repassando todas as variáveis de ambiente para dentro do contêiner da aplicação, incluindo credenciais que não eram necessárias ali.
**Como foi resolvido:** Remoção explícita dessas variáveis da configuração do contêiner.

### 6.8. Site publicado não conseguia se comunicar com a API
**O que aconteceu:** A configuração de permissão entre domínios (CORS) só é atualizada quando o deploy completo é refeito, não em uma atualização parcial.
**Como foi resolvido:** Execução de um novo deploy completo com a configuração correta.

### 6.9. Link do site não abria em alguns aplicativos (WhatsApp, navegadores de celular)
**O que aconteceu:** O endereço padrão de hospedagem de site do S3 não oferece conexão segura (HTTPS), e diversos aplicativos modernos recusam ou alertam sobre conexões sem essa proteção.
**Como foi resolvido:** Adição de uma camada de distribuição de conteúdo (CloudFront) na frente do site, que fornece um endereço com conexão segura.

## 7. Uso de Inteligência Artificial

O desenvolvimento deste projeto contou com o uso do Claude Code, assistente de inteligência
artificial da Anthropic voltado para engenharia de software, utilizado como ferramenta de
apoio à programação. É importante documentar esse uso com transparência, já que representa
uma habilidade cada vez mais relevante no mercado de tecnologia: a capacidade de direcionar,
validar e depurar soluções construídas com apoio de inteligência artificial, em vez de aceitar
resultados sem revisão crítica.

- **Direcionamento claro e decisões rápidas** — cada etapa do projeto foi conduzida com prioridades bem definidas — por exemplo, quais tecnologias usar, ou quais funcionalidades extras do desafio implementar — evitando indecisão e retrabalho.
- **Validação real, não aceitação automática** — nenhuma etapa foi considerada pronta apenas por o código ter sido escrito. Cada entrega foi conferida de verdade: testes automatizados executados, aplicação rodando de fato, banco de dados real, e a API funcionando na nuvem — processo que revelou e permitiu corrigir erros genuínos antes da entrega.
- **Decisões técnicas conscientes** — ao longo do projeto, diversas escolhas exigiram comparar alternativas — como usar SQL direto ou um ORM, ou qual biblioteca de autenticação usar — e cada uma foi resolvida com critérios claros (segurança, compatibilidade com o ambiente de nuvem, simplicidade), documentados neste relatório.
- **Ajustes a partir de feedback real** — mudanças de identidade visual e de usabilidade partiram de observações diretas sobre a experiência de uso, traduzidas em alterações específicas.
- **Depuração de problemas reais** — os problemas descritos na seção de Desafios foram identificados a partir de evidências concretas (mensagens de erro, comportamento da aplicação), sendo o papel principal interpretar essas evidências corretamente e decidir a correção adequada.

Em resumo, a inteligência artificial foi utilizada como uma ferramenta que acelera a execução,
mas as decisões de arquitetura, os critérios de aceitação de cada etapa e a interpretação dos
problemas encontrados foram conduzidos ativamente ao longo de todo o processo.

## 8. Testes e Qualidade

Foram escritos testes automatizados com Jest (testes unitários das regras de negócio) e
Supertest (testes de integração das rotas HTTP), cobrindo utilitários de segurança, as regras
de autorização (como a que garante que só o dono de uma tarefa pode gerenciar colaboradores),
e os fluxos principais de autenticação e de tarefas. Nesses testes, o acesso ao banco de dados
é simulado, o que garante execução rápida e resultados sempre consistentes.

Essa abordagem tem um limite conhecido: como o banco é simulado, os testes não executam SQL
de verdade, e por isso não detectaram o erro de conversão de tipo descrito na seção de
Desafios. Para compensar esse limite, foram feitas verificações manuais completas contra um
banco de dados PostgreSQL real, tanto localmente quanto após cada publicação em nuvem — o que
efetivamente encontrou e permitiu corrigir esse problema antes da entrega final. (Ver também
[estrategia-de-testes.md](./estrategia-de-testes.md) para a proposta de automatizar essa
verificação.)

## 9. Como Executar o Projeto

### 9.1 Backend

```bash
cd backend
cp .env.example .env   # preencha DATABASE_URL e JWT_SECRET
npm install
npm run migrate:up     # cria as tabelas no banco
npm run dev             # inicia em http://localhost:3000
```

### 9.2 Frontend

```bash
cd frontend
cp .env.example .env    # ajuste a URL da API se necessário
npm install
npm run dev             # inicia em http://localhost:5173
```

### 9.3 Com Docker

```bash
docker compose up --build
```

Sobe a API e o Jaeger juntos (API em `:3000`, painel do Jaeger em `:16686`).

### 9.4 Testes

```bash
cd backend && npm test
```

> Instruções completas (pré-requisitos, configuração do banco, deploy) estão no
> [README.md](../README.md) da raiz do repositório.

## 10. Documentação da API

A especificação segue o padrão OpenAPI 3.0 (Swagger) e está disponível em duas formas:
interface interativa (`GET /docs`, disponível localmente e via Docker) e especificação em JSON
puro (`GET /openapi.json`, disponível em qualquer ambiente, incluindo a AWS Lambda). Para usar a
API, é necessário se cadastrar ou fazer login (retorna um token), e enviar esse token no
cabeçalho `Authorization` dos demais endpoints.

| Método | Rota | Login? | O que faz |
|---|---|---|---|
| POST | `/api/auth/register` | Não | Cria uma nova conta de usuário |
| POST | `/api/auth/login` | Não | Autentica e retorna um token |
| GET | `/api/auth/me` | Sim | Dados do usuário autenticado |
| GET | `/api/users/search` | Sim | Busca usuário por e-mail |
| GET/POST | `/api/categories` | Sim | Lista ou cria categorias |
| GET/PUT/DELETE | `/api/categories/{id}` | Sim | Consulta, edita ou remove uma categoria |
| GET/POST | `/api/tasks` | Sim | Lista (com filtros) ou cria tarefas |
| GET/PUT/DELETE | `/api/tasks/{id}` | Sim | Consulta, edita ou remove uma tarefa |
| POST/DELETE | `/api/tasks/{id}/collaborators` | Sim | Adiciona ou remove um colaborador |
| GET | `/api/reports/summary` | Sim | Resumo agregado das tarefas |
| GET | `/api/reports/by-category` | Sim | Distribuição de tarefas por categoria |
| GET | `/api/health` | Não | Healthcheck da API |

> Detalhamento com exemplos de request/response está no
> [README.md](../README.md#documentação-da-api-openapiswagger) da raiz. A especificação
> completa (yaml/json) está em [`openapi.yaml`](./openapi.yaml) e [`openapi.json`](./openapi.json).

## 11. Recursos e Ambientes Publicados

| Recurso | Endereço |
|---|---|
| Aplicação (frontend, HTTPS) | https://d2mdqwrxr1861a.cloudfront.net |
| API (backend) | https://lhz7s6kdbg.execute-api.sa-east-1.amazonaws.com |
| Banco de dados | PostgreSQL gerenciado (Supabase) |
| Repositório de código | GitHub |

## 12. Conclusão

O projeto atende integralmente aos requisitos obrigatórios e desejáveis do desafio técnico,
com uma versão real em produção na nuvem, testada de ponta a ponta. Os problemas enfrentados
ao longo do desenvolvimento — de rede, de empacotamento e de banco de dados — foram todos
diagnosticados e corrigidos com base em evidência concreta, refletindo um processo real de
engenharia de software, não apenas a entrega de um resultado final.

Como próximos passos, para um cenário de produção real, seriam priorizados:

- Renovação e revogação de tokens de login.
- Armazenamento do token de forma mais protegida contra ataques no navegador.
- Aviso ao usuário quando duas pessoas editarem a mesma tarefa ao mesmo tempo.
- Paginação na listagem de tarefas, para uso em maior escala.
- Restrição mais rígida de acesso entre domínios e de permissões na conta AWS.
- Limite de tentativas nos endpoints de login, contra ataques automatizados.
