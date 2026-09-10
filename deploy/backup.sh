#!/usr/bin/env bash
# =============================================================================
# backup.sh — Sauvegarde complète de Localizi (à lancer sur le serveur SOURCE)
#
# Produit UNE archive horodatée contenant :
#   - db.dump         : dump PostgreSQL (format custom pg_restore)
#   - uploads.tar.gz  : tous les fichiers uploadés (photos, avatars, docs)
#   - .env.prod       : secrets backend (hors Git)
#   - docker-compose.prod.yml + docker/nginx.prod.conf : config d'infra
#   - MANIFEST.txt    : versions, date, somme de contrôle
#
# Usage :
#   cd <dossier de l'app sur le serveur>      # ex: cd ~/app  ou  cd /srv/localizi
#   bash deploy/backup.sh [dossier_sortie]    # défaut : ./backups
#
# Le fichier final : ./backups/localizi-backup-AAAAMMJJ-HHMMSS.tar.gz
# =============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
OUT_DIR="${1:-$APP_DIR/backups}"
TS="$(date +%Y%m%d-%H%M%S)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

[ -f "$COMPOSE_FILE" ] || { echo "✗ $COMPOSE_FILE introuvable — lancez le script depuis le dossier de l'app." >&2; exit 1; }
[ -f "$ENV_FILE" ]     || { echo "✗ $ENV_FILE introuvable." >&2; exit 1; }

# --- Variables DB (depuis .env.prod, avec les mêmes défauts que le compose) ---
set -a; # shellcheck disable=SC1090
source "$ENV_FILE"; set +a
PGUSER="${POSTGRES_USER:-localizi}"
PGDB="${POSTGRES_DB:-localizi_db}"

echo "=== Sauvegarde Localizi — $TS ==="
mkdir -p "$OUT_DIR"

echo "--- [1/4] Dump PostgreSQL ($PGDB) ---"
docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U "$PGUSER" -d "$PGDB" -Fc --no-owner --no-privileges \
  > "$WORK/db.dump"
echo "    $(du -h "$WORK/db.dump" | cut -f1)"

echo "--- [2/4] Archive des fichiers uploadés (/app/uploads) ---"
# Depuis le conteneur backend : fiable que /app/uploads soit un bind ou un volume.
docker compose -f "$COMPOSE_FILE" exec -T backend \
  tar czf - -C /app/uploads . > "$WORK/uploads.tar.gz"
echo "    $(du -h "$WORK/uploads.tar.gz" | cut -f1)"

echo "--- [3/4] Copie de la configuration ---"
cp "$ENV_FILE"                 "$WORK/.env.prod"
cp "$COMPOSE_FILE"             "$WORK/docker-compose.prod.yml"
mkdir -p "$WORK/docker"
cp docker/nginx.prod.conf      "$WORK/docker/nginx.prod.conf" 2>/dev/null || true

{
  echo "Localizi — backup $TS"
  echo "Source host : $(hostname)"
  echo "Git commit  : $(git rev-parse HEAD 2>/dev/null || echo 'n/a') ($(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?'))"
  echo "Postgres    : user=$PGUSER db=$PGDB"
  echo "Images Docker :"
  docker compose -f "$COMPOSE_FILE" images 2>/dev/null || true
} > "$WORK/MANIFEST.txt"

echo "--- [4/4] Assemblage de l'archive ---"
ARCHIVE="$OUT_DIR/localizi-backup-$TS.tar.gz"
tar czf "$ARCHIVE" -C "$WORK" db.dump uploads.tar.gz .env.prod docker-compose.prod.yml docker/nginx.prod.conf MANIFEST.txt
sha256sum "$ARCHIVE" | tee "$ARCHIVE.sha256"

echo ""
echo "✓ Sauvegarde terminée : $ARCHIVE  ($(du -h "$ARCHIVE" | cut -f1))"
echo "  Transférez-la sur le nouveau serveur, ex. :"
echo "    scp \"$ARCHIVE\"* utilisateur@NOUVELLE_IP:~/"
