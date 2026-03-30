// =============================================================================
// GestiPro — Configuration PM2 (gestionnaire de processus)
// Usage : pm2 start ecosystem.config.js --env production
// =============================================================================

module.exports = {
  apps: [
    // ── Backend Express.js ──────────────────────────────────────────────────
    {
      name: 'gestipro-backend',
      cwd: './backend',
      script: 'node',
      args: 'dist/index.js',
      instances: 1,           // augmenter si besoin de cluster
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      watch: false,
      max_memory_restart: '500M',
      log_file: '/var/log/gestipro/backend.log',
      error_file: '/var/log/gestipro/backend.error.log',
      out_file: '/var/log/gestipro/backend.out.log',
      time: true,
      restart_delay: 3000,
      max_restarts: 10,
    },

    // ── Frontend Next.js ────────────────────────────────────────────────────
    {
      name: 'gestipro-frontend',
      cwd: './frontend',
      script: 'node',
      args: 'node_modules/.bin/next start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      watch: false,
      max_memory_restart: '800M',
      log_file: '/var/log/gestipro/frontend.log',
      error_file: '/var/log/gestipro/frontend.error.log',
      out_file: '/var/log/gestipro/frontend.out.log',
      time: true,
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
}
