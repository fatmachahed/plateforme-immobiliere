#!/usr/bin/env bash
# =============================================================================
# setup-ovh.sh — Préparation initiale du serveur OVH (Ubuntu 22.04)
# À exécuter UNE SEULE FOIS sur le serveur en root ou avec sudo.
# =============================================================================
set -euo pipefail

DOMAIN="${1:-}"   # ex: ./setup-ovh.sh votre-domaine.tn
APP_DIR="/srv/localizi"

echo "=== [1/6] Mise à jour du système ==="
apt-get update -y && apt-get upgrade -y

echo "=== [2/6] Installation de Docker ==="
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
# Plugin Compose V2
if ! docker compose version &>/dev/null; then
  apt-get install -y docker-compose-plugin
fi

echo "=== [3/6] Pare-feu UFW ==="
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

echo "=== [4/6] Création des répertoires ==="
mkdir -p "$APP_DIR/uploads"
mkdir -p /var/www/certbot

echo "=== [5/6] Installation de Certbot (Let's Encrypt) ==="
apt-get install -y certbot

if [ -n "$DOMAIN" ]; then
  echo "=== [5b] Obtention du certificat SSL pour $DOMAIN ==="
  # Méthode standalone (serveur éteint à ce stade)
  certbot certonly --standalone \
    --non-interactive --agree-tos \
    --email "admin@${DOMAIN}" \
    -d "$DOMAIN" -d "www.${DOMAIN}"

  # Renouvellement automatique
  systemctl enable --now snap.certbot.renew.timer 2>/dev/null || \
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker compose -f $APP_DIR/docker-compose.prod.yml restart proxy'") | crontab -
fi

echo "=== [6/6] Clonage du projet ==="
echo ""
echo "Exécutez manuellement :"
echo "  git clone https://github.com/VOTRE_REPO/localizi.git $APP_DIR"
echo "  cd $APP_DIR"
echo "  cp .env.prod.example .env.prod   # puis remplir les valeurs"
echo "  docker compose -f docker-compose.prod.yml up --build -d"
echo ""
echo "✓ Serveur prêt."
