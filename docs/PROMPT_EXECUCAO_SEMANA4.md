# HealthApp — Prompt de Execucao Semana 4: Refinamento Final do Backend

> **Objetivo:** Este documento detalha task-by-task a Semana 4 do HealthApp.
> Foco: polish final do backend antes de iniciar o frontend — Firebase push real,
> SendGrid/SES email real, Stripe end-to-end com testes, appointment status machine
> completo, owner global settings, testes de carga (Locust), e fluxo end-to-end
> completo: busca → agendamento → pagamento → confirmacao → consulta → avaliacao.
>
> Pre-requisito: Semanas 1-3 concluidas. Leitura do `CLAUDE.md` raiz,
> `backend/CLAUDE.md` e `shared/CLAUDE.md`.

---

## ANALISE DO ESTADO ATUAL (Pos-Semana 3)

### O que JA existe (construido nas Semanas 1-3):

**Models completos (10+ models com migrations):**
- `core/`: BaseModel (UUID pk, timestamps, soft delete), SoftDeleteManager, exceptions (BusinessLogicError 422, ConflictError 409, GoneError 410), custom_exception_handler, permissions, pagination, utils (validate_cpf, validate_cnpj, generate_otp, mask_cpf, mask_email), throttles, admin_views, admin_serializers, admin_services, admin_urls
- `users/`: CustomUser (email login, encrypted CPF, roles, verification flags, 2FA), ConsentRecord (LGPD), IsAccountOwner
- `convenios/`: Convenio (encrypted CNPJ), ConvenioPlan, ExamType
- `doctors/`: Doctor (pg_trgm search, trigram indexes), DoctorSchedule, ScheduleException
- `appointments/`: Appointment (status workflow + Redis lock), Rating
- `payments/`: Payment (Stripe + PIX fields)
- `notifications/`: Notification (type, channel, JSONField data)

**Views existentes (todas com `@extend_schema` e operationId camelCase):**
- `users/views.py`: RegisterView, LoginView, RefreshTokenView, LogoutView, ProfileView, ChangePasswordView, ForgotPasswordView, ResetPasswordView, VerifyEmailView, VerifyPhoneView, ResendEmailOTPView, ResendPhoneOTPView, Setup2FAView, Verify2FAView, Disable2FAView, Login2FAView, ExportDataView, DeleteAccountView, ConsentsListView, ConsentsUpdateView
- `doctors/views.py`: DoctorViewSet (list/retrieve/slots/available-dates), DoctorScheduleViewSet, ScheduleExceptionViewSet
- `appointments/views.py`: AppointmentViewSet (list/retrieve/create/cancel/confirm/rate)
- `payments/views.py`: CreatePaymentIntentView, PIXGenerateView, PaymentStatusView, RefundView, PaymentHistoryView, StripeWebhookView
- `convenios/views.py`: ConvenioViewSet (list/retrieve/create/update/destroy/dashboard), ExamTypeViewSet, ConvenioReportView, ConvenioExportView
- `notifications/views.py`: NotificationListView (paginada), MarkAsReadView, MarkAllAsReadView, UnreadCountView
- `core/admin_views.py`: OwnerDashboardView, OwnerConvenioListView, OwnerConvenioDetailView, OwnerConvenioSuspendView, OwnerConvenioApproveView, OwnerUserListView, OwnerAuditLogView, OwnerFinancialReportView

**Servicos implementados:**
- `users/services.py`: OTPService, AuthService (password reset Redis token), UserService (anonymize, export_data)
- `doctors/services.py`: AvailabilityService (get_available_slots, get_available_dates, get_next_available_slot)
- `appointments/services.py`: BookingService (create com Redis lock 10min, cancel, confirm)
- `payments/services.py`: StripeService (create_payment_intent, create_pix_payment, process_webhook_event, refund_payment)
- `notifications/services.py`: NotificationService (create, mark_read, mark_all_read, unread_count)
- `notifications/helpers.py`: notify_appointment_created/confirmed/cancelled, notify_payment_completed/refunded
- `convenios/services.py`: ConvenioDashboardService (KPIs reais com queries otimizadas)
- `core/admin_services.py`: OwnerDashboardService (KPIs globais)

**PushService, EmailService, SMSService — STUBS (logam no console, nao enviam de verdade)**

**Celery Beat Schedule configurado:**
- cleanup_expired_appointments: every 5 min
- send_bulk_reminders: every 1 hour (multi-stage: 48h, 24h, 2h, 30min)
- check_no_show_appointments: every 30 min
- cleanup_old_notifications: daily 3AM
- generate_daily_summary: daily 20:00

**Infraestrutura:**
- Docker Compose (PostgreSQL 16, Redis 7.2, MinIO, Celery worker/beat)
- Kubb setup com 7 plugins, `npm run api:sync` funcional
- `shared/gen/` populado (types, zod, clients, hooks, mocks)
- GitHub Actions CI (ruff, mypy, pytest >=80%)
- Seed data com dados realistas brasileiros
- select_related/prefetch_related em todos os querysets

### O que FALTA para a Semana 4:

1. **PushService REAL** — Stub que loga no console. Precisa integrar com Firebase Admin SDK para enviar push notifications reais via FCM.
2. **EmailService REAL** — Stub que loga no console. Precisa integrar com SendGrid ou Amazon SES para enviar emails reais.
3. **SMSService REAL** — Stub que loga no console. Precisa integrar com Twilio ou Zenvia para enviar SMS reais.
4. **Stripe end-to-end testado** — StripeService implementado mas sem testes com mocks do Stripe SDK. Falta testar webhook signature verification, PIX flow completo, refund flow.
5. **Appointment status machine completo** — Falta transicao `confirmed → in_progress` (medico inicia consulta) e `in_progress → completed`.
6. **Owner global settings** — Nao existem endpoints para configurar taxas da plataforma, limites de agendamento, politicas de cancelamento padrao.
7. **Testes de carga** — Nenhum teste de performance/carga. Precisa Locust para validar 500+ usuarios simultaneos.
8. **Teste end-to-end completo** — Falta teste que simula o fluxo completo: busca → agendamento → pagamento → confirmacao → consulta → avaliacao.
9. **Device token management** — Falta model/endpoint para registrar device tokens (FCM) do mobile.
10. **Email templates** — Falta templates HTML para emails de confirmacao, reset password, lembretes.
11. **api:sync final** — Apos todas as mudancas da semana 4, precisa re-gerar shared/gen/.

---

## PARTE 1 — TAREFAS DETALHADAS

### Dia 1 (Segunda) — Firebase Push + Email Real

**Tarefa 4.1 — Device Token Management (FCM)**
```
Implemente modelo e endpoints para gerenciar device tokens do Firebase Cloud Messaging:

1. Criar model DeviceToken em notifications/models.py:
   - id (UUID pk via BaseModel)
   - user (FK CustomUser, related_name="device_tokens")
   - token (CharField max_length=500, unique=True)
   - device_type (CharField choices: "ios", "android", "web")
   - device_name (CharField max_length=255, blank=True)
   - is_active (BooleanField default=True)
   - last_used_at (DateTimeField null=True)
   - Meta: unique_together = (user, token)

2. Criar serializers:
   - DeviceTokenSerializer (read)
   - RegisterDeviceTokenSerializer (write: token, device_type, device_name)

3. Criar views:
   - POST /api/v1/notifications/devices/register/
     * IsAuthenticated
     * Registra device token para o user autenticado
     * Se token ja existe para outro user, atualiza o user (device troca de conta)
     * @extend_schema operationId="registerDeviceToken", tags=["notifications"]

   - DELETE /api/v1/notifications/devices/unregister/
     * IsAuthenticated
     * Recebe token no body, remove o registro
     * @extend_schema operationId="unregisterDeviceToken", tags=["notifications"]

   - GET /api/v1/notifications/devices/
     * IsAuthenticated
     * Lista device tokens do user
     * @extend_schema operationId="listDeviceTokens", tags=["notifications"]

4. Migration para o novo model

5. Adicionar rotas em notifications/urls.py

Validacao:
- POST /devices/register/ com token valido retorna 201
- POST /devices/register/ com token duplicado atualiza user
- DELETE /devices/unregister/ remove token
- GET /devices/ lista tokens do user autenticado

Commit: "feat(backend): device token management for FCM push notifications"
```

**Tarefa 4.2 — PushService Real com Firebase Admin SDK**
```
Implemente o PushService real usando Firebase Admin SDK:

1. Configurar Firebase Admin SDK:
   - Verificar que firebase-admin esta no requirements/base.txt
   - Criar arquivo config/firebase.py:
     * Inicializar firebase_admin.initialize_app()
     * Usar credenciais via variavel de ambiente FIREBASE_CREDENTIALS_JSON
       (JSON string) ou FIREBASE_CREDENTIALS_PATH (path to file)
     * Singleton pattern para nao reinicializar

2. Atualizar notifications/services.py — PushService:

   a) send_to_user(user_id, title, body, data=None):
      - Buscar todos os DeviceToken ativos do user
      - Para cada token, enviar via firebase_admin.messaging
      - Usar messaging.MulticastMessage para envio em batch
      - Tratar erros:
        * messaging.UnregisteredError → marcar token como is_active=False
        * messaging.SenderIdMismatchError → marcar token como is_active=False
        * Outros erros → logar no Sentry, nao falhar silenciosamente

   b) send_to_multiple(user_ids, title, body, data=None):
      - Coletar todos os tokens dos users
      - Enviar via MulticastMessage (max 500 tokens por batch)
      - Retornar {success_count, failure_count, errors}

   c) send_to_topic(topic, title, body, data=None):
      - Enviar para topic do FCM (ex: "convenio_{id}_notifications")
      - Util para notificacoes broadcast para um convenio inteiro

3. Atualizar notifications/tasks.py:
   - send_push_notification task deve chamar PushService.send_to_user() real
   - Adicionar retry com backoff exponencial (max_retries=3)

4. Adicionar ao .env.example:
   FIREBASE_CREDENTIALS_JSON='{"type":"service_account",...}'
   # OU
   FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json

5. Configurar settings:
   - FIREBASE_CREDENTIALS em base.py (via env var)

Validacao:
- PushService.send_to_user() envia push real (testar com device real ou emulador)
- Token invalido e marcado como is_active=False automaticamente
- Batch de 500+ tokens funciona sem erro
- Sem Firebase configurado, service loga warning e nao crashea (graceful degradation)

Commit: "feat(backend): real Firebase push notification service with FCM"
```

**Tarefa 4.3 — EmailService Real com SendGrid/SES**
```
Implemente o EmailService real com suporte a SendGrid ou Amazon SES:

1. Configurar Django Email Backend:
   - Para SendGrid:
     * Adicionar sendgrid ao requirements/base.txt (se usando SDK)
     * OU usar Django SMTP backend com SMTP relay do SendGrid
     * EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
     * EMAIL_HOST = "smtp.sendgrid.net"
     * EMAIL_PORT = 587
     * EMAIL_USE_TLS = True
     * EMAIL_HOST_USER = "apikey"
     * EMAIL_HOST_PASSWORD = env("SENDGRID_API_KEY")

   - Para Amazon SES:
     * Usar django-ses ou SMTP relay
     * EMAIL_BACKEND = "django_ses.SESBackend"
     * AWS_SES_REGION_NAME = "us-east-1"
     * AWS_SES_REGION_ENDPOINT = "email.us-east-1.amazonaws.com"

   - Para Development:
     * EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend" (ja configurado)

2. Criar email templates em notifications/templates/email/:

   a) base.html — Template base com header HealthApp, footer, estilo inline CSS
   b) appointment_confirmed.html:
      - "Sua consulta foi confirmada!"
      - Detalhes: medico, data, hora, endereco
      - Botao: "Ver detalhes no app"
   c) appointment_cancelled.html:
      - "Sua consulta foi cancelada"
      - Motivo do cancelamento
      - Botao: "Reagendar"
   d) appointment_reminder.html:
      - "Lembrete: sua consulta e amanha!"
      - Detalhes + instrucoes de preparo (se exame)
   e) password_reset.html:
      - "Redefinicao de senha"
      - Token/link de reset (ou codigo OTP)
      - Expiracao: 30 minutos
   f) welcome.html:
      - "Bem-vindo ao HealthApp!"
      - Instrucoes de verificacao de email
   g) payment_confirmed.html:
      - "Pagamento confirmado!"
      - Valor, metodo, comprovante
   h) payment_refunded.html:
      - "Reembolso processado"
      - Valor, prazo de retorno

3. Atualizar notifications/services.py — EmailService:

   a) send_email(to, subject, template_name, context):
      - Renderizar template HTML com context
      - Usar Django send_mail() ou SendGrid SDK
      - Gerar versao plain text automaticamente (strip HTML)
      - Adicionar headers: Reply-To, List-Unsubscribe
      - Retornar True/False

   b) send_transactional(to, subject, template_name, context):
      - Wrapper para emails transacionais (alta prioridade)
      - Sem unsubscribe (obrigatorio por lei)

   c) send_marketing(to, subject, template_name, context):
      - Wrapper para emails de marketing
      - Verificar ConsentRecord do user (notifications_email)
      - Se nao consentiu, nao enviar

4. Atualizar notifications/tasks.py:
   - send_email_notification task deve chamar EmailService.send_email() real
   - Adicionar retry com backoff exponencial (max_retries=3)

5. Adicionar ao .env.example:
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   SENDGRID_API_KEY=SG.xxxxx
   DEFAULT_FROM_EMAIL=noreply@healthapp.com.br

Validacao:
- EmailService.send_email() envia email real (ou loga no console em dev)
- Templates HTML renderizam corretamente com dados dinamicos
- Emails de marketing respeitam consentimento LGPD
- Sem API key configurada, service usa console backend (graceful degradation)

Commit: "feat(backend): real email service with SendGrid/SES and HTML templates"
```

### Dia 2 (Terca) — SMS Service + Stripe End-to-End

**Tarefa 4.4 — SMSService Real com Twilio/Zenvia**
```
Implemente o SMSService real com suporte a Twilio ou Zenvia:

1. Adicionar twilio ao requirements/base.txt:
   twilio==9.*

2. Configurar settings:
   TWILIO_ACCOUNT_SID = env("TWILIO_ACCOUNT_SID", default="")
   TWILIO_AUTH_TOKEN = env("TWILIO_AUTH_TOKEN", default="")
   TWILIO_PHONE_NUMBER = env("TWILIO_PHONE_NUMBER", default="")

3. Atualizar notifications/services.py — SMSService:

   a) send_sms(to, message):
      - Usar Twilio Client para enviar SMS
      - Formatar telefone para E.164 (+55XXXXXXXXXXX)
      - Tratar erros:
        * Numero invalido → logar warning
        * Rate limit Twilio → retry com backoff
        * Credenciais invalidas → logar error, nao crashear
      - Verificar ConsentRecord do user (notifications_sms)
      - Retornar {success: bool, sid: str}

   b) send_otp(to, code):
      - Template: "HealthApp: Seu codigo de verificacao e {code}. Valido por 10 minutos."
      - Usar send_sms() internamente

   c) send_reminder(to, appointment):
      - Template: "HealthApp: Lembrete - Consulta com Dr. {name} amanha as {time}. Responda CANCELAR para cancelar."
      - Verificar consentimento SMS antes de enviar

4. Atualizar notifications/tasks.py:
   - send_sms_notification task deve chamar SMSService.send_sms() real
   - OTPService.generate_phone_otp() deve chamar SMSService.send_otp()

5. Atualizar users/services.py — OTPService:
   - generate_phone_otp(): alem de salvar no Redis, chamar SMSService.send_otp()
   - generate_email_otp(): alem de salvar no Redis, chamar EmailService.send_email()
     com template "verification_code.html"

6. Adicionar ao .env.example:
   TWILIO_ACCOUNT_SID=ACxxxxx
   TWILIO_AUTH_TOKEN=xxxxx
   TWILIO_PHONE_NUMBER=+15551234567

Validacao:
- SMSService.send_sms() envia SMS real (ou loga em dev)
- OTP de telefone e enviado via SMS real
- Consentimento LGPD verificado antes de SMS de reminder/marketing
- Sem credenciais Twilio, service loga warning (graceful degradation)

Commit: "feat(backend): real SMS service with Twilio integration"
```

**Tarefa 4.5 — Stripe Integration End-to-End com Testes**
```
Complete e teste a integracao Stripe com mocks abrangentes:

1. Atualizar payments/services.py — StripeService:

   a) create_payment_intent(appointment, payment_method="credit_card"):
      - Criar Stripe PaymentIntent com:
        * amount em centavos (appointment.price * 100)
        * currency: "brl"
        * metadata: {appointment_id, patient_id, doctor_id, convenio_id}
        * automatic_payment_methods: {enabled: True}
      - Criar Payment model com status="pending"
      - Retornar {client_secret, payment_intent_id, payment_id}

   b) create_pix_payment(appointment):
      - Criar Stripe PaymentIntent com payment_method_types=["pix"]
      - Extrair pix_display_qr_code e pix_copy_and_paste do response
      - Criar Payment model com pix_code e pix_expiration (30 min)
      - Retornar {qr_code_base64, copy_paste_code, expiration, payment_id}

   c) process_webhook_event(payload, sig_header):
      - Verificar assinatura com stripe.Webhook.construct_event()
      - Tratar eventos:
        * payment_intent.succeeded → Payment.status="completed", Appointment.status="confirmed"
        * payment_intent.payment_failed → Payment.status="failed"
        * charge.refunded → Payment.status="refunded"
        * charge.dispute.created → logar + notificar owner
      - Chamar notify_payment_completed() ou notify_payment_failed()
      - Retornar HTTP 200 sempre (Stripe espera)

   d) refund_payment(payment, amount=None):
      - Se amount=None, refund total
      - Se amount < payment.amount, refund parcial
      - Criar Stripe Refund
      - Atualizar Payment.status="refunded", refund_amount
      - Chamar notify_payment_refunded()

2. Criar payments/tests/test_stripe.py com mocks:

   a) TestCreatePaymentIntent:
      - test_create_intent_success: mock stripe.PaymentIntent.create → 201
      - test_create_intent_stripe_error: mock StripeError → 502
      - test_create_intent_creates_payment_record: Payment model criado
      - test_create_intent_amount_in_centavos: 150.00 → 15000

   b) TestCreatePixPayment:
      - test_create_pix_success: mock → retorna qr_code + copy_paste
      - test_pix_expiration_30_minutes: expiracao correta
      - test_pix_creates_payment_record: Payment model criado

   c) TestProcessWebhook:
      - test_webhook_payment_succeeded: Payment.status="completed" + Appointment.status="confirmed"
      - test_webhook_payment_failed: Payment.status="failed"
      - test_webhook_charge_refunded: Payment.status="refunded"
      - test_webhook_invalid_signature: → 400
      - test_webhook_unknown_event: → 200 (ignora gracefully)
      - test_webhook_triggers_notification: Notification criada

   d) TestRefundPayment:
      - test_full_refund: refund_amount == amount
      - test_partial_refund: refund_amount < amount
      - test_refund_already_refunded: → 422
      - test_refund_pending_payment: → 422 (so refund completed)

   Usar @mock.patch("stripe.PaymentIntent.create") para todos os mocks.
   Usar @mock.patch("stripe.Webhook.construct_event") para webhook.
   Usar @mock.patch("stripe.Refund.create") para refunds.

3. Adicionar ao .env.example:
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx

Validacao:
- pytest apps/payments/tests/test_stripe.py -v → todos verdes
- Mocks cobrem cenarios de sucesso e erro
- Webhook signature verification testada
- Cobertura payments/ >= 85%

Commit: "test(backend): comprehensive Stripe integration tests with mocks"
```

### Dia 3 (Quarta) — Appointment Status Machine + Owner Settings

**Tarefa 4.6 — Appointment Status Machine Completo**
```
Complete o status machine do Appointment com todas as transicoes:

1. Definir transicoes validas em appointments/services.py:

   VALID_TRANSITIONS = {
       "pending": ["confirmed", "cancelled"],
       "confirmed": ["in_progress", "cancelled", "no_show"],
       "in_progress": ["completed", "cancelled"],
       "completed": [],  # terminal state
       "cancelled": [],  # terminal state
       "no_show": [],     # terminal state
   }

2. Criar metodo validate_transition(appointment, new_status) no BookingService:
   - Verificar se transicao e valida
   - Se invalida: raise BusinessLogicError("Cannot transition from {current} to {new}")
   - Registrar transicao no auditlog

3. Criar novos endpoints em appointments/views.py:

   a) POST /api/v1/appointments/{id}/start/
      - permission_classes = [IsDoctor | IsConvenioAdmin]
      - Transicao: confirmed → in_progress
      - Registra started_at timestamp
      - @extend_schema operationId="startAppointment", tags=["appointments"]

   b) POST /api/v1/appointments/{id}/complete/
      - permission_classes = [IsDoctor | IsConvenioAdmin]
      - Transicao: in_progress → completed
      - Registra completed_at timestamp
      - Dispara notificacao para paciente: "Consulta finalizada! Avalie sua experiencia."
      - @extend_schema operationId="completeAppointment", tags=["appointments"]

   c) POST /api/v1/appointments/{id}/no-show/
      - permission_classes = [IsConvenioAdmin | IsOwner]
      - Transicao: confirmed → no_show
      - Registra no_show_at timestamp
      - Notifica paciente e owner
      - @extend_schema operationId="markNoShow", tags=["appointments"]

4. Adicionar campos ao Appointment model (migration):
   - started_at (DateTimeField null=True)
   - completed_at (DateTimeField null=True)
   - no_show_at (DateTimeField null=True)

5. Atualizar cancel action para usar validate_transition:
   - So pode cancelar se status em ["pending", "confirmed", "in_progress"]
   - Cancelar "in_progress" requer motivo obrigatorio

6. Criar serializers:
   - StartAppointmentSerializer (response: appointment atualizado)
   - CompleteAppointmentSerializer (response + opcional notes)
   - NoShowSerializer (response)

Validacao:
- Fluxo completo: pending → confirmed → in_progress → completed funciona
- pending → in_progress falha (403 ou 422)
- completed → cancelled falha (422)
- Cada transicao registrada no auditlog
- Notificacoes disparadas em cada transicao

Commit: "feat(backend): complete appointment status machine with start/complete/no-show transitions"
```

**Tarefa 4.7 — Owner Global Settings**
```
Implemente modelo e endpoints para configuracoes globais da plataforma:

1. Criar model PlatformSettings em core/models.py (ou users/models.py):
   - id (UUID pk via BaseModel)
   - key (CharField max_length=100, unique=True, db_index=True)
   - value (JSONField)
   - description (TextField blank=True)
   - updated_by (FK CustomUser null=True)
   - Meta: verbose_name = "Platform Setting"

   Ou alternativa: modelo singleton:
   - platform_fee_percentage (DecimalField default=10.00) — taxa da plataforma
   - max_advance_booking_days (IntegerField default=60) — maximo de dias pra frente
   - min_cancellation_hours (IntegerField default=24) — horas minimas para cancelar sem multa
   - cancellation_fee_percentage (DecimalField default=0) — taxa de cancelamento
   - appointment_lock_ttl_minutes (IntegerField default=10) — TTL do Redis lock
   - payment_timeout_minutes (IntegerField default=30) — timeout para pagamento
   - max_appointments_per_day_patient (IntegerField default=3) — limite por paciente
   - pix_enabled (BooleanField default=True)
   - credit_card_enabled (BooleanField default=True)
   - maintenance_mode (BooleanField default=False)
   - maintenance_message (TextField blank=True)

2. Criar serializers:
   - PlatformSettingsSerializer (read)
   - UpdatePlatformSettingsSerializer (write: campos parciais via PATCH)

3. Criar views em core/admin_views.py:

   a) GET /api/v1/admin-panel/settings/
      - permission_classes = [IsOwner]
      - Retorna todas as configuracoes
      - @extend_schema operationId="getPlatformSettings", tags=["owner"]

   b) PATCH /api/v1/admin-panel/settings/
      - permission_classes = [IsOwner]
      - Atualiza configuracoes parciais
      - Registra no auditlog (quem mudou, o que mudou)
      - @extend_schema operationId="updatePlatformSettings", tags=["owner"]

4. Criar service PlatformSettingsService:
   - get_settings() → PlatformSettings (cached no Redis, TTL 5 min)
   - update_settings(data, updated_by) → PlatformSettings
   - get_setting(key) → value (helper para uso interno)
   - invalidate_cache() → limpa cache Redis

5. Integrar settings nos servicos existentes:
   - BookingService.create_appointment():
     * Verificar max_advance_booking_days
     * Verificar max_appointments_per_day_patient
     * Usar appointment_lock_ttl_minutes do settings (nao hardcoded)
   - BookingService.cancel_appointment():
     * Verificar min_cancellation_hours
     * Aplicar cancellation_fee_percentage se dentro do prazo
   - StripeService:
     * Verificar pix_enabled e credit_card_enabled
   - Middleware:
     * Verificar maintenance_mode → retornar 503 com maintenance_message

6. Criar middleware MaintenanceModeMiddleware em core/middleware.py:
   - Verificar PlatformSettings.maintenance_mode
   - Se True: retornar 503 Service Unavailable com maintenance_message
   - Excecoes: /api/v1/admin-panel/* (owner precisa acessar para desabilitar)
   - Cache do check para nao consultar banco a cada request

7. Django Admin para PlatformSettings (gerenciar via admin tambem)

8. Seed data com settings padrao

Validacao:
- GET /admin-panel/settings/ retorna configuracoes
- PATCH /admin-panel/settings/ atualiza e invalida cache
- Maintenance mode bloqueia requests normais mas permite admin-panel
- BookingService respeita limites configurados
- Auditlog registra mudancas nas settings

Commit: "feat(backend): platform global settings with maintenance mode and dynamic limits"
```

### Dia 4 (Quinta) — Testes End-to-End + Testes de Carga

**Tarefa 4.8 — Teste End-to-End: Fluxo Completo de Agendamento**
```
Crie teste de integracao que simula o fluxo completo do paciente:

Criar tests/test_e2e_booking_flow.py (ou appointments/tests/test_e2e.py):

1. TestFullBookingFlow (classe unica com metodos sequenciais):

   Setup:
   - Criar convenio com seed data
   - Criar medico com schedules (segunda a sexta, 08:00-18:00)
   - Criar paciente com email_verified=True

   a) test_01_search_doctors:
      - GET /api/v1/doctors/?search=cardiologia
      - Verificar que medico aparece nos resultados
      - Verificar que inclui rating, specialty, next_available_date

   b) test_02_get_available_slots:
      - GET /api/v1/doctors/{id}/slots/?date={next_monday}
      - Verificar que retorna lista de slots
      - Salvar um slot para usar no agendamento

   c) test_03_create_appointment:
      - POST /api/v1/appointments/ com slot selecionado
      - Verificar status=pending
      - Verificar Redis lock criado
      - Verificar Notification criada para paciente e medico
      - Salvar appointment_id

   d) test_04_create_payment_intent:
      - POST /api/v1/payments/create-intent/ com appointment_id
      - Mock Stripe PaymentIntent.create
      - Verificar client_secret retornado
      - Verificar Payment model criado com status=pending
      - Salvar payment_id

   e) test_05_simulate_payment_webhook:
      - POST /api/v1/webhooks/stripe/ simulando payment_intent.succeeded
      - Mock Stripe Webhook.construct_event
      - Verificar Payment.status=completed
      - Verificar Appointment.status=confirmed
      - Verificar Notification de pagamento criada

   f) test_06_start_appointment:
      - POST /api/v1/appointments/{id}/start/ como doctor
      - Verificar status=in_progress
      - Verificar started_at preenchido

   g) test_07_complete_appointment:
      - POST /api/v1/appointments/{id}/complete/ como doctor
      - Verificar status=completed
      - Verificar completed_at preenchido
      - Verificar Notification para paciente avaliar

   h) test_08_rate_appointment:
      - POST /api/v1/appointments/{id}/rate/ como paciente
      - score=5, comment="Excelente atendimento"
      - Verificar Rating criado
      - Verificar doctor.rating atualizado

   i) test_09_verify_payment_history:
      - GET /api/v1/payments/history/ como paciente
      - Verificar pagamento aparece com status=completed

   j) test_10_verify_notification_count:
      - GET /api/v1/notifications/unread-count/ como paciente
      - Verificar que notificacoes foram criadas ao longo do fluxo

2. TestBookingEdgeCases:
   - test_double_booking_same_slot: 2 pacientes no mesmo slot → 409 para o segundo
   - test_cancel_after_payment: cancelar appointment confirmado → refund
   - test_booking_expired_lock: lock expira → slot liberado
   - test_booking_past_date: data passada → 400
   - test_booking_no_schedule: dia sem agenda → 400

Validacao:
- Fluxo completo roda sem erros
- Cada step depende do anterior (sequencial)
- Edge cases cobertos
- Todos os services integrados (Booking, Payment, Notification)

Commit: "test(backend): end-to-end booking flow test from search to rating"
```

**Tarefa 4.9 — Testes de Carga com Locust**
```
Implemente testes de carga para validar performance do backend:

1. Instalar Locust:
   - Adicionar locust ao requirements/development.txt
   - Criar arquivo backend/locustfile.py

2. Criar cenarios de carga em locustfile.py:

   a) PatientUser (HttpUser):
      - wait_time: between(1, 3)
      - on_start: registrar usuario + login (obter JWT)
      - Tasks (com pesos):
        * search_doctors (weight=5): GET /doctors/?search=random_specialty
        * get_doctor_slots (weight=3): GET /doctors/{random_id}/slots/?date=tomorrow
        * list_appointments (weight=2): GET /appointments/
        * get_notifications (weight=2): GET /notifications/
        * create_appointment (weight=1): POST /appointments/ (se slot disponivel)

   b) ConvenioAdminUser (HttpUser):
      - wait_time: between(2, 5)
      - on_start: login como convenio_admin
      - Tasks:
        * get_dashboard (weight=3): GET /convenios/dashboard/
        * list_doctors (weight=2): GET /doctors/
        * list_appointments (weight=2): GET /appointments/
        * get_financial (weight=1): GET /convenios/reports/financial/

   c) OwnerUser (HttpUser):
      - wait_time: between(3, 8)
      - on_start: login como owner
      - Tasks:
        * get_owner_dashboard (weight=3): GET /admin-panel/dashboard/
        * list_convenios (weight=2): GET /admin-panel/convenios/
        * list_users (weight=1): GET /admin-panel/users/

3. Criar script de setup para Locust:
   - backend/scripts/setup_load_test.py
   - Cria 100 pacientes, 10 medicos, 3 convenios, 1 owner
   - Cria schedules e slots para a proxima semana
   - Popula dados suficientes para testes realistas

4. Configurar metricas de sucesso:
   - P50 response time < 100ms
   - P95 response time < 300ms
   - P99 response time < 500ms
   - Error rate < 1%
   - 500+ usuarios simultaneos sustentados

5. Criar script para rodar localmente:
   - bash: locust -f locustfile.py --host=http://localhost:8000 --users=100 --spawn-rate=10

6. Adicionar ao README/docs instrucoes de como rodar load tests

Validacao:
- locust -f locustfile.py roda sem erros de importacao
- Com 100 usuarios simultaneos: P95 < 300ms
- Com 500 usuarios simultaneos: error rate < 1%
- Dashboard endpoints (com cache) < 500ms em P95
- Identificar e documentar bottlenecks encontrados

Commit: "test(backend): load testing with Locust for 500+ concurrent users"
```

### Dia 5 (Sexta) — Polish Final + api:sync + Coverage

**Tarefa 4.10 — Cancellation Policy Engine**
```
Implemente logica de politica de cancelamento:

1. Criar appointments/policies.py:

   a) CancellationPolicy:
      - check_cancellation(appointment, user) -> CancellationResult:
        * Se antes de min_cancellation_hours: cancelamento gratuito
        * Se dentro de min_cancellation_hours: aplicar cancellation_fee_percentage
        * Se appointment ja em_progress: cancelamento com multa total
        * Retornar: {allowed: bool, fee_amount: Decimal, reason: str}

   b) RefundCalculator:
      - calculate_refund(payment, cancellation_result) -> Decimal:
        * refund = payment.amount - fee_amount
        * Se refund <= 0: sem refund
        * Retornar valor a ser refundado

2. Integrar no BookingService.cancel_appointment():
   - Chamar CancellationPolicy.check_cancellation()
   - Se tem fee: criar Payment com fee amount (ou deduzir do refund)
   - Se tem refund: chamar StripeService.refund_payment(amount=refund_amount)
   - Notificar paciente com detalhes do cancelamento e refund

3. Endpoint para consultar politica antes de cancelar:
   - GET /api/v1/appointments/{id}/cancellation-policy/
   - IsAuthenticated (paciente ve a propria politica)
   - Retorna: {can_cancel, fee_amount, refund_amount, deadline}
   - @extend_schema operationId="getAppointmentCancellationPolicy", tags=["appointments"]

Validacao:
- Cancelamento antes do prazo: refund total
- Cancelamento apos prazo: refund parcial (amount - fee)
- Cancelamento de in_progress: fee total, sem refund
- GET cancellation-policy retorna valores corretos

Commit: "feat(backend): cancellation policy engine with dynamic fees and refund calculation"
```

**Tarefa 4.11 — Appointment Reminder Stages com Tracking**
```
Implemente tracking granular de quais lembretes ja foram enviados:

1. Adicionar campo ao Appointment model (migration):
   - reminder_stages_sent (JSONField default=dict)
   - Estrutura: {"48h": "2026-03-01T10:00:00", "24h": "2026-03-02T10:00:00", ...}

2. Atualizar notifications/tasks.py — send_bulk_reminders:

   a) Para cada appointment confirmado proximo:
      - Calcular horas restantes ate a consulta
      - Verificar quais stages ja foram enviados (reminder_stages_sent)
      - Enviar apenas stages pendentes:
        * 48h antes: email (se nao enviado)
        * 24h antes: push + email (se nao enviado)
        * 2h antes: push + SMS (se nao enviado)
        * 30min antes: push final (se nao enviado)
      - Apos enviar, registrar stage em reminder_stages_sent com timestamp
      - Usar update_fields=["reminder_stages_sent"] para performance

   b) Otimizar query:
      - Filtrar apenas appointments:
        * status="confirmed"
        * scheduled_date entre hoje e daqui 3 dias
        * Ordenar por scheduled_date, scheduled_time
      - Usar select_related("patient", "doctor__user")

3. Criar endpoint para consultar lembretes enviados:
   - GET /api/v1/appointments/{id}/reminders/
   - Retorna: lista de reminders enviados com timestamps
   - @extend_schema operationId="getAppointmentReminders", tags=["appointments"]

Validacao:
- Lembrete de 48h enviado uma unica vez
- Lembrete de 24h enviado uma unica vez (mesmo que task rode varias vezes)
- Appointment sem consent SMS: lembrete SMS nao enviado
- Nenhum reminder duplicado (idempotencia garantida)

Commit: "feat(backend): granular appointment reminder tracking with deduplication"
```

**Tarefa 4.12 — api:sync Final + Validacao do Codigo Gerado**
```
Execute pipeline completo de geracao de codigo apos TODAS as mudancas da Semana 4:

1. Garantir que TODOS os novos endpoints tem @extend_schema com:
   - operationId em camelCase
   - tags corretas
   - request e response schemas explicitos
   - summary descritivo

2. Lista de novos endpoints que devem aparecer no codigo gerado:
   - registerDeviceToken / unregisterDeviceToken / listDeviceTokens
   - startAppointment / completeAppointment / markNoShow
   - getPlatformSettings / updatePlatformSettings
   - getAppointmentCancellationPolicy
   - getAppointmentReminders
   - (mais todos os existentes das semanas 1-3)

3. Executar:
   npm run api:sync

4. Validar shared/schema.yaml:
   - python manage.py spectacular --validate --color (sem erros)
   - Schema contem todos os novos endpoints
   - Verificar operationIds no schema YAML

5. Validar shared/gen/:
   - types/ contem interfaces para todos os novos serializers
   - zod/ contem schemas de validacao
   - clients/ contem funcoes para todos os novos endpoints
   - hooks/ contem useQuery/useMutation hooks
   - Verificar que nao ha erros de TypeScript:
     npx tsc --noEmit -p tsconfig.base.json (ou check manual)

Validacao:
- npm run api:sync executa sem erros
- shared/gen/ atualizado com novos types e hooks
- Schema valido (sem warnings do spectacular)

Commit: "feat(shared): api:sync final with week 4 endpoints — complete backend API surface"
```

**Tarefa 4.13 — Cobertura de Testes >= 80% + Lint + Types**
```
Garanta que a cobertura de testes atinge o minimo de 80%:

1. Executar:
   pytest --cov=apps --cov-report=term-missing --cov-fail-under=80 -v

2. Identificar arquivos com baixa cobertura e adicionar testes:
   - notifications/services.py (PushService, EmailService, SMSService)
   - core/admin_views.py (owner admin endpoints)
   - appointments/policies.py (cancellation policy)
   - core/middleware.py (MaintenanceModeMiddleware)
   - Adicionar testes para novas funcionalidades:
     * test_device_token_crud
     * test_appointment_status_transitions
     * test_platform_settings_crud
     * test_cancellation_policy_calculations
     * test_maintenance_mode_middleware

3. Executar lint e types:
   ruff check apps/ --fix
   mypy apps/

4. Corrigir todos os warnings e erros

Validacao:
- pytest --cov=apps --cov-fail-under=80 passa
- ruff check passa (0 warnings)
- mypy passa (0 erros)

Commit: "test(backend): achieve 80%+ test coverage with week 4 feature tests"
```

**Tarefa 4.14 — Backend Documentation Review**
```
Revise e complete a documentacao do backend antes de iniciar o frontend:

1. Atualizar .env.example com TODAS as variaveis necessarias:
   - Database (POSTGRES_*)
   - Redis (REDIS_URL)
   - Django (SECRET_KEY, DEBUG, ALLOWED_HOSTS)
   - JWT (ACCESS_TOKEN_LIFETIME, REFRESH_TOKEN_LIFETIME)
   - Stripe (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
   - Firebase (FIREBASE_CREDENTIALS_JSON)
   - Email (SENDGRID_API_KEY, DEFAULT_FROM_EMAIL)
   - SMS (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
   - Sentry (SENTRY_DSN)
   - Storage (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_STORAGE_BUCKET_NAME)

2. Verificar que Swagger UI (/api/docs/) mostra TODOS os endpoints:
   - Auth (10+ endpoints)
   - Users (5+ endpoints)
   - Doctors (6+ endpoints)
   - Appointments (8+ endpoints)
   - Payments (6+ endpoints)
   - Convenio (10+ endpoints)
   - Owner Admin (10+ endpoints)
   - Notifications (7+ endpoints)
   - Total: 60+ endpoints

3. Verificar que todos os endpoints tem:
   - @extend_schema com operationId, tags, summary
   - Request e response serializers documentados
   - Status codes documentados (200, 201, 400, 401, 403, 404, 409, 422, 429)

4. Atualizar backend/CLAUDE.md se necessario com novas convencoes

Validacao:
- .env.example completo
- Swagger UI mostra todos os endpoints organizados por tag
- Nenhum endpoint sem documentacao

Commit: "docs(backend): complete API documentation and environment variables"
```

**Tarefa 4.15 — Seed Data Final**
```
Atualize o seed_data para demonstrar o backend completo:

1. Atualizar core/management/commands/seed_data.py:
   - Criar PlatformSettings com valores padrao
   - Criar DeviceTokens para alguns users (simulacao)
   - Criar appointments com todos os status (incluindo in_progress e no_show)
   - Criar appointments com reminder_stages_sent preenchido
   - Criar ConsentRecords variados (alguns com SMS revogado)
   - Garantir que dados geram KPIs significativos nos dashboards
   - Totais:
     * 1 owner, 3 convenios (1 inativo), 15 medicos, 30 pacientes
     * 100 appointments (variados status e datas)
     * 70 payments (variados status e metodos)
     * 40 ratings
     * 100 notifications
     * ConsentRecords para todos os users

2. Adicionar flag --minimal para seed rapido (menos dados):
   - 1 owner, 1 convenio, 3 medicos, 5 pacientes
   - 10 appointments, 8 payments, 5 ratings

Validacao:
- python manage.py seed_data executa sem erros
- python manage.py seed_data --minimal executa em < 5 segundos
- Dashboards mostram dados significativos
- Swagger UI permite testar endpoints com dados reais

Commit: "feat(backend): comprehensive seed data for complete backend demonstration"
```

---

## PARTE 2 — CHECKLIST DE ENTREGA SEMANA 4

### Criterios de Aceitacao (Definition of Done)

```
[ ] DeviceToken model e endpoints (register/unregister/list)
[ ] PushService REAL com Firebase Admin SDK (FCM)
[ ] Push notifications enviadas de verdade (ou graceful degradation sem Firebase)
[ ] EmailService REAL com SendGrid/SES
[ ] 8+ email templates HTML (confirmation, cancellation, reminder, reset, welcome, payment)
[ ] SMSService REAL com Twilio
[ ] OTP enviado via SMS real
[ ] Stripe integration end-to-end testada:
    [ ] PaymentIntent create (card)
    [ ] PIX payment create (QR code + copy paste)
    [ ] Webhook signature verification
    [ ] Payment succeeded → appointment confirmed
    [ ] Payment failed handling
    [ ] Full refund
    [ ] Partial refund
[ ] Appointment status machine completo:
    [ ] pending → confirmed (via payment webhook)
    [ ] confirmed → in_progress (start endpoint)
    [ ] in_progress → completed (complete endpoint)
    [ ] confirmed → no_show (no-show endpoint)
    [ ] Transicoes invalidas bloqueadas (422)
[ ] PlatformSettings model e endpoints (get/update)
[ ] MaintenanceModeMiddleware funcional
[ ] BookingService usa settings dinamicos (nao hardcoded)
[ ] CancellationPolicy engine com fees dinamicos
[ ] Appointment reminder tracking com deduplicacao
[ ] Teste end-to-end completo (search → book → pay → start → complete → rate)
[ ] Testes de carga Locust (100+ usuarios, P95 < 300ms)
[ ] .env.example completo com todas as variaveis
[ ] Swagger UI com 60+ endpoints documentados
[ ] Seed data completo e realista
[ ] npm run api:sync executado com sucesso
[ ] shared/gen/ atualizado com TODOS os endpoints do backend
[ ] Cobertura de testes >= 80%
[ ] ruff check: 0 warnings
[ ] mypy: 0 erros
[ ] Todos os commits seguem Conventional Commits
```

### Metricas de Qualidade Esperadas

```
Cobertura de testes: >= 80%
Warnings do ruff: 0
Erros do mypy: 0
Endpoints totais: 60+
Test classes novas: 15+
Test methods novos: 50+
P95 response time: < 300ms (com 100 usuarios)
Email templates: 8+
Stripe test scenarios: 15+
E2E flow steps: 10
Tarefas totais: 15
Tempo estimado: 5 dias (40h)
```

---

## PARTE 3 — COMANDOS DE REFERENCIA RAPIDA

### Desenvolvimento Local

```bash
# Subir ambiente (se nao estiver rodando)
cd backend/
docker-compose -f docker/docker-compose.dev.yml up -d

# Rodar testes com cobertura
pytest --cov=apps --cov-report=term-missing -v

# Rodar testes de uma app especifica
pytest apps/payments/tests/ -v
pytest apps/appointments/tests/ -v
pytest apps/notifications/tests/ -v

# Rodar teste e2e
pytest tests/test_e2e_booking_flow.py -v

# Lint
ruff check apps/ --fix

# Type check
mypy apps/

# Shell interativo
python manage.py shell_plus

# Verificar schema OpenAPI
python manage.py spectacular --validate --color

# Exportar schema
python manage.py spectacular --color --file ../shared/schema.yaml --validate

# Seed data
python manage.py seed_data
python manage.py seed_data --minimal

# Reset banco + seed (dev only)
python manage.py flush --no-input
python manage.py migrate
python manage.py seed_data
```

### Kubb / API Sync

```bash
# Pipeline completo apos mudancas em serializers/views
npm run api:sync

# Verificar codigo gerado
ls shared/gen/types/
ls shared/gen/hooks/
ls shared/gen/clients/

# Validar TypeScript do codigo gerado
npx tsc --noEmit -p tsconfig.base.json
```

### Stripe (Debug/Test)

```bash
# Instalar Stripe CLI para testar webhooks localmente
# https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe/

# Trigger evento de teste
stripe trigger payment_intent.succeeded

# Verificar eventos no Stripe Dashboard
stripe events list --limit 10
```

### Locust (Load Testing)

```bash
# Preparar dados para load test
python manage.py seed_data

# Rodar Locust (UI web)
cd backend/
locust -f locustfile.py --host=http://localhost:8000

# Rodar Locust headless (CI)
locust -f locustfile.py --host=http://localhost:8000 \
  --users=100 --spawn-rate=10 --run-time=5m --headless \
  --csv=load_test_results

# Abrir UI: http://localhost:8089
```

### Firebase (Debug)

```bash
# Testar push notification via shell
python manage.py shell_plus
>>> from apps.notifications.services import PushService
>>> PushService.send_to_user(user_id, "Test Title", "Test Body")

# Verificar tokens registrados
>>> from apps.notifications.models import DeviceToken
>>> DeviceToken.objects.filter(user=user).values("token", "device_type", "is_active")
```

---

## PARTE 4 — TRANSICAO PARA SEMANA 5

Ao concluir a Semana 4, o backend estara **production-ready**:
- **Auth completo**: register, login, logout, 2FA, password reset, OTP, LGPD consents
- **APIs core completas**: doctors (fuzzy search), appointments (full status machine), payments (Stripe + PIX)
- **Notificacoes reais**: push (Firebase), email (SendGrid/SES), SMS (Twilio)
- **Owner admin**: dashboard executivo, gestao convenios/users, audit logs, global settings
- **Relatorios**: financial reports, CSV export
- **Testes robustos**: 80%+ cobertura, E2E flow, load tests
- **60+ endpoints** documentados no Swagger UI
- **shared/gen/** com types, hooks, clients gerados para TODOS os endpoints

**Semana 5: Setup Next.js 16 + Base** — Foco em:
- Next.js 16 + Turbopack + Tailwind CSS 4 + Shadcn/UI scaffold
- Cache Components e React Compiler habilitados
- proxy.ts configurado para auth (JWT verification) e role routing (convenio vs owner)
- App Router: layouts base (sidebar + header + content) para convenio e owner
- Auth frontend: login page, JWT storage (httpOnly cookies), refresh interceptor, rotas protegidas
- TanStack Query configurado com Axios instance
- tsconfig.json com path alias @api/* → ../shared/gen/
- **Todos os hooks e clients ja disponiveis via Kubb — zero boilerplate no frontend**
- Primeira pagina funcional: login → dashboard (dados reais da API)

**Importante para Kubb:** O frontend da semana 5 consumira DIRETAMENTE os hooks e clients
gerados em shared/gen/. Exemplo: `import { useListDoctors } from '@api/hooks'`. Nenhum
codigo de API precisa ser escrito manualmente. O investimento das semanas 1-4 em api:sync
paga dividendos a partir de agora.

---

*Fim do Prompt de Execucao Semana 4*
