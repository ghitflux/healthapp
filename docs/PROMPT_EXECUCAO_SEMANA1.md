# HealthApp — Prompt de Execução Inicial + Semana 1

> **Objetivo:** Este documento é o ponto de entrada para iniciar o desenvolvimento do HealthApp.
> Ele contém o prompt de bootstrap do projeto (scaffold completo) seguido do detalhamento
> task-by-task da Semana 1, pronto para execução via Claude Code.
>
> Pré-requisito: Leitura completa do `CLAUDE.md` raiz e do `CLAUDE.md` do backend.

---

## PARTE 1 — PROMPT DE EXECUÇÃO INICIAL (Bootstrap)

### 1.1 Contexto do Projeto

```
Você é um engenheiro de software senior especializado em Django, DRF, Next.js e React Native.

Estamos iniciando o HealthApp, uma plataforma de gestão de saúde para o mercado brasileiro
que conecta 3 stakeholders: Convênios (clínicas/hospitais), Pacientes e o Owner (dono do SaaS).

Estrutura: Monorepo com subpastas backend/, frontend/, mobile/, docs/.
Estratégia: Web First — backend + painéis web primeiro (semanas 1-8), mobile depois (9-16).

Leia os arquivos CLAUDE.md na raiz e em cada subpasta para entender todas as convenções,
padrões de código, arquitetura e regras antes de escrever qualquer código.
```

### 1.2 Prompt de Bootstrap — Django Backend

```
Crie o scaffold completo do backend Django 6.0.2 para o HealthApp seguindo EXATAMENTE
as convenções do CLAUDE.md do backend. Execute cada passo na sequência:

PASSO 1 — Estrutura de Diretórios:
healthapp/
├── backend/
│   ├── manage.py
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   ├── staging.txt
│   │   └── production.txt
│   ├── config/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── wsgi.py
│   │   ├── urls.py
│   │   └── settings/
│   │       ├── __init__.py
│   │       ├── base.py
│   │       ├── development.py
│   │       ├── staging.py
│   │       └── production.py
│   ├── apps/
│   │   ├── __init__.py
│   │   ├── core/              # BaseModel, utils, exceptions, mixins
│   │   ├── users/             # CustomUser, auth, RBAC, 2FA
│   │   ├── convenios/         # Convenio model, admin panel APIs
│   │   ├── doctors/           # Doctor, DoctorSchedule, ScheduleException
│   │   ├── appointments/      # Appointment, availability, booking flow
│   │   ├── payments/          # Payment, Stripe integration, PIX
│   │   └── notifications/     # Notification, email, push, SMS
│   ├── docker/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── entrypoint.sh
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── pyproject.toml          # ruff, mypy, pytest config
│   ├── .env.example
│   └── .github/
│       └── workflows/
│           └── backend-ci.yml
│
├── shared/                     # Kubb code generation layer
│   ├── CLAUDE.md               # Instruções — NUNCA editar shared/gen/
│   ├── schema.yaml             # OpenAPI 3.x (gerado pelo drf-spectacular)
│   └── gen/                    # Auto-gerado pelo Kubb (NÃO EDITAR)
│       ├── types/
│       ├── zod/
│       ├── clients/
│       ├── hooks/
│       ├── mocks/
│       └── index.ts
│
├── kubb.config.ts              # Configuração Kubb (7 plugins)
├── package.json                # Scripts: api:sync, schema:export, generate:api
└── tsconfig.base.json          # Path alias @api/* para shared/gen/

PASSO 2 — requirements/base.txt:
Django==6.0.2
djangorestframework==3.15.*
djangorestframework-simplejwt==5.3.*
django-filter==24.*
django-cors-headers==4.*
django-encrypted-model-fields==0.6.*
django-auditlog==3.*
django-ratelimit==4.*
django-otp==1.5.*
drf-spectacular==0.27.*
celery[redis]==5.4.*
redis==5.0.*
psycopg[binary]==3.2.*
gunicorn==22.*
stripe==10.*
firebase-admin==6.*
Pillow==10.*
boto3==1.34.*
sentry-sdk[django]==2.*

PASSO 3 — config/settings/base.py:
Configure EXATAMENTE conforme o CLAUDE.md backend:
- INSTALLED_APPS com todas as apps + third-party
- AUTH_USER_MODEL = "users.CustomUser"
- REST_FRAMEWORK com DefaultAuthentication (JWT), DefaultPermission (IsAuthenticated),
  DefaultPagination (PageNumberPagination, page_size=20), DefaultRenderer (JSON),
  DEFAULT_SCHEMA_CLASS (AutoSchema do drf-spectacular)
- SIMPLE_JWT: access 15min, refresh 7 days, rotate=True, blacklist=True
- SECURE_CSP configurado nativamente (Django 6.0)
- DATABASE com PostgreSQL 16 via env vars
- CACHES com Redis
- CELERY_BROKER_URL e CELERY_RESULT_BACKEND via Redis
- django.tasks configurado (TASKS_BACKEND)
- CORS_ALLOWED_ORIGINS via env var
- django-auditlog habilitado
- Sentry SDK configurado via DSN env var

PASSO 4 — apps/core/:
- models.py: BaseModel abstrato com id (UUIDField pk), created_at, updated_at, is_active
- exceptions.py: BusinessLogicError(APIException), ConflictError(409), GoneError(410)
- mixins.py: TimestampMixin, SoftDeleteMixin
- pagination.py: StandardResultsSetPagination
- permissions.py: IsOwner, IsConvenioAdmin, IsDoctor, IsPatient
- utils.py: funções helper (generate_otp, mask_cpf, mask_email)

PASSO 5 — apps/users/:
- models.py: CustomUser extends AbstractUser + BaseModel
  Fields: email (unique), phone, cpf (EncryptedCharField), date_of_birth,
  role (patient|doctor|convenio_admin|owner), avatar, email_verified,
  phone_verified, is_2fa_enabled, convenio (FK nullable)
- serializers.py: UserSerializer, RegisterSerializer, LoginSerializer,
  ChangePasswordSerializer, ProfileSerializer
- views.py: RegisterView, LoginView, RefreshView, ProfileView, VerifyEmailView,
  VerifyPhoneView, ForgotPasswordView, ResetPasswordView, ExportDataView, DeleteAccountView
- services.py: AuthService, OTPService, UserService
- permissions.py: IsAccountOwner
- urls.py: todas as rotas de auth e user
- admin.py: CustomUserAdmin com fieldsets, list_display, list_filter, search_fields
- tests/: test_models.py, test_serializers.py, test_views.py, test_services.py

PASSO 6 — apps/convenios/:
- models.py: Convenio extends BaseModel
  Fields: name, cnpj (EncryptedCharField), email, phone, address, city, state,
  logo, description, owner (FK User role=owner), is_approved, approved_at
- ExamType extends BaseModel: name, description, preparation_instructions,
  duration_minutes, convenio (FK), price
- PriceTable extends BaseModel: convenio (FK), exam_type (FK), consultation_price
- serializers.py, views.py, services.py, permissions.py, urls.py, admin.py

PASSO 7 — apps/doctors/:
- models.py: Doctor extends BaseModel
  Fields: user (OneToOne User), convenio (FK), crm, specialty, bio, consultation_price,
  consultation_duration_minutes (default 30), rating_average, rating_count
- DoctorSchedule extends BaseModel: doctor (FK), day_of_week (0-6), start_time,
  end_time, slot_duration_minutes, is_active
- ScheduleException extends BaseModel: doctor (FK), date, start_time (nullable),
  end_time (nullable), is_full_day, reason
- serializers.py, views.py, services.py (AvailabilityService), urls.py, admin.py

PASSO 8 — apps/appointments/:
- models.py: Appointment extends BaseModel
  Fields: patient (FK User), doctor (FK Doctor), convenio (FK), date, start_time,
  end_time, status (pending|confirmed|completed|cancelled|no_show),
  cancellation_reason, cancelled_by (FK User nullable), notes
- Rating extends BaseModel: appointment (OneToOne), patient (FK), doctor (FK),
  score (1-5), comment, is_anonymous
- serializers.py, views.py, services.py (BookingService, AvailabilityService), urls.py

PASSO 9 — apps/payments/:
- models.py: Payment extends BaseModel
  Fields: appointment (OneToOne), patient (FK User), amount (DecimalField),
  currency (default BRL), method (credit_card|pix), status (pending|completed|failed|refunded),
  stripe_payment_intent_id, stripe_charge_id, pix_qr_code, pix_copy_paste,
  paid_at, refunded_at, refund_amount
- serializers.py, views.py (CreatePaymentIntentView, PIXGenerateView, StripeWebhookView)
- services.py (PaymentService, StripeService), urls.py

PASSO 10 — apps/notifications/:
- models.py: Notification extends BaseModel
  Fields: user (FK), title, message, type (appointment|payment|system|reminder),
  channel (email|push|sms), is_read, read_at, data (JSONField), sent_at
- tasks.py: send_email_notification (django.tasks), send_push_notification (django.tasks),
  send_sms_notification (django.tasks), send_bulk_reminders (Celery),
  cleanup_old_notifications (Celery)
- services.py (NotificationService, PushService, EmailService, SMSService)

PASSO 11 — Docker:
- docker-compose.dev.yml com services: api, postgres, redis, celery-worker, celery-beat, minio
- Dockerfile.dev com Python 3.13, requirements/development.txt
- entrypoint.sh com wait-for-it, migrate, collectstatic, runserver/gunicorn
- .env.example com todas as variáveis necessárias

PASSO 12 — CI/CD:
- .github/workflows/backend-ci.yml: ruff check, mypy, pytest --cov-fail-under=80

PASSO 13 — Django Admin:
- Todos os models registrados com admin classes customizadas
- list_display, list_filter, search_fields, readonly_fields configurados
- Inline para DoctorSchedule dentro de DoctorAdmin
- Inline para Payment dentro de AppointmentAdmin

PASSO 14 — URLs raiz:
- config/urls.py com:
  /api/v1/auth/ → users.urls (auth endpoints)
  /api/v1/users/ → users.urls (user management)
  /api/v1/convenios/ → convenios.urls
  /api/v1/doctors/ → doctors.urls
  /api/v1/appointments/ → appointments.urls
  /api/v1/payments/ → payments.urls
  /api/v1/notifications/ → notifications.urls
  /api/v1/admin-panel/ → owner admin APIs
  /api/docs/ → drf-spectacular Swagger UI
  /api/schema/ → drf-spectacular OpenAPI schema

PASSO 15 — drf-spectacular Configuration:
- SPECTACULAR_SETTINGS em config/settings/base.py com:
  TITLE: 'HealthApp API'
  VERSION: '1.0.0'
  COMPONENT_SPLIT_REQUEST: True (OBRIGATÓRIO — separa request e response schemas)
  TAGS: auth, users, doctors, appointments, payments, convenio, owner, notifications
  SECURITY: bearerAuth (JWT)
  APPEND_COMPONENTS.securitySchemes.bearerAuth
  POSTPROCESSING_HOOKS: postprocess_schema_enums
- Todo view com @extend_schema e operationId em camelCase (ex: listDoctors, createAppointment)
- Swagger UI em /api/docs/
- ReDoc em /api/redoc/
- Schema YAML em /api/schema/?format=yaml

PASSO 16 — Kubb Setup (Shared Layer):
- Na raiz do monorepo (healthapp/):
  npm init -y
  npm install -D @kubb/core @kubb/cli @kubb/plugin-oas @kubb/plugin-ts \
    @kubb/plugin-zod @kubb/plugin-client @kubb/plugin-react-query \
    @kubb/plugin-faker @kubb/plugin-msw
- Criar kubb.config.ts conforme shared/CLAUDE.md (7 plugins, agrupamento por tag)
- Criar shared/CLAUDE.md com regras de código gerado
- Adicionar scripts ao package.json:
  "schema:export": "cd backend && python manage.py spectacular --color --file ../shared/schema.yaml --validate"
  "generate:api": "kubb generate"
  "generate:watch": "kubb generate --watch"
  "api:sync": "npm run schema:export && npm run generate:api"
  "generate:debug": "kubb generate --logLevel info"
- Criar tsconfig.base.json com paths: { "@api/*": ["./shared/gen/*"] }
- Executar primeira geração: npm run api:sync
- Validar que shared/gen/ contém types/, zod/, clients/, hooks/, mocks/
- Adicionar .kubb/ ao .gitignore (mas NÃO shared/gen/)

PASSO 17 — CI/CD api-sync:
- .github/workflows/api-sync.yml que detecta mudanças em serializers/views
- Roda schema:export + generate:api + tsc --noEmit
- Auto-commit do código gerado em shared/gen/

Após criar TUDO, execute:
1. docker-compose -f docker-compose.dev.yml up -d
2. docker-compose exec api python manage.py makemigrations
3. docker-compose exec api python manage.py migrate
4. docker-compose exec api python manage.py createsuperuser --email=admin@healthapp.com
5. docker-compose exec api python manage.py test --verbosity=2
6. Confirme que http://localhost:8000/api/docs/ abre o Swagger
```

---

## PARTE 2 — SEMANA 1: TAREFAS DETALHADAS

### Dia 1 (Segunda) — Scaffold e Infraestrutura

**Tarefa 1.1 — Inicialização do Monorepo**
```
Crie a estrutura raiz do monorepo:
healthapp/
├── .gitignore (Python + Node + React Native + IDE + OS)
├── .editorconfig
├── README.md
├── CLAUDE.md (copiar do docs/)
├── backend/
├── frontend/
├── mobile/
└── docs/

Inicialize o repositório Git com:
git init
git add .
git commit -m "chore: initial monorepo scaffold"

Regras:
- Conventional Commits obrigatório desde o primeiro commit
- .gitignore deve cobrir: __pycache__, .env, node_modules, .expo, .next, *.pyc,
  .coverage, dist/, build/, *.egg-info, .DS_Store, .vscode/, .idea/
```

**Tarefa 1.2 — Django Project Scaffold**
```
Execute o prompt de bootstrap do PASSO 1 ao PASSO 3 (estrutura + requirements + settings).

Validação:
- python manage.py check deve passar sem erros
- settings.base importa sem erros
- pyproject.toml com config de ruff, mypy, pytest

Commit: "feat(backend): django 6.0.2 project scaffold with split settings"
```

**Tarefa 1.3 — Docker Compose**
```
Crie docker-compose.dev.yml com todos os services do PASSO 11.

Validação:
- docker-compose -f docker-compose.dev.yml up -d sobe todos os services
- PostgreSQL acessível na porta 5432
- Redis acessível na porta 6379
- MinIO acessível na porta 9000 (console 9001)
- API acessível na porta 8000

Commit: "feat(backend): docker compose dev environment with postgres, redis, minio"
```

### Dia 2 (Terça) — Core App + Users Model

**Tarefa 1.4 — App Core (BaseModel e Infraestrutura)**
```
Implemente o PASSO 4 completo:
- BaseModel com UUID pk, timestamps, is_active, soft delete
- Custom exceptions (BusinessLogicError 422, ConflictError 409, GoneError 410)
- Mixins reutilizáveis
- Pagination padrão (page_size=20, max=100)
- Permissions base para RBAC (IsOwner, IsConvenioAdmin, IsDoctor, IsPatient)
- Utils (generate_otp 6 dígitos, mask_cpf, mask_email)

Validação:
- Todos os imports funcionam
- ruff check apps/core/ passa
- mypy apps/core/ passa

Commit: "feat(backend): core app with base model, exceptions, permissions, utils"
```

**Tarefa 1.5 — App Users (CustomUser Model)**
```
Implemente o model CustomUser do PASSO 5:
- Extends AbstractUser + BaseModel
- Email como campo de login principal (USERNAME_FIELD = "email")
- CPF com EncryptedCharField (LGPD)
- Role com choices: patient, doctor, convenio_admin, owner
- Campos de verificação: email_verified, phone_verified, is_2fa_enabled
- Custom UserManager com create_user e create_superuser
- Django Admin configurado com fieldsets organizados

Validação:
- makemigrations cria a migration de users
- migrate executa sem erros
- createsuperuser funciona
- Django Admin mostra CustomUser com todos os campos

Commit: "feat(backend): custom user model with encrypted CPF, roles, verification"
```

### Dia 3 (Quarta) — Models Convenio + Doctor + Schedule

**Tarefa 1.6 — App Convenios (Models)**
```
Implemente os models do PASSO 6:
- Convenio com CNPJ encriptado, FK para User (owner)
- ExamType com FK para Convenio, preço, duração
- PriceTable com FKs para Convenio e ExamType
- Todos com BaseModel, __str__, Meta.ordering, Meta.verbose_name
- Django Admin com list_display, list_filter, search_fields
- Inline de ExamType dentro de ConvenioAdmin

Validação:
- makemigrations e migrate sem erros
- Django Admin mostra Convenio com inlines
- Constraints de unique_together onde necessário (convenio + exam_type na PriceTable)

Commit: "feat(backend): convenio, exam type, price table models with admin"
```

**Tarefa 1.7 — App Doctors (Models + Schedule)**
```
Implemente os models do PASSO 7:
- Doctor com OneToOne para User, FK para Convenio
- DoctorSchedule com day_of_week (0=Monday a 6=Sunday), times, slot duration
- ScheduleException para férias, feriados, bloqueios
- Validações: start_time < end_time, day_of_week 0-6
- Django Admin com DoctorSchedule inline no DoctorAdmin

Validação:
- makemigrations e migrate sem erros
- Constraint: não pode haver 2 schedules para mesmo doctor+day_of_week

Commit: "feat(backend): doctor, schedule, exception models with admin inlines"
```

### Dia 4 (Quinta) — Models Appointment + Payment + Notification

**Tarefa 1.8 — App Appointments (Models)**
```
Implemente os models do PASSO 8:
- Appointment com status machine: pending → confirmed → completed | cancelled | no_show
- Rating com OneToOne para Appointment, score 1-5
- Validações: score entre 1 e 5, start_time < end_time
- Index em: (doctor, date), (patient, status), (convenio, date)
- Django Admin com list_display incluindo patient, doctor, date, status
- Payment inline no AppointmentAdmin

Validação:
- makemigrations e migrate sem erros
- Admin mostra appointment com payment inline

Commit: "feat(backend): appointment and rating models with status workflow"
```

**Tarefa 1.9 — App Payments (Models)**
```
Implemente os models do PASSO 9:
- Payment com Stripe fields (payment_intent_id, charge_id)
- PIX fields (qr_code, copy_paste)
- Status: pending, completed, failed, refunded
- DecimalField para amount e refund_amount (max_digits=10, decimal_places=2)
- Index em: stripe_payment_intent_id, (patient, status)

Validação:
- migrate sem erros
- Admin mostra todos os campos relevantes

Commit: "feat(backend): payment model with stripe and pix support"
```

**Tarefa 1.10 — App Notifications (Models + Tasks)**
```
Implemente o PASSO 10:
- Notification model com type choices e channel choices
- JSONField para data extra (appointment_id, payment_id, etc.)
- Tasks básicas registradas (stubs por enquanto, implementação real na semana 4):
  - send_email_notification via django.tasks
  - send_push_notification via django.tasks
  - send_bulk_reminders via Celery
- Celery app configurado em config/__init__.py

Validação:
- migrate sem erros
- Celery worker conecta ao Redis
- django.tasks funcional (testar com task simples de print)

Commit: "feat(backend): notification model with django.tasks and celery stubs"
```

### Dia 5 (Sexta) — CI/CD + Admin Polish + Testes + Review

**Tarefa 1.11 — GitHub Actions CI**
```
Implemente o PASSO 12:
- .github/workflows/backend-ci.yml que roda em push/PR para develop e main
- Steps: checkout, setup-python 3.13, install deps, ruff check, mypy, pytest
- Services: postgres e redis para testes
- pytest com --cov=apps --cov-fail-under=80
- Cache de pip para acelerar CI

Validação:
- Pipeline roda localmente via act (opcional) ou push para GitHub
- Todos os checks passam

Commit: "ci(backend): github actions with ruff, mypy, pytest pipeline"
```

**Tarefa 1.12 — Django Admin Completo**
```
Refine o Django Admin (PASSO 13):
- Todos os 10+ models registrados com admin classes dedicadas
- list_display com campos relevantes (não apenas __str__)
- list_filter para filtros laterais
- search_fields para barra de busca
- readonly_fields para campos auto-gerados (uuid, timestamps)
- Inlines: DoctorSchedule em Doctor, ExamType em Convenio, Payment em Appointment
- Django Admin site header e title customizados ("HealthApp Admin")
- Ordering consistente em todos os models

Validação:
- http://localhost:8000/admin/ abre com branding customizado
- Todos os models aparecem organizados por app
- CRUD funcional para todos os models via admin

Commit: "feat(backend): polished django admin with inlines and custom branding"
```

**Tarefa 1.13 — URLs + Swagger (Sem Views Ainda)**
```
Implemente o PASSO 14 e PASSO 15:
- config/urls.py com todos os prefixes de API
- Cada app com urls.py vazio mas com app_name definido
- drf-spectacular SPECTACULAR_SETTINGS configurado:
  TITLE: 'HealthApp API'
  VERSION: '1.0.0'
  COMPONENT_SPLIT_REQUEST: True (CRÍTICO para Kubb)
  TAGS: auth, users, doctors, appointments, payments, convenio, owner, notifications
  SECURITY: bearerAuth (JWT)
  APPEND_COMPONENTS.securitySchemes.bearerAuth
  POSTPROCESSING_HOOKS: postprocess_schema_enums
- Swagger UI em /api/docs/
- ReDoc em /api/redoc/
- Schema YAML export em /api/schema/?format=yaml

Validação:
- http://localhost:8000/api/docs/ abre o Swagger UI (mesmo que vazio de endpoints)
- http://localhost:8000/api/redoc/ abre o ReDoc
- python manage.py spectacular --validate --color não gera erros
- python manage.py spectacular --file ../shared/schema.yaml exporta o schema

Commit: "feat(backend): api url routing with drf-spectacular swagger and openapi export"
```

**Tarefa 1.14 — Kubb Setup (Shared Layer)**
```
Implemente o PASSO 16 — setup completo da camada shared e Kubb:

1. Na raiz do monorepo (healthapp/), inicialize o package.json:
   npm init -y

2. Instale dependências de dev do Kubb:
   npm install -D @kubb/core @kubb/cli @kubb/plugin-oas @kubb/plugin-ts \
     @kubb/plugin-zod @kubb/plugin-client @kubb/plugin-react-query \
     @kubb/plugin-faker @kubb/plugin-msw

3. Crie kubb.config.ts na raiz conforme shared/CLAUDE.md:
   - input: './shared/schema.yaml'
   - output: './shared/gen' com clean: true e barrelType: 'named'
   - 7 plugins: pluginOas, pluginTs, pluginZod, pluginClient, pluginReactQuery,
     pluginFaker, pluginMsw
   - Todos agrupados por tag
   - enumType: 'asConst', dateType: 'string'
   - client: 'axios' com parser: 'zod'
   - suspense habilitado para React 19.2

4. Adicione scripts ao package.json:
   "schema:export": "cd backend && python manage.py spectacular --color --file ../shared/schema.yaml --validate",
   "generate:api": "kubb generate",
   "generate:watch": "kubb generate --watch",
   "api:sync": "npm run schema:export && npm run generate:api",
   "generate:debug": "kubb generate --logLevel info"

5. Crie tsconfig.base.json na raiz:
   { "compilerOptions": { "paths": { "@api/*": ["./shared/gen/*"] } } }

6. Crie shared/CLAUDE.md (copiar de docs/ — já existe o template)

7. Adicione ao .gitignore:
   .kubb/
   node_modules/
   # NÃO adicionar shared/gen/ — código gerado é commitado

8. Execute a primeira geração:
   npm run api:sync

Validação:
- shared/schema.yaml existe e é OpenAPI 3.x válido
- shared/gen/ contém subpastas: types/, zod/, clients/, hooks/, mocks/
- shared/gen/index.ts existe (barrel file)
- npm run generate:api roda sem erros
- Código gerado reflete os models/serializers criados até agora (mesmo que empty endpoints)

Commit: "feat(shared): kubb code generation setup with 7 plugins and api:sync pipeline"
```

**Tarefa 1.15 — CI/CD api-sync Workflow**
```
Implemente o PASSO 17 — GitHub Actions para auto-sync:
- .github/workflows/api-sync.yml que roda em push/PR quando detecta mudanças em:
  backend/apps/**/serializers.py
  backend/apps/**/views.py
  backend/apps/**/urls.py
- Steps:
  1. Checkout repo
  2. Setup Python 3.13 + Node.js 20
  3. Install Python deps + npm deps
  4. Start PostgreSQL + Redis (services)
  5. Run migrations
  6. Export schema: npm run schema:export
  7. Generate API code: npm run generate:api
  8. Auto-commit changes in shared/gen/**

Validação:
- Workflow YAML é válido (act --list)
- Pipeline lógico: detecta mudanças em serializers → regenera código gerado

Commit: "ci(shared): api-sync github action for automatic code generation"
```

**Tarefa 1.16 — Testes Unitários Iniciais**
```
Crie testes para os models criados:
- tests/test_models.py em cada app
- Testar criação de cada model com dados válidos
- Testar validações (campos obrigatórios, constraints)
- Testar __str__ de cada model
- Testar BaseModel (uuid gerado, timestamps preenchidos)
- Testar CustomUser (create_user, create_superuser, role assignment)
- Factory classes com factory-boy para cada model

Validação:
- pytest --cov=apps --cov-fail-under=80 passa
- Todos os testes verdes

Commit: "test(backend): unit tests for all models with factory-boy"
```

**Tarefa 1.17 — Seed Data**
```
Crie management command para popular dados de teste:
- python manage.py seed_data
- Cria: 1 owner, 2 convênios, 5 médicos (com schedules), 10 pacientes,
  20 appointments (variados status), 15 payments, 30 notifications, 10 ratings
- Dados realistas com nomes brasileiros, CPFs válidos, CRMs válidos
- Usar factory-boy ou fixtures JSON

Validação:
- seed_data executa sem erros
- Django Admin mostra todos os dados populados
- Dados fazem sentido (appointments têm payments, ratings têm appointments)

Commit: "feat(backend): seed data command with realistic brazilian test data"
```

---

## PARTE 3 — CHECKLIST DE ENTREGA SEMANA 1

### Critérios de Aceitação (Definition of Done)

```
□ Monorepo inicializado com .gitignore, .editorconfig, CLAUDE.md
□ Django 6.0.2 project com split settings (base/dev/staging/prod)
□ Docker Compose funcional (api + postgres + redis + minio + celery)
□ 7 apps criadas: core, users, convenios, doctors, appointments, payments, notifications
□ 10+ models com migrations executadas sem erros
□ Todos os models com Django Admin configurado (inlines, filters, search)
□ EncryptedCharField em CPF e CNPJ (LGPD)
□ django-auditlog habilitado em models críticos
□ SECURE_CSP configurado nativamente (Django 6.0)
□ django.tasks configurado para tarefas leves
□ Celery configurado para tarefas pesadas
□ GitHub Actions CI: ruff + mypy + pytest ≥80%
□ drf-spectacular com SPECTACULAR_SETTINGS completo (tags, security, COMPONENT_SPLIT_REQUEST)
□ drf-spectacular Swagger UI em /api/docs/
□ Schema export funcional: python manage.py spectacular --file ../shared/schema.yaml --validate
□ Kubb instalado com 7 plugins (@kubb/plugin-oas, ts, zod, client, react-query, faker, msw)
□ kubb.config.ts configurado com agrupamento por tag e parser: 'zod'
□ npm run api:sync funcional (export + generate sem erros)
□ shared/gen/ contém types/, zod/, clients/, hooks/, mocks/
□ shared/CLAUDE.md com regras de código gerado
□ tsconfig.base.json com path alias @api/* → shared/gen/*
□ GitHub Actions api-sync workflow configurado
□ Seed data com dados realistas brasileiros
□ Todos os commits seguem Conventional Commits
□ ruff check passa sem warnings
□ mypy passa sem erros
□ pytest --cov-fail-under=80 passa
```

### Métricas de Qualidade Esperadas

```
Cobertura de testes: ≥ 80%
Warnings do ruff: 0
Erros do mypy: 0
Models criados: ≥ 10
Migrations: todas aplicadas
Docker services: 6 (api, postgres, redis, celery-worker, celery-beat, minio)
Kubb plugins: 7 (oas, ts, zod, client, react-query, faker, msw)
Schema export: funcional (shared/schema.yaml válido)
Code generation: funcional (shared/gen/ populado)
Tarefas totais: 17
Tempo estimado: 5 dias (40h)
```

---

## PARTE 4 — COMANDOS DE REFERÊNCIA RÁPIDA

### Desenvolvimento Local

```bash
# Subir ambiente
cd backend/
docker-compose -f docker-compose.dev.yml up -d

# Logs da API
docker-compose -f docker-compose.dev.yml logs -f api

# Shell Django
docker-compose exec api python manage.py shell_plus

# Criar migrations
docker-compose exec api python manage.py makemigrations

# Aplicar migrations
docker-compose exec api python manage.py migrate

# Rodar testes
docker-compose exec api pytest --cov=apps --cov-fail-under=80 -v

# Lint
docker-compose exec api ruff check apps/

# Type check
docker-compose exec api mypy apps/

# Seed data
docker-compose exec api python manage.py seed_data

# Criar superuser
docker-compose exec api python manage.py createsuperuser

# Reset banco (dev only)
docker-compose exec api python manage.py flush --no-input
docker-compose exec api python manage.py migrate
docker-compose exec api python manage.py seed_data
```

### Kubb / API Sync

```bash
# Exportar schema OpenAPI do Django (requer Django rodando)
npm run schema:export

# Gerar código TypeScript com Kubb
npm run generate:api

# Pipeline completo (export + generate)
npm run api:sync

# Watch mode (dev ativo — backend + frontend simultâneo)
npm run generate:watch

# Debug (gera logs detalhados em .kubb/)
npm run generate:debug

# Validar schema sem gerar código
cd backend && python manage.py spectacular --validate --color

# Ver schema no navegador
open http://localhost:8000/api/docs/        # Swagger UI
open http://localhost:8000/api/redoc/       # ReDoc
open http://localhost:8000/api/schema/      # Schema YAML raw
```

### Git Workflow

```bash
# Branch naming
git checkout -b feat/backend-scaffold
git checkout -b feat/user-model
git checkout -b feat/doctor-schedule

# Commit pattern (Conventional Commits)
git commit -m "feat(backend): description"
git commit -m "fix(backend): description"
git commit -m "test(backend): description"
git commit -m "ci(backend): description"
git commit -m "docs: description"
git commit -m "chore: description"

# PR flow
git push origin feat/backend-scaffold
# Create PR → develop
# CI must pass
# Merge via squash
```

---

## PARTE 5 — TRANSIÇÃO PARA SEMANA 2

Ao concluir a Semana 1 com todos os critérios de aceitação atendidos, a Semana 2 foca em:

**Semana 2: Autenticação e Segurança** — Serializers, Views e Services para o fluxo completo de auth (register, login, JWT, refresh, forgot/reset password, email/phone verification, RBAC enforcement, rate limiting, Swagger com endpoints documentados, testes de integração).

O backend terá models estáveis, infraestrutura rodando, e CI verde — base sólida para construir os endpoints REST da semana 2.

**Importante para Kubb:** Na semana 2, cada view criado DEVE ter `@extend_schema` com `operationId` em camelCase. Ao final de cada dia, executar `npm run api:sync` para manter `shared/gen/` atualizado. Os hooks e types de auth gerados na semana 2 serão os primeiros a serem consumidos pelo frontend na semana 5. A disciplina de `api:sync` a cada mudança de contrato começa aqui e se torna rotina permanente.

---

*Fim do Prompt de Execução Inicial + Semana 1*
