# CLAUDE.md — Backend API (Django 6.0.2 + DRF 3.15)

> **Documento de referência completo para Claude Code — Backend.**
> Contém todas as regras, padrões e convenções para CADA app do backend.
> Leia COMPLETAMENTE antes de modificar qualquer arquivo nesta pasta.

---

## 1. Stack e Versões Exatas

| Componente | Versão | Função |
|---|---|---|
| Django | **6.0.2** | Framework web, ORM, admin, migrations |
| DRF | **3.15** | Serialização, ViewSets, permissions, throttling |
| SimpleJWT | **5.3** | Access 15min / Refresh 7 dias / Rotação / Blacklist |
| drf-spectacular | **0.27** | OpenAPI 3.x → input para Kubb code generation |
| django-filter | **24** | Filtros automáticos nas APIs |
| django-cors-headers | **4.4** | CORS para web e mobile |
| django-encrypted-model-fields | **0.6** | AES-256 para CPF/CNPJ/dados saúde (LGPD) |
| django-auditlog | **3.0** | Logs imutáveis (LGPD compliance) |
| django-ratelimit | **4** | Rate limiting por endpoint |
| django-otp | **1.5** | 2FA (TOTP) |
| Celery | **5.4** | Tasks pesadas (relatórios PDF, batch, schedulers) |
| Redis | **7.2** | Cache, broker Celery, locks distribuídos |
| PostgreSQL | **16** | Banco relacional + pgcrypto, pg_trgm, uuid-ossp |
| Python | **3.13** | Mínimo 3.12 (exigido pelo Django 6.0) |
| Stripe | **10.0** | Pagamentos (cartão + PIX) |
| Firebase Admin | **6.5** | FCM push notifications |

---

## 2. Estrutura de Pastas

```
backend/
├── manage.py
├── pyproject.toml                  # ruff, mypy, pytest config
├── .env.example
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   ├── staging.txt
│   └── production.txt
├── config/
│   ├── __init__.py                 # Importa celery_app
│   ├── celery.py                   # Configuração Celery
│   ├── urls.py                     # URL routing principal
│   ├── wsgi.py / asgi.py
│   └── settings/
│       ├── base.py                 # Settings compartilhados
│       ├── development.py          # DEBUG=True, BrowsableAPI
│       ├── staging.py
│       └── production.py
├── apps/
│   ├── core/                       # BaseModel, exceptions, permissions
│   ├── users/                      # CustomUser, Auth, RBAC
│   ├── convenios/                  # Convenio, ExamType
│   ├── doctors/                    # Doctor, Schedule, Availability
│   ├── appointments/               # Appointment, Rating, Booking
│   ├── payments/                   # Payment, Stripe, PIX
│   └── notifications/              # Notification, Push, Email, SMS
├── docker/
│   ├── Dockerfile / Dockerfile.dev
│   └── entrypoint.sh
└── docker-compose.dev.yml
```

---

## 3. Convenções Globais Obrigatórias

### 3.1 Banco de Dados — NUNCA SQLite

**SEMPRE PostgreSQL via Docker.** O SQLite não é permitido em nenhuma circunstância.

### 3.2 Models — Herança e Campos Padrão

Todo model herda de `BaseModel` (apps/core/models.py):
- `id` — UUIDField primary key (automático)
- `created_at` — DateTimeField auto_now_add (automático)
- `updated_at` — DateTimeField auto_now (automático)
- `deleted_at` — DateTimeField nullable (soft delete)

Obrigatório em todo model:
- `__str__` descritivo
- `Meta.ordering` definido
- `Meta.verbose_name` e `Meta.verbose_name_plural`
- Indexes explícitos para queries frequentes
- Campos sensíveis com `EncryptedCharField` (CPF, CNPJ, dados médicos)

### 3.3 Views — @extend_schema Obrigatório

TODO view DEVE ter `@extend_schema` com:
- `operation_id` — camelCase, OBRIGATÓRIO
- `tags` — OBRIGATÓRIO
- `summary` — Recomendado
- `responses` — OBRIGATÓRIO para actions customizadas

**Convenção de operationId:**

| Ação | Pattern | Exemplo |
|---|---|---|
| List | `list{Resource}s` | `listDoctors` |
| Retrieve | `get{Resource}ById` | `getDoctorById` |
| Create | `create{Resource}` | `createAppointment` |
| Update (full) | `update{Resource}` | `updateConvenioSettings` |
| Update (partial) | `patch{Resource}` | `patchUserProfile` |
| Delete | `delete{Resource}` | `deleteNotification` |
| Custom action | `{verb}{Resource}{Action}` | `getDoctorSlots`, `cancelAppointment` |
| Dashboard | `get{Panel}Dashboard` | `getConvenioDashboard` |

### 3.4 Services — Lógica de Negócio

Views são **thin** — apenas validam input e retornam response. Toda lógica vai em `services.py`.

### 3.5 API Response Format

```json
{"status": "success", "data": {...}, "meta": {"page": 1, "per_page": 20, "total": 150, "total_pages": 8}}
```

Erros: `{"status": "error", "code": 400, "errors": [{"detail": "Error message"}]}`

### 3.6 Código Python

- PEP 8 via ruff (line_length=120)
- Type hints obrigatórios em funções públicas
- snake_case para variáveis/funções, PascalCase para classes
- Imports absolutos: `from apps.core.models import BaseModel`
- Testes: pytest + factory-boy, mínimo 80% cobertura

### 3.7 Git

Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`

---

## 4. Segurança (LGPD + OWASP)

### 4.1 RBAC — 4 Roles

| Role | Acesso |
|---|---|
| `patient` | Agendamento, pagamento, perfil, notificações |
| `doctor` | Visualização de agenda própria, pacientes |
| `convenio_admin` | CRUD médicos, agendas, exames, relatórios do convênio |
| `owner` | Acesso total — gestão global |

### 4.2 Rate Limiting

| Endpoint | Limite |
|---|---|
| Geral (autenticado) | 100 req/min |
| Login | 5 req/min |
| Reset senha | 3 req/min |

### 4.3 LGPD

- CPF/CNPJ SEMPRE encriptados (EncryptedCharField)
- `UserService.anonymize_user()` — anonimiza dados (Art. 18)
- `UserService.export_user_data()` — exporta dados (JSON)
- `django-auditlog` em models críticos
- ForgotPassword NUNCA revela se email existe

---

## 5. Regras Detalhadas por App

### 5.1 apps/core/

**Responsabilidade:** Infraestrutura compartilhada — NUNCA models concretos, views ou serializers.

| Arquivo | Conteúdo |
|---|---|
| `models.py` | `BaseModel` (UUID pk, timestamps, soft delete), `SoftDeleteManager`, `AllObjectsManager` |
| `exceptions.py` | `BusinessLogicError` (422), `ConflictError` (409), `GoneError` (410), `custom_exception_handler` |
| `mixins.py` | `TimestampMixin`, `SoftDeleteMixin` |
| `pagination.py` | `StandardResultsSetPagination` (page_size=20, max=100, envelope padrão) |
| `permissions.py` | `IsOwner`, `IsConvenioAdmin`, `IsDoctor`, `IsPatient`, `IsOwnerOrConvenioAdmin` |
| `utils.py` | `generate_otp(6)`, `mask_cpf`, `mask_email`, `validate_cpf` |

### 5.2 apps/users/

**Responsabilidade:** CustomUser, autenticação JWT, verificação email/phone, LGPD.

**Model CustomUser:**
- `email` (unique, USERNAME_FIELD), `phone` (unique), `full_name`
- `cpf` (EncryptedCharField — LGPD)
- `date_of_birth`, `gender`, `avatar_url`
- `role` (patient | doctor | convenio_admin | owner)
- `email_verified`, `phone_verified`, `is_2fa_enabled`
- `convenio` (FK nullable — para convenio_admin e doctor)
- `is_staff`, `is_active`, `date_joined`, `last_login`, `deleted_at`

**Serializers:** `RegisterSerializer`, `LoginSerializer`, `UserSerializer`, `ProfileSerializer`, `ChangePasswordSerializer`, `ForgotPasswordSerializer`, `ResetPasswordSerializer`, `VerifyEmailSerializer`, `VerifyPhoneSerializer`

**Services:** `AuthService` (register, login), `OTPService` (generate/verify email/phone OTP via Redis cache 5min), `UserService` (anonymize, export)

**operationIds:** `registerUser`, `loginUser`, `refreshToken`, `getUserProfile`, `patchUserProfile`, `deleteUserAccount`, `changePassword`, `forgotPassword`, `resetPassword`, `verifyEmail`, `verifyPhone`, `exportUserData`

**auditlog:** Registrado no `apps.py`

### 5.3 apps/convenios/

**Responsabilidade:** Convênios (healthcare providers), planos, tipos de exame, dashboard KPIs.

**Model Convenio:** `name`, `cnpj` (encrypted), `logo_url`, `description`, `contact_email`, `contact_phone`, `address` (JSON), `settings` (JSON), `subscription_plan`, `subscription_status`, `is_active`, `is_approved`

**Model ConvenioPlan:** `name`, `price`, `features` (JSON), `max_doctors`, `is_active`

**Model ExamType:** `convenio` (FK), `name`, `description`, `preparation`, `duration_minutes`, `price`, `is_active` — unique_together: (convenio, name)

**Permissões:** Owner cria/deleta convênios. ConvenioAdmin e Owner editam/listam.

**operationIds:** `listConvenios`, `getConvenioById`, `createConvenio`, `patchConvenioSettings`, `getConvenioDashboard`, `listExamTypes`, `createExamType`, `patchExamType`, `deleteExamType`

### 5.4 apps/doctors/

**Responsabilidade:** Médicos, agendas semanais recorrentes, exceções, cálculo de slots.

**Model Doctor:** `user` (1:1), `convenio` (FK), `crm`+`crm_state` (unique_together), `specialty` (indexed), `subspecialties` (ArrayField), `bio`, `consultation_duration`, `consultation_price`, `rating`, `total_ratings`, `is_available`

**Model DoctorSchedule:** `doctor` (FK), `weekday` (0-6), `start_time`, `end_time`, `slot_duration`, `is_active` — unique_together: (doctor, weekday, start_time)

**Model ScheduleException:** `doctor` (FK), `date`, `start_time`, `end_time`, `is_full_day`, `is_available`, `reason`

**AvailabilityService.get_available_slots(doctor, date):**
1. Verifica exceções de dia inteiro → retorna [] se bloqueado
2. Obtém schedules para o weekday
3. Gera slots possíveis (start_time → end_time, incremento slot_duration)
4. Subtrai appointments existentes (status ≠ cancelled)
5. Subtrai exceções parciais
6. Retorna [{time, duration_minutes, is_available}]

**Permissões:** List/retrieve/slots são públicos (AllowAny). CRUD de schedules/exceptions requer IsConvenioAdmin.

**operationIds:** `listDoctors`, `getDoctorById`, `getDoctorSlots`, `listDoctorSchedules`, `createDoctorSchedule`, `patchDoctorSchedule`, `deleteDoctorSchedule`, `listScheduleExceptions`, `createScheduleException`, `deleteScheduleException`

### 5.5 apps/appointments/

**Responsabilidade:** Agendamentos com lock Redis, avaliações, cleanup de expirados.

**Model Appointment:** `patient` (FK), `doctor` (FK), `convenio` (FK), `appointment_type` (consultation|exam|return_visit), `exam_type` (FK nullable), `scheduled_date` (indexed), `scheduled_time`, `duration_minutes`, `status` (pending→confirmed→completed|cancelled|no_show), `cancellation_reason`, `cancelled_by` (FK), `notes`, `price`, `payment` (1:1), `reminder_sent`

**Model Rating:** `appointment` (1:1), `patient` (FK), `doctor` (FK), `score` (1-5), `comment`, `is_anonymous`, `is_moderated`

**BookingService — Lock Redis (TTL 10min):**
- `create_appointment`: Adquire lock `appointment:lock:{doctor}:{date}:{time}`. Se falha → 409 Conflict. Cria com status "pending".
- `cancel_appointment`: Muda status, libera lock. Só pending/confirmed.
- `confirm_appointment`: Muda para "confirmed". Só pending.

**Celery Task:** `cleanup_expired_appointments` — a cada 5min, cancela pending > 30min.

**Permissões:** Paciente vê seus. ConvenioAdmin vê do convênio. Owner vê todos.

**operationIds:** `listAppointments`, `getAppointmentById`, `createAppointment`, `cancelAppointment`, `confirmAppointment`, `rateAppointment`

### 5.6 apps/payments/

**Responsabilidade:** Pagamentos Stripe (cartão + PIX), webhooks, refunds.

**Model Payment:** `user` (FK), `amount` (Decimal), `currency` (BRL), `payment_method` (pix|credit_card|debit_card), `status` (pending|processing|completed|failed|refunded), `stripe_payment_intent_id` (indexed), `stripe_charge_id`, `pix_code`, `pix_qr_code`, `pix_expiration`, `paid_at`, `refunded_at`, `refund_amount`, `metadata` (JSON)

**StripeService:**
- `create_payment_intent`: Cria PaymentIntent (amount * 100 centavos)
- `create_pix_payment`: PaymentIntent com method_types=["pix"]
- `process_webhook_event`: payment_intent.succeeded → marca completed
- `refund_payment`: Cria Refund → marca refunded (só completed)

**Webhook:** AllowAny, signature verification com STRIPE_WEBHOOK_SECRET.

**operationIds:** `createPaymentIntent`, `generatePIX`, `getPaymentStatus`, `refundPayment`, `getPaymentHistory`, `stripeWebhook`

### 5.7 apps/notifications/

**Responsabilidade:** Notificações (push, email, SMS), reminders automáticos.

**Model Notification:** `user` (FK), `type` (appointment|payment|system|reminder), `title`, `body`, `channel` (email|push|sms), `is_read` (indexed), `read_at`, `sent_at`, `metadata` (JSON — deep link data)

**Services:** `NotificationService` (create, mark_read, unread_count), `PushService` (Firebase stub), `EmailService` (SendGrid/SES stub), `SMSService` (Twilio/Zenvia stub)

**Celery Tasks:**
- `send_bulk_reminders` — 24h antes de consultas confirmadas
- `cleanup_old_notifications` — Remove lidas > 90 dias
- `send_email_notification`, `send_push_notification` — Leves (django.tasks candidates)

**operationIds:** `listNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `getUnreadNotificationCount`

---

## 6. Endpoints Completos

### Auth: `/api/v1/auth/`
POST register, login, token/refresh, forgot-password, reset-password, verify-email, verify-phone

### Users: `/api/v1/users/`
GET/PATCH/DELETE me/, POST me/change-password/, POST me/export-data/

### Doctors: `/api/v1/doctors/`
GET list, GET {id}/, GET {id}/slots/?date=YYYY-MM-DD

### Convenio: `/api/v1/convenios/`
GET list, GET {id}/, POST (owner), PATCH {id}/, GET dashboard/
GET/POST exam-types/, PATCH/DELETE exam-types/{id}/

### Appointments: `/api/v1/appointments/`
GET list, POST create, GET {id}/, POST {id}/cancel/, POST {id}/confirm/, POST {id}/rate/

### Payments: `/api/v1/payments/`
POST create-intent/, POST pix/generate/, GET {id}/status/, POST {id}/refund/, GET history/
POST /api/v1/webhooks/stripe/

### Notifications: `/api/v1/notifications/`
GET list, PATCH {id}/read/, POST read-all/, GET unread-count/

### Documentation
GET /api/docs/ (Swagger UI), GET /api/redoc/, GET /api/schema/ (OpenAPI YAML)

---

## 7. Comandos

```bash
# Docker dev
docker-compose -f docker-compose.dev.yml up -d

# Django
python manage.py runserver
python manage.py makemigrations && python manage.py migrate
python manage.py createsuperuser --email=admin@healthapp.com
python manage.py seed_data

# Testes
pytest --cov=apps --cov-fail-under=80 -v

# Lint / Types
ruff check apps/
mypy apps/ --ignore-missing-imports

# Schema export
python manage.py spectacular --color --file ../shared/schema.yaml --validate
```

## 8. Após Mudar Serializers/Views

**SEMPRE** executar `npm run api:sync` na raiz do monorepo para regenerar `shared/gen/`.

---

*Consulte `CLAUDE.md` raiz para visão geral e `shared/CLAUDE.md` para regras do Kubb.*
