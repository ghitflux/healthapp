# HealthApp — Prompt de Execucao Semanas 7 e 8: Owner + Polish + Staging de Testes

> **Objetivo:** Este documento detalha task-by-task as Semanas 7 e 8 do HealthApp.
> Foco da Semana 7: painel Owner completo (dashboard executivo, convenios,
> usuarios, financeiro, auditoria, configuracoes globais e exportacoes).
> Foco da Semana 8: polish tecnico/UX, testes frontend e deploy em **staging de testes**.
>
> **Regra critica da Semana 8:** deploy somente para homologacao/staging de testes.
> Nao executar, configurar ou validar ambiente final de producao nesta semana.
>
> Pre-requisito: Semana 6 concluida e quality gates verdes.
> Leitura obrigatoria: `CLAUDE.md` (raiz), `frontend/CLAUDE.md`, `shared/CLAUDE.md`,
> `docs/PROMPT_EXECUCAO_SEMANA6.md`, `docs/PLANO_COMPLETO.md`.

---

## ANALISE DO ESTADO ATUAL (Pos-Semana 6)

### O que JA existe no frontend real atual:

**Base frontend consolidada (Semanas 5-6):**
- Next.js 16 + React 19 + Tailwind 4 + Shadcn/UI + TanStack Query + Zustand.
- Auth web funcional com `proxy.ts`, `useAuthGuard`, JWT interceptors.
- Layouts `convenio` e `owner` com sidebar/header responsivos.
- Dashboard convenio e owner ja funcionais com dados reais.
- States globais de loading/error/not-found ja existentes.
- Integracao `@api/*` ativa via `shared/gen/`.

**Semana 6 concluida (convenio):**
- CRUD medicos completo.
- Gestao de agendas e excecoes.
- CRUD tipos de exame e precificacao.
- UX base (loading/error/empty/retry).
- View transitions e quality gates.

**Contratos owner ja disponiveis no codigo gerado:**
- Hooks:
  - `useGetOwnerDashboard`
  - `useListAdminConvenios`
  - `useGetAdminConvenioById`
  - `useSuspendConvenio`
  - `useApproveConvenio`
  - `useCreateConvenio`
  - `useDeleteConvenio`
  - `useListAdminUsers`
  - `useListAuditLogs`
  - `useGetOwnerFinancialReport`
  - `useGetPlatformSettings`
  - `useUpdatePlatformSettings`
- Schemas Zod:
  - `listAdminConveniosQueryParamsSchema`
  - `listAdminUsersQueryParamsSchema`
  - `listAuditLogsQueryParamsSchema`
  - `updatePlatformSettingsMutationRequestSchema`

### O que FALTA para as Semanas 7 e 8:

1. Paginas owner ainda estao em placeholder:
   - `/owner/convenios`
   - `/owner/users`
   - `/owner/financial`
   - `/owner/analytics`
   - `/owner/audit-logs`
   - `/owner/settings`
2. Falta gestao operacional de convenios (aprovar/suspender + detalhes).
3. Falta gestao operacional de usuarios e auditoria com filtros reais.
4. Falta financeiro global owner com reconciliacao e exportacoes.
5. Falta padronizacao final de UX em owner pages.
6. Falta base de testes frontend para cobertura dos fluxos owner.
7. Falta plano e validacao de deploy em **staging de testes** (nao producao).

---

## PARTE 1 — TAREFAS DETALHADAS

### SEMANA 7 — Painel Owner + Financeiro

### Dia 1 (Segunda) — Dashboard Executivo Owner Completo

**Tarefa 7.1 — Consolidar Data Layer do Dashboard Owner com Hooks Gerados**
```
Padronize dashboard owner para usar contratos gerados em @api/*:

1. Refatorar features/owner/dashboard-kpis.tsx:
   - Substituir chamadas manuais de API por `useGetOwnerDashboard`.
   - Eliminar typing manual de payload quando houver equivalente em @api/types.

2. Padronizar query key:
   - Usar key gerada pelo hook (ou wrapper consistente).
   - Evitar duplicidade entre chave manual e chave gerada.

3. Regras obrigatorias:
   - Nenhum endpoint owner via axios manual nesta tela.
   - Nenhum type local duplicando contrato de API.

Validacao:
- Dashboard owner carrega dados reais via hook gerado.
- Type-check sem erros de inferencia.

Commit: "refactor(frontend): migrate owner dashboard data layer to generated hooks"
```

**Tarefa 7.2 — Expandir Dashboard Executivo com Graficos e Comparativos**
```
Completar dashboard owner alem dos cards atuais:

1. Adicionar secoes obrigatorias:
   - Receita global (serie temporal).
   - Crescimento de usuarios por periodo.
   - Distribuicao de convenios por status.
   - Preview financeiro global.

2. Filtros globais de periodo:
   - 7 dias, 30 dias, 90 dias, custom.
   - Sincronizar filtros entre KPIs e graficos.

3. Componentes:
   - Reusar DashboardTemplate.
   - Reusar charts existentes com props configuraveis.
   - Criar charts owner especificos quando necessario.

Validacao:
- Graficos atualizam conforme filtro de periodo.
- Estrutura responsiva desktop/mobile.

Commit: "feat(frontend): expand owner executive dashboard with global analytics charts"
```

**Tarefa 7.3 — States e Cache do Dashboard Owner**
```
Aplicar robustez de UX e cache no dashboard owner:

1. Loading:
   - Skeletons por secao (cards, charts, tabelas).
2. Error:
   - ErrorStateBlock com retry por bloco.
3. Empty:
   - EmptyStateBlock contextual.
4. Cache:
   - staleTime adequado para dados de dashboard.
   - refetch controlado em foco/reconexao.

Validacao:
- Sem tela branca em falhas parciais.
- Retry por secao funciona sem reload completo.

Commit: "feat(frontend): add robust loading error empty states and cache strategy for owner dashboard"
```

### Dia 2 (Terca) — Gestao de Convenios Owner

**Tarefa 7.4 — Substituir Placeholder de Convenios por CRUD Operacional**
```
Transformar /owner/convenios em pagina funcional:

1. Substituir app/(owner)/owner/convenios/page.tsx.
2. Usar CrudTableTemplate + DataTableToolbar.
3. Listagem principal com `useListAdminConvenios`.
4. Filtros minimos:
   - status
   - nome/busca
   - pagina/pagina tamanho

5. Colunas minimas:
   - Nome
   - Status (ativo/aprovado/suspenso)
   - Plano
   - Criado em
   - Acoes

Validacao:
- Pagina sem placeholder.
- Lista e filtros funcionais com dados reais.

Commit: "feat(frontend): implement owner convenios management list page"
```

**Tarefa 7.5 — Detalhes de Convenio + Acoes Aprovar/Suspender/Reativar**
```
Implementar fluxo de governanca de convenio:

1. Detalhes:
   - Drawer/modal de detalhes via `useGetAdminConvenioById`.

2. Acoes:
   - Aprovar: `useApproveConvenio`.
   - Suspender: `useSuspendConvenio`.
   - Reativar: usar fluxo de aprovacao quando aplicavel ao estado atual.

3. Confirm dialogs obrigatorios:
   - Mensagem clara de impacto da acao.
   - Bloqueio de double-submit.

4. Invalidao:
   - invalidar `listAdminConvenios` e detalhe afetado apos mutation.

Validacao:
- Aprovar e suspender atualizam status na tabela sem refresh manual.
- Detalhe reflete novo estado apos acao.

Commit: "feat(frontend): add convenio detail and approve suspend reactivate actions for owner"
```

**Tarefa 7.6 — Criar/Excluir Convenio no Contexto Owner (Quando Necessario)**
```
Cobrir operacoes de ciclo de vida administrativo:

1. Create convenio:
   - Form owner com `useCreateConvenio`.
   - Validacao com schema gerado correspondente.

2. Delete convenio:
   - Confirm dialog + `useDeleteConvenio`.
   - Regras de seguranca visual (nao excluir sem confirmacao forte).

3. Regras:
   - Mostrar claramente operacoes irreversiveis.
   - Isolar acoes de alto risco para perfil owner.

Validacao:
- Create e delete funcionam respeitando permissoes owner.
- Query cache atualizado apos mutacoes.

Commit: "feat(frontend): implement owner convenio create and delete lifecycle actions"
```

### Dia 3 (Quarta) — Gestao de Usuarios + Audit Logs

**Tarefa 7.7 — Substituir Placeholder de Usuarios por Painel Real**
```
Transformar /owner/users em listagem operacional:

1. Substituir app/(owner)/owner/users/page.tsx.
2. Hook base: `useListAdminUsers`.
3. Filtros:
   - role
   - status
   - busca por nome/email
   - paginacao

4. Colunas:
   - Nome
   - Email
   - Role
   - Status
   - Data de cadastro

5. Estados UX:
   - SkeletonTable
   - ErrorStateBlock
   - EmptyStateBlock

Validacao:
- Pagina users sem placeholder.
- Filtros retornam dados coerentes.

Commit: "feat(frontend): implement owner users management page with real data"
```

**Tarefa 7.8 — Detalhes de Usuario e Acoes Administrativas Seguras**
```
Implementar painel de detalhe de usuario com escopo realista:

1. Drawer/modal de detalhe:
   - dados basicos
   - role
   - flags de verificacao
   - metadados relevantes

2. Acoes administrativas:
   - Exibir apenas acoes suportadas pelos endpoints atuais.
   - Para acoes sem endpoint dedicado, marcar claramente como indisponivel.

3. Politica:
   - Nao inventar endpoint nao existente.
   - Nao simular sucesso de acao sem persistencia real.

Validacao:
- Detalhes carregam sem erro para usuarios listados.
- UI deixa claro o que e acao real vs futura.

Commit: "feat(frontend): add owner user detail panel with safe actionable scope"
```

**Tarefa 7.9 — Substituir Placeholder de Audit Logs por Tela Completa**
```
Implementar /owner/audit-logs com filtros e pagina:

1. Substituir app/(owner)/owner/audit-logs/page.tsx.
2. Hook base: `useListAuditLogs`.
3. Filtros minimos:
   - periodo
   - usuario
   - acao
   - entidade

4. Tabela/timeline:
   - timestamp
   - ator
   - acao
   - entidade
   - resumo da mudanca

5. Exportacao local de visualizacao filtrada (CSV).

Validacao:
- Logs listados com filtros funcionais.
- Paginacao coerente com resposta API.

Commit: "feat(frontend): implement owner audit logs page with filters and pagination"
```

### Dia 4 (Quinta) — Financeiro Global + Exportacoes

**Tarefa 7.10 — Substituir Placeholder Financeiro por Painel Global Real**
```
Implementar /owner/financial com dados reais:

1. Substituir app/(owner)/owner/financial/page.tsx.
2. Hook base: `useGetOwnerFinancialReport`.
3. Secoes obrigatorias:
   - receita total
   - ticket medio
   - taxa de sucesso
   - breakdown por status/metodo

4. Filtros por periodo:
   - data_inicio/data_fim (se suportado)

Validacao:
- Painel financeiro sem placeholder.
- Dados e cards carregando de endpoint owner financeiro.

Commit: "feat(frontend): implement owner global financial page using generated report hook"
```

**Tarefa 7.11 — Reconciliacao e Visoes de Controle Financeiro**
```
Adicionar camada de controle gerencial:

1. Bloco de reconciliacao:
   - interno vs provedor (quando dados disponiveis no report)
   - divergencias e alertas visuais

2. Tabelas de apoio:
   - top convenios por receita
   - distribuicao por metodo/status

3. Resiliencia:
   - caso campo nao venha no payload, fallback explicito na UI

Validacao:
- Blocos de reconciliacao renderizam sem quebrar em dados incompletos.
- Insights financeiros principais visiveis para owner.

Commit: "feat(frontend): add financial reconciliation and control views for owner"
```

**Tarefa 7.12 — Exportacoes CSV/PDF no Escopo Atual da Plataforma**
```
Implementar exportacoes sem inventar contrato:

1. CSV:
   - Exportacao de tabelas owner (convenios, users, audit, financeiro) no client.
   - Reusar endpoint existente quando disponivel (ex.: export CSV convenio).

2. PDF:
   - Implementar exportacao de relatorio por print-friendly view/client-side.
   - Deixar explicito que endpoint backend dedicado para PDF e evolucao futura.

3. Regras:
   - Nome de arquivo com timestamp.
   - Exportar somente dados filtrados na tela atual.

Validacao:
- CSV baixa com dados corretos e encoding valido.
- PDF abre e preserva principais secoes do relatorio.

Commit: "feat(frontend): implement owner csv and pdf exports within current api capabilities"
```

### Dia 5 (Sexta) — Configuracoes Globais + Hardening + Gates

**Tarefa 7.13 — Substituir Placeholder de Configuracoes Globais por Form Real**
```
Implementar /owner/settings com leitura/edicao real:

1. Substituir app/(owner)/owner/settings/page.tsx.
2. Leitura: `useGetPlatformSettings`.
3. Update: `useUpdatePlatformSettings`.
4. Validacao do form:
   - `updatePlatformSettingsMutationRequestSchema`

5. Campos minimos:
   - fees, limites, politicas, toggles operacionais
   - maintenance mode e mensagem

Validacao:
- Carrega configuracoes atuais.
- Salvar atualiza dados com feedback de sucesso/erro.

Commit: "feat(frontend): implement owner platform settings page with generated hook and schema"
```

**Tarefa 7.14 — Hardening de Seguranca e Permissao no Painel Owner**
```
Garantir isolamento owner-only:

1. Revisar guards e roteamento:
   - `proxy.ts`
   - `useAuthGuard`
   - menus owner

2. Regras:
   - rotas owner inacessiveis para convenio_admin
   - redirecionamento seguro quando role invalida

3. UX de seguranca:
   - mensagens claras para acesso negado
   - nao vazar dados sensiveis em estados de erro

Validacao:
- Usuario nao-owner nao acessa rotas /owner/*.
- Owner acessa todo painel sem bloqueios indevidos.

Commit: "fix(frontend): harden owner route protection and permission boundaries"
```

**Tarefa 7.15 — Fechamento Semana 7 com Quality Gates e Evidencias**
```
Executar validacao final da Semana 7:

1. Quality gates:
   - npm run lint
   - npm run type-check
   - npm run build

2. Validar fluxo manual owner:
   - dashboard
   - convenios
   - users
   - audit logs
   - financeiro
   - settings

3. Evidencias:
   - resumo dos comandos
   - checklist de telas sem placeholder
   - lista de commits convencionais

Validacao:
- Todos gates verdes.
- Sem placeholders em paginas criticas owner da Semana 7.

Commit: "chore(frontend): finalize week7 owner panel delivery with quality gates"
```

---

### SEMANA 8 — Polish e Deploy Staging (Teste)

### Dia 1 (Segunda) — Testes Frontend

**Tarefa 8.1 — Setup de Testes Frontend (Unit/Component)**
```
Consolidar stack de testes frontend para owner flows:

1. Configurar runner e libs de teste (unit/component).
2. Definir estrutura de pastas de testes por dominio.
3. Configurar script npm de teste e cobertura.
4. Integrar execucao em pipeline CI.

Validacao:
- npm run test executa suite base.
- Pipeline local de testes roda sem quebrar build.

Commit: "test(frontend): setup frontend unit and component testing foundation"
```

**Tarefa 8.2 — Testes de Componentes Criticos do Owner**
```
Cobrir componentes de alto impacto:

1. Testar KPIs owner e render condicional.
2. Testar tabelas de convenios/users/audit com estados.
3. Testar dialogs de acoes criticas (aprovar/suspender).

Validacao:
- Componentes principais possuem testes de render e interacao.
- Falhas de regressao visual/funcional detectaveis.

Commit: "test(frontend): add owner component tests for critical flows"
```

**Tarefa 8.3 — Testes de Fluxos Integrados Owner (UI + Data)**
```
Cobrir fluxo funcional ponta-a-ponta no frontend:

1. Owner dashboard load e filtros.
2. Convenio approve/suspend com invalidacao.
3. Users/audit filters + paginacao.
4. Settings update com feedback.

Validacao:
- Fluxos principais owner com cobertura automatizada.
- Resultados estaveis em execucoes repetidas.

Commit: "test(frontend): add integrated owner flow tests"
```

### Dia 2 (Terca) — UX Polish Transversal

**Tarefa 8.4 — Padronizar Loading/Error/Empty em Todas as Telas Owner**
```
Aplicar consistencia de estados:

1. Revisar cada pagina owner e padronizar components DS.
2. Garantir retry em queries falhas.
3. Garantir CTA em estados vazios relevantes.

Validacao:
- Todas as telas owner com estados consistentes.
- Sem comportamento divergente entre paginas.

Commit: "feat(frontend): standardize owner loading error empty retry states"
```

**Tarefa 8.5 — Padronizar Toasters e Mapeamento de Erros**
```
Refinar feedback transacional:

1. Centralizar mensagens de sucesso/erro por tipo de operacao.
2. Mapear erros de validacao/autorizacao/conflito.
3. Evitar mensagens tecnicas cruas para usuario final.

Validacao:
- Mensagens claras em create/update/delete e acoes owner.
- Erros comuns mapeados com texto amigavel.

Commit: "feat(frontend): polish owner feedback messaging and error mapping"
```

**Tarefa 8.6 — Acessibilidade e Usabilidade por Teclado**
```
Finalizar camada de acessibilidade:

1. Focus ring e ordem de tab coerente.
2. Dialogs e dropdowns com teclado.
3. Labels/aria em controles criticos.
4. Revisao de contraste em light/dark.

Validacao:
- Fluxos principais operaveis sem mouse.
- Sem regressao de contraste e foco.

Commit: "fix(frontend): improve accessibility and keyboard navigation for owner panel"
```

### Dia 3 (Quarta) — Performance Polish

**Tarefa 8.7 — Code Splitting para Modais e Blocos Pesados**
```
Reduzir custo de carregamento inicial:

1. Dynamic import para modais e tabelas pesadas.
2. Lazy load para graficos secundarios.
3. Avaliar bundle impact nas paginas owner.

Validacao:
- Melhor tempo de interatividade inicial.
- Sem quebra de UX em carregamento tardio.

Commit: "perf(frontend): apply code splitting on heavy owner components"
```

**Tarefa 8.8 — Otimizacao de Cache/Query no Owner**
```
Ajustar estrategia de cache React Query:

1. Revisar staleTime/gcTime por dominio owner.
2. Prefetch de dados de alto acesso.
3. Invalidation precisa apos mutacoes.

Validacao:
- Menos refetch desnecessario.
- Dados pos-mutacao coerentes sem stale indevido.

Commit: "perf(frontend): tune owner react-query caching and invalidation strategy"
```

**Tarefa 8.9 — Preload de Tabs/Secoes Pesadas (Activity Pattern)**
```
Melhorar navegacao entre areas owner:

1. Implementar preload de secoes pesadas em idle.
2. Aplicar strategy de prefetch no hover/focus de navegacao.
3. Medir impacto em navegacao percebida.

Validacao:
- Mudanca entre rotas owner com menor latencia percebida.
- Sem spikes relevantes de memoria.

Commit: "perf(frontend): add preload strategy for heavy owner sections"
```

### Dia 4 (Quinta) — Deploy Staging de Testes (Nao Producao)

**Tarefa 8.10 — Definir Fronteiras de Ambiente Staging de Teste**
```
Formalizar requisitos de seguranca de homologacao:

1. Ambiente alvo: staging de testes interno.
2. Regras obrigatorias:
   - nunca producao
   - sem segredos de producao
   - sem dados reais de clientes
   - pagamentos com chaves de teste
   - sem release publico

3. Documentar checklist de compliance do ambiente.

Validacao:
- Checklist de staging aprovado antes de qualquer deploy.
- Escopo de homologacao claro para todo time.

Commit: "docs(devops): define staging test environment boundaries and safety rules"
```

**Tarefa 8.11 — Prontidao Backend para Homologacao (Alto Nivel)**
```
Checklist backend para staging de testes:

1. Build de imagem validada.
2. Variaveis de ambiente de teste revisadas.
3. Banco/redis de staging isolados.
4. Migrations aplicaveis em ambiente de homologacao.
5. Health checks ativos.

Validacao:
- Backend staging sobe e responde endpoints criticos.
- Sem dependencia de recursos de producao.

Commit: "chore(devops): establish backend staging readiness checklist"
```

**Tarefa 8.12 — Prontidao Web para Homologacao (Alto Nivel)**
```
Checklist web para staging de testes:

1. Build frontend staging valida.
2. Variaveis NEXT_PUBLIC apontando para API staging.
3. Controle de acesso restrito (time interno).
4. Smoke de rotas owner/convenio em staging.

Validacao:
- Frontend staging funcional e conectado ao backend de testes.
- Acesso controlado e sem exposicao publica indevida.

Commit: "chore(devops): establish web staging readiness checklist"
```

### Dia 5 (Sexta) — Smoke Tests + Gate Final para Semana 9

**Tarefa 8.13 — Smoke Tests Funcionais em Staging de Testes**
```
Executar roteiro minimo de validacao:

1. Login owner.
2. Dashboard owner.
3. Convenios (listar + acao administrativa).
4. Users/audit filters.
5. Financeiro + export basico.
6. Settings update.

Validacao:
- Fluxos criticos funcionando em staging sem bloqueio.
- Erros encontrados catalogados e priorizados.

Commit: "test(staging): execute owner smoke tests in staging test environment"
```

**Tarefa 8.14 — Plano de Contingencia e Rollback de Staging**
```
Definir resposta rapida para falhas em homologacao:

1. Critico: rollback de build staging.
2. Critico: restauracao de configuracoes anteriores.
3. Critico: isolamento de feature com problema.
4. Registro de incidente e acao corretiva.

Validacao:
- Procedimento de rollback documentado e claro para o time.
- Nao depende de operacoes de producao.

Commit: "chore(devops): define staging rollback and incident response checklist"
```

**Tarefa 8.15 — Gate Final Semana 8 + Transicao para Semana 9**
```
Fechamento final da fase web:

1. Rodar gates finais:
   - npm run lint
   - npm run type-check
   - npm run test
   - npm run build

2. Revisar checklist Semana 7 e 8 integral.
3. Consolidar backlog de pendencias nao-bloqueantes.
4. Publicar readiness para iniciar Semana 9 (mobile setup + auth).

Validacao:
- Todos os gates verdes.
- Staging de testes validado para uso interno.
- Semana 9 desbloqueada.

Commit: "chore(frontend): finalize week8 polish and staging-test gate for week9 handoff"
```

---

## PARTE 2 — CHECKLIST DE ENTREGA SEMANAS 7 E 8

### Criterios de Aceitacao (Definition of Done)

```
[ ] Semana 7 — Painel Owner + Financeiro

[ ] Dashboard executivo global
    [ ] KPIs owner com dados reais via hooks gerados
    [ ] Graficos globais com filtros de periodo
    [ ] States loading/error/empty completos

[ ] Gestao de convenios
    [ ] /owner/convenios sem placeholder
    [ ] Listagem e filtros funcionais
    [ ] Detalhe por convenio
    [ ] Aprovar/suspender/reativar operacionais

[ ] Gestao de usuarios
    [ ] /owner/users sem placeholder
    [ ] Listagem, busca e filtros
    [ ] Detalhe de usuario funcional
    [ ] Escopo de acoes administrativas claro (sem inventar endpoint)

[ ] Financeiro global e auditoria
    [ ] /owner/financial sem placeholder
    [ ] /owner/audit-logs sem placeholder
    [ ] Filtros e paginacao funcionais
    [ ] Blocos de reconciliacao financeira

[ ] Exportacoes CSV/PDF
    [ ] CSV funcional em tabelas owner
    [ ] PDF funcional dentro das capacidades atuais (sem endpoint inexistente)

[ ] Configuracoes globais
    [ ] /owner/settings sem placeholder
    [ ] useGetPlatformSettings + useUpdatePlatformSettings funcionando
    [ ] Validacao com updatePlatformSettingsMutationRequestSchema

[ ] Semana 8 — Polish e Staging de Testes

[ ] Testes frontend (lint/type/test/build)
    [ ] Stack de testes configurada
    [ ] Fluxos owner criticos cobertos
    [ ] npm run test passa

[ ] Melhorias de UX e performance
    [ ] UX states padronizados em todas as telas owner
    [ ] Toasters e mapeamento de erro refinados
    [ ] Code splitting e ajuste de cache aplicados

[ ] Deploy staging backend + web (TESTE)
    [ ] Ambiente alvo e homologacao/staging de testes
    [ ] Nao producao (explicito)
    [ ] Sem segredos de producao
    [ ] Sem dados reais de clientes
    [ ] Pagamentos apenas em modo teste
    [ ] Acesso restrito a validacao interna
    [ ] Smoke tests de staging aprovados

[ ] Regras de contrato e arquitetura
    [ ] Integracao owner via @api/*
    [ ] Hooks owner obrigatorios usados no escopo
    [ ] Schemas zod owner obrigatorios citados/usados
    [ ] shared/gen/ nao editado manualmente
```

### Metricas de Qualidade Esperadas

```
Warnings ESLint: 0
Erros TypeScript: 0
Testes frontend: verdes
Build frontend: sucesso
Paginas owner sem placeholders criticos: 6/6
Operacoes owner integradas com hooks gerados: 100%
Staging validado: ambiente de testes interno (nao producao)
Tarefas totais: 30
Tempo estimado: 2 semanas (80h)
```

---

## PARTE 3 — COMANDOS DE REFERENCIA RAPIDA

### Desenvolvimento Local

```bash
# Backend
cd backend/
docker compose -f docker-compose.dev.yml up -d

# Frontend
cd ../frontend/
npm run dev
# Acessar http://localhost:3000
```

### Endpoints Owner (Validacao Rapida)

```bash
# Login owner
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@healthapp.com.br","password":"Owner@2026!"}'

# Dashboard owner
curl http://localhost:8000/api/v1/admin-panel/dashboard/ \
  -H "Authorization: Bearer <token>"

# Convenios owner
curl http://localhost:8000/api/v1/admin-panel/convenios/?page=1 \
  -H "Authorization: Bearer <token>"

# Usuarios owner
curl http://localhost:8000/api/v1/admin-panel/users/?page=1 \
  -H "Authorization: Bearer <token>"

# Audit logs owner
curl http://localhost:8000/api/v1/admin-panel/audit-logs/?page=1 \
  -H "Authorization: Bearer <token>"

# Financeiro owner
curl http://localhost:8000/api/v1/admin-panel/financial/ \
  -H "Authorization: Bearer <token>"

# Platform settings owner
curl http://localhost:8000/api/v1/admin-panel/settings/ \
  -H "Authorization: Bearer <token>"
```

### Verificacao de Hooks e Schemas Owner

```bash
cd frontend/

# Imports @api no escopo owner
rg -n "@api/" app features hooks components

# Hooks owner obrigatorios
rg -n "useGetOwnerDashboard|useListAdminConvenios|useGetAdminConvenioById|useSuspendConvenio|useApproveConvenio|useListAdminUsers|useListAuditLogs|useGetOwnerFinancialReport|useGetPlatformSettings|useUpdatePlatformSettings" .

# Schemas zod owner obrigatorios
rg -n "listAdminConveniosQueryParamsSchema|listAdminUsersQueryParamsSchema|listAuditLogsQueryParamsSchema|updatePlatformSettingsMutationRequestSchema" .
```

### Quality Gates

```bash
cd frontend/
npm run lint
npm run type-check
npm run test
npm run build
```

### Kubb / Contrato de API

```bash
# Executar somente se houver mudanca em serializer/view no backend
cd /mnt/d/apps/Healthapp
npm run api:sync

# Revalidar frontend
cd frontend/
npm run type-check
npm run build
```

### Staging de Testes (Alto Nivel — Nao Producao)

```bash
# Fluxo estrategico de homologacao:
# 1) Build backend/web de staging
# 2) Aplicar env vars de TESTE (nunca producao)
# 3) Deploy em ambiente interno restrito
# 4) Rodar smoke tests owner
# 5) Registrar resultado e pendencias
```

### Git

```bash
# Branch sugerida
git checkout -b feat/weeks7-8-owner-polish-staging-test

# Commits convencionais
git commit -m "feat(frontend): implement owner panel complete management flows"
git commit -m "feat(frontend): implement owner financial audit and exports"
git commit -m "test(frontend): add owner critical flow tests"
git commit -m "perf(frontend): apply owner performance polish"
git commit -m "chore(devops): finalize staging-test readiness checklist"
```

---

## PARTE 4 — TRANSICAO PARA SEMANA 9

Ao concluir as Semanas 7 e 8, a frente web tera:
- **Painel owner completo** com dashboard, convenios, usuarios, auditoria, financeiro e settings.
- **Exportacoes operacionais** no escopo atual da plataforma.
- **Polish tecnico e UX** consolidado nas telas criticas.
- **Suite de testes frontend** cobrindo fluxos owner principais.
- **Ambiente de staging de testes validado** para homologacao interna.

**Importante:** Semana 8 NAO finaliza producao.
Tudo nesta fase e homologacao/staging de testes, sem release publico.

**Semana 9: Setup Mobile + Auth** — Foco em:
- Expo + base mobile + auth mobile
- Reuso de contratos `@api/*` ja consolidados
- Fluxos iniciais mobile com seguranca e qualidade

**Continuidade obrigatoria do Kubb:**
- Nao escrever boilerplate manual de API.
- Toda mudanca de contrato nasce no backend e passa por `npm run api:sync`.

---

*Fim do Prompt de Execucao Semanas 7 e 8*
