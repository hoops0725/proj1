# 任务管理应用

一款支持多终端实时同步的离线优先任务管理应用，采用 CRDT-lite 冲突解决策略。

## 技术栈

- **前端框架**：React 18 + TypeScript
- **状态管理**：Zustand + TanStack Query v5
- **本地数据库**：Dexie.js (IndexedDB 封装)
- **后端即服务**：Supabase
- **UI 组件**：Tailwind CSS + Radix UI
- **打包工具**：Vite

## 环境搭建

### 1. 克隆项目

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 Supabase

1. 访问 [Supabase 官网](https://supabase.com/) 并创建一个新项目
2. 在项目设置中获取 `Project URL` 和 `Anon Key`
3. 创建 `.env` 文件并添加以下内容：

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. 启动开发服务器

```bash
npm run dev
```

## 项目结构

```
src/
├── components/          # 通用组件
│   └── AuthGuard.tsx    # 路由守卫
├── lib/
│   └── supabase.ts      # Supabase 客户端配置
├── pages/
│   ├── Auth/            # 认证相关页面
│   │   ├── Login.tsx    # 登录页面
│   │   └── Register.tsx # 注册页面
│   └── App/             # 应用主页面
│       └── Main.tsx     # 主应用页面
├── store/
│   └── authStore.ts     # 认证状态管理
├── App.tsx              # 应用根组件
├── main.tsx             # 应用入口
└── index.css            # 全局样式
```

## 核心功能

- **身份认证**：邮箱注册/登录、密码重置
- **离线引擎**：IndexedDB 本地数据库、操作队列化
- **实时协作**：WebSocket 实时订阅、增量更新广播
- **冲突解决**：基于 LWW + Vector Clock 的自动合并
- **数据安全**：RLS 行级安全、输入 XSS 过滤
- **灾难恢复**：数据导出、软删除恢复、版本快照

## 开发计划

### Week 1：基础架构与离线核心
- Day 1：环境搭建 + Supabase 配置
- Day 2：本地数据库层
- Day 3：认证系统
- Day 4：任务 CRUD + 离线队列
- Day 5：基础同步引擎
- Day 6-7：周末测试与修复

### Week 2：实时同步与打磨
- Day 8：Supabase Realtime 集成
- Day 9：冲突检测与解决 UI
- Day 10：垃圾箱与软删除
- Day 11：数据导出与导入
- Day 12：PWA 与优化
- Day 13：E2E 测试
- Day 14：文档与部署
