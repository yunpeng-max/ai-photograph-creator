# ============================================
# AI Photograph Creator — Production Dockerfile
# 用于 Railway / 云服务器 单容器部署
# ============================================

# ── Stage 1: 构建前端 ──────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: 最终镜像 ──────────────────────
FROM python:3.13-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    nginx \
    gettext-base \
    curl \
    && rm -f /etc/nginx/sites-enabled/default \
    && rm -rf /var/www/html \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY backend/ .

# 复制前端构建产物
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置（使用模板以支持 Railway 的 PORT 变量）
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# 复制启动脚本
COPY start-container.sh /start-container.sh
RUN chmod +x /start-container.sh

# 创建上传目录
RUN mkdir -p /app/uploads

EXPOSE 80

CMD ["/start-container.sh"]
