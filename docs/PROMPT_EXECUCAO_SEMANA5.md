# HealthApp — Prompt de Execucao Semana 5: Setup Next.js 16 + Base Frontend

> **Objetivo:** Este documento detalha task-by-task a Semana 5 do HealthApp.
> Foco: scaffold completo do frontend Next.js 16 com Turbopack, Tailwind CSS 4,
> Shadcn/UI, proxy.ts para auth e role routing, TanStack Query, integracao com
> shared/gen/ via @api/*, e primeira pagina funcional (login → dashboard com dados reais).
>
> Pre-requisito: Semanas 1-4 concluidas (backend production-ready com 60+ endpoints).
> Leitura do `CLAUDE.md` raiz, `frontend/CLAUDE.md` (se existir) e `shared/CLAUDE.md`.

---

## ANALISE DO ESTADO ATUAL (Pos-Semana 4)

### O que JA existe:

**Backend production-ready:**
- 60+ endpoints REST documentados em /api/docs/ (Swagger UI)
- Auth completo: register, login, logout, 2FA, password reset, OTP, LGPD
- RBAC com 4 roles: patient, doctor, convenio_admin, owner
- JWT: access 15min, refresh 7 dias, rotacao automatica, blacklist
- Stripe + PIX integrados
- Firebase push, SendGrid email, Twilio SMS
- Appointment full status machine: pending → confirmed → in_progress → completed
- Owner admin panel com dashboard, settings, audit logs
- 80%+ cobertura de testes

**shared/gen/ — Codigo Gerado pelo Kubb (pronto para consumo):**
- `types/` — TypeScript interfaces para TODOS os serializers (Request e Response separados)
- `zod/` — Zod schemas para validacao runtime
- `clients/` — Axios client functions type-safe para TODOS os endpoints
- `hooks/` — TanStack Query hooks (useQuery, useMutation, useSuspenseQuery)
- `mocks/faker/` — Mock data generators
- `mocks/msw/` — MSW request handlers para testes
- **O frontend NAO precisa escrever NENHUM codigo de API manualmente**

**Infraestrutura:**
- Docker Compose funcional (PostgreSQL 16, Redis 7.2, MinIO)
- tsconfig.base.json com path alias @api/* → shared/gen/*
- npm run api:sync funcional

### O que FALTA para a Semana 5:

1. **Next.js 16 project scaffold** — Nao existe frontend/ ainda (so a pasta vazia).
2. **Tailwind CSS 4 + Shadcn/UI** — Setup completo com design tokens.
3. **proxy.ts** — Auth verification + role routing (convenio vs owner panels).
4. **App Router routes e layouts** — Estrutura de rotas para (auth), (convenio), (owner).
5. **Auth frontend** — Login page, JWT storage, refresh interceptor, rotas protegidas.
6. **TanStack Query setup** — Provider, Axios instance, configuracao.
7. **Path alias @api/** — tsconfig.json apontando para shared/gen/.
8. **Dashboard funcional** — Primeira pagina que consome dados reais da API.
9. **Design system base** — Cores, tipografia, componentes base (Sidebar, Header).
10. **CI/CD frontend** — GitHub Actions para lint, type check, build.

---

## PARTE 1 — TAREFAS DETALHADAS

### Dia 1 (Segunda) — Next.js 16 Scaffold + Tailwind + Shadcn

**Tarefa 5.1 — Next.js 16 Project Scaffold**
```
Crie o projeto Next.js 16 completo dentro de frontend/:

1. Criar projeto Next.js 16:
   cd healthapp/
   npx create-next-app@latest frontend --typescript --tailwind --app --turbopack \
     --eslint --no-src-dir --import-alias "@/*"

   NOTA: Se create-next-app nao suportar --turbopack flag,
   configurar manualmente no next.config.ts e package.json.

2. Configurar next.config.ts:
   ```typescript
   import type { NextConfig } from 'next';

   const nextConfig: NextConfig = {
     // Turbopack e padrao no Next.js 16, nao precisa flag experimental
     // Cache Components habilitado
     cacheComponents: true,
     // React Compiler habilitado
     reactCompiler: true,
     // Imagens remotas permitidas
     images: {
       remotePatterns: [
         { protocol: 'https', hostname: '**' },
         { protocol: 'http', hostname: 'localhost' },
       ],
     },
     // Redirect para login se nao autenticado (handled by proxy.ts)
     // Proxy reverso para API backend
     async rewrites() {
       return [
         {
           source: '/api/:path*',
           destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/:path*`,
         },
       ];
     },
   };

   export default nextConfig;
   ```

3. Configurar package.json scripts:
   ```json
   {
     "scripts": {
       "dev": "next dev --turbopack",
       "build": "next build",
       "start": "next start",
       "lint": "next lint",
       "type-check": "tsc --noEmit"
     }
   }
   ```

4. Configurar tsconfig.json com path alias:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"],
         "@api/*": ["../shared/gen/*"]
       },
       "strict": true,
       "noUncheckedIndexedAccess": true
     }
   }
   ```

5. Criar .env.local:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NEXT_PUBLIC_APP_NAME=HealthApp
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

6. Criar .env.example com todas as variaveis

7. Criar .eslintrc.json com config Next.js + regras extras:
   - @typescript-eslint/no-explicit-any: error
   - @typescript-eslint/no-unused-vars: error
   - react-hooks/exhaustive-deps: warn

8. Verificar que dev server inicia:
   cd frontend && npm run dev
   # Acessar http://localhost:3000

Validacao:
- npm run dev inicia sem erros (Turbopack)
- npm run build completa sem erros
- npm run type-check passa
- npm run lint passa
- http://localhost:3000 mostra pagina padrao Next.js

Commit: "feat(frontend): next.js 16 project scaffold with turbopack and path aliases"
```

**Tarefa 5.2 — Tailwind CSS 4 + Design Tokens**
```
Configure Tailwind CSS 4 com design tokens do HealthApp:

1. Configurar app/globals.css com Tailwind 4 syntax (CSS-first config):
   ```css
   @import "tailwindcss";

   @theme {
     /* Colors — HealthApp Palette */
     --color-primary-50: #eff6ff;
     --color-primary-100: #dbeafe;
     --color-primary-200: #bfdbfe;
     --color-primary-300: #93c5fd;
     --color-primary-400: #60a5fa;
     --color-primary-500: #3b82f6;
     --color-primary-600: #2563eb;
     --color-primary-700: #1d4ed8;
     --color-primary-800: #1e40af;
     --color-primary-900: #1e3a8a;
     --color-primary-950: #172554;

     --color-success-50: #f0fdf4;
     --color-success-500: #22c55e;
     --color-success-600: #16a34a;

     --color-warning-50: #fffbeb;
     --color-warning-500: #f59e0b;
     --color-warning-600: #d97706;

     --color-danger-50: #fef2f2;
     --color-danger-500: #ef4444;
     --color-danger-600: #dc2626;

     --color-neutral-50: #fafafa;
     --color-neutral-100: #f5f5f5;
     --color-neutral-200: #e5e5e5;
     --color-neutral-300: #d4d4d4;
     --color-neutral-400: #a3a3a3;
     --color-neutral-500: #737373;
     --color-neutral-600: #525252;
     --color-neutral-700: #404040;
     --color-neutral-800: #262626;
     --color-neutral-900: #171717;
     --color-neutral-950: #0a0a0a;

     /* Spacing */
     --spacing-sidebar: 280px;
     --spacing-header: 64px;

     /* Border Radius */
     --radius-sm: 0.375rem;
     --radius-md: 0.5rem;
     --radius-lg: 0.75rem;
     --radius-xl: 1rem;

     /* Shadows */
     --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
     --shadow-dropdown: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
   }

   /* Dark Mode */
   @media (prefers-color-scheme: dark) {
     :root {
       --background: var(--color-neutral-950);
       --foreground: var(--color-neutral-50);
     }
   }

   /* Base Styles */
   body {
     font-family: var(--font-inter), system-ui, sans-serif;
     -webkit-font-smoothing: antialiased;
   }
   ```

2. Instalar next-themes para dark/light mode:
   npm install next-themes

3. Instalar tw-animate-css para animacoes:
   npm install tw-animate-css

4. Instalar utilitarios de Tailwind:
   npm install clsx tailwind-merge
   Criar lib/utils.ts:
   ```typescript
   import { type ClassValue, clsx } from "clsx";
   import { twMerge } from "tailwind-merge";

   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs));
   }
   ```

Validacao:
- Cores customizadas funcionam (bg-primary-500, text-danger-600)
- Dark mode funciona com next-themes
- cn() utility disponivel para merge de classes
- Animacoes Tailwind funcionam

Commit: "feat(frontend): tailwind css 4 with healthapp design tokens and dark mode"
```

**Tarefa 5.3 — Shadcn/UI Setup + Componentes Base**
```
Configure Shadcn/UI e instale componentes essenciais:

1. Inicializar Shadcn/UI:
   npx shadcn@latest init

   Respostas:
   - Style: New York
   - Base color: Neutral
   - CSS variables: yes

2. Instalar componentes essenciais:
   npx shadcn@latest add button
   npx shadcn@latest add input
   npx shadcn@latest add label
   npx shadcn@latest add card
   npx shadcn@latest add dialog
   npx shadcn@latest add dropdown-menu
   npx shadcn@latest add avatar
   npx shadcn@latest add badge
   npx shadcn@latest add separator
   npx shadcn@latest add skeleton
   npx shadcn@latest add toast
   npx shadcn@latest add sonner
   npx shadcn@latest add table
   npx shadcn@latest add tabs
   npx shadcn@latest add form
   npx shadcn@latest add select
   npx shadcn@latest add sheet
   npx shadcn@latest add tooltip
   npx shadcn@latest add scroll-area
   npx shadcn@latest add switch
   npx shadcn@latest add command
   npx shadcn@latest add popover
   npx shadcn@latest add calendar
   npx shadcn@latest add chart

3. Instalar dependencias adicionais:
   npm install lucide-react
   npm install react-hook-form @hookform/resolvers zod
   npm install recharts
   npm install date-fns
   npm install @tanstack/react-query
   npm install axios
   npm install zustand
   npm install sonner

4. Verificar que componentes importam corretamente:
   import { Button } from "@/components/ui/button"
   import { Card } from "@/components/ui/card"

Validacao:
- Todos os componentes Shadcn/UI funcionam
- Lucide icons disponivel
- Formularios com React Hook Form + Zod funcionam
- Recharts renderiza grafico basico

Commit: "feat(frontend): shadcn/ui setup with 20+ base components"
```

### Dia 2 (Terca) — Auth Frontend + API Integration

**Tarefa 5.4 — Axios Instance + JWT Interceptors**
```
Configure o cliente HTTP Axios com interceptors JWT:

1. Criar lib/api.ts — Axios instance centralizada:
   ```typescript
   import axios from "axios";

   const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

   export const api = axios.create({
     baseURL: API_URL,
     headers: {
       "Content-Type": "application/json",
     },
     timeout: 30000, // 30 segundos
   });

   // Request interceptor — adiciona JWT a cada request
   api.interceptors.request.use(
     (config) => {
       // Em Client Components, pegar token do localStorage/cookie
       if (typeof window !== "undefined") {
         const token = localStorage.getItem("access_token");
         if (token) {
           config.headers.Authorization = `Bearer ${token}`;
         }
       }
       return config;
     },
     (error) => Promise.reject(error)
   );

   // Response interceptor — refresh automatico em 401
   api.interceptors.response.use(
     (response) => response,
     async (error) => {
       const originalRequest = error.config;

       if (error.response?.status === 401 && !originalRequest._retry) {
         originalRequest._retry = true;

         try {
           const refreshToken = localStorage.getItem("refresh_token");
           if (!refreshToken) {
             // Redirect para login
             window.location.href = "/login";
             return Promise.reject(error);
           }

           const response = await axios.post(`${API_URL}/v1/auth/token/refresh/`, {
             refresh: refreshToken,
           });

           const { access } = response.data.data;
           localStorage.setItem("access_token", access);

           // Retry original request com novo token
           originalRequest.headers.Authorization = `Bearer ${access}`;
           return api(originalRequest);
         } catch (refreshError) {
           // Refresh falhou — limpar tokens e redirect
           localStorage.removeItem("access_token");
           localStorage.removeItem("refresh_token");
           window.location.href = "/login";
           return Promise.reject(refreshError);
         }
       }

       return Promise.reject(error);
     }
   );
   ```

2. Criar lib/auth.ts — Funcoes de autenticacao:
   ```typescript
   import { api } from "./api";

   export interface AuthTokens {
     access: string;
     refresh: string;
   }

   export interface LoginCredentials {
     email: string;
     password: string;
   }

   export const authService = {
     login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
       const response = await api.post("/v1/auth/login/", credentials);
       const tokens = response.data.data;
       localStorage.setItem("access_token", tokens.access);
       localStorage.setItem("refresh_token", tokens.refresh);
       return tokens;
     },

     logout: async (): Promise<void> => {
       const refresh = localStorage.getItem("refresh_token");
       if (refresh) {
         try {
           await api.post("/v1/auth/logout/", { refresh });
         } catch {
           // Ignorar erro de logout — limpar tokens mesmo assim
         }
       }
       localStorage.removeItem("access_token");
       localStorage.removeItem("refresh_token");
       window.location.href = "/login";
     },

     getAccessToken: (): string | null => {
       if (typeof window === "undefined") return null;
       return localStorage.getItem("access_token");
     },

     isAuthenticated: (): boolean => {
       return !!authService.getAccessToken();
     },

     getUserRole: (): string | null => {
       const token = authService.getAccessToken();
       if (!token) return null;
       try {
         const payload = JSON.parse(atob(token.split(".")[1]));
         return payload.role || null;
       } catch {
         return null;
       }
     },
   };
   ```

3. Configurar Kubb client para usar a instancia Axios customizada:
   - Verificar se kubb.config.ts tem client: { importPath: "../../frontend/lib/api" }
   - OU criar wrapper em lib/api-client.ts que re-exporta o client com a instancia certa:
     ```typescript
     // Configurar o axios instance que os clients gerados usam
     import { api } from "./api";

     // Se os clients gerados usam axios diretamente,
     // sobrescrever o default instance:
     import axios from "axios";
     // Copiar interceptors para o axios default, ou
     // criar adaptador que os clients gerados consumam
     ```

   NOTA: A integracao exata depende de como o Kubb gera os clients.
   Verificar shared/gen/clients/ para entender o pattern e adaptar.

Validacao:
- api.get("/v1/doctors/") funciona com JWT no header
- Refresh automatico funciona (simular token expirado)
- Logout limpa tokens e redirect
- getUserRole() retorna role correta do JWT payload

Commit: "feat(frontend): axios instance with JWT interceptors and auth service"
```

**Tarefa 5.5 — TanStack Query Setup + Provider**
```
Configure TanStack Query com provider global:

1. Instalar (se nao instalado):
   npm install @tanstack/react-query @tanstack/react-query-devtools

2. Criar lib/query-client.ts:
   ```typescript
   import { QueryClient } from "@tanstack/react-query";

   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 1000 * 60 * 5, // 5 minutos
         gcTime: 1000 * 60 * 30,   // 30 minutos (antigo cacheTime)
         retry: 1,
         refetchOnWindowFocus: false,
         refetchOnReconnect: true,
       },
       mutations: {
         retry: 0,
       },
     },
   });
   ```

3. Criar components/providers.tsx (Client Component):
   ```typescript
   "use client";

   import { QueryClientProvider } from "@tanstack/react-query";
   import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
   import { ThemeProvider } from "next-themes";
   import { Toaster } from "@/components/ui/sonner";
   import { queryClient } from "@/lib/query-client";

   export function Providers({ children }: { children: React.ReactNode }) {
     return (
       <QueryClientProvider client={queryClient}>
         <ThemeProvider
           attribute="class"
           defaultTheme="light"
           enableSystem
           disableTransitionOnChange
         >
           {children}
           <Toaster richColors position="top-right" />
         </ThemeProvider>
         {process.env.NODE_ENV === "development" && (
           <ReactQueryDevtools initialIsOpen={false} />
         )}
       </QueryClientProvider>
     );
   }
   ```

4. Atualizar app/layout.tsx:
   ```typescript
   import type { Metadata } from "next";
   import { Inter } from "next/font/google";
   import { Providers } from "@/components/providers";
   import "./globals.css";

   const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

   export const metadata: Metadata = {
     title: "HealthApp",
     description: "Plataforma de gestao em saude",
   };

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <html lang="pt-BR" suppressHydrationWarning>
         <body className={`${inter.variable} font-sans antialiased`}>
           <Providers>{children}</Providers>
         </body>
       </html>
     );
   }
   ```

5. Criar hooks customizados que wrappam os hooks gerados (se necessario):
   - hooks/use-auth.ts: wrapper sobre hooks de auth do @api/hooks
   - hooks/use-doctors.ts: wrapper sobre hooks de doctors
   - Estes wrappers adicionam logica de UI (toast, redirect, etc)
   - Exemplo:
     ```typescript
     "use client";

     import { useLoginUser } from "@api/hooks";
     import { authService } from "@/lib/auth";
     import { toast } from "sonner";
     import { useRouter } from "next/navigation";

     export function useLogin() {
       const router = useRouter();

       return useLoginUser({
         mutation: {
           onSuccess: (data) => {
             authService.login(data); // Salvar tokens
             toast.success("Login realizado com sucesso!");
             // Redirect baseado no role
             const role = authService.getUserRole();
             if (role === "owner") router.push("/owner/dashboard");
             else if (role === "convenio_admin") router.push("/convenio/dashboard");
             else router.push("/");
           },
           onError: (error) => {
             toast.error("Email ou senha invalidos");
           },
         },
       });
     }
     ```

Validacao:
- QueryClientProvider funcional no layout
- ReactQueryDevtools aparece em dev
- Toaster (Sonner) mostra notificacoes
- Dark mode toggle funciona
- Hooks gerados (@api/hooks) importam e funcionam

Commit: "feat(frontend): tanstack query setup with providers, devtools, and toast notifications"
```

**Tarefa 5.6 — Login Page**
```
Implemente a pagina de login completa:

1. Criar estrutura de rotas auth:
   app/
   ├── (auth)/
   │   ├── layout.tsx    # Layout centralizado sem sidebar
   │   ├── login/
   │   │   └── page.tsx  # Login page
   │   ├── forgot-password/
   │   │   └── page.tsx  # Forgot password (placeholder)
   │   └── reset-password/
       └── page.tsx  # Reset password (placeholder)

2. Criar app/(auth)/layout.tsx:
   ```typescript
   export default function AuthLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
         <div className="w-full max-w-md px-4">
           {children}
         </div>
       </div>
     );
   }
   ```

3. Criar app/(auth)/login/page.tsx (Client Component):
   - Logo HealthApp no topo
   - Form com React Hook Form + Zod:
     * Email (input type="email", required)
     * Password (input type="password", required, show/hide toggle)
     * Checkbox "Lembrar-me"
     * Button "Entrar" (loading state enquanto faz request)
   - Links: "Esqueceu a senha?" → /forgot-password
   - Validacao Zod:
     * email: z.string().email("Email invalido")
     * password: z.string().min(1, "Senha obrigatoria")
   - Submit:
     * Chamar authService.login() ou hook gerado useLoginUser()
     * On success: redirect baseado no role
       - convenio_admin → /convenio/dashboard
       - owner → /owner/dashboard
       - Outros → /login (nao devem acessar o painel web)
     * On error: toast com mensagem de erro
   - Loading state: Button desabilitado + spinner
   - @extend_schema: page deve funcionar sem JS (progressive enhancement — opcional)

4. Criar componentes reutilizaveis para auth:
   - components/auth/login-form.tsx (Client Component)
   - components/auth/auth-card.tsx (wrapper com logo + card)

Validacao:
- http://localhost:3000/login renderiza form
- Login com credenciais validas (seed data) → redirect para dashboard
- Login com credenciais invalidas → toast de erro
- Loading state funciona (button disabled + spinner)
- Responsive: funciona em mobile e desktop
- Dark mode: layout adapta

Commit: "feat(frontend): login page with react hook form, zod validation, and jwt auth"
```

### Dia 3 (Quarta) — Layouts e Navigation

**Tarefa 5.7 — proxy.ts (Auth + Role Routing)**
```
Configure proxy.ts para verificacao JWT e role routing:

NOTA: No Next.js 16, proxy.ts substitui middleware.ts e roda no Node.js runtime
completo (nao Edge). Se a versao do Next.js disponivel usar middleware.ts, usar esse.

1. Criar middleware.ts (ou proxy.ts) na raiz do frontend/:
   ```typescript
   import { NextResponse } from "next/server";
   import type { NextRequest } from "next/server";

   // Rotas publicas que nao exigem auth
   const publicPaths = ["/login", "/forgot-password", "/reset-password"];

   // Rotas por role
   const roleRoutes: Record<string, string[]> = {
     convenio_admin: ["/convenio"],
     owner: ["/owner", "/convenio"], // Owner pode acessar tudo
   };

   export function middleware(request: NextRequest) {
     const { pathname } = request.nextUrl;

     // Rotas publicas — permitir sempre
     if (publicPaths.some((path) => pathname.startsWith(path))) {
       return NextResponse.next();
     }

     // Verificar JWT no cookie ou header
     const token = request.cookies.get("access_token")?.value
       || request.headers.get("authorization")?.replace("Bearer ", "");

     if (!token) {
       // Sem token → redirect para login
       return NextResponse.redirect(new URL("/login", request.url));
     }

     // Decodificar JWT para extrair role (sem verificar assinatura no middleware)
     try {
       const payload = JSON.parse(
         Buffer.from(token.split(".")[1], "base64").toString()
       );
       const role = payload.role;

       // Verificar expiracao basica
       if (payload.exp && payload.exp * 1000 < Date.now()) {
         // Token expirado — redirect para login
         const response = NextResponse.redirect(new URL("/login", request.url));
         response.cookies.delete("access_token");
         return response;
       }

       // Redirect root para dashboard baseado no role
       if (pathname === "/") {
         if (role === "owner") {
           return NextResponse.redirect(new URL("/owner/dashboard", request.url));
         }
         if (role === "convenio_admin") {
           return NextResponse.redirect(new URL("/convenio/dashboard", request.url));
         }
         // Outros roles nao tem painel web
         return NextResponse.redirect(new URL("/login", request.url));
       }

       // Verificar acesso por role
       if (pathname.startsWith("/owner") && role !== "owner") {
         return NextResponse.redirect(new URL("/convenio/dashboard", request.url));
       }

       if (pathname.startsWith("/convenio") &&
           !["convenio_admin", "owner"].includes(role)) {
         return NextResponse.redirect(new URL("/login", request.url));
       }

       return NextResponse.next();
     } catch {
       // Token invalido → redirect para login
       return NextResponse.redirect(new URL("/login", request.url));
     }
   }

   export const config = {
     matcher: [
       // Matcher para todas as rotas exceto assets e API
       "/((?!_next/static|_next/image|favicon.ico|api).*)",
     ],
   };
   ```

2. NOTA IMPORTANTE: O JWT storage precisa ser acessivel tanto pelo middleware
   (server-side) quanto pelo Axios interceptor (client-side). Opcoes:
   - Usar cookies httpOnly para o access token (mais seguro)
   - OU usar localStorage (mais simples, implementado na tarefa 5.4)
   - Se usar localStorage, o middleware NAO tera acesso ao token
   - Nesse caso, usar client-side routing guards em vez de middleware

3. Se usar client-side guards (alternativa ao middleware):
   Criar hooks/use-auth-guard.ts:
   ```typescript
   "use client";

   import { useEffect } from "react";
   import { useRouter } from "next/navigation";
   import { authService } from "@/lib/auth";

   export function useAuthGuard(allowedRoles: string[]) {
     const router = useRouter();

     useEffect(() => {
       if (!authService.isAuthenticated()) {
         router.push("/login");
         return;
       }

       const role = authService.getUserRole();
       if (role && !allowedRoles.includes(role)) {
         router.push("/login");
       }
     }, [allowedRoles, router]);

     return {
       isAuthenticated: authService.isAuthenticated(),
       role: authService.getUserRole(),
     };
   }
   ```

Validacao:
- Acessar / sem token → redirect para /login
- Acessar / com token convenio_admin → redirect para /convenio/dashboard
- Acessar / com token owner → redirect para /owner/dashboard
- Acessar /owner/* com token convenio_admin → redirect
- Acessar /convenio/* com token owner → permitido
- Token expirado → redirect para /login

Commit: "feat(frontend): auth middleware with JWT verification and role-based routing"
```

**Tarefa 5.8 — Layout Convenio (Sidebar + Header)**
```
Implemente o layout do painel do Convenio Admin:

1. Criar estrutura de rotas:
   app/
   ├── (convenio)/
   │   ├── layout.tsx          # Layout com sidebar + header
   │   ├── dashboard/
   │   │   └── page.tsx        # Dashboard (placeholder)
   │   ├── doctors/
   │   │   └── page.tsx        # Medicos (placeholder)
   │   ├── schedules/
   │   │   └── page.tsx        # Agendas (placeholder)
   │   ├── exams/
   │   │   └── page.tsx        # Tipos de exame (placeholder)
   │   ├── appointments/
   │   │   └── page.tsx        # Agendamentos (placeholder)
   │   ├── financial/
   │   │   └── page.tsx        # Financeiro (placeholder)
   │   └── settings/
   │       └── page.tsx        # Configuracoes (placeholder)

2. Criar components/layouts/sidebar.tsx (Client Component):
   - Logo HealthApp no topo
   - Links de navegacao com icones (Lucide):
     * Dashboard (LayoutDashboard icon)
     * Medicos (Stethoscope icon)
     * Agendas (Calendar icon)
     * Exames (TestTube icon)
     * Agendamentos (CalendarCheck icon)
     * Financeiro (DollarSign icon)
     * Configuracoes (Settings icon)
   - Link ativo destacado (bg-primary-100, text-primary-700)
   - Usar usePathname() para detectar rota ativa
   - Botao de logout no rodape
   - Info do usuario (avatar, nome, role)
   - Responsivo: em mobile, sidebar vira sheet (Shadcn Sheet)
   - Width: 280px (var --spacing-sidebar)

3. Criar components/layouts/header.tsx (Client Component):
   - Breadcrumb automatico baseado na rota
   - Botao de busca (placeholder)
   - Botao de notificacoes com badge de unread count
     * Usar hook gerado: useGetUnreadCount() (do @api/hooks)
   - Avatar do usuario com dropdown:
     * Perfil
     * Tema (dark/light toggle)
     * Logout
   - Height: 64px (var --spacing-header)

4. Criar app/(convenio)/layout.tsx:
   ```typescript
   "use client";

   import { Sidebar } from "@/components/layouts/sidebar";
   import { Header } from "@/components/layouts/header";
   import { useAuthGuard } from "@/hooks/use-auth-guard";

   export default function ConvenioLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     useAuthGuard(["convenio_admin", "owner"]);

     return (
       <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
         <Sidebar variant="convenio" />
         <div className="flex-1 flex flex-col overflow-hidden">
           <Header />
           <main className="flex-1 overflow-auto p-6">
             {children}
           </main>
         </div>
       </div>
     );
   }
   ```

5. Criar paginas placeholder para cada rota:
   - Cada page.tsx com titulo + "Em desenvolvimento" message
   - Usar Skeleton components para preview do layout

Validacao:
- http://localhost:3000/convenio/dashboard mostra layout com sidebar
- Sidebar destaca link ativo
- Navegacao entre paginas funciona (client-side)
- Header mostra breadcrumb e avatar
- Mobile: sidebar vira hamburger menu
- Dark mode: layout adapta corretamente

Commit: "feat(frontend): convenio panel layout with responsive sidebar and header"
```

**Tarefa 5.9 — Layout Owner (Sidebar + Header)**
```
Implemente o layout do painel Owner (similar ao convenio, com menu diferente):

1. Criar estrutura de rotas:
   app/
   ├── (owner)/
   │   ├── layout.tsx          # Layout com sidebar owner
   │   ├── dashboard/
   │   │   └── page.tsx        # Dashboard executivo (placeholder)
   │   ├── convenios/
   │   │   └── page.tsx        # Gestao convenios (placeholder)
   │   ├── users/
   │   │   └── page.tsx        # Gestao usuarios (placeholder)
   │   ├── financial/
   │   │   └── page.tsx        # Financeiro global (placeholder)
   │   ├── analytics/
   │   │   └── page.tsx        # Analytics (placeholder)
   │   ├── audit-logs/
   │   │   └── page.tsx        # Logs de auditoria (placeholder)
   │   └── settings/
   │       └── page.tsx        # Configuracoes globais (placeholder)

2. Reutilizar componente Sidebar com prop variant="owner":
   - Links de navegacao owner:
     * Dashboard Executivo (BarChart3 icon)
     * Convenios (Building2 icon)
     * Usuarios (Users icon)
     * Financeiro Global (Wallet icon)
     * Analytics (TrendingUp icon)
     * Auditoria (Shield icon)
     * Configuracoes (Settings icon)
   - Badge visual "Owner" para diferenciar do painel convenio

3. Criar app/(owner)/layout.tsx:
   ```typescript
   "use client";

   import { Sidebar } from "@/components/layouts/sidebar";
   import { Header } from "@/components/layouts/header";
   import { useAuthGuard } from "@/hooks/use-auth-guard";

   export default function OwnerLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     useAuthGuard(["owner"]);

     return (
       <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
         <Sidebar variant="owner" />
         <div className="flex-1 flex flex-col overflow-hidden">
           <Header />
           <main className="flex-1 overflow-auto p-6">
             {children}
           </main>
         </div>
       </div>
     );
   }
   ```

4. Criar paginas placeholder para cada rota

Validacao:
- http://localhost:3000/owner/dashboard mostra layout owner
- Menu owner diferente do menu convenio
- Auth guard bloqueia acesso de convenio_admin
- Navegacao entre paginas funciona

Commit: "feat(frontend): owner panel layout with admin sidebar and auth guard"
```

### Dia 4 (Quinta) — Dashboard Funcional com Dados Reais

**Tarefa 5.10 — Convenio Dashboard com KPIs Reais**
```
Implemente o dashboard do convenio consumindo dados reais da API:

1. Criar app/(convenio)/dashboard/page.tsx:
   - Titulo: "Dashboard"
   - Subtitulo: "Visao geral do seu convenio"

2. Criar components/dashboard/kpi-cards.tsx (Client Component):
   ```typescript
   "use client";

   import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
   import { Skeleton } from "@/components/ui/skeleton";
   // Importar hook gerado pelo Kubb:
   // import { useGetConvenioDashboard } from "@api/hooks";

   export function KPICards() {
     // Usar hook gerado ou fetch manual:
     // const { data, isLoading } = useGetConvenioDashboard();

     // Se hook gerado nao estiver disponivel, usar useQuery manual:
     const { data, isLoading } = useQuery({
       queryKey: ["convenio-dashboard"],
       queryFn: () => api.get("/v1/convenios/dashboard/").then(r => r.data),
     });

     if (isLoading) return <KPICardsSkeleton />;

     const kpis = [
       {
         title: "Medicos Ativos",
         value: data?.total_doctors || 0,
         icon: Stethoscope,
         color: "text-primary-600",
       },
       {
         title: "Agendamentos (Mes)",
         value: data?.total_appointments_month || 0,
         icon: CalendarCheck,
         color: "text-success-600",
       },
       {
         title: "Receita (Mes)",
         value: formatCurrency(data?.total_revenue_month || 0),
         icon: DollarSign,
         color: "text-warning-600",
       },
       {
         title: "Taxa de Cancelamento",
         value: `${data?.cancellation_rate?.toFixed(1) || 0}%`,
         icon: XCircle,
         color: "text-danger-600",
       },
     ];

     return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {kpis.map((kpi) => (
           <Card key={kpi.title}>
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-neutral-500">
                 {kpi.title}
               </CardTitle>
               <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{kpi.value}</div>
             </CardContent>
           </Card>
         ))}
       </div>
     );
   }
   ```

3. Criar components/dashboard/revenue-chart.tsx (Client Component):
   - Grafico de receita mensal com Recharts (AreaChart)
   - Dados de revenue_by_day do dashboard endpoint
   - Eixo X: dias do mes
   - Eixo Y: receita em R$
   - Tooltip com valor formatado

4. Criar components/dashboard/appointments-by-status.tsx (Client Component):
   - Grafico de pizza/donut com Recharts (PieChart)
   - Dados de appointments_by_status do dashboard endpoint
   - Cores: pending=amarelo, confirmed=azul, completed=verde, cancelled=vermelho

5. Criar components/dashboard/top-doctors-table.tsx (Client Component):
   - Tabela com top 5 medicos por agendamentos
   - Colunas: Foto, Nome, Especialidade, Agendamentos, Rating
   - Dados de top_doctors do dashboard endpoint
   - Usar componente Table do Shadcn/UI

6. Criar components/dashboard/recent-appointments.tsx (Client Component):
   - Lista dos 5 agendamentos mais recentes
   - Cards com: paciente, medico, data/hora, status (badge colorido)
   - Link para detalhes (placeholder)

7. Criar lib/formatters.ts:
   - formatCurrency(value: number): string → "R$ 1.234,56"
   - formatDate(date: string): string → "03/03/2026"
   - formatTime(time: string): string → "14:30"
   - formatDateTime(datetime: string): string → "03/03/2026 14:30"
   - formatPhone(phone: string): string → "(11) 99999-9999"

8. Montar tudo no page.tsx:
   ```typescript
   "use client";

   import { KPICards } from "@/components/dashboard/kpi-cards";
   import { RevenueChart } from "@/components/dashboard/revenue-chart";
   import { AppointmentsByStatus } from "@/components/dashboard/appointments-by-status";
   import { TopDoctorsTable } from "@/components/dashboard/top-doctors-table";
   import { RecentAppointments } from "@/components/dashboard/recent-appointments";

   export default function ConvenioDashboardPage() {
     return (
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold">Dashboard</h1>
           <p className="text-neutral-500">Visao geral do seu convenio</p>
         </div>

         <KPICards />

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <RevenueChart />
           <AppointmentsByStatus />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <TopDoctorsTable />
           <RecentAppointments />
         </div>
       </div>
     );
   }
   ```

Validacao:
- http://localhost:3000/convenio/dashboard mostra KPIs reais (nao zeros)
- Graficos renderizam com dados da API
- Tabela de top doctors mostra dados
- Loading states (skeletons) aparecem durante fetch
- Erro de API mostra mensagem amigavel
- Responsive: graficos adaptam em mobile

Commit: "feat(frontend): convenio dashboard with real KPIs, charts, and data tables"
```

**Tarefa 5.11 — Owner Dashboard com KPIs Globais**
```
Implemente o dashboard executivo do owner:

1. Criar app/(owner)/dashboard/page.tsx com:
   - KPI cards globais: total users, total convenios, total appointments,
     total revenue, average ticket, payment success rate
   - Grafico: revenue por dia (AreaChart)
   - Grafico: users registrados por dia (BarChart)
   - Tabela: top 5 convenios por receita
   - Lista: ultimas acoes administrativas (audit log preview)
   - Consumir GET /api/v1/admin-panel/dashboard/

2. Reutilizar componentes do dashboard convenio onde possivel:
   - KPICards (com props diferentes)
   - RevenueChart (com dados globais)

3. Criar componentes especificos do owner:
   - components/dashboard/users-growth-chart.tsx
   - components/dashboard/top-convenios-table.tsx
   - components/dashboard/recent-audit-log.tsx

Validacao:
- http://localhost:3000/owner/dashboard mostra KPIs globais reais
- Graficos renderizam com dados da API
- Auth guard: so owner acessa
- Loading states funcionam

Commit: "feat(frontend): owner executive dashboard with global KPIs and analytics"
```

### Dia 5 (Sexta) — CI/CD + Polish + Zustand Store

**Tarefa 5.12 — Zustand Auth Store**
```
Implemente store Zustand para estado de autenticacao:

1. Criar stores/auth-store.ts:
   ```typescript
   import { create } from "zustand";
   import { persist } from "zustand/middleware";

   interface User {
     id: string;
     email: string;
     full_name: string;
     role: string;
     avatar_url?: string;
     convenio_id?: string;
   }

   interface AuthState {
     user: User | null;
     isAuthenticated: boolean;
     isLoading: boolean;
     setUser: (user: User | null) => void;
     setLoading: (loading: boolean) => void;
     logout: () => void;
   }

   export const useAuthStore = create<AuthState>()(
     persist(
       (set) => ({
         user: null,
         isAuthenticated: false,
         isLoading: true,
         setUser: (user) =>
           set({ user, isAuthenticated: !!user, isLoading: false }),
         setLoading: (isLoading) => set({ isLoading }),
         logout: () => {
           localStorage.removeItem("access_token");
           localStorage.removeItem("refresh_token");
           set({ user: null, isAuthenticated: false, isLoading: false });
         },
       }),
       {
         name: "auth-storage",
         partialize: (state) => ({
           user: state.user,
           isAuthenticated: state.isAuthenticated,
         }),
       }
     )
   );
   ```

2. Criar hooks/use-current-user.ts:
   - Hook que busca dados do usuario logado (/api/v1/users/me/)
   - Atualiza authStore.user com dados frescos
   - Chamado no layout apos login

3. Atualizar login flow para salvar user no store
4. Atualizar sidebar/header para usar authStore.user

Validacao:
- Apos login, user persiste no localStorage
- Sidebar mostra nome e avatar do usuario
- Apos logout, store limpo
- Refresh da pagina mantem usuario logado

Commit: "feat(frontend): zustand auth store with persistence and current user hook"
```

**Tarefa 5.13 — GitHub Actions CI Frontend**
```
Configure CI/CD para o frontend:

1. Criar .github/workflows/frontend-ci.yml:
   ```yaml
   name: Frontend CI

   on:
     push:
       branches: [develop, main]
       paths:
         - 'frontend/**'
         - 'shared/gen/**'
     pull_request:
       branches: [develop, main]
       paths:
         - 'frontend/**'
         - 'shared/gen/**'

   jobs:
     lint-and-build:
       runs-on: ubuntu-latest
       defaults:
         run:
           working-directory: frontend
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
             cache-dependency-path: frontend/package-lock.json
         - run: npm ci
         - run: npm run lint
         - run: npm run type-check
         - run: npm run build
   ```

Validacao:
- npm run lint passa
- npm run type-check passa
- npm run build completa sem erros
- Workflow YAML valido

Commit: "ci(frontend): github actions with lint, type-check, and build"
```

**Tarefa 5.14 — Error Handling + Loading States**
```
Implemente tratamento de erro e loading states globais:

1. Criar app/error.tsx (Client Component):
   - Error boundary global
   - Mostra mensagem amigavel + botao "Tentar novamente"
   - Log do erro no console (em prod, enviaria para Sentry)

2. Criar app/not-found.tsx:
   - Pagina 404 customizada
   - Ilustracao + link para voltar ao dashboard

3. Criar app/loading.tsx:
   - Loading global com skeletons
   - Usado durante transicoes de rota

4. Criar components/ui/error-state.tsx:
   - Componente reutilizavel para estados de erro em sections
   - Props: message, onRetry

5. Criar components/ui/empty-state.tsx:
   - Componente para listas vazias
   - Props: icon, title, description, action

6. Criar components/ui/page-header.tsx:
   - Componente padrao para headers de pagina
   - Props: title, description, actions (botoes)

Validacao:
- Erro de API mostra error-state com botao retry
- Pagina inexistente mostra 404 customizado
- Transicao entre rotas mostra loading
- Listas vazias mostram empty-state

Commit: "feat(frontend): error handling, loading states, and empty states"
```

**Tarefa 5.15 — Verificacao de Integracao @api/ + Polish**
```
Verifique que a integracao com shared/gen/ funciona end-to-end:

1. Verificar imports @api/*:
   - Criar pagina de teste temporaria que importa:
     * Types: import type { Doctor } from "@api/types"
     * Hooks: import { useListDoctors } from "@api/hooks"
     * Clients: import { listDoctors } from "@api/clients"
     * Zod: import { doctorSchema } from "@api/zod"
   - Verificar que TypeScript resolve os paths
   - Verificar que build compila sem erros

2. Se imports @api/* nao funcionarem:
   - Verificar tsconfig.json paths
   - Verificar se precisa de next.config.ts transpilePackages
   - Verificar se shared/gen/ usa ESM ou CJS
   - Adicionar resolucao de modulos necessaria

3. Testar um hook gerado em componente real:
   - Usar useListDoctors() ou equivalente no dashboard
   - Verificar que retorna dados tipados
   - Verificar que loading/error states funcionam

4. Polish final:
   - Verificar responsive em todas as paginas
   - Verificar dark mode em todos os componentes
   - Verificar acessibilidade basica (tab navigation, aria-labels)
   - Remover pagina de teste se criada

5. Executar validacoes finais:
   npm run lint
   npm run type-check
   npm run build

Validacao:
- import { useListDoctors } from "@api/hooks" funciona
- import type { Doctor } from "@api/types" funciona
- Hook retorna dados tipados da API real
- npm run build completa sem erros
- Todas as paginas responsivas e com dark mode

Commit: "feat(frontend): verified @api/* integration with generated hooks and types"
```

---

## PARTE 2 — CHECKLIST DE ENTREGA SEMANA 5

### Criterios de Aceitacao (Definition of Done)

```
[ ] Next.js 16 project criado com Turbopack
[ ] next.config.ts com cacheComponents e reactCompiler
[ ] Tailwind CSS 4 com design tokens HealthApp (@theme)
[ ] Dark mode funcional com next-themes
[ ] Shadcn/UI inicializado com 20+ componentes base
[ ] Lucide React instalado para icones
[ ] React Hook Form + Zod instalados para formularios
[ ] Recharts instalado para graficos
[ ] Axios instance com JWT interceptors (request + response)
[ ] Refresh token automatico em 401
[ ] TanStack Query configurado com QueryClientProvider
[ ] ReactQueryDevtools habilitado em dev
[ ] Sonner (toast) configurado globalmente
[ ] Login page funcional:
    [ ] Form com email + password
    [ ] Validacao Zod
    [ ] Submit com loading state
    [ ] Redirect por role apos login
    [ ] Toast de erro em credenciais invalidas
[ ] Auth middleware/guard:
    [ ] Rotas protegidas (redirect para /login sem token)
    [ ] Role-based routing (owner → /owner, convenio → /convenio)
    [ ] Token expirado → redirect para /login
[ ] Layout Convenio:
    [ ] Sidebar com 7 links de navegacao
    [ ] Header com breadcrumb, notificacoes, avatar
    [ ] Responsivo (sidebar → sheet em mobile)
    [ ] Auth guard para convenio_admin + owner
[ ] Layout Owner:
    [ ] Sidebar com 7 links de navegacao (menu diferente)
    [ ] Auth guard para owner only
[ ] Dashboard Convenio funcional:
    [ ] 4 KPI cards com dados reais
    [ ] Grafico de receita mensal (AreaChart)
    [ ] Grafico de appointments por status (PieChart)
    [ ] Tabela de top doctors
    [ ] Lista de agendamentos recentes
    [ ] Loading states (skeletons)
[ ] Dashboard Owner funcional:
    [ ] KPI cards globais com dados reais
    [ ] Graficos de receita e crescimento
    [ ] Top convenios
[ ] Zustand auth store com persistence
[ ] Path alias @api/* → shared/gen/* funcional
[ ] Hooks gerados (@api/hooks) importam e funcionam
[ ] Types gerados (@api/types) importam e funcionam
[ ] Error boundary global (app/error.tsx)
[ ] 404 page customizada (app/not-found.tsx)
[ ] Loading page global (app/loading.tsx)
[ ] Formatters: moeda, data, telefone (lib/formatters.ts)
[ ] GitHub Actions CI: lint + type-check + build
[ ] npm run lint: 0 errors
[ ] npm run type-check: 0 errors
[ ] npm run build: sucesso
[ ] Todos os commits seguem Conventional Commits
```

### Metricas de Qualidade Esperadas

```
Warnings ESLint: 0
Erros TypeScript: 0
Build time (Turbopack): < 30s
Dev HMR: < 200ms
Paginas criadas: 16+ (2 dashboards + 12 placeholders + login + error/404)
Componentes criados: 20+
Shadcn components instalados: 20+
Routes protegidas: 14+
Tarefas totais: 15
Tempo estimado: 5 dias (40h)
```

---

## PARTE 3 — COMANDOS DE REFERENCIA RAPIDA

### Desenvolvimento Local

```bash
# Subir backend (se nao estiver rodando)
cd backend/
docker-compose -f docker/docker-compose.dev.yml up -d
python manage.py runserver  # Se nao usar Docker para API

# Iniciar frontend dev
cd frontend/
npm run dev
# Acessar http://localhost:3000

# Lint
npm run lint

# Type check
npm run type-check

# Build
npm run build

# Instalar novo componente Shadcn
npx shadcn@latest add [component-name]
```

### Integracao com API

```bash
# Verificar que API esta rodando
curl http://localhost:8000/api/v1/doctors/

# Login via API (obter token para testar)
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@healthapp.com","password":"SecurePass123!"}'

# Testar endpoint protegido
curl http://localhost:8000/api/v1/convenios/dashboard/ \
  -H "Authorization: Bearer <token>"
```

### Kubb / Codigo Gerado

```bash
# Regenerar codigo (apos mudancas no backend)
cd healthapp/  # raiz do monorepo
npm run api:sync

# Verificar codigo gerado
ls shared/gen/types/
ls shared/gen/hooks/
ls shared/gen/clients/

# Verificar types no frontend
cd frontend/
npm run type-check
```

### Git

```bash
# Branch naming
git checkout -b feat/frontend-scaffold
git checkout -b feat/login-page
git checkout -b feat/convenio-dashboard

# Commit pattern
git commit -m "feat(frontend): description"
git commit -m "fix(frontend): description"
git commit -m "ci(frontend): description"
```

---

## PARTE 4 — TRANSICAO PARA SEMANA 6

Ao concluir a Semana 5, o frontend tera:
- **Next.js 16** com Turbopack, Tailwind CSS 4, Shadcn/UI — base solida
- **Auth completo**: login, JWT storage, refresh automatico, role routing
- **Layouts funcionais**: sidebar + header para convenio e owner, responsivos
- **Dashboards com dados reais**: KPIs, graficos, tabelas consumindo a API
- **Integracao @api/*** verificada: hooks, types e clients gerados funcionando
- **CI/CD** configurado (lint + type-check + build)

**Semana 6: Painel Convenio Completo** — Foco em:
- Doctor CRUD completo (tabela com filtros + modal de criacao/edicao com React Hook Form + Zod)
- Gerenciamento de agendas (calendario interativo com drag-and-drop)
- Schedule exceptions (date range picker)
- Tipos de exame CRUD
- Tabela de precos
- View Transitions para navegacao suave entre paginas
- Todos os CRUDs usando hooks gerados pelo Kubb (zero boilerplate de API)
- Cache Components do Next.js 16 para dados lentos (dashboards)

**Importante para Kubb:** Todas as operacoes CRUD da semana 6 usarao DIRETAMENTE
os hooks gerados: useListDoctors, useCreateDoctor, useUpdateDoctor, useDeleteDoctor, etc.
Forms usarao Zod schemas gerados para validacao. Nenhum codigo de API sera escrito
manualmente. O investimento nas semanas 1-4 (api:sync) garante que o frontend so
precisa se preocupar com UI e UX.

---

*Fim do Prompt de Execucao Semana 5*
