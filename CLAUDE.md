# CLAUDE.md — HealthApp Monorepo

> **Documento de referência permanente para Claude Code.**
> Toda sessão de desenvolvimento DEVE começar lendo este arquivo.

---

## 1. Visão Geral do Projeto

**HealthApp** é uma plataforma de gestão em saúde para o mercado brasileiro que conecta três stakeholders: clinicas parceiras (internamente ainda chamadas de `convenio`), pacientes e administradores do sistema (owner). O sistema permite agendamento de consultas e exames com pagamento integrado (Stripe + PIX), compliance LGPD obrigatório, e opera como SaaS multi-tenant.

Regra de negocio permanente: todo medico pertence a uma unica clinica/convenio. O agendamento so entra na operacao da clinica depois que o pagamento do paciente for confirmado no backend.

### 1.1 Stakeholders e Interfaces

| Stakeholder | Interface | Tecnologia | Descrição |
|---|---|---|---|
| **Clinica Admin** | Painel Web | Next.js 16 | CRUD medicos, agendas, exames, financeiro, dashboard KPIs |
| **Owner** | Painel Web | Next.js 16 | Gestao global: clinicas, usuarios, analytics, auditoria LGPD |
| **Paciente** | App Mobile | React Native/Expo | Busca médicos, agendamento, pagamento, histórico, notificações |
| **Suporte Interno** | Django Admin | Django 6.0 | Painel de emergência, correções manuais, debug |

### 1.2 Estratégia "Web First"

O desenvolvimento segue a ordem: Backend → Painéis Web → App Mobile. Razões: o app mobile é consumidor de dados que só existem após os painéis web permitirem cadastro de médicos, agendas e preços. As APIs amadurecem no consumo web antes do mobile. Bugs de regra de negócio são corrigidos antes de entrar mobile.

---

## 2. Stack Tecnológico (Versões Exatas — Fevereiro 2026)

### 2.1 Backend

| Componente | Tecnologia | Versão | Função |
|---|---|---|---|
| Framework | Django | **6.0.2** | Framework web, ORM, admin, auth, migrations |
| API | Django REST Framework | **3.15** | Serialização, ViewSets, permissions, throttling |
| Auth JWT | djangorestframework-simplejwt | **5.3** | Access/Refresh tokens com rotação |
| Filtros | django-filter | **24.3** | Filtros automáticos nas APIs |
| CORS | django-cors-headers | **4.4** | Cross-origin para web e mobile |
| Criptografia | django-encrypted-model-fields | **0.6** | AES-256 para CPF/CNPJ/dados saúde |
| Auditoria | django-auditlog | **3.0** | Logs imutáveis (LGPD compliance) |
| Tasks Leves | django.tasks (built-in) | **6.0** | Emails, push unitário, contadores |
| Tasks Pesadas | Celery | **5.4** | Relatórios PDF, batch, schedulers |
| CSP | django.middleware.csp (built-in) | **6.0** | Content Security Policy nativo |
| Cache/Broker | Redis | **7.2** | Cache, sessões, Celery broker, locks |
| Banco | PostgreSQL | **16** | Banco relacional + pgcrypto, pg_trgm, uuid-ossp |
| WSGI | Gunicorn | **22.0** | Servidor de produção |
| Pagamentos | stripe | **10.0** | Stripe + PIX |
| Push | firebase-admin | **6.5** | FCM push notifications |
| Storage | boto3 | **1.35** | AWS S3 |
| Monitoring | sentry-sdk | **2.0** | Error tracking |
| Docs API | drf-spectacular | **0.27** | OpenAPI automático → input para Kubb code generation |
| Testes | pytest-django + factory-boy | **4.9 + 3.3** | Testes unitários e integração |
| Lint | ruff | **latest** | Linter + formatter (substitui flake8+black) |
| Types | mypy | **latest** | Type checking estático |
| Python | Python | **3.13** | Mínimo 3.12 (exigido pelo Django 6.0) |

### 2.2 Frontend Web

| Componente | Tecnologia | Versão | Função |
|---|---|---|---|
| Framework | Next.js | **16** | SSR, App Router, Cache Components, Turbopack |
| UI Library | React | **19.2** | View Transitions, Activity, Compiler |
| Language | TypeScript | **5.6+** | Tipagem estática |
| CSS | Tailwind CSS | **4** | Utility-first, CSS-first config, engine Rust |
| Components | Shadcn/UI | **latest** | Componentes acessíveis (Radix UI) |
| Animations | tw-animate-css | **latest** | Animações Tailwind 4 |
| Server State | TanStack Query | **5** | Cache de dados do servidor |
| Client State | Zustand | **5** | Estado global leve |
| Forms | React Hook Form + Zod | **7 + 3** | Formulários + validação |
| Charts | Recharts | **2** | Gráficos para dashboards |
| HTTP | Axios | **1.7** | Cliente HTTP com interceptors JWT |
| Dates | date-fns | **4** | Manipulação de datas |
| Theme | next-themes | **latest** | Dark/light mode |
| Bundler | Turbopack (built-in) | **16** | Bundler padrão, 5-10x mais rápido |
| Node.js | Node.js | **20.9+** | Mínimo exigido pelo Next.js 16 |

### 2.3 Mobile

| Componente | Tecnologia | Versão | Função |
|---|---|---|---|
| Framework | React Native | **0.76** | Cross-platform iOS + Android |
| Platform | Expo SDK | **52** | Managed workflow + EAS Build |
| Language | TypeScript | **5.6+** | Tipagem estática |
| Navigation | React Navigation | **7** | Navegação entre telas |
| Styling | NativeWind | **4** | Tailwind CSS para React Native |
| UI Kit | React Native Paper | **5** | Material Design 3 |
| Pagamentos | @stripe/stripe-react-native | **latest** | Payment Sheet nativo |
| Push | @react-native-firebase/messaging | **latest** | FCM push notifications |
| State | Zustand + TanStack Query | **5 + 5** | Estado global + server cache |
| Animations | react-native-reanimated | **3** | Animações fluidas 60fps |
| Secure Store | expo-secure-store | **latest** | Keychain (iOS) / Keystore (Android) |
| Maps | react-native-maps | **latest** | Mapas nativos |
| Images | expo-image | **latest** | Carregamento otimizado |
| Auth Bio | expo-local-authentication | **latest** | Face ID / Touch ID |
| Build | EAS Build | **latest** | Build nativo na nuvem |
| Submit | EAS Submit | **latest** | Publicação automática nas lojas |
| OTA | EAS Update | **latest** | Updates sem resubmeter lojas |

### 2.4 Shared Layer (Code Generation)

| Componente | Tecnologia | Versão | Função |
|---|---|---|---|
| Code Generator | Kubb | **^4.27** | OpenAPI → TypeScript types, Zod, clients, hooks |
| Plugin OAS | @kubb/plugin-oas | ^4.27 | Parser e validador OpenAPI |
| Plugin TS | @kubb/plugin-ts | ^4.27 | Gera TypeScript interfaces/enums |
| Plugin Zod | @kubb/plugin-zod | ^4.27 | Gera Zod schemas de validação runtime |
| Plugin Client | @kubb/plugin-client | ^4.27 | Gera Axios client functions type-safe |
| Plugin React Query | @kubb/plugin-react-query | ^4.27 | Gera TanStack Query hooks (useQuery, useMutation) |
| Plugin Faker | @kubb/plugin-faker | ^4.27 | Gera Faker.js mock data para testes |
| Plugin MSW | @kubb/plugin-msw | ^4.27 | Gera MSW request handlers para testes |
| Schema Source | drf-spectacular | ^0.27 | Exporta OpenAPI 3.x do Django DRF |

### 2.5 DevOps & Ferramentas

| Ferramenta | Função |
|---|---|
| Claude Code (Anthropic) | Desenvolvimento AI-driven do início ao fim |
| Docker + Docker Compose | Containers de desenvolvimento e produção |
| GitHub Actions | CI/CD para backend, web e mobile + API sync |
| EAS Build/Submit | Pipeline de build e publicação mobile |
| Sentry | Error tracking em produção |
| Prometheus + Grafana | Métricas e monitoramento |

---

## 3. Arquitetura Geral do Sistema

### 3.1 Visão de Três Camadas

O sistema segue arquitetura three-tier com separação clara entre apresentação, aplicação e dados, comunicando-se exclusivamente via API REST com autenticação JWT.

**Camada de Apresentação:** Três interfaces distintas. (a) Painel Web do Convênio e Painel Web do Owner como uma única aplicação Next.js 16 com rotas protegidas por role via proxy.ts. (b) App Mobile do Paciente com React Native/Expo. Todas consomem a mesma API REST.

**Camada de Aplicação (Backend):** Django 6.0.2 com DRF expondo APIs RESTful versionadas (`/api/v1/`). django.tasks para tarefas leves (emails, push unitário). Celery + Redis para tarefas pesadas (relatórios PDF, batch, schedulers). Django Admin como painel de emergência.

**Camada de Dados:** PostgreSQL 16 com extensões pgcrypto (AES-256), uuid-ossp (UUIDs), pg_trgm (busca textual), e Row Level Security. Redis como cache, session store, broker Celery e lock distribuído para agendamentos. AWS S3/MinIO para arquivos.

### 3.2 Diagrama de Comunicação Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE APRESENTAÇÃO                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐    │
│  │  App Mobile   │    │  Painel Convênio  │    │   Painel Owner     │    │
│  │  (Paciente)   │    │  (Next.js 16)     │    │   (Next.js 16)     │    │
│  │  React Native │    │  + Turbopack      │    │   + Turbopack      │    │
│  │  + Expo SDK52 │    │  + proxy.ts       │    │   + proxy.ts       │    │
│  └──────┬───────┘    └────────┬─────────┘    └─────────┬──────────┘    │
│         │                     │                         │               │
└─────────┼─────────────────────┼─────────────────────────┼───────────────┘
          │ HTTPS/JWT           │ HTTPS/JWT               │ HTTPS/JWT
          │                     │                         │
          ▼                     ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER / NGINX / ALB                          │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     CAMADA DE APLICAÇÃO                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              Django 6.0.2 + DRF 3.15 (Gunicorn)                  │  │
│  │                                                                   │  │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────────────────┐ │  │
│  │  │  users/   │ │ convenios/│ │ doctors/ │ │  appointments/     │ │  │
│  │  │  Auth     │ │ Plans     │ │ Schedule │ │  Booking + Lock    │ │  │
│  │  │  RBAC     │ │ Dashboard │ │ Avail.   │ │  Redis 10min TTL   │ │  │
│  │  └──────────┘ └───────────┘ └──────────┘ └────────────────────┘ │  │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────────────────────────────┐ │  │
│  │  │payments/ │ │ notific./ │ │  core/ (BaseModel, Pagination,  │ │  │
│  │  │Stripe    │ │ Push/Email│ │  Exceptions, Middleware)         │ │  │
│  │  │PIX       │ │ SMS       │ │                                  │ │  │
│  │  └──────────┘ └───────────┘ └──────────────────────────────────┘ │  │
│  └───────────────────────┬───────────────────┬───────────────────────┘  │
│                          │                   │                          │
│  ┌───────────────────────▼──┐  ┌─────────────▼───────────────────────┐ │
│  │   django.tasks (leves)   │  │   Celery Workers (pesadas)          │ │
│  │   emails, push unitário  │  │   relatórios PDF, batch, schedulers │ │
│  │   contadores             │  │   reminders programados             │ │
│  └──────────────────────────┘  └──────────────┬──────────────────────┘ │
│                                                │                        │
└────────────────────────────────────────────────┼────────────────────────┘
                                                 │
          ┌──────────────────────────────────────┼──────────────────┐
          │                                      │                  │
          ▼                                      ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE DADOS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  PostgreSQL 16     │  │  Redis 7.2        │  │  AWS S3 / MinIO     │ │
│  │  + pgcrypto        │  │  + cache L1       │  │  + uploads          │ │
│  │  + uuid-ossp       │  │  + sessions       │  │  + avatares         │ │
│  │  + pg_trgm         │  │  + Celery broker  │  │  + documentos       │ │
│  │  + RLS             │  │  + locks distrib. │  │  + exports PDF      │ │
│  └───────────────────┘  └──────────────────┘  └──────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐
│  Stripe API       │ │  Firebase (FCM)   │ │  SendGrid/SES + Twilio/Zenvia│
│  Pagamentos       │ │  Push Notifications│ │  Email + SMS                 │
│  PIX + Cartão     │ │                    │ │                              │
│  Webhooks         │ │                    │ │                              │
└──────────────────┘ └──────────────────┘ └──────────────────────────────┘
```

### 3.3 Decisões Arquiteturais

**Monolito Modular:** Django organizado em apps modulares (users, appointments, payments, convenios, notifications) que podem ser extraídos para microsserviços no futuro. Inicialmente rodam como deploy único. Simplifica CI/CD, debugging e transações.

**API-First:** Backend como API pura (sem templates Django para views). Painéis web e mobile são consumidores independentes. Permite futura integração por terceiros.

**Event-Driven (dual):** django.tasks para operações leves e assíncronas (email unitário, push, contadores). Celery + Redis para operações pesadas (relatórios PDF, batch processing, schedulers complexos). Mantém response time da API < 300ms.

**Proxy.ts (Next.js 16):** Substitui middleware.ts. Roda no runtime Node.js completo (não Edge). Faz verificação JWT, redirecionamento por role (convenio vs owner), e rate limiting no BFF.

**API Code Generation (Kubb):** O backend é a single source of truth para o contrato da API. Serializers e views Django anotados com `@extend_schema` (drf-spectacular) geram um schema OpenAPI 3.x. O Kubb consome esse schema e gera automaticamente: TypeScript types/interfaces, Zod schemas de validação runtime, Axios client functions type-safe, TanStack Query hooks (useQuery/useMutation/useSuspenseQuery), Faker.js mock data e MSW handlers para testes. Todo código gerado reside em `shared/gen/` e é importado por frontend e mobile via path alias `@api/*`. Elimina ~6.900 linhas de boilerplate manual, previne type drift entre backend e consumidores, e garante validação Zod automática em cada response da API. Pipeline: `npm run api:sync` (export schema + generate). Consulte `shared/CLAUDE.md` para regras completas.

---

## 4. Estrutura do Monorepo

```
healthapp/
├── CLAUDE.md                          # ESTE ARQUIVO — instruções globais
├── kubb.config.ts                     # Configuração Kubb (code generation)
├── package.json                       # Scripts: api:sync, schema:export, generate:api
├── docs/
│   ├── PLANO_COMPLETO.md              # Plano de desenvolvimento v3 consolidado
│   ├── PROMPT_EXECUCAO_SEMANA1.md     # Prompt de execução inicial + semana 1
│   └── CHANGELOG_V2_V3.md            # Changelog entre versões do plano
│
├── shared/                            # ⚡ Código compartilhado (gerado pelo Kubb)
│   ├── CLAUDE.md                      # Instruções Claude Code — Shared/Kubb
│   ├── schema.yaml                    # OpenAPI 3.x exportado do Django (NÃO EDITAR)
│   └── gen/                           # Auto-gerado pelo Kubb (NÃO EDITAR NUNCA)
│       ├── types/                     # TypeScript interfaces por tag (doctors, auth, etc)
│       ├── zod/                       # Zod schemas de validação runtime
│       ├── clients/                   # Axios client functions type-safe
│       ├── hooks/                     # TanStack Query hooks (useQuery, useMutation)
│       ├── mocks/                     # Faker.js data + MSW handlers para testes
│       │   ├── faker/
│       │   └── msw/
│       └── index.ts                   # Barrel raiz
│
├── backend/
│   ├── CLAUDE.md                      # Instruções Claude Code — Backend API
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py                # Settings compartilhados
│   │   │   ├── development.py         # DEBUG=True, logs verbose
│   │   │   ├── staging.py             # Settings staging
│   │   │   └── production.py          # Settings produção
│   │   ├── urls.py                    # URL routing principal
│   │   ├── celery.py                  # Configuração Celery
│   │   ├── tasks.py                   # django.tasks configuration
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/
│   │   ├── users/                     # CustomUser, Auth, Permissions
│   │   │   ├── models.py              # CustomUser, Address
│   │   │   ├── serializers.py         # UserSerializer, RegisterSerializer, LoginSerializer
│   │   │   ├── views.py               # AuthViewSet, UserViewSet
│   │   │   ├── permissions.py         # IsOwner, IsConvenioAdmin, IsPatient, IsDoctor
│   │   │   ├── signals.py             # post_save: enviar email verificação
│   │   │   ├── tasks.py               # django.tasks: enviar email, SMS
│   │   │   ├── urls.py
│   │   │   ├── admin.py
│   │   │   └── tests/
│   │   │       ├── test_models.py
│   │   │       ├── test_serializers.py
│   │   │       ├── test_views.py
│   │   │       └── factories.py
│   │   ├── convenios/                 # Convênio, Plans, Dashboard
│   │   │   ├── models.py              # Convenio, ConvenioPlan
│   │   │   ├── serializers.py
│   │   │   ├── views.py               # ConvenioViewSet, DashboardView
│   │   │   ├── filters.py             # django-filter: filtros
│   │   │   ├── services.py            # ConvenioDashboardService
│   │   │   ├── urls.py
│   │   │   ├── admin.py
│   │   │   └── tests/
│   │   ├── doctors/                   # Doctor, Schedule, Availability
│   │   │   ├── models.py              # Doctor, DoctorSchedule, ScheduleException
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── services.py            # AvailabilityService (lógica de slots)
│   │   │   ├── filters.py
│   │   │   ├── urls.py
│   │   │   ├── admin.py
│   │   │   └── tests/
│   │   ├── appointments/              # Booking, ExamType, Redis Lock
│   │   │   ├── models.py              # Appointment, ExamType, Rating
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── services.py            # BookingService (lock Redis, validação)
│   │   │   ├── urls.py
│   │   │   ├── admin.py
│   │   │   └── tests/
│   │   ├── payments/                  # Stripe, PIX, Webhooks
│   │   │   ├── models.py              # Payment, Refund
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── services.py            # StripeService, PixService
│   │   │   ├── webhooks.py            # Stripe webhook handler
│   │   │   ├── urls.py
│   │   │   ├── admin.py
│   │   │   └── tests/
│   │   ├── notifications/             # Push, Email, SMS
│   │   │   ├── models.py              # Notification
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── services.py            # PushService, EmailService, SMSService
│   │   │   ├── tasks.py               # Celery tasks de envio batch + reminders
│   │   │   ├── urls.py
│   │   │   ├── admin.py
│   │   │   └── tests/
│   │   └── core/                      # BaseModel, Pagination, Exceptions
│   │       ├── models.py              # BaseModel (UUID, timestamps, soft delete)
│   │       ├── pagination.py          # StandardPagination
│   │       ├── exceptions.py          # Custom exception handler DRF
│   │       ├── middleware.py          # AuditLog, RequestID, SecurityHeaders
│   │       └── utils.py
│   ├── requirements/
│   │   ├── base.txt                   # Dependências compartilhadas
│   │   ├── development.txt            # pytest, factory-boy, debug-toolbar
│   │   └── production.txt             # gunicorn, sentry-sdk, whitenoise
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   ├── manage.py
│   ├── pyproject.toml
│   ├── .env.example
│   └── .github/
│       └── workflows/
│           └── ci.yml
│
├── frontend/
│   ├── CLAUDE.md                      # Instruções Claude Code — Frontend Web
│   ├── next.config.ts                 # cacheComponents, reactCompiler, turbopack
│   ├── proxy.ts                       # Auth + role routing (substitui middleware.ts)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/                # login, forgot-password, reset-password
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (convenio)/            # Painel do Convênio Admin
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── doctors/page.tsx
│   │   │   │   ├── schedules/page.tsx
│   │   │   │   ├── exams/page.tsx
│   │   │   │   ├── appointments/page.tsx
│   │   │   │   ├── financial/page.tsx
│   │   │   │   ├── settings/page.tsx
│   │   │   │   └── layout.tsx         # Sidebar convênio
│   │   │   ├── (owner)/               # Painel do Owner
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── convenios/page.tsx
│   │   │   │   ├── users/page.tsx
│   │   │   │   ├── financial/page.tsx
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   ├── audit-logs/page.tsx
│   │   │   │   ├── settings/page.tsx
│   │   │   │   └── layout.tsx         # Sidebar owner
│   │   │   ├── layout.tsx             # Root layout
│   │   │   └── globals.css            # Tailwind 4 @theme + design tokens
│   │   ├── components/
│   │   │   ├── ui/                    # Shadcn/UI components
│   │   │   ├── layouts/               # Sidebar, Header, Footer
│   │   │   ├── forms/                 # Form components reutilizáveis
│   │   │   ├── tables/                # DataTable, pagination
│   │   │   └── charts/                # Gráficos (Recharts)
│   │   ├── lib/
│   │   │   ├── api.ts                 # Axios instance + JWT interceptors
│   │   │   ├── auth.ts                # JWT storage, refresh logic, role guards
│   │   │   └── utils.ts
│   │   ├── hooks/                     # Custom hooks (wrappers sobre @api/hooks)
│   │   ├── stores/                    # Zustand stores
│   │   └── types/                     # Types LOCAIS de UI (não API — API vem de @api/*)
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── .github/
│       └── workflows/
│           └── ci.yml
│
├── mobile/
│   ├── CLAUDE.md                      # Instruções Claude Code — Mobile
│   ├── app.json                       # Expo config
│   ├── eas.json                       # EAS Build profiles (dev/preview/prod)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── auth/                  # Login, Register, ForgotPassword, Verify
│   │   │   ├── home/                  # Dashboard, Search
│   │   │   ├── doctor/                # DoctorProfile, DoctorList
│   │   │   ├── booking/               # TimeSelection, Confirmation, Payment
│   │   │   ├── appointments/          # MyAppointments, AppointmentDetail
│   │   │   ├── notifications/         # NotificationCenter
│   │   │   └── profile/               # Profile, Settings, LGPD
│   │   ├── components/                # Componentes reutilizáveis
│   │   ├── navigation/                # React Navigation stacks + tabs
│   │   ├── services/                  # API service layer
│   │   ├── stores/                    # Zustand stores
│   │   ├── hooks/                     # Custom hooks (wrappers sobre @api/hooks)
│   │   ├── theme/                     # NativeWind tokens
│   │   └── types/                     # Types LOCAIS de UI (não API — API vem de @api/*)
│   ├── package.json
│   ├── tsconfig.json
│   └── .github/
│       └── workflows/
│           └── ci.yml                 # CI + EAS Build + Submit
│
├── .gitignore                         # Python + Node + RN + IDE + .kubb/ (NÃO ignorar shared/gen/)
└── .editorconfig
```

---

## 5. Modelagem de Dados (Django ORM)

### 5.1 BaseModel (core/models.py)

Todos os models herdam de BaseModel. Campos padrão: UUID primary key, timestamps, soft delete.

```python
class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        abstract = True

    # SoftDeleteManager filtra deleted_at__isnull=True por padrão
```

### 5.2 CustomUser (users/models.py)

```python
class CustomUser(AbstractBaseUser, PermissionsMixin, BaseModel):
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    cpf = EncryptedCharField(max_length=14, unique=True)           # AES-256
    date_of_birth = models.DateField(null=True)
    gender = models.CharField(choices=GENDER_CHOICES, max_length=1)
    avatar_url = models.URLField(blank=True)
    role = models.CharField(choices=ROLE_CHOICES, max_length=20, db_index=True)
    # ROLE_CHOICES: patient, doctor, convenio_admin, owner
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True)
```

### 5.3 Convenio (convenios/models.py)

```python
class Convenio(BaseModel):
    name = models.CharField(max_length=255)
    cnpj = EncryptedCharField(max_length=18, unique=True)          # AES-256
    logo_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    address = models.JSONField(default=dict)    # {street, city, state, zip, lat, lng}
    settings = models.JSONField(default=dict)   # cancellation_policy, etc
    subscription_plan = models.CharField(max_length=50)
    subscription_status = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

class ConvenioPlan(BaseModel):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    features = models.JSONField(default=list)
    max_doctors = models.IntegerField()
    is_active = models.BooleanField(default=True)
```

### 5.4 Doctor (doctors/models.py)

```python
class Doctor(BaseModel):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    convenio = models.ForeignKey(Convenio, on_delete=models.CASCADE)
    crm = models.CharField(max_length=20)
    crm_state = models.CharField(max_length=2)
    specialty = models.CharField(max_length=100, db_index=True)
    subspecialties = ArrayField(models.CharField(max_length=100), default=list)
    bio = models.TextField(blank=True)
    consultation_duration = models.IntegerField(default=30)   # minutos
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_ratings = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True, db_index=True)

class DoctorSchedule(BaseModel):  # Agenda semanal recorrente
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    weekday = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(6)])
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration = models.IntegerField(default=30)

class ScheduleException(BaseModel):  # Férias, feriados, bloqueios
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    date = models.DateField(db_index=True)
    is_available = models.BooleanField(default=False)
    reason = models.CharField(max_length=255)
```

### 5.5 Appointment e Payment

```python
class ExamType(BaseModel):
    convenio = models.ForeignKey(Convenio, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    preparation = models.TextField(blank=True)     # instruções de preparo
    duration_minutes = models.IntegerField(default=30)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

class Appointment(BaseModel):
    patient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    convenio = models.ForeignKey(Convenio, on_delete=models.CASCADE)
    appointment_type = models.CharField(max_length=20)
    # choices: consultation, exam, return_visit
    exam_type = models.ForeignKey(ExamType, null=True, on_delete=models.SET_NULL)
    scheduled_date = models.DateField(db_index=True)
    scheduled_time = models.TimeField()
    duration_minutes = models.IntegerField()
    status = models.CharField(max_length=20, db_index=True)
    # choices: pending, confirmed, in_progress, completed, cancelled, no_show
    cancellation_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    payment = models.OneToOneField('payments.Payment', null=True, on_delete=models.SET_NULL)
    reminder_sent = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['doctor', 'scheduled_date'], name='idx_apt_doctor_date'),
            models.Index(fields=['patient', 'status'], name='idx_apt_patient_status'),
        ]

class Rating(BaseModel):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE)
    patient = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    score = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    is_moderated = models.BooleanField(default=False)

class Payment(BaseModel):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='BRL')
    payment_method = models.CharField(max_length=20)
    # choices: pix, credit_card, debit_card
    status = models.CharField(max_length=20, db_index=True)
    # choices: pending, processing, completed, failed, refunded
    stripe_payment_id = models.CharField(max_length=255, blank=True)
    pix_code = models.TextField(blank=True)
    pix_expiration = models.DateTimeField(null=True)
    paid_at = models.DateTimeField(null=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'created_at'], name='idx_pay_status_created'),
        ]

class Notification(BaseModel):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    type = models.CharField(max_length=50)     # appointment, payment, system
    title = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict)   # deep link data
```

### 5.6 Indexes Otimizados

Indexes GIN criados via migração manual para campos JSONField (address, settings, metadata) usando `django.contrib.postgres.indexes.GinIndex`. Index `idx_doc_spec_avail` para fields `['specialty', 'is_available']`.

---

## 6. API REST — Endpoints Completos

Todas as APIs: versionamento `/api/v1/`, JSON, JWT via `Authorization: Bearer <token>`, documentação automática via drf-spectacular (Swagger UI + ReDoc). Cada endpoint possui `operationId` explícito em camelCase (obrigatório para geração de código Kubb). Schema OpenAPI exportado para `shared/schema.yaml` e consumido pelo Kubb para gerar types, Zod schemas, clients e hooks automaticamente.

### 6.1 Autenticação

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/v1/auth/register/` | Registro de novo usuário (paciente) |
| POST | `/api/v1/auth/login/` | Login (retorna access + refresh tokens) |
| POST | `/api/v1/auth/token/refresh/` | Renovar access token |
| POST | `/api/v1/auth/forgot-password/` | Solicitar reset de senha via email |
| POST | `/api/v1/auth/reset-password/` | Confirmar novo password com token |
| POST | `/api/v1/auth/verify-email/` | Verificar email com código OTP |
| POST | `/api/v1/auth/verify-phone/` | Verificar telefone com SMS |

### 6.2 Usuários

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/users/me/` | Perfil do usuário autenticado |
| PATCH | `/api/v1/users/me/` | Atualizar perfil |
| DELETE | `/api/v1/users/me/` | Excluir conta (LGPD — anonimização) |
| GET | `/api/v1/users/me/consents/` | Listar consentimentos LGPD |
| POST | `/api/v1/users/me/export-data/` | Exportar dados pessoais (LGPD) |

### 6.3 Médicos e Busca

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/doctors/` | Listar médicos (filtros: specialty, convenio, city) |
| GET | `/api/v1/doctors/{id}/` | Detalhes do médico + avaliações |
| GET | `/api/v1/doctors/{id}/slots/` | Slots disponíveis para data específica |
| GET | `/api/v1/doctors/search/` | Busca textual (pg_trgm trigram) |

### 6.4 Agendamentos

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/appointments/` | Listar agendamentos do usuário |
| POST | `/api/v1/appointments/` | Criar agendamento (lock Redis 10min) |
| GET | `/api/v1/appointments/{id}/` | Detalhes do agendamento |
| POST | `/api/v1/appointments/{id}/cancel/` | Cancelar agendamento |
| POST | `/api/v1/appointments/{id}/confirm/` | Confirmar agendamento (convênio) |
| POST | `/api/v1/appointments/{id}/rate/` | Avaliar consulta (após completed) |

### 6.5 Pagamentos

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/v1/payments/create-intent/` | Criar Payment Intent (Stripe) |
| POST | `/api/v1/payments/pix/generate/` | Gerar QR Code PIX |
| GET | `/api/v1/payments/{id}/status/` | Consultar status do pagamento |
| POST | `/api/v1/payments/{id}/refund/` | Solicitar reembolso |
| POST | `/api/v1/webhooks/stripe/` | Webhook Stripe (assinatura verificada) |
| GET | `/api/v1/payments/history/` | Histórico de pagamentos |

### 6.6 Convênio (Painel Web)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/convenio/dashboard/` | Dashboard com KPIs |
| GET/POST | `/api/v1/convenio/doctors/` | CRUD de médicos do convênio |
| GET/POST | `/api/v1/convenio/schedules/` | CRUD de agendas semanais |
| GET/POST | `/api/v1/convenio/schedule-exceptions/` | CRUD de exceções (férias, feriados) |
| GET/POST | `/api/v1/convenio/exam-types/` | CRUD de tipos de exames |
| GET/POST | `/api/v1/convenio/pricing/` | CRUD de tabela de preços |
| GET | `/api/v1/convenio/appointments/` | Todos agendamentos do convênio |
| GET | `/api/v1/convenio/reports/` | Relatórios (filtros por data, médico, tipo) |
| PATCH | `/api/v1/convenio/settings/` | Configurações do convênio |

### 6.7 Owner (Painel Master)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/admin/dashboard/` | Dashboard executivo global |
| GET/POST | `/api/v1/admin/convenios/` | CRUD e gerenciamento de convênios |
| POST | `/api/v1/admin/convenios/{id}/suspend/` | Suspender convênio |
| GET | `/api/v1/admin/users/` | Listagem global de usuários |
| GET | `/api/v1/admin/financial/` | Relatório financeiro da plataforma |
| GET | `/api/v1/admin/analytics/` | Analytics avançados (tendências, cohorts) |
| GET | `/api/v1/admin/audit-logs/` | Logs de auditoria (LGPD) |
| PATCH | `/api/v1/admin/settings/` | Configurações globais (taxas, limites) |

### 6.8 Notificações

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/v1/notifications/` | Listar notificações do usuário |
| PATCH | `/api/v1/notifications/{id}/read/` | Marcar como lida |
| POST | `/api/v1/notifications/read-all/` | Marcar todas como lidas |
| GET | `/api/v1/notifications/unread-count/` | Contador de não lidas |

---

## 7. Convenções Globais de Desenvolvimento

### 7.1 Git & Commits

- **Conventional Commits** obrigatório: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `perf:`
- Branch naming: `feature/`, `fix/`, `refactor/`, `release/`
- Branch principal: `main` (produção), `develop` (staging)
- Pull Requests obrigatórios com code review antes de merge
- Squash merge para manter histórico limpo

### 7.2 Código

- **Python:** PEP 8 via ruff, type hints obrigatórios, docstrings Google-style
- **TypeScript:** Strict mode, no `any`, interfaces preferidas sobre types para objetos públicos
- **Código Gerado (shared/gen/):** NUNCA editar manualmente. Qualquer mudança via backend → api:sync
- **Testes:** Mínimo 80% cobertura. Testes escritos junto com o código, não como afterthought
- **Naming:** snake_case (Python), camelCase (TypeScript), PascalCase (componentes React)
- **Imports:** Absolutos sempre. Nunca relativos com `../../../`. API types/hooks via `@api/*`

### 7.3 Segurança (LGPD + OWASP)

- Campos sensíveis (CPF, CNPJ, dados saúde) SEMPRE encriptados com AES-256
- JWT: access token 15min, refresh token 7 dias com rotação automática
- RBAC com 4 roles: patient, doctor, convenio_admin, owner
- Rate limiting: 100 req/min geral, 5 req/min login, 3 req/min reset senha
- TLS 1.3 obrigatório. HSTS max-age 1 ano. Certificate pinning no mobile
- django-auditlog em todos os models críticos (LGPD compliance)
- LGPD: endpoints de exportação e exclusão de dados, consentimento granular

### 7.4 Padrões de Resposta API

```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

Erros seguem formato padrão DRF com custom exception handler.

---

## 8. Cronograma (16 Semanas)

| Fase | Semanas | Foco | Entregas |
|---|---|---|---|
| **1** | 1-4 | Backend Foundation | Models, Auth, APIs core, Docker, CI/CD |
| **2** | 5-8 | Web Panels + Payments | Painel Convênio, Painel Owner, Stripe/PIX |
| **3** | 9-13 | Mobile App | Todas as telas, pagamento, push, EAS Build |
| **4** | 14-16 | QA + Launch | Testes E2E, security audit, deploy, lojas |

---

*Este documento é a fonte de verdade do projeto. Consulte os CLAUDE.md de cada subpasta para instruções específicas: `backend/CLAUDE.md` (API Django), `frontend/CLAUDE.md` (Next.js 16), `mobile/CLAUDE.md` (React Native), `shared/CLAUDE.md` (Kubb code generation).*
