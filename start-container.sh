#!/bin/bash
set -e

echo "========================================="
echo " AI Photograph Creator — Railway Deploy"
echo "========================================="

# ── 1. 转换 DATABASE_URL 格式 ─────────────────
# Railway 提供的 PostgreSQL 链接是 postgres:// 格式
# FastAPI 使用 asyncpg 需要 postgresql+asyncpg:// 格式
if [ -n "$DATABASE_URL" ]; then
    if [[ "$DATABASE_URL" == postgres://* ]]; then
        export DATABASE_URL="${DATABASE_URL/postgres:\/\//postgresql+asyncpg://}"
        echo "[DB] Converted DATABASE_URL to asyncpg format"
    elif [[ "$DATABASE_URL" == postgresql://* ]]; then
        export DATABASE_URL="${DATABASE_URL/postgresql:\/\//postgresql+asyncpg://}"
        echo "[DB] Converted DATABASE_URL to asyncpg format"
    fi
fi

# ── 2. 自动添加 Railway 域名到 CORS 白名单 ──────
if [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
    export ALLOWED_ORIGINS="https://${RAILWAY_PUBLIC_DOMAIN},${ALLOWED_ORIGINS}"
    echo "[CORS] Added Railway domain: https://${RAILWAY_PUBLIC_DOMAIN}"
fi

# ── 3. 适配 Railway PORT 环境变量 ───────────────
# Railway 会注入 PORT 变量（默认 8080），nginx 监听此端口
if [ -n "${PORT}" ]; then
    sed -i "s/listen 80;/listen ${PORT};/g" /etc/nginx/conf.d/default.conf
    echo "[Nginx] Listening on port ${PORT}"
fi

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
