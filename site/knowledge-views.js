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

  function pageShell(crumbs, title, desc, body, extraClass = '') {
    return `
      <div class="page kb-module-page ${extraClass}">
        <header class="page-header">
          ${crumbs}
        </header>
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

  /* ---------- 工作流程 ---------- */

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
      {
        id: 'retro',
        href: '#/module/workflow/retro',
        title: t('kbMod.workflowRetroTitle', null, '复盘 SOP'),
        desc: t('kbMod.workflowRetroDesc', null, '周复盘节奏、8 步流程与复盘表字段'),
        meta: 'SOP',
        kind: 'sop',
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
      <div class="kb-module-grid kb-module-grid-3">
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
      t('kbMod.workflowHubDesc', null, '按文档架构分成步骤、模板与复盘三大模块'),
      body,
      'kb-workflow-hub',
    )
  }

  function renderWorkflowDemand() {
    const steps = bySection(itemsOf('workflow'), /需求处理/)
      .filter((i) => i.kind === 'workflow-step')
      .sort((a, b) => String(a.title).localeCompare(String(b.title), 'zh'))

    // sort by leading number in id/title
    steps.sort((a, b) => {
      const na = parseInt((a.id.match(/-(\d)-/) || [])[1] || '99', 10)
      const nb = parseInt((b.id.match(/-(\d)-/) || [])[1] || '99', 10)
      return na - nb
    })

    const body = `
      <ol class="kb-stepper">
        ${steps
          .map(
            (s, idx) => `
          <li class="kb-stepper-item">
            <div class="kb-stepper-index">${String(idx + 1).padStart(2, '0')}</div>
            <div class="kb-stepper-body">
              <h2>${escapeHtml(s.title.replace(/^\d+\.\s*/, ''))}</h2>
              <ul class="kb-stepper-list">
                ${(s.content || []).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
              </ul>
              <a class="kb-stepper-detail" href="#/article/workflow/${s.id}">${escapeHtml(t('kbMod.viewDetail', null, '查看详情'))}</a>
            </div>
          </li>`,
          )
          .join('')}
      </ol>`

    return pageShell(
      crumb([
        { href: '#/', label: t('common.home') },
        { href: '#/category/workflow', label: t('categories.workflow.title', null, '工作流程') },
        { label: t('kbMod.workflowDemandTitle', null, '需求处理 7 步') },
      ]),
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

  function renderWorkflowRetro() {
    const items = bySection(itemsOf('workflow'), /复盘/)
    const ordered = [...items].sort((a, b) => {
      const rank = (x) => {
        if (/默认节奏/.test(x.title)) return 1
        if (/8\s*步/.test(x.title)) return 2
        if (/11\s*字段|字段/.test(x.title)) return 3
        if (/产物/.test(x.title)) return 4
        if (/关联/.test(x.title)) return 5
        return 9
      }
      return rank(a) - rank(b)
    })

    const body = `
      <div class="kb-sop-stack">
        ${ordered
          .map((item) => {
            const isSteps = /8\s*步/.test(item.title)
            const isTable = /字段/.test(item.title)
            return `
            <section class="kb-sop-block">
              <h2>${escapeHtml(item.title)}</h2>
              ${
                isSteps
                  ? `<ol class="kb-sop-steps">${(item.content || []).map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ol>`
                  : isTable
                    ? `<div class="kb-sop-table">${(item.content || [])
                        .map((l) => {
                          const [k, ...rest] = String(l).split(/[：:=]/)
                          const v = rest.join('：') || ''
                          return `<div class="kb-sop-row"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`
                        })
                        .join('')}</div>`
                    : renderLines(item.content)
              }
            </section>`
          })
          .join('')}
      </div>`

    return pageShell(
      crumb([
        { href: '#/', label: t('common.home') },
        { href: '#/category/workflow', label: t('categories.workflow.title', null, '工作流程') },
        { label: t('kbMod.workflowRetroTitle', null, '复盘 SOP') },
      ]),
      t('kbMod.workflowRetroTitle', null, '复盘 SOP'),
      t('kbMod.workflowRetroDesc', null, '周复盘节奏、8 步流程与复盘表字段'),
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

  /* ---------- 快速参考 ---------- */

  function renderReferenceHub() {
    const cat = getCat('reference')
    if (!cat) return null
    const modules = [
      {
        href: '#/module/reference/glossary',
        title: t('kbMod.refGlossaryTitle', null, '关键词速查'),
        desc: t('kbMod.refGlossaryDesc', null, '按字母速查 30+ 术语定义与出处'),
        meta: 'A–Z',
        kind: 'glossary',
      },
      {
        href: '#/module/reference/mindmap',
        title: t('kbMod.refMindmapTitle', null, '知识图谱'),
        desc: t('kbMod.refMindmapDesc', null, '六大主题与学习路径、需求流程全景图'),
        meta: 'map',
        kind: 'map',
      },
      {
        href: '#/module/reference/path',
        title: t('kbMod.refPathTitle', null, '学习路径'),
        desc: t('kbMod.refPathDesc', null, '4 阶段 8 周路径：必读、输出与检验'),
        meta: 'path',
        kind: 'path',
      },
    ]
    const body = `
      <div class="kb-module-grid kb-module-grid-3">
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
      </div>`

    return pageShell(
      crumb([
        { href: '#/', label: t('common.home') },
        { label: catTitle(cat) },
      ]),
      catTitle(cat),
      t('kbMod.refHubDesc', null, '关键词 · 图谱 · 路径，按用途进入对应板块'),
      body,
      'kb-reference-hub',
    )
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
                `<a href="#letter-${encodeURIComponent(L)}" class="kb-glossary-chip">${escapeHtml(L)}</a>`,
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
      crumb([
        { href: '#/', label: t('common.home') },
        { href: '#/category/reference', label: t('categories.reference.title', null, '快速参考') },
        { label: t('kbMod.refGlossaryTitle', null, '关键词速查') },
      ]),
      t('kbMod.refGlossaryTitle', null, '关键词速查'),
      t('kbMod.refGlossaryDesc', null, '按字母速查术语'),
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
      crumb([
        { href: '#/', label: t('common.home') },
        { href: '#/category/reference', label: t('categories.reference.title', null, '快速参考') },
        { label: t('kbMod.refMindmapTitle', null, '知识图谱') },
      ]),
      t('kbMod.refMindmapTitle', null, '知识图谱'),
      t('kbMod.refMindmapDesc', null, '六大主题全景'),
      body,
      'kb-mindmap-page',
    )
  }

  function renderLearningPath() {
    const stages = itemsOf('reference')
      .filter((i) => i.kind === 'path-stage' || i.sourceId === 'learning-path')
      .filter((i) => /阶段|进阶/.test(i.title))
    const extras = itemsOf('reference').filter(
      (i) => (i.kind === 'path-stage' || i.sourceId === 'learning-path') && !/阶段|进阶/.test(i.title),
    )

    const body = `
      <div class="kb-path">
        <ol class="kb-path-track">
          ${stages
            .map(
              (s, idx) => `
            <li class="kb-path-node">
              <div class="kb-path-dot">${idx + 1}</div>
              <div class="kb-path-card">
                <h2>${escapeHtml(stripLeadingIndex(s.title))}</h2>
                ${renderLines(s.content)}
              </div>
            </li>`,
            )
            .join('')}
        </ol>
        ${
          extras.length
            ? `<section class="kb-path-extras">
                ${extras
                  .map(
                    (e) => `
                  <article class="kb-sop-block">
                    <h2>${escapeHtml(stripLeadingIndex(e.title))}</h2>
                    ${renderLines(e.content)}
                  </article>`,
                  )
                  .join('')}
              </section>`
            : ''
        }
      </div>`

    return pageShell(
      crumb([
        { href: '#/', label: t('common.home') },
        { href: '#/category/reference', label: t('categories.reference.title', null, '快速参考') },
        { label: t('kbMod.refPathTitle', null, '学习路径') },
      ]),
      t('kbMod.refPathTitle', null, '学习路径'),
      t('kbMod.refPathDesc', null, '4 阶段 8 周路径'),
      body,
      'kb-path-page',
    )
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
        title: '业务管理词语',
        desc: 'ERP / CRM / SCM / OA / IPD 等',
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

  function docItems(catId, doc) {
    let items = itemsOf(catId).filter((i) => i.sourceId === doc.sourceId)
    if (doc.sectionInclude) {
      items = items.filter((i) => doc.sectionInclude.test(i.section || i.title || ''))
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

  function listChapters(catId, doc) {
    const items = docItems(catId, doc)
    if (doc.chapterMode === 'flat-items') {
      return items.map((item, idx) => ({
        id: item.id,
        title: stripLeadingIndex(item.title),
        tagline: item.summary || '',
        tags: (item.tags || []).slice(0, 4).join(' / '),
        count: 1,
        index: idx + 1,
        href: `#/article/${catId}/${encodeURIComponent(item.id)}`,
        isArticle: true,
      }))
    }

    const map = new Map()
    for (const item of items) {
      const raw = item.section || ''
      if (doc.skipSection && doc.skipSection.test(raw)) continue
      const key = chapterKeyFromSection(raw, doc.chapterMode)
      if (!key) continue
      if (doc.chapterMode === 'h1-num') {
        const n = Number(key)
        if (doc.maxChapter && n > doc.maxChapter) continue
      }
      if (!map.has(key)) {
        const meta = doc.chapterMeta?.[key]
        map.set(key, {
          id: key,
          title: meta?.title || stripLeadingIndex(raw),
          tagline: meta?.tagline || '',
          tags: meta?.tags || '',
          items: [],
          sort: doc.chapterMode === 'h1-num' ? Number(key) : map.size + 1,
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
    const chapters = listChapters(catId, doc)

    const body = chapters.length
      ? `
      <div class="kb-chapter-grid">
        ${chapters
          .map(
            (ch) => `
          <a href="${ch.href}" class="kb-chapter-card">
            <span class="kb-chapter-index">${String(ch.index).padStart(2, '0')}</span>
            <div class="kb-chapter-body">
              <h2>${escapeHtml(ch.title)}</h2>
              ${ch.tagline ? `<p class="kb-chapter-tagline">${escapeHtml(ch.tagline)}</p>` : ''}
              ${ch.tags ? `<p class="kb-chapter-tags">${escapeHtml(ch.tags)}</p>` : ''}
              ${!ch.isArticle ? `<span class="kb-chapter-count">${ch.count} ${escapeHtml(t('kbMod.topics', null, '个知识点'))}</span>` : ''}
            </div>
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

    return pageShell(crumb(crumbs), doc.title, doc.desc, body, 'kb-doc-chapters')
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

    const body = `
      <div class="kb-topic-list">
        ${items
          .map(
            (item, i) => `
          <a href="#/article/${catId}/${encodeURIComponent(item.id)}" class="kb-topic-card">
            <span class="kb-topic-index">${String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3>${escapeHtml(stripLeadingIndex(item.title))}</h3>
              <p>${escapeHtml(item.summary || '')}</p>
            </div>
          </a>`,
          )
          .join('')}
      </div>`

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
    if (categoryId === 'reference') return renderReferenceHub()
    if (KB_DOCS[categoryId]) return renderDocHub(categoryId)
    const cat = getCat(categoryId)
    if (!cat) return null
    return renderDocHub(categoryId)
  }

  function renderModule(catId, moduleId) {
    if (catId === 'workflow') {
      if (moduleId === 'demand') return renderWorkflowDemand()
      if (moduleId === 'prd') return renderWorkflowPrd()
      if (moduleId === 'retro') return renderWorkflowRetro()
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

  async function bindModulePage() {
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
    getSidebarDocs,
    getChapterLabel,
    bindModulePage,
    stripLeadingIndex,
  }
})()
