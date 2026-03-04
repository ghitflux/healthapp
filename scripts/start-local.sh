#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
COMPOSE_FILE="$BACKEND_DIR/docker-compose.dev.yml"

SEED_DATA=0
SKIP_FRONTEND_INSTALL=0

log() {
  printf "\033[1;34m[healthapp]\033[0m %s\n" "$*"
}

warn() {
  printf "\033[1;33m[healthapp]\033[0m %s\n" "$*"
}

error() {
  printf "\033[1;31m[healthapp]\033[0m %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Uso: ./scripts/start-local.sh [opcoes]

Opcoes:
  --seed                  Executa seed_data --minimal apos migrate
  --no-frontend-install   Nao roda npm install automatico no frontend
  -h, --help              Exibe esta ajuda

Exemplos:
  ./scripts/start-local.sh
  ./scripts/start-local.sh --seed
  ./scripts/start-local.sh --no-frontend-install
EOF
}

ensure_file_from_example() {
  local target="$1"
  local example="$2"

  if [[ ! -f "$target" ]]; then
    if [[ ! -f "$example" ]]; then
      error "Arquivo de exemplo nao encontrado: $example"
    fi
    cp "$example" "$target"
    warn "Criado $target a partir de $example"
  fi
}

wait_for_http() {
  local url="$1"
  local timeout_secs="${2:-90}"
  local elapsed=0

  if ! command -v curl >/dev/null 2>&1; then
    warn "curl nao encontrado; pulando health-check HTTP ($url)"
    return 0
  fi

  until curl -fsS "$url" >/dev/null 2>&1; do
    sleep 2
    elapsed=$((elapsed + 2))
    if (( elapsed >= timeout_secs )); then
      error "Timeout aguardando endpoint: $url"
    fi
  done
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed)
      SEED_DATA=1
      shift
      ;;
    --no-frontend-install)
      SKIP_FRONTEND_INSTALL=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      error "Opcao invalida: $1 (use --help)"
      ;;
  esac
done

if [[ ! -f "$COMPOSE_FILE" ]]; then
  error "docker-compose nao encontrado em: $COMPOSE_FILE"
fi

if ! command -v docker >/dev/null 2>&1; then
  error "Docker nao encontrado no PATH"
fi

if ! docker info >/dev/null 2>&1; then
  error "Docker daemon nao esta ativo"
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose -f "$COMPOSE_FILE")
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose -f "$COMPOSE_FILE")
else
  error "Docker Compose nao encontrado (nem 'docker compose' nem 'docker-compose')"
fi

log "Validando arquivos de ambiente..."
ensure_file_from_example "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.example"
ensure_file_from_example "$FRONTEND_DIR/.env.local" "$FRONTEND_DIR/.env.example"

log "Subindo infraestrutura backend (postgres, redis, minio)..."
"${COMPOSE_CMD[@]}" up -d postgres redis minio

log "Executando migrations..."
"${COMPOSE_CMD[@]}" run --rm api python manage.py migrate

if (( SEED_DATA == 1 )); then
  log "Executando seed_data --minimal..."
  "${COMPOSE_CMD[@]}" run --rm api python manage.py seed_data --minimal
fi

log "Subindo API e workers..."
"${COMPOSE_CMD[@]}" up -d api celery-worker celery-beat

log "Aguardando API responder em http://localhost:8000/api/docs/ ..."
wait_for_http "http://localhost:8000/api/docs/" 120

if (( SKIP_FRONTEND_INSTALL == 0 )); then
  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    log "Dependencias do frontend nao encontradas; executando npm install..."
    (
      cd "$FRONTEND_DIR"
      npm install
    )
  else
    log "Dependencias do frontend ja existem; pulando npm install"
  fi
else
  warn "Pulando npm install do frontend por opcao do usuario"
fi

log "Inicializando frontend (Next.js dev server)..."
log "Frontend: http://localhost:3000 | API: http://localhost:8000/api/docs/"
log "Para encerrar backend depois: ${COMPOSE_CMD[*]} down"

cd "$FRONTEND_DIR"
npm run dev
