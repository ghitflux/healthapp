# CLAUDE.md — Shared Layer (Kubb Code Generation)

> **Documento de referência para Claude Code — Camada Shared.**
> Esta pasta contém o schema OpenAPI exportado do backend e todo o código
> TypeScript auto-gerado pelo Kubb. Leia COMPLETAMENTE antes de tocar em qualquer arquivo aqui.

---

## 1. O Que É Esta Camada

A pasta `shared/` é a **ponte type-safe** entre o backend Django (que produz a API) e os consumidores frontend (Next.js 16) e mobile (React Native/Expo). Ela contém dois artefatos fundamentais: o arquivo `schema.yaml` exportado pelo drf-spectacular a partir dos serializers e views do Django, e a pasta `gen/` com todo o código TypeScript gerado automaticamente pelo Kubb a partir desse schema.

O princípio fundamental é: **o backend é a single source of truth**. Os serializers e views do Django definem o contrato da API. O drf-spectacular transforma esse contrato em OpenAPI 3.x. O Kubb transforma o OpenAPI em código TypeScript pronto para consumo. Nenhum dev escreve types, schemas Zod, clients Axios ou hooks TanStack Query manualmente — tudo é gerado.

---

## 2. Stack e Versões

| Ferramenta | Versão | Função |
|---|---|---|
| Kubb | **^4.27** | Code generator (OpenAPI → TypeScript) |
| @kubb/plugin-oas | ^4.27 | Parser e validador OpenAPI |
| @kubb/plugin-ts | ^4.27 | Gera TypeScript types/interfaces |
| @kubb/plugin-zod | ^4.27 | Gera Zod schemas de validação |
| @kubb/plugin-client | ^4.27 | Gera Axios client functions |
| @kubb/plugin-react-query | ^4.27 | Gera TanStack Query hooks |
| @kubb/plugin-faker | ^4.27 | Gera Faker.js mock data |
| @kubb/plugin-msw | ^4.27 | Gera MSW mock handlers |
| drf-spectacular | ^0.27 | Gera schema OpenAPI no backend |

---

## 3. Estrutura de Pastas

```
shared/
├── CLAUDE.md                 # ESTE ARQUIVO
├── schema.yaml               # OpenAPI 3.x exportado do Django (NÃO EDITAR)
└── gen/                      # Código auto-gerado pelo Kubb (NÃO EDITAR)
    ├── types/                # TypeScript interfaces e enums
    │   ├── authTypes.ts
    │   ├── usersTypes.ts
    │   ├── doctorsTypes.ts
    │   ├── appointmentsTypes.ts
    │   ├── paymentsTypes.ts
    │   ├── convenioTypes.ts
    │   ├── ownerTypes.ts
    │   ├── notificationsTypes.ts
    │   └── index.ts          # Barrel (named exports)
    ├── zod/                  # Zod schemas de validação runtime
    │   ├── authSchemas.ts
    │   ├── usersSchemas.ts
    │   ├── doctorsSchemas.ts
    │   ├── appointmentsSchemas.ts
    │   ├── paymentsSchemas.ts
    │   ├── convenioSchemas.ts
    │   ├── ownerSchemas.ts
    │   ├── notificationsSchemas.ts
    │   └── index.ts
    ├── clients/              # Axios client functions type-safe
    │   ├── authClient.ts
    │   ├── usersClient.ts
    │   ├── doctorsClient.ts
    │   ├── appointmentsClient.ts
    │   ├── paymentsClient.ts
    │   ├── convenioClient.ts
    │   ├── ownerClient.ts
    │   ├── notificationsClient.ts
    │   └── index.ts
    ├── hooks/                # TanStack Query hooks (useQuery, useMutation)
    │   ├── useAuth.ts
    │   ├── useUsers.ts
    │   ├── useDoctors.ts
    │   ├── useAppointments.ts
    │   ├── usePayments.ts
    │   ├── useConvenio.ts
    │   ├── useOwner.ts
    │   ├── useNotifications.ts
    │   └── index.ts
    ├── mocks/                # Dados de teste e mock handlers
    │   ├── faker/            # Faker.js data generators por tag
    │   └── msw/              # MSW request handlers por tag
    └── index.ts              # Barrel raiz
```

---

## 4. Regra de Ouro: NUNCA Editar shared/gen/

Todo o conteúdo de `shared/gen/` é **auto-gerado**. Cada execução de `kubb generate` apaga e recria a pasta inteira (`clean: true`). Qualquer edição manual será perdida na próxima geração.

Se você precisa de comportamento customizado, existem 3 caminhos corretos:

**Caminho 1 — Customizar no backend.** Se o type gerado está errado, o problema está no serializer ou no `@extend_schema`. Corrija no Django e regenere. O Kubb reflete fielmente o que o drf-spectacular produz.

**Caminho 2 — Wrapper no consumidor.** Se você precisa de um hook com lógica extra (infinite scroll, optimistic updates, polling), crie um hook customizado no `frontend/src/hooks/` ou `mobile/src/hooks/` que importa os `queryOptions` gerados como building blocks:

```typescript
// frontend/src/hooks/useDoctorsInfinite.ts (CUSTOMIZADO — pode editar)
import { listDoctors } from '@api/clients/doctorsClient'
import type { ListDoctorsQueryParams } from '@api/types/doctorsTypes'
import { useInfiniteQuery } from '@tanstack/react-query'

export function useDoctorsInfinite(filters: ListDoctorsQueryParams) {
  return useInfiniteQuery({
    queryKey: ['listDoctors', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => listDoctors({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.next ? lastPage.next : undefined,
    initialPageParam: 1,
  })
}
```

**Caminho 3 — Extend type gerado.** Se você precisa de propriedades client-side em um type, use interface extension no consumidor:

```typescript
// frontend/src/types/doctor.ts (CUSTOMIZADO — pode editar)
import type { Doctor as GeneratedDoctor } from '@api/types/doctorsTypes'

export interface Doctor extends GeneratedDoctor {
  isSelected?: boolean    // propriedade local de UI
  distanceKm?: number     // calculado no client
}
```

---

## 5. Configuração do Kubb

### 5.1 kubb.config.ts (Raiz do Monorepo)

```typescript
// healthapp/kubb.config.ts

import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginClient } from '@kubb/plugin-client'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'

export default defineConfig({
  input: {
    path: './shared/schema.yaml',
  },
  output: {
    path: './shared/gen',
    clean: true,
    barrelType: 'named',
  },
  plugins: [
    // 1. Parser OpenAPI
    pluginOas({
      validate: true,
      collisionDetection: true,
    }),

    // 2. TypeScript Types
    pluginTs({
      output: { path: './types' },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Types`,
      },
      enumType: 'asConst',
      dateType: 'string',
    }),

    // 3. Zod Schemas
    pluginZod({
      output: { path: './zod' },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Schemas`,
      },
      dateType: 'string',
      coercion: { numbers: true, strings: false, dates: false },
    }),

    // 4. Axios Clients
    pluginClient({
      output: { path: './clients' },
      group: {
        type: 'tag',
        name: ({ group }) => `${group}Client`,
      },
      client: 'axios',
      dataReturnType: 'data',
      baseURL: '',
      parser: 'zod',
    }),

    // 5. TanStack Query Hooks
    pluginReactQuery({
      output: { path: './hooks' },
      group: {
        type: 'tag',
        name: ({ group }) =>
          `use${group.charAt(0).toUpperCase() + group.slice(1)}`,
      },
      client: { dataReturnType: 'data' },
      mutation: {
        methods: ['post', 'put', 'patch', 'delete'],
      },
      suspense: {},
      parser: 'zod',
    }),

    // 6. Faker.js Mocks
    pluginFaker({
      output: { path: './mocks/faker' },
      group: { type: 'tag' },
      dateType: 'string',
    }),

    // 7. MSW Handlers
    pluginMsw({
      output: { path: './mocks/msw' },
      group: { type: 'tag' },
    }),
  ],
})
```

### 5.2 Decisões de Configuração e Por Quê

**`clean: true`** — Cada geração apaga e recria tudo. Garante que endpoints removidos não deixam código fantasma. Código gerado NUNCA deve ser editado, então limpar é seguro.

**`barrelType: 'named'`** — Barrel files com named exports permitem tree-shaking. O bundler (Turbopack ou Metro) só inclui o que é importado.

**`collisionDetection: true`** — Previne conflitos quando dois schemas têm nomes similares (ex: `Doctor` request vs `Doctor` response). Será padrão no Kubb v5.

**`enumType: 'asConst'`** — Gera `as const` ao invés de `enum`. Melhor tree-shaking e compatível com os patterns do projeto.

**`dateType: 'string'`** — A API retorna datas como strings ISO 8601. Manter como string evita conversão prematura e alinha com o que o frontend/mobile realmente recebe.

**`parser: 'zod'`** — Clients e hooks validam o response da API com Zod automaticamente. Se o backend retornar algo inesperado, o erro é capturado imediatamente ao invés de propagar silenciosamente pela UI.

**`client: 'axios'`** — O projeto já usa Axios com interceptors JWT. O Kubb gera clients compatíveis que usam a mesma instância configurada.

**`suspense: {}`** — Gera hooks com `useSuspenseQuery` para uso com React 19.2 Suspense boundaries no Next.js 16.

**Agrupamento por tag** — Cada plugin agrupa por tag do OpenAPI (auth, doctors, appointments, etc). Isso alinha com os apps do Django e facilita imports organizados.

---

## 6. Pré-Requisito no Backend: drf-spectacular

O Kubb depende de um schema OpenAPI de alta qualidade. O drf-spectacular gera esse schema a partir do DRF, mas a qualidade depende de como os views e serializers são anotados.

### 6.1 SPECTACULAR_SETTINGS (config/settings/base.py)

```python
SPECTACULAR_SETTINGS = {
    'TITLE': 'HealthApp API',
    'DESCRIPTION': 'API REST para gestão de saúde — agendamentos, pagamentos e convênios',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'POSTPROCESSING_HOOKS': [
        'drf_spectacular.hooks.postprocess_schema_enums',
    ],
    'TAGS': [
        {'name': 'auth',          'description': 'Autenticação e registro'},
        {'name': 'users',         'description': 'Gestão de usuários e perfil'},
        {'name': 'doctors',       'description': 'Médicos e busca'},
        {'name': 'appointments',  'description': 'Agendamentos'},
        {'name': 'payments',      'description': 'Pagamentos e PIX'},
        {'name': 'convenio',      'description': 'Painel do convênio'},
        {'name': 'owner',         'description': 'Painel do owner'},
        {'name': 'notifications', 'description': 'Notificações'},
    ],
    'SECURITY': [{'bearerAuth': []}],
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'bearerAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
        }
    },
}
```

### 6.2 Regras Obrigatórias de Anotação nos Views

Cada view DEVE ter `@extend_schema` com os seguintes campos. Sem isso, o Kubb gera código genérico e difícil de usar.

```python
from drf_spectacular.utils import extend_schema, OpenApiParameter

class DoctorViewSet(ModelViewSet):
    @extend_schema(
        operation_id='listDoctors',               # OBRIGATÓRIO — nome da função gerada
        tags=['doctors'],                          # OBRIGATÓRIO — agrupamento no Kubb
        summary='Listar médicos com filtros',      # Recomendado — vira JSDoc
        parameters=[                               # Recomendado — query params tipados
            OpenApiParameter(name='specialty', type=str, description='...'),
        ],
        responses={200: DoctorListSerializer(many=True)},  # OBRIGATÓRIO — tipo do response
    )
    def list(self, request):
        return super().list(request)
```

**operationId** — Se ausente, o drf-spectacular gera nomes automáticos como `api_v1_doctors_list` ao invés de `listDoctors`. Os nomes automáticos são feios e difíceis de usar. SEMPRE forneça operationId explícito no formato camelCase.

**tags** — Se ausente, o drf-spectacular usa o nome do app como tag. Mas como temos `convenio` e `owner` no mesmo app de views, precisamos de tags explícitas para separação correta.

**responses** — Se ausente, o drf-spectacular infere do `serializer_class` do viewset. Funciona para CRUD simples, mas para actions customizadas (`@action`) é obrigatório especificar.

**COMPONENT_SPLIT_REQUEST: True** — Separa schemas de request e response. Sem isso, um único schema é usado para ambos, o que gera types incorretos (ex: campos read-only aparecendo no request).

### 6.3 Convenção de Nomes de operationId

| Ação | Pattern operationId | Exemplo |
|---|---|---|
| List | `list{Resource}s` | `listDoctors` |
| Retrieve | `get{Resource}ById` | `getDoctorById` |
| Create | `create{Resource}` | `createAppointment` |
| Update (full) | `update{Resource}` | `updateConvenioSettings` |
| Update (partial) | `patch{Resource}` | `patchUserProfile` |
| Delete | `delete{Resource}` | `deleteNotification` |
| Action customizada | `{verb}{Resource}{Action}` | `getDoctorSlots`, `cancelAppointment` |
| Dashboard | `get{Panel}Dashboard` | `getConvenioDashboard` |

---

## 7. Workflow de Desenvolvimento

### 7.1 Pipeline Completo

```bash
# 1. Exportar schema do Django (requer Django rodando ou manage.py acessível)
npm run schema:export
# Equivale a: cd backend && python manage.py spectacular --color --file ../shared/schema.yaml --validate

# 2. Gerar código TypeScript
npm run generate:api
# Equivale a: kubb generate

# 3. Pipeline combinado (faz 1 + 2 em sequência)
npm run api:sync
```

### 7.2 Quando Executar

**`npm run api:sync` DEVE ser executado quando:**
- Um serializer for criado, alterado ou removido
- Um view ou endpoint for criado, alterado ou removido
- Um `@extend_schema` for adicionado ou modificado
- Parâmetros de query ou path forem alterados
- Qualquer mudança no contrato da API

**`npm run api:sync` NÃO precisa ser executado quando:**
- Mudanças puramente internas no backend (services, tasks, models sem impacto no serializer)
- Mudanças de UI no frontend ou mobile
- Mudanças de configuração (settings, Docker, CI)

### 7.3 Watch Mode (Desenvolvimento Ativo)

Durante sessões intensas de desenvolvimento backend+frontend simultâneo, o Kubb pode rodar em watch mode apontando para a URL do Django:

```bash
# Terminal 1: Django dev server
cd backend && python manage.py runserver

# Terminal 2: Kubb em watch mode
npm run generate:watch
# Requer input.path apontando para http://localhost:8000/api/schema/?format=yaml

# Terminal 3: Next.js dev
cd frontend && npm run dev
```

Para usar watch mode, altere temporariamente `kubb.config.ts`:
```typescript
input: {
  // path: './shared/schema.yaml',   // arquivo local (CI/CD)
  path: 'http://localhost:8000/api/schema/?format=yaml',  // URL Django (watch mode)
},
```

### 7.4 CI/CD

O workflow `api-sync.yml` no GitHub Actions detecta mudanças em serializers/views e regenera automaticamente:

```yaml
on:
  push:
    paths:
      - 'backend/apps/**/serializers.py'
      - 'backend/apps/**/views.py'
      - 'backend/apps/**/urls.py'

steps:
  - name: Export OpenAPI schema
    run: cd backend && python manage.py spectacular --file ../shared/schema.yaml --validate

  - name: Generate API code
    run: npm run generate:api

  - name: Type check consumers
    run: |
      cd frontend && npx tsc --noEmit
      cd ../mobile && npx tsc --noEmit

  - name: Commit generated code
    uses: stefanzweifel/git-auto-commit-action@v5
    with:
      commit_message: 'chore: regenerate API types from OpenAPI schema'
      file_pattern: 'shared/gen/**'
```

---

## 8. Como os Consumidores Importam

### 8.1 Path Alias

Frontend e mobile referenciam `shared/gen/` via path alias `@api`:

```jsonc
// frontend/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@api/*": ["../shared/gen/*"]
    }
  }
}
```

```jsonc
// mobile/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@api/*": ["../shared/gen/*"]
    }
  }
}
```

### 8.2 Exemplos de Importação

```typescript
// Frontend — Next.js 16 page (Server Component com prefetch)
import { listDoctorsQueryOptions } from '@api/hooks/useDoctors'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

export default async function DoctorsPage() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(listDoctorsQueryOptions({ page: 1 }))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DoctorsList />
    </HydrationBoundary>
  )
}
```

```typescript
// Frontend — Client Component
import { useListDoctors } from '@api/hooks/useDoctors'
import type { Doctor } from '@api/types/doctorsTypes'

function DoctorsList() {
  const { data, isLoading } = useListDoctors({ page: 1, page_size: 20 })
  // data é tipado como ListDoctorsResponse — autocomplete funciona
}
```

```typescript
// Frontend — Form com Zod gerado
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

```typescript
// Mobile — Screen com client direto (sem TanStack Query hooks quando necessário)
import { getDoctorById } from '@api/clients/doctorsClient'
import type { GetDoctorByIdResponse } from '@api/types/doctorsTypes'
```

```typescript
// Testes — MSW + Faker
import { handlers } from '@api/mocks/msw'
import { setupServer } from 'msw/node'
const server = setupServer(...handlers)
```

### 8.3 Axios Interceptor (Código Customizado no Consumidor)

O Kubb gera clients que usam Axios, mas o interceptor JWT é customizado por plataforma:

```typescript
// frontend/src/lib/axios.ts (CUSTOMIZADO — não gerado pelo Kubb)
import axios from 'axios'

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

client.interceptors.request.use((config) => {
  // httpOnly cookies — não precisa setar header manualmente no web
  // O browser envia automaticamente com credentials: 'include'
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
    }
    return Promise.reject(error)
  },
)

export default client
```

```typescript
// mobile/src/services/axios.ts (CUSTOMIZADO — não gerado pelo Kubb)
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const client = axios.create({
  baseURL: 'https://api.healthapp.com.br',
})

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client
```

---

## 9. Git Strategy para Código Gerado

**O código gerado é commitado no repositório.** Razões:

O frontend e mobile funcionam sem precisar rodar Kubb ou ter o Django disponível. O code review de PRs mostra exatamente quais types, schemas e hooks mudaram quando um serializer é alterado — documentação automática de breaking changes. O CI/CD do frontend não depende do backend estar rodando para fazer build.

```gitignore
# .gitignore — NÃO ignorar shared/gen/
# Ignorar apenas artefatos temporários do Kubb
.kubb/
```

---

## 10. Troubleshooting

**"Kubb gera nomes feios como `apiV1DoctorsList`"** — Falta `operationId` no `@extend_schema`. Adicione operationId explícito em camelCase no view.

**"Type gerado está errado (campo faltando ou tipo errado)"** — O problema está no serializer. Verifique se o campo está declarado, se o `read_only` / `write_only` está correto, e se `COMPONENT_SPLIT_REQUEST: True` está ativo.

**"Hook gerado faz GET mas deveria ser POST"** — O método HTTP é definido pela URL + method no DRF. Verifique se o view usa `@action(methods=['post'])` quando necessário.

**"Zod schema não valida corretamente"** — Verifique se os serializer fields têm `min_value`, `max_value`, `max_length`, etc. O drf-spectacular propaga essas constraints para o OpenAPI, e o Kubb as transforma em `.min()`, `.max()`, `.max_length()` no Zod.

**"Schema de paginação errado"** — Certifique-se de que `StandardResultsSetPagination` está configurado no DRF e que o drf-spectacular reconhece o formato de paginação. Use `PageNumberPagination` com `page_size_query_param`.

**"MSW handlers não interceptam requests"** — Verifique se os paths no MSW correspondem aos `baseURL` + path usados pelo Axios client.

---

## 11. Resumo de Comandos

```bash
# Exportar schema do Django
npm run schema:export

# Gerar código com Kubb
npm run generate:api

# Pipeline completo (export + generate)
npm run api:sync

# Watch mode
npm run generate:watch

# Debug (gera logs em .kubb/)
npm run generate:debug

# Validar schema sem gerar
cd backend && python manage.py spectacular --validate --color
```

---

*Este documento é a referência para a camada shared/. Para detalhes do backend que produz o schema, consulte `backend/CLAUDE.md`. Para detalhes dos consumidores, consulte `frontend/CLAUDE.md` e `mobile/CLAUDE.md`.*
