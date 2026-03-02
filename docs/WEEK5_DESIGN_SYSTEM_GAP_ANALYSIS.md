# HealthApp — Semana 5: Gap Analysis Design System

> Data: 2026-03-02
> Baseline: `docs/DESIGN_SYSTEM_SHADCN_WEB_MOBILE.md`
> Estado atual: Frontend Semana 5 (commit `46c4685`)

---

## 1. Estrutura de Diretórios (Nível Arquitetural)

| Estrutura DS | Status | Observação |
|---|---|---|
| `components/ui/` | ✅ Implementado | Shadcn/UI base, 18 componentes |
| `components/ds/` | ❌ Ausente | Deve conter atoms de domínio e wrappers estáveis |
| `components/patterns/` | ❌ Ausente | Deve conter moléculas compartilhadas |
| `components/sections/` | ❌ Ausente | Deve conter organismos por domínio |
| `components/templates/` | ❌ Ausente | Deve conter templates de página |
| `lib/icons.ts` | ❌ Ausente | Barrel export centralizado (instrução global CLAUDE.md) |

> **Atual:** `components/navigation/`, `components/feedback/`, `components/data-display/`, `components/charts/`, `features/`
> **Problema:** Mistura de responsabilidades; sem camadas claras DS

---

## 2. Foundation & Tokens

| Token | Status | Observação |
|---|---|---|
| Cores primárias (primary-50…950) | ✅ Implementado | globals.css `@theme` |
| Cores success/warning/danger | ✅ Implementado | globals.css `@theme` |
| Cores neutral | ✅ Implementado | globals.css `@theme` |
| **Cores de status de negócio** | ❌ Ausente | `status.pending`, `status.confirmed`, `status.inProgress`, `status.completed`, `status.cancelled`, `status.noShow` |
| Spacing sidebar/header | ✅ Implementado | `--spacing-sidebar: 280px`, `--spacing-header: 64px` |
| Border radius | ✅ Implementado | xs/sm/md/lg/xl |
| Shadows | ⚠️ Parcial | card + dropdown; faltam xs, xl, focus |
| Z-index tokens | ❌ Ausente | dropdown/sticky/overlay/modal/popover/toast/tooltip |
| Tipografia scale | ❌ Ausente | display, h1-h6, body, caption, mono |
| **Motion tokens** | ❌ Ausente | instant/fast/base/slow/slower + easing curves |
| Dark mode vars | ✅ Implementado | .dark class com todas as vars |
| `prefers-reduced-motion` | ❌ Ausente | Não aplicado globalmente |

---

## 3. Componentes Base Shadcn/UI (Nível 1)

### 3.1 Form & Input

| Componente | Status | Arquivo |
|---|---|---|
| `button` | ✅ | `components/ui/button.tsx` |
| `input` | ✅ | `components/ui/input.tsx` |
| `label` | ✅ | `components/ui/label.tsx` |
| `form` | ✅ | `components/ui/form.tsx` |
| `textarea` | ❌ Ausente | — |
| `checkbox` | ❌ Ausente | — |
| `radio-group` | ❌ Ausente | — |
| `switch` | ✅ | `components/ui/switch.tsx` |
| `select` | ✅ | `components/ui/select.tsx` |
| `combobox` | ❌ Ausente | — |
| `command` | ❌ Ausente | — |
| `slider` | ❌ Ausente | — |
| `calendar` | ❌ Ausente | — |
| `input-otp` | ❌ Ausente | — |

### 3.2 Overlays, Menus & Navegação

| Componente | Status | Arquivo |
|---|---|---|
| `dialog` | ✅ | `components/ui/dialog.tsx` |
| `alert-dialog` | ❌ Ausente | — |
| `sheet` | ✅ | `components/ui/sheet.tsx` |
| `drawer` | ❌ Ausente | — |
| `popover` | ❌ Ausente | — |
| `tooltip` | ✅ | `components/ui/tooltip.tsx` |
| `hover-card` | ❌ Ausente | — |
| `dropdown-menu` | ✅ | `components/ui/dropdown-menu.tsx` |
| `breadcrumb` | ❌ Ausente | — |

### 3.3 Data Display & Feedback

| Componente | Status | Arquivo |
|---|---|---|
| `card` | ✅ | `components/ui/card.tsx` |
| `badge` | ✅ | `components/ui/badge.tsx` |
| `avatar` | ✅ | `components/ui/avatar.tsx` |
| `table` | ✅ | `components/ui/table.tsx` |
| `skeleton` | ✅ | `components/ui/skeleton.tsx` |
| `progress` | ❌ Ausente | — |
| `alert` | ✅ | `components/ui/alert.tsx` |
| `sonner` | ⚠️ Parcial | Importado direto de `sonner`, sem wrapper shadcn |
| `separator` | ✅ | `components/ui/separator.tsx` |
| `scroll-area` | ✅ | `components/ui/scroll-area.tsx` |
| `pagination` | ❌ Ausente | — |
| `carousel` | ❌ Ausente | — |

### 3.4 Layout & Composição

| Componente | Status | Arquivo |
|---|---|---|
| `tabs` | ✅ | `components/ui/tabs.tsx` |
| `accordion` | ❌ Ausente | — |
| `collapsible` | ❌ Ausente | — |
| `toggle` | ❌ Ausente | — |
| `toggle-group` | ❌ Ausente | — |
| `sidebar` (shadcn) | ❌ Ausente | Sidebar custom em `navigation/sidebar.tsx` |

---

## 4. Atoms de Domínio (Nível 1.5)

| Átomo | Status | Arquivo |
|---|---|---|
| `StatusPill` | ❌ Ausente | — |
| `CurrencyText` | ❌ Ausente | (formatCurrency existe em lib, mas não como componente) |
| `DateTimeText` | ❌ Ausente | — |
| `CpfText`, `CnpjText`, `PhoneText` | ❌ Ausente | (formatters existem em lib) |
| `RatingStars` | ❌ Ausente | — |
| `TrendChip` | ❌ Ausente | (trend existe no KPICard, mas não como átomo) |
| `CounterBadge` | ❌ Ausente | (hard-coded "3" no header) |
| `SecureFieldHint` | ❌ Ausente | — |
| `PermissionTag` | ❌ Ausente | — |
| `SlotBadge` | ❌ Ausente | — |
| `PaymentMethodBadge` | ❌ Ausente | — |

---

## 5. Moléculas (Nível 2)

### 5.1 Formulários

| Molécula | Status |
|---|---|
| `FormFieldRow` | ❌ Ausente |
| `FormSectionCard` | ❌ Ausente |
| `PasswordField` | ❌ Ausente (lógica existe no LoginForm, não reutilizável) |
| `OtpFieldGroup` | ❌ Ausente |
| `PhoneField` | ❌ Ausente |
| `MoneyField` | ❌ Ausente |
| `DateRangeField` | ❌ Ausente |
| `AddressFieldGroup` | ❌ Ausente |
| `FormActionsBar` | ❌ Ausente |
| `FormDirtyGuardDialog` | ❌ Ausente |

### 5.2 Busca & Filtro

| Molécula | Status |
|---|---|
| `SearchFieldDebounced` | ❌ Ausente |
| `FilterChip` | ❌ Ausente |
| `FilterChipGroup` | ❌ Ausente |
| `QuickFilterBar` | ❌ Ausente |
| `DateRangeFilter` | ❌ Ausente |
| `StatusFilter` | ❌ Ausente |

### 5.3 Feedback & Estado

| Molécula | Status | Observação |
|---|---|---|
| `InlineValidationMessage` | ⚠️ Parcial | Via FormMessage do shadcn |
| `EmptyStateBlock` | ⚠️ Parcial | `components/feedback/empty-state.tsx` (local errado) |
| `ErrorStateBlock` | ⚠️ Parcial | `components/feedback/error-state.tsx` (local errado) |
| `SkeletonList` | ❌ Ausente | — |
| `SkeletonTable` | ❌ Ausente | — |
| `LoadingOverlay` | ❌ Ausente | — |
| `SuccessBanner` | ❌ Ausente | — |
| `MaintenanceBanner` | ❌ Ausente | — |

### 5.4 Dados & Interação

| Molécula | Status | Observação |
|---|---|---|
| `KpiCard` | ⚠️ Parcial | `components/data-display/kpi-card.tsx` (local errado) |
| `KpiGrid` | ❌ Ausente | — |
| `MetricDelta` / `TrendChip` | ❌ Ausente | — |
| `DataTableToolbar` | ❌ Ausente | — |
| `TableColumnVisibilityMenu` | ❌ Ausente | — |
| `TableRowActions` | ❌ Ausente | — |
| `BulkActionsBar` | ❌ Ausente | — |
| `PaginationFooter` | ❌ Ausente | — |
| `AuditLogItem` | ❌ Ausente | — |

---

## 6. Organismos (Nível 3)

### 6.1 Auth & Segurança

| Organismo | Status | Observação |
|---|---|---|
| `AuthShell` | ⚠️ Parcial | `app/(auth)/layout.tsx` (não é componente reutilizável) |
| `LoginForm` | ✅ | `features/auth/login-form.tsx` (local errado para DS) |
| `ForgotPasswordForm` | ❌ Placeholder | — |
| `ResetPasswordForm` | ❌ Placeholder | — |
| `EmailVerificationPanel` | ❌ Ausente | — |
| `TwoFactorVerifyForm` | ❌ Ausente | — |
| `SessionExpiredDialog` | ❌ Ausente | — |

### 6.2 Navegação & Shell

| Organismo | Status | Observação |
|---|---|---|
| `AppShellWeb` | ❌ Ausente | Layout em `(convenio)/layout.tsx` + `(owner)/layout.tsx` |
| `TopHeader` | ⚠️ Parcial | `components/navigation/header.tsx` (local errado) |
| `SidebarNav` | ⚠️ Parcial | `components/navigation/sidebar.tsx` (local errado) |
| `UserMenu` | ⚠️ Parcial | Dentro do Header (não extraído) |
| `NotificationsBell` | ⚠️ Parcial | Hard-coded "3", sem lógica real |
| `GlobalCommandPalette` | ❌ Ausente | — |

### 6.3 Agenda & Agendamento

| Organismo | Status |
|---|---|
| `DoctorSearchHeader` | ❌ Ausente |
| `DoctorListGrid` | ❌ Ausente |
| `DoctorCard` | ❌ Ausente |
| `SlotPickerGrid` | ❌ Ausente |
| `BookingSummaryCard` | ❌ Ausente |
| `AppointmentCard` | ❌ Ausente |
| `AppointmentDetailsPanel` | ❌ Ausente |
| `CancelAppointmentDialog` | ❌ Ausente |
| `RatingModal` | ❌ Ausente |

### 6.4 Convênio (web)

| Organismo | Status | Observação |
|---|---|---|
| `ConvenioDashboardOverview` | ⚠️ Parcial | Scattered: `features/convenios/dashboard-kpis.tsx` + charts |
| `DoctorsManagementTable` | ❌ Ausente | — |
| `DoctorFormModal` | ❌ Ausente | — |
| `ExamTypesTable` | ❌ Ausente | — |
| `ConvenioFinancialDashboard` | ❌ Ausente | — |
| `ConvenioSettingsPanel` | ❌ Ausente | — |

### 6.5 Owner (web)

| Organismo | Status | Observação |
|---|---|---|
| `OwnerExecutiveDashboard` | ⚠️ Parcial | `features/owner/dashboard-kpis.tsx` + RevenueChart |
| `ConveniosGovernanceTable` | ❌ Ausente | — |
| `UsersGovernanceTable` | ❌ Ausente | — |
| `AuditLogsExplorer` | ❌ Ausente | — |
| `PlatformSettingsPanel` | ❌ Ausente | — |

### 6.6 Notificações

| Organismo | Status |
|---|---|
| `NotificationCenterPanel` | ❌ Ausente |
| `NotificationList` | ❌ Ausente |
| `NotificationItem` | ❌ Ausente |
| `UnreadCounter` | ❌ Ausente |

---

## 7. Templates (Nível 4)

| Template | Status |
|---|---|
| `DashboardTemplate` | ❌ Ausente |
| `CrudTableTemplate` | ❌ Ausente |
| `AuthTemplate` | ❌ Ausente |
| `FinancialReportTemplate` | ❌ Ausente |
| `AuditTemplate` | ❌ Ausente |
| `SettingsTemplate` | ❌ Ausente |

---

## 8. Ícones

| Item | Status | Observação |
|---|---|---|
| `lib/icons.ts` barrel export | ❌ Ausente | Instrução global CLAUDE.md obriga barrel centralizado |
| Imports diretos de `lucide-react` | ❌ Violação | Todos os arquivos importam diretamente |

---

## 9. Outros Problemas

| Problema | Severidade | Arquivo |
|---|---|---|
| `features/` não é estrutura DS | Média | Todo `features/` |
| Import direto de lucide-react | Alta | Todos arquivos com ícones |
| `CounterBadge` hard-coded como "3" | Média | `header.tsx` |
| Sem motion tokens em globals.css | Média | `globals.css` |
| Sem status colors (`status.*`) | Alta | `globals.css` |
| `proxy.ts` não é reconhecido pelo Next.js como middleware | Alta | `proxy.ts` → deve chamar `middleware.ts` |
| `types/api-test.ts` arquivo de teste em produção | Baixa | `types/api-test.ts` |

---

## 10. Resumo de Aderência (por nível)

| Nível | Aderência | Comentário |
|---|---|---|
| Foundation (tokens) | 55% | Cores OK, faltam motion/z-index/status |
| Atoms base (shadcn) | 52% | 18/34 componentes shadcn necessários |
| Atoms de domínio (DS) | 0% | Nenhum dos 11 atoms existe |
| Moléculas | 12% | 3/25 parcialmente implementados |
| Organismos | 22% | 6/27 parcialmente implementados |
| Templates | 0% | Nenhum dos 6 templates existe |
| Barrel de ícones | 0% | `lib/icons.ts` ausente |
| **Aderência global** | **~24%** | Estrutura funcional mas sem DS formal |

---

## 11. Plano de Migração Incremental (sem quebra)

### Fase A — Foundation (não quebra nada)
1. Adicionar motion tokens, status colors, z-index ao `globals.css`
2. Criar `lib/icons.ts` com barrel export
3. Instalar shadcn components faltantes

### Fase B — DS Atoms & Patterns (adições puras)
1. Criar `components/ds/` com atoms de domínio
2. Criar `components/patterns/` com moléculas
3. Criar barrel exports (`index.ts`) por diretório

### Fase C — Sections & Templates (migração com compat)
1. Criar `components/sections/` com organismos
2. Migrar `features/` para `components/sections/` mantendo re-exports em `features/`
3. Criar `components/templates/` com templates
4. Criar `components/sections/app-shell-web.tsx` (extraído dos layouts)

### Fase D — Atualização de páginas
1. Layouts usar `AppShellWeb`
2. Dashboards usar `DashboardTemplate`
3. Pages usar componentes DS padronizados

### Fase E — Limpeza & Validação
1. Atualizar imports de ícones para `@/lib/icons`
2. Remover `types/api-test.ts`
3. Renomear `proxy.ts` → `middleware.ts` (se não quebrar)
4. Rodar lint/type-check/build
