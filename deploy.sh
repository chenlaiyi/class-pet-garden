#!/bin/bash
set -e

SERVER="root@100.81.93.74"
SRC_DIR="/Users/chanlaiyi/Pet"
DEST_FRONT="/www/wwwroot/pet.tapgo.cn"
DEST_BACK="/www/wwwroot/pet-app/server"
SRC_ROUTES="$SRC_DIR/server/routes"
APP_NAME="pet-garden"

echo "=== Pet 平台部署 ==="

# Step 1: 本地构建
echo "[1/5] 本地构建..."
cd $SRC_DIR && npm run build

# Step 2: PM2 停止服务
echo "[2/5] 停止后端..."
ssh -o ConnectTimeout=10 $SERVER "pm2 stop $APP_NAME 2>/dev/null || true"

# Step 3: 同步文件
echo "[3/5] 同步后端 ecosystem + routes..."
rsync -av $SRC_DIR/server/ecosystem.config.cjs $SERVER:$DEST_BACK/
rsync -av $SRC_ROUTES/ $SERVER:$DEST_BACK/routes/

echo "[4/5] 同步前端..."
rsync -av --delete $SRC_DIR/dist/ $SERVER:$DEST_FRONT/

# 修复权限（nginx 以 www 用户运行）
echo "    修复文件权限..."
ssh $SERVER "chown -R www:www $DEST_FRONT/ && chmod -R 755 $DEST_FRONT/"

# Step 4: PM2 启动
echo "[5/5] 启动后端..."
ssh -o ConnectTimeout=15 $SERVER "
  cd $DEST_BACK
  pm2 start ecosystem.config.cjs
  sleep 3
  curl -s http://127.0.0.1:3002/api/health
"

echo ""
echo "=== 部署完成 ✅ ==="
