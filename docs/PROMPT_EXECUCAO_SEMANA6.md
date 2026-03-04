# HealthApp — Prompt de Execucao Semana 6: Painel Convenio Completo

> **Objetivo:** Este documento detalha task-by-task a Semana 6 do HealthApp.
> Foco: sair de placeholders no painel do convenio para CRUDs completos de medicos,
> agendas, excecoes e tipos de exame, com UX robusta e uso estrito dos contratos gerados
> em `shared/gen/` via `@api/*` (hooks, clients, types e zod).
>
> Pre-requisito: Semana 5 concluida.
> Leitura obrigatoria de `CLAUDE.md` (raiz), `frontend/CLAUDE.md` e `shared/CLAUDE.md`.

---

## ANALISE DO ESTADO ATUAL (Pos-Semana 5)

### O que JA existe no frontend real atual:

**Base de plataforma web consolidada:**
- Next.js 16.1.6 + React 19 + TypeScript strict + Turbopack
- Tailwind CSS 4 com design tokens em `app/globals.css`
- Shadcn/UI com catalogo de componentes base
- Providers globais: TanStack Query + Devtools + ThemeProvider + Sonner
- Auth flow base com `proxy.ts`, `authService`, `useAuthGuard` e `auth-store`

**Estrutura de rotas e layouts pronta:**
- `app/(convenio)/layout.tsx` com shell completo (sidebar + header)
- `app/(owner)/layout.tsx` com shell completo (sidebar + header)
- Rotas de painel ja criadas para convenio e owner
- Paginas globais de erro/loading/not-found ja implementadas

**Design system e composicao:**
- Templates reutilizaveis (`DashboardTemplate`, `CrudTableTemplate`, `AuthTemplate`)
- Patterns de tabela/busca/filtros (`DataTableToolbar`, `SearchFieldDebounced`, etc.)
- Componentes de feedback e atoms de dominio consolidados

**Dados reais parcialmente integrados:**
- Dashboard do convenio funcional com KPIs/graficos/tabelas reais
- Dashboard owner funcional com KPIs globais reais
- Formatadores utilitarios em `lib/formatters.ts`

**Integracao Kubb pronta para Semana 6:**
- Alias `@api/*` operacional para `../shared/gen/*`
- Hooks ja gerados para CRUD da Semana 6:
  - Doctors: `useListDoctors`, `useCreateDoctor`, `usePatchDoctor`, `useDeleteDoctor`
  - Schedules: `useListDoctorSchedules`, `useCreateDoctorSchedule`, `usePatchDoctorSchedule`, `useDeleteDoctorSchedule`
  - Exceptions: `useListScheduleExceptions`, `useCreateScheduleException`, `useDeleteScheduleException`
  - Exams: `useListExamTypes`, `useCreateExamType`, `usePatchExamType`, `useDeleteExamType`
- Schemas Zod gerados disponiveis:
  - `doctorRequestSchema`
  - `patchedDoctorRequestSchema`
  - `doctorScheduleRequestSchema`
  - `scheduleExceptionRequestSchema`
  - `examTypeRequestSchema`

### O que FALTA para a Semana 6:

1. **Doctors page ainda e placeholder** em `app/(convenio)/convenio/doctors/page.tsx`.
2. **Schedules page ainda e placeholder** em `app/(convenio)/convenio/schedules/page.tsx`.
3. **Exams page ainda e placeholder** em `app/(convenio)/convenio/exams/page.tsx`.
4. **Sem CRUD completo de medicos** (listagem real, criar, editar, excluir, detalhes).
5. **Sem CRUD completo de agendas/excecoes** com interacao por medico.
6. **Sem CRUD completo de tipos de exame** com precificacao operacional.
7. **Tabela de precos consolidada (consultas + exames)** ainda nao implementada.
8. **UX base obrigatoria da semana** (loading/error/empty/retry) ainda nao aplicada nesses dominios.
9. **View Transitions** nao aplicadas na navegacao do painel convenio.
10. **Cache Components para dados lentos** ainda nao formalizado para area de convenio.

---

## PARTE 1 — TAREFAS DETALHADAS

### Dia 1 (Segunda) — Doctors CRUD Foundation

**Tarefa 6.1 — Substituir Placeholder de Medicos por Pagina Real de CRUD**
```
Transforme /convenio/doctors de placeholder para pagina funcional:

1. Substituir app/(convenio)/convenio/doctors/page.tsx:
   - Remover PagePlaceholder
   - Usar CrudTableTemplate como base visual
   - Definir titulo "Medicos" e descricao operacional

2. Criar estrutura de dominio em frontend/features/doctors/:
   - doctors-page-content.tsx
   - doctors-table.tsx
   - doctors-toolbar.tsx
   - doctor-form-dialog.tsx
   - doctor-delete-dialog.tsx
   - index.ts

3. Criar hooks de composicao (wrappers locais) em frontend/hooks/doctors/:
   - use-doctors-list.ts (envolve useListDoctors)
   - use-doctor-mutations.ts (create/patch/delete + invalidacoes)
   - padronizar query keys com funcoes geradas pelo Kubb

4. Regras obrigatorias:
   - Todos os imports de API via @api/* (nunca axios manual para CRUD desta semana)
   - Nenhum type manual para payload/response da API
   - Tipos de UI extras somente como extensao local quando necessario

Validacao:
- /convenio/doctors nao exibe mais placeholder
- Pagina renderiza estrutura completa de CRUD com template reutilizavel
- Build e type-check seguem verdes apos troca estrutural

Commit: "feat(frontend): replace convenio doctors placeholder with real CRUD page scaffold"
```

**Tarefa 6.2 — Tabela de Medicos com Busca, Filtros e Paginacao**
```
Implementar listagem real de medicos usando hooks gerados:

1. Usar hook principal:
   - useListDoctors(params)
   - params minimos: page, page_size, search, specialty, is_available, ordering

2. Construir toolbar com DataTableToolbar:
   - Busca debounced por search (name/specialty fuzzy)
   - Filtro por especialidade
   - Filtro por status de disponibilidade
   - Ordenacao por nome, rating, created_at

3. Montar tabela:
   - Colunas: Nome, CRM/UF, Especialidade, Duracao, Preco, Rating, Disponivel, Acoes
   - Usar componentes DS: StatusPill, CurrencyText, RatingStars quando aplicavel
   - Acoes por linha: editar, excluir, abrir detalhes

4. Paginacao:
   - Consumir meta paginada (count/next/previous/results)
   - Controles de pagina e page_size

5. Estados de tabela:
   - Loading com SkeletonTable
   - Empty com EmptyStateBlock
   - Error com ErrorStateBlock e botao retry

Validacao:
- Busca e filtros alteram query params e recarregam dados corretamente
- Paginacao avanca/retorna sem quebrar estado
- Tabela mostra dados reais vindos de /api/v1/doctors/

Commit: "feat(frontend): implement doctors table with search filters and pagination via useListDoctors"
```

**Tarefa 6.3 — Modal de Criacao/Edicao de Medicos com RHF + Zod Gerado**
```
Implementar formulario de medico sem tipos manuais:

1. Form de criacao:
   - React Hook Form + zodResolver(doctorRequestSchema)
   - Mutation: useCreateDoctor
   - Payload: CreateDoctorMutationRequest

2. Form de edicao:
   - React Hook Form + zodResolver(patchedDoctorRequestSchema)
   - Mutation: usePatchDoctor
   - Path param: { id }
   - Preencher defaultValues com dados da linha selecionada

3. Campos obrigatorios no modal:
   - user (uuid)
   - convenio (uuid)
   - crm
   - crm_state
   - specialty
   - subspecialties
   - consultation_duration
   - consultation_price
   - is_available
   - bio

4. Comportamento:
   - Submit com loading state
   - Toast de sucesso/erro
   - Fechar modal em sucesso
   - Invalidar cache de listDoctors apos mutacao

Validacao:
- Criar medico adiciona item novo na tabela apos refetch/invalidation
- Editar medico atualiza dados sem refresh manual da pagina
- Validacao Zod bloqueia payload invalido antes da mutation

Commit: "feat(frontend): add doctor create/edit modal with RHF and generated Zod schemas"
```

### Dia 2 (Terca) — Doctors Advanced + Schedules CRUD

**Tarefa 6.4 — Delete + Detalhes de Medico com Invalidao de Cache**
```
Completar a experiencia de CRUD medico:

1. Delete flow:
   - Dialog de confirmacao com contexto (nome + crm)
   - Mutation: useDeleteDoctor
   - Bloquear acao durante pending
   - Invalidar listDoctorsQueryKey apos sucesso

2. Detalhes de medico:
   - Drawer ou modal com dados completos da entidade
   - Opcionalmente usar useGetDoctorById para carregar detalhes frescos
   - Exibir dados de agenda basica e metadata (created_at/updated_at)

3. Regras:
   - Tratar 409/422 com mensagens amigaveis
   - Nao permitir double-submit em delete

Validacao:
- Excluir remove registro da tabela sem inconsistencias
- Detalhes abrem com dados corretos e sem tipos manuais
- Erros de API aparecem com feedback claro

Commit: "feat(frontend): implement doctor delete and detail panel with query invalidation"
```

**Tarefa 6.5 — Gestao de Agenda Semanal por Medico (Visual Interativo)**
```
Criar base visual para gerenciamento de horarios:

1. Substituir app/(convenio)/convenio/schedules/page.tsx:
   - Remover placeholder
   - Estruturar pagina com duas areas:
     a) seletor/lista de medicos
     b) grade semanal de horarios

2. Fonte de dados:
   - Medicos: useListDoctors (filtro convenio + ativos)
   - Horarios: useListDoctorSchedules (com filtro local por doctor selecionado)

3. UI semanal:
   - Colunas por dia da semana (0-6)
   - Blocos por faixa de horario (start/end)
   - Botao rapido "Novo horario"
   - Acoes por bloco: editar/remover

4. Interacao minima obrigatoria:
   - Selecionar medico altera grade
   - Mostrar empty state quando medico sem horarios

Validacao:
- /convenio/schedules nao exibe placeholder
- Selecao de medico recarrega horarios correspondentes
- Grade semanal renderiza horarios reais

Commit: "feat(frontend): implement interactive weekly schedule management view by doctor"
```

**Tarefa 6.6 — CRUD de Horarios com Zod Gerado e Hooks de Convenio**
```
Implementar CRUD completo de doctor schedules:

1. Criar modal de horario:
   - zodResolver(doctorScheduleRequestSchema)
   - Campos: doctor, weekday, start_time, end_time, slot_duration, is_active

2. Mutations obrigatorias:
   - useCreateDoctorSchedule
   - usePatchDoctorSchedule
   - useDeleteDoctorSchedule

3. Query obrigatoria:
   - useListDoctorSchedules

4. Invalidao de cache:
   - invalidar listDoctorSchedulesQueryKey apos create/patch/delete
   - manter listDoctors em sync quando necessario (ex: disponibilidade)

5. Regras funcionais:
   - Impedir end_time <= start_time no form
   - Mensagem clara para conflito de horario retornado pela API

Validacao:
- Criar, editar e excluir horario funcionam end-to-end
- Grade semanal reflete alteracoes imediatamente
- Validacoes locais evitam submits invalidos

Commit: "feat(frontend): add full doctor schedule CRUD using generated hooks and schemas"
```

### Dia 3 (Quarta) — Excecoes + Exam Types + Precificacao

**Tarefa 6.7 — Excecoes de Agenda com Date Range e Aplicacao em Massa**
```
Implementar dominio de schedule exceptions:

1. Criar secao de excecoes na pagina de agendas:
   - Lista paginada de excecoes
   - Filtros por medico, data, tipo (full day/parcial), disponibilidade

2. Form de excecao:
   - zodResolver(scheduleExceptionRequestSchema)
   - Campos: doctor, date, start_time, end_time, is_full_day, is_available, reason

3. Hooks obrigatorios:
   - useListScheduleExceptions
   - useCreateScheduleException
   - useDeleteScheduleException

4. Date range picker:
   - Quando usuario selecionar periodo, criar lote de excecoes (1 por dia)
   - Exibir preview de quantos dias serao afetados antes de confirmar

5. Aplicacao em massa:
   - Permitir aplicar para um medico especifico (obrigatorio)
   - Aplicacao para varios medicos e opcional (se houver tempo)

Validacao:
- Criacao de excecao unica funciona
- Criacao por range gera multiplas excecoes com feedback de sucesso/erro parcial
- Lista atualiza apos inclusoes/remocoes

Commit: "feat(frontend): implement schedule exceptions with date range and bulk apply"
```

**Tarefa 6.8 — CRUD de Tipos de Exame com Validacao Gerada**
```
Transformar /convenio/exams em CRUD completo:

1. Substituir app/(convenio)/convenio/exams/page.tsx:
   - Remover placeholder
   - Basear pagina em CrudTableTemplate

2. Tabela de exam types:
   - Hook: useListExamTypes
   - Colunas: Nome, Duracao, Preco, Ativo, Atualizado em, Acoes
   - Busca por search + ordenacao + paginacao

3. Modal create/edit:
   - zodResolver(examTypeRequestSchema) para create
   - zodResolver(examTypeRequestSchema) + prefill para edit (payload parcial se necessario)
   - Mutations: useCreateExamType, usePatchExamType

4. Delete:
   - useDeleteExamType com confirmacao
   - invalidar listExamTypesQueryKey apos sucesso

5. Campos obrigatorios:
   - convenio, name, description, preparation, duration_minutes, price, is_active

Validacao:
- CRUD de exam types funcional com dados reais
- Validacao de preco e campos obrigatorios funcionando no form
- Lista atualiza sem reload de pagina

Commit: "feat(frontend): implement exam types CRUD with generated hooks and zod schema"
```

**Tarefa 6.9 — Tabela de Precificacao (Consultas + Exames)**
```
Entregar visao operacional de precos no convenio:

1. Criar secao "Tabela de Precos" em /convenio/exams (ou subsecao dedicada):
   - Consultas: dados de doctors.consultation_price
   - Exames: dados de exam_types.price

2. Exibicao consolidada:
   - Tabela comparativa com tipo, categoria, valor atual, status, ultima atualizacao
   - Filtro por categoria (consulta/exame)

3. Atualizacao de preco:
   - Consulta: via usePatchDoctor
   - Exame: via usePatchExamType
   - Reusar formularios/mutacoes ja criados

4. Historico de alteracoes:
   - Como API atual nao expoe historico dedicado, implementar historico de sessao local
     para operacao atual (antes/depois + timestamp + usuario logado)
   - Marcar explicitamente no texto do prompt que historico persistente depende de endpoint futuro

5. Regras:
   - Formatar sempre em BRL via formatters existentes
   - Bloquear valor negativo no input

Validacao:
- Tabela consolidada mostra precos de consultas e exames
- Patch de preco atualiza valor refletido na UI
- Filtro por categoria funciona

Commit: "feat(frontend): add unified pricing table for consultations and exam types"
```

### Dia 4 (Quinta) — UX Base + View Transitions + Cache Components

**Tarefa 6.10 — UX Base Obrigatoria: Loading, Error, Empty e Retry**
```
Aplicar padrao de estados em Doctors, Schedules e Exams:

1. Loading:
   - SkeletonTable para listagens
   - Skeletons especificos para cards e blocos de agenda

2. Error:
   - ErrorStateBlock com mensagem de contexto
   - Botao retry conectado ao refetch da query

3. Empty:
   - EmptyStateBlock com CTA para criar primeiro registro
   - Texto especifico por dominio (medico, horario, exame, excecao)

4. Retry strategy:
   - Usar recurso do React Query (refetch)
   - Evitar loops automaticos de retry para erros de validacao

5. Aderencia DS:
   - Reaproveitar componentes existentes do design system
   - Evitar componentes duplicados por pagina

Validacao:
- Toda listagem principal tem loading/error/empty definidos
- Fluxo de retry recupera tela apos falha transitoria
- Nao ha spinner generico substituindo skeletons

Commit: "feat(frontend): apply consistent loading error empty and retry states to convenio CRUD pages"
```

**Tarefa 6.11 — View Transitions na Navegacao do Painel Convenio**
```
Adicionar navegacao suave entre paginas da area convenio:

1. Integrar View Transitions do React 19 onde aplicavel:
   - Transicao entre /convenio/dashboard, /doctors, /schedules, /exams
   - Preservar navegacao instantanea em fallback sem suporte

2. Escopo inicial:
   - Transicao de container principal da pagina
   - Transicoes de abertura/fechamento de modais importantes

3. Guardrails:
   - Respeitar prefers-reduced-motion
   - Nao degradar performance em listas grandes

4. Implementacao:
   - Criar wrapper reutilizavel em components/sections ou templates
   - Aplicar no AppShellWeb ou nas paginas de dominio conforme melhor isolamento

Validacao:
- Navegacao entre rotas do convenio apresenta transicao suave
- Com reduced-motion, transicoes ficam minimizadas/desligadas
- Sem regressao em interacao de formularios/tabelas

Commit: "feat(frontend): add view transitions for convenio panel navigation"
```

**Tarefa 6.12 — Cache Components para Dados Lentos sem Quebrar Hooks Client-Side**
```
Aplicar estrategia de cache em Next.js 16:

1. Alvo principal:
   - Dashboard do convenio (dados mais pesados)
   - Trechos de dados estaveis da semana (nao formularios mutaveis)

2. Abordagem:
   - Separar partes cacheaveis em server boundaries quando fizer sentido
   - Manter CRUD mutavel em client components com React Query
   - Evitar cache agressivo em telas com alta taxa de edicao

3. Invalidao/consistencia:
   - Mutacoes continuam invalidando query cache do React Query
   - Definir claramente no prompt o que e "lento e cacheavel" vs "mutavel em tempo real"

4. Observabilidade:
   - Medir impacto basico: TTFB e percepcao de carregamento
   - Documentar fallback caso cache cause staleness indesejada

Validacao:
- Dashboard carrega com melhor percepcao de velocidade
- CRUDs de doctors/schedules/exams nao ficam com dado stale apos mutation
- Build permanece sem warnings de compatibilidade

Commit: "perf(frontend): apply cache components strategy for slow convenio data boundaries"
```

### Dia 5 (Sexta) — Hardening Final + Quality Gates

**Tarefa 6.13 — Hardening de Acessibilidade e Responsividade**
```
Finalizar qualidade de interface para producao interna:

1. Responsividade:
   - Validar breakpoints mobile/tablet/desktop nas paginas:
     /convenio/doctors, /convenio/schedules, /convenio/exams
   - Tabelas com comportamento adaptativo (scroll horizontal controlado)

2. Acessibilidade:
   - Labels e aria-* em formularios e botoes de acao
   - Ordem de tab consistente
   - Estados de foco visiveis e contrastes minimos

3. Interacao por teclado:
   - Modal fecha com Esc
   - Confirm dialogs navegaveis sem mouse
   - Dropdowns/selects funcionais por teclado

4. Dark mode:
   - Verificar legibilidade e contraste em estados de erro/empty/skeleton

Validacao:
- Fluxos principais funcionam em viewport mobile sem quebra de layout
- Navegacao por teclado cobre tabelas, filtros e formularios
- Sem regressao visual relevante em dark mode

Commit: "fix(frontend): improve accessibility and responsive behavior for convenio management pages"
```

**Tarefa 6.14 — Auditoria Estrita de Imports @api/* e Contratos Gerados**
```
Garantir aderencia total ao shared/gen:

1. Auditar codigo da semana:
   - Nenhum import de API via caminho relativo para shared/gen
   - Nenhum type manual duplicando contrato de API
   - Nenhum client HTTP manual para CRUD desta semana

2. Obrigatorio manter uso direto de:
   - useListDoctors, useCreateDoctor, usePatchDoctor, useDeleteDoctor
   - useListDoctorSchedules, useCreateDoctorSchedule, usePatchDoctorSchedule, useDeleteDoctorSchedule
   - useListScheduleExceptions, useCreateScheduleException, useDeleteScheduleException
   - useListExamTypes, useCreateExamType, usePatchExamType, useDeleteExamType

3. Obrigatorio manter validacao com:
   - doctorRequestSchema
   - patchedDoctorRequestSchema
   - doctorScheduleRequestSchema
   - scheduleExceptionRequestSchema
   - examTypeRequestSchema

4. Se houver qualquer gap:
   - Corrigir antes de fechar semana
   - Nao aceitar TODO de contrato para proxima semana

Validacao:
- Busca textual do repo confirma uso de @api/* nas novas features
- Sem interfaces duplicadas de payload/response nos arquivos da semana 6
- Type-check confirma compatibilidade com contratos atuais

Commit: "refactor(frontend): enforce strict @api imports and generated contract usage across week6 scope"
```

**Tarefa 6.15 — Quality Gates Finais + Evidencias + Commits Convencionais**
```
Fechamento tecnico da Semana 6:

1. Rodar quality gates:
   - npm run lint
   - npm run type-check
   - npm run build

2. Validar paginas de convenio:
   - /convenio/dashboard
   - /convenio/doctors
   - /convenio/schedules
   - /convenio/exams
   - Confirmar ausencia de placeholders nesses dominios

3. Validar checklist objetivo:
   - dashboard com KPIs e graficos
   - CRUD medicos
   - gestao agendas e excecoes
   - CRUD exames e precificacao
   - UX base loading/error/empty/retry

4. Evidencias minimas:
   - saida resumida de lint/type-check/build
   - capturas ou relato de validacao manual dos fluxos
   - lista de commits Conventional Commits da semana

5. Regra de encerramento:
   - Nao seguir para Semana 7 com gate quebrado
   - Corrigir regressao antes de considerar concluido

Validacao:
- Todos os comandos passam sem erro
- Fluxos principais funcionam manualmente no painel convenio
- Documento pronto para transicao da Semana 7

Commit: "chore(frontend): finalize week6 quality gates and delivery evidence"
```

---

## PARTE 2 — CHECKLIST DE ENTREGA SEMANA 6

### Criterios de Aceitacao (Definition of Done)

```
[ ] Dashboard com KPIs e graficos
    [ ] Dashboard convenio revisado com dados reais e UX consistente
    [ ] Graficos funcionais e responsivos
    [ ] Estrategia de cache para dados lentos aplicada sem quebrar mutacoes

[ ] CRUD medicos
    [ ] Pagina /convenio/doctors sem placeholder
    [ ] Tabela com busca/filtros/paginacao
    [ ] Criacao com doctorRequestSchema + useCreateDoctor
    [ ] Edicao com patchedDoctorRequestSchema + usePatchDoctor
    [ ] Exclusao com useDeleteDoctor + confirm dialog
    [ ] Invalidao de cache apos mutacoes

[ ] Gestao de agendas e excecoes
    [ ] Pagina /convenio/schedules sem placeholder
    [ ] Grade semanal por medico funcional
    [ ] CRUD horarios com doctorScheduleRequestSchema
    [ ] Hooks usados: useListDoctorSchedules/useCreateDoctorSchedule/usePatchDoctorSchedule/useDeleteDoctorSchedule
    [ ] CRUD excecoes com scheduleExceptionRequestSchema
    [ ] Hooks usados: useListScheduleExceptions/useCreateScheduleException/useDeleteScheduleException
    [ ] Date range para aplicacao em massa de excecoes

[ ] CRUD tipos de exame e precificacao
    [ ] Pagina /convenio/exams sem placeholder
    [ ] Listagem/Busca/Paginacao de exam types
    [ ] Criacao/Edicao com examTypeRequestSchema
    [ ] Hooks usados: useListExamTypes/useCreateExamType/usePatchExamType/useDeleteExamType
    [ ] Tabela de precificacao consolidada (consultas + exames)

[ ] UX base (loading/error/empty)
    [ ] Skeletons nas listagens principais
    [ ] Error state com retry em queries principais
    [ ] Empty state com CTA contextual em todos os CRUDs
    [ ] Feedbacks de sucesso/erro em mutacoes (toasts)

[ ] Regras de contrato e arquitetura
    [ ] 100% das operacoes CRUD da semana 6 via hooks gerados Kubb
    [ ] Nenhum tipo manual duplicando contrato de API
    [ ] Imports de API apenas via @api/*
    [ ] Nenhuma alteracao manual em shared/gen/

[ ] Quality gates finais
    [ ] npm run lint sem erros
    [ ] npm run type-check sem erros
    [ ] npm run build com sucesso
```

### Metricas de Qualidade Esperadas

```
Warnings ESLint: 0
Erros TypeScript: 0
Build: sucesso
Paginas convenio em escopo sem placeholders: 3/3 (doctors, schedules, exams)
Operacoes CRUD Semana 6 via hooks gerados: 100%
Estados UX (loading/error/empty/retry) cobrindo telas-alvo: 100%
Tarefas totais: 15
Tempo estimado: 5 dias (40h)
```

---

## PARTE 3 — COMANDOS DE REFERENCIA RAPIDA

### Desenvolvimento Local

```bash
# Backend (se nao estiver rodando)
cd backend/
docker-compose -f docker/docker-compose.dev.yml up -d
python manage.py runserver

# Frontend
cd frontend/
npm run dev
# Acessar: http://localhost:3000
```

### Validacao de Endpoints (Doctors / Schedules / Exam Types)

```bash
# Login para obter token
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@healthapp.com","password":"SecurePass123!"}'

# List doctors
curl "http://localhost:8000/api/v1/doctors/?page=1&page_size=10&search=cardio" \
  -H "Authorization: Bearer <token>"

# List doctor schedules
curl "http://localhost:8000/api/v1/schedules/?page=1&page_size=10" \
  -H "Authorization: Bearer <token>"

# List schedule exceptions
curl "http://localhost:8000/api/v1/schedule-exceptions/?page=1&page_size=10" \
  -H "Authorization: Bearer <token>"

# List exam types
curl "http://localhost:8000/api/v1/exam-types/?page=1&page_size=10" \
  -H "Authorization: Bearer <token>"
```

### Verificacao de Imports @api/* e Hooks Gerados

```bash
# Encontrar imports @api no escopo da semana
cd frontend/
rg -n "@api/" app features hooks components

# Verificar uso explicito dos hooks obrigatorios
rg -n "useListDoctors|useCreateDoctor|usePatchDoctor|useDeleteDoctor" .
rg -n "useListDoctorSchedules|useCreateDoctorSchedule|usePatchDoctorSchedule|useDeleteDoctorSchedule" .
rg -n "useListScheduleExceptions|useCreateScheduleException|useDeleteScheduleException" .
rg -n "useListExamTypes|useCreateExamType|usePatchExamType|useDeleteExamType" .

# Verificar schemas zod obrigatorios
rg -n "doctorRequestSchema|patchedDoctorRequestSchema|doctorScheduleRequestSchema|scheduleExceptionRequestSchema|examTypeRequestSchema" .
```

### Quality Gates

```bash
cd frontend/
npm run lint
npm run type-check
npm run build
```

### Kubb / API Sync (Somente se houver mudanca no backend)

```bash
# Rodar apenas se serializers/views do backend mudarem
cd /mnt/d/apps/Healthapp
npm run api:sync

# Depois validar frontend novamente
cd frontend/
npm run type-check
npm run build
```

### Git

```bash
# Branch sugerida
git checkout -b feat/week6-convenio-panel-crud

# Commits convencionais (exemplos)
git commit -m "feat(frontend): implement doctors CRUD with generated hooks"
git commit -m "feat(frontend): implement schedules and exceptions management"
git commit -m "feat(frontend): implement exams CRUD and pricing table"
git commit -m "fix(frontend): polish ux states and accessibility"
git commit -m "chore(frontend): run final quality gates for week6"
```

---

## PARTE 4 — TRANSICAO PARA SEMANA 7

Ao concluir a Semana 6, o painel do convenio tera:
- **CRUD completo de medicos** com busca, filtros, paginacao, create/edit/delete
- **Gestao de agendas operante** com visual semanal por medico
- **Excecoes de agenda** com criacao pontual e em faixa de datas
- **CRUD de tipos de exame** com precificacao funcional
- **Tabela de precos consolidada** (consultas + exames)
- **UX base robusta** em loading/error/empty/retry
- **Navegacao mais fluida** com View Transitions
- **Aderencia estrita a contratos gerados** via `@api/*`

**Semana 7: Painel Owner + Financeiro Global** — Foco em:
- Dashboard executivo global
- Gestao de convenios (aprovar/suspender/reativar)
- Gestao de usuarios
- Financeiro global + reconciliacao + auditoria
- Exportacoes CSV/PDF

**Continuidade obrigatoria do Kubb:** Manter zero boilerplate de API manual.
Toda integracao deve seguir `@api/hooks`, `@api/clients`, `@api/types` e `@api/zod`.
Qualquer mudanca de contrato deve nascer no backend e passar por `npm run api:sync`.

---

*Fim do Prompt de Execucao Semana 6*
