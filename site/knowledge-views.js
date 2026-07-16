/**
 * 知识库模块化视图：按 MD 文档架构渲染（步骤图 / 模板 / SOP / 字母表 / 图谱 / 路径）
 */
;(function () {
  const t = (key, params, fallback) => window.PMLabI18n?.t(key, params, fallback) ?? fallback ?? key
  const escapeHtml = (str) => {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(str)
    const d = document.createElement('div')
    d.textContent = str
    return d.innerHTML
  }

  function catTitle(cat) {
    return window.PMLabI18n?.getCategoryMeta(cat.id, 'title', cat.title) ?? cat.title
  }

  function getCat(id) {
    return window.PDMKnowledge?.getCategoryByIdMerged?.(id)
  }

  function itemsOf(catId) {
    return getCat(catId)?.items || []
  }

  function bySection(items, re) {
    return items.filter((i) => re.test(i.section || ''))
  }

  function renderLines(lines) {
    return (lines || [])
      .map((p) => {
        const text = String(p)
        if (text.startsWith('【') && text.endsWith('】')) {
          return `<h3 class="kb-mod-subhead">${escapeHtml(text.slice(1, -1))}</h3>`
        }
        if (text.includes('\n')) {
          return `<pre class="kb-mod-pre">${escapeHtml(text)}</pre>`
        }
        return `<p>${escapeHtml(text)}</p>`
      })
      .join('')
  }

  function pageShell(_crumbs, title, desc, body, extraClass = '') {
    return `
      <div class="page kb-module-page ${extraClass}">
        <div class="kb-module-hero">
          <h1>${escapeHtml(title)}</h1>
          ${desc ? `<p>${escapeHtml(desc)}</p>` : ''}
        </div>
        ${body}
      </div>`
  }

  function crumb(parts) {
    return parts
      .map((c, i) => {
        const last = i === parts.length - 1
        if (last || !c.href) return `<span class="breadcrumb-current">${escapeHtml(c.label)}</span>`
        return `<a href="${c.href}" class="breadcrumb">${escapeHtml(c.label)}</a><span class="breadcrumb-sep">/</span>`
      })
      .join('')
  }

  function kbSectionLabel() {
    return t('nav.sectionKnowledge')
  }

  function kbDocLabel(catId, docId) {
    const doc = getDoc(catId, docId)
    if (!doc) return docId
    if (isFlatKbDoc(catId)) return doc.title
    if (catId === 'business' || catId === 'security') return catTitle(getCat(catId))
    return doc.title
  }

  const KB_MODULE_LABELS = {
    demand: () => t('kbMod.workflowDemandTitle', null, '需求处理 7 步'),
    prd: () => t('kbMod.workflowPrdTitle', null, 'PRD 模板'),
    collab: () => t('kbMod.workflowCollabTitle', null, '跨部门协作'),
    kb: () => t('kbMod.workflowKbTitle', null, '知识库管理'),
    glossary: () => t('kbMod.refGlossaryTitle', null, '关键词速查'),
    mindmap: () => t('kbMod.refMindmapTitle', null, '知识图谱'),
    path: () => t('kbMod.refPathTitle', null, '学习路径'),
  }

  function findArticleItem(catId, itemId) {
    const raw = String(itemId || '')
    let decoded = raw
    try {
      decoded = decodeURIComponent(raw)
    } catch (_) {}
    const all = itemsOf(catId)
    return (
      all.find((i) => i.id === raw) ||
      all.find((i) => i.id === decoded) ||
      all.find((i) => decodeURIComponent(String(i.id)) === decoded)
    )
  }

  function resolveArticleTrail(catId, itemId) {
    const docs = KB_DOCS[catId] || []
    for (const doc of docs) {
      const items = docItems(catId, doc)
      const item = items.find((i) => {
        const raw = String(itemId || '')
        let decoded = raw
        try {
          decoded = decodeURIComponent(raw)
        } catch (_) {}
        return i.id === raw || i.id === decoded || decodeURIComponent(String(i.id)) === decoded
      })
      if (!item) continue
      if (doc.chapterMode === 'flat-items') {
        return { doc, chapter: null, item }
      }
      const key = chapterKeyFromSection(item.section || '', doc.chapterMode)
      const chapter = listChapters(catId, doc).find((c) => String(c.id) === String(key)) || null
      return { doc, chapter, item }
    }
    return { doc: null, chapter: null, item: findArticleItem(catId, itemId) }
  }

  /** 知识库顶栏面包屑：统一从「知识库」起，不含首页 */
  function buildKbCrumbs(parts) {
    const p0 = parts[0]
    if (!['kb', 'category', 'doc', 'chapter', 'module', 'article'].includes(p0)) return null

    if (p0 === 'kb') {
      return [{ label: kbSectionLabel() }]
    }

    const crumbs = [{ href: '#/kb', label: kbSectionLabel() }]

    if (p0 === 'category' && parts[1]) {
      const catId = parts[1]
      if (isFlatKbDoc(catId)) {
        return [{ label: kbSectionLabel() }]
      }
      const cat = getCat(catId)
      crumbs.push({ label: catTitle(cat) || catId })
      return crumbs
    }

    if (p0 === 'doc' && parts[1] && parts[2]) {
      const catId = parts[1]
      const docId = parts[2]
      crumbs.push({ label: kbDocLabel(catId, docId) })
      return crumbs
    }

    if (p0 === 'chapter' && parts[1] && parts[2] && parts[3]) {
      const catId = parts[1]
      const docId = parts[2]
      const chapterId = parts[3]
      const chapterLabel = getChapterLabel(catId, docId, chapterId)
      const docHref = isGroupedDoc(catId, docId)
        ? `#/doc/${catId}/${docId}?group=${encodeURIComponent(chapterId)}`
        : `#/doc/${catId}/${docId}`
      crumbs.push({ href: docHref, label: kbDocLabel(catId, docId) })
      if (!isGroupedDoc(catId, docId)) {
        crumbs.push({ label: chapterLabel })
      }
      return crumbs
    }

    if (p0 === 'module' && parts[1] && parts[2]) {
      const catId = parts[1]
      const moduleId = parts[2]
      if (catId === 'workflow' || catId === 'reference') {
        const cat = getCat(catId)
        crumbs.push({ href: `#/category/${catId}`, label: catTitle(cat) || catId })
      }
      const labelFn = KB_MODULE_LABELS[moduleId]
      crumbs.push({ label: labelFn ? labelFn() : moduleId })
      return crumbs
    }

    if (p0 === 'article' && parts[1] && parts[2]) {
      const catId = parts[1]
      const itemId = parts[2]
      const trail = resolveArticleTrail(catId, itemId)
      const item = trail.item || findArticleItem(catId, itemId)
      const title = stripLeadingIndex(item?.title) || itemId

      if (trail.doc) {
        const doc = trail.doc
        crumbs.push({ href: `#/doc/${catId}/${doc.id}`, label: kbDocLabel(catId, doc.id) })
        if (trail.chapter && !trail.chapter.isArticle) {
          const chapterHref = isGroupedDoc(catId, doc.id)
            ? `#/doc/${catId}/${doc.id}?group=${encodeURIComponent(trail.chapter.id)}`
            : `#/chapter/${catId}/${doc.id}/${encodeURIComponent(trail.chapter.id)}`
          crumbs.push({
            href: chapterHref,
            label: trail.chapter.title,
          })
        }
        crumbs.push({ label: title })
        return crumbs
      }

      const cat = getCat(catId)
      if (catId === 'workflow' || catId === 'reference') {
        crumbs.push({ href: `#/category/${catId}`, label: catTitle(cat) || catId })
      } else if (cat) {
        crumbs.push({ href: `#/category/${catId}`, label: catTitle(cat) })
      }
      crumbs.push({ label: title })
      return crumbs
    }

    return crumbs
  }

  /* ---------- 工作流程 ---------- */

  /** 需求处理 7 步：固定顺序与正文，避免数据排序 / 污染导致乱序 */
  const WORKFLOW_DEMAND_STEPS = [
    {
      key: '需求接收',
      id: 'kb-workflow-1-需求接收',
      content: ['来源：用户反馈 / 业务方 / 数据分析 / 竞品', '动作：进入需求池，标注来源和初步描述'],
    },
    {
      key: '需求分析',
      id: 'kb-workflow-2-需求分析',
      content: ['理解业务背景和目标', '明确目标用户和使用场景', '梳理核心流程和边界', '评估价值和优先级'],
    },
    {
      key: '方案设计',
      id: 'kb-workflow-3-方案设计',
      content: ['撰写 PRD', '制作原型/低保真', '确定验收标准'],
    },
    {
      key: '评审对齐',
      id: 'kb-workflow-4-评审对齐',
      content: ['内部评审（PM 组）', '跨部门评审（研发/设计/测试）', '确认排期和分工'],
    },
    {
      key: '开发跟踪',
      id: 'kb-workflow-5-开发跟踪',
      content: ['加入需求看板', '跟踪开发进展', '处理技术疑问', '验收功能实现'],
    },
    {
      key: '上线发布',
      id: 'kb-workflow-6-上线发布',
      content: ['确认上线时间', '准备上线文档', '跟踪上线效果'],
    },
    {
      key: '复盘总结',
      id: 'kb-workflow-7-复盘总结',
      content: ['回顾目标达成', '记录问题和解决方案', '更新知识库'],
    },
  ]

  function renderWorkflowHub() {
    const cat = getCat('workflow')
    if (!cat) return null
    const modules = [
      {
        id: 'demand',
        href: '#/module/workflow/demand',
        title: t('kbMod.workflowDemandTitle', null, '需求处理 7 步'),
        desc: t('kbMod.workflowDemandDesc', null, '从接收到复盘的完整需求闭环，按步骤推进'),
        meta: '7 steps',
        kind: 'steps',
      },
      {
        id: 'prd',
        href: '#/module/workflow/prd',
        title: t('kbMod.workflowPrdTitle', null, 'PRD 模板'),
        desc: t('kbMod.workflowPrdDesc', null, '7 章节标准结构 + 写作原则'),
        meta: 'template',
        kind: 'template',
      },
    ]
    const secondary = [
      {
        href: '#/module/workflow/collab',
        title: t('kbMod.workflowCollabTitle', null, '跨部门协作'),
        desc: t('kbMod.workflowCollabDesc', null, '与研发 / 设计 / 测试 / 业务方的对接节奏'),
      },
      {
        href: '#/module/workflow/kb',
        title: t('kbMod.workflowKbTitle', null, '知识库管理'),
        desc: t('kbMod.workflowKbDesc', null, '日常积累、月度整理与检索习惯'),
      },
    ]

    const body = `
      <div class="kb-module-grid kb-module-grid-2">
        ${modules
          .map(
            (m) => `
          <a href="${m.href}" class="kb-module-tile kb-module-tile-${m.kind}">
            <span class="kb-module-tile-meta">${escapeHtml(m.meta)}</span>
            <h2>${escapeHtml(m.title)}</h2>
            <p>${escapeHtml(m.desc)}</p>
          </a>`,
          )
          .join('')}
      </div>
      <section class="kb-module-secondary">
        <h2>${escapeHtml(t('kbMod.moreModules', null, '相关流程'))}</h2>
        <div class="kb-module-link-row">
          ${secondary
            .map(
              (s) => `
            <a href="${s.href}" class="kb-module-link">
              <strong>${escapeHtml(s.title)}</strong>
              <span>${escapeHtml(s.desc)}</span>
            </a>`,
            )
            .join('')}
        </div>
      </section>`

    return pageShell(
      crumb([
        { href: '#/', label: t('common.home') },
        { label: catTitle(cat) },
      ]),
      catTitle(cat),
      t('kbMod.workflowHubDesc', null, '按文档架构查看需求步骤与 PRD 模板'),
      body,
      'kb-workflow-hub',
    )
  }

  function renderWorkflowDemand() {
    // 完全固定顺序与文案，不读 data.js / shared，避免任何排序或合并污染
    const body = `
      <ol class="kb-demand-steps">
        ${WORKFLOW_DEMAND_STEPS.map(
          (s, idx) => `
          <li class="kb-demand-step" id="step-${idx + 1}">
            <div class="kb-demand-step-rail" aria-hidden="true">
              <span class="kb-demand-step-num">${String(idx + 1).padStart(2, '0')}</span>
              ${idx < WORKFLOW_DEMAND_STEPS.length - 1 ? '<span class="kb-demand-step-line"></span>' : ''}
            </div>
            <div class="kb-demand-step-body">
              <h2>${escapeHtml(s.key)}</h2>
              <ul>
                ${s.content.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
              </ul>
            </div>
          </li>`,
        ).join('')}
      </ol>`

    return pageShell(
      '',
      t('kbMod.workflowDemandTitle', null, '需求处理 7 步'),
      t('kbMod.workflowDemandDesc', null, '从接收到复盘的完整需求闭环'),
      body,
      'kb-workflow-demand',
    )
  }

  function renderWorkflowPrd() {
    const items = bySection(itemsOf('workflow'), /文档规范/)
    const template = items.find((i) => /模板/.test(i.title)) || items[0]
    const principles = items.filter((i) => i !== template)

    const body = `
      <div class="kb-prd-layout">
        <section class="kb-prd-doc">
          <div class="kb-prd-doc-label">${escapeHtml(t('kbMod.prdTemplateLabel', null, 'PRD 标准结构'))}</div>
          <pre class="kb-prd-pre">${escapeHtml((template?.content || []).join('\n\n'))}</pre>
        </section>
        <aside class="kb-prd-aside">
          ${principles
            .map(
              (p) => `
            <section class="kb-prd-card">
              <h2>${escapeHtml(p.title)}</h2>
              <ul>${(p.content || []).map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>
            </section>`,
            )
            .join('')}
        </aside>
      </div>`

    return pageShell(
      crumb([
        { href: '#/', label: t('common.home') },
        { href: '#/category/workflow', label: t('categories.workflow.title', null, '工作流程') },
        { label: t('kbMod.workflowPrdTitle', null, 'PRD 模板') },
      ]),
      t('kbMod.workflowPrdTitle', null, 'PRD 模板'),
      t('kbMod.workflowPrdDesc', null, '7 章节标准结构 + 写作原则'),
      body,
    )
  }

  function renderWorkflowCollab() {
    const items = bySection(itemsOf('workflow'), /协作/)
    const body = `
      <div class="kb-collab-grid">
        ${items
          .map(
            (i) => `
          <section class="kb-collab-card">
            <h2>${escapeHtml(i.title)}</h2>
            <dl class="kb-collab-dl">
              ${(i.content || [])
                .map((line) => {
                  const m = String(line).match(/^([^：:]+)[：:](.*)$/)
                  if (m) return `<div><dt>${escapeHtml(m[1])}</dt><dd>${escapeHtml(m[2].trim())}</dd></div>`
                  return `<dd>${escapeHtml(line)}</dd>`
                })
                .join('')}
            </dl>
          </section>`,
          )
          .join('')}
      </div>`
    return pageShell(
      crumb([
        { href: '#/', label: t('common.home') },
        { href: '#/category/workflow', label: t('categories.workflow.title', null, '工作流程') },
        { label: t('kbMod.workflowCollabTitle', null, '跨部门协作') },
      ]),
      t('kbMod.workflowCollabTitle', null, '跨部门协作'),
      t('kbMod.workflowCollabDesc', null, '与研发 / 设计 / 测试 / 业务方的对接节奏'),
      body,
    )
  }

  function renderWorkflowKb() {
    const items = bySection(itemsOf('workflow'), /知识库管理/)
    const body = `
      <div class="kb-sop-stack">
        ${items
          .map(
            (i) => `
          <section class="kb-sop-block">
            <h2>${escapeHtml(i.title)}</h2>
            <ul class="kb-stepper-list">${(i.content || []).map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>
          </section>`,
          )
          .join('')}
      </div>`
    return pageShell(
      crumb([
        { href: '#/', label: t('common.home') },
        { href: '#/category/workflow', label: t('categories.workflow.title', null, '工作流程') },
        { label: t('kbMod.workflowKbTitle', null, '知识库管理') },
      ]),
      t('kbMod.workflowKbTitle', null, '知识库管理'),
      t('kbMod.workflowKbDesc', null, '日常积累、月度整理与检索习惯'),
      body,
    )
  }

  /* ---------- 速查知识库 / 知识图谱（已从知识库「快速参考」迁出） ---------- */

  function renderReferenceHub() {
    // 旧入口已下线，统一跳到速查
    return null
  }

  function renderGlossary() {
    const letters = itemsOf('reference')
      .filter((i) => i.kind === 'glossary-letter' || i.sourceId === 'keyword-index')
      .filter((i) => !/用法/.test(i.title))

    const letterKeys = letters.map((l) => l.title)
    const body = `
      <div class="kb-glossary">
        <nav class="kb-glossary-alpha" aria-label="字母索引">
          ${letterKeys
            .map(
              (L) =>
                `<button type="button" class="kb-glossary-chip" data-letter="${escapeHtml(L)}" aria-label="${escapeHtml(L)}">${escapeHtml(L)}</button>`,
            )
            .join('')}
        </nav>
        <div class="kb-glossary-panels">
          ${letters
            .map((letter) => {
              const terms = letter.terms?.length
                ? letter.terms
                : (letter.content || []).map((line) => {
                    const m = String(line).match(/^([^：:]+)[：:](.*?)(?:（(.+)）)?$/)
                    return m
                      ? { term: m[1], meaning: m[2], loc: m[3] || '' }
                      : { term: line, meaning: '', loc: '' }
                  })
              return `
              <section class="kb-glossary-panel" id="letter-${escapeHtml(letter.title)}">
                <h2 class="kb-glossary-letter">${escapeHtml(letter.title)}</h2>
                <div class="kb-glossary-terms">
                  ${terms
                    .map(
                      (tm) => `
                    <article class="kb-glossary-term">
                      <h3>${escapeHtml(tm.term)}</h3>
                      <p>${escapeHtml(tm.meaning || '')}</p>
                      ${tm.loc ? `<span class="kb-glossary-loc">${escapeHtml(tm.loc)}</span>` : ''}
                    </article>`,
                    )
                    .join('')}
                </div>
              </section>`
            })
            .join('')}
        </div>
      </div>`

    return pageShell(
      '',
      t('home.ctaKb', null, '速查知识库'),
      t('kbMod.refGlossaryDesc', null, '按字母速查术语定义与出处'),
      body,
      'kb-glossary-page',
    )
  }

  function renderMindmap() {
    const maps = itemsOf('reference').filter((i) => i.kind === 'mermaid' || i.sourceId === 'mindmap')
    const body = `
      <div class="kb-mindmap-stack">
        ${maps
          .map((m, idx) => {
            const code = (m.mermaid && m.mermaid[0]) || ''
            return `
            <section class="kb-mindmap-block">
              <h2>${escapeHtml(m.title)}</h2>
              <div class="kb-mermaid" data-mermaid-idx="${idx}">${escapeHtml(code)}</div>
            </section>`
          })
          .join('')}
      </div>`

    return pageShell(
      '',
      t('home.ctaMindmap', null, '知识图谱'),
      t('kbMod.refMindmapDesc', null, '六大主题全景'),
      body,
      'kb-mindmap-page',
    )
  }

  function getKbPathStages() {
    return window.PDMIndustry?.getKbPathStages?.() || []
  }

  function renderLearningPath() {
    // 4 阶段已迁至学习导航
    return null
  }

  /* ---------- 三级结构：文档 → 章节卡片 → 知识点 ---------- */

  function stripLeadingIndex(text) {
    return String(text || '')
      .replace(/^[（(]?\d+(?:\.\d+)*[）)]?[.、．\s]+/, '')
      .replace(/^第[一二三四五六七八九十]+部分[：:\s]*/, '')
      .trim()
  }

  /** 侧栏 / 路由用：一类类目下的二级文档 */
  const KB_DOCS = {
    methodology: [
      {
        id: 'product-methodology',
        title: '产品方法论',
        desc: '6 大体系：战略 / 用户 / 需求 / 设计 / 数据 / 协作',
        sourceId: 'product-methodology',
        layout: 'grouped',
        chapterMode: 'h1-num',
        maxChapter: 6,
        chapterMeta: {
          1: { title: '战略与定位', tagline: '决定「做对的事」', tags: '北极星指标 / 商业模式画布 / 价值主张画布 / OKR' },
          2: { title: '用户研究', tagline: '决定「对的人」', tags: '用户画像 / 同理心地图 / 用户旅程 / 可用性测试' },
          3: { title: '需求管理', tagline: '决定「做哪些」', tags: 'RICE / MoSCoW / 优先级矩阵 / 4 维度评估 / 砍需求' },
          4: { title: '设计与交付', tagline: '决定「做对」', tags: '用户故事 / IA / PRD 7 章节 / PRD 评审 checklist' },
          5: { title: '数据与增长', tagline: '决定「做得好」', tags: 'AARRR / 上瘾模型 / Cohort / NPS / A-B 测试' },
          6: { title: '协作与决策', tagline: '决定「和谁一起做」', tags: 'RACI / 鱼骨图 / 5Why / PDCA / 设计冲刺 / 复盘 8 步' },
        },
      },
      {
        id: 'pm-bagu',
        title: '产品经理八股',
        desc: '面试高频考点与答题框架速查',
        sourceId: 'pm-bagu',
        layout: 'grouped',
        chapterMode: 'section',
        skipSection: /待补充|相关词条/,
      },
    ],
    architecture: [
      {
        id: 'system-architecture',
        title: '系统架构',
        desc: 'PM 视角技术深度（必会架构问题）',
        sourceId: 'system-architecture',
        layout: 'grouped',
        chapterMode: 'h1-num',
        maxChapter: 10,
        skipSection: /关联文件|推荐阅读/,
      },
      {
        id: 'industry-terms',
        title: '行业通用词语',
        desc: '技术架构与机器人行业术语速查',
        sourceId: 'industry-terms',
        chapterMode: 'section',
        sectionInclude: /第一部分|第三部分/,
      },
    ],
    business: [
      {
        id: 'industry-terms-business',
        title: '业务管理',
        desc: '点开词条查看全称、定义与落地场景',
        sourceId: 'industry-terms',
        chapterMode: 'flat-items',
        sectionInclude: /第二部分/,
      },
    ],
    security: [
      {
        id: 'industry-terms-security',
        title: '权限与安全词语',
        desc: 'SSO、RBAC、账号映射与权限边界',
        sourceId: 'industry-terms',
        chapterMode: 'flat-items',
        sectionInclude: /第四部分/,
      },
    ],
  }

  function getDoc(catId, docId) {
    return (KB_DOCS[catId] || []).find((d) => d.id === docId) || null
  }

  function isGroupedDoc(catId, docId) {
    return getDoc(catId, docId)?.layout === 'grouped'
  }

  function getDocChapters(catId, docId) {
    const doc = getDoc(catId, docId)
    if (!doc) return []
    return listChapters(catId, doc)
  }

  function renderTopicCardGrid(catId, items) {
    if (!items?.length) {
      return `<p class="kb-empty kb-doc-group-empty">${escapeHtml(t('kbMod.emptyDoc', null, '该文档暂无章节内容'))}</p>`
    }
    return `
      <div class="sec-hub-grid kb-topic-card-grid">
        ${items
          .map(
            (item, i) => `
          <a href="#/article/${catId}/${encodeURIComponent(item.id)}" class="sec-hub-card kb-topic-sec-card">
            <span class="sec-hub-card-index">${String(i + 1).padStart(2, '0')}</span>
            <div class="sec-hub-card-body">
              <h2>${escapeHtml(stripLeadingIndex(item.title))}</h2>
              ${item.summary ? `<p>${escapeHtml(cardTaglineOf(item) || item.summary)}</p>` : ''}
            </div>
            <span class="sec-hub-card-arrow" aria-hidden="true">→</span>
          </a>`,
          )
          .join('')}
      </div>`
  }

  function renderDocGrouped(catId, docId) {
    const cat = getCat(catId)
    const doc = getDoc(catId, docId)
    if (!cat || !doc) return null
    const chapters = listChapters(catId, doc)

    const body = chapters.length
      ? chapters
          .map(
            (ch) => `
        <section class="kb-doc-group" id="group-${escapeHtml(String(ch.id))}">
          <header class="kb-doc-group-head">
            <span class="kb-doc-group-num">${String(ch.index).padStart(2, '0')}</span>
            <div class="kb-doc-group-copy">
              <h2>${escapeHtml(ch.title)}</h2>
              ${ch.tagline ? `<p class="kb-doc-group-tagline">${escapeHtml(ch.tagline)}</p>` : ''}
              ${ch.tags ? `<p class="kb-doc-group-tags">${escapeHtml(ch.tags)}</p>` : ''}
              <p class="kb-doc-group-count">${(ch.items || []).length} ${escapeHtml(t('kbMod.topics', null, '个知识点'))}</p>
            </div>
          </header>
          ${renderTopicCardGrid(catId, ch.items || [])}
        </section>`,
          )
          .join('')
      : `<p class="kb-empty">${escapeHtml(t('kbMod.emptyDoc', null, '该文档暂无章节内容'))}</p>`

    return pageShell('', doc.title, doc.desc, body, 'kb-doc-grouped-page')
  }

  /** 侧栏 / 知识库首页：扁平导航（方法论、架构子文档上移一级） */
  const KB_FLAT_DOC_CATS = new Set(['methodology', 'architecture'])

  function isFlatKbDoc(catId) {
    return KB_FLAT_DOC_CATS.has(catId)
  }

  function getKbNavLabel(catId, doc) {
    if (doc && isFlatKbDoc(catId)) return doc.title
    const cat = getCat(catId)
    return cat ? catTitle(cat) : doc?.title || catId
  }

  function getFlatKbNavEntries() {
    const entries = []
    for (const [catId, docs] of Object.entries(KB_DOCS)) {
      if (!docs?.length) continue
      if (isFlatKbDoc(catId)) {
        for (const d of docs) {
          entries.push({
            catId,
            docId: d.id,
            title: d.title,
            desc: d.desc || '',
            href: `#/doc/${catId}/${d.id}`,
            flat: true,
          })
        }
      } else {
        const d = docs[0]
        const cat = getCat(catId)
        entries.push({
          catId,
          docId: d.id,
          title: cat ? catTitle(cat) : d.title,
          desc: cat ? (cat.description || d.desc || '') : (d.desc || ''),
          href: docs.length === 1 ? `#/doc/${catId}/${d.id}` : `#/category/${catId}`,
          flat: false,
        })
      }
    }
    return entries
  }

  function docItems(catId, doc) {
    const docs = KB_DOCS[catId] || []
    const isPrimaryDoc = docs[0]?.id === doc.id
    let items = itemsOf(catId).filter((i) => {
      if (i.sourceId) return i.sourceId === doc.sourceId
      // 无 sourceId 的共享/补充条目挂到该类目首个文档，避免浏览时「消失」
      return isPrimaryDoc
    })
    if (doc.sectionInclude) {
      items = items.filter((i) => {
        if (!i.sourceId && !(i.section || '').trim()) return true
        return doc.sectionInclude.test(i.section || i.title || '')
      })
    }
    return items
  }

  function chapterKeyFromSection(section, mode) {
    if (!section) return null
    if (mode === 'h1-num') {
      const m = String(section).match(/^(\d+)\./)
      return m ? m[1] : null
    }
    return stripLeadingIndex(section) || section
  }

  function splitTitleParen(title) {
    const raw = stripLeadingIndex(title)
    const m = String(raw || '').match(/^(.+?)\s*[（(](.+?)[）)]\s*$/)
    if (!m) return { short: raw, expansion: '' }
    return { short: m[1].trim(), expansion: m[2].trim() }
  }

  function cardTitleOf(item) {
    if (item.fullName || item.fullNameZh) return stripLeadingIndex(item.title)
    return splitTitleParen(item.title).short
  }

  function cardTaglineOf(item) {
    let s = String(item.summary || '')
      .replace(/^定义[：:]\s*/, '')
      .replace(/[（(][^）)]*[）)]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (s.length > 36) s = `${s.slice(0, 36)}…`
    return s
  }

  function listChapters(catId, doc) {
    const items = docItems(catId, doc)
    if (doc.chapterMode === 'flat-items') {
      return items.map((item, idx) => ({
        id: item.id,
        title: cardTitleOf(item),
        tagline: cardTaglineOf(item),
        tags: '',
        count: 1,
        index: idx + 1,
        href: `#/article/${catId}/${encodeURIComponent(item.id)}`,
        isArticle: true,
      }))
    }

    const map = new Map()
    for (const item of items) {
      const raw = item.section || ''
      if (raw && doc.skipSection && doc.skipSection.test(raw)) continue
      let key = chapterKeyFromSection(raw, doc.chapterMode)
      if (!key) {
        key = '__ungrouped__'
      } else if (doc.chapterMode === 'h1-num') {
        const n = Number(key)
        if (doc.maxChapter && n > doc.maxChapter) continue
      }
      if (!map.has(key)) {
        const meta = doc.chapterMeta?.[key]
        const isUngrouped = key === '__ungrouped__'
        map.set(key, {
          id: key,
          title: isUngrouped
            ? t('kbMod.ungrouped', null, '未分组')
            : meta?.title || stripLeadingIndex(raw) || key,
          tagline: isUngrouped ? '' : meta?.tagline || '',
          tags: isUngrouped ? '' : meta?.tags || '',
          items: [],
          sort: isUngrouped
            ? 9999
            : doc.chapterMode === 'h1-num'
              ? Number(key)
              : map.size + 1,
        })
      }
      map.get(key).items.push(item)
    }

    return [...map.values()]
      .sort((a, b) => a.sort - b.sort)
      .map((ch, idx) => ({
        ...ch,
        index: idx + 1,
        count: ch.items.length,
        href: `#/chapter/${catId}/${doc.id}/${encodeURIComponent(ch.id)}`,
        isArticle: false,
      }))
  }

  function renderDocHub(catId) {
    const cat = getCat(catId)
    const docs = KB_DOCS[catId]
    if (!cat || !docs?.length) return null

    if (docs.length === 1) {
      // 单文档类目：直接进入章节卡片页
      return renderDocChapters(catId, docs[0].id)
    }

    const body = `
      <div class="kb-module-grid kb-module-grid-2">
        ${docs
          .map((d) => {
            const n = listChapters(catId, d).length
            return `
            <a href="#/doc/${catId}/${d.id}" class="kb-module-tile">
              <span class="kb-module-tile-meta">${n} ${escapeHtml(t('kbMod.chapters', null, '个章节'))}</span>
              <h2>${escapeHtml(d.title)}</h2>
              <p>${escapeHtml(d.desc)}</p>
            </a>`
          })
          .join('')}
      </div>`

    return pageShell(
      crumb([
        { href: '#/', label: t('common.home') },
        { label: catTitle(cat) },
      ]),
      catTitle(cat),
      t('kbMod.docHubDesc', null, '先选文档，再进入章节'),
      body,
    )
  }

  function renderDocChapters(catId, docId) {
    const cat = getCat(catId)
    const doc = getDoc(catId, docId)
    if (!cat || !doc) return null
    if (isGroupedDoc(catId, docId)) return renderDocGrouped(catId, docId)
    const chapters = listChapters(catId, doc)

    const body = chapters.length
      ? `
      <div class="sec-hub-grid">
        ${chapters
          .map(
            (ch) => `
          <a href="${ch.href}" class="sec-hub-card">
            <span class="sec-hub-card-index">${String(ch.index).padStart(2, '0')}</span>
            <div class="sec-hub-card-body">
              <h2>${escapeHtml(ch.title)}</h2>
              ${ch.tagline ? `<p>${escapeHtml(ch.tagline)}</p>` : ''}
              ${!ch.isArticle && ch.count
                ? `<span class="sec-hub-card-meta">${ch.count} ${escapeHtml(t('kbMod.topics', null, '个知识点'))}</span>`
                : ''}
            </div>
            <span class="sec-hub-card-arrow" aria-hidden="true">→</span>
          </a>`,
          )
          .join('')}
      </div>`
      : `<p class="kb-empty">${escapeHtml(t('kbMod.emptyDoc', null, '该文档暂无章节内容'))}</p>`

    const crumbs = [
      { href: '#/', label: t('common.home') },
      { href: `#/category/${catId}`, label: catTitle(cat) },
    ]
    if ((KB_DOCS[catId] || []).length > 1) {
      crumbs.push({ label: doc.title })
    }

    return pageShell(crumb(crumbs), doc.title, doc.desc, body, 'kb-doc-chapters sec-hub-page')
  }

  function renderChapterTopics(catId, docId, chapterId) {
    const cat = getCat(catId)
    const doc = getDoc(catId, docId)
    if (!cat || !doc) return null
    const chapters = listChapters(catId, doc)
    const ch = chapters.find((c) => String(c.id) === String(chapterId) || decodeURIComponent(String(c.id)) === decodeURIComponent(String(chapterId)))
    if (!ch) return null

    // flat-items 不应走到 chapter 路由
    const items = ch.items || docItems(catId, doc).filter((i) => {
      const key = chapterKeyFromSection(i.section || '', doc.chapterMode)
      return String(key) === String(chapterId)
    })

    const body = renderTopicCardGrid(catId, items)

    const crumbs = [
      { href: '#/', label: t('common.home') },
      { href: `#/category/${catId}`, label: catTitle(cat) },
    ]
    if ((KB_DOCS[catId] || []).length > 1) {
      crumbs.push({ href: `#/doc/${catId}/${docId}`, label: doc.title })
    }
    crumbs.push({ label: ch.title })

    return pageShell(
      crumb(crumbs),
      ch.title,
      ch.tagline || `${items.length} ${t('kbMod.topics', null, '个知识点')}`,
      body,
      'kb-chapter-topics',
    )
  }

  function renderCategorySmart(categoryId) {
    if (categoryId === 'workflow') return renderWorkflowHub()
    if (categoryId === 'reference') return null
    if (KB_DOCS[categoryId]) return renderDocHub(categoryId)
    const cat = getCat(categoryId)
    if (!cat) return null
    return renderDocHub(categoryId)
  }

  function renderModule(catId, moduleId) {
    if (catId === 'workflow') {
      if (moduleId === 'demand') return renderWorkflowDemand()
      if (moduleId === 'prd') return renderWorkflowPrd()
      if (moduleId === 'collab') return renderWorkflowCollab()
      if (moduleId === 'kb') return renderWorkflowKb()
    }
    if (catId === 'reference') {
      if (moduleId === 'glossary') return renderGlossary()
      if (moduleId === 'mindmap') return renderMindmap()
      if (moduleId === 'path') return renderLearningPath()
    }
    return null
  }

  function renderDoc(catId, docId) {
    return renderDocChapters(catId, docId)
  }

  function renderChapter(catId, docId, chapterId) {
    return renderChapterTopics(catId, docId, chapterId)
  }

  function getSidebarDocs() {
    return KB_DOCS
  }

  function getChapterLabel(catId, docId, chapterId) {
    const doc = getDoc(catId, docId)
    if (!doc) return stripLeadingIndex(decodeURIComponent(String(chapterId || '')))
    const decoded = decodeURIComponent(String(chapterId || ''))
    const ch = listChapters(catId, doc).find(
      (c) => String(c.id) === String(chapterId) || String(c.id) === decoded,
    )
    return ch?.title || stripLeadingIndex(decoded)
  }

  async function ensureMermaid() {
    if (window.mermaid) return window.mermaid
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
      s.onload = resolve
      s.onerror = reject
      document.head.appendChild(s)
    })
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      mindmap: { padding: 12 },
    })
    return window.mermaid
  }

  function bindGlossaryAlphaNav() {
    const nav = document.querySelector('.kb-glossary-alpha')
    if (!nav) return
    nav.addEventListener('click', (e) => {
      const chip = e.target.closest('.kb-glossary-chip[data-letter]')
      if (!chip) return
      const letter = chip.getAttribute('data-letter')
      if (!letter) return
      const panel = document.getElementById(`letter-${letter}`)
      if (!panel) return
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
      nav.querySelectorAll('.kb-glossary-chip.is-active').forEach((el) => el.classList.remove('is-active'))
      chip.classList.add('is-active')
    })
  }

  async function bindModulePage() {
    bindGlossaryAlphaNav()
    const nodes = document.querySelectorAll('.kb-mermaid')
    if (!nodes.length) return
    try {
      const mermaid = await ensureMermaid()
      for (const el of nodes) {
        const code = el.textContent || ''
        if (!code.trim()) continue
        const id = `mmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const { svg } = await mermaid.render(id, code)
        el.innerHTML = svg
      }
    } catch (e) {
      console.warn('mermaid render failed', e)
      nodes.forEach((el) => {
        el.innerHTML = `<pre class="kb-mod-pre">${escapeHtml(el.textContent || '')}</pre>`
      })
    }
  }

  window.PDMKnowledgeViews = {
    renderCategorySmart,
    renderModule,
    renderDoc,
    renderChapter,
    renderGlossary,
    renderMindmap,
    getSidebarDocs,
    getDoc,
    getDocChapters,
    isGroupedDoc,
    getFlatKbNavEntries,
    getKbNavLabel,
    isFlatKbDoc,
    buildKbCrumbs,
    resolveArticleTrail,
    kbDocLabel,
    getChapterLabel,
    bindModulePage,
    stripLeadingIndex,
    splitTitleParen,
    getKbPathStages,
  }
})()
