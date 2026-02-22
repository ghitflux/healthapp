# CLAUDE.md — Frontend Web (Next.js 16)

> **Documento de referência para Claude Code — Frontend Web.**
> Leia COMPLETAMENTE antes de modificar qualquer arquivo nesta pasta.

---

## 1. Stack e Versões

| Componente | Versão | Função |
|---|---|---|
| Next.js | **16** | SSR, App Router, Cache Components, Turbopack |
| React | **19.2** | View Transitions, Activity, Compiler |
| TypeScript | **5.6+** | Tipagem estática |
| Tailwind CSS | **4** | Utility-first, CSS-first config, engine Rust |
| Shadcn/UI | latest | Componentes acessíveis (Radix UI) |
| tw-animate-css | latest | Animações Tailwind 4 |
| TanStack Query | **5** | Cache de dados do servidor |
| Zustand | **5** | Estado global leve |
| React Hook Form + Zod | **7 + 3** | Formulários + validação |
| Recharts | **2** | Gráficos para dashboards |
| Axios | **1.7** | Cliente HTTP com interceptors JWT |
| date-fns | **4** | Manipulação de datas |
| next-themes | latest | Dark/light mode |
| Turbopack | built-in | Bundler padrão Next.js 16 |
| Node.js | **20.9+** | Mínimo exigido pelo Next.js 16 |

---

## 2. Estrutura de Pastas

```
frontend/
├── next.config.ts                 # cacheComponents, reactCompiler, turbopack
├── proxy.ts                       # Auth + role routing (substitui middleware.ts)
├── tsconfig.json                  # Path alias @api/* → ../shared/gen/*
├── src/
│   ├── app/
│   │   ├── (auth)/                # login, forgot-password, reset-password
│   │   ├── (convenio)/            # Painel do Convênio Admin
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── doctors/page.tsx
│   │   │   ├── schedules/page.tsx
│   │   │   ├── exams/page.tsx
│   │   │   ├── appointments/page.tsx
│   │   │   ├── financial/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (owner)/               # Painel do Owner
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── convenios/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── financial/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── audit-logs/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # Shadcn/UI components
│   │   ├── layouts/               # Sidebar, Header, Footer
│   │   ├── forms/                 # Form components reutilizáveis
│   │   ├── tables/                # DataTable, pagination
│   │   └── charts/                # Gráficos (Recharts)
│   ├── lib/
│   │   ├── api.ts                 # Axios instance + JWT interceptors
│   │   ├── auth.ts                # JWT storage, refresh logic, role guards
│   │   └── utils.ts
│   ├── hooks/                     # Custom hooks (wrappers sobre @api/hooks)
│   ├── stores/                    # Zustand stores
│   └── types/                     # Types LOCAIS de UI (não API — API vem de @api/*)
├── public/
└── package.json
```

---

## 3. Regras Obrigatórias

### 3.1 Imports da API — SEMPRE via @api/*

```typescript
// CORRETO — importar do código gerado
import { useListDoctors } from '@api/hooks/useDoctors'
import type { Doctor } from '@api/types/doctorsTypes'
import { createAppointmentRequestSchema } from '@api/zod/appointmentsSchemas'

// ERRADO — nunca criar types manuais para dados da API
interface Doctor { id: string; name: string; ... }  // ❌ NUNCA
```

### 3.2 Server vs Client Components

**Server Components (padrão):**
- Páginas que só fazem fetch de dados
- Layouts estáticos
- Componentes sem hooks ou event handlers

**Client Components ('use client'):**
- Componentes com useState, useEffect, useContext
- Event handlers (onClick, onChange)
- Hooks do TanStack Query, Zustand, React Hook Form
- Componentes com animações (tw-animate-css)

### 3.3 Performance

- SEMPRE usar `next/image` (nunca `<img>`)
- SEMPRE usar dynamic imports para componentes pesados (modais, gráficos)
- SEMPRE usar React.memo para componentes que renderizam frequentemente
- SEMPRE usar useMemo/useCallback onde apropriado
- SEMPRE implementar skeleton loading ao invés de spinners
- SEMPRE usar debounce em inputs de busca (300ms)
- SEMPRE usar IDs estáveis como keys em listas (nunca index)

### 3.4 Formulários

Todos os formulários usam React Hook Form + Zod gerado pelo Kubb:

```typescript
import { createAppointmentRequestSchema } from '@api/zod/appointmentsSchemas'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

type FormData = z.infer<typeof createAppointmentRequestSchema>

function BookingForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(createAppointmentRequestSchema),
  })
}
```

### 3.5 Estilização

- Tailwind CSS 4 com @theme para design tokens
- Shadcn/UI para componentes base (Button, Input, Dialog, etc.)
- tw-animate-css para animações
- next-themes para dark/light mode
- NUNCA usar CSS modules ou styled-components

### 3.6 proxy.ts (Next.js 16)

Substitui middleware.ts. Roda no runtime Node.js completo (não Edge):
- Verificação JWT em todas as rotas protegidas
- Redirecionamento por role (convenio vs owner)
- Rate limiting no BFF

### 3.7 Bundler

- SEMPRE Turbopack (NUNCA Webpack)
- Dev command: `next dev --turbopack`

### 3.8 Código

- TypeScript strict mode, no `any`
- camelCase para variáveis/funções, PascalCase para componentes
- Imports absolutos via path alias (`@/`, `@api/`)
- Conventional Commits para git

---

## 4. Comandos

```bash
npm run dev          # Next.js + Turbopack
npm run build        # Build de produção
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```

---

*Consulte `CLAUDE.md` raiz para visão geral e `shared/CLAUDE.md` para regras do Kubb.*
