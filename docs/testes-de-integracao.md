# Testes de Integração — Documentação Complementar

> Documentação complementar sobre a estratégia de testes do backend, a limitação conhecida
> encontrada na prática e uma proposta de melhoria para testes de integração contra um banco
> de dados real.

## 1. Estratégia atual

O backend usa **Jest** (testes unitários dos services) e **Supertest** (testes de integração
das rotas HTTP). Em ambos os casos, a camada de acesso a dados (`pg`) é **mockada** — nenhum
teste automatizado hoje executa SQL de verdade contra um PostgreSQL real.

Vantagens dessa abordagem:

- Execução rápida e determinística.
- Não exige infraestrutura de banco de dados em CI.
- Isola a regra de negócio (services) do comportamento real do banco.

## 2. Limitação conhecida

Como os testes mockam `pg`, eles não conseguem detectar erros que só existem no SQL de fato
executado contra o PostgreSQL — por exemplo, tipos de coluna, constraints, ou comportamento
específico do dialeto.

Isso já se confirmou na prática: as colunas `status` e `priority` da tabela `tasks` são do tipo
`ENUM` no PostgreSQL, e exigiam um cast explícito (`::task_status`, `::task_priority`) dentro de
expressões `COALESCE` em queries parametrizadas. Sem esse cast, o PostgreSQL retornava o erro:

```
error: column "status" is of type task_status but expression is of type text
```

Esse bug **não foi detectado por nenhum teste automatizado** (todos passavam normalmente, pois
o mock de `pg` nunca reproduziu esse comportamento). Só foi encontrado numa verificação manual
de ponta a ponta, rodando a API contra um banco PostgreSQL real.

## 3. Melhoria proposta: testes de integração contra um banco real

Para cobrir essa classe de bug de forma automatizada (sem depender de verificação manual),
a proposta é adicionar uma **segunda suíte de testes de integração**, separada dos testes
unitários existentes, que rode contra uma instância real e efêmera de PostgreSQL.

### 3.1 Escopo

- Os testes unitários atuais (services, com repository mockado) **permanecem como estão** —
  continuam rápidos e não precisam de banco.
- Uma nova pasta, `backend/tests/integration-db/`, conteria testes que chamam diretamente as
  funções do `repository` (ou a API completa, via Supertest) contra um banco real, cobrindo
  especificamente os pontos de maior risco: criação/atualização de `tasks` (colunas `ENUM`),
  constraints de unicidade, e chaves estrangeiras/cascatas (`task_collaborators`).

### 3.2 Infraestrutura em CI

Usar um serviço de PostgreSQL efêmero na pipeline de CI (por exemplo, GitHub Actions), subido
só durante a execução dos testes:

```yaml
# .github/workflows/ci.yml (exemplo)
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: taskmanager_test
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 5s
      --health-timeout 5s
      --health-retries 10

steps:
  - run: npm run migrate:up
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/taskmanager_test
  - run: npm run test:integration-db
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/taskmanager_test
```

Localmente, o mesmo resultado pode ser obtido com um container Docker de PostgreSQL temporário
(mesma abordagem já usada durante o desenvolvimento para verificação manual), ou com a
biblioteca `testcontainers` para Node.js, que sobe e derruba o container automaticamente por
execução de teste.

### 3.3 Isolamento entre testes

Para evitar que um teste interfira no outro, cada teste (ou cada arquivo de teste) deveria:

1. Rodar dentro de uma transação que é revertida (`ROLLBACK`) ao final — mais rápido, mas exige
   que o código do repository aceite um client de transação injetado; **ou**
2. Truncar as tabelas relevantes antes de cada teste (`TRUNCATE ... CASCADE`) — mais simples de
   implementar, ligeiramente mais lento.

Dado o tamanho do projeto, a segunda abordagem seria suficiente.

### 3.4 Trade-offs

| Ganho | Custo |
|---|---|
| Detecta erros reais de SQL/schema automaticamente (exatamente a classe de bug já encontrada) | CI mais lento (precisa subir um Postgres antes de rodar os testes) |
| Reduz a dependência de verificação manual antes de cada entrega | Mais uma peça de infraestrutura para manter (serviço de banco em CI) |
| Aumenta a confiança em mudanças de schema/migrations | Testes de integração são mais lentos e um pouco mais frágeis que testes unitários mockados |

### 3.5 Por que não foi feito desde o início

Dado o escopo e o prazo do desafio técnico, a verificação manual de ponta a ponta (rodando a
API contra um banco real antes de cada entrega) cumpriu o mesmo papel de forma mais rápida de
implementar. A automatização proposta aqui faria sentido à medida que o projeto crescesse e
esse tipo de verificação manual se tornasse repetitivo ou fácil de esquecer.

## 4. Resumo

| Hoje | Proposto |
|---|---|
| Testes unitários e de integração HTTP, banco sempre mockado | Mantém os testes existentes + nova suíte de integração contra Postgres real |
| Bugs de SQL/schema só aparecem em verificação manual | Bugs de SQL/schema pegos automaticamente em CI |
