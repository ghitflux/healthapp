# HealthApp - Preparacao Semana 4 (Backend Refinamento Final)

Data de preparacao: 2026-03-02
Estado de entrada: Semana 3 validada 100% (gate fechado em `docs/CHECKLIST_PROJETO_END_TO_END.md`).

## 1. Backlog Tecnico Priorizado

### P0 - Obrigatorio para fechar Semana 4
- [x] Device token management (model + endpoints register/unregister/list)
- [x] PushService real com Firebase Admin SDK (com degradacao graciosa sem credenciais)
- [x] EmailService real (SendGrid/SES) com templates transacionais
- [x] SMSService real (Twilio/Zenvia) com fallback seguro
- [x] Appointment lifecycle completo (`confirmed -> in_progress -> completed`)
- [x] Owner global settings APIs (taxas, limites, politica de cancelamento)
- [ ] Testes de integracao do fluxo E2E backend (busca -> agendamento -> pagamento -> confirmacao -> consulta -> avaliacao) — bloqueado por credencial DB local
- [x] `api:sync` final + validacao TypeScript sem erros

### P1 - Hardening e performance
- [ ] Idempotencia e retry policy para push/email/sms tasks
- [ ] Observabilidade (logs estruturados + contadores de sucesso/falha por provider)
- [ ] Locust baseline de carga com metas de latency/error rate
- [ ] Ajustes finais de RBAC e auditoria para novos endpoints

## 2. Dependencias e Configuracao

### Providers externos
- [ ] Firebase service account (`FIREBASE_CREDENTIALS_JSON` ou `FIREBASE_CREDENTIALS_PATH`)
- [ ] Credencial de email (`SENDGRID_API_KEY` ou AWS SES IAM/SMTP)
- [ ] Credencial SMS (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`)
- [ ] Webhook secrets de pagamento em ambiente de teste

### Infra local/staging
- [ ] Redis/Celery prontos para retries e tasks periodicas
- [ ] Secrets segregados por ambiente (dev/staging/prod)
- [ ] Sentry/monitoramento ativo para capturar falhas de provider

## 3. Plano de Testes Semana 4

### Unitario
- [ ] Services de push/email/sms com mocks dos SDKs externos
- [ ] State machine de appointment (transicoes validas e invalidas)
- [ ] Owner settings validations e defaults

### Integracao
- [ ] Fluxo E2E backend completo
- [ ] Webhooks de pagamento (success/failure/refund)
- [ ] Tasks Celery com retry/backoff e sem duplicidade

### Carga (Locust)
- [ ] Cenarios: busca medicos, criar agendamento, listar notificacoes
- [ ] Meta inicial: p95 < 300ms para list endpoints
- [ ] Meta inicial: taxa de erro < 1% com 300+ usuarios concorrentes

## 4. Definition of Ready (Inicio Semana 4)

- [x] Semana 3 com testes/coverage/sync validados
- [x] Checklist de gate atualizado
- [x] Prompt detalhado da semana disponivel (`docs/PROMPT_EXECUCAO_SEMANA4.md`)
- [ ] Credenciais de providers confirmadas para ambiente de desenvolvimento

## 5. Definition of Done (Fim Semana 4)

- [x] Providers reais integrados e cobertos por teste (unit/service level)
- [ ] Fluxo completo de appointment/payment concluido e testado (execucao integral bloqueada por DB local)
- [x] Novos endpoints documentados em OpenAPI e refletidos em `shared/gen/`
- [ ] Quality gates verdes (`ruff`, `mypy`, `pytest --cov`, `api:sync`, `tsc`) — `pytest --cov` pendente por credencial DB local
