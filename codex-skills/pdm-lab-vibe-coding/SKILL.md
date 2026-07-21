---
name: pdm-lab-vibe-coding
description: Maintain, improve, document, and safely release the PDM Lab website. Use when working on PDM Lab tasks involving homepage UI, knowledge base content, learning paths, mobile adaptation, Supabase-backed account/community/admin features, Cloudflare Pages deployment, encoding/link checks, project migration, or vibe-coding handoff documentation.
---

# PDM Lab Vibe Coding

## Core Context

PDM Lab is a product-person knowledge management and quick-reference website. Treat the knowledge base as the core product; treat the learning mainline and four plans as onboarding aids.

Default project paths:
- Source project: `C:\Users\wuyue\.cursor\projects\PDM-learn`
- Deploy repo: `C:\Users\wuyue\Documents\Codex\2026-07-17\wo\work\PDM_Lab_deploy_ssl`
- Remote: `https://github.com/wuuuyo/PDM_Lab.git`
- Deploy target: Cloudflare Pages
- Backend: Supabase

When paths differ in a future environment, rediscover them with `git remote -v`, `rg --files`, and local config files.

## Operating Principles

- Fix root causes, not only the visible button or one route.
- Keep UI concise, high-end, calm, and consistent; do not enlarge typography casually.
- Always consider desktop and mobile together.
- Do not remove `知识速查`, `知识图谱`, or the 8-topic knowledge-base concept.
- Do not hardcode topic counts or article counts when data can be derived.
- Do not expose sensitive real customer, company, or internal system names.
- Do not use PowerShell inline Chinese scripts to rewrite content; prefer `apply_patch` or explicit UTF-8 scripts.
- Preserve existing layout and style unless the user explicitly asks for redesign.

## Project Map

Read `references/project-map.md` when the task involves architecture, file ownership, or migration.

Key files:
- `site/app.js`: main routes, homepage, article rendering, account/admin flows.
- `site/knowledge-views.js`: knowledge home, graph, reference, modular knowledge UI.
- `site/sections-ui.js`: forum, learning sections, shared UI blocks.
- `site/styles.css`, `site/chrome.css`: visual and mobile styling.
- `site/locales/zh-CN.js`, `site/locales/en-US.js`: bilingual copy.
- `site/data.js`: generated static knowledge data.
- `knowledge/`: Markdown source of public and personal knowledge.
- `src/data/knowledge-from-md.json`: generated knowledge JSON.
- `scripts/check-encoding.mjs`: pre-release encoding/link checker.
- `supabase/`: database schema, RLS, roles, feedback, retention.

## Standard Workflow

1. Classify the request: content, UI, feature, data/Supabase, release, migration, or documentation.
2. Locate the source of truth before editing.
3. Make the smallest coherent change across both desktop and mobile.
4. If knowledge Markdown changed, regenerate knowledge data.
5. Run encoding, link, and syntax checks.
6. If publishing, sync source changes to the deploy repo, commit, and push.
7. Summarize changed files, validation, and any manual Supabase/Cloudflare steps.

## Content Workflow

When editing knowledge content:
1. Edit Markdown under `knowledge/`, not generated files first.
2. Use this article structure when suitable:
   - Core explanation
   - When to use
   - Case
   - PM application
   - Common mistakes
   - Related knowledge
3. Desensitize cases:
   - `代理商平台` → `业务门户` / `渠道门户`
   - `企学宝` → `培训系统`
   - Real company/customer names → generic B-side company/team labels
4. Regenerate:
   ```powershell
   node scripts\import-knowledge-base.mjs
   node scripts\sync-knowledge.mjs
   node scripts\write-config.mjs
   ```
5. Verify generated `site/data.js` and `src/data/knowledge-from-md.json`.

## UI Workflow

For homepage and knowledge-base UI:
- Keep homepage focused on knowledge management and quick lookup.
- Let `学习主线` be visibly recommended, but keep it lighter than the core knowledge-library positioning.
- Present four plans as audience/goal-specific path planning: 新人计划、求职计划、实习计划、转行计划.
- Keep `关于本站` as weak footer content.
- For mobile, check overflow, topbar clickability, search width, return behavior, and long-page navigation.

For article content UI:
- Avoid nesting card-like boxes inside knowledge cards.
- Use light sections, short paragraphs, lists, and whitespace.
- Keep `PM 应用` visually distinct from `核心解释`; do not use the same color card treatment.

## Link and Route Workflow

For learning paths and article links:
- Never guess article slugs.
- Resolve links from current knowledge data.
- Check every path button after renaming or deleting content.
- Preserve source-page return behavior when jumping from learning paths to articles.
- Do not ship if any intended button opens a blank page or `内容不存在`.

## Account, Permission, and Copy Rules

- Avatar opens a small vertical menu, not a full account page directly.
- `我的账号` is independent from `我的空间`.
- `消息通知` appears in the avatar menu with the same text-only format as other items.
- Feedback entry is visible to everyone; submitting requires login.
- Do not disable right-click for copy protection.
- Disable copy/cut/drag only where appropriate.
- Super admin can always copy.
- Role-based copy control is managed by `contentCopy`.
- Public KB articles show `原创声明`; personal `我的知识库` articles do not.

## Validation

Run before handoff or release:

```powershell
node scripts\check-encoding.mjs
node --check site\app.js
node --check site\data.js
node --check site\knowledge-views.js
node --check site\sections-ui.js
node --check site\permissions.js
```

If a checked file does not exist or was not changed, explain and skip it.

## Release Workflow

Use the deploy repo for Cloudflare Pages releases:

```powershell
cd C:\Users\wuyue\Documents\Codex\2026-07-17\wo\work\PDM_Lab_deploy_ssl
node scripts\check-encoding.mjs
git status --short
git add .
git commit -m "Update PDM Lab"
git push origin main
```

After push, Cloudflare Pages should auto-build. If the user cannot see changes, check build status, cache version query strings, and browser cache.

## Handoff and Migration

When preparing another computer or another Codex:
- Include `docs/`, `codex-skills/`, `knowledge/`, `site/`, `scripts/`, `supabase/`, `package.json`, and lockfiles.
- Remind the user to copy local-only env/config files separately.
- Install this skill by copying `codex-skills/pdm-lab-vibe-coding` into the new machine’s `.codex/skills`.

