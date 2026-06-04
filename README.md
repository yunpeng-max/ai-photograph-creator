# AI Photograph Creator

一个结构化的 AI 图片生成网站，让用户通过表单选择图片类型、比例、风格、场景和留白要求，然后输入主体描述，系统自动组装成专业的 GPT Image 提示词并生成图片。

## 功能特性

- ✅ 结构化表单生成：图片类型、比例、风格、场景、留白
- ✅ 专业提示词组装：自动将表单选项转换为高质量的英文提示词
- ✅ OpenAI gpt-image-1 集成
- ✅ 用户系统：注册/登录/JWT 认证
- ✅ 积分系统：新用户注册送 5 积分，每次生成消耗 1 积分
- ✅ 生成历史：查看所有生成记录
- ✅ 中英双语：支持中文和英文界面切换

## 技术栈

**前端**:
- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- react-router-dom
- i18next (国际化)

**后端**:
- Python 3.13
- FastAPI
- SQLAlchemy (async)
- PostgreSQL
- Alembic (数据库迁移)
- python-jose (JWT)
- passlib + bcrypt (密码哈希)
- OpenAI SDK

## 快速开始

### 前置要求

- Node.js 18+
- Python 3.13+
- PostgreSQL 16+ (或使用 Docker)
- OpenAI API Key (需要 gpt-image-1 访问权限)

### 本地开发

#### 1. 启动数据库

```bash
# 使用 Homebrew (macOS)
brew install postgresql@16
brew services start postgresql@16

# 创建数据库和用户
createdb ai_photo
psql -d ai_photo -c "CREATE USER ai_photo WITH PASSWORD 'ai_photo' CREATEDB;"
psql -d ai_photo -c "GRANT ALL ON SCHEMA public TO ai_photo;"
```

#### 2. 后端设置

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 复制环境变量并配置
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY

# 运行数据库迁移
alembic upgrade head

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端将在 http://localhost:8000 运行

#### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:5173 运行

### Docker 部署

```bash
# 复制环境变量
cp .env.example .env
# 编辑 .env，填入 SECRET_KEY 和 OPENAI_API_KEY

# 启动所有服务
docker-compose up -d

# 运行数据库迁移
docker-compose exec backend alembic upgrade head
```

访问 http://localhost 即可使用应用。

## API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /api/v1/auth/register | 否 | 用户注册 |
| POST | /api/v1/auth/login | 否 | 用户登录 |
| GET | /api/v1/auth/me | 是 | 获取当前用户 |
| POST | /api/v1/generate | 是 | 生成图片 |
| GET | /api/v1/generations | 是 | 获取生成历史 |
| GET | /api/v1/points | 是 | 获取积分信息 |
| GET | /api/v1/options | 否 | 获取表单选项 |

## 项目结构

```
AI_Photograph_Creatoer/
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── context/          # React Context (Auth, Locale)
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── i18n/             # 国际化文件
│   │   ├── lib/              # 工具函数和 API 客户端
│   │   ├── pages/            # 页面组件
│   │   └── App.tsx           # 应用入口
│   └── package.json
├── backend/                  # FastAPI 后端
│   ├── app/
│   │   ├── models/           # SQLAlchemy 模型
│   │   ├── routers/          # API 路由
│   │   ├── schemas/          # Pydantic  schemas
│   │   ├── services/         # 业务逻辑
│   │   ├── main.py           # FastAPI 应用
│   │   └── config.py         # 配置
│   └── requirements.txt
├── docker-compose.yml        # Docker 编排
└── .env.example              # 环境变量示例
```

## 积分系统

- 新用户注册自动获得 5 积分
- 每次图片生成消耗 1 积分
- 积分不足时会弹出升级提示（第一版为占位 UI）
- 生成失败时自动退还积分

## License

MIT
