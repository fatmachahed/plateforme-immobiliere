#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Déploiement Localizi sur OVH
# Usage : ./deploy/deploy.sh [env]
#   env = dev | preprod | prod   (défaut : prod)
# =============================================================================
set -euo pipefail

ENV="${1:-prod}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

case "$ENV" in
  dev)
    COMPOSE_FILE="docker-compose.yml"
    ENV_FILE=".env.dev"
    ;;
  preprod)
    COMPOSE_FILE="docker-compose.preprod.yml"
    ENV_FILE=".env.preprod"
    ;;
  prod)
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.prod"
    ;;
  *)
    echo "Usage: $0 [dev|preprod|prod]" >&2
    exit 1
    ;;
esac

cd "$APP_DIR"

echo "=== Déploiement [$ENV] — $(date '+%Y-%m-%d %H:%M:%S') ==="

echo "--- [1/4] Pull dernière version ---"
git pull --ff-only

echo "--- [2/4] Build et démarrage des conteneurs ---"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up --build -d

echo "--- [3/4] Attente démarrage backend (health check) ---"
RETRIES=20
until curl -sf http://localhost:8000/health &>/dev/null || [ $RETRIES -eq 0 ]; do
  sleep 3
  RETRIES=$((RETRIES - 1))
done
if [ $RETRIES -eq 0 ]; then
  echo "⚠ Backend ne répond pas après 60s — vérifier les logs :"
  docker compose -f "$COMPOSE_FILE" logs --tail=30 backend
  exit 1
fi

echo "--- [4/4] Nettoyage images obsolètes ---"
docker image prune -f

echo ""
echo "✓ Déploiement [$ENV] terminé."
