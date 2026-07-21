# PDM Lab Vibe Coding 工作流

本文档总结 PDM Lab 的整套 vibe coding 方式：以真实预览和即时反馈为核心，让 Codex 持续理解网站定位、调整设计、补全内容、验证功能并发布上线。

## 1. 工作方式

PDM Lab 的开发不是一次性写完，而是持续迭代：

1. 先说体验问题或目标。
2. Codex 浏览页面、读代码、定位数据源。
3. 提出方案或直接小步修改。
4. 本地预览验证。
5. 用户反馈细节。
6. Codex 再修正。
7. 发布前检查。
8. 推送 GitHub，Cloudflare Pages 自动上线。

## 2. 角色分工

### 用户负责
- 判断产品定位和体验是否符合直觉。
- 给出页面问题、文案偏好和视觉方向。
- 确认是否发布。
- 管理 Cloudflare、Supabase、GitHub 账号权限。

### Codex 负责
- 读代码和数据源。
- 找到根因，不只修表面。
- 统一双端体验。
- 修改文案、样式、逻辑、知识内容。
- 跑检查，避免乱码、坏链接和语法错误。
- 整理文档与迁移材料。

## 3. 每次需求的标准流程

### Step 1：确认问题类型

先判断需求属于哪类：

- 内容类：知识点、文案、脱敏、补充案例。
- UI 类：首页、知识库、移动端适配、顶部栏、卡片排版。
- 功能类：搜索、跳转、返回、通知、账号、权限。
- 数据类：Supabase 表、角色、反馈、论坛、我的知识库。
- 发布类：同步仓库、检查、提交、推送。

### Step 2：找到唯一数据源

不要盲改生成产物。

- 知识内容优先改 `knowledge` 下 Markdown。
- 前端展示逻辑改 `site/app.js`、`site/knowledge-views.js`、`site/sections-ui.js`。
- 静态知识数据由脚本生成。
- 多语言文案改 `site/locales`。
- 权限能力改 `site/permissions.js` 和 Supabase SQL。

### Step 3：小步修改

原则：
- 一次只解决一个明确问题。
- 保持现有 UI 风格，不擅自放大字体。
- 不引入额外视觉噪音。
- 双端同时考虑。
- 中文内容用 UTF-8 安全方式写入。

### Step 4：生成知识数据

如果改了 `knowledge` 内容，运行：

```powershell
node scripts\import-knowledge-base.mjs
node scripts\sync-knowledge.mjs
node scripts\write-config.mjs
```

### Step 5：本地检查

至少运行：

```powershell
node scripts\check-encoding.mjs
node --check site\app.js
node --check site\data.js
```

如果改了其他 JS，也要对对应文件执行 `node --check`。

### Step 6：预览验收

重点看：
- 首页首屏是否简洁。
- 知识库搜索是否命中知识点。
- 知识图谱是否联动 8 个主题。
- 学习主线和 4 个路径是否没有坏链接。
- 移动端顶部栏、搜索框、返回、回到顶部是否正常。
- 登录与未登录状态是否符合预期。

### Step 7：同步发布仓库

如果开发源目录和部署仓库不同，发布前同步变更文件。

常见同步对象：
- `site`
- `knowledge`
- `src/data/knowledge-from-md.json`
- `scripts`
- `supabase`
- `package.json`
- `docs`
- `codex-skills`

### Step 8：提交上线

```powershell
git status --short
git add .
git commit -m "Update PDM Lab"
git push origin main
```

Cloudflare Pages 会自动构建。

## 4. UI 迭代规则

### 首页
- 首屏聚焦知识库管理与速查。
- 学习主线作为主推但不喧宾夺主。
- 4 个计划是路径规划，不与学习主线同等语义。
- 关于本站放底部弱化。
- 快速查阅和学习区域保持同一种版式语言。

### 知识库
- 顶部搜索小而清晰。
- 知识速查、知识图谱与搜索同级。
- 8 个专题和知识点数量必须联动真实数据。
- 知识点正文用轻量排版，不套大卡片。

### 移动端
- 不直接复用桌面端密度。
- 顶部栏按钮必须能点。
- 搜索框不能溢出。
- 返回和回到顶部不要挡内容。
- 长页面要保留滚动位置。

## 5. 内容迭代规则

### 知识点补充
每个知识点尽量补齐：
- 是什么
- 为什么重要
- 什么时候用
- PM 怎么用
- 案例
- 常见误区
- 相关知识

### 脱敏规则
避免出现：
- 真实客户名
- 内部系统真实名称
- 可识别的公司业务细节
- 未授权案例

推荐替换：
- 代理商平台 → 业务门户 / 渠道门户
- 企学宝 → 培训系统
- 公司真实名称 → 某 B 端企业 / 某机器人公司 / 某业务团队

### 原创保护
- 公共知识点展示原创声明。
- 我的知识库不展示原创声明。
- 不禁用右键，只限制复制、剪切、拖拽。
- 超级管理员可复制。

## 6. 根因修复原则

遇到问题时优先问：

- 是数据源错，还是展示层错？
- 是旧链接残留，还是路由缺失？
- 是中英文文案不同步，还是只改了中文？
- 是桌面端正常但移动端遮挡？
- 是本地生效但部署仓库没同步？
- 是 Supabase 表缺失，还是前端逻辑错误？

不要只修一个按钮，要修同类问题的生成规则和检查机制。

## 7. 发布前必检清单

```powershell
node scripts\check-encoding.mjs
node --check site\app.js
node --check site\data.js
node --check site\knowledge-views.js
node --check site\sections-ui.js
node --check site\permissions.js
git status --short
```

必看页面：
- `#/`
- `#/kb`
- `#/reference`
- `#/mindmap`
- `#/industry/learning-path/kb-4stage`
- `#/industry/learning-path/newcomer-8w`
- `#/industry/learning-path/job-hunt`
- `#/industry/learning-path/intern`
- `#/industry/learning-path/transition`
- `#/my-knowledge`
- `#/personal`
- `#/tools`

## 8. 换电脑继续开发

1. 克隆 GitHub 仓库。
2. 安装 Node.js / pnpm。
3. 复制 `.env.local` 或 `site/config.js` 中本地配置。
4. 确认 Supabase 项目环境变量。
5. 安装依赖并启动本地预览。
6. 把 `codex-skills/pdm-lab-vibe-coding` 复制到新电脑的 `.codex/skills`。
7. 新 Codex 里使用 `$pdm-lab-vibe-coding` 继续开发。

## 9. 一句话工作流

先定位真实问题，再找到唯一数据源；小步修改、双端验证、跑检查、同步部署仓库、推送上线。

