#!/usr/bin/env bash
# =============================================================================
# GestiPro — Script de configuration initiale du serveur Hostinger VPS
# À exécuter UNE SEULE FOIS en root via SSH :
#   ssh root@<IP_VPS>
#   bash <(curl -fsSL https://raw.githubusercontent.com/momssn-commits/GestiPro/main/deploy/setup-server.sh)
# =============================================================================
set -e

DOMAIN="gestipro.ifs.sn"          # ← Remplacer par votre domaine
APP_USER="gestipro"
APP_DIR="/var/www/gestipro"
DB_NAME="gestipro"
DB_USER="gestipro_user"
DB_PASS="gestipro_pass_change_me"  # ← Changer en production !

echo "════════════════════════════════════════════"
echo "  GestiPro — Setup serveur VPS Hostinger"
echo "════════════════════════════════════════════"

# ── 1. Mise à jour système ────────────────────────────────────────────────────
echo "[1/9] Mise à jour des paquets…"
apt-get update -q && apt-get upgrade -y -q

# ── 2. Dépendances système ────────────────────────────────────────────────────
echo "[2/9] Installation des dépendances…"
apt-get install -y -q \
  git curl wget gnupg2 ca-certificates lsb-release \
  nginx certbot python3-certbot-nginx \
  postgresql postgresql-contrib \
  ufw fail2ban

# ── 3. Node.js 20 LTS via nvm ────────────────────────────────────────────────
echo "[3/9] Installation de Node.js 20 LTS…"
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

# ── 4. PM2 (gestionnaire de processus) ───────────────────────────────────────
echo "[4/9] Installation de PM2…"
npm install -g pm2

# ── 5. PostgreSQL — créer la base et l'utilisateur ──────────────────────────
echo "[5/9] Configuration PostgreSQL…"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "  DB déjà existante"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" 2>/dev/null || echo "  User déjà existant"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;" 2>/dev/null
# Extension UUID
sudo -u postgres psql -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null

# ── 6. Utilisateur applicatif ────────────────────────────────────────────────
echo "[6/9] Création de l'utilisateur $APP_USER…"
id "$APP_USER" &>/dev/null || useradd -m -s /bin/bash "$APP_USER"
mkdir -p "$APP_DIR"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

# ── 7. Clone du dépôt ────────────────────────────────────────────────────────
echo "[7/9] Clone du dépôt GitHub…"
sudo -u "$APP_USER" git clone https://github.com/momssn-commits/GestiPro.git "$APP_DIR" 2>/dev/null \
  || (cd "$APP_DIR" && sudo -u "$APP_USER" git pull origin main)

# ── 8. Firewall UFW ──────────────────────────────────────────────────────────
echo "[8/9] Configuration du firewall…"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── 9. Nginx — configuration initiale ───────────────────────────────────────
echo "[9/9] Configuration Nginx…"
cp "$APP_DIR/deploy/nginx/gestipro.conf" /etc/nginx/sites-available/gestipro
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/gestipro
ln -sf /etc/nginx/sites-available/gestipro /etc/nginx/sites-enabled/gestipro
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "════════════════════════════════════════════"
echo "  ✅ Serveur configuré"
echo ""
echo "  Prochaines étapes :"
echo "  1. Configurer les .env de production"
echo "  2. Lancer le déploiement : bash $APP_DIR/deploy/deploy.sh"
echo "  3. Activer SSL : certbot --nginx -d $DOMAIN"
echo "════════════════════════════════════════════"
