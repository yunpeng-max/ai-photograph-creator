#!/bin/bash
set -e

echo "========================================="
echo " AI Photograph Creator — Railway Deploy"
echo "========================================="

# ── 1. 转换 DATABASE_URL 格式 ─────────────────
if [ -n "$DATABASE_URL" ]; then
    if [[ "$DATABASE_URL" == postgres://* ]]; then
        export DATABASE_URL="${DATABASE_URL/postgres:\/\//postgresql+asyncpg://}"
        echo "[DB] Converted DATABASE_URL to asyncpg format"
    elif [[ "$DATABASE_URL" == postgresql://* ]]; then
        export DATABASE_URL="${DATABASE_URL/postgresql:\/\//postgresql+asyncpg://}"
        echo "[DB] Converted DATABASE_URL to asyncpg format"
    fi
    echo "[DB] DATABASE_URL is configured"
else
    echo "[DB] WARNING: DATABASE_URL not set!"
fi

# ── 2. 自动添加 Railway 域名到 CORS 白名单 ──────
if [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
    export ALLOWED_ORIGINS="https://${RAILWAY_PUBLIC_DOMAIN},${ALLOWED_ORIGINS}"
    echo "[CORS] Added Railway domain: https://${RAILWAY_PUBLIC_DOMAIN}"
fi

# ── 3. 生成 nginx 配置（替换端口）──────────────
NGINX_PORT="${PORT:-80}"
echo "[Nginx] Using port: ${NGINX_PORT}"
envsubst '${NGINX_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

# 验证 config 是否生成正确
echo "[Nginx] Generated config:"
head -5 /etc/nginx/conf.d/default.conf

# ── 4. 启动后端 (后台运行) ─────────────────────
echo "[Backend] Starting uvicorn on 127.0.0.1:8000 ..."
cd /app
uvicorn app.main:app --host 127.0.0.1 --port 8000 &

# ── 5. 启动 nginx (前台运行，保持容器存活) ──────
echo "[Frontend] Starting nginx..."
echo "========================================="
echo " Application is ready!"
echo "========================================="
exec nginx -g "daemon off;"
