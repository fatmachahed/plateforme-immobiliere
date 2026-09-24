#!/usr/bin/env bash
# =============================================================================
# restore.sh — Restauration de Localizi (à lancer sur le serveur CIBLE / Hostinger)
#
# Pré-requis sur le nouveau serveur :
#   1. Docker + plugin compose installés   (voir MIGRATION-HOSTINGER.md étape 2)
#   2. Le dépôt cloné :  git clone <repo> ~/app  &&  cd ~/app
#   3. L'archive de sauvegarde transférée (localizi-backup-*.tar.gz)
#
# Usage :
#   cd ~/app
#   bash deploy/restore.sh ~/localizi-backup-AAAAMMJJ-HHMMSS.tar.gz
# =============================================================================
set -euo pipefail

ARCHIVE="${1:-}"
[ -n "$ARCHIVE" ] && [ -f "$ARCHIVE" ] || { echo "Usage: bash deploy/restore.sh <archive.tar.gz>" >&2; exit 1; }

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"
COMPOSE_FILE="docker-compose.prod.yml"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "=== Restauration Localizi depuis $(basename "$ARCHIVE") ==="

# --- Vérif somme de contrôle si présente ---
if [ -f "$ARCHIVE.sha256" ]; then
  echo "--- Vérification d'intégrité ---"
  ( cd "$(dirname "$ARCHIVE")" && sha256sum -c "$(basename "$ARCHIVE").sha256" )
fi

echo "--- [1/6] Extraction ---"
tar xzf "$ARCHIVE" -C "$WORK"
[ -f "$WORK/db.dump" ] && [ -f "$WORK/uploads.tar.gz" ] || { echo "✗ Archive incomplète." >&2; exit 1; }

echo "--- [2/6] Mise en place de .env.prod ---"
if [ -f "$APP_DIR/.env.prod" ]; then
  echo "    .env.prod existe déjà — conservé. (sauvegarde de l'archive : $WORK/.env.prod)"
else
  cp "$WORK/.env.prod" "$APP_DIR/.env.prod"
  echo "    .env.prod restauré depuis l'archive."
fi
set -a; # shellcheck disable=SC1090
source "$APP_DIR/.env.prod"; set +a
PGUSER="${POSTGRES_USER:-localizi}"
PGDB="${POSTGRES_DB:-localizi_db}"

echo "--- [3/6] Démarrage de PostgreSQL seul ---"
docker compose -f "$COMPOSE_FILE" up -d db
echo -n "    Attente disponibilité DB "
for i in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U "$PGUSER" &>/dev/null; then echo " ok"; break; fi
  echo -n "."; sleep 2
  [ "$i" = 30 ] && { echo " ✗ timeout"; exit 1; }
done

echo "--- [4/6] Restauration de la base ($PGDB) ---"
# --clean --if-exists : remplace les objets existants sans erreur sur une base neuve
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_restore -U "$PGUSER" -d "$PGDB" --clean --if-exists --no-owner --no-privileges \
  < "$WORK/db.dump"
echo "    Base restaurée."

echo "--- [5/6] Restauration des fichiers uploadés ---"
UP_DIR="/srv/localizi/uploads"   # doit correspondre au bind mount de docker-compose.prod.yml
sudo mkdir -p "$UP_DIR"
sudo tar xzf "$WORK/uploads.tar.gz" -C "$UP_DIR"
sudo chown -R 1000:1000 "$UP_DIR" 2>/dev/null || true
echo "    $(sudo du -sh "$UP_DIR" | cut -f1) dans $UP_DIR"

echo "--- [6/6] Build + démarrage de toute la stack ---"
docker compose -f "$COMPOSE_FILE" up -d --build

echo -n "    Health check backend "
for i in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=3)" &>/dev/null; then echo " ok"; break; fi
  echo -n "."; sleep 3
  [ "$i" = 30 ] && { echo " ✗ backend KO — voir : docker compose -f $COMPOSE_FILE logs --tail=40 backend"; exit 1; }
done

echo ""
echo "✓ Restauration terminée. Testez en local sur le serveur :"
echo "    curl -I http://localhost/           # frontend"
echo "    curl -s http://localhost/api/health # backend via proxy"
echo "  Puis basculez le DNS Cloudflare (voir MIGRATION-HOSTINGER.md étape 5)."
