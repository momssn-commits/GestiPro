#!/usr/bin/env bash
# =============================================================================
# GestiPro — Installation complète sur VPS Hostinger
# Usage : curl -fsSL https://raw.githubusercontent.com/momssn-commits/GestiPro/main/deploy/install-vps.sh | bash
# =============================================================================
set -e

VPS_IP="187.124.49.162"
APP_DIR="/var/www/gestipro"
DB_NAME="gestipro"
DB_USER="gestipro_user"
DB_PASS="GestiPro2026!"
JWT_SECRET="46eaf32bcc1b8f96c86541cd8e9a088170168e919c015d805b170ba48e5845e4ae08a00ed92b712abf82291d89d14832010ed0bb7abfdacecc7e5febb804f7d9"
ONLYOFFICE_JWT="sk-68a1df10a191d08572b6fcbd440ef4ee869f1f13bb24a4230ac3939ade7beb7a"

G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; B='\033[1;34m'; NC='\033[0m'
ok()  { echo -e "${G}✅ $1${NC}"; }
inf() { echo -e "${B}➤  $1${NC}"; }
err() { echo -e "${R}❌ $1${NC}"; exit 1; }

echo -e "${B}"
echo "╔══════════════════════════════════════════╗"
echo "║   GestiPro — Installation VPS Hostinger  ║"
echo "║   IP : $VPS_IP                  ║"
echo "╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Système ────────────────────────────────────────────────────────────────
inf "1/10 Mise à jour du système…"
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq git curl wget gnupg2 ufw nginx postgresql postgresql-contrib
ok "Système mis à jour"

# ── 2. Node.js 20 ─────────────────────────────────────────────────────────────
inf "2/10 Installation Node.js 20 LTS…"
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs
fi
ok "Node.js $(node -v) | npm $(npm -v)"

# ── 3. PM2 ────────────────────────────────────────────────────────────────────
inf "3/10 Installation PM2…"
npm install -g pm2 > /dev/null 2>&1
ok "PM2 $(pm2 -v)"

# ── 4. PostgreSQL ─────────────────────────────────────────────────────────────
inf "4/10 Configuration PostgreSQL…"
systemctl start postgresql
systemctl enable postgresql
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -d $DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' 2>/dev/null || true
ok "PostgreSQL configuré (DB: $DB_NAME, User: $DB_USER)"

# ── 5. Clone du dépôt ─────────────────────────────────────────────────────────
inf "5/10 Clone du dépôt GestiPro…"
mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone https://github.com/momssn-commits/GestiPro.git "$APP_DIR"
fi
ok "Code cloné dans $APP_DIR"

# ── 6. Fichiers .env ──────────────────────────────────────────────────────────
inf "6/10 Création des fichiers .env…"

cat > "$APP_DIR/backend/.env" << EOF
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=unused
S3_SECRET_KEY=unused
S3_BUCKET=gestipro-files
S3_REGION=us-east-1
VPS_IP=$VPS_IP
FRONTEND_URL=http://$VPS_IP
APP_PUBLIC_URL=http://$VPS_IP
ONLYOFFICE_DOC_SERVER=https://api.onlyoffice.com/
ONLYOFFICE_JWT_SECRET=$ONLYOFFICE_JWT
EOF

cat > "$APP_DIR/frontend/.env.local" << EOF
NEXT_PUBLIC_API_URL=http://$VPS_IP/api
EOF

ok "Fichiers .env créés"

# ── 7. Dépendances et build backend ──────────────────────────────────────────
inf "7/10 Build backend…"
cd "$APP_DIR/backend"
npm ci --omit=dev 2>&1 | tail -3
npm run build 2>&1 | tail -5
[ -f "dist/index.js" ] || err "Build backend échoué"
ok "Backend compilé"

# ── 8. Migration base de données ─────────────────────────────────────────────
inf "8/10 Migration base de données…"
cd "$APP_DIR/backend"
node -e "
const { Client } = require('pg')
const fs = require('fs')
const client = new Client({ connectionString: 'postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME' })
const sql = fs.readFileSync('src/database/init.sql', 'utf-8')
client.connect().then(() => client.query(sql)).then(() => { console.log('OK'); client.end() }).catch(e => { console.error(e.message); client.end(); process.exit(1) })
"
ok "Base de données initialisée"

# ── 9. Dépendances et build frontend ─────────────────────────────────────────
inf "9/10 Build frontend (2-3 minutes)…"
cd "$APP_DIR/frontend"
npm ci 2>&1 | tail -3
npm run build 2>&1 | tail -10
[ -d ".next" ] || err "Build frontend échoué"
ok "Frontend compilé"

# ── 10. Nginx + PM2 ──────────────────────────────────────────────────────────
inf "10/10 Configuration Nginx + PM2…"

# Nginx
cp "$APP_DIR/deploy/nginx/gestipro-ip.conf" /etc/nginx/sites-available/gestipro
ln -sf /etc/nginx/sites-available/gestipro /etc/nginx/sites-enabled/gestipro
rm -f /etc/nginx/sites-enabled/default
mkdir -p /var/log/gestipro
nginx -t && systemctl reload nginx
ok "Nginx configuré"

# PM2
cd "$APP_DIR"
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup | grep "sudo" | bash 2>/dev/null || true
ok "PM2 démarré"

# Firewall
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
ok "Firewall configuré"

echo ""
echo -e "${G}╔══════════════════════════════════════════════╗"
echo "║         ✅ Installation terminée !           ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  🌐 Application : http://$VPS_IP      ║"
echo "║  🔧 API health  : http://$VPS_IP/health ║"
echo "║  📊 PM2 status  : pm2 list              ║"
echo "║  📋 Logs back   : pm2 logs gestipro-backend ║"
echo "╚══════════════════════════════════════════════╝${NC}"
