module.exports = {
  apps: [{
    name: 'pet-garden',
    script: './index.js',
    cwd: '/www/wwwroot/pet-app/server',
    env: { NODE_ENV: 'production', PORT: 3002 },
    autorestart: true,
    max_restarts: 10,
    min_uptime: 5000,
    restart_delay: 1000
  }]
}
