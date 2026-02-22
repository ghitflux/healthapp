# HealthApp — Plano de Desenvolvimento v3.0 Consolidado

> **Documento definitivo.** Combina o plano v3 (stack atualizado, Claude Code) com todo o conteúdo detalhado do v2 (modelagem, endpoints, fluxos, segurança, LGPD, KPIs, roadmap).
>
> Atualizado: Fevereiro 2026 | Prazo: 16 semanas (4 meses)

---

## 1. Changelog v2 → v3

| Área | v2 (Anterior) | v3 (Atual) | Impacto |
|---|---|---|---|
| Backend | Django 5.1 + DRF 3.15 | **Django 6.0.2** + DRF 3.15 | Alto |
| Frontend | Next.js 15 + Tailwind CSS 4 | **Next.js 16** + Tailwind CSS 4 | Alto |
| Mobile Build | EAS Build (mencionado) | **EAS Build** (fluxo completo documentado) | Médio |
| Dev Tool | Não especificado | **Claude Code** (do início ao fim) | Crítico |
| API Codegen | Manual (types, clients, hooks) | **Kubb ^4.27** (OpenAPI → TS/Zod/hooks) | Alto |
| Shared Layer | Inexistente | **shared/** com schema + gen/ | Alto |
| Python | 3.11+ | **3.12+** (mínimo Django 6.0) | Médio |
| Node.js | 18+ | **20.9+** (mínimo Next.js 16) | Médio |
| Background Tasks | Celery + Redis (obrigatório) | **django.tasks** (nativo) + Celery (pesado) | Alto |
| CSP | django-csp (terceiro) | **CSP nativo** (SECURE_CSP built-in) | Médio |
| Middleware | Next.js middleware.ts | **proxy.ts** (Node.js runtime) | Médio |
| Bundler | Webpack (padrão Next.js 15) | **Turbopack** (padrão estável Next.js 16) | Alto |
| React | React 19 | **React 19.2** (View Transitions, Activity) | Médio |
| Cache | TanStack Query (client) | **Cache Components** + TanStack Query | Alto |
| Repositório | Tri-repo | **Monorepo** com subpastas | Médio |

---

## 2. Estratégia: Web First

A recomendação é começar pelo backend + painéis web simultaneamente, deixando o mobile para a segunda metade. O app mobile é consumidor de dados que só existem após os painéis web permitirem cadastro de médicos, agendas e preços. As APIs amadurecem no consumo web antes de o mobile entrar. Bugs de regra de negócio são corrigidos antes da fase mobile.

O Django Admin serve como acelerador nas primeiras semanas — a equipe popula dados, testa models e valida relacionamentos antes do frontend estar pronto. Os convênios são clientes pagantes B2B: entregar painéis web primeiro permite comercialização e onboarding piloto enquanto o app ainda está em desenvolvimento.

---

## 3. Arquitetura Geral

Consulte o `CLAUDE.md` da raiz para diagrama de comunicação completo e estrutura do monorepo. A arquitetura segue three-tier com monolito modular Django, API-First, e dual task system (django.tasks + Celery).

---

## 3.1 API Code Generation (Kubb Pipeline)

O projeto adota **geração automática de código** para eliminar boilerplate e garantir type-safety end-to-end entre backend e consumidores (frontend + mobile).

### Pipeline

O fluxo é unidirecional e determinístico. O backend Django define o contrato da API via serializers e views anotados com `@extend_schema` (drf-spectacular). O drf-spectacular exporta um schema OpenAPI 3.x para `shared/schema.yaml`. O Kubb consome esse schema e gera automaticamente 7 categorias de código TypeScript na pasta `shared/gen/`, que é importada tanto pelo frontend (Next.js 16) quanto pelo mobile (React Native/Expo) via path alias `@api/*`.

```
Django Serializers + @extend_schema
        │
        ▼
drf-spectacular → schema.yaml (OpenAPI 3.x)
        │
        ▼
Kubb (7 plugins) → shared/gen/
        │
        ├── types/     → TypeScript interfaces e enums
        ├── zod/       → Zod schemas (validação runtime)
        ├── clients/   → Axios client functions type-safe
        ├── hooks/     → TanStack Query hooks (useQuery, useMutation, useSuspense)
        ├── mocks/faker/  → Faker.js mock data generators
        └── mocks/msw/   → MSW request handlers para testes
        │
        ▼
Frontend (Next.js 16) ←── @api/* ──→ Mobile (React Native)
```

### Impacto Quantificado

O Kubb elimina aproximadamente 6.900 linhas de código manual que seriam necessárias ao longo do projeto: types TypeScript para cada endpoint (request + response + query params), schemas Zod duplicados manualmente dos types, funções Axios client para cada endpoint, hooks TanStack Query com query keys, mock data para testes e MSW handlers. Sem o Kubb, cada novo endpoint demandaria ~60 minutos de boilerplate. Com o Kubb, demanda ~5 minutos (rodar `api:sync` e importar). Para os ~50 endpoints do HealthApp, isso representa uma economia de ~46 horas de desenvolvimento puro.

Além do tempo, o Kubb previne categorias inteiras de bugs: type drift entre backend e frontend (impossível, pois types são gerados do schema), query params errados (Zod valida em runtime), responses inesperados (parser Zod no client detecta imediatamente), endpoints removidos que ainda são chamados (TypeScript acusa erro de compilação).

### Regras Obrigatórias

Todo view do DRF DEVE ter `@extend_schema` com `operationId` em camelCase (ex: `listDoctors`, `createAppointment`). Sem operationId, o Kubb gera nomes automáticos ilegíveis. A configuração `COMPONENT_SPLIT_REQUEST: True` no SPECTACULAR_SETTINGS é obrigatória para separar schemas de request e response. Todo código em `shared/gen/` é auto-gerado e NUNCA deve ser editado manualmente. Customizações devem ser feitas como wrappers nos consumidores ou correções no backend.

### Integração no Timeline

A configuração do Kubb ocorre na Semana 1 junto com o setup do drf-spectacular. A primeira geração real de código (com endpoints de auth) ocorre na Semana 2. A partir da Semana 3, toda nova API já é consumida via código gerado. Na Semana 5 (início do frontend), os hooks e clients já estarão prontos para uso imediato. Na Semana 9 (início do mobile), o mobile importa os mesmos types/clients sem reescrita.

Consulte `shared/CLAUDE.md` para configuração detalhada do `kubb.config.ts`, regras de anotação do drf-spectacular, workflow de desenvolvimento e troubleshooting.

---

## 4. Fluxos de Negócio Detalhados

### 4.1 Fluxo de Agendamento Completo

O fluxo de agendamento é o core do sistema e envolve múltiplas validações, lock otimista via Redis e integração com pagamento.

**Etapa 1 — Busca de Médicos:** O paciente acessa a tela de busca no app e aplica filtros (especialidade, cidade, convênio, nome). A API `GET /api/v1/doctors/` utiliza django-filter para aplicar filtros no queryset, pg_trgm para busca textual fuzzy e select_related/prefetch_related para evitar N+1 queries. Resultados incluem rating médio, preço da consulta e próximo horário disponível.

**Etapa 2 — Seleção de Horário:** Ao selecionar um médico, o app chama `GET /api/v1/doctors/{id}/slots/?date=2026-03-15`. O AvailabilityService no backend calcula slots disponíveis cruzando DoctorSchedule (agenda semanal) menos Appointments existentes (status ≠ cancelled) menos ScheduleExceptions (férias, bloqueios). Resultado: lista de horários livres com duração.

**Etapa 3 — Lock Temporário:** Ao confirmar data/hora, `POST /api/v1/appointments/` cria um lock no Redis com chave `appointment:lock:{doctor_id}:{date}:{time}` e TTL de 10 minutos. Se outro paciente tentar o mesmo slot, recebe HTTP 409 Conflict. O appointment é criado com status `pending`.

**Etapa 4 — Pagamento:** O app exibe a tela de pagamento com duas opções: PIX (QR code + código copia-e-cola, expiração de 30 minutos) ou cartão de crédito (Stripe Payment Intent via SDK nativo). O backend chama `POST /api/v1/payments/create-intent/` ou `POST /api/v1/payments/pix/generate/`.

**Etapa 5 — Confirmação:** Para cartão, a confirmação é síncrona via Stripe SDK. Para PIX, o paciente paga via app bancário e o Stripe envia webhook `POST /api/v1/webhooks/stripe/` com evento `payment_intent.succeeded`. O backend atualiza Payment.status para `completed` e Appointment.status para `confirmed`.

**Etapa 6 — Notificações:** Tasks assíncronas disparam: email de confirmação com detalhes, push notification ao paciente, e agenda lembretes automáticos: 48h antes (email), 24h antes (push), 2h antes (push + SMS), 30min antes (push final).

**Etapa 7 — Timeout:** Se o pagamento não for confirmado em 30 minutos, o Celery beat executa task periódica que atualiza Payment.status para `failed`, Appointment.status para `cancelled`, remove o lock do Redis e libera o slot.

### 4.2 Fluxo de Pagamento PIX

PIX é o método dominante no Brasil (93% dos adultos possuem chave PIX). O fluxo via Stripe: backend cria Payment Intent com `payment_method_types=["pix"]`. O Stripe retorna `pix_display_qr_code` (base64) e `pix_copy_and_paste` (string). O app exibe ambas opções. O processamento é quase instantâneo (segundos). Webhook confirma. Backend atualiza status e dispara notificações. Alternativas com taxas menores (Asaas 0.99%, Mercado Pago 1.99%) podem ser avaliadas pós-lançamento.

### 4.3 Fluxo do Convênio

O admin do convênio acessa o painel web Next.js com login (2FA opcional). Dashboard exibe KPIs em tempo real: agendamentos do mês, receita, taxa de ocupação, taxa de cancelamento, comparativo mensal. O admin pode cadastrar médicos, configurar agendas semanais, criar exceções (feriados, férias), gerenciar tipos de exames, definir tabela de preços, e visualizar agendamentos com filtros e exportação CSV/PDF.

### 4.4 Fluxo do Owner

O owner acessa o painel master com 2FA obrigatório (TOTP). Dashboard executivo mostra KPIs globais: usuários ativos, total de convênios, agendamentos (diário/semanal/mensal), receita total, ticket médio, churn de convênios, NPS. Pode navegar por cada convênio individualmente, suspender inadimplentes, acessar relatórios com reconciliação Stripe vs interno, visualizar logs de auditoria LGPD, e configurar parâmetros globais (taxas, limites, políticas de cancelamento).

---

## 5. Painéis Web — Telas

### 5.1 Painel do Convênio

**Dashboard:** KPIs com gráficos interativos (Recharts): agendamentos por período, receita mensal, taxa de ocupação por médico, taxa de cancelamento. Cards com métricas e comparativo mensal. Cache Components para dados lentos.

**Médicos:** Tabela com listagem, filtros e busca. Modal de criação/edição (React Hook Form + Zod). Upload de foto. Visualização de agenda e histórico.

**Agendas:** Calendário interativo para configurar horários semanais por médico. Drag-and-drop para ajustar blocos. Views diária, semanal e mensal.

**Exceções de Agenda:** Cadastro de feriados, férias e bloqueios pontuais. Date range picker. Aplicação individual ou em massa.

**Tipos de Exames:** CRUD com tabela, descrição, instruções de preparo, duração estimada e preço. Status ativo/inativo.

**Tabela de Preços:** Valores por tipo de consulta e exame. Histórico de alterações. Suporte a promoções temporárias.

**Agendamentos:** Listagem com filtros por médico, status, data e tipo. Ações: confirmar, cancelar, marcar no-show. Detalhes com dados do paciente e pagamento.

**Financeiro:** Relatórios de receita por período, médico, tipo. Gráfico de evolução. Status de pagamentos. Exportação CSV e PDF.

**Configurações:** Dados do convênio (nome, CNPJ, logo, contato), políticas de cancelamento, configurações de notificações.

### 5.2 Painel do Owner

**Dashboard Executivo:** KPIs globais com gráficos comparativos. Tendências e projeções. updateTag() para atualizações imediatas.

**Convênios:** Listagem com filtros por status, plano e localização. Detalhes com métricas individuais. Ações: aprovar, suspender, reativar.

**Usuários:** Busca global (pacientes, médicos, admins). Detalhes com histórico. Ações administrativas (bloquear, resetar senha, anonimizar LGPD).

**Financeiro Global:** Receita total, taxa de sucesso de pagamentos, reconciliação Stripe vs interno, projeções. Breakdown por convênio e método de pagamento.

**Analytics:** Gráficos de tendência, segmentações demográficas, análise de cohorts, funil de conversão, heat map de horários.

**Logs de Auditoria:** Registro imutável via django-auditlog. Filtros por usuário, ação, data e entidade. Essencial para LGPD.

**Configurações Globais:** Taxas da plataforma, limites de agendamento, políticas de cancelamento padrão, configurações email/SMS, modo de manutenção.

---

## 6. App Mobile — Telas

**Splash + Onboarding:** Animação com branding, 3 telas de onboarding (agendamento fácil, pagamento seguro, histórico completo). Exibido apenas no primeiro acesso.

**Login / Registro:** Login com email + senha. Registro com nome, email, telefone, CPF, data de nascimento, senha. Verificação de email (OTP) e telefone (SMS). Login biométrico (Face ID / Touch ID) para acessos subsequentes.

**Home / Dashboard:** Saudação personalizada, próximo agendamento em destaque, acesso rápido a busca, últimas notificações.

**Busca de Médicos:** Busca com autocomplete (pg_trgm). Filtros por especialidade, convênio, localização (mapa) e faixa de preço. Cards com foto, nome, especialidade, rating e preço.

**Perfil do Médico:** Foto, nome, CRM, especialidade, bio, rating médio com distribuição de estrelas, comentários, botão "Agendar Consulta".

**Seleção de Horário:** Calendário horizontal com datas disponíveis. Grid de horários livres. Indicação visual de slots populares e últimas vagas.

**Confirmação + Pagamento:** Resumo do agendamento. Seleção de método: PIX (QR code + copiar código) ou cartão (Stripe Payment Sheet nativa). Termos e política de cancelamento.

**Comprovante:** Animação Lottie de sucesso, detalhes do agendamento, opção de adicionar ao calendário e compartilhar via WhatsApp.

**Meus Agendamentos:** Tabs: Próximos e Histórico. Cards com status visual (verde/amarelo/vermelho). Cancelamento rápido com confirmação.

**Detalhes do Agendamento:** Status com timeline visual, dados do médico e clínica com mapa, botão de cancelamento, comprovante de pagamento.

**Notificações:** Centro com categorias (agendamentos, pagamentos, sistema). Lido/não lido. Deep link para tela relevante.

**Avaliações:** Modal pós-consulta com 5 estrelas e campo de comentário.

**Perfil / Configurações:** Dados pessoais, histórico de pagamentos, opções LGPD (exportar, excluir conta), preferências de notificação, tema claro/escuro, logout.

---

## 7. Segurança e Conformidade LGPD

### 7.1 Autenticação e Autorização

**JWT com SimpleJWT:** Access token 15 minutos. Refresh token 7 dias com rotação automática (blacklist do anterior). httpOnly cookies (web) e SecureStore (mobile).

**RBAC:** 4 roles — patient (agendamento, pagamento, perfil), doctor (visualização de agenda própria), convenio_admin (CRUD médicos, agendas, exames, relatórios), owner (acesso total). Implementado via DRF Permissions customizadas.

**2FA:** Opcional para pacientes. Obrigatório para convenio_admin e owner. TOTP via django-otp com backup codes. QR code para Google Authenticator.

**Rate Limiting:** 100 req/min geral, 5 req/min login (brute force), 3 req/min reset senha.

### 7.2 Proteção de Dados

**Encriptação em Trânsito:** TLS 1.3 obrigatório. HSTS max-age 1 ano. Certificate pinning no mobile.

**Encriptação em Repouso:** AES-256 via django-encrypted-model-fields para CPF, CNPJ e dados médicos. PostgreSQL com pgcrypto. Backups encriptados via AWS KMS.

**Segurança Django Nativa:** CSRF protection, XSS prevention (auto-escaping), SQL injection prevention (ORM), Clickjacking protection (X-Frame-Options), Host header validation (ALLOWED_HOSTS), CSP nativo (SECURE_CSP), CORS restritivo.

### 7.3 LGPD (Lei 13.709/2018)

**Base Legal:** Dados de saúde são dados pessoais sensíveis (Art. 5, II). Tratamento fundamentado no Art. 7, VIII (tutela da saúde) complementado por consentimento explícito (Art. 11, I).

**Consentimento:** Registro granular por finalidade (agendamento, notificações, marketing). Interface clara para visualizar e revogar. Log imutável com timestamp, escopo e IP.

**Direitos do Titular (Art. 18):** Exportação de dados (JSON/PDF) via `POST /api/v1/users/me/export-data/`. Exclusão de conta via `DELETE /api/v1/users/me/` que anonimiza dados pessoais mas mantém dados transacionais por obrigação legal. Prazo máximo 15 dias.

**DPO (Encarregado):** Nomeação e canal de comunicação conforme ANPD.

**RIPD:** Relatório de Impacto à Proteção de Dados para tratamento de dados sensíveis.

**Auditoria:** django-auditlog registra todas alterações em models críticos (users, appointments, payments). Logs incluem usuário, ação, dados antes/depois, timestamp e IP. Retenção: 5 anos.

---

## 8. Infraestrutura e Deploy

### 8.1 Produção (AWS Recomendado)

ECS Fargate para containers Django + Gunicorn (min 2, max 10 com autoscaling). RDS PostgreSQL db.t3.medium com Multi-AZ. ElastiCache Redis cache.t3.small. S3 para arquivos. CloudFront CDN. Route 53 DNS. ACM para SSL/TLS gratuitos.

### 8.2 Next.js Deploy

Vercel (plataforma nativa). Deploy automático via push na main. Analytics e Web Vitals nativos.

### 8.3 CI/CD (GitHub Actions)

**Backend:** Lint (ruff), type check (mypy), testes (pytest ≥80%), build Docker, push ECR, deploy staging (develop) ou produção (main com aprovação), health check + rollback.

**Web:** Lint (ESLint), type check (tsc), testes (Vitest), build Next.js, deploy Vercel (automático).

**Mobile:** Lint (ESLint), type check (tsc), testes (Jest), build via EAS Build, submit via EAS Submit.

### 8.4 Publicação Mobile

**Apple App Store:** Apple Developer Program (US$99/ano). Revisão mais rigorosa para apps de saúde com pagamento (Guidelines 5.1.1, 5.1.3). Person-to-Person Services (3.1.3e) permite pagamento externo via Stripe sem comissão de 30%.

**Google Play:** Google Play Console (US$25 taxa única). AAB obrigatório. Data Safety Form obrigatório. Stripe é PCI DSS Level 1.

---

## 9. Cronograma Detalhado (16 Semanas)

### FASE 1: Backend Foundation (Semanas 1-4)

**Semana 1: Setup e Infraestrutura [CC]**
- Django 6.0.2 project scaffold via Claude Code (settings/base|dev|staging|prod)
- Docker Compose: PostgreSQL 16 + Redis 7.2 + MinIO (S3 local)
- CLAUDE.md configurado com todas as convenções do projeto
- CI/CD GitHub Actions: lint (ruff), type check (mypy), testes (pytest)
- SECURE_CSP configurado nativamente
- Models: CustomUser, Convenio, Doctor, DoctorSchedule, ScheduleException, ExamType
- Django Admin configurado para todos os models
- django.tasks configurado para tarefas leves
- Celery configurado para tarefas pesadas
- drf-spectacular configurado com SPECTACULAR_SETTINGS completo (tags, security, split request)
- @extend_schema com operationId em todos os views iniciais
- **Kubb setup:** kubb.config.ts com 7 plugins, package.json scripts, path alias @api/*
- **Primeira geração:** schema.yaml exportado + `npm run api:sync` funcional
- shared/CLAUDE.md com regras de código gerado

**Semana 2: Autenticação e Segurança [CC]**
- Auth completo: register, login (JWT SimpleJWT), refresh token rotation
- Forgot/reset password, verificação email (OTP), verificação phone (SMS)
- RBAC com 4 roles e custom permissions
- Rate limiting via django-ratelimit
- CORS whitelist, Swagger/OpenAPI via drf-spectacular
- CSP nativo via SECURE_CSP + ContentSecurityPolicyMiddleware
- **api:sync com auth endpoints:** primeira geração real de types, Zod schemas e hooks de auth
- Testes unitários com 80%+ cobertura

**Semana 3: APIs Core [CC]**
- Convenio APIs (CRUD + dashboard)
- Doctor APIs (CRUD + search com django-filter + pg_trgm)
- Schedule APIs (configuração semanal + exceções)
- Exam Type APIs (CRUD)
- AvailabilityService com cálculo de slots
- **api:sync completo:** types, Zod schemas, clients e hooks para doctors, convenio, schedules
- Testes unitários e integração

**Semana 4: Agendamentos, Pagamentos e Notificações [CC]**
- Appointment APIs (create com Redis lock, confirm, cancel, history)
- Rating APIs
- Owner Admin APIs (dashboard, CRUD convênios, users, audit logs)
- Notificações simples via django.tasks (email, push unitário)
- Notificações complexas via Celery (reminders batch, schedulers)
- Firebase Admin integration para push
- Stripe Payment Intent + PIX integration
- Testes de integração end-to-end das APIs

### FASE 2: Web Panels + Pagamentos (Semanas 5-8)

**Semana 5: Setup Next.js 16 + Base [CC]**
- Next.js 16 + Turbopack + Tailwind CSS 4 + Shadcn/UI
- Cache Components habilitado (cacheComponents: true)
- React Compiler habilitado (reactCompiler: true)
- proxy.ts configurado para auth e role routing
- App Router routes, layouts base (sidebar + header + content)
- Auth frontend: login, JWT storage, refresh interceptor, rotas protegidas
- TanStack Query configurado
- Turbopack File System Caching habilitado para dev
- **tsconfig.json com path alias @api/* → ../shared/gen/**
- **Todos os hooks e clients já disponíveis via Kubb (zero boilerplate)**

**Semana 6: Painel Convênio [CC]**
- Dashboard com KPIs (Recharts) + Cache Components para dados lentos
- Doctor CRUD (tabela + modal React Hook Form + Zod)
- Gerenciamento de agendas (calendário interativo)
- Tipos de exame CRUD, Tabela de preços
- View Transitions para navegação suave

**Semana 7: Painel Owner + Pagamentos [CC]**
- Dashboard executivo global
- Gestão de convênios (list + details + suspend)
- Usuários, financeiro, analytics, audit logs
- Stripe backend: Payment Intents, PIX, webhooks, refunds
- updateTag() para atualizações imediatas
- CSV/PDF export

**Semana 8: Polish e Deploy Staging**
- Relatórios financeiros nos painéis
- Telas de configurações
- Testes frontend (Vitest + React Testing Library)
- UX polish: loading states, error handling, toasts, empty states
- Activity component para pre-carregar tabs pesadas
- Backend deploy staging + Web deploy Vercel staging

### FASE 3: Mobile App (Semanas 9-13)

**Semana 9: Setup Mobile + Auth [CC]**
- Expo SDK 52 + TypeScript + React Navigation + NativeWind + Zustand + TanStack Query
- **tsconfig.json com path alias @api/* → ../shared/gen/ (mesmos types/hooks do frontend)**
- **Axios interceptor customizado para SecureStore (JWT mobile)**
- Onboarding, Login, Register, Verificação (email OTP + SMS)
- Push notifications com Firebase
- Biometrics (Face ID / Touch ID)
- EAS: Profile development configurado, primeiro build dev

**Semana 10: Telas de Busca e Médicos [CC]**
- Home/Dashboard, Doctor Search (filters + map), Doctor Profile, Time Selection

**Semana 11: Agendamento + Pagamento [CC]**
- Confirmação + Payment Sheet @stripe/stripe-react-native
- Fluxo PIX (QR code + copy), Recibo com Lottie
- EAS: Build preview para teste interno

**Semana 12: Histórico, Notificações e Perfil [CC]**
- Meus Agendamentos (upcoming + history), Detalhes, Cancelamento
- Centro de notificações, Avaliações (modal 5 estrelas)
- Perfil e configurações (dados, LGPD, preferências)

**Semana 13: Polish e Internal Testing**
- Animações (reanimated), loading skeletons, error boundaries
- Offline handling, deep linking, pull-to-refresh
- Testes unitários (Jest)
- EAS Build production: primeiro build iOS + Android
- EAS Submit: TestFlight (iOS) e Internal Testing (Android)

### FASE 4: QA + Publicação + Launch (Semanas 14-16)

**Semana 14: QA e Segurança**
- E2E testes: Cypress (web) + Detox (mobile)
- Load testing: Locust (500+ usuários simultâneos)
- Security audit (OWASP Top 10)
- LGPD compliance review
- Bug fixes críticos + performance optimization

**Semana 15: Deploy Produção + Submissão Lojas**
- Produção: DNS, SSL, CDN, monitoring (Sentry + Prometheus + Grafana)
- Backend deploy produção, Web deploy produção (Vercel)
- EAS Submit production: App Store (via TestFlight → Production) e Google Play
- Store assets (screenshots, descrição, keywords)

**Semana 16: Go-Live**
- Monitoramento pós-deploy, Bug fixes de produção
- Tracking de review das lojas (Apple e Google)
- Resubmissão se necessário
- EAS Update configurado para hotfixes OTA
- Documentação técnica e handoff
- Onboarding do primeiro convênio piloto
- Soft launch monitorado

---

## 10. Custos de Infraestrutura (Mensal)

| Serviço | Especificação | Custo (US$) |
|---|---|---|
| AWS ECS Fargate (Django) | 2 vCPU, 4GB RAM, 2 instâncias | $120-180 |
| AWS RDS PostgreSQL | db.t3.medium, 100GB, Multi-AZ | $130-200 |
| AWS ElastiCache Redis | cache.t3.small | $25-40 |
| AWS S3 | 100GB + transfer | $5-15 |
| AWS CloudFront (CDN) | 100GB transfer/mês | $10-20 |
| Vercel (Next.js 16) | Pro plan, 2 membros | $40 |
| Stripe | 2.99% + R$0.39/transação | Variável |
| Firebase (Push) | Spark/Blaze | $0-25 |
| Sentry | Team plan | $26 |
| SendGrid/SES (Email) | 100k emails/mês | $15-30 |
| Twilio/Zenvia (SMS) | 1000 SMS/mês | $20-50 |
| EAS Build (Expo) | Production plan | $99 |
| Apple Developer | Annual (rateado) | $8 |
| Google Play | One-time (rateado) | $2 |
| Domínio + SSL | Annual (rateado) | $5 |
| GitHub Teams | 4 seats | $16 |
| Claude Code | Max plan (Anthropic) | $100-200 |
| **TOTAL** | | **$620-960/mês** |

---

## 11. Métricas de Sucesso e KPIs

| Métrica | Meta | Frequência | Ferramenta |
|---|---|---|---|
| Taxa de No-Show | < 15% | Semanal | Dashboard Owner |
| Conversão de Agendamento | > 60% | Semanal | Analytics |
| NPS (Net Promoter Score) | > 50 | Mensal | Pesquisa in-app |
| Tempo Médio de Booking | < 3 minutos | Diário | Analytics |
| Uptime da Plataforma | > 99.5% | Diário | Prometheus/Grafana |
| Response Time API (P95) | < 300ms | Diário | Sentry/Grafana |
| Taxa Sucesso Pagamento | > 95% | Semanal | Stripe Dashboard |
| Churn de Convênios | < 5%/mês | Mensal | Dashboard Owner |
| Rating App Store | > 4.5 estrelas | Mensal | App Store/Play Console |
| Retenção D30 | > 40% | Mensal | Firebase Analytics |

---

## 12. Roadmap Pós-Lançamento

### 12.1 V2 (3-6 meses pós-lançamento)

- **Prontuário Eletrônico Básico:** Histórico de consultas com notas, prescrições e resultados. Encriptação end-to-end.
- **Programa de Fidelidade:** Pontos por consulta, trocáveis por descontos. Gamificação com níveis e badges.
- **Chat Interno:** Comunicação paciente-clínica para dúvidas pré e pós-consulta.
- **Multi-idioma:** Suporte a espanhol e inglês.
- **App do Médico:** App dedicado para gerenciar agendas e visualizar pacientes do dia.

### 12.2 V3 (6-12 meses pós-lançamento)

- **IA para Otimização de Agenda:** ML para prever no-shows e realocar slots automaticamente.
- **Integração com Wearables:** Apple Health, Google Fit para monitoramento complementar.
- **Marketplace de Saúde:** Pacotes de check-up, planos de acompanhamento.
- **API Pública:** Permitir integração de convênios com seus sistemas internos.
- **White Label:** Plataforma como solução white-label para redes de clínicas.

---

## 13. Equipe com Claude Code

| Papel | Senioridade | Dedicação | Função |
|---|---|---|---|
| Tech Lead / Full Stack | Senior | Full-time | Arquitetura, dev com Claude Code, code review |
| Full Stack Dev | Mid/Senior | Full-time | Dev assistido por Claude Code, backend + frontend |
| Mobile Dev | Mid/Senior | Sem. 9-16 | App React Native, EAS Build/Submit |
| UI/UX Designer | Mid | Part-time | Protótipos, design system, telas |
| QA Engineer | Mid | Sem. 13-16 | QA manual e automatizado, E2E, load testing |

**Total:** 2-3 FTEs + 2 part-time (redução de ~50% vs v2 que previa 7 FTEs).

---

*Fim do Plano de Desenvolvimento v3.0 Consolidado*
