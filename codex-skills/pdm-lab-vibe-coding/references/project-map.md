# PDM Lab Project Map

## Positioning

PDM Lab is a PM knowledge management and quick-reference space. The core product is the knowledge base; learning paths are auxiliary onboarding and goal-planning flows.

## Main Areas

- Home: positioning, search, knowledge-library entry, quick lookup, graph, lightweight learning entry.
- Knowledge base: 8 topics, internal search, knowledge speed lookup, knowledge graph, article detail.
- Learning paths: mainline plus four plans for newcomers, job hunting, internship, and career transition.
- My space: favorites, notes, personal knowledge base, reviews.
- My account: email, nickname, password, logout.
- Admin: roles, permissions, knowledge publishing, feedback, notifications.
- Community: forum posts, comments, message notifications, feedback.

## Data Flow

```text
knowledge/*.md
  -> scripts/import-knowledge-base.mjs
  -> src/data/knowledge-from-md.json
  -> scripts/sync-knowledge.mjs / scripts/write-config.mjs
  -> site/data.js
  -> site UI
```

## Deployment Flow

```text
local source project
  -> deploy repo
  -> git push origin main
  -> Cloudflare Pages
```

## Common Checks

- Encoding/link/title check: `node scripts\check-encoding.mjs`
- JS syntax: `node --check <file>`
- Git status: `git status --short`

