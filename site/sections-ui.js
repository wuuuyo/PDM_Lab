/**
 * 行业认知 / 工具库 / 论坛 页面渲染
 */
;(function () {
  const Industry = () => window.PDMIndustry
  const Tools = () => window.PDMTools
  const Forum = () => window.PDMForum
  const tr = (key, params, fallback) => window.PMLabI18n?.t(key, params, fallback) ?? fallback ?? key
  const ui = (group, key, params) => tr(`content.${group}.${key}`, params)

  function pathStageVisual(kind) {
    const visuals = {
      seed: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="40" r="14" fill="rgba(45,90,74,0.12)"/><path d="M32 48V22" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M32 28c8-10 16-8 18-2-8 2-14 8-18 14z" fill="rgba(45,90,74,0.35)"/><path d="M32 28c-8-10-16-8-18-2 8 2 14 8 18 14z" fill="rgba(45,90,74,0.22)"/></svg>`,
      book: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="14" y="16" width="36" height="34" rx="4" fill="rgba(45,90,74,0.1)" stroke="currentColor" stroke-width="2"/><path d="M20 24h24M20 32h18M20 40h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
      layers: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M32 12l22 12-22 12L10 24 32 12z" fill="rgba(45,90,74,0.18)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 32l22 12 22-12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 40l22 12 22-12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      rocket: `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M34 10c10 8 14 20 12 30L34 52 22 40C12 38 10 26 18 16L34 10z" fill="rgba(45,90,74,0.14)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="36" cy="28" r="4" fill="currentColor"/><path d="M22 40l-8 14 14-8M42 20l8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    }
    return visuals[kind] || visuals.book
  }

  function renderLearningPathCards(paths) {
    return paths
      .map((p, i) => {
        const desc = p.cardDesc || p.summary || ''
        const featured = p.layout === 'stages'
        return `
      <a href="#/industry/learning-path/${p.id}" class="sec-hub-card path-pick-card ${featured ? 'path-pick-card-featured' : ''}">
        <span class="sec-hub-card-index">${String(i + 1).padStart(2, '0')}</span>
        <div class="sec-hub-card-body">
          <div class="path-pick-title-row">
            <h2>${window.escapeHtml(p.title)}</h2>
            ${p.badge ? `<span class="path-pick-badge">${window.escapeHtml(p.badge)}</span>` : ''}
          </div>
          <p>${window.escapeHtml(desc)}</p>
          <span class="sec-hub-card-meta">${window.escapeHtml(p.duration)}${p.weeklyHours ? ` · ${window.escapeHtml(p.weeklyHours)}` : ''}</span>
        </div>
        <span class="sec-hub-card-arrow" aria-hidden="true">→</span>
      </a>`
      })
      .join('')
  }

  function renderLearningPathPhase(pathId, phase, index, progress) {
    const visual = phase.visual
      ? `<div class="path-phase-visual" aria-hidden="true">${pathStageVisual(phase.visual)}</div>`
      : `<span class="path-phase-num">${String(index + 1).padStart(2, '0')}</span>`
    return `
      <div class="learning-path-phase ${phase.visual ? 'learning-path-phase-visual' : ''}">
        <div class="learning-path-phase-head">
          ${visual}
          <div>
            <span class="path-phase-week">${window.escapeHtml(phase.week)}</span>
            <h3>${window.escapeHtml(phase.title)}</h3>
            <p class="path-phase-goal">${window.escapeHtml(phase.goal)}</p>
          </div>
        </div>
        <ul class="path-task-list">
          ${phase.tasks
            .map(
              (task, taskIdx) => {
                const done = Boolean(progress?.[`${index}:${taskIdx}`])
                const links = Array.isArray(task.links) && task.links.length
                  ? task.links
                  : (task.link ? [task.link] : [])
                return `
            <li class="path-task-row ${done ? 'is-done' : ''}">
              <label class="path-task-check">
                <input type="checkbox" class="path-task-checkbox" data-path-id="${window.escapeHtml(pathId)}" data-phase="${index}" data-task="${taskIdx}" ${done ? 'checked' : ''} />
                <span class="path-task-check-ui" aria-hidden="true"></span>
                <span class="path-task-text">${window.escapeHtml(task.text)}</span>
              </label>
              ${links.length ? `
                <span class="path-task-actions">
                  ${links.map((link) => {
                    const href = window.PDMRouteResolver?.resolveHref?.(link.href, `${task.text || ''} ${link.label || ''}`) || link.href
                    return `<a href="${window.escapeHtml(href)}" class="path-task-btn">${window.escapeHtml(link.label)}</a>`
                  }).join('')}
                </span>` : ''}
            </li>`
              },
            )
            .join('')}
        </ul>
        <div class="path-milestone">
          <strong>${window.escapeHtml(ui('industryUi', 'milestoneLabel'))}</strong>
          <span>${window.escapeHtml(phase.milestone)}</span>
        </div>
      </div>`
  }

  function renderPathProgressBar(path) {
    const { done, total } = window.PDMStorage?.countPathProgress?.(path) || { done: 0, total: 0 }
    const pct = total ? Math.round((done / total) * 100) : 0
    return `
      <div class="path-progress-panel" aria-label="${window.escapeHtml(ui('industryUi', 'progressLabel'))}">
        <div class="path-progress-head">
          <span>${window.escapeHtml(ui('industryUi', 'progressLabel'))}</span>
          <strong>${window.escapeHtml(ui('industryUi', 'progressCount', { done, total }))}</strong>
        </div>
        <div class="path-progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="path-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>`
  }

  function bindLearningPathDetail(pathId) {
    document.querySelectorAll('.path-task-checkbox').forEach((input) => {
      input.addEventListener('change', async () => {
        const pid = input.dataset.pathId
        const pi = Number(input.dataset.phase)
        const ti = Number(input.dataset.task)
        if (!pid || Number.isNaN(pi) || Number.isNaN(ti)) return
        await window.PDMStorage?.togglePathTask?.(pid, pi, ti)
        const path = Industry().getLearningPath(pid)
        const panel = document.querySelector('.path-progress-panel')
        if (panel && path) {
          panel.outerHTML = renderPathProgressBar(path)
        }
        if (path && input.checked) {
          const { done, total } = window.PDMStorage?.countPathProgress?.(path) || { done: 0, total: 0 }
          window.PDMNotifications?.notifyPathProgress?.(path, done, total)
        }
        input.closest('.path-task-row')?.classList.toggle('is-done', input.checked)
      })
    })
  }

  const INDUSTRY_HUB_ORDER = [
    { id: 'basics', titleKey: 'sectionBasics', descKey: 'sectionBasicsDesc' },
    { id: 'sub-roles', titleKey: 'sectionRoles', descKey: 'sectionRolesDesc' },
    { id: 'learning-path', titleKey: 'sectionPaths', descKey: 'sectionPathsDesc' },
  ]

  const OVERVIEW_SECTION_IDS = ['basics', 'sub-roles']

  function industrySectionMeta(id) {
    if (id === 'overview') {
      return { id: 'overview', titleKey: 'sectionOverview', descKey: 'sectionOverviewDesc' }
    }
    return INDUSTRY_HUB_ORDER.find((s) => s.id === id) || null
  }

  function overviewItemCount() {
    return OVERVIEW_SECTION_IDS.reduce((n, sid) => n + (Industry().getSection(sid)?.items?.length || 0), 0)
  }

  function resolveOverviewTab(preferred) {
    if (preferred && OVERVIEW_SECTION_IDS.includes(preferred)) return preferred
    try {
      const q = new URLSearchParams((location.hash.split('?')[1] || '').replace(/#.*$/, ''))
      const tab = q.get('tab')
      if (tab && OVERVIEW_SECTION_IDS.includes(tab)) return tab
    } catch (_) {}
    return 'basics'
  }

  function renderOverviewTabs(activeId) {
    const tabs = [
      { id: 'basics', titleKey: 'sectionBasics' },
      { id: 'sub-roles', titleKey: 'sectionRoles' },
    ]
    return `
      <div class="industry-overview-tabs" role="tablist" aria-label="${window.escapeHtml(ui('industryUi', 'sectionOverview'))}">
        ${tabs
          .map((tab) => {
            const on = tab.id === activeId
            return `
            <button type="button"
              class="industry-overview-tab${on ? ' is-active' : ''}"
              role="tab"
              id="overview-tab-${window.escapeHtml(tab.id)}"
              data-overview-tab="${window.escapeHtml(tab.id)}"
              aria-selected="${on ? 'true' : 'false'}"
              aria-controls="overview-panel-${window.escapeHtml(tab.id)}">
              ${window.escapeHtml(ui('industryUi', tab.titleKey))}
            </button>`
          })
          .join('')}
      </div>`
  }

  function renderOverviewPanel(sectionId) {
    const meta = {
      basics: { titleKey: 'sectionBasics', descKey: 'sectionBasicsDesc' },
      'sub-roles': { titleKey: 'sectionRoles', descKey: 'sectionRolesDesc' },
    }[sectionId]
    const sec = Industry().getSection(sectionId)
    if (!meta || !sec?.items?.length) {
      return `<p class="empty-hint">${window.escapeHtml(ui('industryUi', 'notFound'))}</p>`
    }
    return `
      <section class="industry-overview-group" id="overview-panel-${window.escapeHtml(sectionId)}" role="tabpanel" aria-labelledby="overview-tab-${window.escapeHtml(sectionId)}">
        <header class="industry-overview-head">
          <div>
            <h2>${window.escapeHtml(ui('industryUi', meta.titleKey))}</h2>
            <p>${window.escapeHtml(ui('industryUi', meta.descKey))}</p>
          </div>
        </header>
        <div class="industry-overview-articles">
          ${sec.items.map((item) => renderOverviewArticle(item)).join('')}
        </div>
      </section>`
  }

  function renderOverviewArticle(item) {
    const paragraphs = item.content || []
    return `
      <article class="industry-overview-article" id="overview-${window.escapeHtml(item.id)}">
        <h3 class="industry-overview-article-title">${window.escapeHtml(item.title)}</h3>
        ${item.summary ? `<p class="industry-overview-article-lead">${window.escapeHtml(item.summary)}</p>` : ''}
        ${
          paragraphs.length
            ? `<div class="industry-overview-article-body">
          ${paragraphs
            .map((p, i) => `<p class="${i === 0 && !item.summary ? 'industry-overview-article-lead' : ''}">${window.escapeHtml(p)}</p>`)
            .join('')}
        </div>`
            : ''
        }
      </article>`
  }

  function bindOverviewTabs(initialTab) {
    const root = document.querySelector('.industry-overview-page')
    if (!root) return
    const tabs = root.querySelectorAll('[data-overview-tab]')
    const panel = root.querySelector('#industry-overview-panel')
    if (!tabs.length || !panel) return

    let activeId = resolveOverviewTab(initialTab)

    const paint = (id) => {
      activeId = id
      tabs.forEach((tab) => {
        const on = tab.dataset.overviewTab === activeId
        tab.classList.toggle('is-active', on)
        tab.setAttribute('aria-selected', on ? 'true' : 'false')
      })
      panel.innerHTML = renderOverviewPanel(activeId)
      const next = `#/industry/overview?tab=${encodeURIComponent(activeId)}`
      if (location.hash !== next) history.replaceState(null, '', next)
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const id = tab.dataset.overviewTab
        if (!id || id === activeId) return
        paint(id)
      })
    })

    paint(activeId)
  }

  function renderIndustryHub() {
    const pathCount = Industry().getLearningPaths().length
    const cards = INDUSTRY_HUB_ORDER.map((plate, index) => {
      const meta =
        plate.id === 'learning-path'
          ? ui('industryUi', 'pathCount', { n: pathCount })
          : ui('industryUi', 'itemCount', { n: Industry().getSection(plate.id)?.items?.length || 0 })
      return `
        <a href="#/industry/${plate.id}" class="learning-nav-lane learning-nav-lane-${window.escapeHtml(plate.id)}">
          <span class="learning-nav-index">${String(index + 1).padStart(2, '0')}</span>
          <div class="learning-nav-copy">
            <h2>${window.escapeHtml(ui('industryUi', plate.titleKey))}</h2>
            <p>${window.escapeHtml(ui('industryUi', plate.descKey))}</p>
          </div>
          <span class="learning-nav-meta">${window.escapeHtml(meta)}</span>
          <span class="learning-nav-arrow" aria-hidden="true">→</span>
        </a>`
    }).join('')
    return `
      <div class="page sec-hub-page industry-page">
        <header class="sec-hub-hero">
          <p class="sec-hub-eyebrow">${window.escapeHtml(ui('industryUi', 'badge'))}</p>
          <h1>${window.escapeHtml(ui('industryUi', 'hubTitle'))}</h1>
          <p class="sec-hub-desc">${window.escapeHtml(ui('industryUi', 'hubDesc'))}</p>
        </header>
        <div class="learning-nav-board">${cards}</div>
      </div>`
  }

  function renderIndustrySection(sectionId) {
    const meta = industrySectionMeta(sectionId)
    if (!meta) {
      return `<div class="page"><p>${window.escapeHtml(ui('industryUi', 'notFound'))}</p><a href="#/industry">${window.escapeHtml(tr('common.back'))}</a></div>`
    }

    const title = ui('industryUi', meta.titleKey)
    const desc = ui('industryUi', meta.descKey)

    if (sectionId === 'learning-path') {
      const paths = Industry().getLearningPaths()
      const primary = paths.filter((p) => p.layout === 'stages')
      const scenarios = paths.filter((p) => p.layout !== 'stages')
      return `
        <div class="page sec-hub-page industry-page">
          <header class="sec-hub-hero">
            <h1>${window.escapeHtml(title)}</h1>
            <p class="sec-hub-desc">${window.escapeHtml(desc)}</p>
          </header>
          ${
            primary.length
              ? `<section class="path-hub-block">
            <div class="path-hub-block-head">
              <h2>${window.escapeHtml(ui('industryUi', 'kbPathGroupTitle'))}</h2>
              <p>${window.escapeHtml(ui('industryUi', 'kbPathGroupDesc'))}</p>
            </div>
            <div class="sec-hub-grid path-pick-grid">${renderLearningPathCards(primary)}</div>
          </section>`
              : ''
          }
          ${
            scenarios.length
              ? `<section class="path-hub-block">
            <div class="path-hub-block-head">
              <h2>${window.escapeHtml(ui('industryUi', 'scenarioPathGroupTitle'))}</h2>
              <p>${window.escapeHtml(ui('industryUi', 'scenarioPathGroupDesc'))}</p>
            </div>
            <div class="sec-hub-grid path-pick-grid">${renderLearningPathCards(scenarios)}</div>
          </section>`
              : ''
          }
        </div>`
    }

    if (sectionId === 'overview') {
      const activeTab = resolveOverviewTab(OVERVIEW_SECTION_IDS.includes(sectionId) ? sectionId : null)
      return `
        <div class="page sec-hub-page industry-page industry-overview-page">
          <header class="sec-hub-hero industry-overview-hero">
            <h1>${window.escapeHtml(title)}</h1>
            <p class="sec-hub-desc">${window.escapeHtml(desc)}</p>
          </header>
          ${renderOverviewTabs(activeTab)}
          <div class="industry-overview-stack" id="industry-overview-panel">
            ${renderOverviewPanel(activeTab)}
          </div>
        </div>`
    }

    const sec = Industry().getSection(sectionId)
    if (!sec) {
      return `<div class="page"><p>${window.escapeHtml(ui('industryUi', 'notFound'))}</p><a href="#/industry">${window.escapeHtml(tr('common.back'))}</a></div>`
    }

    return `
      <div class="page sec-hub-page industry-page">
        <header class="sec-hub-hero">
          <h1>${window.escapeHtml(title)}</h1>
          <p class="sec-hub-desc">${window.escapeHtml(desc)}</p>
        </header>
        <div class="sec-hub-grid">
          ${sec.items.map((item, i) => `
            <a href="#/industry/${sec.id}/${item.id}" class="sec-hub-card">
              <span class="sec-hub-card-index">${String(i + 1).padStart(2, '0')}</span>
              <div class="sec-hub-card-body">
                <h2>${window.escapeHtml(item.title)}</h2>
                <p>${window.escapeHtml(item.summary)}</p>
              </div>
              <span class="sec-hub-card-arrow" aria-hidden="true">→</span>
            </a>`).join('')}
        </div>
      </div>`
  }

  function renderLearningPathDetail(pathId) {
    const path = Industry().getLearningPath(pathId)
    if (!path) return `<div class="page"><p>${window.escapeHtml(ui('industryUi', 'notFound'))}</p><a href="#/industry">${window.escapeHtml(tr('common.back'))}</a></div>`
    const isStages = path.layout === 'stages'
    const progress = window.PDMStorage?.loadPathProgress?.(pathId) || {}
    return `
      <div class="page learning-path-page industry-page ${isStages ? 'learning-path-stages' : ''}" data-path-id="${window.escapeHtml(pathId)}">
        <header class="page-hero-block">
          ${path.badge ? `<span class="hero-badge">${window.escapeHtml(path.badge)}</span>` : ''}
          <h1>${window.escapeHtml(path.title)}</h1>
          <p>${window.escapeHtml(path.summary || path.cardDesc || '')}</p>
          <div class="learning-path-meta learning-path-meta-hero">
            <span>${window.escapeHtml(ui('industryUi', 'durationPrefix'))}${window.escapeHtml(path.duration)}</span>
            <span>${window.escapeHtml(path.weeklyHours)}</span>
          </div>
        </header>

        ${renderPathProgressBar(path)}

        <section class="section">
          <h2 class="section-title">${window.escapeHtml(ui('industryUi', 'outcomesTitle'))}</h2>
          <ul class="path-outcomes ${isStages ? 'path-outcomes-compact' : ''}">
            ${path.outcomes.map((o) => `<li>${window.escapeHtml(o)}</li>`).join('')}
          </ul>
        </section>

        <section class="section">
          <h2 class="section-title">${window.escapeHtml(ui('industryUi', 'phasesTitle'))}</h2>
          <div class="learning-path-timeline ${isStages ? 'learning-path-timeline-stages' : ''}">
            ${path.phases.map((ph, i) => renderLearningPathPhase(pathId, ph, i, progress)).join('')}
          </div>
        </section>

        <section class="sec-hub-path path-more-section">
          <div class="sec-hub-path-head">
            <h2>${window.escapeHtml(ui('industryUi', 'otherPathsTitle'))}</h2>
          </div>
          <div class="sec-hub-grid path-pick-grid">
            ${renderLearningPathCards(Industry().getLearningPaths().filter((p) => p.id !== pathId))}
          </div>
        </section>
      </div>`
  }

  function renderIndustryArticle(sectionId, itemId) {
    const sec = Industry().getSection(sectionId)
    const item = Industry().getItem(sectionId, itemId)
    if (!sec || !item) return `<div class="page"><p>${window.escapeHtml(ui('industryUi', 'notFound'))}</p><a href="#/industry">${window.escapeHtml(tr('common.back'))}</a></div>`
    const meta = industrySectionMeta(sectionId)
    const secLabel = meta ? ui('industryUi', meta.titleKey) : sec.title
    const secHref = `#/industry/${sectionId}`
    return `
      <div class="page article-page industry-page">
        <article class="article-content">
          <div class="article-meta"><span class="article-category">${window.escapeHtml(secLabel)}</span></div>
          <h1>${window.escapeHtml(item.title)}</h1>
          <p class="article-summary">${window.escapeHtml(item.summary)}</p>
          <div class="article-body">${item.content.map((p) => `<p>${window.escapeHtml(p)}</p>`).join('')}</div>
        </article>
      </div>`
  }

  function toolsTabLabel(cat) {
    return tr(`content.toolsUi.tabs.${cat.id}`, null, cat.tabLabel || cat.title)
  }

  function renderToolCard(tool, showCategory) {
    const externalHint = tool.networkHint
      ? `<p class="tool-card-external-hint">${window.escapeHtml(ui('toolsUi', 'externalHint'))}</p>`
      : ''
    return `
      <article class="tool-card">
        <div class="tool-card-main">
          ${showCategory ? `<span class="tool-card-tag">${window.escapeHtml(tool.categoryTitle)}</span>` : ''}
          <h3>${window.escapeHtml(tool.name)}</h3>
          <p>${window.escapeHtml(tool.desc)}</p>
          ${externalHint}
        </div>
        <div class="tool-card-links">
          <a href="${window.escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer" class="btn-secondary btn-sm">${window.escapeHtml(ui('toolsUi', 'official'))}</a>
          <a href="${window.escapeHtml(tool.learn)}" target="_blank" rel="noopener noreferrer" class="btn-primary btn-sm">${window.escapeHtml(ui('toolsUi', 'learn'))}</a>
        </div>
      </article>`
  }

  function renderToolsCardGrid(tools, showCategory = false) {
    if (!tools.length) {
      return `<p class="empty-hint">${window.escapeHtml(ui('toolsUi', 'searchEmpty'))}</p>`
    }
    return `<div class="tools-card-grid">${tools.map((tool) => renderToolCard(tool, showCategory)).join('')}</div>`
  }

  function resolveToolsActiveCategory(activeCategoryId) {
    const cats = Tools().getCategories()
    const ids = cats.map((c) => c.id)
    if (activeCategoryId && ids.includes(activeCategoryId)) return activeCategoryId
    try {
      const q = new URLSearchParams((location.hash.split('?')[1] || '').replace(/#.*$/, ''))
      const tab = q.get('tab')
      if (tab && ids.includes(tab)) return tab
    } catch (_) {}
    return cats[0]?.id || ''
  }

  function renderToolsHub(activeCategoryId) {
    const cats = Tools().getCategories()
    const activeId = resolveToolsActiveCategory(activeCategoryId)
    const activeCat = Tools().getCategory(activeId)
    return `
      <div class="page tools-page sec-hub-page">
        <header class="sec-hub-hero">
          <p class="sec-hub-eyebrow">${window.escapeHtml(ui('toolsUi', 'badge'))}</p>
          <h1>${window.escapeHtml(ui('toolsUi', 'hubTitle'))}</h1>
          <p class="sec-hub-desc">${window.escapeHtml(ui('toolsUi', 'hubDesc'))}</p>
        </header>
        <div class="tools-toolbar">
          <div class="industry-overview-tabs tools-category-tabs" role="tablist" aria-label="${window.escapeHtml(ui('toolsUi', 'tabsAria'))}">
            ${cats
              .map(
                (c) => `
              <button
                type="button"
                class="industry-overview-tab ${c.id === activeId ? 'is-active' : ''}"
                role="tab"
                aria-selected="${c.id === activeId}"
                data-tools-tab="${window.escapeHtml(c.id)}"
              >${window.escapeHtml(toolsTabLabel(c))}</button>`,
              )
              .join('')}
          </div>
        </div>
        <div class="tools-panel" id="tools-panel" role="tabpanel">
          ${renderToolsCardGrid(activeCat?.tools || [])}
        </div>
      </div>`
  }

  function renderToolsCategory(categoryId) {
    return renderToolsHub(categoryId)
  }

  function bindToolsHub(initialCategoryId) {
    const panel = document.getElementById('tools-panel')
    const tabs = document.querySelectorAll('[data-tools-tab]')
    if (!panel || !tabs.length) return

    let activeId = resolveToolsActiveCategory(initialCategoryId)

    const syncTabUi = () => {
      tabs.forEach((tab) => {
        const on = tab.dataset.toolsTab === activeId
        tab.classList.toggle('is-active', on)
        tab.setAttribute('aria-selected', on ? 'true' : 'false')
      })
    }

    const syncToolsRoute = () => {
      const next = `#/tools?tab=${encodeURIComponent(activeId)}`
      if (location.hash !== next) history.replaceState(null, '', next)
    }

    const showCategoryTools = () => {
      const cat = Tools().getCategory(activeId)
      panel.innerHTML = renderToolsCardGrid(cat?.tools || [])
      panel.hidden = false
      syncTabUi()
      syncToolsRoute()
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        activeId = tab.dataset.toolsTab || activeId
        showCategoryTools()
      })
    })

    showCategoryTools()
  }

  function bindToolsSearch() {
    bindToolsHub()
  }

  function renderForumList(posts) {
    const loggedIn = window.Auth().isLoggedIn()
    return `
      <div class="page forum-page sec-hub-page">
        <header class="sec-hub-hero">
          <p class="sec-hub-eyebrow">${window.escapeHtml(ui('forumUi', 'badge'))}</p>
          <h1>${window.escapeHtml(ui('forumUi', 'listTitle'))}</h1>
          <p class="sec-hub-desc">${window.escapeHtml(
            loggedIn ? ui('forumUi', 'listDescLoggedIn') : ui('forumUi', 'listDescGuest'),
          )}</p>
          <div class="hero-actions" style="margin-top:16px">
            ${
              loggedIn
                ? `<a href="#/forum/new" class="btn-primary">${window.escapeHtml(ui('forumUi', 'newPost'))}</a>`
                : `<a href="#/login" class="btn-primary">${window.escapeHtml(ui('forumUi', 'loginToPost'))}</a>
                   <span class="hero-actions-hint">${window.escapeHtml(ui('forumUi', 'guestBrowseTip'))}</span>`
            }
          </div>
        </header>
        <div class="forum-post-list">
          ${
            posts.length
              ? posts
                  .map(
                    (p) => `
            <a href="#/forum/post/${p.id}" class="forum-post-card">
              <h3>${window.escapeHtml(p.title)}</h3>
              <p class="forum-post-preview">${window.escapeHtml(p.body.slice(0, 120))}${p.body.length > 120 ? '…' : ''}</p>
              <div class="forum-post-meta">
                <span>${window.escapeHtml(p.authorName)}</span>
                <span>${window.formatDate(p.createdAt)}</span>
                <span>${window.escapeHtml(ui('forumUi', 'commentCount', { n: p.commentCount }))}</span>
              </div>
            </a>`,
                  )
                  .join('')
              : `<p class="empty-hint">${window.escapeHtml(ui('forumUi', 'empty'))}</p>`
          }
        </div>
      </div>`
  }

  function renderForumNew() {
    return `
      <div class="page forum-page">
        <header class="page-header">
          <a href="#/forum" class="breadcrumb">${window.escapeHtml(ui('forumUi', 'breadcrumb'))}</a><span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">${window.escapeHtml(ui('forumUi', 'newTitle'))}</span>
        </header>
        <div class="form-card">
          <div class="form-group">
            <label>${window.escapeHtml(ui('forumUi', 'labelTitle'))}</label>
            <input id="forum-title" placeholder="${window.escapeHtml(ui('forumUi', 'titlePlaceholder'))}" />
          </div>
          <div class="form-group">
            <label>${window.escapeHtml(ui('forumUi', 'labelBody'))}</label>
            <textarea id="forum-body" rows="10" placeholder="${window.escapeHtml(ui('forumUi', 'bodyPlaceholder'))}"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-primary" id="forum-submit">${window.escapeHtml(ui('forumUi', 'submit'))}</button>
            <a href="#/forum" class="btn-ghost">${window.escapeHtml(tr('common.cancel'))}</a>
          </div>
        </div>
      </div>`
  }

  function renderForumPost(post, comments) {
    const isOwner = window.Auth().isLoggedIn() && window.Auth().getSession()?.user?.id === post.userId
    return `
      <div class="page forum-page">
        <header class="page-header">
          <a href="#/forum" class="breadcrumb">${window.escapeHtml(ui('forumUi', 'breadcrumb'))}</a><span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">${window.escapeHtml(ui('forumUi', 'postBreadcrumb'))}</span>
        </header>
        <article class="forum-post-detail">
          <h1>${window.escapeHtml(post.title)}</h1>
          <div class="forum-post-meta">
            <span>${window.escapeHtml(post.authorName)}</span>
            <span>${window.formatDate(post.createdAt)}</span>
            ${isOwner ? `<button type="button" class="btn-ghost btn-sm" id="forum-delete-post">${window.escapeHtml(ui('forumUi', 'deletePost'))}</button>` : ''}
          </div>
          <div class="forum-post-body">${window.escapeHtml(post.body).replace(/\n/g, '<br>')}</div>
        </article>
        <section class="section">
          <h2 class="section-title">${window.escapeHtml(ui('forumUi', 'commentsTitle', { n: comments.length }))}</h2>
          <div class="forum-comment-list">
            ${comments.map((c) => `
              <div class="forum-comment">
                <div class="forum-comment-meta">${window.escapeHtml(c.authorName)} · ${window.formatDate(c.createdAt)}</div>
                <p>${window.escapeHtml(c.body)}</p>
              </div>`).join('')}
          </div>
          ${window.Auth().isLoggedIn() ? `
          <div class="form-card forum-comment-form">
            <textarea id="forum-comment-body" rows="3" placeholder="${window.escapeHtml(ui('forumUi', 'commentPlaceholder'))}"></textarea>
            <button type="button" class="btn-primary" id="forum-comment-submit">${window.escapeHtml(ui('forumUi', 'commentSubmit'))}</button>
          </div>` : `<p class="form-hint forum-login-hint">${window.escapeHtml(ui('forumUi', 'commentLoginHint'))} <a href="#/login">${window.escapeHtml(tr('auth.login'))}</a></p>`}
        </section>
      </div>`
  }

  function bindForumNew() {
    document.getElementById('forum-submit')?.addEventListener('click', async () => {
      const title = document.getElementById('forum-title')?.value.trim()
      const body = document.getElementById('forum-body')?.value.trim()
      if (!title || !body) return window.showToast(ui('forumUi', 'toastFieldsRequired'), 'error')
      try {
        const post = await Forum().createPost(title, body)
        window.showToast(ui('forumUi', 'toastPostSuccess'), 'success')
        window.navigate(`/forum/post/${post.id}`)
      } catch (e) { window.showToast(e.message, 'error') }
    })
  }

  function bindForumPost(postId) {
    document.getElementById('forum-comment-submit')?.addEventListener('click', async () => {
      const body = document.getElementById('forum-comment-body')?.value.trim()
      if (!body) return
      try {
        await Forum().createComment(postId, body)
        window.showToast(ui('forumUi', 'toastCommentSuccess'), 'success')
        window.renderForumPostRoute(postId)
      } catch (e) { window.showToast(e.message, 'error') }
    })
    document.getElementById('forum-delete-post')?.addEventListener('click', async () => {
      if (!confirm(ui('forumUi', 'confirmDeletePost'))) return
      try {
        await Forum().deletePost(postId)
        window.showToast(tr('common.deleted'), 'info')
        window.navigate('/forum')
      } catch (e) { window.showToast(e.message, 'error') }
    })
  }

  async function renderForumListRoute() {
    const main = document.getElementById('main')
    if (!window.Auth().isConfigured()) {
      main.innerHTML = `<div class="page"><p>${window.escapeHtml(ui('forumUi', 'notConfigured'))}</p></div>`
      return
    }
    main.innerHTML = `<div class="page"><p>${window.escapeHtml(tr('common.loading'))}</p></div>`
    try {
      const posts = await Forum().fetchPosts()
      main.innerHTML = renderForumList(posts)
    } catch (e) {
      main.innerHTML = `<div class="page"><p>${window.escapeHtml(e.message)}</p><p class="form-hint">${window.escapeHtml(ui('forumUi', 'schemaHint'))}</p></div>`
    }
  }

  async function renderForumPostRoute(postId) {
    const main = document.getElementById('main')
    main.innerHTML = `<div class="page"><p>${window.escapeHtml(tr('common.loading'))}</p></div>`
    try {
      const [post, comments] = await Promise.all([
        Forum().fetchPost(postId),
        Forum().fetchComments(postId),
      ])
      if (!post) {
        main.innerHTML = `<div class="page"><p>${window.escapeHtml(ui('forumUi', 'postNotFound'))}</p><a href="#/forum">${window.escapeHtml(tr('common.back'))}</a></div>`
        return
      }
      main.innerHTML = renderForumPost(post, comments)
      bindForumPost(postId)
    } catch (e) {
      main.innerHTML = `<div class="page"><p>${window.escapeHtml(e.message)}</p></div>`
    }
  }

  window.PDMSections = {
    renderIndustryHub,
    renderIndustrySection,
    renderIndustryArticle,
    renderLearningPathDetail,
    bindLearningPathDetail,
    bindOverviewTabs,
    renderToolsHub,
    renderToolsCategory,
    bindToolsHub,
    bindToolsSearch,
    renderForumList,
    renderForumNew,
    bindForumNew,
    renderForumListRoute,
    renderForumPostRoute,
  }
})()
