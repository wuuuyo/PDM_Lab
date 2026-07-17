# PM Lab Cloudflare Pages 发布说明

## 项目入口

- 线上静态站点目录：`site`
- 构建命令：`npm run build:site`
- 输出目录：`site`
- 本地预览：双击 `start.bat`，或进入 `site` 后运行 `node server.cjs`

## Supabase 环境变量

在 Cloudflare Pages 的项目设置里添加：

```txt
PDM_SUPABASE_URL=https://你的项目.supabase.co
PDM_SUPABASE_ANON_KEY=你的 anon public key
PDM_ADMIN_EMAILS=admin@example.com,owner@example.com
```

构建时 `scripts/write-config.mjs` 会根据这些变量生成 `site/config.js`。不要提交真实密钥。

## 推荐迁移流程

1. 在 Codex 工作区拉取或复制项目。
2. 修改 `site` 下的页面、样式和功能脚本。
3. 本地运行 `npm run build:site` 检查生成文件。
4. 推送到 GitHub 默认分支。
5. Cloudflare Pages 自动构建并发布。

## 数据库变更

Supabase SQL 位于 `supabase` 目录。涉及表结构、RLS 或权限策略时，先在 Supabase SQL Editor 手动执行并验证，再发布前端。
