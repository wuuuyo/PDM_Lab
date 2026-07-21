# PDM Lab 建站问题与解决方案汇总

本文档用于记录 PDM Lab 从 Cursor 迁移到 Codex、持续 vibe coding、上线 Cloudflare Pages 过程中遇到的高频问题、根因和固定处理方式。

## 1. 项目迁移与双仓库不同步

### 问题表现
- Cursor 源项目能预览，但部署仓库没有同步最新代码。
- 本地看到了效果，线上没有变化。
- 换电脑后不知道应该带走哪些文件。

### 根因
- 实际开发目录与发布目录分离：
  - 源项目：`C:\Users\wuyue\.cursor\projects\PDM-learn`
  - 部署仓库：`C:\Users\wuyue\Documents\Codex\2026-07-17\wo\work\PDM_Lab_deploy_ssl`
- Cloudflare Pages 监听的是 GitHub 部署仓库，不是 Cursor 源目录。
- `.env.local`、`site/config.js` 等本地配置可能不会进 Git，需要单独确认。

### 解决方案
- 开发优先在源项目完成，发布前同步到部署仓库。
- 发布前固定执行：
  - `node scripts\check-encoding.mjs`
  - `node --check site\data.js`
  - `git status --short`
  - `git push origin main`
- 换电脑时带走：
  - GitHub 仓库代码
  - Supabase SQL / 表结构
  - Cloudflare Pages 环境变量
  - 本地 `.env.local` 或 `site/config.js` 中未提交的配置
  - 本项目的 `docs` 与 `codex-skills`

## 2. 中文乱码、问号与编码问题

### 问题表现
- 文章标题或正文出现 `??`、`�`。
- PowerShell 输出中文显示异常。
- 用脚本写入中文后，网站文章内容乱码。

### 根因
- Windows 终端编码、PowerShell 默认编码、脚本写入编码不一致。
- 中文路径或中文内容经过终端转码时被破坏。
- 直接用 PowerShell 拼接中文内容写文件风险高。

### 解决方案
- 中文内容修改优先使用 `apply_patch`，避免 PowerShell inline 中文写入。
- 脚本读写文件必须显式 `utf-8`。
- 发布前运行 `scripts/check-encoding.mjs`，扫描：
  - `??`
  - `�`
  - 常见 UTF-8 / GBK 乱码
  - 异常标题字符
  - 空链接 / 坏链接
- 如果终端显示乱码，不等于文件一定坏；以文件内容和检查脚本结果为准。

## 3. 学习路径按钮跳错、空白页、内容不存在

### 问题表现
- 学习主线或 4 个路径规划中按钮点击后进入“内容不存在”。
- 入口文案和目标知识点不对应。
- 返回时没有回到点击前页面。

### 根因
- 路径中硬编码旧链接，知识库迁移后 `id` 改名。
- 多个入口复用同一知识点时，没有统一链接映射表。
- 路由跳转没有携带来源页，浏览器返回栈不稳定。

### 解决方案
- 学习路径入口必须链接到当前知识库真实 `id`，不要手写猜测 slug。
- 建立“路径按钮 → 知识点 id”的映射，以知识库数据为唯一来源。
- 新增或改名知识点后，必须跑坏链接检查。
- 从学习路径跳转到文章时保存来源页，返回优先回到来源页。

## 4. 知识库信息架构反复错位

### 问题表现
- 知识图谱没有联动最新 8 个主题。
- 知识速查、知识图谱、知识库入口命名不统一。
- 首页显示专题数量与实际不一致。

### 根因
- 旧版“快速参考”结构残留。
- UI 入口和数据源分别维护，导致数字和分组不一致。
- 知识库 Markdown、导入 JSON、前端静态数据未统一生成。

### 解决方案
- 知识库以 Markdown 公共知识库为源头。
- 修改知识内容后依次运行：
  - `node scripts\import-knowledge-base.mjs`
  - `node scripts\sync-knowledge.mjs`
  - `node scripts\write-config.mjs`
  - `node scripts\check-encoding.mjs`
- 首页专题数、知识点数必须从同一份知识数据联动计算，不要写死。

## 5. UI 信息密度过高

### 问题表现
- 首页卡片太多、文字太多，不够简洁高级。
- 学习主线和路径规划语义混在一起。
- 知识卡片内部又套知识卡片，层级混乱。
- 移动端按钮、搜索框、顶部栏容易挤压或遮盖。

### 根因
- 功能入口都想放首页，导致主次不清。
- 学习路径被当成核心功能展示，而网站定位实际是知识库管理与速查。
- 桌面端设计直接压缩到移动端，未重新排版。

### 解决方案
- 首页定位：产品人的知识库管理与速查空间。
- 学习主线是主推的新手辅助入口，4 个计划是按人群目标的路径规划。
- 快速查阅、学习路径、知识库入口使用统一版式，但视觉权重不同。
- 关于本站只保留底部弱说明，不做强功能卡片。
- 移动端优先：
  - 搜索框不溢出
  - 顶栏按钮可点击
  - 返回与回到顶部不遮挡内容

## 6. 个人账号、我的空间、消息通知关系混乱

### 问题表现
- 点击头像直接进入账号页，不符合预期。
- “我的账号”被放进“我的空间”。
- 消息通知展示样式和头像菜单不一致。

### 根因
- 账号、空间、通知属于不同层级：
  - 我的账号：身份与安全
  - 我的空间：收藏、笔记、个人知识库、复盘
  - 消息通知：全站消息中心入口

### 解决方案
- 头像点击只出现小菜单。
- 菜单项统一竖排文本，不混用图标样式。
- 已登录展示：我的账号、消息通知、意见反馈、管理者后台、退出登录。
- 未登录展示：登录 / 注册、意见反馈。
- 提交反馈需要登录提示，但入口对所有人可见。

## 7. 权限、复制与原创保护

### 问题表现
- 禁用复制误伤右键刷新。
- 超级管理员也无法复制。
- 不同角色是否可复制无法配置。
- 原创声明看不到或措辞不准确。

### 根因
- 复制保护被做成全局右键禁用。
- 权限没有接入角色配置。
- 声明只在部分文章场景展示。

### 解决方案
- 禁用 `copy`、`cut`、`dragstart`，不禁用右键。
- 输入框、文本域、可编辑区域允许正常操作。
- 超级管理员永远可复制。
- 管理后台增加 `contentCopy` 角色权限。
- 公共知识点展示“原创声明”，我的知识库不展示声明。

## 8. Supabase 与后台功能依赖

### 问题表现
- 反馈、论坛、权限、消息通知、我的知识库等功能加载失败。
- 管理后台提示列不存在或权限异常。

### 根因
- 前端已更新，但 Supabase SQL 未执行。
- RLS、角色表、反馈表、通知表等结构不完整。

### 解决方案
- 涉及数据库功能时先确认 `supabase` 目录 SQL 是否已执行。
- 常见 SQL：
  - `supabase/schema.sql`
  - `supabase/feedback.sql`
  - `supabase/rbac.sql`
  - `supabase/role-permissions.sql`
  - `supabase/retention.sql`
- 前端发布前，先在 Supabase SQL Editor 手动执行并验证。

## 9. 发布失败或 Git 推送异常

### 问题表现
- Git push 弹出异常或 “memory could not be read”。
- 之前能推送，后来失败。

### 根因
- Git Credential Manager、终端会话、网络、凭据缓存或本机 Git 配置异常。
- 不是代码一定坏。

### 解决方案
- 先重开 PowerShell / Codex 终端。
- 运行：
  - `git status`
  - `git remote -v`
  - `git pull --rebase origin main`
  - `git push origin main`
- 如果是认证问题，重新登录 GitHub 或刷新凭据。
- 发布前不要跳过本地检查。

## 10. 固定上线 Checklist

每次上线前执行：

```powershell
cd C:\Users\wuyue\Documents\Codex\2026-07-17\wo\work\PDM_Lab_deploy_ssl
node scripts\check-encoding.mjs
node --check site\app.js
node --check site\data.js
git status --short
git add .
git commit -m "Describe release"
git push origin main
```

上线后确认：
- Cloudflare Pages 构建成功。
- 首页、知识库、学习路径、文章详情、我的空间、头像菜单可打开。
- 搜索、跳转、返回、复制权限、移动端顶栏正常。

