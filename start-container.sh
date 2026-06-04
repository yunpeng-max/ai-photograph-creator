#!/bin/bash

echo "========================================="
echo " AI Photograph Creator — Starting..."
echo "========================================="

# ── 1. 转换 DATABASE_URL 格式 ─────────────────
if [ -n "$DATABASE_URL" ]; then
    echo "[DB] Original DATABASE_URL: ${DATABASE_URL:0:30}..."
    if [[ "$DATABASE_URL" == postgres://* ]]; then
        export DATABASE_URL="${DATABASE_URL/postgres:\/\//postgresql+asyncpg://}"
    elif [[ "$DATABASE_URL" == postgresql://* ]]; then
        export DATABASE_URL="${DATABASE_URL/postgresql:\/\//postgresql+asyncpg://}"
    fi
    echo "[DB] Converted: ${DATABASE_URL:0:40}..."
else
    echo "[DB] WARNING: DATABASE_URL not set!"
fi

# ── 2. 自动添加 Railway 域名到 CORS 白名单 ──────
if [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
    export ALLOWED_ORIGINS="https://${RAILWAY_PUBLIC_DOMAIN},${ALLOWED_ORIGINS}"
    echo "[CORS] Added: https://${RAILWAY_PUBLIC_DOMAIN}"
fi

# ── 3. 生成 nginx 配置 ────────────────────────
NGINX_PORT="${PORT:-80}"
echo "[Nginx] Using port: ${NGINX_PORT}"

# 直接用 sed 替换（比 envsubst 更可靠）
cp /etc/nginx/nginx.conf.template /etc/nginx/conf.d/default.conf
sed -i "s/\${NGINX_PORT}/${NGINX_PORT}/g" /etc/nginx/conf.d/default.conf

echo "[Nginx] First lines of config:"
head -3 /etc/nginx/conf.d/default.conf

# ── 4. 启动后端 ──────────────────────────────
echo "[Backend] Starting uvicorn on 127.0.0.1:8000 ..."
cd /app
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
echo "[Backend] PID: $BACKEND_PID"

# 等后端启动
sleep 3

# 健康检查
HEALTH_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health 2>&1 || echo "curl_failed")
echo "[Backend] Health check HTTP status: ${HEALTH_RESULT}"
if [ "${HEALTH_RESULT}" = "200" ]; then
    echo "[Backend] Health check passed!"
else
    echo "[Backend] WARNING: Health check got ${HEALTH_RESULT}"
fi

# 检查前端文件
echo "[Frontend] Checking static files..."
ls -la /usr/share/nginx/html/ | head -5

# ── 5. 启动 nginx ────────────────────────────
echo "[Frontend] Starting nginx on port ${NGINX_PORT}..."
echo "========================================="
echo " Application started!"
echo "========================================="
exec nginx -g "daemon off;"
