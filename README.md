# 盛世烟花选购平台 (Fireworks Shop)

这是一个使用纯前端技术 (HTML/CSS/JS) 并结合 Supabase 后端的烟花选购网站。

## 🚀 快速开始

### 1. 准备 Supabase 数据库
1. 访问 [Supabase](https://supabase.com) 并创建一个新项目。
2. 进入项目的 **SQL Editor**。
3. 复制 `schema.sql` 文件中的所有内容并执行，以创建数据表、RPC 函数和示例数据。

### 2. 本地开发
1. 安装依赖:
   ```bash
   npm install
   ```
2. 创建环境变量文件:
   复制 `.env.example` 为 `.env` (如果使用 Vite):
   ```
   VITE_SUPABASE_URL=你的项目URL
   VITE_SUPABASE_ANON_KEY=你的anon_key
   ```
   *注意：如果未使用 Vite，需手动修改 `app.js` 顶部的变量。*

3. 启动本地服务器:
   ```bash
   npm run dev
   ```

### 3. Vercel 部署说明

1. 将代码推送到 GitHub。
2. 在 Vercel 中导入项目。
3. **关键步骤**: 在 Vercel 项目设置 (Settings) -> **Environment Variables** 中添加以下两个变量：
   - `VITE_SUPABASE_URL`: (从 Supabase 设置中获取)
   - `VITE_SUPABASE_ANON_KEY`: (从 Supabase 设置中获取)
4. 部署即可。

## 📂 项目结构
- `index.html`: 页面结构
- `style.css`: 样式设计 (深色主题)
- `app.js`: 核心逻辑 (Supabase 交互、购物车、生成图片)
- `schema.sql`: 数据库初始化脚本

## ✨ 功能特性
- **实时数据**: 商品浏览量和加购量实时从数据库获取。
- **动态交互**: 搜索、排序、筛选。
- **选货单**: 本地持久化存储，支持生成图片导出。
- **原子计数**: 使用 Postgres 函数保证并发计数准确。
