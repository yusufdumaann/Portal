// PM2 Ecosystem Config Example
// Kopyalayın: cp ecosystem.config.example.js ecosystem.config.js
// Düzenleyin ve: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'ops-portal',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/ops-portal',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
