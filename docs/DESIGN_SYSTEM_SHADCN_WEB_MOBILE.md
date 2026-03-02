# HealthApp - Design System 100% (Web + Mobile) com shadcn

Data: 2026-03-02  
Baseado em: `PLANO_COMPLETO.md`, `docs/HIERARQUIA_COMPONENTES_FRONTEND.md`, `frontend/CLAUDE.md`

## 1. Objetivo

Definir um catalogo unico de atoms, elementos, componentes, secoes e templates para cobrir 100% das interfaces do HealthApp:

- Web: painel Convenio + painel Owner + auth.
- Mobile: onboarding, busca, agendamento, pagamento, notificacoes, perfil.
- Estados completos: loading, erro, vazio, sucesso, manutencao, permissoes e LGPD.

## 2. Premissas Tecnicas

- Web: `shadcn/ui` (Next.js 16 + Tailwind v4 + React 19.2).
- Mobile: abordagem shadcn-style com API equivalente (ex.: `react-native-reusables` + NativeWind + Reanimated), mantendo os mesmos nomes de componentes e variantes sempre que possivel.
- Tokens e contratos visuais unificados entre web e mobile.
- Kubb como fonte unica para tipos/contratos de dados (`@api/*`), sem duplicacao de schema.

## 3. Arquitetura Recomendada do Design System

```txt
packages/
  design-tokens/
    tokens.css              # cores, tipografia, espacamento, radius, shadow, z-index
    motion-tokens.ts        # duracao, easing, curvas e presets de transicao
    semantic-map.ts         # mapeamento dominio -> token semantico

frontend/src/
  components/
    ui/                     # componentes shadcn base (copiados via CLI)
    ds/                     # wrappers estaveis do produto (Button, DataTable, FormField)
    patterns/               # moleculas e organismos compartilhados
    sections/               # secoes por dominio (convenio/owner/auth)

mobile/src/
  components/
    ui/                     # componentes shadcn-style mobile
    ds/                     # wrappers estaveis do produto
    patterns/               # moleculas e organismos compartilhados
    sections/               # secoes mobile por dominio
```

## 4. Foundation Atoms (Nivel 0)

### 4.1 Design Tokens obrigatorios

- Cores semanticas:
`background`, `foreground`, `card`, `muted`, `primary`, `secondary`, `accent`, `destructive`, `warning`, `success`, `info`, `border`, `input`, `ring`.
- Cores de status de negocio:
`status.pending`, `status.confirmed`, `status.inProgress`, `status.completed`, `status.cancelled`, `status.noShow`, `status.refunded`, `status.failed`.
- Escala de espacamento:
`0, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 32`.
- Border radius:
`xs, sm, md, lg, xl, 2xl, full`.
- Sombras:
`xs, sm, md, lg, xl, focus`.
- Z-index:
`base, dropdown, sticky, overlay, modal, popover, toast, tooltip`.
- Tipografia:
`display`, `h1-h6`, `title`, `body`, `caption`, `mono`.
- Densidade:
`comfortable`, `compact` (web tabelas e filtros).
- Breakpoints:
`mobile, tablet, desktop, wide`.

### 4.2 Motion tokens obrigatorios

- Duracoes:
`instant(80ms)`, `fast(140ms)`, `base(200ms)`, `slow(280ms)`, `slower(360ms)`.
- Easing:
`standard`, `decelerate`, `accelerate`, `emphasized`.
- Presets:
`fade-in`, `fade-out`, `slide-up`, `slide-down`, `scale-in`, `scale-out`, `accordion-open`, `accordion-close`, `toast-in`, `toast-out`, `page-enter`, `page-exit`, `stagger-list`.

### 4.3 Atoms de comportamento

- Focus ring padrao e visivel.
- Target minimo de toque (mobile) >= 44px.
- Estados: `default`, `hover`, `focus`, `active`, `disabled`, `loading`, `invalid`, `success`.
- `prefers-reduced-motion` aplicado em todos os efeitos.

## 5. Catalogo de Componentes Base (Nivel 1) - shadcn + equivalentes mobile

## 5.1 Form e Input

| Elemento | Web (shadcn) | Mobile (equivalente) | Uso no HealthApp |
|---|---|---|---|
| Botao | `button` | `button` | Acoes primarias e secundarias |
| Grupo de botoes | `button-group` | `button-group` | Acoes em toolbar, split action |
| Input texto | `input` | `input` | Login, busca, cadastro |
| Input com adornos | `input-group` | `input-group` | Busca, filtros, senha |
| Label | `label` | `label` | Formularios acessiveis |
| Field wrapper | `field` | `field` | Label + hint + erro padronizado |
| Textarea | `textarea` | `textarea` | Notas e observacoes |
| Checkbox | `checkbox` | `checkbox` | Consentimentos, filtros |
| Radio group | `radio-group` | `radio-group` | Metodo de pagamento |
| Switch | `switch` | `switch` | Settings e toggles globais |
| Select | `select` | `select` | Especialidade, status, periodo |
| Native Select | `native-select` | `native-select` | Fallback mobile leve |
| Combobox | `combobox` | `combobox` | Busca com sugestao |
| Command | `command` | `command` | Command palette e quick search |
| Input OTP | `input-otp` | `input-otp` | Verificacao email/SMS/2FA |
| Slider | `slider` | `slider` | Faixa de preco e filtros |
| Calendar | `calendar` | `calendar` | Seletores de data |
| Form integration | `form` | `form` | RHF + Zod unificado |

## 5.2 Overlays, menus e navegacao contextual

| Elemento | Web (shadcn) | Mobile (equivalente) | Uso no HealthApp |
|---|---|---|---|
| Dialog | `dialog` | `dialog` | Criar/editar entidades |
| Alert Dialog | `alert-dialog` | `alert-dialog` | Confirmacoes destrutivas |
| Sheet | `sheet` | `sheet` | Side panel e quick actions |
| Drawer | `drawer` | `drawer` | Filtros mobile e detalhes |
| Popover | `popover` | `popover` | Datepicker, menu contextual |
| Tooltip | `tooltip` | `tooltip` | Dica curta em desktop/mobile long-press |
| Hover Card | `hover-card` | `hover-card` | Preview medico/usuario |
| Dropdown Menu | `dropdown-menu` | `dropdown-menu` | Menu de linha/tabela |
| Context Menu | `context-menu` | `context-menu` | Acoes avancadas |
| Menubar | `menubar` | `menubar` | Ferramentas owner desktop |
| Navigation Menu | `navigation-menu` | adaptado | Navegacao secundaria |
| Breadcrumb | `breadcrumb` | adaptado | Trilhas nos paineis web |

## 5.3 Data display e feedback

| Elemento | Web (shadcn) | Mobile (equivalente) | Uso no HealthApp |
|---|---|---|---|
| Card | `card` | `card` | Containers de resumo |
| Badge | `badge` | `badge` | Status e categorias |
| Avatar | `avatar` | `avatar` | Medicos/usuarios |
| Table | `table` | lista virtualizada | Listagens admin |
| Pagination | `pagination` | paginacao infinita | Tabelas web e listas mobile |
| Skeleton | `skeleton` | `skeleton` | Loading visual |
| Progress | `progress` | `progress` | Upload/processamento |
| Alert | `alert` | `alert` | Mensagens de erro/sucesso |
| Sonner | `sonner` | toast equivalente | Toast global |
| Spinner | `spinner` | `spinner` | Loading pontual |
| Empty state | `empty` | `empty` | Sem resultados/dados |
| Item | `item` | `item` | Linha/card reutilizavel |
| Kbd | `kbd` | opcional | Atalhos no web |
| Separator | `separator` | `separator` | Divisao visual |
| Scroll Area | `scroll-area` | scroll container | Areas com scroll controlado |
| Aspect Ratio | `aspect-ratio` | `aspect-ratio` | Midia e cards responsivos |
| Carousel | `carousel` | pager/carousel | Onboarding e banners |

## 5.4 Layout e composicao estrutural

| Elemento | Web (shadcn) | Mobile (equivalente) | Uso no HealthApp |
|---|---|---|---|
| Accordion | `accordion` | `accordion` | FAQ, blocos expansivos |
| Collapsible | `collapsible` | `collapsible` | Filtros e secoes compactas |
| Tabs | `tabs` | `tabs` | Historico/proximos, secoes |
| Toggle | `toggle` | `toggle` | Preferencias binarias |
| Toggle Group | `toggle-group` | `toggle-group` | Filtros segmentados |
| Resizable | `resizable` | n/a | Painel owner desktop avancado |
| Sidebar | `sidebar` | nav bottom/drawer | Shell principal web/mobile |

## 6. Atoms e Elementos de Dominio (Nivel 1.5)

Componentes atomicos customizados que o produto precisa alem dos primitives:

- `StatusPill` (status de agendamento/pagamento).
- `CurrencyText` (BRL padrao).
- `DateTimeText` (timezone-safe).
- `CpfText`, `CnpjText`, `PhoneText` mascarados.
- `RatingStars` e `RatingValue`.
- `TrendChip` (+/- percentual KPI).
- `CounterBadge` (nao lidos).
- `SecureFieldHint` (seguranca/2FA/LGPD).
- `PermissionTag` (role patient/doctor/admin/owner).
- `SlotBadge` (livre, lotado, popular, ultimas vagas).
- `PaymentMethodBadge` (PIX, cartao).

## 7. Moleculas compartilhadas (Nivel 2)

## 7.1 Formularios

- `FormFieldRow`
- `FormSectionCard`
- `PasswordField`
- `OtpFieldGroup`
- `PhoneField`
- `CpfField`
- `CnpjField`
- `MoneyField`
- `PercentField`
- `DateRangeField`
- `TimeRangeField`
- `AddressFieldGroup`
- `FormActionsBar`
- `FormDirtyGuardDialog`

## 7.2 Busca e filtro

- `SearchFieldDebounced`
- `FilterChip`
- `FilterChipGroup`
- `QuickFilterBar`
- `SavedFilterMenu`
- `DateRangeFilter`
- `StatusFilter`
- `RoleFilter`
- `PriceRangeFilter`
- `SpecialtyFilter`

## 7.3 Feedback e estado

- `InlineValidationMessage`
- `FieldHelpText`
- `EmptyStateBlock`
- `ErrorStateBlock`
- `RetryBlock`
- `SkeletonList`
- `SkeletonTable`
- `LoadingOverlay`
- `SuccessBanner`
- `MaintenanceBanner`

## 7.4 Dados e interacao

- `KpiCard`
- `KpiGrid`
- `MetricDelta`
- `DataTableToolbar`
- `TableColumnVisibilityMenu`
- `TableRowActions`
- `BulkActionsBar`
- `PaginationFooter`
- `TimelineItem`
- `AuditLogItem`

## 8. Organismos por dominio (Nivel 3)

## 8.1 Auth e seguranca

- `AuthShell`
- `LoginForm`
- `RegisterForm`
- `ForgotPasswordForm`
- `ResetPasswordForm`
- `EmailVerificationPanel`
- `PhoneVerificationPanel`
- `TwoFactorSetupPanel`
- `TwoFactorVerifyForm`
- `SessionExpiredDialog`

## 8.2 Navegacao e shell

- `AppShellWeb`
- `AppShellMobile`
- `TopHeader`
- `SidebarNav`
- `BottomTabNav`
- `UserMenu`
- `NotificationsBell`
- `GlobalCommandPalette`
- `RoleSwitcher` (owner scope)

## 8.3 Agenda e agendamento

- `DoctorSearchHeader`
- `DoctorListGrid`
- `DoctorCard`
- `DoctorProfileHeader`
- `DoctorAvailabilityCalendar`
- `SlotPickerGrid`
- `BookingSummaryCard`
- `AppointmentStatusTimeline`
- `AppointmentCard`
- `AppointmentDetailsPanel`
- `CancelAppointmentDialog`
- `RatingModal`

## 8.4 Convenio (web)

- `ConvenioDashboardOverview`
- `DoctorsManagementTable`
- `DoctorFormModal`
- `SchedulesCalendarEditor`
- `ScheduleExceptionModal`
- `ExamTypesTable`
- `ExamTypeFormModal`
- `PriceTableEditor`
- `AppointmentsManagementTable`
- `AppointmentActionPanel`
- `ConvenioFinancialDashboard`
- `ConvenioSettingsPanel`

## 8.5 Owner (web)

- `OwnerExecutiveDashboard`
- `ConveniosGovernanceTable`
- `ConvenioDetailsDrawer`
- `UsersGovernanceTable`
- `UserDetailsDrawer`
- `GlobalFinancialDashboard`
- `RevenueByConvenioChart`
- `PaymentMethodBreakdownChart`
- `AnalyticsCohortPanel`
- `AuditLogsExplorer`
- `PlatformSettingsPanel`
- `MaintenanceModePanel`

## 8.6 Pagamentos

- `PaymentMethodSelector`
- `CreditCardPaymentPanel`
- `PixPaymentPanel`
- `PixQrCard`
- `PaymentStatusTimeline`
- `PaymentReceiptCard`
- `RefundRequestDialog`
- `RefundHistoryTable`

## 8.7 Notificacoes

- `NotificationCenterPanel`
- `NotificationList`
- `NotificationItem`
- `NotificationFilters`
- `UnreadCounter`
- `NotificationPreferencesPanel`

## 8.8 LGPD e compliance

- `ConsentManagementPanel`
- `ConsentHistoryTimeline`
- `DataExportRequestPanel`
- `DeleteAccountFlow`
- `AuditLogDiffViewer`
- `SensitiveDataMaskToggle`

## 9. Templates de pagina (Nivel 4)

## 9.1 Web templates

- `DashboardTemplate`
- `CrudTableTemplate`
- `CalendarManagementTemplate`
- `FinancialReportTemplate`
- `AnalyticsTemplate`
- `AuditTemplate`
- `SettingsTemplate`
- `AuthTemplate`

## 9.2 Mobile templates

- `OnboardingTemplate`
- `HomeTemplate`
- `SearchTemplate`
- `DoctorProfileTemplate`
- `SlotSelectionTemplate`
- `CheckoutTemplate`
- `ReceiptTemplate`
- `AppointmentsTemplate`
- `NotificationsTemplate`
- `ProfileSettingsTemplate`

## 10. Mapeamento de cobertura por funcionalidade (100%)

| Fluxo / Tela | Componentes obrigatorios |
|---|---|
| Login/Registro/OTP/2FA | Input, PasswordField, InputOTP, Button, Alert, Sonner, AuthShell |
| Busca de medicos | SearchFieldDebounced, FilterBar, DoctorCard, Pagination, EmptyState |
| Perfil medico | Avatar, RatingStars, Tabs, Card, DoctorProfileHeader |
| Selecao de horario | Calendar, SlotPickerGrid, StatusPill, Tooltip |
| Confirmacao + pagamento | BookingSummaryCard, PaymentMethodSelector, PixQrCard, CreditCardPaymentPanel |
| Comprovante | ReceiptTemplate, SuccessBanner, Share actions |
| Meus agendamentos | Tabs, AppointmentCard, StatusPill, Cancel dialog |
| Notificacoes | NotificationCenterPanel, NotificationItem, CounterBadge |
| Avaliacao | RatingModal, Textarea, Button |
| Dashboard convenio | KpiGrid, Charts, DataTable, Filters |
| CRUD medicos/agendas/exames | CrudTableTemplate, FormModal, ConfirmDialog |
| Financeiro convenio/owner | FinancialReportTemplate, charts, tables, export modal |
| Owner governanca | ConveniosGovernanceTable, UsersGovernanceTable, drawers |
| Logs auditoria | AuditTemplate, AuditLogItem, DateRangeFilter |
| Configuracoes globais | SettingsTemplate, Switch, Slider/inputs numericos |
| LGPD | Consent panel, export/delete flow, mask toggle |
| Manutencao | MaintenanceBanner + full-page maintenance state |

## 11. Sistema de Animacoes (Web + Mobile)

## 11.1 Web (shadcn + Tailwind v4 + tw-animate-css)

- Usar `@import "tw-animate-css"` em `globals.css`.
- Padroes:
`animate-in`, `animate-out`, `fade-in`, `fade-out`, `zoom-in`, `zoom-out`, `slide-in-from-*`, `slide-out-to-*`.
- Aplicacoes:
  - Dialog/Sheet/Popover: `data-[state=open]:animate-in` e `data-[state=closed]:animate-out`.
  - Accordion/Collapsible: animacao de altura com classe utilitaria.
  - Toasts: entrada por edge + fade.
  - Tabelas/listas: `stagger-list` para primeira renderizacao.
  - Mudanca de rota: transicao de pagina (`page-enter/page-exit`), evitando animacao longa.

## 11.2 Mobile (Reanimated)

- Presets equivalentes aos motion tokens do web.
- Gestos:
  - `press scale` em botoes/cards.
  - `swipe actions` em itens de notificacao/agendamento.
  - `bottom sheet spring`.
- Listas:
  - entrada com stagger curto e sem jank.
- Transicoes de navegacao:
  - stack com spring leve para detalhes.
- Sempre respeitar reduce motion do SO.

## 11.3 Regras de animacao para performance

- Nao animar propriedades que forcam layout frequente quando houver alternativa.
- Priorizar `opacity` e `transform`.
- Limitar duracao max de microinteracoes a 280ms.
- Evitar animacoes concorrentes em dashboards com grafico pesado.

## 12. Uso otimizado no projeto inteiro

## 12.1 Estrategia de composicao

- `components/ui/*`: codigo vindo do CLI shadcn.
- `components/ds/*`: wrappers estaveis de produto (API unica para web/mobile).
- `components/patterns/*`: combinacoes de negocio reutilizaveis.
- Nao consumir `ui/*` direto em telas de negocio complexas; usar `ds/*` e `patterns/*`.

## 12.2 Estrategia de adocao por fases

1. Foundation tokens + shell + feedback states.
2. Auth e seguranca.
3. DataTable/filter/modal stack para paineis.
4. Agenda/agendamento/pagamento.
5. Owner analytics/auditoria/LGPD.
6. Mobile parity e refinamento de animacoes.

## 12.3 Performance e manutencao

- Dynamic import para modais, charts e drawers pesados.
- Virtualizacao em tabelas/listas grandes.
- Cache de dados com TanStack Query e chaves por dominio.
- Memoizacao em cards/list items com alta frequencia de render.
- Evitar variantes ad-hoc; centralizar via CVA.
- Garantir acessibilidade: foco, labels, contraste, teclado, screen reader.

## 12.4 Contratos de tipos e formularios

- Tipos de API apenas de `@api/types/*`.
- Validacao de formulario com `@api/zod/*`.
- RHF como camada padrao de estado de formulario.

## 13. Lista minima de componentes para instalar/adicionar primeiro

## 13.1 Web (`shadcn`)

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input input-group label field textarea checkbox radio-group switch select native-select combobox command input-otp form
pnpm dlx shadcn@latest add card badge avatar table pagination skeleton progress alert sonner spinner empty item separator scroll-area
pnpm dlx shadcn@latest add dialog alert-dialog sheet drawer popover tooltip hover-card dropdown-menu context-menu menubar navigation-menu breadcrumb
pnpm dlx shadcn@latest add accordion collapsible tabs toggle toggle-group sidebar calendar
pnpm dlx shadcn@latest add chart resizable carousel
```

## 13.2 Mobile (shadcn-style)

```bash
# Inferencia pratica para manter paridade de API com shadcn no mobile
npx @react-native-reusables/cli@latest init
npx @react-native-reusables/cli@latest add button input textarea checkbox radio-group switch select dialog sheet drawer popover tooltip card badge avatar tabs accordion collapsible progress skeleton toast
```

## 14. Definition of Done do Design System (checklist)

- 100% das telas do plano usam apenas componentes do DS.
- Todos os estados de UI possuem versao padrao (loading, empty, error, success).
- Web e mobile compartilham tokens semanticos iguais.
- Todos os formularios usam RHF + Zod de `@api/*`.
- Todas as tabelas/listas grandes suportam paginacao/virtualizacao.
- Todas as interacoes criticas tem feedback visual e acessivel.
- Todas as animacoes respeitam reduce motion e limites de performance.

## 15. Referencias

- shadcn installation: https://ui.shadcn.com/docs/installation
- shadcn next install: https://ui.shadcn.com/docs/installation/next
- shadcn manual dependencies (`tw-animate-css`): https://ui.shadcn.com/docs/installation/manual
- shadcn dark mode (`next-themes`): https://ui.shadcn.com/docs/dark-mode/next
- shadcn tailwind v4 + animacao guidance: https://ui.shadcn.com/docs/tailwind-v4
- shadcn CLI: https://ui.shadcn.com/docs/cli
- React Labs (Activity + ViewTransition): https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more
- Mobile shadcn-style base (inferencia tecnica para paridade): https://github.com/founded-labs/react-native-reusables

