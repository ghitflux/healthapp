# HealthApp — Prompt de Execucao Semana 2: Autenticacao e Seguranca

> **Objetivo:** Este documento detalha task-by-task a Semana 2 do HealthApp.
> Foco: tornar os endpoints de auth e users **production-ready** — implementacao
> real de servicos, testes de integracao, rate limiting enforcement, RBAC end-to-end
> e api:sync completo com codigo gerado validado.
>
> Pre-requisito: Semana 1 concluida (commit `8e2416f`). Leitura do `CLAUDE.md` raiz,
> `backend/CLAUDE.md` e `shared/CLAUDE.md`.

---

## ANALISE DO ESTADO ATUAL (Pos-Semana 1)

### O que JA existe (construido na Semana 1):

**Models completos (10+ models com migrations):**
- `core/`: BaseModel (UUID pk, timestamps, soft delete), exceptions, permissions (IsOwner, IsConvenioAdmin, IsDoctor, IsPatient, IsOwnerOrConvenioAdmin), pagination, utils
- `users/`: CustomUser (email login, encrypted CPF, roles, verification flags), permissions (IsAccountOwner)
- `convenios/`: Convenio (encrypted CNPJ), ExamType, PriceTable
- `doctors/`: Doctor, DoctorSchedule, ScheduleException
- `appointments/`: Appointment (status workflow), Rating
- `payments/`: Payment (Stripe + PIX fields)
- `notifications/`: Notification (type, channel, JSONField data)

**Views existentes (scaffolded com `@extend_schema`):**
- `users/views.py` (249 linhas): RegisterView, LoginView, RefreshTokenView, ProfileView, ChangePasswordView, ForgotPasswordView, ResetPasswordView, VerifyEmailView, VerifyPhoneView, ExportDataView
- `doctors/views.py` (128 linhas): DoctorViewSet com slots endpoint
- `appointments/views.py` (118 linhas): AppointmentViewSet com cancel/confirm/rate actions
- `payments/views.py` (180 linhas): CreatePaymentIntentView, PIXGenerateView, PaymentStatusView, RefundView, StripeWebhookView
- `convenios/views.py` (84 linhas): ConvenioViewSet com dashboard
- `notifications/views.py` (73 linhas): NotificationListView, MarkReadView, MarkAllReadView, UnreadCountView

**Servicos existentes (parcialmente implementados):**
- `users/services.py`: OTPService (generate/verify email+phone via Redis cache), AuthService (register, update_last_login), UserService (anonymize, export_data)
- `doctors/services.py`: AvailabilityService (calculo de slots)
- `appointments/services.py`: BookingService (Redis lock), cleanup task
- `payments/services.py`: StripeService, PixService (stubs)
- `notifications/services.py`: NotificationService, PushService, EmailService, SMSService (stubs)
- `convenios/services.py`: ConvenioDashboardService (stub)

**Infraestrutura:**
- Docker Compose (PostgreSQL 16, Redis 7.2, MinIO, Celery worker/beat)
- Settings split (base/dev/staging/prod), drf-spectacular configurado
- Kubb setup com 7 plugins, `npm run api:sync` funcional
- `shared/gen/` populado (types, zod, clients, hooks, mocks)
- GitHub Actions CI (ruff, mypy, pytest)
- Seed data command
- Testes unitarios basicos de models

### O que FALTA para a Semana 2:

1. **Auth real e robusto** — ForgotPassword e ResetPassword sao TODO/stubs. Falta token real de reset.
2. **Rate limiting enforcement** — Configurado em settings mas nao aplicado nas views de login/reset.
3. **Testes de integracao** — So existem `test_models.py`. Faltam `test_views.py`, `test_serializers.py`, `test_services.py`.
4. **RBAC end-to-end** — Permissions existem mas nao sao aplicadas em todas as views.
5. **Validation robusta** — Serializers basicos, faltam validacoes de negocio (CPF unico, email format, etc).
6. **Resend OTP** — Falta endpoint para reenviar codigo de verificacao.
7. **Logout** — Falta endpoint para blacklist do refresh token.
8. **2FA (TOTP)** — Mencionado no plano, nao implementado.
9. **Consent LGPD** — Endpoint `GET /users/me/consents/` nao existe.
10. **api:sync atualizado** — Apos mudancas na semana 2, precisa re-gerar shared/gen/.

---

## PARTE 1 — TAREFAS DETALHADAS

### Dia 1 (Segunda) — Auth Robusto: Login, Register, Tokens

**Tarefa 2.1 — Endpoint de Logout (Blacklist Refresh Token)**
```
Implemente o endpoint de logout que invalida o refresh token:

1. Criar LogoutSerializer em users/serializers.py:
   - Campo: refresh (CharField, required)

2. Criar LogoutView em users/views.py:
   - POST /api/v1/auth/logout/
   - Recebe refresh token no body
   - Adiciona token a blacklist via rest_framework_simplejwt
   - @extend_schema com operationId="logoutUser", tags=["auth"]
   - permission_classes = [IsAuthenticated]

3. Adicionar rota em users/urls.py:
   path("auth/logout/", views.LogoutView.as_view(), name="logout")

Validacao:
- Login retorna access + refresh
- POST /auth/logout/ com refresh token retorna 200
- Tentar usar o refresh token apos logout retorna 401
- Tentar logout sem token retorna 400

Commit: "feat(backend): logout endpoint with JWT refresh token blacklist"
```

**Tarefa 2.2 — Reset Password com Token Real**
```
Implemente o fluxo completo de reset de senha com token seguro:

1. Atualizar users/services.py — AuthService:
   - generate_password_reset_token(user) -> str:
     Gera token UUID, salva no Redis com chave "pwd_reset:{token}" → user.id,
     TTL de 30 minutos. Retorna o token.
   - verify_password_reset_token(token) -> CustomUser | None:
     Busca no Redis, retorna user se valido, None se expirado/invalido.
     Deleta o token do Redis apos verificacao (single-use).

2. Atualizar ForgotPasswordView:
   - Busca user por email (se existir)
   - Chama AuthService.generate_password_reset_token(user)
   - Agenda envio de email via django.tasks (stub de envio, loga o token)
   - SEMPRE retorna 200 com mensagem generica (previne email enumeration)

3. Atualizar ResetPasswordView:
   - Recebe token + new_password no body
   - Chama AuthService.verify_password_reset_token(token)
   - Se valido: atualiza senha, retorna 200
   - Se invalido: retorna 400 "Invalid or expired reset token."

4. Atualizar ResetPasswordSerializer:
   - Validar new_password com validate_password do Django

Validacao:
- POST /auth/forgot-password/ com email existente retorna 200
- POST /auth/forgot-password/ com email inexistente retorna 200 (mesmo response)
- POST /auth/reset-password/ com token valido + nova senha retorna 200
- POST /auth/reset-password/ com token expirado/invalido retorna 400
- POST /auth/reset-password/ com mesmo token 2x retorna 400 (single-use)
- Login com nova senha funciona apos reset

Commit: "feat(backend): password reset flow with secure Redis-backed tokens"
```

**Tarefa 2.3 — Resend OTP (Email e Phone)**
```
Implemente endpoints para reenviar codigos de verificacao:

1. Criar ResendEmailOTPView em users/views.py:
   - POST /api/v1/auth/resend-email-otp/
   - permission_classes = [IsAuthenticated]
   - Gera novo OTP via OTPService.generate_email_otp(request.user)
   - Agenda envio de email (stub, loga o OTP)
   - Rate limit: max 3 reenvios em 15 minutos (via cache counter)
   - @extend_schema operationId="resendEmailOTP", tags=["auth"]
   - Retorna 200 "Verification code sent to your email."
   - Se email ja verificado, retorna 400 "Email is already verified."

2. Criar ResendPhoneOTPView em users/views.py:
   - POST /api/v1/auth/resend-phone-otp/
   - Mesma logica, usa OTPService.generate_phone_otp
   - @extend_schema operationId="resendPhoneOTP", tags=["auth"]
   - Se phone ja verificado, retorna 400 "Phone is already verified."

3. Adicionar rotas em users/urls.py

Validacao:
- Resend retorna 200 e gera novo OTP
- Verificar com novo OTP funciona
- Resend mais de 3x em 15min retorna 429 Too Many Requests
- Resend em email/phone ja verificado retorna 400

Commit: "feat(backend): resend OTP endpoints with rate limiting"
```

### Dia 2 (Terca) — Rate Limiting + RBAC Enforcement

**Tarefa 2.4 — Rate Limiting nas Views de Auth**
```
Aplique rate limiting real nas views de autenticacao:

1. Instalar e configurar django-ratelimit:
   - Verificar que django-ratelimit esta no requirements/base.txt
   - Aplicar @ratelimit decorator (ou custom throttle classes DRF) nas views:
     * LoginView: 5 req/min por IP (prevenir brute force)
     * ForgotPasswordView: 3 req/min por IP
     * ResetPasswordView: 3 req/min por IP
     * RegisterView: 10 req/min por IP (prevenir spam)
     * ResendEmailOTPView: 3 req/15min por user
     * ResendPhoneOTPView: 3 req/15min por user

2. Criar custom throttle classes em core/throttles.py:
   - LoginRateThrottle (scope="login", rate="5/min")
   - ResetPasswordRateThrottle (scope="reset_password", rate="3/min")
   - RegisterRateThrottle (scope="register", rate="10/min")
   - OTPResendThrottle (scope="otp_resend", rate="3/15min")

3. Aplicar throttle_classes nas views correspondentes

4. Configurar DEFAULT_THROTTLE_RATES em settings/base.py:
   - Atualizar rates existentes se necessario
   - Adicionar "register": "10/min", "otp_resend": "3/15min"

Validacao:
- 5 logins rapidos com credenciais erradas: o 6o retorna 429
- 3 forgot-password rapidos: o 4o retorna 429
- Response header inclui Retry-After
- Apos timeout, requests voltam a funcionar

Commit: "feat(backend): rate limiting enforcement on auth endpoints"
```

**Tarefa 2.5 — RBAC End-to-End nas Views Existentes**
```
Aplique permissions corretas em TODAS as views existentes:

1. users/views.py — ja aplicado (AllowAny em auth, IsAuthenticated em profile)

2. doctors/views.py — DoctorViewSet:
   - list/retrieve: AllowAny (pacientes nao autenticados podem buscar)
   - create/update/destroy: IsConvenioAdmin | IsOwner
   - slots: AllowAny
   - Implementar get_permissions() com override por action

3. appointments/views.py — AppointmentViewSet:
   - list: IsAuthenticated (filtrar por user.role)
   - create: IsPatient (somente pacientes agendam)
   - retrieve: IsAuthenticated (paciente ve os seus, convenio ve os do convenio)
   - cancel: IsAuthenticated (paciente cancela o seu, convenio cancela qualquer do convenio)
   - confirm: IsConvenioAdmin (so convenio confirma)
   - rate: IsPatient (somente paciente avalia)
   - Implementar get_queryset() que filtra por role:
     * patient: appointments do proprio user
     * convenio_admin: appointments do convenio do admin
     * doctor: appointments do proprio doctor
     * owner: todos

4. payments/views.py:
   - CreatePaymentIntentView: IsPatient
   - PIXGenerateView: IsPatient
   - PaymentStatusView: IsAuthenticated (dono do pagamento ou convenio)
   - RefundView: IsConvenioAdmin | IsOwner
   - StripeWebhookView: AllowAny (verificacao via signature)

5. convenios/views.py — ConvenioViewSet:
   - list: IsOwner (so owner lista todos)
   - retrieve: IsOwnerOrConvenioAdmin (admin ve o seu)
   - create: IsOwner
   - update: IsOwnerOrConvenioAdmin
   - dashboard: IsConvenioAdmin (dados do proprio convenio)
   - Implementar get_queryset() por role

6. notifications/views.py:
   - Todas as views: IsAuthenticated
   - Filtrar notificacoes por request.user no get_queryset

Validacao (para cada app):
- Paciente NAO consegue criar medico (403)
- Convenio admin NAO consegue ver appointments de outro convenio (404 ou 403)
- Owner consegue acessar tudo
- Doctor so ve seus appointments
- Paciente so ve suas notificacoes
- Webhook Stripe nao exige autenticacao

Commit: "feat(backend): RBAC enforcement across all views with role-based querysets"
```

### Dia 3 (Quarta) — Serializers Robustos + Validation

**Tarefa 2.6 — Validacoes de Negocio nos Serializers**
```
Adicione validacoes robustas em todos os serializers:

1. users/serializers.py — RegisterSerializer:
   - Validar CPF (formato XXX.XXX.XXX-XX e digitos verificadores)
   - Criar funcao validate_cpf() em core/utils.py (algoritmo oficial da Receita)
   - Validar telefone brasileiro (formato +55 XX XXXXX-XXXX)
   - Validar date_of_birth (nao pode ser no futuro, idade minima 16 anos)
   - Validar unicidade de email (erro claro: "Email already registered")
   - Validar unicidade de CPF (erro claro: "CPF already registered")
   - Validar unicidade de phone (erro claro: "Phone already registered")

2. users/serializers.py — LoginSerializer:
   - Verificar se conta esta ativa
   - Mensagem generica de erro (nao revelar se email existe ou nao)

3. appointments/serializers.py — CreateAppointmentSerializer:
   - Validar que scheduled_date nao e no passado
   - Validar que scheduled_time esta dentro do horario do medico
   - Validar que paciente nao tem outro appointment no mesmo horario
   - Validar que medico pertence ao convenio informado

4. doctors/serializers.py — DoctorSerializer:
   - Validar CRM (formato numerico, 4-10 digitos)
   - Validar crm_state (UF brasileira valida, 2 caracteres)
   - Validar consultation_duration (minimo 15, maximo 120 minutos)

5. payments/serializers.py:
   - Validar amount (minimo R$ 1.00, maximo R$ 50.000,00)
   - Validar currency (somente "BRL" por enquanto)

6. convenios/serializers.py:
   - Validar CNPJ (formato XX.XXX.XXX/XXXX-XX e digitos verificadores)
   - Criar funcao validate_cnpj() em core/utils.py

Validacao:
- CPF invalido retorna 400 com mensagem clara
- CNPJ invalido retorna 400 com mensagem clara
- Data no passado para appointment retorna 400
- Telefone fora do formato retorna 400
- Todos os erros seguem formato padrao DRF

Commit: "feat(backend): business validation in serializers (CPF, CNPJ, phone, dates)"
```

**Tarefa 2.7 — Custom Exception Handler + Formato Padrao de Erro**
```
Implemente exception handler customizado para respostas padronizadas:

1. Atualizar core/exceptions.py:
   - custom_exception_handler(exc, context) que formata TODOS os erros assim:
     {
       "status": "error",
       "errors": [
         {"field": "email", "detail": "Email already registered."},
         {"field": "non_field_errors", "detail": "Invalid email or password."}
       ],
       "code": "validation_error"
     }
   - Tratar: ValidationError, AuthenticationFailed, NotAuthenticated,
     PermissionDenied, NotFound, Throttled, BusinessLogicError, ConflictError
   - Para Throttled: incluir "retry_after" no response

2. Garantir que BusinessLogicError, ConflictError, GoneError herdam de APIException
   com status_code correto (422, 409, 410)

3. Adicionar logging para erros 500 (inesperados)

Validacao:
- Erros de validacao retornam formato padrao com lista de erros
- 401 retorna {"status": "error", "errors": [...], "code": "not_authenticated"}
- 403 retorna {"status": "error", "errors": [...], "code": "permission_denied"}
- 429 retorna {"status": "error", ..., "retry_after": 60}
- 409 (ConflictError) retorna formato padrao
- 500 e logado no Sentry/console

Commit: "feat(backend): custom exception handler with standardized error format"
```

### Dia 4 (Quinta) — Testes de Integracao

**Tarefa 2.8 — Test Fixtures e Helpers**
```
Crie infraestrutura de testes robusta:

1. Criar conftest.py em backend/ (root):
   - Fixture @pytest.fixture: api_client (APIClient do DRF)
   - Fixture: authenticated_client(user) -> APIClient com JWT
   - Fixture: patient_user -> CustomUser com role=patient, email_verified=True
   - Fixture: doctor_user -> CustomUser com role=doctor
   - Fixture: convenio_admin_user -> CustomUser com role=convenio_admin
   - Fixture: owner_user -> CustomUser com role=owner
   - Fixture: convenio -> Convenio completo
   - Fixture: doctor -> Doctor com user, convenio, schedules
   - Usar factory-boy para todas as fixtures

2. Atualizar factories em cada app:
   - users/tests/factories.py: CustomUserFactory com subfactories por role
     (PatientFactory, DoctorUserFactory, ConvenioAdminFactory, OwnerFactory)
   - convenios/tests/factories.py: ConvenioFactory, ExamTypeFactory
   - doctors/tests/factories.py: DoctorFactory, DoctorScheduleFactory
   - appointments/tests/factories.py: AppointmentFactory, RatingFactory
   - payments/tests/factories.py: PaymentFactory
   - notifications/tests/factories.py: NotificationFactory

3. Configurar pytest.ini ou pyproject.toml:
   - DJANGO_SETTINGS_MODULE = "config.settings.development"
   - Usar banco de teste PostgreSQL (NAO SQLite)
   - pytest markers: slow, integration

Validacao:
- pytest --co (collect only) lista todos os testes
- Fixtures sao reutilizaveis entre apps

Commit: "test(backend): test infrastructure with conftest, factories, fixtures"
```

**Tarefa 2.9 — Testes de Integracao: Auth Endpoints**
```
Crie testes de integracao completos para TODOS os endpoints de auth:

Criar users/tests/test_views.py:

1. TestRegister:
   - test_register_success: dados validos -> 201 + user criado
   - test_register_duplicate_email: -> 400
   - test_register_duplicate_cpf: -> 400
   - test_register_invalid_cpf: -> 400
   - test_register_weak_password: -> 400
   - test_register_missing_fields: -> 400
   - test_register_password_mismatch: -> 400
   - test_register_underage: -> 400 (idade < 16)

2. TestLogin:
   - test_login_success: -> 200 + access + refresh + user
   - test_login_invalid_password: -> 400
   - test_login_nonexistent_email: -> 400
   - test_login_inactive_user: -> 400
   - test_login_rate_limit: 6 tentativas -> 429

3. TestRefreshToken:
   - test_refresh_success: -> 200 + novo access
   - test_refresh_invalid_token: -> 401
   - test_refresh_blacklisted_token: -> 401 (apos rotate)

4. TestLogout:
   - test_logout_success: -> 200 + refresh blacklisted
   - test_logout_invalid_token: -> 400
   - test_logout_unauthenticated: -> 401

5. TestForgotPassword:
   - test_forgot_password_existing_email: -> 200
   - test_forgot_password_nonexistent_email: -> 200 (mesmo response)
   - test_forgot_password_rate_limit: -> 429

6. TestResetPassword:
   - test_reset_password_success: -> 200 + login com nova senha funciona
   - test_reset_password_invalid_token: -> 400
   - test_reset_password_expired_token: -> 400
   - test_reset_password_used_token: -> 400 (single-use)

7. TestVerifyEmail:
   - test_verify_email_success: -> 200 + email_verified=True
   - test_verify_email_invalid_code: -> 400
   - test_verify_email_expired_code: -> 400

8. TestVerifyPhone:
   - test_verify_phone_success: -> 200 + phone_verified=True
   - test_verify_phone_invalid_code: -> 400

9. TestResendOTP:
   - test_resend_email_otp_success: -> 200
   - test_resend_email_already_verified: -> 400
   - test_resend_email_rate_limit: -> 429
   - test_resend_phone_otp_success: -> 200

10. TestProfile:
    - test_get_profile: -> 200 + dados corretos
    - test_update_profile: -> 200 + campos atualizados
    - test_delete_account: -> 204 + user anonymized
    - test_profile_unauthenticated: -> 401

11. TestChangePassword:
    - test_change_password_success: -> 200
    - test_change_password_wrong_old: -> 400
    - test_change_password_weak_new: -> 400

12. TestExportData:
    - test_export_data_success: -> 200 + dados pessoais no response

Validacao:
- pytest apps/users/tests/test_views.py -v -> todos verdes
- Cobertura de users/ >= 85%

Commit: "test(backend): comprehensive integration tests for auth endpoints"
```

**Tarefa 2.10 — Testes de Integracao: RBAC**
```
Crie testes que validam RBAC em TODAS as views:

Criar tests/test_rbac.py (na raiz de tests/ ou em cada app):

1. TestDoctorRBAC:
   - test_patient_can_list_doctors: -> 200
   - test_patient_cannot_create_doctor: -> 403
   - test_convenio_admin_can_create_doctor: -> 201
   - test_convenio_admin_cannot_create_doctor_other_convenio: -> 403
   - test_owner_can_create_doctor_any_convenio: -> 201
   - test_anon_can_list_doctors: -> 200 (busca publica)
   - test_anon_can_get_slots: -> 200

2. TestAppointmentRBAC:
   - test_patient_can_create_appointment: -> 201
   - test_doctor_cannot_create_appointment: -> 403
   - test_patient_sees_only_own_appointments: query retorna so os seus
   - test_convenio_admin_sees_convenio_appointments: filtra por convenio
   - test_owner_sees_all_appointments: sem filtro
   - test_patient_can_cancel_own: -> 200
   - test_patient_cannot_cancel_others: -> 404 ou 403
   - test_convenio_can_confirm: -> 200
   - test_patient_cannot_confirm: -> 403

3. TestPaymentRBAC:
   - test_patient_can_create_intent: -> 201
   - test_doctor_cannot_create_intent: -> 403
   - test_convenio_can_refund: -> 200
   - test_patient_cannot_refund: -> 403
   - test_webhook_no_auth_required: -> 200 (com signature valida)

4. TestConvenioRBAC:
   - test_owner_can_list_convenios: -> 200
   - test_convenio_admin_cannot_list_all: -> 403
   - test_convenio_admin_can_see_own: -> 200
   - test_patient_cannot_access_convenio_panel: -> 403

5. TestNotificationRBAC:
   - test_user_sees_only_own_notifications: query retorna so as suas
   - test_user_cannot_mark_others_as_read: -> 404

Validacao:
- pytest tests/test_rbac.py -v -> todos verdes
- Nenhum endpoint permite acesso indevido

Commit: "test(backend): RBAC integration tests across all views"
```

### Dia 5 (Sexta) — 2FA, LGPD Consents, Polish, api:sync

**Tarefa 2.11 — 2FA com TOTP (django-otp)**
```
Implemente autenticacao de dois fatores com TOTP:

1. Criar endpoints em users/views.py:
   - POST /api/v1/auth/2fa/setup/
     * IsAuthenticated
     * Gera TOTP device via django-otp
     * Retorna provisioning URI (para QR code) + backup codes
     * @extend_schema operationId="setup2FA", tags=["auth"]

   - POST /api/v1/auth/2fa/verify/
     * IsAuthenticated
     * Recebe token TOTP (6 digitos)
     * Verifica com device.verify_token()
     * Se valido: marca is_2fa_enabled=True, confirma device
     * @extend_schema operationId="verify2FA", tags=["auth"]

   - POST /api/v1/auth/2fa/disable/
     * IsAuthenticated
     * Recebe password para confirmacao
     * Remove TOTP device, marca is_2fa_enabled=False
     * @extend_schema operationId="disable2FA", tags=["auth"]

2. Atualizar LoginView:
   - Se user.is_2fa_enabled:
     * NAO retorna tokens no login
     * Retorna {"requires_2fa": true, "temp_token": "<uuid>"}
     * Salva temp_token no Redis com TTL 5 minutos

   - POST /api/v1/auth/2fa/login/
     * Recebe temp_token + totp_code
     * Verifica temp_token no Redis
     * Verifica TOTP code
     * Se ambos validos: retorna access + refresh tokens
     * @extend_schema operationId="login2FA", tags=["auth"]

3. Criar serializers:
   - Setup2FASerializer (response: provisioning_uri, backup_codes)
   - Verify2FASerializer (request: token CharField 6 chars)
   - Disable2FASerializer (request: password)
   - Login2FASerializer (request: temp_token, totp_code)

4. Adicionar rotas em users/urls.py

Validacao:
- Setup retorna QR code URI
- Verify com TOTP valido ativa 2FA
- Login com 2FA ativo retorna requires_2fa
- Login 2FA com codigo correto retorna tokens
- Login 2FA com codigo errado retorna 400
- Disable com senha correta desativa 2FA

Commit: "feat(backend): TOTP 2FA authentication with django-otp"
```

**Tarefa 2.12 — Consentimentos LGPD**
```
Implemente modelo e endpoints de consentimento LGPD:

1. Criar model ConsentRecord em users/models.py:
   - id (UUID pk)
   - user (FK CustomUser)
   - purpose (CharField choices):
     * "appointment_booking" — agendamento de consultas
     * "notifications_email" — notificacoes por email
     * "notifications_push" — notificacoes push
     * "notifications_sms" — notificacoes SMS
     * "marketing" — comunicacoes de marketing
     * "data_analytics" — uso de dados para analytics
   - granted (BooleanField)
   - granted_at (DateTimeField null)
   - revoked_at (DateTimeField null)
   - ip_address (GenericIPAddressField)
   - user_agent (CharField)
   - Meta: unique_together = (user, purpose)

2. Criar serializers:
   - ConsentRecordSerializer (read)
   - UpdateConsentSerializer (write: purpose, granted)

3. Criar views:
   - GET /api/v1/users/me/consents/
     * Lista todos os consentimentos do user
     * @extend_schema operationId="listConsents", tags=["users"]
   - PATCH /api/v1/users/me/consents/
     * Atualiza consentimentos (lista de {purpose, granted})
     * Registra IP e user-agent
     * @extend_schema operationId="updateConsents", tags=["users"]

4. Registrar ConsentRecord no django-auditlog

5. Migration + seed data com consentimentos padrao

Validacao:
- GET /consents/ retorna lista de consentimentos
- PATCH /consents/ atualiza granted e registra timestamp
- Revogar consentimento registra revoked_at
- Auditlog registra mudancas

Commit: "feat(backend): LGPD consent records with audit trail"
```

**Tarefa 2.13 — Serializer test_serializers.py**
```
Crie testes unitarios para TODOS os serializers:

Criar users/tests/test_serializers.py:

1. TestRegisterSerializer:
   - test_valid_data: dados completos -> is_valid()
   - test_invalid_cpf: CPF invalido -> not is_valid()
   - test_invalid_phone: telefone fora do formato -> not is_valid()
   - test_password_mismatch: senhas diferentes -> not is_valid()
   - test_weak_password: senha fraca -> not is_valid()
   - test_underage: data de nascimento -> idade < 16 -> not is_valid()
   - test_duplicate_email: email ja existe -> not is_valid()

2. TestLoginSerializer:
   - test_valid_credentials: -> is_valid() + user no validated_data
   - test_invalid_credentials: -> not is_valid()
   - test_inactive_user: -> not is_valid()

3. TestProfileSerializer:
   - test_read_only_fields: id, email, role nao podem ser alterados
   - test_partial_update: atualizar so full_name

4. TestChangePasswordSerializer:
   - test_correct_old_password: -> is_valid()
   - test_wrong_old_password: -> not is_valid()

5. TestConsentSerializer:
   - test_valid_consent: -> is_valid()
   - test_invalid_purpose: -> not is_valid()

Validacao:
- pytest apps/users/tests/test_serializers.py -v -> todos verdes

Commit: "test(backend): serializer unit tests for users app"
```

**Tarefa 2.14 — Service tests (test_services.py)**
```
Crie testes para os services:

Criar users/tests/test_services.py:

1. TestOTPService:
   - test_generate_email_otp: retorna codigo 6 digitos
   - test_verify_email_otp_success: codigo correto -> True + email_verified
   - test_verify_email_otp_invalid: codigo errado -> False
   - test_verify_email_otp_expired: apos TTL -> False
   - test_generate_phone_otp: retorna codigo 6 digitos
   - test_verify_phone_otp_success: codigo correto -> True + phone_verified

2. TestAuthService:
   - test_register_user: cria user com dados corretos
   - test_generate_password_reset_token: retorna token valido
   - test_verify_password_reset_token_success: token valido -> user
   - test_verify_password_reset_token_expired: -> None
   - test_verify_password_reset_token_single_use: segundo uso -> None
   - test_update_last_login: atualiza last_login

3. TestUserService:
   - test_anonymize_user: campos pessoais anonimizados
   - test_export_user_data: retorna dados completos

Validacao:
- pytest apps/users/tests/test_services.py -v -> todos verdes

Commit: "test(backend): service unit tests for OTPService, AuthService, UserService"
```

**Tarefa 2.15 — api:sync Completo + Validacao do Codigo Gerado**
```
Execute pipeline completo de geracao de codigo apos TODAS as mudancas:

1. Garantir que TODOS os novos endpoints tem @extend_schema com:
   - operationId em camelCase (ex: logoutUser, setup2FA, listConsents)
   - tags corretas
   - request e response schemas explicitos
   - summary descritivo

2. Executar:
   npm run api:sync

3. Validar shared/schema.yaml:
   - python manage.py spectacular --validate --color (sem erros)
   - Schema contem todos os novos endpoints
   - Verificar operationIds no schema YAML

4. Validar shared/gen/:
   - types/ contem interfaces para todos os novos serializers
   - zod/ contem schemas de validacao
   - clients/ contem funcoes para todos os novos endpoints
   - hooks/ contem useQuery/useMutation hooks
   - Verificar que nao ha erros de TypeScript:
     npx tsc --noEmit -p tsconfig.base.json (ou check manual)

5. Listar novos endpoints que devem aparecer no codigo gerado:
   - logoutUser
   - resendEmailOTP / resendPhoneOTP
   - setup2FA / verify2FA / disable2FA / login2FA
   - listConsents / updateConsents
   - (mais todos os existentes da semana 1)

Validacao:
- npm run api:sync executa sem erros
- shared/gen/ atualizado com novos types e hooks
- Schema valido (sem warnings do spectacular)

Commit: "feat(shared): api:sync with week 2 auth endpoints — types, hooks, clients updated"
```

**Tarefa 2.16 — Cobertura de Testes >= 80%**
```
Garanta que a cobertura de testes atinge o minimo de 80%:

1. Executar:
   pytest --cov=apps --cov-report=term-missing --cov-fail-under=80 -v

2. Identificar arquivos com baixa cobertura e adicionar testes:
   - Se services.py de outras apps (doctors, appointments, payments) tiverem
     cobertura baixa, adicionar testes unitarios basicos
   - Se views de outras apps tiverem cobertura baixa, adicionar testes
     minimos (smoke tests: 200 para list, 401 para unauthenticated)

3. Executar lint e types:
   ruff check apps/ --fix
   mypy apps/

4. Corrigir todos os warnings e erros

Validacao:
- pytest --cov=apps --cov-fail-under=80 passa
- ruff check passa (0 warnings)
- mypy passa (0 erros)

Commit: "test(backend): achieve 80%+ test coverage across all apps"
```

---

## PARTE 2 — CHECKLIST DE ENTREGA SEMANA 2

### Criterios de Aceitacao (Definition of Done)

```
[ ] Endpoint POST /auth/logout/ funcional (blacklist refresh token)
[ ] Fluxo forgot-password -> reset-password com token Redis (single-use, 30min TTL)
[ ] Endpoints resend-email-otp e resend-phone-otp com rate limiting
[ ] Rate limiting aplicado em login (5/min), reset (3/min), register (10/min), OTP (3/15min)
[ ] RBAC enforced em TODAS as views:
    [ ] doctors: AllowAny list, ConvenioAdmin create/update/delete
    [ ] appointments: Patient create, ConvenioAdmin confirm, role-based querysets
    [ ] payments: Patient create intent, ConvenioAdmin refund
    [ ] convenios: Owner list all, ConvenioAdmin own
    [ ] notifications: User own only
[ ] Validacoes de negocio: CPF, CNPJ, telefone, datas, CRM
[ ] Custom exception handler com formato padrao de erro
[ ] 2FA TOTP via django-otp (setup, verify, disable, login flow)
[ ] ConsentRecord model com endpoints LGPD (list, update)
[ ] Testes de integracao para TODOS os endpoints de auth (12+ test classes)
[ ] Testes de RBAC cross-app (5 test classes)
[ ] Testes unitarios de serializers e services
[ ] Cobertura de testes >= 80%
[ ] ruff check: 0 warnings
[ ] mypy: 0 erros
[ ] npm run api:sync executado com sucesso
[ ] shared/gen/ atualizado com novos types, hooks, clients
[ ] Todos os endpoints com @extend_schema e operationId camelCase
[ ] Todos os commits seguem Conventional Commits
```

### Metricas de Qualidade Esperadas

```
Cobertura de testes: >= 80%
Warnings do ruff: 0
Erros do mypy: 0
Endpoints de auth: 15+ (register, login, logout, refresh, forgot, reset,
                        verify-email, verify-phone, resend-email, resend-phone,
                        2fa-setup, 2fa-verify, 2fa-disable, 2fa-login,
                        profile GET/PATCH/DELETE, change-password, export-data,
                        consents GET/PATCH)
Test classes: 20+
Test methods: 80+
Tarefas totais: 16
Tempo estimado: 5 dias (40h)
```

---

## PARTE 3 — COMANDOS DE REFERENCIA RAPIDA

### Desenvolvimento Local

```bash
# Subir ambiente (se nao estiver rodando)
cd backend/
docker-compose -f docker-compose.dev.yml up -d

# Rodar testes com cobertura
pytest --cov=apps --cov-report=term-missing -v

# Rodar testes de uma app especifica
pytest apps/users/tests/ -v

# Rodar testes com marker especifico
pytest -m integration -v

# Lint
ruff check apps/ --fix

# Type check
mypy apps/

# Shell interativo (testar services)
python manage.py shell_plus

# Verificar schema OpenAPI
python manage.py spectacular --validate --color

# Exportar schema
python manage.py spectacular --color --file ../shared/schema.yaml --validate
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

### Testes de Auth via cURL (Manual)

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"SecurePass123!","password_confirm":"SecurePass123!","full_name":"Test User","phone":"+5511999999999","cpf":"123.456.789-09","date_of_birth":"1990-01-15","gender":"M"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"SecurePass123!"}'

# Profile (com token)
curl http://localhost:8000/api/v1/users/me/ \
  -H "Authorization: Bearer <access_token>"

# Logout
curl -X POST http://localhost:8000/api/v1/auth/logout/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<refresh_token>"}'

# Forgot Password
curl -X POST http://localhost:8000/api/v1/auth/forgot-password/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'
```

---

## PARTE 4 — TRANSICAO PARA SEMANA 3

Ao concluir a Semana 2, o backend tera:
- Auth **production-ready** com login, register, logout, password reset, OTP, 2FA, LGPD consents
- RBAC **enforced** em todas as views
- Validacoes de negocio **robustas** (CPF, CNPJ, telefone, datas)
- **80%+ cobertura** de testes
- Codigo gerado atualizado em `shared/gen/`

**Semana 3: APIs Core** — Foco em implementacao completa dos servicos de negocio:
- ConvenioDashboardService (KPIs reais com queries otimizadas)
- AvailabilityService (calculo de slots real com select_related/prefetch_related)
- BookingService (fluxo completo com Redis lock e validacoes)
- Doctor search com django-filter + pg_trgm (busca fuzzy)
- Owner Admin APIs (dashboard executivo, gestao de convenios/users)
- Testes de integracao para todas as APIs core

**Importante para Kubb:** Cada novo view ou alteracao de serializer DEVE ter `@extend_schema`
com `operationId` em camelCase. Executar `npm run api:sync` ao final de cada dia.

---

*Fim do Prompt de Execucao Semana 2*
