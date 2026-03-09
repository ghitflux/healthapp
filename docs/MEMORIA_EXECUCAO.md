# Memoria de Execucao - Semana 4

Ultima atualizacao: 2026-03-09

## Ajuste de Branding Abase Saúde (2026-03-09)

- Removido branding antigo `SIS` / `HealthApp` das superficies web e mobile.
- Mobile:
  - nome do app, slug, scheme e identificadores Expo atualizados para `Abase Saúde`
  - textos de login, biometria, termos, suporte e mocks Pix atualizados
- Frontend:
  - metadata, sidebar, template auth e titulos de paginas atualizados para `Abase Saúde`
  - chave de persistencia web alterada para `abase-saude-auth`

## Downgrade para Expo SDK 54 (2026-03-09)

- Mobile rebaixado de Expo SDK 55 para SDK 54 para compatibilidade com o Expo Go da Play Store:
  - `expo` -> `^54.0.33`
  - `expo-router` -> `~6.0.23`
  - `react` / `react-dom` -> `19.1.0`
  - `react-native` -> `0.81.5`
  - modulos `expo-*` e `react-native-*` alinhados com `expo install --fix`
- Ajustes de compatibilidade feitos no codigo:
  - removido uso de `useEffectEvent` nas telas/auth e bootstrap de notificacoes
  - `use-notifications.ts` passou a expor callback estavel via `useCallback`
- Validacao local apos downgrade:
  - `npm run type-check` concluido sem erros
  - `expo start --go --lan` voltou a subir o Metro sem erro de incompatibilidade de SDK no host

## Ajuste Expo Go Mobile (2026-03-09)

- Mobile agora pode abrir no Expo Go para validacao de fluxo nao-nativo:
  - `app/_layout.tsx` deixou de importar Stripe estaticamente no root.
  - `src/components/providers/optional-stripe-provider.tsx` carrega `@stripe/stripe-react-native` apenas fora do Expo Go.
  - `metro.config.js` passou a observar apenas `shared/`, evitando varrer `node_modules` da raiz do monorepo no Windows.
  - `metro.config.js` passou a resolver explicitamente `@react-native/virtualized-lists` a partir de `react-native/node_modules`, corrigindo o bundle Android no Expo Go.
  - `metro.config.js` passou a priorizar o `node_modules` interno do `expo-router` e aliasar `@expo/metro-runtime`, corrigindo o conflito entre a versao `55.0.6` trazida pelo `expo` e a `6.1.2` exigida pelo `expo-router`.
  - `package.json` passou a declarar `@kubb/plugin-client`, necessario em runtime para o client gerado usado pelo mobile.
  - `package.json` recebeu scripts `start:go` e `start:go:tunnel`.
- Limitacoes mantidas no Expo Go:
  - pagamentos nativos Stripe continuam indisponiveis
  - notificacoes Firebase continuam desabilitadas no runtime do Expo Go
  - o mock Pix segue funcional para teste de UX
- Validacao local apos os ajustes:
  - `node ./node_modules/expo/bin/cli export --platform android` concluiu sem erro no host Windows
  - `npm run type-check` concluiu sem erros

## Atualizacao Semana 10 Mobile (2026-03-09)

- Busca e descoberta do paciente entregues no mobile:
  - `app/search/index.tsx` implementado com header de busca, debounce 300ms, filtros combinaveis, contagem, infinite scroll e refresh.
  - `app/(tabs)/index.tsx` transformada em dashboard com CTA de busca, especialidades navegaveis, medicos em destaque e carrossel de clinicas.
  - novos hooks `use-doctors.ts`, `use-doctor-profile.ts`, `use-doctor-slots.ts`, `use-clinic.ts` e `use-debounce.ts`.
- Fluxo clinica -> medico -> horario concluido:
  - `app/clinic/[id].tsx` com contato, endereco, atalho para mapa e lista real de medicos da clinica.
  - `app/doctor/[id].tsx` com perfil completo, CRM, preco, duracao, reviews mockadas e CTA de agendamento.
  - `app/booking/select-time.tsx` com calendario horizontal de 30 dias e grid de slots reais.
- Mock local de Pix adicionado para simular checkout antes da Semana 11:
  - `app/booking/confirm.tsx`, `app/booking/payment.tsx` e `app/booking/success.tsx` agora formam um fluxo navegavel fim-a-fim.
  - `mobile/src/stores/booking-store.ts` guarda o draft do booking e o pagamento mock.
  - `mobile/src/lib/mock-data.ts` gera `pix_code`, expiracao, status local e reviews de exemplo.
  - `use-payment-polling.ts` passou a suportar pagamento mock alem do polling real existente.

## Validacoes executadas - Semana 10

- `cd mobile && npm run type-check` ✅
- `cd mobile && npm run lint` ⚠️
  - o processo local do ESLint permaneceu ativo por tempo anormal sem emitir saida adicional nem encerrar, inclusive ao limitar para os arquivos alterados
  - `tsc --noEmit` concluiu sem erros, entao o codigo entregue esta consistente em compilacao
  - a causa aparenta ser comportamental do ambiente/ferramental e nao um erro imediato de tipagem ou sintaxe nas mudancas da Semana 10

## Bloqueios restantes - Semana 10

- O fluxo de Pix entregue nesta semana e **mock local** para validacao de UX:
  - nao cria appointment real
  - nao aparece em `Meus agendamentos`
  - nao dispara webhook Stripe
- O checkout real permanece dependente de:
  - `createAppointment` conectado ao fluxo final da Semana 11
  - `useGeneratePIX` / `useCreatePaymentIntent` com credenciais Stripe reais
  - device build com artefatos nativos para validacao completa

## Atualizacao Semana 9 Mobile (2026-03-09)

- App mobile Expo criado em `mobile/` com Expo Router, NativeWind, TanStack Query, Zustand, Axios, React Hook Form, Zod, SecureStore, biometria local, Stripe provider e wiring inicial de notificacoes.
- Navegacao base concluida:
  - `app/_layout.tsx`, `app/index.tsx`
  - fluxo auth em `app/(auth)/*`
  - 4 tabs fixas: `Inicio`, `Agendamentos`, `Prontuario`, `Perfil`
  - rotas auxiliares `doctor/[id]`, `clinic/[id]` e `booking/*`
- Integracao com API alinhada ao contrato real atual:
  - consumo apenas de `@api/hooks`, `@api/types` e `@api/zod`
  - `mobile/src/lib/kubb-client.ts` configurado sem duplicar `/api`
  - `mobile/src/services/api.ts` com refresh token e fallback de host para Android emulator vs localhost fora do Android
  - home adaptada para `listDoctors(include_next_slot=true)` em vez de convenios
  - appointments separados no client por status
  - prontuario derivado de appointments `completed`
  - detalhe busca `getPaymentStatus(paymentId)` quando `appointment.payment` existe
- Auth mobile implementado conforme restricoes do backend:
  - login com `useLoginUser`
  - register com `useRegisterUser` seguido de auto-login
  - verify email autenticado
  - verify phone com `resendPhoneOTP` antes da confirmacao
  - forgot password com mensagem generica do backend
  - login biometrico habilitado apenas apos sessao tradicional salva
- Fundacao de push/pagamento:
  - `StripeProvider` no root, plugin Stripe no `app.json` e rotas `booking/payment` + `booking/success`
  - `use-payment-polling.ts` criado
  - `use-notifications.ts` com fallback quando artefatos Firebase nao existem

## Validacoes executadas - Semana 9

- `cd mobile && npm install` ✅
- `cd mobile && npm run type-check` ✅
- `cd mobile && npm run lint` ✅
- `cd mobile && npx expo config --json` ✅
- `cd mobile && npx expo-doctor --verbose` ⚠️
  - 16/17 checks OK
  - falha restante: `Check Expo config (app.json/ app.config.js) schema` com `Request timed out`
  - como `expo config --json` resolveu o config completo, o problema observado e de timeout da validacao remota, nao de schema invalido local
- `cd mobile && CI=1 npx expo start --clear --offline` ⚠️
  - Metro subiu em `http://localhost:8081`
  - React Native DevTools falhou por dependencia nativa ausente no host: `libnspr4.so`
  - o bundler permaneceu funcional
- Smoke API publica real:
  - `GET /api/v1/doctors/?include_next_slot=true` retornou `status=success` com dados reais em 2026-03-09
- Smoke auth real com usuario seed:
  - login `patient1@healthapp.com.br` / `Patient@2026!` retornou sucesso
  - `GET /api/v1/users/me/` retornou sucesso
  - `GET /api/v1/appointments/` retornou `total=3`
  - `GET /api/v1/appointments/{id}/` retornou appointment `completed` com `payment`
  - `GET /api/v1/payments/{id}/status/` retornou `status=success`, pagamento `completed`, metodo `pix`
- Smoke de cadastro/validacao:
  - usuario temporario `mobile.week9.1773059131@example.com` criado via `POST /api/v1/auth/register/`
  - login real do usuario temporario validado
  - `POST /api/v1/auth/forgot-password/` validado com resposta generica esperada
  - `verify-email`, `resend-phone-otp` e `verify-phone` validados em-process com DRF views porque o processo HTTP local nao expunha o mesmo cache Redis visivel ao `manage.py shell`

## Bloqueios restantes - Semana 9

- Validacao nativa real de FCM bloqueada ate adicionar:
  - `mobile/google-services.json`
  - `mobile/GoogleService-Info.plist`
- Payment Sheet/PIX nativo completo permanece para Semana 11:
  - depende de chave Stripe publica real
  - depende de build nativo/dev client
  - depende de merchant identifier/artefatos finais
- `expo-doctor` ainda sofre timeout na checagem remota do schema do `app.json`, apesar de `expo config --json` validar o config localmente.

## Atualizacao Semana 7/8 (2026-03-04)

- Painel owner completo no frontend:
  - `/owner/dashboard` com hooks gerados owner, filtros de periodo, KPIs, graficos e preview financeiro.
  - `/owner/convenios` com listagem real, detalhes, aprovar/suspender, create/delete e export CSV/PDF.
  - `/owner/users` com filtros reais, detalhes e escopo seguro de acoes indisponiveis.
  - `/owner/audit-logs` com filtros, paginacao e export CSV/PDF.
  - `/owner/financial` com KPIs globais, reconciliacao, breakdown por metodo e export.
  - `/owner/settings` com leitura/patch real via schema gerado.
  - `/owner/analytics` sem placeholder, com leituras de tendencia.
- Hardening e permissao:
  - `proxy.ts` reforcado com redirecionamento para `/access-denied`.
  - `useAuthGuard` com bloqueio explicito de role invalida.
  - prefetch/preload owner (hover/focus + idle) para reduzir latencia percebida.
- Testes frontend:
  - Vitest + Testing Library configurados.
  - Testes cobrindo fluxos criticos owner (dashboard, convenios, users, audit, settings).
  - CI frontend atualizado para incluir `npm run test`.
- Staging de testes (documentacao):
  - `docs/WEEK8_STAGING_BOUNDARIES.md`
  - `docs/WEEK8_STAGING_BACKEND_READINESS.md`
  - `docs/WEEK8_STAGING_WEB_READINESS.md`
  - `docs/WEEK8_STAGING_SMOKE_TESTS_OWNER.md`
  - `docs/WEEK8_STAGING_ROLLBACK_PLAN.md`

## Contexto consolidado

- Preparacao Semana 4 lida e aplicada.
- Prompt de Execucao Semana 4 executado no backend com geracao OpenAPI/Kubb.
- Hierarquia completa de componentes frontend documentada em:
  - `docs/HIERARQUIA_COMPONENTES_FRONTEND.md`

## Mudancas aplicadas (resumo)

- Notificacoes:
  - `DeviceToken` (model + migration + admin + serializers + endpoints register/unregister/list).
  - `PushService` com Firebase FCM real + batch + inativacao de token invalido + fallback seguro.
  - `EmailService` real com templates HTML transacionais.
  - `SMSService` real com Twilio + verificacao de consentimento.
  - Tasks com retry/backoff e reminders com tracking por estagio (`reminder_stages_sent`).
- Appointments:
  - State machine completa com validacao de transicao.
  - Endpoints novos: `start`, `complete`, `no-show`, `cancellation-policy`, `reminders`.
  - Campos novos no model: `started_at`, `completed_at`, `no_show_at`, `reminder_stages_sent`.
  - Engine de cancelamento (`appointments/policies.py`) + calculo de refund.
- Owner Settings:
  - `PlatformSettings` singleton + migration + admin.
  - Service com cache e invalidacao.
  - Endpoints owner `GET/PATCH /api/v1/admin-panel/settings/`.
  - `MaintenanceModeMiddleware`.
- Payments:
  - `StripeService` expandido para card/PIX/webhook/refund parcial.
  - Integracao com settings dinamicos (`pix_enabled`, `credit_card_enabled`).
- Seed/Load:
  - `seed_data` atualizado para Semana 4 (modo completo e `--minimal`).
  - `backend/locustfile.py` e `backend/scripts/setup_load_test.py`.
- Shared:
  - `npm run api:sync` executado com sucesso, `shared/schema.yaml` e `shared/gen/` atualizados.

## Validacoes executadas

- `backend/.venv/Scripts/ruff.exe check apps --fix` ✅
- `backend/.venv/Scripts/mypy.exe apps` ✅
- `npm run api:sync` ✅
- `npx tsc --noEmit -p tsconfig.base.json` ✅
- Verificacao de operationIds novos no schema ✅

## Bloqueios de validacao restantes

- Suite `pytest` com banco falhou por autenticacao PostgreSQL local:
  - erro: `password authentication failed for user "healthapp"` em `localhost:5432`.
- Necessario ajustar credenciais de DB do ambiente para validar cobertura e integracao E2E/load com execucao real.
