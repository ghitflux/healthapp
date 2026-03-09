# HealthApp — Prompt de Execucao Semana 9: Setup Mobile + Auth

> **Objetivo:** Inicializar o app mobile React Native/Expo do zero e implementar todas as telas base do paciente: Auth, Home, Agendamentos, Prontuario, Perfil e tab bar de navegacao.
>
> **Pre-requisitos:** Backend 100% completo (Semanas 1-4), Frontend Web completo (Semanas 5-8), `shared/gen/` com todos hooks/types/clients gerados pelo Kubb.
>
> **Referencia visual:** Screenshots de mockup mobile fornecidos pelo designer (Login, Home, Agendamentos, Prontuario lista, Prontuario detalhe, Perfil).

---

## 1. Contexto e Decisoes Arquiteturais

### 1.1 O que o app mobile faz

O app mobile e a interface do **paciente**. Ele consome a mesma API REST do backend Django que os paineis web usam, mas com autenticacao via `expo-secure-store` (Keychain iOS / Keystore Android) ao inves de localStorage.

**Fluxo principal do paciente:**
1. Login/Registro → Verificacao email/telefone
2. Home: buscar clinicas/medicos por especialidade, localizacao, preco
3. Selecionar medico → ver slots disponiveis → confirmar agendamento
4. Pagar via PIX ou cartao (Stripe Payment Sheet)
5. Acompanhar agendamentos (proximos/passados)
6. Ver prontuario (historico de consultas completadas)
7. Gerenciar perfil, dependentes, notificacoes

### 1.2 Identidade Visual (baseado nos mockups)

**Branding:** SIS - Sistema Integrado a Saude
- **Cor primaria:** Azul (#2563EB / blue-600)
- **Cor de fundo:** Branco (#FFFFFF)
- **Cards:** Borda arredondada (rounded-xl), sombra suave
- **Badges de status:** Verde (Pago/Confirmado), Amarelo (Pendente), Vermelho (Cancelado)
- **Tab bar:** 4 itens — Inicio, Agendamentos, Prontuario, Perfil
- **Icones tab bar:** Outline quando inativo, filled quando ativo, azul primario quando selecionado
- **Tipografia:** Sistema nativo (San Francisco iOS / Roboto Android), pesos 400/500/600/700

### 1.3 Stack Mobile (versoes exatas)

| Componente | Versao | Funcao |
|---|---|---|
| React Native | 0.76 | Framework cross-platform |
| Expo SDK | 52 | Managed workflow |
| TypeScript | 5.6+ | Tipagem estatica |
| Expo Router | 4 | File-based routing (App Router style) |
| NativeWind | 4 | Tailwind CSS para RN |
| React Native Paper | 5 | Material Design 3 components |
| TanStack Query | 5 | Server state cache |
| Zustand | 5 | Client state |
| React Hook Form + Zod | 7 + 3 | Formularios + validacao |
| expo-secure-store | latest | JWT storage seguro |
| expo-image | latest | Imagens otimizadas |
| expo-clipboard | latest | Copiar codigo PIX |
| expo-local-authentication | latest | Face ID / Touch ID |
| @stripe/stripe-react-native | latest | Payment Sheet nativo |
| @react-native-firebase/messaging | latest | Push notifications |
| react-native-reanimated | 3 | Animacoes 60fps |
| Axios | 1.7 | HTTP client (mesmo do frontend) |
| date-fns | 4 | Datas |

### 1.4 Decisao: Expo Router vs React Navigation

Usar **Expo Router v4** (file-based routing) ao inves de React Navigation stack manual. Motivos:
- Mais alinhado com o App Router do Next.js que ja usamos no frontend
- Deep linking automatico
- Tipagem de rotas automatica
- Layout nesting nativo
- O CLAUDE.md do mobile menciona React Navigation 7 mas Expo Router e construido sobre ele

---

## 2. Estrutura de Pastas Completa

```
mobile/
├── app.json                         # Expo config + plugins (Stripe, Firebase)
├── eas.json                         # EAS Build profiles
├── babel.config.js                  # NativeWind + Reanimated plugins
├── metro.config.js                  # Metro bundler config (NativeWind)
├── nativewind-env.d.ts              # NativeWind TypeScript declarations
├── tailwind.config.ts               # Tailwind config (NativeWind 4)
├── tsconfig.json                    # Path alias @api/* → ../shared/gen/*
├── package.json
├── .env                             # EXPO_PUBLIC_API_URL, EXPO_PUBLIC_STRIPE_PK
├── global.css                       # Tailwind directives (@tailwind base/components/utilities)
├── app/                             # Expo Router (file-based routing)
│   ├── _layout.tsx                  # Root layout: Providers (Query, Zustand, Stripe, Auth)
│   ├── index.tsx                    # Splash redirect (auth check → login ou tabs)
│   │
│   ├── (auth)/                      # Auth stack (sem tab bar)
│   │   ├── _layout.tsx              # Auth layout (fundo azul gradiente)
│   │   ├── login.tsx                # Tela de login
│   │   ├── register.tsx             # Cadastro paciente
│   │   ├── register-clinic.tsx      # Cadastro clinica (redirect para web)
│   │   ├── forgot-password.tsx      # Esqueci senha
│   │   ├── verify-email.tsx         # Verificacao email OTP
│   │   └── verify-phone.tsx         # Verificacao telefone SMS
│   │
│   ├── (tabs)/                      # Tab bar principal (5 tabs)
│   │   ├── _layout.tsx              # Tab navigator config (icones, cores, labels)
│   │   │
│   │   ├── index.tsx                # Tab: Inicio (Home)
│   │   │
│   │   ├── appointments/            # Tab: Agendamentos
│   │   │   ├── _layout.tsx          # Stack navigator para agendamentos
│   │   │   ├── index.tsx            # Lista de agendamentos (Proximos/Passados)
│   │   │   └── [id].tsx             # Detalhe do agendamento
│   │   │
│   │   ├── records/                 # Tab: Prontuario
│   │   │   ├── _layout.tsx          # Stack navigator para prontuario
│   │   │   ├── index.tsx            # Lista de prontuarios (consultas completadas)
│   │   │   └── [id].tsx             # Detalhe do prontuario
│   │   │
│   │   └── profile/                 # Tab: Perfil
│   │       ├── _layout.tsx          # Stack navigator para perfil
│   │       ├── index.tsx            # Tela principal do perfil
│   │       ├── edit.tsx             # Editar dados pessoais
│   │       ├── dependents.tsx       # Gerenciar dependentes
│   │       ├── notifications.tsx    # Config de notificacoes
│   │       ├── medical-history.tsx  # Historico medico
│   │       └── terms.tsx            # Termos e privacidade (LGPD)
│   │
│   ├── clinic/                      # Tela de detalhe da clinica (fora dos tabs)
│   │   └── [id].tsx                 # Perfil da clinica + medicos
│   │
│   ├── doctor/                      # Tela de detalhe do medico
│   │   └── [id].tsx                 # Perfil + avaliacoes + agendar
│   │
│   └── booking/                     # Fluxo de agendamento (fora dos tabs)
│       ├── _layout.tsx              # Stack navigator para booking
│       ├── select-time.tsx          # Selecao de horario
│       ├── confirm.tsx              # Confirmacao + resumo
│       ├── payment.tsx              # Pagamento (PIX/Cartao)
│       └── success.tsx              # Sucesso + comprovante
│
├── src/
│   ├── components/                  # Componentes reutilizaveis
│   │   ├── ui/                      # Primitivos (Button, Input, Card, Badge, etc.)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── divider.tsx
│   │   │   └── icon-button.tsx
│   │   │
│   │   ├── domain/                  # Componentes de dominio (equivalente a ds/ do frontend)
│   │   │   ├── status-badge.tsx     # Badge de status (Confirmado, Pendente, Pago, etc.)
│   │   │   ├── specialty-chip.tsx   # Chip de especialidade
│   │   │   ├── rating-display.tsx   # Estrelas de avaliacao
│   │   │   ├── currency-text.tsx    # Formatacao BRL
│   │   │   ├── clinic-card.tsx      # Card de clinica (Home)
│   │   │   ├── appointment-card.tsx # Card de agendamento
│   │   │   ├── record-card.tsx      # Card de prontuario
│   │   │   ├── doctor-mini-card.tsx # Card de medico mini
│   │   │   └── payment-method-badge.tsx # PIX/Cartao badge
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── screen-wrapper.tsx   # SafeAreaView + padding padrao
│   │   │   ├── section-header.tsx   # Titulo de secao
│   │   │   └── loading-screen.tsx   # Tela de loading (skeleton)
│   │   │
│   │   └── feedback/                # Feedback components
│   │       ├── empty-state.tsx      # Estado vazio com ilustracao
│   │       ├── error-state.tsx      # Estado de erro com retry
│   │       └── toast.tsx            # Toast notifications
│   │
│   ├── services/                    # Service layer
│   │   └── api.ts                   # Axios instance + SecureStore JWT interceptor
│   │
│   ├── stores/                      # Zustand stores
│   │   ├── auth-store.ts            # User, tokens, login/logout actions
│   │   └── app-store.ts             # App-level state (onboarding complete, etc.)
│   │
│   ├── hooks/                       # Custom hooks (wrappers sobre @api/hooks)
│   │   ├── use-auth.ts              # Login, register, verify, biometrics
│   │   ├── use-appointments.ts      # Listar agendamentos do paciente
│   │   ├── use-doctors.ts           # Buscar medicos, slots
│   │   ├── use-records.ts           # Prontuarios completados
│   │   ├── use-notifications.ts     # Notificacoes + unread count
│   │   ├── use-payment-polling.ts   # Polling status PIX (5s)
│   │   └── use-biometrics.ts        # Face ID / Touch ID
│   │
│   ├── lib/                         # Utilitarios
│   │   ├── formatters.ts            # Data, moeda, telefone, CPF
│   │   ├── constants.ts             # Cores, tamanhos, especialidades
│   │   ├── icons.ts                 # Barrel export de icones (lucide-react-native)
│   │   └── storage.ts              # SecureStore helpers (getToken, setToken, removeToken)
│   │
│   ├── theme/                       # NativeWind theme config
│   │   └── colors.ts               # Cores do design system
│   │
│   └── types/                       # Types LOCAIS de UI (nao API — API vem de @api/*)
│       └── navigation.ts            # Route params types
│
└── assets/                          # Assets estaticos
    ├── images/
    │   ├── logo-sis.png             # Logo SIS
    │   ├── onboarding-1.png
    │   ├── onboarding-2.png
    │   └── onboarding-3.png
    └── animations/
        └── success.json             # Lottie animation (pagamento sucesso)
```

---

## 3. Implementacao Passo a Passo

### ETAPA 1: Scaffold do Projeto Expo (30min)

#### 1.1 Criar projeto Expo

```bash
cd d:\apps\Healthapp
npx create-expo-app@latest mobile --template tabs
cd mobile
```

> **Nota:** O template `tabs` ja vem com Expo Router e TypeScript configurados.

#### 1.2 Instalar dependencias

```bash
# Core
npx expo install expo-secure-store expo-image expo-clipboard
npx expo install expo-local-authentication expo-constants expo-linking
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install react-native-safe-area-context react-native-screens

# NativeWind (Tailwind para RN)
npm install nativewind tailwindcss
npx expo install react-native-css-interop

# State & Data
npm install @tanstack/react-query zustand axios
npm install react-hook-form @hookform/resolvers zod

# UI
npm install lucide-react-native react-native-svg
npm install date-fns

# Stripe (para Semana 11 — instalar agora para config)
npx expo install @stripe/stripe-react-native

# Firebase Push (para config inicial)
npx expo install @react-native-firebase/app @react-native-firebase/messaging
```

#### 1.3 Configurar tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@api/*": ["../shared/gen/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ]
}
```

#### 1.4 Configurar .env

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

> **Nota:** `10.0.2.2` e o IP do host no emulador Android. Para iOS simulator, usar `localhost`.

#### 1.5 Configurar app.json

```json
{
  "expo": {
    "name": "SIS - Sistema Integrado a Saude",
    "slug": "sis-healthapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "sis",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#2563EB"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.healthapp.sis",
      "infoPlist": {
        "NSFaceIDUsageDescription": "Use Face ID para login rapido"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#2563EB"
      },
      "package": "com.healthapp.sis"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-local-authentication",
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.healthapp.sis",
          "enableGooglePay": false
        }
      ]
    ]
  }
}
```

#### 1.6 Configurar NativeWind (tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        success: '#16A34A',
        warning: '#EAB308',
        danger: '#DC2626',
        muted: '#6B7280',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

### ETAPA 2: Service Layer — Axios + SecureStore (1h)

#### 2.1 src/lib/storage.ts — SecureStore helpers

```typescript
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export const storage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  removeAccessToken: () => SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),

  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),

  getUser: async () => {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  },
  setUser: (user: object) => SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  removeUser: () => SecureStore.deleteItemAsync(USER_KEY),

  clearAll: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
```

#### 2.2 src/services/api.ts — Axios com interceptors SecureStore

```typescript
import axios, { type AxiosInstance } from 'axios';
import { storage } from '@/lib/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — adiciona JWT de SecureStore
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — refresh automatico em 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          await storage.clearAll();
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/v1/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data.data ?? response.data;
        await storage.setAccessToken(access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (_refreshError) {
        await storage.clearAll();
        return Promise.reject(_refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

> **Importante:** O Kubb gera clients que usam a instancia Axios. Configurar o Kubb para usar `@/services/api` como base client no mobile. Se isso nao for possivel, criar wrapper hooks que passam a instancia `api` para os clients gerados.

#### 2.3 src/stores/auth-store.ts — Zustand auth store

```typescript
import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { Profile } from '@api/types';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: Profile) => void;
  setTokens: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuthenticated: true });
    storage.setUser(user);
  },

  setTokens: async (access, refresh) => {
    await storage.setAccessToken(access);
    await storage.setRefreshToken(refresh);
  },

  logout: async () => {
    await storage.clearAll();
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    try {
      const token = await storage.getAccessToken();
      const user = await storage.getUser();
      if (token && user) {
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
```

---

### ETAPA 3: Root Layout e Providers (1h)

#### 3.1 app/_layout.tsx — Root layout com providers

```tsx
import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/auth-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="clinic/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="doctor/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="booking" options={{ presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

#### 3.2 app/index.tsx — Splash redirect

```tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';

export default function SplashRedirect() {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View className="flex-1 items-center justify-center bg-primary-600">
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}
```

---

### ETAPA 4: Auth Stack (2h)

#### 4.1 app/(auth)/_layout.tsx

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-clinic" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="verify-phone" />
    </Stack>
  );
}
```

#### 4.2 app/(auth)/login.tsx — Tela de login

**Referencia visual:** Mockup 7 (Login)

**Elementos do mockup:**
- Fundo azul gradiente com imagem de medico ao fundo (overlay semitransparente)
- Logo SIS centralizada no topo
- Texto: "Seus exames e consultas tudo na mao, e com Cashback."
- Campo email com icone
- Campo senha com icone olho (toggle visibilidade)
- Checkbox "Lembrar meu e-mail"
- Dois botoes lado a lado: "Cadastrar como paciente" e "Cadastrar como Clinica"
- Link "Problemas com login?"

**Implementacao:**
- `useForm` com `loginRequestSchema` do Zod gerado
- Chamar `useLoginUser` mutation do `@api/hooks/useAuth`
- Salvar tokens via `useAuthStore().setTokens`
- Buscar perfil via `useGetUserProfile` e salvar via `setUser`
- `router.replace('/(tabs)')` apos sucesso
- Suporte a login biometrico (Face ID/Touch ID) para acessos subsequentes

#### 4.3 app/(auth)/register.tsx — Cadastro paciente

**Campos (em etapas/steps):**

**Step 1 — Dados basicos:**
- Nome completo
- Email
- Telefone (mascara brasileira)
- CPF (mascara)

**Step 2 — Seguranca:**
- Data de nascimento
- Genero
- Senha (min 8, upper, lower, number)
- Confirmar senha

**Step 3 — Termos:**
- Checkbox aceitar termos
- Checkbox consentimento LGPD

Apos registro, redirecionar para `verify-email`.

#### 4.4 app/(auth)/verify-email.tsx e verify-phone.tsx

- Input de 6 digitos OTP
- Timer de reenvio (60s)
- Botao reenviar codigo
- Validacao via `useVerifyEmail` / `useVerifyPhone`

#### 4.5 app/(auth)/forgot-password.tsx

- Campo de email
- Chamar `useForgotPassword`
- Mensagem generica de sucesso (LGPD — nao revela se email existe)

---

### ETAPA 5: Tab Navigator (1h)

#### 5.1 app/(tabs)/_layout.tsx — Configuracao dos 4 tabs

**Referencia visual:** Tab bar presente em todos os mockups

```tsx
import { Tabs } from 'expo-router';
import { Home, Calendar, FileText, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Agendamentos',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Prontuario',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

---

### ETAPA 6: Tela Home / Inicio (3h)

#### 6.1 app/(tabs)/index.tsx

**Referencia visual:** Mockup 1 (Home)

**Elementos do mockup (de cima para baixo):**

1. **Header:**
   - "Ola 👋" + subtitulo "Como podemos cuidar da sua saude hoje?"
   - Icone sino (notificacoes) + icone engrenagem (configuracoes) no canto direito

2. **Barra de busca:**
   - Input com icone lupa: "Pesquise medico, especialidade ou exame"

3. **Chips de filtro (ScrollView horizontal):**
   - Especialidades: Cardiologia, Neurologia, Pediatria, Dermatologia, Ginecologia
   - Tipos: Convenio, Particular
   - Filtros: Proximo, Ate R$ 100

4. **Localizacao:**
   - Icone pin + "Sao Paulo, SP - Bela Vista"

5. **Lista de clinicas (FlatList):**
   - Card de clinica com:
     - Avatar com inicial da clinica (circulo colorido)
     - Nome: "Clinica Sao Paulo"
     - Rating: estrela + "4.8 (127)" + badge "Aberto"
     - Endereco: "Av. Paulista, 1000 - Bela Vista"
     - Chips de especialidades: "Cardiologia", "Neurologia", "Pediatria"
     - Distancia no canto superior direito: "1.2 km"
     - Preco no canto direito: "A partir de R$ 80"
     - Botao azul: "Ver clinica" (full width)

**Dados da API:**
- `useListConvenios()` — listar clinicas com filtros
- `useListDoctors()` — buscar medicos por especialidade
- `useGetUnreadNotificationCount()` — badge de notificacoes

**Componentes a criar:**
- `src/components/domain/clinic-card.tsx` — Card de clinica conforme mockup
- `src/components/domain/specialty-chip.tsx` — Chip de especialidade
- `src/components/layout/search-bar.tsx` — Barra de busca com debounce (300ms)

---

### ETAPA 7: Tela de Agendamentos (3h)

#### 7.1 app/(tabs)/appointments/index.tsx

**Referencia visual:** Mockup 2 (Meus Agendamentos)

**Elementos do mockup:**

1. **Header:** "Meus Agendamentos"

2. **Tabs segmentadas (toggle):**
   - "Proximos (2)" — fundo azul, texto branco (ativo)
   - "Passados (1)" — fundo cinza claro, texto preto (inativo)

3. **Cards de agendamento (FlatList):**
   - Cada card contem:
     - **Badges topo-esquerdo:** Status ("Confirmado" verde outline / "Pendente" amarelo) + Tipo ("Consulta" / "Exame")
     - **Menu topo-direito:** Icone 3 pontos (mais opcoes)
     - **Nome da clinica:** "Clinica Sao Paulo" (bold)
     - **Medico:** Icone pessoa + "Dr. Joao Silva - Cardiologia"
     - **Data:** Icone calendario + "15 Nov 2024"
     - **Hora:** Icone relogio + "14:30"
     - **Endereco:** Icone pin + "Av. Paulista, 1000"
     - **Paciente:** "Paciente: Voce" (ou nome do dependente)
     - **Preco:** "R$ 120.00" (alinhado a direita)
     - **Countdown:** Fundo azul claro, icone relogio + "Em 3 dias"
     - **Botoes de acao:**
       - "Reagendar" — outline, icone refresh
       - "Cancelar" — texto vermelho, icone X

4. **FAB (Floating Action Button):**
   - Icone calendario + plus, fundo azul, canto inferior direito

**Dados da API:**
- `useListAppointments()` com filtro `status` para separar proximos/passados
- Proximos: status in [pending, confirmed]
- Passados: status in [completed, cancelled, no_show]

**Componentes a criar:**
- `src/components/domain/appointment-card.tsx` — Card conforme mockup
- `src/components/domain/status-badge.tsx` — Badge com cores por status
- `src/components/domain/countdown-badge.tsx` — Countdown "Em X dias"

---

### ETAPA 8: Tela de Prontuario (3h)

#### 8.1 app/(tabs)/records/index.tsx — Lista

**Referencia visual:** Mockup 3 (Meu Prontuario)

**Elementos do mockup:**

1. **Header:** "Meu Prontuario"

2. **Lista de registros (FlatList):**
   - Cada card contem:
     - **Badges:** "Pago" (verde filled) + "Consulta"/"Exame" (outline)
     - **Preco:** "R$ 200.00" (alinhado a direita, azul, bold)
     - **Clinica:** "Hospital Albert Einstein" (bold)
     - **Medico/Exame:** "Dra. Ana Costa - Neurologia" ou "Hemograma Completo"
     - **Data:** Icone calendario + "08 Nov 2024 - 16:00"
     - **Paciente:** Nome (alinhado a direita, texto cinza)
     - **Botao:** "Ver detalhes" (outline, full width, icone olho)

**Dados da API:**
- `useListAppointments()` filtrado por `status=completed` + ordenado por data decrescente
- Somente agendamentos com `payment.status === 'completed'`

#### 8.2 app/(tabs)/records/[id].tsx — Detalhe

**Referencia visual:** Mockups 4 e 5 (Detalhes do Prontuario)

**Elementos do mockup:**

1. **Header:** "← Voltar   Detalhes do Prontuario"

2. **Card principal:**
   - Badges: "Pago" + "Consulta"
   - Preco: "R$ 200.00"
   - Numero: "#000001"
   - Separador
   - **Info rows (com icones):**
     - Paciente: "Joao Silva"
     - Data e horario: "08 Nov 2024 - 16:00"
     - Clinica: "Hospital Albert Einstein"
     - Endereco: "Av. Albert Einstein, 627 - Morumbi"
     - Medico: "Dra. Ana Costa - Neurologia"
   - Separador
   - **Observacoes:** Texto livre do medico
   - **Documentos:** Lista com icone PDF + nome do arquivo + botao download
     - "resultado_exame.pdf"
     - "prescricao_medica.pdf"

3. **Botoes inferiores (fixed bottom):**
   - "Imprimir PDF" — outline, icone download
   - "Reagendar retorno" — filled azul

---

### ETAPA 9: Tela de Perfil (2h)

#### 9.1 app/(tabs)/profile/index.tsx

**Referencia visual:** Mockup 6 (Meu Perfil)

**Elementos do mockup:**

1. **Header:** "Meu Perfil"

2. **Card de usuario:**
   - Avatar (circulo cinza com icone pessoa)
   - Nome: "Joao Silva" (bold)
   - Email: "joao.silva@email.com"
   - Telefone: "(11) 99999-9999"
   - Data nascimento: "15/03/1990"
   - Icone editar (lapis) no canto superior direito
   - Endereco: Icone pin + "Rua das Flores, 123 - Sao Paulo, SP"

3. **Secao "Conta":**
   - **Dependentes:** Icone pessoas + "Gerencie familiares" + "2" badge + seta
   - **Historico de Pagamentos:** Icone cartao + "Seus pagamentos" + seta

4. **Secao "Configuracoes":**
   - **Notificacoes:** Icone sino + "Lembretes e alertas" + seta
   - **Historico Medico:** Icone documento + "Seus registros de saude" + seta

5. **Secao "Suporte":**
   - **Termos & Privacidade:** Icone escudo + "Politicas e termos de uso" + seta
   - **Suporte:** Icone telefone + "Central de ajuda" + seta

6. **Botao vermelho:** "Sair da conta" (logout)

**Dados da API:**
- `useGetUserProfile()` — dados do usuario logado

---

### ETAPA 10: Biometria — Face ID / Touch ID (1h)

#### 10.1 src/hooks/use-biometrics.ts

```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import { storage } from '@/lib/storage';

export function useBiometrics() {
  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  };

  const authenticate = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autentique para acessar o SIS',
      cancelLabel: 'Usar senha',
      disableDeviceFallback: false,
    });
    return result.success;
  };

  const biometricLogin = async () => {
    const success = await authenticate();
    if (success) {
      const token = await storage.getAccessToken();
      return !!token;
    }
    return false;
  };

  return { checkBiometrics, authenticate, biometricLogin };
}
```

---

### ETAPA 11: Push Notifications Setup (1h)

#### 11.1 Configuracao Firebase

- Adicionar `google-services.json` (Android) e `GoogleService-Info.plist` (iOS)
- Registrar device token via `useRegisterDeviceToken()` apos login
- Configurar handler de notificacao em foreground e background

#### 11.2 src/hooks/use-notifications.ts

```typescript
import { useGetUnreadNotificationCount } from '@api/hooks/useNotifications';
import { useRegisterDeviceToken } from '@api/hooks/useNotifications';

export function useNotifications() {
  const { data: unreadData } = useGetUnreadNotificationCount();
  const registerMutation = useRegisterDeviceToken();

  const unreadCount = unreadData?.data?.count ?? 0;

  const registerForPush = async (token: string) => {
    await registerMutation.mutateAsync({
      data: { token, device_type: Platform.OS as 'ios' | 'android' },
    });
  };

  return { unreadCount, registerForPush };
}
```

---

### ETAPA 12: Componentes UI Base (2h)

Criar componentes base em `src/components/ui/` usando NativeWind:

| Componente | Descricao |
|---|---|
| `button.tsx` | Botao com variantes: primary (azul filled), outline, ghost, danger |
| `input.tsx` | Input com label, icone, erro, mascara |
| `card.tsx` | Card com sombra e borda arredondada |
| `badge.tsx` | Badge colorido (status, tipo) |
| `avatar.tsx` | Avatar circular com fallback de iniciais |
| `skeleton.tsx` | Skeleton loading animado |
| `divider.tsx` | Separador horizontal |
| `icon-button.tsx` | Botao circular com icone |

Criar componentes de dominio em `src/components/domain/`:

| Componente | Descricao | Tela |
|---|---|---|
| `clinic-card.tsx` | Card de clinica (rating, preco, especialidades) | Home |
| `appointment-card.tsx` | Card de agendamento (status, countdown, acoes) | Agendamentos |
| `record-card.tsx` | Card de prontuario (pago, tipo, detalhes) | Prontuario |
| `status-badge.tsx` | Badge de status com cores | Todos |
| `specialty-chip.tsx` | Chip de especialidade | Home |
| `rating-display.tsx` | Estrelas + numero | Home, Doctor |
| `currency-text.tsx` | Texto formatado em BRL | Todos |
| `countdown-badge.tsx` | "Em X dias" com icone | Agendamentos |
| `payment-method-badge.tsx` | PIX / Cartao badge | Prontuario |

---

### ETAPA 13: Formatters e Utilitarios (30min)

#### 13.1 src/lib/formatters.ts

```typescript
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatDate = (date: string): string =>
  format(parseISO(date), "dd MMM yyyy", { locale: ptBR });

export const formatDateTime = (date: string, time?: string): string => {
  if (time) return `${format(parseISO(date), "dd MMM yyyy", { locale: ptBR })} - ${time}`;
  return format(parseISO(date), "dd MMM yyyy - HH:mm", { locale: ptBR });
};

export const formatCountdown = (date: string): string =>
  formatDistanceToNow(parseISO(date), { locale: ptBR, addSuffix: false });

export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return phone;
};

export const formatCPF = (cpf: string): string => {
  const digits = cpf.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const maskCPF = (cpf: string): string => `***.***.${cpf.slice(-5)}`;
```

#### 13.2 src/lib/icons.ts

```typescript
// Barrel export centralizado — NUNCA importar direto de lucide-react-native
export {
  Home as HomeIcon,
  Calendar as CalendarIcon,
  DollarSign as DollarSignIcon,
  FileText as FileTextIcon,
  User as UserIcon,
  Search as SearchIcon,
  Bell as BellIcon,
  Settings as SettingsIcon,
  MapPin as MapPinIcon,
  Star as StarIcon,
  Clock as ClockIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  X as XIcon,
  Check as CheckIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Lock as LockIcon,
  RefreshCw as RefreshCwIcon,
  MoreVertical as MoreVerticalIcon,
  Download as DownloadIcon,
  Printer as PrinterIcon,
  Shield as ShieldIcon,
  Users as UsersIcon,
  Edit as EditIcon,
  LogOut as LogOutIcon,
  Copy as CopyIcon,
  CreditCard as CreditCardIcon,
  QrCode as QrCodeIcon,
} from 'lucide-react-native';
```

#### 13.3 src/lib/constants.ts

```typescript
export const SPECIALTIES = [
  'Cardiologia',
  'Neurologia',
  'Pediatria',
  'Dermatologia',
  'Ginecologia',
  'Ortopedia',
  'Oftalmologia',
  'Otorrinolaringologia',
  'Urologia',
  'Oncologia',
  'Cirurgia',
  'Radiologia',
] as const;

export const APPOINTMENT_STATUS_COLORS = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmado' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Em andamento' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Concluido' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
  no_show: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Nao compareceu' },
} as const;

export const PAYMENT_STATUS_COLORS = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processando' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Pago' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Falhou' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Reembolsado' },
} as const;
```

---

## 4. Telas Fora dos Tabs (Semana 10-11, placeholder agora)

### 4.1 Fluxo de Booking (Semana 11)

Criar arquivos placeholder:
- `app/booking/_layout.tsx`
- `app/booking/select-time.tsx`
- `app/booking/confirm.tsx`
- `app/booking/payment.tsx`
- `app/booking/success.tsx`

### 4.2 Detalhe do Medico (Semana 10)

Criar placeholder:
- `app/doctor/[id].tsx`

### 4.3 Detalhe da Clinica (Semana 10)

Criar placeholder:
- `app/clinic/[id].tsx`

---

## 5. Integracao com @api/* (Kubb)

### 5.1 Configurar Kubb client para mobile

O Kubb gera Axios clients que usam uma instancia default. No mobile, precisamos que usem nossa instancia com SecureStore interceptors.

**Opcao 1 (preferida):** Configurar o `kubb-client` no mobile igual ao frontend:

Criar `src/lib/kubb-client.ts`:
```typescript
import { api } from '@/services/api';

// Override do client base usado pelos clients gerados
export { api as client };
```

**Opcao 2:** Criar wrappers em `src/hooks/` que usam os clients gerados com a instancia correta.

### 5.2 Hooks disponiveis para o mobile

Todos os hooks em `shared/gen/hooks/` estao disponiveis via `@api/hooks/`:

| Hook | Uso no Mobile |
|---|---|
| `useLoginUser` | Login |
| `useRegisterUser` | Cadastro |
| `useVerifyEmail` / `useVerifyPhone` | Verificacao |
| `useForgotPassword` / `useResetPassword` | Recuperacao |
| `useGetUserProfile` / `usePatchUserProfile` | Perfil |
| `useListDoctors` / `useGetDoctorById` | Busca medicos |
| `useGetDoctorSlots` / `useGetDoctorAvailableDates` | Slots |
| `useListAppointments` / `useGetAppointmentById` | Agendamentos |
| `useCreateAppointment` / `useCancelAppointment` | Booking |
| `useRateAppointment` | Avaliacao |
| `useCreatePaymentIntent` / `useGeneratePIX` | Pagamento |
| `useGetPaymentStatus` | Polling PIX |
| `useListNotifications` / `useGetUnreadNotificationCount` | Notificacoes |
| `useRegisterDeviceToken` | Push token |
| `useListConsents` / `useUpdateConsents` | LGPD |
| `useDeleteUserAccount` / `useExportUserData` | LGPD |

---

## 6. Checklist de Validacao Semana 9

### 6.1 Setup e Infra
- [ ] Projeto Expo criado com TypeScript e Expo Router
- [ ] Todas dependencias instaladas (NativeWind, TanStack Query, Zustand, Axios, etc.)
- [ ] `tsconfig.json` com path alias `@api/*` apontando para `shared/gen/`
- [ ] `app.json` configurado com plugins (Stripe, SecureStore, LocalAuthentication)
- [ ] NativeWind configurado (tailwind.config.ts, metro.config.js, babel.config.js)
- [ ] `.env` com `EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 6.2 Service Layer
- [ ] `src/services/api.ts` — Axios com SecureStore interceptors
- [ ] `src/lib/storage.ts` — Helpers SecureStore
- [ ] `src/stores/auth-store.ts` — Zustand auth store com hydrate
- [ ] `src/lib/kubb-client.ts` — Override do client Kubb para usar SecureStore

### 6.3 Auth Stack
- [ ] Login funcional (email + senha → JWT → redirect para tabs)
- [ ] Registro paciente funcional (multi-step form)
- [ ] Verificacao email OTP funcional
- [ ] Verificacao telefone SMS funcional
- [ ] Forgot password funcional
- [ ] Login biometrico (Face ID / Touch ID) para acessos subsequentes
- [ ] Redirect automatico baseado em auth state

### 6.4 Tab Navigator
- [ ] 4 tabs configurados: Inicio, Agendamentos, Prontuario, Perfil
- [ ] Icones corretos por tab (outline inativo, filled ativo)
- [ ] Cores corretas (azul ativo, cinza inativo)

### 6.5 Tela Home
- [ ] Header com saudacao e icones (notificacoes, config)
- [ ] Barra de busca com debounce
- [ ] Chips de especialidade (scroll horizontal)
- [ ] Lista de clinicas via `useListConvenios` ou `useListDoctors`
- [ ] Card de clinica conforme mockup (rating, preco, especialidades, distancia)
- [ ] Pull-to-refresh
- [ ] Skeleton loading

### 6.6 Tela Agendamentos
- [ ] Tabs Proximos/Passados
- [ ] Cards de agendamento conforme mockup
- [ ] Badges de status e tipo
- [ ] Countdown "Em X dias"
- [ ] Acoes: Reagendar e Cancelar
- [ ] FlatList com separadores

### 6.7 Tela Prontuario
- [ ] Lista de consultas completadas
- [ ] Cards conforme mockup (badges, preco, clinica, medico, data)
- [ ] Tela de detalhe com info rows
- [ ] Secao de observacoes e documentos
- [ ] Botoes: Imprimir PDF e Reagendar retorno

### 6.8 Tela Perfil
- [ ] Card de usuario com dados pessoais
- [ ] Secoes: Conta, Configuracoes, Suporte
- [ ] Menu items com icone + descricao + seta
- [ ] Botao logout

### 6.9 Componentes Base
- [ ] Button (primary, outline, ghost, danger)
- [ ] Input (com label, icone, erro)
- [ ] Card, Badge, Avatar, Skeleton, Divider
- [ ] ClinicCard, AppointmentCard, RecordCard
- [ ] StatusBadge, SpecialtyChip, RatingDisplay, CurrencyText
- [ ] EmptyState, ErrorState, LoadingScreen

### 6.10 Push Notifications
- [ ] Firebase configurado (google-services.json, GoogleService-Info.plist)
- [ ] Device token registrado via API apos login
- [ ] Handler de notificacao em foreground

### 6.11 Quality Gates
- [ ] `npx expo start` — app inicia sem erros
- [ ] Navegacao entre todos os tabs funciona
- [ ] Login → redirect para tabs funciona
- [ ] Logout → redirect para login funciona
- [ ] TypeScript: 0 erros (`npx tsc --noEmit`)
- [ ] ESLint: 0 erros

---

## 7. Regras de Implementacao

### 7.1 NUNCA fazer
- NUNCA usar `localStorage` — usar `expo-secure-store`
- NUNCA usar `<img>` — usar `expo-image` ou `Image` do RN
- NUNCA criar types manuais para dados da API — usar `@api/types`
- NUNCA criar HTTP calls manuais — usar `@api/hooks` e `@api/clients`
- NUNCA usar ScrollView para listas longas — usar `FlatList`
- NUNCA usar `index` como key em listas — usar IDs estaveis
- NUNCA importar icones direto de `lucide-react-native` — usar `@/lib/icons`

### 7.2 SEMPRE fazer
- SEMPRE usar `FlatList` para listas (performance)
- SEMPRE usar `expo-image` para imagens (cache automatico)
- SEMPRE usar `@api/hooks` para data fetching (TanStack Query)
- SEMPRE implementar skeleton loading
- SEMPRE implementar pull-to-refresh
- SEMPRE implementar empty state e error state
- SEMPRE usar debounce em inputs de busca (300ms)
- SEMPRE usar `SafeAreaView` ou `Screen Wrapper` para margens seguras
- SEMPRE usar formatters de `@/lib/formatters` para datas, moeda, telefone
- SEMPRE usar NativeWind classes para estilizacao

### 7.3 Padrao de resposta API

Mesmo do frontend web:
```typescript
// Resposta paginada
const { data } = useListAppointments();
const appointments = data?.data;        // Array de items
const total = data?.meta?.total;         // Total count
const totalPages = data?.meta?.total_pages;

// Resposta simples
const { data } = useGetUserProfile();
const user = data?.data;                 // Objeto unico
```

### 7.4 Padrao de navegacao

```typescript
import { router } from 'expo-router';

// Navegar
router.push('/doctor/123');
router.push('/booking/select-time?doctorId=123&date=2026-03-15');

// Substituir (sem voltar)
router.replace('/(tabs)');

// Voltar
router.back();
```

---

## 8. Dependencias de Backend (ja implementadas)

Todos os endpoints necessarios ja existem e estao testados:

| Endpoint | Status | Tela Mobile |
|---|---|---|
| POST `/api/v1/auth/login/` | ✅ | Login |
| POST `/api/v1/auth/register/` | ✅ | Registro |
| POST `/api/v1/auth/verify-email/` | ✅ | Verificacao |
| POST `/api/v1/auth/verify-phone/` | ✅ | Verificacao |
| POST `/api/v1/auth/forgot-password/` | ✅ | Forgot Password |
| GET `/api/v1/users/me/` | ✅ | Perfil |
| PATCH `/api/v1/users/me/` | ✅ | Editar Perfil |
| GET `/api/v1/doctors/` | ✅ | Home (busca) |
| GET `/api/v1/convenios/` | ✅ | Home (clinicas) |
| GET `/api/v1/appointments/` | ✅ | Agendamentos, Prontuario |
| GET `/api/v1/appointments/{id}/` | ✅ | Detalhe |
| GET `/api/v1/notifications/unread-count/` | ✅ | Badge notificacoes |
| POST `/api/v1/notifications/device-tokens/register/` | ✅ | Push setup |

---

## 9. Proximas Semanas (Preview)

| Semana | Foco | Telas |
|---|---|---|
| **9 (esta)** | Setup + Auth + Telas base | Login, Home, Agendamentos, Prontuario, Perfil |
| **10** | Busca e Medicos | Detalhe clinica, Detalhe medico, Busca avancada, Selecao horario |
| **11** | Booking + Pagamento | Confirmacao, Payment Sheet, PIX, Comprovante |
| **12** | Historico e Polish | Cancelamento, Avaliacao, Notificacoes, Dependentes |
| **13** | Polish e Build | Animacoes, offline, deep link, EAS Build production |

---

*Documento gerado em 2026-03-09. Baseado em: PLANO_COMPLETO.md, PAGAMENTOS_SEMANA9_IMPLEMENTACAO.md, CHECKLIST_PROJETO_END_TO_END.md, mockups do designer, e estado atual do codigo.*
