# 智能编程教学平台

基于 Node.js + Vue 3 的智能编程教学平台，提供在线课程学习、编程练习、AI辅助编程等功能。

## 技术栈

### 前端
- Vue 3 + TypeScript
- Element Plus UI 组件库
- Pinia 状态管理
- Vue Router 路由管理
- Axios HTTP 客户端
- Vite 构建工具

### 后端
- Node.js + Express
- TypeScript
- MySQL 数据库
- Redis 缓存
- JWT 认证
- DeepSeek AI API

## 项目结构

```
smart-coding-platform/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── api/           # API 接口
│   │   ├── components/    # 公共组件
│   │   ├── layouts/       # 布局组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # 状态管理
│   │   ├── styles/        # 样式文件
│   │   ├── types/         # 类型定义
│   │   └── views/         # 页面组件
│   └── package.json
├── server/                 # 后端项目
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── controllers/   # 控制器
│   │   ├── middleware/    # 中间件
│   │   ├── routes/        # 路由
│   │   ├── services/      # 服务
│   │   └── types/         # 类型定义
│   ├── database/          # 数据库脚本
│   └── package.json
└── docker-compose.yml     # Docker 编排配置
```

## 快速开始

### 环境要求
- Node.js >= 18.0
- MySQL >= 8.0
- Redis >= 6.0
- npm 或 yarn

### 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 配置环境变量

复制 `server/.env.example` 为 `server/.env` 并修改配置：

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_coding_platform

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 初始化数据库

```bash
mysql -u root -p < server/database/init.sql
```

### 启动开发服务器

```bash
# 启动后端服务
cd server
npm run dev

# 启动前端服务（新终端）
cd client
npm run dev
```

访问 http://localhost:5173 查看应用。

### Docker 部署

```bash
docker-compose up -d
```

## 功能模块

### 用户系统
- 用户注册/登录
- JWT 认证
- 个人资料管理
- 学习进度跟踪

### 课程中心
- 课程列表/详情
- 课程报名
- 章节课时管理
- 学习进度记录

### 在线练习
- 题目列表/详情
- 代码编辑器
- 代码执行/提交
- 提交记录查看

### AI 辅助
- 代码解释
- 调试帮助
- 优化建议
- 解题提示

### 学习社区
- 帖子发布/浏览
- 评论互动
- 点赞功能

## API 文档

### 认证接口
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- POST /api/auth/logout - 用户登出

### 课程接口
- GET /api/courses - 获取课程列表
- GET /api/courses/:id - 获取课程详情
- POST /api/courses/:id/enroll - 报名课程

### 题目接口
- GET /api/problems - 获取题目列表
- GET /api/problems/:id - 获取题目详情
- POST /api/submissions - 提交代码

### 社区接口
- GET /api/community/posts - 获取帖子列表
- POST /api/community/posts - 发布帖子
- POST /api/community/posts/:id/like - 点赞帖子

## 许可证

MIT License
