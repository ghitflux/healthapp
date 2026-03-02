# HealthApp — Prompt de Execucao Semana 3: APIs Core

> **Objetivo:** Este documento detalha task-by-task a Semana 3 do HealthApp.
> Foco: implementacao completa dos servicos de negocio — ConvenioDashboardService
> com KPIs reais, AvailabilityService otimizado, BookingService robusto, Doctor
> search com pg_trgm, Owner Admin APIs, Celery tasks de producao, e integracao
> end-to-end de notificacoes nos fluxos de negocio.
>
> Pre-requisito: Semana 1 concluida (commit `8e2416f`), Semana 2 concluida.
> Leitura do `CLAUDE.md` raiz, `backend/CLAUDE.md` e `shared/CLAUDE.md`.

---

## ANALISE DO ESTADO ATUAL (Pos-Semana 2)

### O que JA existe (construido nas Semanas 1 e 2):

**Models completos (10+ models com migrations):**
- `core/`: BaseModel (UUID pk, timestamps, soft delete), SoftDeleteManager, exceptions (BusinessLogicError 422, ConflictError 409, GoneError 410), custom_exception_handler, permissions (IsOwner, IsConvenioAdmin, IsDoctor, IsPatient, IsOwnerOrConvenioAdmin), pagination, utils (validate_cpf, validate_cnpj, generate_otp, mask_cpf, mask_email), throttles
- `users/`: CustomUser (email login, encrypted CPF, roles, verification flags, 2FA), ConsentRecord (LGPD), IsAccountOwner
- `convenios/`: Convenio (encrypted CNPJ), ConvenioPlan, ExamType
- `doctors/`: Doctor, DoctorSchedule, ScheduleException
- `appointments/`: Appointment (status workflow + Redis lock), Rating
- `payments/`: Payment (Stripe + PIX fields)
- `notifications/`: Notification (type, channel, JSONField data)

**Views existentes (todas com `@extend_schema` e operationId camelCase):**
- `users/views.py`: RegisterView, LoginView, RefreshTokenView, LogoutView, ProfileView, ChangePasswordView, ForgotPasswordView, ResetPasswordView, VerifyEmailView, VerifyPhoneView, ResendEmailOTPView, ResendPhoneOTPView, Setup2FAView, Verify2FAView, Disable2FAView, Login2FAView, ExportDataView, DeleteAccountView, ConsentsListView, ConsentsUpdateView
- `doctors/views.py`: DoctorViewSet (list/retrieve/slots), DoctorScheduleViewSet, ScheduleExceptionViewSet
- `appointments/views.py`: AppointmentViewSet (list/retrieve/create/cancel/confirm/rate)
- `payments/views.py`: CreatePaymentIntentView, PIXGenerateView, PaymentStatusView, RefundView, PaymentHistoryView, StripeWebhookView
- `convenios/views.py`: ConvenioViewSet (list/retrieve/create/update/destroy/dashboard), ExamTypeViewSet
- `notifications/views.py`: NotificationListView, MarkAsReadView, MarkAllAsReadView, UnreadCountView

**Servicos existentes:**
- `users/services.py`: OTPService (generate/verify email+phone via Redis), AuthService (register, password reset token Redis, update_last_login), UserService (anonymize, export_data) — IMPLEMENTADOS
- `doctors/services.py`: AvailabilityService (calculo de slots real: schedule - booked - exceptions) — IMPLEMENTADO
- `appointments/services.py`: BookingService (create com Redis lock 10min, cancel, confirm) — IMPLEMENTADO
- `payments/services.py`: StripeService (create_payment_intent, create_pix_payment, process_webhook_event, refund_payment) — IMPLEMENTADO
- `notifications/services.py`: NotificationService (create, mark_read, mark_all_read, unread_count) — IMPLEMENTADO; PushService, EmailService, SMSService — STUBS
- `convenios/services.py`: ConvenioDashboardService — **STUB (retorna zeros hardcoded)**

**Auth e Seguranca (Semana 2):**
- JWT com blacklist (logout), 2FA TOTP (django-otp), rate limiting (login 5/min, reset 3/min, register 10/min, OTP 3/15min)
- RBAC enforced em todas as views com role-based querysets
- Validacoes de negocio: CPF, CNPJ, telefone, datas, CRM
- Custom exception handler com formato padrao de erro
- ConsentRecord LGPD com endpoints list/update
- Password reset com token Redis single-use 30min TTL

**Infraestrutura:**
- Docker Compose (PostgreSQL 16, Redis 7.2, MinIO, Celery worker/beat)
- Kubb setup com 7 plugins, `npm run api:sync` funcional
- `shared/gen/` populado (types, zod, clients, hooks, mocks)
- GitHub Actions CI (ruff, mypy, pytest >=80%)
- conftest.py com fixtures: api_client, patient_user, doctor_user, convenio_admin_user, owner_user, convenio, doctor, authenticated_client, patient_client, owner_client, convenio_admin_client
- Factories: UserFactory, PatientFactory, DoctorUserFactory, ConvenioAdminFactory, OwnerFactory, ConvenioFactory, ExamTypeFactory, DoctorFactory, DoctorScheduleFactory, AppointmentFactory, RatingFactory, PaymentFactory, NotificationFactory

**Filters existentes:**
- `doctors/filters.py`: DoctorFilter (specialty, convenio, city, name, is_available, min_price, max_price)
- `convenios/filters.py`: ConvenioFilter (name, subscription_plan, is_active)

**Celery tasks existentes:**
- `appointments/tasks.py`: cleanup_expired_appointments (cancela pending > 30min)
- `notifications/tasks.py`: send_email_notification, send_push_notification, send_bulk_reminders (24h), cleanup_old_notifications (90 dias)

### O que FALTA para a Semana 3:

1. **ConvenioDashboardService real** — Retorna zeros hardcoded. Precisa de queries otimizadas para KPIs reais (total doctors, appointments, revenue, occupancy, cancellation rate, comparativo mensal).
2. **AvailabilityService otimizado** — Funcional mas sem select_related/prefetch_related. Falta paginacao no response de slots.
3. **Doctor search com pg_trgm** — DoctorFilter existe com icontains, mas falta busca fuzzy real via TrigramSimilarity.
4. **Owner Admin APIs** — Nao existem endpoints de owner admin (dashboard executivo, gestao de convenios, users, audit logs, analytics, configuracoes globais).
5. **BookingService integrado com notificacoes** — BookingService cria appointment mas nao dispara notificacoes automaticamente.
6. **Appointment lifecycle notifications** — Falta integrar notificacoes nos fluxos: criacao, confirmacao, cancelamento, lembrete, completacao.
7. **Celery beat schedule** — Tasks de reminder e cleanup nao estao configuradas no celery beat schedule.
8. **Testes de integracao para APIs core** — Faltam test_views.py para doctors, convenios.
9. **Paginacao nas NotificationListView** — Hardcoded [:50], precisa usar StandardResultsSetPagination.
10. **Reports/export endpoints** — Nao existem endpoints de relatorios financeiros e export CSV.
11. **api:sync atualizado** — Apos novos endpoints da semana 3, precisa re-gerar shared/gen/.

---

## PARTE 1 — TAREFAS DETALHADAS

### Dia 1 (Segunda) — ConvenioDashboardService + Owner Admin Dashboard

**Tarefa 3.1 — ConvenioDashboardService com KPIs Reais**
```
Implemente o ConvenioDashboardService com queries otimizadas para KPIs reais:

1. Atualizar convenios/services.py — ConvenioDashboardService.get_dashboard_data(convenio):

   a) total_doctors:
      - Doctor.objects.filter(convenio=convenio, is_available=True).count()

   b) total_appointments_month:
      - Appointment.objects.filter(convenio=convenio, scheduled_date__month=current_month,
        scheduled_date__year=current_year).exclude(status="cancelled").count()

   c) total_revenue_month:
      - Payment.objects.filter(user__doctor__convenio=convenio OU via appointment__convenio,
        status="completed", paid_at__month=current_month).aggregate(Sum("amount"))
      - Alternativa: usar Appointment com payment linkado

   d) occupancy_rate:
      - (appointments_confirmed + appointments_completed) / total_available_slots * 100
      - Calcular total_available_slots usando AvailabilityService para todos os doctors
        do convenio no mes corrente (pode ser custoso — usar cache Redis com TTL 1h)

   e) cancellation_rate:
      - cancelled_count / total_appointments * 100
      - Filtrar por mes corrente

   f) revenue_comparison:
      - Receita mes anterior vs mes atual (percentual de crescimento)

   g) top_doctors:
      - Top 5 medicos por numero de appointments no mes
      - Doctor.objects.filter(convenio=convenio).annotate(
          apt_count=Count("appointment", filter=Q(appointment__scheduled_date__month=...))
        ).order_by("-apt_count")[:5]

   h) appointments_by_status:
      - Breakdown por status: {pending: X, confirmed: Y, completed: Z, cancelled: W}
      - Appointment.objects.filter(convenio=convenio, scheduled_date__month=...).values("status").annotate(count=Count("id"))

   i) revenue_by_day:
      - Receita diaria do mes corrente para grafico
      - Payment.objects.filter(...).values("paid_at__date").annotate(total=Sum("amount")).order_by("paid_at__date")

2. Otimizar queries:
   - Usar select_related/prefetch_related onde necessario
   - Usar annotate/aggregate para evitar queries N+1
   - Considerar cache Redis para metricas pesadas (TTL 5-15 min)

3. Atualizar ConvenioDashboardSerializer para incluir novos campos:
   - total_doctors (IntegerField)
   - total_appointments_month (IntegerField)
   - total_revenue_month (DecimalField)
   - occupancy_rate (FloatField)
   - cancellation_rate (FloatField)
   - revenue_comparison (FloatField — % crescimento)
   - top_doctors (ListField)
   - appointments_by_status (DictField)
   - revenue_by_day (ListField)

4. Atualizar ConvenioViewSet.dashboard action para retornar dados reais

Validacao:
- GET /api/v1/convenios/dashboard/ retorna KPIs reais (nao zeros)
- Seed data gera dados suficientes para KPIs significativos
- Response time < 500ms (queries otimizadas)
- Cache Redis funcional para metricas pesadas

Commit: "feat(backend): convenio dashboard with real KPI queries and Redis caching"
```

**Tarefa 3.2 — Owner Admin APIs: Dashboard Executivo**
```
Implemente os endpoints de Owner Admin para dashboard executivo global:

1. Criar apps/core/admin_views.py (ou apps/users/admin_views.py):
   NAO criar app nova — usar views separadas dentro de apps existentes.

   a) OwnerDashboardView (APIView):
      - GET /api/v1/admin-panel/dashboard/
      - permission_classes = [IsOwner]
      - @extend_schema operationId="getOwnerDashboard", tags=["owner"]
      - Retorna:
        * total_users (por role: patients, doctors, convenio_admins)
        * total_convenios (active, inactive, pending_approval)
        * total_appointments (current month, previous month, growth %)
        * total_revenue (current month, previous month, growth %)
        * average_ticket (ticket medio de pagamento)
        * payment_success_rate (completed / (completed + failed) * 100)
        * top_convenios (top 5 por revenue)
        * users_by_day (registros por dia no mes corrente — para grafico)
        * appointments_by_day (por dia no mes corrente — para grafico)
        * revenue_by_day (por dia no mes corrente — para grafico)

   b) OwnerConvenioListView (ListAPIView):
      - GET /api/v1/admin-panel/convenios/
      - permission_classes = [IsOwner]
      - Filtros: name, subscription_plan, is_active, is_approved
      - Paginacao padrao
      - @extend_schema operationId="listAdminConvenios", tags=["owner"]

   c) OwnerConvenioDetailView (RetrieveAPIView):
      - GET /api/v1/admin-panel/convenios/{id}/
      - permission_classes = [IsOwner]
      - Retorna dados completos + metricas do convenio
      - @extend_schema operationId="getAdminConvenioById", tags=["owner"]

   d) OwnerConvenioSuspendView (APIView):
      - POST /api/v1/admin-panel/convenios/{id}/suspend/
      - permission_classes = [IsOwner]
      - Marca convenio como is_active=False
      - Registra no auditlog
      - @extend_schema operationId="suspendConvenio", tags=["owner"]

   e) OwnerConvenioApproveView (APIView):
      - POST /api/v1/admin-panel/convenios/{id}/approve/
      - permission_classes = [IsOwner]
      - Marca convenio como is_approved=True, approved_at=now()
      - @extend_schema operationId="approveConvenio", tags=["owner"]

   f) OwnerUserListView (ListAPIView):
      - GET /api/v1/admin-panel/users/
      - permission_classes = [IsOwner]
      - Filtros: role, is_active, email, full_name
      - @extend_schema operationId="listAdminUsers", tags=["owner"]

   g) OwnerAuditLogView (ListAPIView):
      - GET /api/v1/admin-panel/audit-logs/
      - permission_classes = [IsOwner]
      - Lista registros do django-auditlog
      - Filtros: model_name, action, user, date_range
      - @extend_schema operationId="listAuditLogs", tags=["owner"]

2. Criar serializers correspondentes:
   - OwnerDashboardSerializer
   - AdminConvenioListSerializer (light)
   - AdminConvenioDetailSerializer (com metricas)
   - AdminUserListSerializer
   - AuditLogSerializer

3. Criar services:
   - OwnerDashboardService.get_dashboard_data() com queries otimizadas
   - Usar aggregate/annotate, evitar loops N+1

4. Criar urls:
   - Adicionar em config/urls.py: path("api/v1/admin-panel/", include("apps.core.admin_urls"))
   - Ou criar admin_urls.py dentro de core/ com todas as rotas owner

Validacao:
- GET /api/v1/admin-panel/dashboard/ retorna KPIs globais reais
- GET /api/v1/admin-panel/convenios/ lista todos os convenios com paginacao
- POST /api/v1/admin-panel/convenios/{id}/suspend/ desativa convenio
- POST /api/v1/admin-panel/convenios/{id}/approve/ aprova convenio
- GET /api/v1/admin-panel/users/ lista usuarios com filtros
- GET /api/v1/admin-panel/audit-logs/ lista logs de auditoria
- Somente users com role=owner conseguem acessar (403 para outros)
- Swagger UI mostra todos os endpoints com tag "owner"

Commit: "feat(backend): owner admin panel APIs with dashboard, convenio management, audit logs"
```

### Dia 2 (Terca) — Doctor Search + AvailabilityService Otimizado

**Tarefa 3.3 — Doctor Search com pg_trgm (Busca Fuzzy)**
```
Implemente busca textual fuzzy de medicos usando pg_trgm:

1. Criar migration manual para habilitar pg_trgm:
   - RunSQL: CREATE EXTENSION IF NOT EXISTS pg_trgm;
   - Criar GIN index trigram no campo specialty:
     CREATE INDEX idx_doctor_specialty_trgm ON doctors_doctor USING gin (specialty gin_trgm_ops);
   - Criar GIN index trigram no campo full_name (via users_customuser):
     CREATE INDEX idx_user_fullname_trgm ON users_customuser USING gin (full_name gin_trgm_ops);

2. Atualizar doctors/filters.py — DoctorFilter:
   - Adicionar campo search (CharFilter com method="filter_search")
   - filter_search():
     * Usa TrigramSimilarity do django.contrib.postgres.search
     * Busca em: user__full_name, specialty, subspecialties
     * Ordena por similarity score descendente
     * Threshold minimo de 0.1 (para capturar erros de digitacao)
     * Exemplo: buscar "cardio" encontra "cardiologia", "cardiologista"
     * Exemplo: buscar "joao" encontra "Joao", "João"

   ```python
   from django.contrib.postgres.search import TrigramSimilarity
   from django.db.models import Q, Value
   from django.db.models.functions import Greatest

   def filter_search(self, queryset, name, value):
       if not value:
           return queryset
       return queryset.annotate(
           similarity=Greatest(
               TrigramSimilarity("user__full_name", value),
               TrigramSimilarity("specialty", value),
           )
       ).filter(similarity__gte=0.1).order_by("-similarity")
   ```

3. Adicionar endpoint de search explícito (opcional — pode usar o filtro no list):
   - GET /api/v1/doctors/?search=cardio
   - Combina com outros filtros existentes (city, convenio, price range)

4. Otimizar DoctorViewSet.list queryset:
   - select_related("user", "convenio") para evitar N+1
   - prefetch_related("schedules") se necessario
   - Annotate com next_available_slot (opcional, avancado)

Validacao:
- GET /api/v1/doctors/?search=cardio retorna medicos com especialidade cardiologia
- GET /api/v1/doctors/?search=joao retorna medicos com nome similar
- Busca com typo "cardiolgia" retorna resultados (fuzzy matching)
- Combinacao de filtros funciona: ?search=cardio&city=sao+paulo&min_price=100
- Performance: query < 100ms para 1000 doctors

Commit: "feat(backend): doctor fuzzy search with pg_trgm trigram similarity"
```

**Tarefa 3.4 — AvailabilityService Otimizado**
```
Otimize o AvailabilityService com queries eficientes e funcionalidades extras:

1. Atualizar doctors/services.py — AvailabilityService:

   a) Otimizar get_available_slots():
      - Usar select_related no queryset de schedules
      - Fazer uma unica query para booked appointments (ja feito, verificar)
      - Fazer uma unica query para exceptions (ja feito, verificar)
      - Adicionar filtro: nao retornar slots no passado (se date == today, filtrar slots < now)

   b) Criar get_available_dates(doctor, start_date, end_date) -> list[date]:
      - Retorna lista de datas com pelo menos 1 slot disponivel no range
      - Util para o frontend/mobile mostrar calendario com dias clicaveis
      - Otimizacao: consultar schedules + exceptions em batch, nao por dia

   c) Criar get_next_available_slot(doctor) -> dict | None:
      - Retorna o proximo slot disponivel a partir de agora
      - Busca ate 30 dias no futuro
      - Retorna {date, time, duration_minutes} ou None
      - Util para mostrar "Proximo horario: Seg 03/03 as 14:00"

   d) Cache (opcional):
      - Cache de available_dates com TTL 5 min no Redis
      - Invalidar cache quando appointment e criado/cancelado

2. Criar novo endpoint no DoctorViewSet:
   - GET /api/v1/doctors/{id}/available-dates/?start_date=2026-03-01&end_date=2026-03-31
   - @extend_schema operationId="getDoctorAvailableDates", tags=["doctors"]
   - Retorna lista de datas com slots disponiveis

3. Atualizar DoctorListSerializer para incluir next_available_slot:
   - Campo extra: next_available_date (DateField nullable)
   - Campo extra: next_available_time (TimeField nullable)
   - Annotate na queryset do DoctorViewSet (ou calcular no serializer)
   - CUIDADO: pode ser pesado para listas grandes — considerar calcular apenas se
     query param ?include_next_slot=true

4. Criar serializers:
   - AvailableDateSerializer: date (DateField), slots_count (IntegerField)

Validacao:
- GET /api/v1/doctors/{id}/slots/?date=2026-03-03 retorna slots (sem slots passados se date=today)
- GET /api/v1/doctors/{id}/available-dates/?start_date=...&end_date=... retorna datas
- DoctorListSerializer inclui next_available_date/time quando solicitado
- Queries otimizadas (verificar com django-debug-toolbar ou logging)

Commit: "feat(backend): optimized availability service with date ranges and next slot"
```

### Dia 3 (Quarta) — Appointment Lifecycle + Notifications Integration

**Tarefa 3.5 — Integrar Notificacoes nos Fluxos de Negocio**
```
Integre notificacoes automaticas em todos os fluxos de negocio:

1. Atualizar appointments/services.py — BookingService:

   a) create_appointment():
      Apos criar appointment, disparar:
      - Notificacao push para paciente: "Agendamento criado! Realize o pagamento em 30 minutos."
      - Notificacao push para doctor.user: "Novo agendamento pendente: {patient_name} em {date} as {time}"
      - Usar send_push_notification.delay() (Celery task)

   b) confirm_appointment():
      Apos confirmar:
      - Notificacao push/email para paciente: "Consulta confirmada com Dr. {name} em {date} as {time}"
      - Usar send_email_notification.delay() + send_push_notification.delay()
      - Agendar reminders automaticos (ver tarefa 3.6)

   c) cancel_appointment():
      Apos cancelar:
      - Se cancelado pelo paciente:
        * Notificacao push para doctor: "Paciente {name} cancelou consulta de {date}"
      - Se cancelado pelo convenio/admin:
        * Notificacao push/email para paciente: "Sua consulta de {date} foi cancelada. Motivo: {reason}"

2. Atualizar payments/services.py — StripeService:

   a) process_webhook_event() (payment_intent.succeeded):
      Apos pagamento confirmado:
      - Notificacao push para paciente: "Pagamento confirmado! Sua consulta esta agendada."
      - Atualizar appointment.status = "confirmed" (se ainda pending)

   b) refund_payment():
      Apos reembolso:
      - Notificacao email para paciente: "Reembolso de R$ {amount} processado. Prazo: 5-10 dias uteis."

3. Criar notifications/helpers.py com funcoes de conveniencia:
   - notify_appointment_created(appointment)
   - notify_appointment_confirmed(appointment)
   - notify_appointment_cancelled(appointment, cancelled_by)
   - notify_payment_completed(payment)
   - notify_payment_refunded(payment)
   - Cada funcao cria Notification + dispara task de envio

Validacao:
- Criar appointment -> notificacao para paciente E medico
- Confirmar appointment -> notificacao para paciente
- Cancelar appointment -> notificacao para parte afetada
- Pagamento confirmado -> notificacao para paciente
- Reembolso -> notificacao email para paciente

Commit: "feat(backend): automated notifications integrated into booking and payment flows"
```

**Tarefa 3.6 — Celery Beat Schedule + Reminder Tasks**
```
Configure o Celery beat schedule para tasks periodicas:

1. Atualizar config/celery.py (ou config/settings/base.py):
   - CELERY_BEAT_SCHEDULE:
     * cleanup_expired_appointments: every 5 minutes
     * send_bulk_reminders: every 1 hour
     * cleanup_old_notifications: every day at 3:00 AM

2. Atualizar notifications/tasks.py — send_bulk_reminders:
   - Implementar multiplos intervalos de reminder:
     * 48h antes: email reminder
     * 24h antes: push + email reminder (ja implementado)
     * 2h antes: push + SMS reminder
     * 30min antes: push final reminder
   - Evitar enviar reminder duplicado (usar campo reminder_sent ou JSONField com sent_reminders)
   - Considerar adicionar campo `reminder_stages_sent` (JSONField) no Appointment
     para rastrear quais lembretes ja foram enviados

3. Criar task: check_no_show_appointments:
   - Executar a cada 30 minutos
   - Appointments com status="confirmed" cuja scheduled_date + scheduled_time + duration
     ja passou ha mais de 30 minutos → marcar como "no_show" se nao foi completado
   - Notificar convenio admin sobre no-shows

4. Criar task: generate_daily_summary:
   - Executar todo dia as 20:00
   - Para cada convenio admin: enviar email com resumo do dia
     (appointments realizados, cancelados, receita, no-shows)
   - Usar NotificationService.create_notification()

5. Registrar todas as tasks no Celery beat schedule

Validacao:
- Celery worker e beat iniciam sem erros
- cleanup_expired_appointments executa a cada 5 minutos
- send_bulk_reminders envia lembretes nos intervalos corretos
- check_no_show_appointments marca no-shows automaticamente
- Nenhum reminder duplicado enviado

Commit: "feat(backend): celery beat schedule with reminders, no-show detection, daily summary"
```

### Dia 4 (Quinta) — Testes de Integracao para APIs Core

**Tarefa 3.7 — Testes de Integracao: Doctor APIs**
```
Crie testes de integracao completos para as APIs de medicos:

Criar doctors/tests/test_views.py:

1. TestDoctorList:
   - test_list_doctors_unauthenticated: -> 200 (publico)
   - test_list_doctors_returns_paginated: -> 200 com next/previous
   - test_list_doctors_filter_by_specialty: ?specialty=cardiologia -> filtrado
   - test_list_doctors_filter_by_city: ?city=sao+paulo -> filtrado
   - test_list_doctors_filter_by_price_range: ?min_price=100&max_price=300 -> filtrado
   - test_list_doctors_filter_by_available: ?is_available=true -> so disponiveis
   - test_list_doctors_search_fuzzy: ?search=cardio -> encontra cardiologia
   - test_list_doctors_search_by_name: ?search=joao -> encontra medicos
   - test_list_doctors_combined_filters: multiplos filtros simultaneos
   - test_list_doctors_no_results: filtros sem match -> 200 com results=[]

2. TestDoctorRetrieve:
   - test_get_doctor_by_id: -> 200 com dados completos
   - test_get_doctor_not_found: -> 404
   - test_get_doctor_includes_rating: -> rating e total_ratings presentes

3. TestDoctorSlots:
   - test_get_slots_available: -> 200 com lista de slots
   - test_get_slots_no_schedule: -> 200 com results=[]
   - test_get_slots_full_day_exception: -> 200 com results=[]
   - test_get_slots_partial_exception: -> 200 sem slots bloqueados
   - test_get_slots_with_booked: -> slots booked marcados como is_available=false
   - test_get_slots_past_date: data passada -> 400 ou results=[] (definir comportamento)
   - test_get_slots_missing_date_param: -> 400

4. TestDoctorCreate:
   - test_convenio_admin_can_create_doctor: -> 201
   - test_owner_can_create_doctor: -> 201
   - test_patient_cannot_create_doctor: -> 403
   - test_create_doctor_invalid_crm: -> 400
   - test_create_doctor_duplicate_crm: -> 400

5. TestDoctorScheduleViewSet:
   - test_convenio_admin_can_list_schedules: -> 200 (filtrado por convenio)
   - test_convenio_admin_can_create_schedule: -> 201
   - test_create_schedule_overlapping: -> 400 (unique_together)
   - test_convenio_admin_can_delete_schedule: -> 204
   - test_patient_cannot_manage_schedules: -> 403

6. TestScheduleExceptionViewSet:
   - test_convenio_admin_can_create_exception: -> 201
   - test_convenio_admin_can_list_exceptions: -> 200
   - test_convenio_admin_can_delete_exception: -> 204

Validacao:
- pytest apps/doctors/tests/test_views.py -v -> todos verdes
- Cobertura doctors/ >= 85%

Commit: "test(backend): comprehensive integration tests for doctor APIs"
```

**Tarefa 3.8 — Testes de Integracao: Convenio APIs**
```
Crie testes de integracao para as APIs de convenio:

Criar convenios/tests/test_views.py:

1. TestConvenioList:
   - test_owner_can_list_all_convenios: -> 200
   - test_convenio_admin_sees_only_own: -> 200 com 1 resultado
   - test_patient_cannot_list_convenios: -> 403
   - test_list_convenios_paginated: -> 200 com paginacao

2. TestConvenioRetrieve:
   - test_owner_can_get_any_convenio: -> 200
   - test_convenio_admin_can_get_own: -> 200
   - test_convenio_admin_cannot_get_other: -> 404 ou 403

3. TestConvenioCreate:
   - test_owner_can_create_convenio: -> 201
   - test_convenio_admin_cannot_create: -> 403
   - test_create_convenio_invalid_cnpj: -> 400
   - test_create_convenio_duplicate_cnpj: -> 400

4. TestConvenioDashboard:
   - test_convenio_admin_can_get_dashboard: -> 200 com KPIs
   - test_patient_cannot_get_dashboard: -> 403
   - test_dashboard_returns_real_data: -> verifica que total_doctors > 0 (com seed data)

5. TestExamTypeViewSet:
   - test_convenio_admin_can_list_exam_types: -> 200
   - test_convenio_admin_can_create_exam_type: -> 201
   - test_create_exam_type_sets_convenio_automatically: -> convenio = admin's convenio
   - test_convenio_admin_can_update_exam_type: -> 200
   - test_convenio_admin_can_delete_exam_type: -> 204
   - test_patient_cannot_manage_exam_types: -> 403

6. TestOwnerAdminPanel:
   - test_owner_can_get_dashboard: -> 200
   - test_owner_can_list_convenios: -> 200
   - test_owner_can_suspend_convenio: -> 200 + is_active=False
   - test_owner_can_approve_convenio: -> 200 + is_approved=True
   - test_owner_can_list_users: -> 200
   - test_owner_can_list_audit_logs: -> 200
   - test_patient_cannot_access_admin: -> 403
   - test_convenio_admin_cannot_access_admin: -> 403

Validacao:
- pytest apps/convenios/tests/test_views.py -v -> todos verdes
- Cobertura convenios/ >= 85%

Commit: "test(backend): comprehensive integration tests for convenio and owner admin APIs"
```

**Tarefa 3.9 — Testes de Integracao: Appointment + Payment Flows**
```
Crie testes end-to-end para os fluxos de agendamento e pagamento:

Criar appointments/tests/test_views.py (se nao existir, ou adicionar):

1. TestAppointmentCreate:
   - test_patient_can_create_appointment: -> 201 + status=pending
   - test_create_appointment_locks_slot: -> 2o create no mesmo slot -> 409
   - test_create_appointment_past_date: -> 400
   - test_create_appointment_no_schedule: -> 400 (medico sem agenda naquele dia)
   - test_doctor_cannot_create_appointment: -> 403
   - test_create_appointment_triggers_notification: -> Notification criada para paciente e doctor

2. TestAppointmentCancel:
   - test_patient_can_cancel_own: -> 200 + status=cancelled
   - test_patient_cannot_cancel_completed: -> 422
   - test_convenio_admin_can_cancel_convenio_appointment: -> 200
   - test_cancel_releases_lock: -> apos cancel, mesmo slot pode ser bookado
   - test_cancel_triggers_notification: -> Notification criada

3. TestAppointmentConfirm:
   - test_convenio_admin_can_confirm: -> 200 + status=confirmed
   - test_patient_cannot_confirm: -> 403
   - test_confirm_only_pending: -> 422 para outros status
   - test_confirm_triggers_notification: -> Notification criada

4. TestAppointmentRate:
   - test_patient_can_rate_completed: -> 201
   - test_patient_cannot_rate_pending: -> 422
   - test_patient_cannot_rate_twice: -> 400 ou 409
   - test_rating_updates_doctor_average: -> doctor.rating atualizado

5. TestAppointmentList:
   - test_patient_sees_only_own: 3 appointments total, patient ve 2 seus
   - test_doctor_sees_only_own: doctor ve seus appointments
   - test_convenio_admin_sees_convenio_appointments: ve todos do convenio
   - test_owner_sees_all: ve todos

Criar payments/tests/test_integration.py:

6. TestPaymentFlow:
   - test_create_payment_intent_for_appointment: -> 201
   - test_create_pix_payment: -> 201
   - test_payment_webhook_confirms_appointment: simular webhook -> payment completed + appointment confirmed
   - test_refund_payment: convenio admin refund -> 200
   - test_patient_cannot_refund: -> 403
   - test_payment_history: -> 200 com lista de pagamentos do user

Validacao:
- pytest apps/appointments/tests/test_views.py apps/payments/tests/ -v -> todos verdes
- Fluxo end-to-end: create -> pay -> confirm -> complete -> rate funciona

Commit: "test(backend): end-to-end integration tests for appointment and payment flows"
```

### Dia 5 (Sexta) — Reports, Polish, api:sync, Coverage

**Tarefa 3.10 — Endpoints de Relatorios e Export**
```
Implemente endpoints de relatorios financeiros e export:

1. Criar convenios/views.py — ConvenioReportView:
   - GET /api/v1/convenios/reports/financial/
   - permission_classes = [IsOwnerOrConvenioAdmin]
   - @extend_schema operationId="getConvenioFinancialReport", tags=["convenio"]
   - Query params: start_date, end_date, group_by (day|week|month)
   - Retorna:
     * total_revenue (soma de payments completed no periodo)
     * total_refunds (soma de refunds no periodo)
     * net_revenue (revenue - refunds)
     * transaction_count
     * average_ticket
     * revenue_by_period (lista agrupada por group_by)
     * revenue_by_payment_method (pix vs credit_card breakdown)
     * top_services (top exam types/consultation types por revenue)

2. Criar convenios/views.py — ConvenioExportView:
   - GET /api/v1/convenios/export/appointments/
   - permission_classes = [IsOwnerOrConvenioAdmin]
   - @extend_schema operationId="exportConvenioAppointments", tags=["convenio"]
   - Query params: start_date, end_date, format (csv|json)
   - Para CSV: retorna HttpResponse com Content-Type text/csv
   - Campos: date, time, patient_name, doctor_name, type, status, price, payment_status

3. Criar owner admin financial report:
   - GET /api/v1/admin-panel/financial/
   - permission_classes = [IsOwner]
   - @extend_schema operationId="getOwnerFinancialReport", tags=["owner"]
   - Retorna metricas financeiras globais da plataforma:
     * total_revenue_platform
     * revenue_by_convenio (breakdown)
     * payment_method_breakdown (pix vs card %)
     * refund_rate
     * reconciliation (stripe vs internal — para verificacao)

4. Criar serializers para reports:
   - FinancialReportSerializer
   - RevenueByPeriodSerializer
   - ExportQuerySerializer (para validar query params)

5. Adicionar rotas nos urls.py correspondentes

Validacao:
- GET /convenios/reports/financial/?start_date=...&end_date=... retorna dados
- GET /convenios/export/appointments/?format=csv retorna CSV valido
- GET /admin-panel/financial/ retorna metricas globais
- Dados batem com seed data existente

Commit: "feat(backend): financial reports and CSV export endpoints for convenio and owner"
```

**Tarefa 3.11 — NotificationListView com Paginacao + Filtros**
```
Melhore a NotificationListView que atualmente retorna hardcoded [:50]:

1. Atualizar notifications/views.py — NotificationListView:
   - Migrar de APIView para ListAPIView (ou GenericAPIView + ListModelMixin)
   - Usar StandardResultsSetPagination (page_size=20)
   - Adicionar filtros:
     * type (CharFilter: appointment|payment|system|reminder)
     * is_read (BooleanFilter)
     * channel (CharFilter: email|push|sms)
   - Ordenar por created_at descendente
   - Manter queryset filtrado por request.user

2. Criar notifications/filters.py:
   - NotificationFilter (FilterSet)
   - Fields: type, is_read, channel

3. Atualizar @extend_schema para refletir paginacao e filtros

Validacao:
- GET /notifications/ retorna paginado (page_size=20)
- GET /notifications/?is_read=false retorna so nao lidas
- GET /notifications/?type=appointment retorna so de appointment
- GET /notifications/?page=2 retorna segunda pagina

Commit: "feat(backend): paginated notification list with type and read status filters"
```

**Tarefa 3.12 — Appointment Rating → Doctor Average Update**
```
Implemente a logica de atualizar rating medio do doctor apos avaliacao:

1. Atualizar appointments/services.py ou doctors/services.py:
   - Criar funcao update_doctor_rating(doctor):
     * Calcula media de todos os ratings do doctor
     * doctor.rating = Rating.objects.filter(doctor=doctor).aggregate(Avg("score"))
     * doctor.total_ratings = Rating.objects.filter(doctor=doctor).count()
     * doctor.save(update_fields=["rating", "total_ratings"])

2. Chamar update_doctor_rating() no AppointmentViewSet.rate action:
   - Apos criar Rating, atualizar o Doctor

3. Ou usar signal:
   - post_save em Rating -> update_doctor_rating(instance.doctor)

Validacao:
- Criar rating -> doctor.rating e total_ratings atualizados
- Criar 3 ratings (3, 4, 5) -> doctor.rating = 4.00

Commit: "feat(backend): auto-update doctor rating average on new rating"
```

**Tarefa 3.13 — Seed Data Atualizado para Semana 3**
```
Atualize o management command seed_data para incluir dados suficientes
para demonstrar os novos endpoints:

1. Atualizar core/management/commands/seed_data.py:
   - Criar 3 convenios (com is_approved=True e um com is_approved=False)
   - Criar 10 medicos distribuidos entre os convenios (com specialties variadas)
   - Criar schedules para todos os medicos (segunda a sexta, 08-12 e 14-18)
   - Criar 5 schedule exceptions (ferias, feriados)
   - Criar 50 appointments com status variados (distribuidos no mes atual e anterior)
     * 20 completed, 15 confirmed, 5 pending, 5 cancelled, 5 no_show
   - Criar 30 payments (20 completed, 5 failed, 3 refunded, 2 pending)
   - Criar 20 ratings (scores de 1 a 5)
   - Criar 50 notifications (variados types e channels)
   - Criar ConsentRecords para todos os users
   - Dados com nomes brasileiros realistas
   - Datas distribuidas no mes atual e anterior (para comparativo do dashboard)

2. Garantir que seed_data e idempotent:
   - Verificar se dados ja existem antes de criar
   - Ou usar --force flag para limpar e recriar

Validacao:
- python manage.py seed_data executa sem erros
- Dashboard do convenio mostra KPIs significativos (nao zeros)
- Dashboard do owner mostra metricas globais reais
- Relatorios financeiros mostram dados realistas

Commit: "feat(backend): enhanced seed data with realistic appointments, payments, and ratings"
```

**Tarefa 3.14 — api:sync Completo + Validacao do Codigo Gerado**
```
Execute pipeline completo de geracao de codigo apos TODAS as mudancas:

1. Garantir que TODOS os novos endpoints tem @extend_schema com:
   - operationId em camelCase
   - tags corretas (owner, convenio, doctors, appointments, payments, notifications)
   - request e response schemas explicitos
   - summary descritivo

2. Lista de novos endpoints que devem aparecer no codigo gerado:
   - getOwnerDashboard
   - listAdminConvenios / getAdminConvenioById
   - suspendConvenio / approveConvenio
   - listAdminUsers
   - listAuditLogs
   - getDoctorAvailableDates
   - getConvenioFinancialReport
   - exportConvenioAppointments
   - getOwnerFinancialReport
   - (mais todos os existentes da semana 1 e 2)

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

Commit: "feat(shared): api:sync with week 3 core API endpoints — types, hooks, clients updated"
```

**Tarefa 3.15 — Cobertura de Testes >= 80% + Lint + Types**
```
Garanta que a cobertura de testes atinge o minimo de 80%:

1. Executar:
   pytest --cov=apps --cov-report=term-missing --cov-fail-under=80 -v

2. Identificar arquivos com baixa cobertura e adicionar testes:
   - Se admin_views (owner panel) tiver cobertura baixa, adicionar smoke tests
   - Se services de reports tiverem cobertura baixa, adicionar testes unitarios
   - Se notifications/helpers.py tiver cobertura baixa, testar funcoes de conveniencia
   - Adicionar testes para nuevas funcionalidades:
     * test_update_doctor_rating
     * test_notification_on_create_appointment
     * test_notification_on_cancel_appointment
     * test_celery_beat_tasks

3. Executar lint e types:
   ruff check apps/ --fix
   mypy apps/

4. Corrigir todos os warnings e erros

Validacao:
- pytest --cov=apps --cov-fail-under=80 passa
- ruff check passa (0 warnings)
- mypy passa (0 erros)

Commit: "test(backend): achieve 80%+ test coverage with integration tests for week 3 features"
```

**Tarefa 3.16 — Polish: Queryset Optimizations + select_related**
```
Revise TODAS as views e garanta que queries estao otimizadas:

1. DoctorViewSet:
   - list: select_related("user", "convenio")
   - retrieve: select_related("user", "convenio").prefetch_related("doctorschedule_set")

2. AppointmentViewSet:
   - list/retrieve: select_related("patient", "doctor__user", "convenio", "exam_type", "payment")
   - Evitar N+1 em appointment list

3. ConvenioViewSet:
   - list: sem foreign keys pesados — OK
   - retrieve: prefetch_related("examtype_set", "doctor_set")

4. PaymentStatusView / PaymentHistoryView:
   - select_related("user") nos querysets

5. NotificationListView:
   - Ja filtrada por user — OK, mas verificar ordering

6. Owner Admin views:
   - Dashboard: usar aggregate/annotate, nao loops Python
   - User list: select_related onde necessario

7. Adicionar django.db.connection.queries logging em development.py
   para monitorar queries em dev (opcional)

Validacao:
- Nenhuma query N+1 detectada (verificar com django-debug-toolbar ou logging)
- Response times < 300ms para list endpoints com 100+ registros

Commit: "perf(backend): queryset optimizations with select_related/prefetch_related across all views"
```

---

## PARTE 2 — CHECKLIST DE ENTREGA SEMANA 3

### Criterios de Aceitacao (Definition of Done)

```
[ ] ConvenioDashboardService com KPIs reais (total_doctors, revenue, occupancy, cancellation)
[ ] Dashboard retorna dados calculados (nao hardcoded zeros)
[ ] Revenue comparison (mes atual vs anterior)
[ ] Top doctors e appointments_by_status no dashboard
[ ] Owner Admin APIs:
    [ ] GET /admin-panel/dashboard/ com metricas globais
    [ ] GET /admin-panel/convenios/ com paginacao e filtros
    [ ] GET /admin-panel/convenios/{id}/ com detalhes
    [ ] POST /admin-panel/convenios/{id}/suspend/ funcional
    [ ] POST /admin-panel/convenios/{id}/approve/ funcional
    [ ] GET /admin-panel/users/ com filtros por role
    [ ] GET /admin-panel/audit-logs/ com django-auditlog
[ ] Doctor search com pg_trgm fuzzy matching
[ ] pg_trgm extension habilitada via migration
[ ] DoctorFilter com campo search usando TrigramSimilarity
[ ] AvailabilityService otimizado:
    [ ] get_available_dates(doctor, start, end) implementado
    [ ] get_next_available_slot(doctor) implementado
    [ ] Slots passados filtrados (se date=today)
    [ ] Endpoint GET /doctors/{id}/available-dates/ funcional
[ ] Notificacoes integradas nos fluxos:
    [ ] Criar appointment -> notificacao paciente + doctor
    [ ] Confirmar appointment -> notificacao paciente
    [ ] Cancelar appointment -> notificacao parte afetada
    [ ] Pagamento confirmado -> notificacao paciente
    [ ] Reembolso -> notificacao paciente
[ ] Celery beat schedule configurado:
    [ ] cleanup_expired_appointments: every 5 min
    [ ] send_bulk_reminders: every 1 hour (multi-stage)
    [ ] cleanup_old_notifications: daily 3AM
    [ ] check_no_show_appointments: every 30 min
[ ] Relatorios financeiros:
    [ ] GET /convenios/reports/financial/ com filtros de data
    [ ] GET /convenios/export/appointments/?format=csv funcional
    [ ] GET /admin-panel/financial/ com metricas globais
[ ] NotificationListView com paginacao (nao [:50])
[ ] Doctor rating average atualizado automaticamente apos avaliacao
[ ] Testes de integracao para doctors, convenios, appointments, payments
[ ] Seed data atualizado com dados realistas para demonstrar dashboards
[ ] npm run api:sync executado com sucesso
[ ] shared/gen/ atualizado com novos types, hooks, clients
[ ] Todos os endpoints com @extend_schema e operationId camelCase
[ ] select_related/prefetch_related em todos os querysets
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
Endpoints novos: 10+ (owner admin, reports, available-dates)
Endpoints totais: 35+ (auth + users + doctors + convenios + appointments + payments + notifications + owner)
Test classes novas: 15+
Test methods novos: 60+
Queries N+1: 0 (todos otimizados)
Response time P95: < 300ms
Dashboard response: < 500ms
Tarefas totais: 16
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
pytest apps/doctors/tests/ -v
pytest apps/convenios/tests/ -v
pytest apps/appointments/tests/ -v

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

# Seed data (atualizado)
python manage.py seed_data

# Reset banco + seed (dev only)
python manage.py flush --no-input
python manage.py migrate
python manage.py seed_data

# Verificar queries (debug)
python manage.py shell -c "from django.db import connection; print(len(connection.queries))"
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

### Celery (Debug)

```bash
# Iniciar worker (foreground, verbose)
celery -A config worker -l info

# Iniciar beat (foreground)
celery -A config beat -l info

# Testar task manualmente no shell
python manage.py shell_plus
>>> from apps.notifications.tasks import send_bulk_reminders
>>> send_bulk_reminders.delay()

# Verificar tasks registradas
celery -A config inspect registered
```

### Testes de APIs via cURL (Manual)

```bash
# Login como owner
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@healthapp.com","password":"SecurePass123!"}' | jq -r '.data.access')

# Owner Dashboard
curl -s http://localhost:8000/api/v1/admin-panel/dashboard/ \
  -H "Authorization: Bearer $TOKEN" | jq

# List Convenios (owner)
curl -s http://localhost:8000/api/v1/admin-panel/convenios/ \
  -H "Authorization: Bearer $TOKEN" | jq

# Suspend Convenio
curl -s -X POST http://localhost:8000/api/v1/admin-panel/convenios/{id}/suspend/ \
  -H "Authorization: Bearer $TOKEN" | jq

# Doctor Search (publico)
curl -s "http://localhost:8000/api/v1/doctors/?search=cardio" | jq

# Doctor Available Dates
curl -s "http://localhost:8000/api/v1/doctors/{id}/available-dates/?start_date=2026-03-01&end_date=2026-03-31" | jq

# Convenio Dashboard (como convenio admin)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinica.com","password":"SecurePass123!"}' | jq -r '.data.access')

curl -s http://localhost:8000/api/v1/convenios/dashboard/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Financial Report
curl -s "http://localhost:8000/api/v1/convenios/reports/financial/?start_date=2026-02-01&end_date=2026-03-01" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Export CSV
curl -s "http://localhost:8000/api/v1/convenios/export/appointments/?format=csv&start_date=2026-02-01&end_date=2026-03-01" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -o appointments.csv
```

---

## PARTE 4 — TRANSICAO PARA SEMANA 4

Ao concluir a Semana 3, o backend tera:
- **APIs Core completas** com servicos de negocio implementados (dashboard, availability, booking, payments)
- **Owner Admin Panel** com dashboard executivo, gestao de convenios/users, audit logs
- **Doctor search fuzzy** com pg_trgm para busca inteligente
- **Notificacoes automaticas** integradas em todos os fluxos (booking, payment, cancellation)
- **Celery beat** com tasks periodicas (reminders, cleanup, no-show detection)
- **Relatorios financeiros** com export CSV
- **80%+ cobertura** de testes
- Codigo gerado atualizado em `shared/gen/`

**Semana 4: Agendamentos, Pagamentos e Notificacoes (Refinamento Final)** — Foco em:
- Firebase Admin integration real para push notifications (PushService implementado)
- SendGrid/SES integration real para emails (EmailService implementado)
- Stripe Payment Intent + PIX integration end-to-end com testes
- Appointment status machine completo (pending → confirmed → in_progress → completed)
- Owner global settings (taxas, limites, politicas de cancelamento)
- Testes de carga (Locust) para validar performance
- Testes end-to-end completos do fluxo: busca → agendamento → pagamento → confirmacao → consulta → avaliacao
- Polish final do backend antes de iniciar frontend na Semana 5

**Importante para Kubb:** Cada novo view ou alteracao de serializer DEVE ter `@extend_schema`
com `operationId` em camelCase. Executar `npm run api:sync` ao final de cada dia.
Os tipos e hooks gerados na semana 3 (owner admin, reports, available-dates) serao consumidos
pelo frontend nas semanas 5-7. Manter disciplina de api:sync a cada mudanca de contrato.

---

*Fim do Prompt de Execucao Semana 3*
