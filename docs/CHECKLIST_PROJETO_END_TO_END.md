# HealthApp - Checklist End-to-End (Semanas 1-16)

> Fonte: `PLANO_COMPLETO.md`, `CLAUDE.md`, `docs/PROMPT_EXECUCAO_SEMANA3.md`
>
> Uso: marcar cada item com `[x]` apenas apos validacao objetiva (teste, comando ou evidencia).

## 0. Baseline do Projeto

### 0.1 Ambiente e stack
- [x] Python 3.12+ (ideal 3.13) disponivel
- [x] Node.js 20.9+ disponivel
- [x] Docker e Docker Compose operacionais
- [x] PostgreSQL 16 e Redis 7.2 acessiveis em dev
- [x] Variaveis de ambiente configuradas (`backend/.env`)

### 0.2 Repositorio e qualidade
- [x] Monorepo com pastas `backend/`, `frontend/`, `mobile/`, `shared/`
- [x] CI baseline ativa (ruff + mypy + pytest)
- [x] Convencao de commits (Conventional Commits) em uso
- [x] `CLAUDE.md` raiz e por subprojeto revisados

---

## 1. Fase 1 - Backend Foundation (Semanas 1-4)

### Semana 1 - Setup e Infraestrutura
- [x] Scaffold Django 6 + DRF com settings (`base/development/staging/production`)
- [x] Docker dev com PostgreSQL + Redis + MinIO
- [x] Models base criados (users, convenios, doctors, appointments, payments, notifications, core)
- [x] Admin Django funcional para models principais
- [x] Celery + worker + beat configurados
- [x] drf-spectacular configurado com tags e security scheme
- [x] Kubb configurado na raiz (`kubb.config.ts` com plugins TS/Zod/client/hooks/faker/msw)
- [x] `npm run api:sync` inicial executado com sucesso

### Semana 2 - Autenticacao e Seguranca
- [x] Auth completo (register/login/refresh/logout)
- [x] Forgot/reset password com token seguro
- [x] Verificacao email/telefone com OTP + resend
- [x] 2FA TOTP (setup/verify/disable/login2fa)
- [x] RBAC base aplicado (patient/doctor/convenio_admin/owner)
- [x] Rate limiting aplicado em auth e rotas sensiveis
- [x] Consentimentos LGPD (`users/me/consents`) e export de dados
- [x] Cobertura de testes backend >= 80%

### Semana 3 - APIs Core (Execucao detalhada abaixo)
- [x] Dashboard de convenio com KPIs reais
- [x] Owner Admin APIs completas
- [x] Busca fuzzy de medicos com `pg_trgm`
- [x] AvailabilityService otimizado com datas e proximo slot
- [x] Notificacoes integradas ao ciclo de appointment/payment
- [x] Celery beat com reminders multi-stage e rotinas de limpeza/no-show
- [x] Relatorios financeiros + export CSV
- [x] Paginacao/filtros de notificacoes
- [x] Rating medio do medico atualizado automaticamente
- [x] Testes de integracao core completos
- [x] `api:sync` atualizado com novos endpoints

### Semana 4 - Agendamentos, Pagamentos e Notificacoes (refinamento)
- [x] Integracao real Firebase Admin (push)
- [x] Integracao real email (SendGrid/SES)
- [x] Fluxo Stripe + PIX end-to-end endurecido
- [x] State machine completa de appointment (`pending -> confirmed -> in_progress -> completed`)
- [x] Configuracoes globais owner (taxas/limites/politicas)
- [ ] Testes de carga iniciais e hardening final backend

---

## 2. Fase 2 - Painel Web (Semanas 5-8)

### Semana 5 - Base Frontend (CONCLUIDA em 2026-03-02)

- [x] Next.js 16.1.6 + React 19 + Tailwind CSS 4 + Turbopack
- [x] Estrutura App Router com route groups (auth), (convenio), (owner)
- [x] Auth web: proxy.ts (role routing), useAuthGuard (client guard), JWT interceptors Axios
- [x] Alias `@api/*` apontando para `shared/gen/*` (verificado com type-check)
- [x] TanStack Query + Zustand auth store + Sonner toast configurados
- [x] Login page com React Hook Form + Zod validation
- [x] Layouts Convenio + Owner com Sidebar (Factory Method) + Header
- [x] Dashboard Convenio: KPIs + RevenueChart + AppointmentsStatusChart + TopDoctors + Recent
- [x] Dashboard Owner: KPIs globais + RevenueChart
- [x] Error boundary (app/error.tsx) + 404 (app/not-found.tsx) + Loading (app/loading.tsx)
- [x] Formatters: moeda BRL, data, hora, telefone, CPF, CNPJ
- [x] GitHub Actions CI: eslint + type-check + build
- [x] npm run lint: 0 errors
- [x] npm run type-check: 0 errors
- [x] npm run build: 20 rotas geradas com sucesso
- [x] Padroes de design: Strategy (role routing), Factory Method (nav items), Singleton (api/auth/queryClient)

### Semana 6 - Painel Convenio
- [ ] Dashboard com KPIs e graficos
- [ ] CRUD medicos
- [ ] Gestao de agendas e excecoes
- [ ] CRUD tipos de exame e precificacao
- [ ] UX base (loading/error/empty states)

### Semana 7 - Painel Owner + Financeiro
- [ ] Dashboard executivo global
- [ ] Gestao de convenios (aprovar/suspender)
- [ ] Gestao de usuarios
- [ ] Financeiro global e auditoria
- [ ] Exportacoes CSV/PDF

### Semana 8 - Polish e Staging
- [ ] Testes frontend (lint/type/test/build)
- [ ] Melhorias de UX e performance
- [ ] Deploy staging backend + web

---

## 3. Fase 3 - Mobile (Semanas 9-13)

### Semana 9 - Setup Mobile + Auth
- [ ] Expo SDK 52 + React Native + TS + Navigation
- [ ] Alias `@api/*` integrado ao codigo gerado
- [ ] Auth mobile com SecureStore + refresh
- [ ] Onboarding + login/registro/verificacao
- [ ] Push setup e biometria

### Semana 10 - Busca e Medicos
- [ ] Home/dashboard paciente
- [ ] Busca de medicos com filtros/mapa
- [ ] Perfil medico e selecao de horario

### Semana 11 - Booking + Pagamento
- [ ] Confirmacao de agendamento
- [ ] Payment Sheet (cartao) e fluxo PIX
- [ ] Comprovante com feedback visual

### Semana 12 - Historico e Perfil
- [ ] Meus agendamentos (proximos/historico)
- [ ] Detalhes, cancelamento e avaliacao
- [ ] Centro de notificacoes
- [ ] Perfil, configuracoes e opcoes LGPD

### Semana 13 - Polish e testes internos
- [ ] Melhorias de animacao/performance
- [ ] Offline/deep link/pull-to-refresh
- [ ] Build production iOS/Android
- [ ] Submit para TestFlight/Internal Testing

---

## 4. Fase 4 - QA, Publicacao e Launch (Semanas 14-16)

### Semana 14 - QA e Seguranca
- [ ] E2E web e mobile
- [ ] Load testing
- [ ] Security audit (OWASP + LGPD)
- [ ] Correcao de bugs criticos

### Semana 15 - Producao e Stores
- [ ] Infra producao (DNS, SSL, CDN, monitoring)
- [ ] Deploy backend/web em producao
- [ ] Submissao mobile para App Store e Google Play
- [ ] Assets e metadata das lojas

### Semana 16 - Go-Live
- [ ] Monitoramento pos deploy
- [ ] Hotfixes e ajustes operacionais
- [ ] Acompanhamento de review das lojas
- [ ] Handoff tecnico e onboarding do primeiro convenio piloto

---

## 5. Semana 3 - Checklist de Execucao Completa (Detalhado)

### 5.1 Core de negocio
- [x] `ConvenioDashboardService` com KPIs reais (revenue/occupancy/cancellation/comparison/top doctors)
- [x] `ConvenioViewSet.dashboard` retornando dados reais
- [x] `OwnerDashboardService` com metricas globais
- [x] APIs owner em `/api/v1/admin-panel/*`

### 5.2 Doctors e disponibilidade
- [x] Migration com extensao `pg_trgm` + indexes trigram
- [x] `DoctorFilter.search` com `TrigramSimilarity`
- [x] `GET /api/v1/doctors/?search=...` fuzzy funcional
- [x] `AvailabilityService.get_available_dates(...)`
- [x] `AvailabilityService.get_next_available_slot(...)`
- [x] `GET /api/v1/doctors/{id}/available-dates/`

### 5.3 Fluxos appointment/payment/notificacao
- [x] Notificacao automatica na criacao de appointment
- [x] Notificacao automatica na confirmacao/cancelamento
- [x] Webhook de pagamento confirma appointment e notifica
- [x] Reembolso dispara notificacao de email
- [x] Helper central de notificacoes de negocio criado

### 5.4 Tarefas assincronas
- [x] Celery beat: cleanup expired appointments (5 min)
- [x] Celery beat: reminders multi-stage (1h)
- [x] Celery beat: cleanup old notifications (3:00)
- [x] Celery beat: no-show detection (30 min)
- [x] Celery beat: daily summary (20:00)

### 5.5 Reports e listagens
- [x] `/api/v1/convenios/reports/financial/`
- [x] `/api/v1/convenios/export/appointments/?format=csv`
- [x] `/api/v1/admin-panel/financial/`
- [x] `NotificationListView` paginada + filtros (`type`, `is_read`, `channel`)

### 5.6 Qualidade e contratos
- [x] Seed data Semana 3 atualizado e idempotente
- [x] Todos endpoints novos com `@extend_schema` + `operationId` camelCase
- [x] `python manage.py spectacular --validate --color` sem erros
- [x] `npm run api:sync` executado e `shared/gen/` atualizado
- [x] Testes de integracao (doctors/convenios/appointments/payments/owner) verdes
- [x] Cobertura >= 80%
- [x] `ruff check apps/ --fix` sem pendencias
- [x] `mypy apps/` sem erros

---

## 6. Gate de Conclusao (100% Semana 3)

- [x] Todos itens da secao 5 marcados
- [x] Nenhum endpoint critico pendente
- [x] Nenhuma regressao em auth/RBAC
- [x] Test suite e quality gates aprovados
- [x] Schema e codigo gerado sincronizados

Somente apos este gate, liberar "Preparacao Semana 4".

---

## 7. Preparacao para Semana 4

- [x] Criar backlog tecnico da Semana 4 com dependencias abertas
- [x] Definir plano de implementacao de providers reais (Firebase/Email/Stripe hardening)
- [x] Mapear testes faltantes de carga e resiliencia
- [x] Planejar ajustes finais de state machine de appointments
- [x] Validar prontidao do backend para inicio forte da Semana 5 (frontend)
- [x] Definir hierarquia inteligente de componentes frontend (atoms -> seções -> templates)

### 7.1 Evidencias da validacao (2026-03-02)
- [x] `backend/.venv/Scripts/python.exe manage.py seed_data --force` (ok)
- [x] `backend/.venv/Scripts/python.exe manage.py spectacular --validate --color --file ../shared/schema.yaml` (0 warnings / 0 errors)
- [x] `npm run api:sync` (ok, `shared/gen/` regenerado)
- [x] `npx tsc --noEmit -p tsconfig.base.json` (ok)
- [x] `backend/.venv/Scripts/mypy.exe apps` (ok)
- [x] `backend/.venv/Scripts/ruff.exe check apps --fix` (ok)
- [x] `backend/.venv/Scripts/pytest.exe --cov=apps --cov-report=term-missing --cov-fail-under=80 -v` (318 passed, 91.93%)

---

## 8. Progresso Semana 4 (Execucao em 2026-03-02)

- [x] DeviceToken model + rotas `register/unregister/list`
- [x] PushService real com Firebase + fallback sem credenciais
- [x] EmailService real com templates HTML transacionais (8+)
- [x] SMSService real com Twilio + OTP por SMS
- [x] Appointment machine com `start/complete/no-show` e transicoes validadas
- [x] PlatformSettings global + endpoints owner + cache invalidation
- [x] MaintenanceModeMiddleware
- [x] Cancellation policy engine + endpoint `cancellation-policy`
- [x] Reminder stages tracking (`reminder_stages_sent`) + endpoint `reminders`
- [x] Seed data atualizado (completo + `--minimal`)
- [x] Locust scaffold (`backend/locustfile.py` + `backend/scripts/setup_load_test.py`)
- [x] `npm run api:sync` com novos endpoints em `shared/schema.yaml` e `shared/gen/`
- [x] `ruff check apps --fix` sem pendencias
- [x] `mypy apps` sem erros
- [x] `npx tsc --noEmit -p tsconfig.base.json` sem erros
- [ ] `pytest --cov ...` completo bloqueado por credencial local do PostgreSQL (`localhost:5432`, user `healthapp`)
