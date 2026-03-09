# HealthApp - Hierarquia de Componentes Frontend (Semana 5+)

Data: 2026-03-02  
Escopo: Painel Web Next.js (Convênio + Owner), pronto para consumir `shared/gen/*`.

## 1) Arquitetura de pastas proposta

```txt
frontend/src/
  app/
    (auth)/
    (convenio)/
    (owner)/
  components/
    primitives/        # atomos visuais base (sem regra de negocio)
    forms/             # campos compostos + layouts de formulario
    feedback/          # loading/error/empty/toast/banner
    overlays/          # modal/drawer/popover/command-palette
    data-display/      # cards, stats, tabelas, badges, timelines
    navigation/        # sidebar/header/breadcrumb/tabs
    sections/          # blocos de pagina por dominio
    charts/            # wrappers Recharts
  features/
    auth/
    doctors/
    appointments/
    payments/
    convenios/
    owner/
    notifications/
    settings/
  hooks/
  stores/
  lib/
  types/
```

## 2) Nível 0 - Foundation

- `theme.css` (tokens): cores, spacing, radius, shadows, typography.
- `motion.ts`: presets de animacao (page enter, stagger list, modal enter/exit).
- `icons.ts`: mapeamento central de icones sem duplicacao.
- `formatters.ts`: moeda BRL, data/hora, CPF/CNPJ mascarado.

## 3) Nível 1 - Primitives (Atomos)

- Entrada: `TextInput`, `MaskedInput`, `Select`, `MultiSelect`, `DateInput`, `TimeInput`, `Textarea`, `Switch`, `Checkbox`, `RadioGroup`.
- Acao: `Button`, `IconButton`, `SplitButton`, `LinkButton`.
- Estado: `Badge`, `StatusPill`, `ProgressBar`, `Avatar`.
- Estrutura: `Card`, `Separator`, `Tooltip`, `PopoverAnchor`.
- Tabela base: `Table`, `Th`, `Td`, `SortableHeader`, `RowActions`.

## 4) Nível 2 - Moleculas

- Formularios:
  - `FieldWrapper` (label, hint, error).
  - `SearchField` (input + debounce + clear).
  - `MoneyField`, `PhoneField`, `CpfField`, `CnpjField`.
  - `FormActionsBar` (salvar/cancelar/reset).
- Filtros:
  - `FilterChip`, `FilterBar`, `DateRangeFilter`, `QuickFilterGroup`.
- Feedback:
  - `InlineError`, `InlineSuccess`, `SkeletonBlock`, `EmptyState`.
- Acoes em lote:
  - `BulkActionsBar`, `SelectionCounter`.

## 5) Nível 3 - Organismos

- Navegacao:
  - `AppSidebar`, `TopHeader`, `UserMenu`, `NotificationsBell`, `Breadcrumbs`.
- Dados:
  - `KpiCard`, `KpiGrid`, `DataTable`, `PaginationControls`, `AuditTimeline`.
- Overlays:
  - `ConfirmDialog`, `FormModal`, `DrawerDetails`, `ExportModal`.
- Agenda:
  - `CalendarWeekView`, `SlotGrid`, `ScheduleExceptionEditor`.
- Financeiro:
  - `RevenueChartCard`, `PaymentMethodBreakdown`, `RefundsTable`.
- Notificacoes:
  - `NotificationCenterPanel`, `NotificationItem`, `UnreadCounterBadge`.

## 6) Nível 4 - Seções por domínio

- `sections/auth`:
  - `LoginSection`, `ForgotPasswordSection`, `ResetPasswordSection`, `TwoFactorSection`.
- `sections/convenio`:
  - `ConvenioDashboardSection`
  - `DoctorsManagementSection`
  - `DoctorSchedulesSection`
  - `ExamTypesSection`
  - `AppointmentsSection`
  - `ConvenioFinancialSection`
  - `ConvenioSettingsSection`
- `sections/owner`:
  - `OwnerDashboardSection`
  - `ConveniosGovernanceSection`
  - `UsersGovernanceSection`
  - `OwnerFinancialSection`
  - `AuditLogsSection`
  - `PlatformSettingsSection`

## 7) Nível 5 - Templates de página

- `DashboardTemplate` (header + KPI + chart + tabela recente).
- `CrudTableTemplate` (filtros + tabela + modal de edicao).
- `SettingsTemplate` (abas + formulario + historico de alteracoes).
- `ReportTemplate` (filtros + graficos + export).

## 8) Mapeamento obrigatório de elementos

- Inputs:
  - auth: email/senha/2FA.
  - médicos: CRM, especialidade, preco, duracao, vinculo automatico com a clinica atual.
  - agenda: dia da semana, faixa horário, exceções.
  - financeiro: faixa de data, método pagamento, status.
  - settings globais: toggles `maintenance_mode`, `pix_enabled`, limites.
- Modais:
  - confirmar exclusão/suspensão/aprovação.
  - criar/editar médico.
  - criar/editar tipo de exame.
  - criar exceção de agenda.
  - confirmar reembolso.
  - exportar relatório.
- Tabelas:
  - médicos, agendamentos, pagamentos, usuários, convênios, logs de auditoria, notificações.
- Seções completas:
  - dashboards (clinica + owner), financeiro, governança, configurações, auditoria.
  - fila operacional da clinica: exibe somente consultas e exames liberados apos pagamento confirmado.

## 9) Contratos de integração com API gerada

- `features/*/api.ts` só usa `@api/clients/*` e `@api/hooks/*`.
- Validação de formulário com `@api/zod/*`.
- Tipos de domínio com `@api/types/*` sem duplicação manual.
- Chave de query padronizada por domínio (`appointments`, `payments`, `ownerSettings`, etc).

## 10) Ordem de implementação recomendada (Semana 5-8)

1. Foundation + primitives + layout shell.
2. Auth flow completo.
3. DataTable + filtros + modais genéricos.
4. Seções de dashboard (convênio e owner).
5. CRUD médicos/agendas/exames.
6. Financeiro + auditoria + settings globais.
7. Hardening UX (skeleton, empty, error, retry, acessibilidade).
