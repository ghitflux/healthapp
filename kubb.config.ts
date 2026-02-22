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
