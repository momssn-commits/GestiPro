#!/usr/bin/env bash
# =============================================================================
# GestiPro — Script de déploiement (à exécuter sur le VPS)
# Usage : bash /var/www/gestipro/deploy/deploy.sh
# =============================================================================
set -e

APP_DIR="/var/www/gestipro"
LOG_DIR="/var/log/gestipro"
BACKEND_ENV="$APP_DIR/backend/.env"
FRONTEND_ENV="$APP_DIR/frontend/.env.local"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()   { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"; }
warn()  { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"; exit 1; }

echo ""
echo "════════════════════════════════════════════"
echo "  🚀  GestiPro — Déploiement"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════"

# ── Vérifications préalables ──────────────────────────────────────────────────
[ -d "$APP_DIR" ] || error "Répertoire $APP_DIR introuvable. Lancez d'abord setup-server.sh"
[ -f "$BACKEND_ENV" ] || error "Fichier backend/.env introuvable. Copiez backend/.env.production.example vers backend/.env"
[ -f "$FRONTEND_ENV" ] || error "Fichier frontend/.env.local introuvable. Copiez frontend/.env.production.example vers frontend/.env.local"
command -v node   >/dev/null 2>&1 || error "Node.js non installé"
command -v pm2    >/dev/null 2>&1 || error "PM2 non installé (npm install -g pm2)"
command -v nginx  >/dev/null 2>&1 || warn "Nginx non installé"

mkdir -p "$LOG_DIR"
cd "$APP_DIR"

# ── 1. Récupérer les dernières modifications ──────────────────────────────────
log "Récupération des modifications depuis GitHub…"
git fetch origin
git reset --hard origin/main
log "Code mis à jour"

# ── 2. Dépendances backend ────────────────────────────────────────────────────
log "Installation des dépendances backend…"
cd "$APP_DIR/backend"
npm ci --omit=dev 2>&1 | tail -3

# ── 3. Compilation TypeScript backend ────────────────────────────────────────
log "Compilation TypeScript backend…"
npm run build 2>&1 | tail -5
[ -f "dist/index.js" ] || error "dist/index.js introuvable après compilation"
log "Backend compilé → dist/index.js"

# ── 4. Migration base de données ──────────────────────────────────────────────
log "Application de la migration SQL…"
node -e "
const { Client } = require('pg')
require('dotenv').config()
const client = new Client({ connectionString: process.env.DATABASE_URL })
const fs = require('fs')
const sql = fs.readFileSync('src/database/init.sql', 'utf-8')
client.connect()
  .then(() => client.query(sql))
  .then(() => { console.log('Migration OK'); client.end() })
  .catch(e => { console.error('Migration error:', e.message); client.end(); process.exit(1) })
"
log "Base de données migrée"

# ── 5. Dépendances frontend ───────────────────────────────────────────────────
log "Installation des dépendances frontend…"
cd "$APP_DIR/frontend"
npm ci 2>&1 | tail -3

# ── 6. Build Next.js ──────────────────────────────────────────────────────────
log "Build Next.js (peut prendre 1-2 minutes)…"
npm run build 2>&1 | tail -10
[ -d ".next" ] || error "Build Next.js échoué"
log "Frontend compilé → .next/"

# ── 7. (Re)démarrer les processus PM2 ────────────────────────────────────────
cd "$APP_DIR"
log "Redémarrage des services PM2…"

if pm2 list | grep -q "gestipro-backend"; then
  pm2 reload gestipro-backend --update-env
else
  pm2 start ecosystem.config.js --env production --only gestipro-backend
fi

if pm2 list | grep -q "gestipro-frontend"; then
  pm2 reload gestipro-frontend --update-env
else
  pm2 start ecosystem.config.js --env production --only gestipro-frontend
fi

pm2 save
log "Services PM2 démarrés et sauvegardés"

# ── 8. Rechargement Nginx ─────────────────────────────────────────────────────
if command -v nginx &>/dev/null; then
  nginx -t 2>&1 && systemctl reload nginx
  log "Nginx rechargé"
fi

# ── Statut final ──────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════"
echo "  ✅ Déploiement terminé !"
echo "════════════════════════════════════════════"
pm2 list
echo ""
echo "  Commandes utiles :"
echo "  pm2 logs gestipro-backend    # logs backend"
echo "  pm2 logs gestipro-frontend   # logs frontend"
echo "  pm2 monit                    # monitoring"
echo ""
