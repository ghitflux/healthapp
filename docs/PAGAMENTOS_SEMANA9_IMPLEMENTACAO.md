# HealthApp — Implementação de Pagamentos (Semana 9+)

> **Referência:** Executar junto com o início da Fase 3 — Mobile (Semana 9).
> Diagnóstico gerado em 2026-03-08. Nenhum código foi alterado — apenas documentação.

---

## 1. Estado Atual por Camada

### ✅ Backend — 100% Completo

Todos os endpoints e a lógica de negócio estão implementados e testados (29 testes).

| Componente | Arquivo | Status |
|---|---|---|
| Payment model (PIX + Stripe fields) | `backend/apps/payments/models.py` | ✅ Produção |
| `StripeService.create_payment_intent()` | `backend/apps/payments/services.py` | ✅ Real |
| `StripeService.create_pix_payment()` | `backend/apps/payments/services.py` | ✅ Real |
| `StripeService.process_webhook_event()` | `backend/apps/payments/services.py` | ✅ 4 eventos |
| `StripeService.refund_payment()` | `backend/apps/payments/services.py` | ✅ Full + partial |
| POST `/api/v1/payments/create-intent/` | `backend/apps/payments/views.py` | ✅ `IsPatient` |
| POST `/api/v1/payments/pix/generate/` | `backend/apps/payments/views.py` | ✅ `IsPatient` |
| GET `/api/v1/payments/{pk}/status/` | `backend/apps/payments/views.py` | ✅ RBAC |
| POST `/api/v1/payments/{pk}/refund/` | `backend/apps/payments/views.py` | ✅ `IsOwnerOrConvenioAdmin` |
| GET `/api/v1/payments/history/` | `backend/apps/payments/views.py` | ✅ |
| POST `/api/v1/webhooks/stripe/` | `backend/apps/payments/views.py` | ✅ Assinatura verificada |
| Webhook → `BookingService.confirm_appointment()` | `backend/apps/appointments/services.py` | ✅ Integrado |
| Cancelamento + `RefundCalculator` | `backend/apps/appointments/services.py` | ✅ Integrado |

**Settings (via env vars em `backend/.env`):**

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

### ✅ Shared/gen (Kubb) — 100% Gerado

Todos os hooks, types e Zod schemas já foram gerados e estão prontos para uso via `@api/*`.

**Hooks disponíveis** (`shared/gen/hooks/usePayments/`):

```ts
// Mutations
useCreatePaymentIntent()   // POST /api/v1/payments/create-intent/
useGeneratePIX()           // POST /api/v1/payments/pix/generate/
useRefundPayment()         // POST /api/v1/payments/{id}/refund/

// Queries
useGetPaymentStatus()      // GET  /api/v1/payments/{id}/status/
useGetPaymentHistory()     // GET  /api/v1/payments/history/

// Suspense versions
useGetPaymentStatusSuspense()
useGetPaymentHistorySuspense()
```

**Types disponíveis** (`shared/gen/types/`):

```ts
Payment                             // Objeto completo de pagamento
PaymentStatusEnum                   // 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
PaymentPaymentMethodEnum            // 'pix' | 'credit_card' | 'debit_card'
CreatePaymentIntentRequest          // Body para criar intent
```

---

### ⚠️ Frontend Web — Parcialmente Implementado

> **Importante:** O painel web é para admins (convênio + owner). O paciente NÃO acessa o web — só o mobile.

| Componente | Arquivo | Status |
|---|---|---|
| Dashboard financeiro do convênio (KPIs, charts, breakdown) | `frontend/features/financial/` | ✅ Completo |
| Dashboard financeiro do owner (reconciliação Stripe vs interno) | `frontend/features/owner/owner-financial-page-content.tsx` | ✅ Completo |
| `PaymentMethodBadge` atom | `frontend/components/ds/payment-method-badge.tsx` | ✅ Completo |
| Status de pagamento no `AppointmentDetailDrawer` | `frontend/features/appointments/appointment-detail-drawer.tsx` | ❌ Falta |
| Coluna de status de pagamento na tabela | `frontend/features/appointments/appointments-table.tsx` | ❌ Falta |
| Dialog de reembolso (ConvenioAdmin/Owner) | `frontend/features/financial/refund-dialog.tsx` | ❌ Não existe |

---

### ❌ Mobile — Não Inicializado

A pasta `mobile/` existe mas contém apenas `CLAUDE.md`. Nenhum código ainda.

Todo o fluxo de checkout do paciente (PIX + cartão) será implementado aqui (Semanas 9-11).

---

## 2. O que Precisa Ser Feito

### 🌐 Web — Melhorias de UI Administrativa

Estas mudanças são incrementais e podem ser feitas a partir da Semana 8/9.

#### 2.1 Coluna de Pagamento na AppointmentsTable

**Arquivo:** `frontend/features/appointments/appointments-table.tsx`

Adicionar coluna "Pagamento" exibindo:

- Badge com status: `pending` (amarelo), `completed` (verde), `failed` (vermelho), `refunded` (cinza)
- Método: `<PaymentMethodBadge />` já existente em `components/ds/`

#### 2.2 Seção de Pagamento no AppointmentDetailDrawer

**Arquivo:** `frontend/features/appointments/appointment-detail-drawer.tsx`

Adicionar seção com:

- Método de pagamento (`PaymentMethodBadge`)
- Status com badge colorido
- Valor pago + data `paid_at`
- Botão "Solicitar Reembolso" (visível apenas para `convenio_admin` e `owner`)

#### 2.3 Dialog de Reembolso

**Arquivo novo:** `frontend/features/financial/refund-dialog.tsx`

- Dialog com campo de valor (full/partial) + campo motivo
- Usa `useRefundPayment` de `@api/hooks/usePayments`
- Toast de sucesso/erro via `sonner`
- Atualiza a query de appointments após sucesso

---

### 📱 Mobile — Checkout Completo do Paciente

#### 2.4 Inicializar Projeto Expo

```bash
cd mobile
npx create-expo-app . --template expo-template-blank-typescript
```

**Dependências de pagamento:**

```bash
npx expo install @stripe/stripe-react-native
npx expo install expo-secure-store
npx expo install expo-clipboard        # copiar código PIX
npx expo install expo-image            # exibir QR code base64
```

**`app.json` — adicionar plugin Stripe:**

```json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.healthapp",
          "enableGooglePay": false
        }
      ]
    ]
  }
}
```

#### 2.5 Configurar StripeProvider

**Arquivo:** `mobile/src/app/_layout.tsx` (ou root navigator)

```tsx
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <StripeProvider publishableKey={STRIPE_PK}>
      {/* navegação */}
    </StripeProvider>
  );
}
```

**`.env`:**

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### 2.6 PaymentScreen

**Arquivo:** `mobile/src/screens/booking/PaymentScreen.tsx`

Tabs: **PIX** | **Cartão de Crédito**

**Aba PIX:**

```
1. Chamar useGeneratePIX mutation → { pix_qr_code, copy_paste_code, expiration, payment_id }
2. Exibir QR code (base64) via expo-image
3. Botão "Copiar código" via expo-clipboard
4. Countdown até pix_expiration
5. Polling via useGetPaymentStatus a cada 5s
   - status === 'completed' → navegar para PaymentSuccessScreen
   - status === 'failed'    → exibir erro + opção de tentar novamente
```

**Aba Cartão:**

```
1. Chamar useCreatePaymentIntent mutation → { client_secret }
2. initPaymentSheet(client_secret)
3. Botão "Pagar" → presentPaymentSheet()
4. Sucesso → navegar para PaymentSuccessScreen
```

#### 2.7 Hook de Polling de Status PIX

**Arquivo:** `mobile/src/hooks/usePaymentPolling.ts`

```ts
// Polling com TanStack Query — refetchInterval enquanto pending/processing
export function usePaymentPolling(paymentId: string | null) {
  return useGetPaymentStatus(
    { id: paymentId! },
    {
      query: {
        enabled: Boolean(paymentId),
        refetchInterval: (query) => {
          const status = query.state.data?.data?.status;
          if (status === 'completed' || status === 'failed') return false;
          return 5_000; // 5 segundos
        },
      },
    }
  );
}
```

#### 2.8 PaymentSuccessScreen

**Arquivo:** `mobile/src/screens/booking/PaymentSuccessScreen.tsx`

- Animação Lottie de sucesso (ou Reanimated)
- Detalhes do agendamento confirmado
- Botão "Adicionar ao Calendário" (`expo-calendar`)
- Botão "Ir para Meus Agendamentos"

---

## 3. Fluxo Completo End-to-End

```
[Mobile — Paciente]

TimeSelectionScreen
    └── BookingConfirmationScreen
            │
            ├── PIX ─────────────────────────────────────────────────────┐
            │   POST /api/v1/payments/pix/generate/                       │
            │   ← { pix_qr_code, copy_paste_code, payment_id }           │
            │   Polling GET /api/v1/payments/{id}/status/ (5s)           │
            │   Stripe Webhook → payment_intent.succeeded                 │
            │   Backend: Payment.status = "completed"                     │
            │   Backend: Appointment.status = "confirmed"                 │
            │                                                             ▼
            └── Cartão ───────────────────────────────────────────────────┤
                POST /api/v1/payments/create-intent/                      │
                ← { client_secret }                                       │
                presentPaymentSheet(client_secret)                        │
                Stripe SDK confirma → Stripe Webhook                      │
                Backend: Payment.status = "completed"                     │
                Backend: Appointment.status = "confirmed"                 │
                                                                          ▼
                                                                  PaymentSuccessScreen
                                                                  (agendamento confirmado)


[Web — ConvenioAdmin/Owner]

AppointmentsTable
    └── Coluna "Pagamento" (status badge + método)
            └── AppointmentDetailDrawer
                    └── Seção "Pagamento"
                            └── Botão "Solicitar Reembolso"
                                    └── RefundDialog
                                            POST /api/v1/payments/{id}/refund/
                                            ← Payment.status = "refunded"
```

---

## 4. Arquivos a Criar / Modificar

### Mobile (criação desde zero — Semana 9-11)

| Arquivo | Ação |
|---|---|
| `mobile/package.json` | Criar (Expo init) |
| `mobile/app.json` | Criar com plugin Stripe |
| `mobile/src/app/_layout.tsx` | Criar com `StripeProvider` |
| `mobile/src/screens/booking/PaymentScreen.tsx` | Criar |
| `mobile/src/screens/booking/PaymentSuccessScreen.tsx` | Criar |
| `mobile/src/screens/booking/BookingConfirmationScreen.tsx` | Criar |
| `mobile/src/components/payment/PixPaymentTab.tsx` | Criar |
| `mobile/src/components/payment/CardPaymentTab.tsx` | Criar |
| `mobile/src/hooks/usePaymentPolling.ts` | Criar |

### Frontend Web (Semana 8-9)

| Arquivo | Ação |
|---|---|
| `frontend/features/appointments/appointments-table.tsx` | Modificar — adicionar coluna |
| `frontend/features/appointments/appointment-detail-drawer.tsx` | Modificar — adicionar seção |
| `frontend/features/financial/refund-dialog.tsx` | Criar |

---

## 5. Variáveis de Ambiente

### Backend (`backend/.env`)

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Frontend Web (`frontend/.env.local`)

Não precisa de variáveis Stripe — o web não faz checkout. Apenas exibe dados.

### Mobile (`mobile/.env`)

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:8000
```

---

## 6. Como Testar

### Backend (já funciona)

```bash
cd backend
pytest apps/payments/ -v   # 29 testes
```

### Stripe CLI — Receber webhooks em desenvolvimento

```bash
# Instalar: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to http://localhost:8000/api/v1/webhooks/stripe/
```

### Testar PIX (sandbox Stripe)

- No ambiente de teste, o Stripe não gera QR code real
- Simular sucesso via CLI: `stripe trigger payment_intent.succeeded`

### Mobile (Expo Go / EAS Build)

```bash
cd mobile
npx expo start              # Dev com Expo Go (sem Stripe nativo)
npx expo run:android        # Build local para testar Stripe Payment Sheet
```

---

*Documento gerado em 2026-03-08 — Diagnóstico sem alteração de código.*
