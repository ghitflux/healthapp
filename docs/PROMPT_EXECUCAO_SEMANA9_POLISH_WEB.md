# HealthApp — Prompt de Execucao: Polish Web Pre-Mobile

> **Objetivo:** Completar e polir ao maximo o painel web antes de avancar para mobile.
> Foco: implementar as 3 paginas placeholder do convenio (appointments, financial, settings),
> criar novos componentes reutilizaveis Shadcn/UI e polir a interface globalmente.
>
> **Pre-requisito:** Semanas 5-8 concluidas (owner panel completo, convenio doctors/schedules/exams).
> **Regra critica:** NUNCA inventar endpoints. Usar apenas hooks gerados em `@api/hooks/*`.
> **Leitura obrigatoria:** `CLAUDE.md` (raiz), `frontend/CLAUDE.md`, `shared/CLAUDE.md`.

---

## ANALISE DO ESTADO ATUAL

### O que JA existe:
- **Owner Panel**: 7/7 paginas implementadas com dados reais
- **Convenio Panel**: 4/7 paginas implementadas:
  - `dashboard` — KPIs + graficos funcionais
  - `doctors` — CRUD completo com drawer de detalhes
  - `schedules` — Grade semanal + excecoes
  - `exams` — CRUD tipos + tabela de precos
- **Design System maduro:**
  - 28 componentes Shadcn/UI em `components/ui/`
  - 9 atoms DS em `components/ds/`
  - 8 patterns em `components/patterns/`
  - 3 templates em `components/templates/`
  - Hooks wrappers em `hooks/`
- **Patterns estabelecidos:**
  - `CrudTableTemplate` para paginas de listagem
  - Feature structure: `page-content`, `table`, `toolbar`, `form-dialog`, `delete-dialog`, `detail-drawer`
  - Hooks: `use-{domain}-list` + `use-{domain}-mutations`
  - Toast feedback com `sonner` em todas as mutations

### O que FALTA (3 placeholders criticos):
1. `/convenio/appointments` — placeholder, CORE do negocio
2. `/convenio/financial` — placeholder, relatórios de receita
3. `/convenio/settings` — placeholder, configuracoes do convenio

### Contratos API disponiveis para as paginas faltantes:

**Appointments:**
- `useListAppointments` (params: page, doctor, status, date_from, date_to, appointment_type)
- `useGetAppointmentById`
- `useConfirmAppointment` (action: confirm)
- `useCancelAppointment` (body: reason)
- `useStartAppointment` (action: start)
- `useCompleteAppointment` (action: complete)
- `useMarkNoShow` (action: no-show)

**Financial:**
- `useGetConvenioFinancialReport` (params: date_from, date_to)
- `useExportConvenioAppointments` (params: format=csv)

**Settings:**
- `usePatchConvenioSettings` (PATCH partial)
- `useGetConvenioById` (carregar dados atuais)

### Tipos disponibilizados:
- `AppointmentList` — listagem resumida
- `Appointment` — detalhe completo (patient_name, doctor_name, status, price, payment, etc.)
- `AppointmentStatusEnum` — pending | confirmed | in_progress | completed | cancelled | no_show
- `AppointmentTypeEnum` — consultation | exam | return_visit
- `FinancialReport` — total_revenue, net_revenue, average_ticket, revenue_by_period, revenue_by_payment_method, top_services
- `Convenio` — name, cnpj, contact_email, contact_phone, address, settings

---

## PARTE 1 — NOVOS COMPONENTES REUTILIZAVEIS

### Fase A — Novos componentes Shadcn/UI necessarios

**Tarefa A.1 — Instalar Calendar (Shadcn) para date pickers**
```
Adicionar componente calendar ao projeto:

1. Instalar dependencia necessaria: react-day-picker
   npm install react-day-picker --prefix frontend

2. Criar frontend/components/ui/calendar.tsx
   - Baseado no padrao Shadcn/UI Calendar
   - Suportar modo single e range (dateRange)
   - Estilos Tailwind 4 consistentes com resto do DS

Validacao:
- calendar.tsx sem erros de tipo
- Pronto para ser usado em date pickers e date range filters
```

**Tarefa A.2 — Novo DS atom: AppointmentTypeBadge**
```
Criar frontend/components/ds/appointment-type-badge.tsx:

1. Props: type: AppointmentTypeEnum
2. Mapeamento visual:
   - consultation → Badge azul (Consulta)
   - exam → Badge roxo (Exame)
   - return_visit → Badge verde (Retorno)
3. Importar type de @api/types/AppointmentTypeEnum
4. Exportar no frontend/components/ds/index.ts

Validacao:
- Badge renderiza corretamente para cada tipo
- Type-safe com AppointmentTypeEnum
```

**Tarefa A.3 — Pattern reutilizavel: DateRangeFilter**
```
Criar frontend/components/patterns/date-range-filter.tsx:

1. Props:
   - from: string | undefined
   - to: string | undefined
   - onFromChange: (val: string | undefined) => void
   - onToChange: (val: string | undefined) => void
   - label?: string (default: "Periodo")

2. UI: dois date inputs com label
   - Usar input type="date" com estilo Tailwind
   - Label "De:" e "Ate:"
   - Botao "Limpar" quando ha filtros ativos

3. Exportar em frontend/components/patterns/index.ts

Validacao:
- Selecao de datas funciona
- Botao limpar reseta ambos os campos
- Sem dependencia de bibliotecas extras
```

**Tarefa A.4 — Pattern reutilizavel: ActionConfirmationDialog**
```
Criar frontend/components/patterns/action-confirmation-dialog.tsx:

Props:
- open: boolean
- onClose: () => void
- onConfirm: () => void | Promise<void>
- isLoading?: boolean
- title: string
- description: string
- confirmLabel?: string (default: "Confirmar")
- confirmVariant?: "default" | "destructive" (default: "default")
- children?: React.ReactNode (detalhes extras opcionais)

Implementacao:
- Usar Dialog do Shadcn/UI
- Loading state no botao de confirmar
- Double-submit bloqueado via isLoading

Exportar em frontend/components/patterns/index.ts

Validacao:
- Dialog abre/fecha corretamente
- Botao desabilita durante loading
- Tecla Escape fecha sem confirmar
```

**Tarefa A.5 — Pattern reutilizavel: DetailInfoRow**
```
Criar frontend/components/patterns/detail-info-row.tsx:

Props:
- label: string
- value: React.ReactNode
- className?: string

UI:
- Layout flex: label (muted, smaller) + valor (semibold)
- Suporte a valor como texto, badge, chip, etc.

Exportar em frontend/components/patterns/index.ts

Validacao:
- Renderiza label + valor com espacamento correto
- Aceita ReactNode como valor (badges, chips, etc.)
```

**Tarefa A.6 — Pattern reutilizavel: TablePagination**
```
Criar frontend/components/patterns/table-pagination.tsx:

Props:
- page: number
- totalPages: number
- onPageChange: (page: number) => void

Implementacao:
- Wrapper sobre Shadcn Pagination
- Mostra "Pagina X de Y"
- Botoes anterior/proximo desabilitados nos limites
- Oculta automaticamente quando totalPages <= 1

Exportar em frontend/components/patterns/index.ts

Validacao:
- Paginacao funciona corretamente
- Oculta quando pagina unica
```

---

## PARTE 2 — PAGINA DE AGENDAMENTOS (CORE)

A pagina de agendamentos e o coração do negocio. Um convenio gerencia seus
agendamentos por aqui: confirma, cancela, inicia, completa, marca no-show.

### Fase B — Hooks para Agendamentos

**Tarefa B.1 — Hook de listagem de agendamentos**
```
Criar frontend/hooks/appointments/use-appointments-list.ts:

1. Importar useListAppointments de @api/hooks/useAppointments
2. State interno gerenciado:
   - page (default: 1)
   - search: string (doctor name debounced 300ms)
   - status: AppointmentStatusEnum | ''
   - appointmentType: AppointmentTypeEnum | ''
   - dateFrom: string | undefined
   - dateTo: string | undefined
   - ordering: string (default: '-scheduled_date')

3. Calcular convenioId do useAuthStore

4. Retornar:
   - appointments: AppointmentList[]
   - total: number
   - totalPages: number
   - page, setPage
   - isLoading, isError
   - refetch
   - search, status, appointmentType, dateFrom, dateTo, ordering
   - handleSearch, handleStatus, handleType, handleDateFrom, handleDateTo, handleOrdering

5. staleTime: 30_000 (30s)

Validacao:
- Hook retorna dados e estado corretamente
- Filtros aplicados como query params
```

**Tarefa B.2 — Hook de mutations de agendamentos**
```
Criar frontend/hooks/appointments/use-appointment-mutations.ts:

1. Importar de @api/hooks/useAppointments:
   - useConfirmAppointment
   - useCancelAppointment
   - useStartAppointment
   - useCompleteAppointment
   - useMarkNoShow
   - listAppointmentsQueryKey

2. Para cada mutation:
   - onSuccess: toast.success + invalidateQueries(listAppointmentsQueryKey())
   - onError: toast.error com getApiError(error, fallback)

3. Expor funcoes:
   - confirmAppointment(id: string): Promise<void>
   - cancelAppointment(id: string, reason: string): Promise<void>
   - startAppointment(id: string): Promise<void>
   - completeAppointment(id: string, notes?: string): Promise<void>
   - markNoShow(id: string, reason?: string): Promise<void>

4. Expor flags:
   - isConfirming, isCancelling, isStarting, isCompleting, isMarkingNoShow

Validacao:
- Mutations disparam toast de sucesso/erro
- Cache invalidado apos cada mutation bem-sucedida
```

### Fase C — Componentes de Agendamento

**Tarefa C.1 — Tabela de Agendamentos**
```
Criar frontend/features/appointments/appointments-table.tsx:

Props:
- appointments: AppointmentList[]
- isLoading: boolean
- isError: boolean
- onRetry: () => void
- onView: (a: AppointmentList) => void
- onAction: (a: AppointmentList, action: 'confirm' | 'cancel' | 'start' | 'complete' | 'no_show') => void
- onCreate?: () => void

Colunas:
- Data/Hora (data + hora formatada com date-fns, dd/MM/yyyy HH:mm)
- Paciente (via appointment.doctor_name — mas no contexto convenio mostrar patient do detail)
  - OBS: AppointmentList nao tem patient_name, mostrar doctor_name + specialty
- Medico (doctor_name + doctor_specialty como sub-texto)
- Tipo (AppointmentTypeBadge)
- Status (StatusPill do DS)
- Valor (CurrencyText do DS)
- Acoes (dropdown com acoes disponiveis por status)

Acoes por status:
- pending → confirmar, cancelar
- confirmed → iniciar, cancelar
- in_progress → completar, no-show
- completed/cancelled/no_show → apenas visualizar

Estados UX:
- isLoading → SkeletonTable (6 linhas)
- isError → ErrorStateBlock com retry
- lista vazia → EmptyStateBlock

Validacao:
- Tabela renderiza com dados reais
- Acoes corretas por status
- Estados loading/error/empty funcionais
```

**Tarefa C.2 — Toolbar de Agendamentos**
```
Criar frontend/features/appointments/appointments-toolbar.tsx:

Props (passados do hook de listagem):
- search, onSearch
- status, onStatus
- appointmentType, onType
- dateFrom, dateTo, onDateFrom, onDateTo
- ordering, onOrdering

Elementos:
1. SearchFieldDebounced para busca por medico
2. Select de status com opcoes mapeadas:
   - Todos os status
   - Pendente / Confirmado / Em progresso / Concluido / Cancelado / No-show
3. Select de tipo: Todos / Consulta / Exame / Retorno
4. DateRangeFilter (componente pattern criado na Fase A)
5. Contador de filtros ativos + botao "Limpar filtros"

Validacao:
- Todos os filtros funcionam independentemente
- Limpar filtros reseta todos para estado inicial
```

**Tarefa C.3 — Sheet de Detalhes do Agendamento**
```
Criar frontend/features/appointments/appointment-detail-sheet.tsx:

Props:
- appointmentId: string | null
- open: boolean
- onClose: () => void
- onAction: (action: string) => void

Implementacao:
- Usar Sheet do Shadcn/UI (side panel da direita, largura 600px)
- Carregar dados completos com useGetAppointmentById quando open e appointmentId
- Loading: skeleton de informacoes
- Error: ErrorStateBlock dentro do sheet

Secoes do sheet:
1. HEADER: status badge grande + data/hora + tipo
2. INFORMACOES GERAIS (usando DetailInfoRow):
   - Medico / Especialidade
   - Data e Hora
   - Duracao
   - Tipo de atendimento
   - Exame (se exam type)
3. PAGAMENTO:
   - Valor
   - Status do pagamento (badge)
   - Metodo
4. NOTAS: campo de notas do agendamento (se existir)
5. TIMELINE (ao final):
   - created_at: Agendamento criado
   - confirmed: Confirmado (se aplicavel)
   - started_at: Iniciado (se aplicavel)
   - completed_at: Concluido (se aplicavel)
   - no_show_at: No-show registrado (se aplicavel)
   - Cada linha: icone + label + data/hora formatada

6. FOOTER com botoes de acao (baseado no status atual):
   - pending → [Confirmar] [Cancelar]
   - confirmed → [Iniciar] [Cancelar]
   - in_progress → [Concluir] [Marcar No-show]
   - outros → apenas fechar

Validacao:
- Sheet abre com dados corretos do agendamento
- Timeline mostra apenas etapas concluidas
- Botoes de acao condicionais ao status
```

**Tarefa C.4 — Dialog de Cancelamento**
```
Criar frontend/features/appointments/appointment-cancel-dialog.tsx:

Props:
- open: boolean
- onClose: () => void
- appointment: AppointmentList | null
- onConfirm: (reason: string) => Promise<void>
- isCancelling: boolean

UI:
- Usar ActionConfirmationDialog como base
- Campo textarea para motivo de cancelamento (obrigatorio, minimo 10 chars)
- Validacao simples antes de confirmar
- Mostrar nome do medico + data no cabecalho

Validacao:
- Nao cancela sem motivo preenchido
- Loading state durante cancelamento
```

**Tarefa C.5 — Pagina de Agendamentos (orquestrador)**
```
Criar frontend/features/appointments/appointments-page-content.tsx:

1. Integrar hooks: useAppointmentsList + useAppointmentMutations
2. Estado local: selectedAppointment (para sheet), actionAppointment (para dialogs)
3. Handlers:
   - handleView: abre sheet de detalhes
   - handleAction: distribui para dialog correto por tipo de acao
   - handleCancel (com motivo)
   - handleConfirm, handleStart, handleComplete, handleNoShow (via ActionConfirmationDialog)

4. Layout:
   - CrudTableTemplate sem botao "criar" (agendamentos criados pelo paciente)
   - Titulo: "Agendamentos"
   - Descricao: "Gerencie os agendamentos do seu convenio"
   - Toolbar, Tabela, Paginacao (TablePagination)

5. Dialogs montados fora da tabela:
   - AppointmentDetailSheet
   - AppointmentCancelDialog (com campo motivo)
   - ActionConfirmationDialog para confirmar/iniciar/completar/no-show

Validacao:
- Pagina renderiza e carrega dados reais
- Todas as acoes funcionam com feedback de toast
- Sheet de detalhe abre e fecha corretamente
```

**Tarefa C.6 — Conectar page.tsx de Agendamentos**
```
Atualizar frontend/app/(convenio)/convenio/appointments/page.tsx:

1. Remover PagePlaceholder
2. Adicionar export const dynamic = 'force-dynamic'
3. Importar AppointmentsPageContent de features/appointments
4. Manter metadata

Validacao:
- Pagina /convenio/appointments carrega sem placeholder
- Dados reais aparecem na tabela
```

---

## PARTE 3 — PAGINA FINANCEIRA DO CONVENIO

### Fase D — Hooks Financeiros

**Tarefa D.1 — Hook de relatorio financeiro**
```
Criar frontend/hooks/financial/use-convenio-financial.ts:

1. Importar useGetConvenioFinancialReport de @api/hooks/useConvenio
2. State:
   - dateFrom: string (default: primeiro dia do mes atual, formato YYYY-MM-DD)
   - dateTo: string (default: hoje, formato YYYY-MM-DD)
3. Computar convenioId do useAuthStore
4. Retornar:
   - report: FinancialReport | undefined
   - isLoading, isError
   - refetch
   - dateFrom, dateTo
   - handleDateFrom, handleDateTo, handleResetDates
   - staleTime: 5 * 60_000 (5 min)

Validacao:
- Hook retorna relatorio com filtros de data
- Reset volta para mes corrente
```

### Fase E — Componentes Financeiros

**Tarefa E.1 — KPIs Financeiros**
```
Criar frontend/features/financial/financial-kpis.tsx:

Props:
- report: FinancialReport | undefined
- isLoading: boolean

KPI cards (usando KpiCard do patterns/):
1. Receita Bruta — total_revenue formatado como BRL
2. Reembolsos — total_refunds (cor vermelha quando > 0)
3. Receita Liquida — net_revenue formatado BRL
4. Total de Transacoes — transaction_count
5. Ticket Medio — average_ticket

Loading: SkeletonTable ou skeleton de cards

Validacao:
- 5 cards renderizam com dados do relatorio
- Loading state com skeleton
```

**Tarefa E.2 — Grafico de Receita por Periodo**
```
Criar frontend/features/financial/revenue-by-period-chart.tsx:

Props:
- data: { [key: string]: any }[]
- isLoading: boolean

Implementacao:
- Recharts LineChart ou AreaChart
- Assumir que cada item tem: { period: string, revenue: number, count: number }
- Linha de receita (eixo Y esquerdo) + linha de quantidade (eixo Y direito)
- Tooltip customizado com valores BRL
- Loading: skeleton retangular

Nota: Se data vier vazio, mostrar EmptyStateBlock no lugar do grafico

Validacao:
- Grafico renderiza com dados
- Estado vazio claro
```

**Tarefa E.3 — Breakdown por Metodo de Pagamento**
```
Criar frontend/features/financial/payment-method-breakdown.tsx:

Props:
- data: { [key: string]: any }[]
- isLoading: boolean

Implementacao:
- Lista de linhas: metodo de pagamento + valor + percentual
- PIX / Cartao de Credito / Cartao de Debito
- Usar CurrencyText do DS para valores
- Loading: skeleton de lista

Validacao:
- Renderiza breakdown por metodo
- Trata dados vazios
```

**Tarefa E.4 — Exportacao CSV**
```
Criar frontend/features/financial/financial-export-button.tsx:

Props:
- dateFrom: string
- dateTo: string

Implementacao:
- Botao "Exportar CSV" com icone DownloadIcon de @/lib/icons
- Ao clicar: chamar useExportConvenioAppointments
- Em sucesso: trigger download do arquivo CSV
- Loading state no botao
- Toast de sucesso/erro

Validacao:
- Botao dispara download do CSV
- Loading enquanto exporta
- Erro mapeado para toast
```

**Tarefa E.5 — Pagina Financeira (orquestrador)**
```
Criar frontend/features/financial/financial-page-content.tsx:

Layout:
1. Header com titulo "Financeiro" + descricao + DateRangeFilter + ExportButton
2. FinancialKpis (row de 5 cards)
3. Grid 2 colunas:
   - Col esquerda (2/3): RevenuByPeriodChart
   - Col direita (1/3): PaymentMethodBreakdown
4. Secao "Top Servicos" (se top_services disponivel):
   - Tabela simples: nome servico | quantidade | receita

Estados de erro:
- ErrorStateBlock se isError

Validacao:
- Pagina carrega relatorio real
- Filtros de data funcionam e atualizam relatorio
- Export CSV funciona
```

**Tarefa E.6 — Conectar page.tsx Financeiro**
```
Atualizar frontend/app/(convenio)/convenio/financial/page.tsx:

1. Remover PagePlaceholder
2. Adicionar export const dynamic = 'force-dynamic'
3. Importar FinancialPageContent
4. Manter metadata

Validacao:
- /convenio/financial carrega sem placeholder
- Dados reais aparecem
```

---

## PARTE 4 — PAGINA DE CONFIGURACOES DO CONVENIO

### Fase F — Hooks de Settings

**Tarefa F.1 — Hook de configuracoes do convenio**
```
Criar frontend/hooks/settings/use-convenio-settings.ts:

1. Importar useGetConvenioById + usePatchConvenioSettings de @api/hooks/useConvenio
2. Computar convenioId do useAuthStore
3. Retornar:
   - convenio: Convenio | undefined
   - isLoading, isError, refetch
   - patchSettings(data: PatchedConvenioRequest): Promise<void>
   - isPatching

4. Mutation:
   - onSuccess: toast.success('Configuracoes salvas!') + invalidar query do convenio
   - onError: toast.error(getApiError(error, 'Erro ao salvar configuracoes.'))

Validacao:
- Hook carrega convenio atual
- Patch atualiza e invalida cache
```

### Fase G — Componentes de Settings

**Tarefa G.1 — Formulario de Informacoes do Convenio**
```
Criar frontend/features/settings/convenio-info-form.tsx:

Props:
- convenio: Convenio
- onSubmit: (data: PatchedConvenioRequest) => Promise<void>
- isSubmitting: boolean

Campos (React Hook Form + Zod schema do kubb):
- Nome do convenio (obrigatorio)
- Email de contato
- Telefone de contato
- Descricao (textarea)
- Endereco: rua, cidade, estado, CEP

Layout:
- Card com header "Informacoes do Convenio"
- Grid 2 colunas para campos menores
- textarea para descricao (largura total)
- Botao "Salvar Alteracoes" com loading state

Validacao:
- Formulario pre-preenchido com dados atuais
- Validacao Zod nos campos
- Submit com loading state
```

**Tarefa G.2 — Secao de Politica de Cancelamento**
```
Criar frontend/features/settings/cancellation-policy-section.tsx:

Props:
- settings: Record<string, any> (do campo convenio.settings)
- onSave: (data: Partial<PatchedConvenioRequest>) => Promise<void>
- isSubmitting: boolean

Campos de configuracao:
- Prazo minimo de cancelamento (em horas): number input
- Percentual de reembolso por cancelamento antecipado: number (0-100)
- Aceitar cancelamento pelo paciente: switch (boolean)
- Mensagem de politica de cancelamento: textarea

UI:
- Card com header "Politica de Cancelamento"
- Formulario simples com botao salvar

Nota: os dados de settings ficam em convenio.settings (JSON field)
Usar PatchedConvenioRequest com campo settings

Validacao:
- Campos pre-preenchidos
- Salvar atualiza settings do convenio
```

**Tarefa G.3 — Pagina de Configuracoes (orquestrador)**
```
Criar frontend/features/settings/settings-page-content.tsx:

Layout:
1. Page header: titulo "Configuracoes" + descricao
2. Tabs (Shadcn Tabs):
   - Tab "Informacoes Gerais" → ConvenioInfoForm
   - Tab "Politica de Cancelamento" → CancellationPolicySection

Estado:
- useConvenioSettings hook
- Loading: skeleton de formulario
- Error: ErrorStateBlock

Validacao:
- Tabs funcionam
- Dados carregam nos formularios
- Salvar mostra toast de sucesso
```

**Tarefa G.4 — Conectar page.tsx de Settings**
```
Atualizar frontend/app/(convenio)/convenio/settings/page.tsx:

1. Remover PagePlaceholder
2. Adicionar export const dynamic = 'force-dynamic'
3. Importar SettingsPageContent
4. Manter metadata

Validacao:
- /convenio/settings carrega sem placeholder
- Formularios com dados reais
```

---

## PARTE 5 — POLISH GLOBAL DA INTERFACE

### Fase H — Melhorias de UX Globais

**Tarefa H.1 — Adicionar NotificationBell no Header**
```
Melhorar frontend/components/navigation/header.tsx:

1. Adicionar icone de notificacoes com badge de contagem:
   - Importar useGetUnreadNotificationCount de @api/hooks/useNotifications
   - Se count > 0: mostrar CounterBadge sobre o icone
   - Ao clicar: abrir NotificationCenterPanel (Sheet lateral)

2. Reutilizar NotificationCenterPanel existente em components/sections/notifications/

Validacao:
- Badge mostra contagem de nao-lidas
- Panel abre com notificacoes reais
```

**Tarefa H.2 — Melhorar Sidebar com Active States**
```
Revisar frontend/components/navigation/sidebar.tsx:

1. Active state mais visivel para item selecionado:
   - Background highlight com cor primaria (opacity menor)
   - Texto em peso bold quando ativo
   - Linha vertical indicadora a esquerda (border-l-2 primary)

2. Adicionar tooltips (Tooltip Shadcn) para modo collapsed
   (preparar para eventual modo collapsed da sidebar)

3. Verificar que todos os links do convenio e owner tem icones corretos

Validacao:
- Active state visivel e claro
- Navegacao funciona sem erros
```

**Tarefa H.3 — Melhorar Dashboard do Convenio com Quick Actions**
```
Revisar frontend/features/convenios/recent-appointments.tsx
e frontend/components/sections/convenio/convenio-dashboard-overview.tsx:

1. Adicionar acoes rapidas (Quick Actions card):
   - "Ver agendamentos de hoje" → link para /convenio/appointments com filtro de hoje
   - "Novo medico" → link para /convenio/doctors
   - "Ver relatorio" → link para /convenio/financial

2. Melhorar o componente de "agendamentos recentes" para mostrar:
   - StatusPill de cada agendamento
   - Link direto para a pagina de agendamentos

Validacao:
- Quick actions navegam corretamente
- Dashboard mais informativo
```

**Tarefa H.4 — Polish da Pagina de Medicos: Detail Drawer melhorado**
```
Revisar frontend/features/doctors/doctor-detail-drawer.tsx:

1. Adicionar secoes que podem estar faltando:
   - Rating stars (RatingStars do DS)
   - Especialidades (tags)
   - Proximo slot disponivel (se implementado no backend)
   - Link direto para agenda do medico

2. Melhorar layout geral do drawer com mais espacamento e hierarquia visual

Validacao:
- Drawer mostra informacoes mais completas
- Layout organizado em secoes
```

**Tarefa H.5 — Adicionar Breadcrumbs nas paginas**
```
Criar frontend/components/patterns/page-breadcrumb.tsx:

Props:
- items: { label: string; href?: string }[]

Implementacao:
- Usar Breadcrumb + BreadcrumbItem do Shadcn/UI
- Ultimo item sem link (pagina atual)
- Separador "/" entre itens

Adicionar breadcrumbs em todas as paginas de features:
- Ex: Painel > Agendamentos
- Ex: Painel > Medicos
- Etc.

Validacao:
- Breadcrumbs aparecem no topo das paginas
- Links funcionam corretamente
```

**Tarefa H.6 — Responsividade Mobile das Tabelas**
```
Revisar todas as tabelas (doctors, schedules, exams, appointments):

1. Em telas menores (md): ocultar colunas secundarias com hidden md:table-cell
2. Scroll horizontal em tabelas quando necessario
3. Verificar que os dialogs/sheets funcionam em mobile

Colunas a ocultar em mobile:
- Doctors: ocultar CRM e datas, manter nome + especialidade + status + acoes
- Exams: ocultar descricao, manter nome + preco + status + acoes
- Appointments: ocultar duracao, manter data + medico + status + acoes

Validacao:
- Tabelas usaveis em telas de 768px
- Dialogs/sheets nao transbordam a tela
```

---

## PARTE 6 — QUALITY GATES E FECHAMENTO

**Tarefa Q.1 — Atualizar exports dos novos componentes**
```
Garantir que todos os novos componentes estao exportados nos index.ts:

1. frontend/components/ds/index.ts:
   - Adicionar AppointmentTypeBadge

2. frontend/components/patterns/index.ts:
   - Adicionar DateRangeFilter
   - Adicionar ActionConfirmationDialog
   - Adicionar DetailInfoRow
   - Adicionar TablePagination
   - Adicionar PageBreadcrumb

Validacao:
- Imports via index.ts funcionam para todos os novos componentes
```

**Tarefa Q.2 — Quality Gates finais**
```
Executar todos os gates de qualidade:

1. npm run lint (dentro de frontend/)
   - 0 errors, 0 warnings

2. npm run type-check (dentro de frontend/)
   - npx tsc --noEmit
   - 0 erros de tipo

3. npm run build (dentro de frontend/)
   - Build de producao sem erros
   - Verificar que todas as paginas placeholder foram substituidas

Gate de paginas:
[ ] /convenio/appointments — sem PagePlaceholder, dados reais
[ ] /convenio/financial — sem PagePlaceholder, relatorio real
[ ] /convenio/settings — sem PagePlaceholder, formularios reais

Gate de componentes novos:
[ ] AppointmentTypeBadge funcional
[ ] DateRangeFilter funcional
[ ] ActionConfirmationDialog funcional
[ ] DetailInfoRow funcional
[ ] TablePagination funcional
[ ] AppointmentDetailSheet funcional

Commit: "feat(frontend): complete convenio panel appointments financial settings polish"
```

---

## PARTE 7 — CHECKLIST DE ENTREGA

```
[ ] Componentes novos (Fase A)
    [ ] calendar.tsx instalado
    [ ] AppointmentTypeBadge criado e exportado
    [ ] DateRangeFilter criado e exportado
    [ ] ActionConfirmationDialog criado e exportado
    [ ] DetailInfoRow criado e exportado
    [ ] TablePagination criado e exportado

[ ] Pagina Agendamentos (Fases B + C)
    [ ] use-appointments-list.ts criado
    [ ] use-appointment-mutations.ts criado
    [ ] appointments-table.tsx criado
    [ ] appointments-toolbar.tsx criado
    [ ] appointment-detail-sheet.tsx criado
    [ ] appointment-cancel-dialog.tsx criado
    [ ] appointments-page-content.tsx criado
    [ ] /convenio/appointments sem placeholder

[ ] Pagina Financeiro (Fases D + E)
    [ ] use-convenio-financial.ts criado
    [ ] financial-kpis.tsx criado
    [ ] revenue-by-period-chart.tsx criado
    [ ] payment-method-breakdown.tsx criado
    [ ] financial-export-button.tsx criado
    [ ] financial-page-content.tsx criado
    [ ] /convenio/financial sem placeholder

[ ] Pagina Settings (Fases F + G)
    [ ] use-convenio-settings.ts criado
    [ ] convenio-info-form.tsx criado
    [ ] cancellation-policy-section.tsx criado
    [ ] settings-page-content.tsx criado
    [ ] /convenio/settings sem placeholder

[ ] Polish Global (Fase H)
    [ ] NotificationBell no header
    [ ] Active states melhorados na sidebar
    [ ] Quick actions no dashboard do convenio
    [ ] Doctor detail drawer melhorado
    [ ] Breadcrumbs em todas as paginas
    [ ] Responsividade mobile das tabelas

[ ] Quality Gates (Fase Q)
    [ ] lint: 0 errors
    [ ] type-check: 0 erros
    [ ] build: sucesso
    [ ] todas as 7 paginas do convenio sem placeholder
```

---

## METRICAS DE QUALIDADE

```
Warnings ESLint: 0
Erros TypeScript: 0
Build frontend: sucesso
Paginas convenio sem placeholder: 7/7
Paginas owner sem placeholder: 7/7 (ja existente)
Novos componentes reutilizaveis criados: 6+
Hooks novos criados: 4+
Tarefas totais: ~28
```

---

## COMANDOS DE REFERENCIA

```bash
# Instalar nova dependencia
npm install react-day-picker --prefix frontend

# Quality gates
cd frontend
npm run lint
npx tsc --noEmit
npm run build

# Verificar hooks disponiveis para agendamentos
grep -rn "useListAppointments\|useConfirmAppointment\|useCancelAppointment" shared/gen/hooks/

# Verificar tipos de agendamentos
cat shared/gen/types/AppointmentList.ts
cat shared/gen/types/Appointment.ts
cat shared/gen/types/AppointmentStatusEnum.ts

# Ver estrutura existente para referencia
cat frontend/features/doctors/doctors-page-content.tsx
cat frontend/hooks/doctors/use-doctor-mutations.ts
```

---

## TRANSICAO PARA MOBILE

Ao concluir este polish, o painel web estara com:
- **7/7 paginas do convenio** com dados reais e UX polida
- **7/7 paginas do owner** com dados reais (ja existente)
- **Design system maduro** com atoms, patterns, sections e templates
- **6+ novos componentes reutilizaveis** prontos para mobile (alguns podem ser portados)
- **Suite de contratos API consolidada** via shared/gen para reuso no mobile

**Semana Mobile:** Expo SDK 52 + React Native + TypeScript + NativeWind + Zustand + TanStack Query
Importar `@api/*` (mesmos tipos, hooks e clients do frontend, sem reescrever boilerplate).

---

*Fim do Prompt de Execucao — Polish Web Pre-Mobile*
