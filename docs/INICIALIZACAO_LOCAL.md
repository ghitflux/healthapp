# HealthApp — Inicializacao Local

Guia rapido para subir a aplicacao localmente em ambiente de desenvolvimento.

## 1. Pre-requisitos

- Docker Desktop (ou Docker Engine) com daemon ativo
- Docker Compose (`docker compose` ou `docker-compose`)
- Node.js 20.9+ e npm
- Bash (Linux, macOS, WSL)
- `curl` (recomendado para health-check)

## 2. Script de Inicializacao

Script oficial:

```bash
./scripts/start-local.sh
```

O script executa:

1. Cria arquivos de ambiente se estiverem ausentes:
- `backend/.env` (a partir de `.env.example`)
- `frontend/.env.local` (a partir de `.env.example`)
2. Sobe infraestrutura backend (PostgreSQL, Redis, MinIO) via Docker
3. Executa migrations do Django
4. Sobe API + Celery worker + Celery beat via Docker
5. Inicia frontend Next.js em modo dev (`npm run dev`)

## 3. Uso

### 3.1 Inicializacao padrao

```bash
./scripts/start-local.sh
```

### 3.2 Inicializacao com seed de dados

```bash
./scripts/start-local.sh --seed
```

### 3.3 Inicializacao sem `npm install` automatico no frontend

```bash
./scripts/start-local.sh --no-frontend-install
```

### 3.4 Ajuda

```bash
./scripts/start-local.sh --help
```

## 4. URLs Locais

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## 5. Como Parar os Servicos

Quando quiser parar backend/infra:

```bash
docker compose -f backend/docker-compose.dev.yml down
```

Se seu ambiente usa `docker-compose` legado:

```bash
docker-compose -f backend/docker-compose.dev.yml down
```

## 6. Troubleshooting Rapido

- Erro de porta ocupada:
  - Verifique se ja existe processo usando `3000`, `8000`, `5432`, `6379`, `9000`, `9001`
- Docker daemon indisponivel:
  - Inicie Docker Desktop/Engine e rode novamente
- API nao sobe apos migrations:
  - Rode logs: `docker compose -f backend/docker-compose.dev.yml logs -f api`
- Frontend falha por dependencias:
  - Rode manualmente em `frontend/`: `npm install`

## 7. Observacoes

- O script nao altera codigo de aplicacao.
- `--seed` e opcional e usado para carregar dados iniciais de desenvolvimento.
- Se houver mudancas de contrato da API (serializers/views), execute depois:

```bash
npm run api:sync
```
