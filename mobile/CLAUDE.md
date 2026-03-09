# CLAUDE.md — Mobile App (React Native + Expo)

> **Documento de referência para Claude Code — App Mobile (Paciente).**
> Leia COMPLETAMENTE antes de modificar qualquer arquivo nesta pasta.

---

## 1. Stack e Versões

| Componente | Versão | Função |
|---|---|---|
| React Native | **0.76** | Cross-platform iOS + Android |
| Expo SDK | **52** | Managed workflow + EAS Build |
| TypeScript | **5.6+** | Tipagem estática |
| React Navigation | **7** | Navegação entre telas |
| NativeWind | **4** | Tailwind CSS para React Native |
| React Native Paper | **5** | Material Design 3 |
| Stripe RN | latest | Payment Sheet nativo |
| Firebase Messaging | latest | FCM push notifications |
| Zustand + TanStack Query | **5 + 5** | Estado + server cache |
| Reanimated | **3** | Animações fluidas 60fps |
| expo-secure-store | latest | Keychain/Keystore para JWT |
| react-native-maps | latest | Mapas nativos |
| expo-image | latest | Carregamento otimizado |
| expo-local-authentication | latest | Face ID / Touch ID |

---

## 2. Estrutura de Pastas

```
mobile/
├── app.json                       # Expo config
├── eas.json                       # EAS Build profiles
├── tsconfig.json                  # Path alias @api/* → ../shared/gen/*
├── src/
│   ├── screens/
│   │   ├── auth/                  # Login, Register, ForgotPassword, Verify
│   │   ├── home/                  # Dashboard, Search
│   │   ├── doctor/                # DoctorProfile, DoctorList
│   │   ├── booking/               # TimeSelection, Confirmation, Payment
│   │   ├── appointments/          # MyAppointments, AppointmentDetail
│   │   ├── notifications/         # NotificationCenter
│   │   └── profile/               # Profile, Settings, LGPD
│   ├── components/                # Componentes reutilizáveis
│   ├── navigation/                # React Navigation stacks + tabs
│   ├── services/
│   │   └── axios.ts               # Axios instance + SecureStore JWT
│   ├── stores/                    # Zustand stores
│   ├── hooks/                     # Custom hooks (wrappers sobre @api/hooks)
│   ├── theme/                     # NativeWind tokens
│   └── types/                     # Types LOCAIS de UI (não API)
├── package.json
└── .github/workflows/ci.yml
```

---

## 3. Regras Obrigatórias

### 3.1 Imports da API — SEMPRE via @api/*

```typescript
import { getDoctorById } from '@api/clients/doctorsClient'
import type { Doctor } from '@api/types/doctorsTypes'
import { useListDoctors } from '@api/hooks/useDoctors'
```

### 3.2 Autenticação

JWT armazenado no expo-secure-store (Keychain iOS / Keystore Android):

```typescript
import * as SecureStore from 'expo-secure-store'
const token = await SecureStore.getItemAsync('access_token')
```

### 3.3 Axios Interceptor Mobile

```typescript
// mobile/src/services/axios.ts
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const client = axios.create({
  baseURL: 'https://api.abasesaude.com.br',
})

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

### 3.4 Performance

- Animações com react-native-reanimated (60fps)
- Listas longas com FlatList (nunca ScrollView + map)
- expo-image para todas as imagens
- Skeleton loading ao invés de spinners
- Debounce em inputs de busca

### 3.5 Build e Deploy

- EAS Build para builds nativos na nuvem
- EAS Submit para publicação automática nas lojas
- EAS Update para hotfixes OTA (sem resubmeter lojas)
- Profiles: development, preview, production

### 3.6 Push Notifications

Firebase Cloud Messaging (FCM) via @react-native-firebase/messaging.

### 3.7 Pagamentos

@stripe/stripe-react-native com Payment Sheet nativo. PIX via QR code + copy-paste.

---

## 4. Comandos

```bash
npx expo start                    # Dev server
npx expo run:android              # Android dev
npx expo run:ios                  # iOS dev
eas build --profile development   # EAS Build dev
eas build --profile production    # EAS Build prod
eas submit                        # Submit to stores
```

---

*Consulte `CLAUDE.md` raiz para visão geral e `shared/CLAUDE.md` para regras do Kubb.*
