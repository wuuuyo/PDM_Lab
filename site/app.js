function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const { loadReviews, saveReviews, saveCustomKnowledge, loadCustomKnowledge, getStorageStats, exportBackup, importBackup, initStorage, toggleFavorite, isFavorited, loadKnowledgeGroups, saveKnowledgeGroups, loadArticleNotes, getArticleNotesForRef, addArticleNote, updateArticleNote, deleteArticleNote } = window.PDMStorage
const PDMCloud = window.PDMCloud
const K = window.PDMKnowledge
const Auth = () => window.PDMAuth || { isLoggedIn: () => false, isAdmin: () => false, getSession: () => null, isConfigured: () => false }
const Analytics = () => window.PDMAnalytics
const SharedK = () => window.PDMSharedKnowledge
const DailyPush = () => window.PDMDailyPush
const Sections = () => window.PDMSections
const t = (key, params, fallback) => window.PMLabI18n?.t(key, params, fallback) ?? fallback ?? key
const catTitle = (cat) => window.PMLabI18n?.getCategoryMeta(cat.id, 'title', cat.title) ?? cat.title
const catDesc = (cat) => window.PMLabI18n?.getCategoryMeta(cat.id, 'description', cat.description) ?? cat.description
const ui = (group, key, params) => t(`content.${group}.${key}`, params)

let toastTimer = null
function showToast(msg, type = 'info') {
  let el = document.getElementById('pdm-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'pdm-toast'
    el.className = 'pdm-toast'
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.className = `pdm-toast ${type} show`
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200)
}

function formatDate(iso) {
  if (window.PMLabI18n?.formatDate) return window.PMLabI18n.formatDate(iso)
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function parseRoute() {
  const raw = location.hash.slice(1) || '/'
  const [path, query] = raw.split('?')
  const parts = path.split('/').filter(Boolean)
  const params = new URLSearchParams(query || '')
  return { parts, params, raw: path }
}

function navigate(path) {
  location.hash = path
}

function getEmailOrgLabel(email) {
  if (!email?.includes('@')) return t('nav.defaultOrgLabel')
  const domain = email.split('@')[1]?.split('.')[0] || ''
  if (!domain) return t('nav.defaultOrgLabel')
  return domain.charAt(0).toUpperCase() + domain.slice(1)
}

function getUserInitials(email, displayName) {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return displayName.trim().slice(0, 2).toUpperCase()
  }
  if (email) {
    const local = email.split('@')[0] || ''
    if (/^[a-zA-Z]/.test(local)) return local.slice(0, 2).toUpperCase()
    return local.slice(0, 2).toUpperCase() || '?'
  }
  return '?'
}

function renderSidebarAccount(activePath) {
  if (Auth().isLoggedIn()) {
    const session = Auth().getSession()
    const profile = Auth().getProfile?.() || null
    const email = session?.user?.email || ''
    const displayName = profile?.display_name?.trim()
    const subtitle = displayName || getEmailOrgLabel(email)
    const initials = getUserInitials(email, displayName)
    return `
    <div class="sidebar-account sidebar-account-logged-in">
      <a href="#/daily-learn" class="sidebar-account-main" title="${escapeHtml(t('nav.accountSettingsTitle'))}">
        <span class="sidebar-account-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
        <span class="sidebar-account-text">
          <span class="sidebar-account-email">${escapeHtml(email)}</span>
          <span class="sidebar-account-sub">${escapeHtml(subtitle)}</span>
        </span>
      </a>
      <div class="sidebar-account-actions">
        <button type="button" class="sidebar-account-settings" id="sidebar-account-menu-btn" aria-label="${escapeHtml(t('nav.accountMenuAria'))}" title="${escapeHtml(t('nav.accountMenuAria'))}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" stroke-width="1.3"/>
            <path d="M12.5 8.8a1.2 1.2 0 00.2 1.3l.04.04a1.45 1.45 0 11-2.05 2.05l-.04-.04a1.2 1.2 0 00-1.3-.2 1.2 1.2 0 00-.73 1.1v.12a1.45 1.45 0 11-2.9 0v-.06a1.2 1.2 0 00-.79-1.1 1.2 1.2 0 00-1.3.2l-.04.04a1.45 1.45 0 11-2.05-2.05l.04-.04a1.2 1.2 0 00.2-1.3 1.2 1.2 0 00-1.1-.73h-.12a1.45 1.45 0 110-2.9h.06a1.2 1.2 0 001.1-.79 1.2 1.2 0 00-.2-1.3l-.04-.04a1.45 1.45 0 112.05-2.05l.04.04a1.2 1.2 0 001.3.2h.06a1.2 1.2 0 001.1-.79 1.45 1.45 0 112.9 0v.06a1.2 1.2 0 00.79 1.1 1.2 1.2 0 001.3-.2l.04-.04a1.45 1.45 0 112.05 2.05l-.04.04a1.2 1.2 0 00-.2 1.3 1.2 1.2 0 001.1.79h.12a1.45 1.45 0 110 2.9h-.06a1.2 1.2 0 00-1.1.79z" stroke="currentColor" stroke-width="1.3"/>
          </svg>
        </button>
        <div class="sidebar-account-menu" id="sidebar-account-menu" hidden>
          <a href="#/daily-learn" class="sidebar-account-menu-item">${escapeHtml(t('nav.dailyLearnSettings'))}</a>
          ${Auth().isAdmin() ? `<a href="#/admin" class="sidebar-account-menu-item">${escapeHtml(t('nav.adminStats'))}</a>` : ''}
          ${Auth().isAdmin() ? `<a href="#/admin/knowledge" class="sidebar-account-menu-item">${escapeHtml(t('nav.adminKnowledge'))}</a>` : ''}
          <button type="button" class="sidebar-account-menu-item sidebar-account-menu-danger" id="sidebar-logout">${escapeHtml(t('nav.logout'))}</button>
        </div>
      </div>
    </div>`
  }

  return `
    <a href="#/login" class="sidebar-account sidebar-account-guest ${activePath === '/login' ? 'active' : ''}">
      <span class="sidebar-account-avatar sidebar-account-avatar-guest" aria-hidden="true">○</span>
      <span class="sidebar-account-text">
        <span class="sidebar-account-email">${escapeHtml(t('nav.loginRegister'))}</span>
        <span class="sidebar-account-sub">${escapeHtml(t('nav.guestHint'))}</span>
      </span>
      <span class="sidebar-account-settings sidebar-account-settings-link" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" stroke-width="1.3"/>
          <path d="M12.5 8.8a1.2 1.2 0 00.2 1.3l.04.04a1.45 1.45 0 11-2.05 2.05l-.04-.04a1.2 1.2 0 00-1.3-.2 1.2 1.2 0 00-.73 1.1v.12a1.45 1.45 0 11-2.9 0v-.06a1.2 1.2 0 00-.79-1.1 1.2 1.2 0 00-1.3.2l-.04.04a1.45 1.45 0 11-2.05-2.05l.04-.04a1.2 1.2 0 00.2-1.3 1.2 1.2 0 00-1.1-.73h-.12a1.45 1.45 0 110-2.9h.06a1.2 1.2 0 001.1-.79 1.2 1.2 0 00-.2-1.3l-.04-.04a1.45 1.45 0 112.05-2.05l.04.04a1.2 1.2 0 001.3.2h.06a1.2 1.2 0 001.1-.79 1.45 1.45 0 112.9 0v.06a1.2 1.2 0 00.79 1.1 1.2 1.2 0 001.3-.2l.04-.04a1.45 1.45 0 112.05 2.05l-.04.04a1.2 1.2 0 00-.2 1.3 1.2 1.2 0 001.1.79h.12a1.45 1.45 0 110 2.9h-.06a1.2 1.2 0 00-1.1.79z" stroke="currentColor" stroke-width="1.3"/>
        </svg>
      </span>
    </a>`
}

function renderForbidden() {
  return `<div class="page"><p>${escapeHtml(t('common.forbidden'))}</p><a href="#/">${escapeHtml(t('common.backHome'))}</a></div>`
}

function renderLocaleSwitcher() {
  const el = document.getElementById('locale-switcher')
  if (!el) return
  const current = window.PMLabI18n?.getLocale() || 'zh-CN'
  el.innerHTML = `
    <div role="group" aria-label="${escapeHtml(t('locale.label'))}">
      <button type="button" class="locale-btn ${current === 'zh-CN' ? 'active' : ''}" data-locale="zh-CN">${escapeHtml(t('locale.zh'))}</button>
      <button type="button" class="locale-btn ${current === 'en-US' ? 'active' : ''}" data-locale="en-US">${escapeHtml(t('locale.en'))}</button>
    </div>`
}

function renderSidebar(activePath) {
  const el = document.getElementById('sidebar')
  const merged = K.getMergedCategories()
  const navItems = merged.map(cat => {
    const active = activePath.includes(cat.id) ? 'active' : ''
    return `<a href="#/category/${cat.id}" class="nav-item ${active}">
      <span class="nav-icon">${cat.icon}</span>
      <span class="nav-title">${escapeHtml(catTitle(cat))}</span>
      <span class="nav-count">${cat.items.length}</span>
    </a>`
  }).join('')

  el.innerHTML = `
    <div class="sidebar-header">
      <a href="#/" class="logo">
        <span class="logo-mark">PM</span>
        <span class="logo-text">Lab</span>
      </a>
      <p class="logo-sub">${escapeHtml(t('nav.brandSubtitle'))}</p>
    </div>
    <div class="search-wrapper" id="search-wrapper">
      <div class="search-bar">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input type="text" id="search-input" placeholder="${escapeHtml(t('nav.searchPlaceholder'))}" />
      </div>
      <div class="search-results" id="search-results" style="display:none"></div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section nav-section-home">
        <a href="#/" class="nav-item nav-item-home ${activePath === '/' ? 'active' : ''}">
          <span class="nav-icon">⌂</span>
          <span class="nav-title">${escapeHtml(t('nav.home'))}</span>
        </a>
      </div>
      <div class="nav-section">
        <span class="nav-label">${escapeHtml(t('nav.sectionLearning'))}</span>
        <a href="#/industry" class="nav-item ${activePath.includes('/industry') ? 'active' : ''}">
          <span class="nav-icon">◉</span>
          <span class="nav-title">${escapeHtml(t('nav.industry'))}</span>
        </a>
        <a href="#/tools" class="nav-item ${activePath.includes('/tools') ? 'active' : ''}">
          <span class="nav-icon">◇</span>
          <span class="nav-title">${escapeHtml(t('nav.tools'))}</span>
        </a>
        <a href="#/forum" class="nav-item ${activePath.includes('/forum') ? 'active' : ''}">
          <span class="nav-icon">💬</span>
          <span class="nav-title">${escapeHtml(t('nav.forum'))}</span>
        </a>
      </div>
      <div class="nav-section">
        <span class="nav-label">${escapeHtml(t('nav.sectionKnowledge'))}</span>
        ${navItems}
      </div>
      <div class="nav-section">
        <span class="nav-label">${escapeHtml(t('nav.sectionPersonal'))}</span>
        <a href="#/favorites" class="nav-item ${activePath === '/favorites' ? 'active' : ''}">
          <span class="nav-icon">★</span>
          <span class="nav-title">${escapeHtml(t('nav.favorites'))}</span>
        </a>
        <a href="#/notes" class="nav-item ${activePath === '/notes' ? 'active' : ''}">
          <span class="nav-icon">✎</span>
          <span class="nav-title">${escapeHtml(t('nav.articleNotes'))}</span>
        </a>
        <a href="#/my-knowledge" class="nav-item ${activePath.includes('/my-knowledge') ? 'active' : ''}">
          <span class="nav-icon">◎</span>
          <span class="nav-title">${escapeHtml(t('nav.myKnowledge'))}</span>
        </a>
        <a href="#/reviews" class="nav-item ${activePath === '/reviews' || activePath === '/memory' ? 'active' : ''}">
          <span class="nav-icon">◆</span>
          <span class="nav-title">${escapeHtml(t('nav.reviews'))}</span>
        </a>
        ${Auth().isLoggedIn() ? `
        <a href="#/daily-learn" class="nav-item ${activePath === '/daily-learn' ? 'active' : ''}">
          <span class="nav-icon">◇</span>
          <span class="nav-title">${escapeHtml(t('nav.dailyLearn'))}</span>
        </a>` : ''}
        ${Auth().isAdmin() ? `
        <a href="#/admin" class="nav-item ${activePath === '/admin' && !activePath.includes('/admin/knowledge') ? 'active' : ''}">
          <span class="nav-icon">▣</span>
          <span class="nav-title">${escapeHtml(t('nav.adminStats'))}</span>
        </a>
        <a href="#/admin/knowledge" class="nav-item ${activePath.includes('/admin/knowledge') ? 'active' : ''}">
          <span class="nav-icon">▤</span>
          <span class="nav-title">${escapeHtml(t('nav.adminKnowledge'))}</span>
        </a>` : ''}
      </div>
    </nav>
    ${renderSidebarAccount(activePath)}
  `

  const input = document.getElementById('search-input')
  const results = document.getElementById('search-results')
  input.addEventListener('input', () => {
    const q = input.value.trim()
    if (!q) { results.style.display = 'none'; return }
    const found = K.searchKnowledgeMerged(q).slice(0, 6)
    if (found.length === 0) {
      results.innerHTML = `<div class="search-empty">${escapeHtml(t('nav.searchEmpty'))}</div>`
    } else {
      results.innerHTML = found.map(({ category, item, source }) => {
        const catLabel = source === 'my'
          ? category.title
          : t(`categories.${category.id}.title`, null, category.title)
        return `<button class="search-result-item" data-src="${source || 'public'}" data-cat="${category.id}" data-item="${item.id}">
          <span class="result-title">${escapeHtml(item.title)}</span>
          <span class="result-meta">${escapeHtml(catLabel)}${source === 'my' ? escapeHtml(t('nav.searchSourceMy')) : ''}</span>
        </button>`
      }).join('')
      results.querySelectorAll('.search-result-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const src = btn.dataset.src
          if (src === 'my') {
            navigate(`/my-knowledge/view/${btn.dataset.item}`)
          } else {
            navigate(`/article/${btn.dataset.cat}/${btn.dataset.item}`)
          }
          input.value = ''
          results.style.display = 'none'
        })
      })
    }
    results.style.display = 'block'
  })

  document.addEventListener('click', (e) => {
    if (!document.getElementById('search-wrapper')?.contains(e.target)) {
      results.style.display = 'none'
    }
  })
}

function renderHomeTile(tile) {
  return `<a href="${tile.href}" class="home-tile">
    <span class="home-tile-icon" aria-hidden="true">${tile.icon}</span>
    <span class="home-tile-body">
      <span class="home-tile-title">${escapeHtml(tile.title)}</span>
      <span class="home-tile-desc">${escapeHtml(tile.desc)}</span>
    </span>
    <span class="home-tile-arrow" aria-hidden="true">→</span>
  </a>`
}

function renderHomePathTeaser() {
  const path = window.PDMIndustry?.getRecommendedPath?.()
  if (!path) return ''
  return `
    <a href="#/industry/learning-path/${path.id}" class="home-path-teaser">
      <span class="home-tile-icon home-path-teaser-icon" aria-hidden="true">⤳</span>
      <span class="home-path-teaser-body">
        <span class="home-path-teaser-label">${escapeHtml(t('home.pathTeaserBadge'))}</span>
        <span class="home-path-teaser-title">${escapeHtml(path.title)}</span>
        <span class="home-path-teaser-desc">${escapeHtml(t('home.pathTeaserDesc'))}</span>
      </span>
      <span class="home-path-teaser-cta">${escapeHtml(t('home.pathTeaserCta'))} →</span>
    </a>`
}

function renderHome() {
  const learnTiles = [
    { icon: '◉', href: '#/industry', title: t('home.featIndustryTitle'), desc: t('home.featIndustryDesc') },
    { icon: '▤', href: '#/category/methodology', title: t('home.featKnowledgeTitle'), desc: t('home.featKnowledgeDesc') },
    { icon: '⚙', href: '#/tools', title: t('home.featToolsTitle'), desc: t('home.featToolsDesc') },
    { icon: '◎', href: '#/forum', title: t('home.featForumTitle'), desc: t('home.featForumDesc') },
  ]
  const workspaceTiles = [
    { icon: '★', href: '#/favorites', title: t('home.featFavoritesTitle'), desc: t('home.featFavoritesDesc') },
    { icon: '✎', href: '#/notes', title: t('home.featNotesTitle'), desc: t('home.featNotesDesc') },
    { icon: '◇', href: '#/daily-learn', title: t('home.featDailyTitle'), desc: t('home.featDailyDesc') },
    { icon: '◆', href: '#/reviews', title: t('home.featReviewsTitle'), desc: t('home.featReviewsDesc') },
  ]
  const steps = [
    { num: 1, icon: '◉', href: '#/industry', title: t('home.step1Title'), desc: t('home.step1Desc') },
    { num: 2, icon: '▤', href: '#/category/methodology', title: t('home.step2Title'), desc: t('home.step2Desc') },
    { num: 3, icon: '⚙', href: '#/tools', title: t('home.step3Title'), desc: t('home.step3Desc') },
  ]

  return `
    <div class="page home-page">
      <header class="home-hero">
        <div class="home-hero-brand">
          <span class="home-hero-mark">PM</span>
          <span class="home-hero-name">Lab</span>
        </div>
        <p class="home-hero-tag">${escapeHtml(t('nav.brandSubtitle'))}</p>
        <h1>${escapeHtml(t('home.heroTitle'))}</h1>
        <p class="home-hero-desc">${escapeHtml(t('home.heroDesc'))}</p>
        <div class="home-hero-actions">
          <a href="#/category/methodology" class="btn-primary">${escapeHtml(t('home.ctaStart'))}</a>
          <a href="#/industry" class="btn-secondary">${escapeHtml(t('home.ctaNewcomer'))}</a>
        </div>
      </header>

      <section class="home-section">
        <div class="home-section-head">
          <h2 class="home-section-title">${escapeHtml(t('home.sectionLearn'))}</h2>
          <p class="home-section-desc">${escapeHtml(t('home.sectionLearnDesc'))}</p>
        </div>
        <div class="home-tile-grid">${learnTiles.map(renderHomeTile).join('')}</div>
      </section>

      <section class="home-section">
        <div class="home-section-head">
          <h2 class="home-section-title">${escapeHtml(t('home.sectionWorkspace'))}</h2>
          <p class="home-section-desc">${escapeHtml(t('home.sectionWorkspaceDesc'))}</p>
        </div>
        <div class="home-tile-grid home-tile-grid-compact">${workspaceTiles.map(renderHomeTile).join('')}</div>
      </section>

      <section class="home-section">
        <div class="home-section-head">
          <h2 class="home-section-title">${escapeHtml(t('home.sectionStart'))}</h2>
          <p class="home-section-desc">${escapeHtml(t('home.sectionStartDesc'))}</p>
        </div>
        <div class="home-steps">
          ${steps.map((step, i) => `
            <a href="${step.href}" class="home-step">
              <span class="home-step-num">${step.num}</span>
              <span class="home-step-icon" aria-hidden="true">${step.icon}</span>
              <span class="home-step-title">${escapeHtml(step.title)}</span>
              <span class="home-step-desc">${escapeHtml(step.desc)}</span>
            </a>
            ${i < steps.length - 1 ? '<span class="home-step-connector" aria-hidden="true">→</span>' : ''}
          `).join('')}
        </div>
        ${renderHomePathTeaser()}
      </section>

      <section class="home-section home-section-last">
        <div class="home-section-head">
          <h2 class="home-section-title">${escapeHtml(t('home.categoriesTitle'))}</h2>
          <p class="home-section-desc">${escapeHtml(t('home.categoriesDesc'))}</p>
        </div>
        <div class="home-cat-grid">
          ${K.getMergedCategories().map((cat) => `
            <a href="#/category/${cat.id}" class="home-cat-card">
              <span class="home-cat-icon">${cat.icon}</span>
              <span class="home-cat-title">${escapeHtml(catTitle(cat))}</span>
              <span class="home-cat-count">${escapeHtml(t('home.itemCount', { n: cat.items.length }))}</span>
            </a>
          `).join('')}
        </div>
      </section>
    </div>`
}

function renderCategory(categoryId) {
  const cat = K.getCategoryByIdMerged(categoryId)
  if (!cat) return `<div class="page"><p>${escapeHtml(t('common.categoryNotFound'))}</p><a href="#/">${escapeHtml(t('common.backHome'))}</a></div>`
  const title = catTitle(cat)
  const desc = catDesc(cat)
  return `
    <div class="page category-page">
      <header class="page-header">
        <a href="#/" class="breadcrumb">${escapeHtml(t('common.home'))}</a><span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">${escapeHtml(title)}</span>
      </header>
      <div class="category-hero">
        <span class="category-hero-icon">${cat.icon}</span>
        <h1>${escapeHtml(title)}</h1><p>${escapeHtml(desc)}</p>
      </div>
      <div class="article-list">
        ${cat.items.map((item, i) => `
          <a href="#/article/${cat.id}/${item.id}" class="article-card ${item.isShared ? 'shared-item' : ''}">
            <span class="article-index">${String(i + 1).padStart(2, '0')}</span>
            <div class="article-card-body">
              <h3>${item.title}${item.isShared ? ` <span class="shared-badge">${escapeHtml(t('article.sharedShort'))}</span>` : ''}</h3><p>${item.summary}</p>
              <div class="article-tags">${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
            </div>
            <span class="article-arrow">→</span>
          </a>
        `).join('')}
      </div>
    </div>`
}

function renderKnowledgeDetailBody(item) {
  const explain = item.content || []
  const cases = item.cases || []
  const pmApp = item.pmApplication || []
  const hasStructured = cases.length > 0 || pmApp.length > 0

  if (!hasStructured) {
    return `<div class="article-body">${explain.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}</div>`
  }

  return `
    <div class="article-sections">
      <section class="article-section article-section-explain">
        <div class="article-section-header">
          <span class="article-section-label">${escapeHtml(t('article.sectionExplainLabel'))}</span>
          <h2>${escapeHtml(t('article.sectionExplainTitle'))}</h2>
        </div>
        <div class="article-section-body">
          ${explain.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
        </div>
      </section>

      ${cases.length ? `
      <section class="article-section article-section-case">
        <div class="article-section-header">
          <span class="article-section-label">${escapeHtml(t('article.sectionCaseLabel'))}</span>
          <h2>${escapeHtml(t('article.sectionCaseTitle'))}</h2>
        </div>
        <div class="case-card-list">
          ${cases.map((c, i) => `
            <div class="case-card">
              <span class="case-card-index">${escapeHtml(t('article.caseIndex', { n: i + 1 }))}</span>
              <p>${escapeHtml(c)}</p>
            </div>`).join('')}
        </div>
      </section>` : ''}

      ${pmApp.length ? `
      <section class="article-section article-section-pm">
        <div class="article-section-header">
          <span class="article-section-label">${escapeHtml(t('article.sectionPmLabel'))}</span>
          <h2>${escapeHtml(t('article.sectionPmTitle'))}</h2>
        </div>
        <ul class="pm-app-list">
          ${pmApp.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
        </ul>
      </section>` : ''}
    </div>`
}

let articleNotesEditState = { id: null }

function renderNoteCard(note, editing = false) {
  if (editing) {
    return `
      <div class="note-card note-card-editing" data-note-id="${note.id}">
        <textarea class="note-edit-input" id="note-edit-${note.id}" rows="4">${escapeHtml(note.content)}</textarea>
        <div class="note-card-actions">
          <button type="button" class="btn-primary btn-note-save" data-note-id="${note.id}">${escapeHtml(t('common.save'))}</button>
          <button type="button" class="btn-ghost btn-note-cancel">${escapeHtml(t('common.cancel'))}</button>
        </div>
      </div>`
  }
  return `
    <div class="note-card" data-note-id="${note.id}">
      <p class="note-content">${escapeHtml(note.content).replace(/\n/g, '<br>')}</p>
      <div class="note-card-footer">
        <span class="note-date">${formatDate(note.updatedAt)}</span>
        <div class="note-card-actions">
          <button type="button" class="btn-note-edit" data-note-id="${note.id}">${escapeHtml(t('common.edit'))}</button>
          <button type="button" class="btn-note-delete danger" data-note-id="${note.id}">${escapeHtml(t('common.delete'))}</button>
        </div>
      </div>
    </div>`
}

function renderArticleNotesPanel(ref) {
  const notes = getArticleNotesForRef(ref)
  const editingId = articleNotesEditState.id
  const attrs = ref.source === 'my'
    ? `data-note-source="my" data-note-item="${ref.itemId}"`
    : `data-note-source="public" data-note-cat="${ref.categoryId}" data-note-item="${ref.itemId}"`
  return `
    <section class="article-notes" ${attrs}>
      <div class="article-notes-header">
        <h2>${escapeHtml(t('article.notesTitle'))}</h2>
        <p class="article-notes-desc">${escapeHtml(t('article.notesDesc'))}</p>
      </div>
      <div class="article-notes-list">
        ${notes.length
          ? notes.map((n) => renderNoteCard(n, editingId === n.id)).join('')
          : `<p class="empty-hint article-notes-empty">${escapeHtml(t('article.notesEmpty'))}</p>`}
      </div>
      <div class="article-notes-compose">
        <textarea id="article-note-input" rows="4" placeholder="${escapeHtml(t('article.notesPlaceholder'))}"></textarea>
        <button type="button" class="btn-primary" id="article-note-add">${escapeHtml(t('article.notesAdd'))}</button>
      </div>
    </section>`
}

function bindArticleNotesEvents() {
  const section = document.querySelector('.article-notes')
  if (!section) return

  const ref = section.dataset.noteSource === 'my'
    ? { source: 'my', itemId: section.dataset.noteItem }
    : { source: 'public', categoryId: section.dataset.noteCat, itemId: section.dataset.noteItem }

  document.getElementById('article-note-add')?.addEventListener('click', async () => {
    const input = document.getElementById('article-note-input')
    const content = input?.value.trim()
    if (!content) {
      showToast(t('article.notesEmptyInput'), 'error')
      return
    }
    await addArticleNote(ref, content)
    articleNotesEditState.id = null
    input.value = ''
    showToast(t('article.notesSaved'), 'success')
    render()
  })

  document.getElementById('article-note-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      document.getElementById('article-note-add')?.click()
    }
  })

  section.querySelectorAll('.btn-note-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      articleNotesEditState.id = btn.dataset.noteId
      render()
    })
  })

  section.querySelectorAll('.btn-note-cancel').forEach((btn) => {
    btn.addEventListener('click', () => {
      articleNotesEditState.id = null
      render()
    })
  })

  section.querySelectorAll('.btn-note-save').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const content = document.getElementById(`note-edit-${btn.dataset.noteId}`)?.value.trim()
      if (!content) {
        showToast(t('article.notesEmptyInput'), 'error')
        return
      }
      await updateArticleNote(btn.dataset.noteId, content)
      articleNotesEditState.id = null
      showToast(t('article.notesSaved'), 'success')
      render()
    })
  })

  section.querySelectorAll('.btn-note-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm(t('notes.deleteConfirm'))) return
      await deleteArticleNote(btn.dataset.noteId)
      articleNotesEditState.id = null
      showToast(t('common.deleted'), 'info')
      render()
    })
  })
}

function renderArticle(categoryId, itemId) {
  const cat = K.getCategoryByIdMerged(categoryId)
  const item = K.getItemByIdMerged(categoryId, itemId)
  if (!cat || !item) return `<div class="page"><p>${escapeHtml(t('common.notFound'))}</p><a href="#/">${escapeHtml(t('common.backHome'))}</a></div>`
  const catLabel = catTitle(cat)
  const idx = cat.items.findIndex(i => i.id === itemId)
  const prev = idx > 0 ? cat.items[idx - 1] : null
  const next = idx < cat.items.length - 1 ? cat.items[idx + 1] : null
  const favRef = { source: 'public', categoryId: cat.id, itemId: item.id }
  const favorited = isFavorited(favRef)
  const hasStructured = (item.cases?.length || 0) > 0 || (item.pmApplication?.length || 0) > 0
  return `
    <div class="page article-page">
      <header class="page-header">
        <a href="#/" class="breadcrumb">${escapeHtml(t('common.home'))}</a><span class="breadcrumb-sep">/</span>
        <a href="#/category/${cat.id}" class="breadcrumb">${escapeHtml(catLabel)}</a><span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">${escapeHtml(item.title)}</span>
      </header>
      <article class="article-content">
        <div class="article-meta">
          <span class="article-category">${escapeHtml(catLabel)}</span>
          ${item.isShared ? `<span class="shared-badge">${escapeHtml(t('article.sharedBadge'))}</span>` : ''}
          <div class="article-tags">${item.tags.map(tg => `<span class="tag">${escapeHtml(tg)}</span>`).join('')}</div>
          <button type="button" class="btn-favorite ${favorited ? 'active' : ''}" id="btn-favorite" data-source="public" data-cat="${cat.id}" data-item="${item.id}">
            ${favorited ? escapeHtml(t('article.favoriteAdded')) : escapeHtml(t('article.favoriteAdd'))}
          </button>
        </div>
        <h1>${escapeHtml(item.title)}</h1>
        <p class="article-summary">${escapeHtml(item.summary)}</p>
        ${hasStructured ? `
        <div class="article-format-hint">
          <span class="format-chip">${escapeHtml(t('article.formatExplain'))}</span>
          <span class="format-chip format-chip-case">${escapeHtml(t('article.formatCase'))}</span>
          <span class="format-chip format-chip-pm">${escapeHtml(t('article.formatPm'))}</span>
          <span class="format-hint-text">${escapeHtml(t('article.formatHint'))}</span>
        </div>` : ''}
        ${renderKnowledgeDetailBody(item)}
        ${renderArticleNotesPanel(favRef)}
      </article>
      <nav class="article-nav">
        ${prev ? `<a href="#/article/${cat.id}/${prev.id}" class="article-nav-link prev"><span class="nav-direction">${escapeHtml(t('article.navPrev'))}</span><span class="nav-title">${escapeHtml(prev.title)}</span></a>` : '<div></div>'}
        ${next ? `<a href="#/article/${cat.id}/${next.id}" class="article-nav-link next"><span class="nav-direction">${escapeHtml(t('article.navNext'))}</span><span class="nav-title">${escapeHtml(next.title)}</span></a>` : '<div></div>'}
      </nav>
    </div>`
}

function bindFavoriteButton() {
  document.getElementById('btn-favorite')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-favorite')
    const ref = btn.dataset.source === 'my'
      ? { source: 'my', itemId: btn.dataset.item }
      : { source: 'public', categoryId: btn.dataset.cat, itemId: btn.dataset.item }
    await toggleFavorite(ref)
    const on = isFavorited(ref)
    btn.classList.toggle('active', on)
    btn.textContent = on ? t('article.favoriteAdded') : t('article.favoriteAdd')
    showToast(on ? t('article.favToastAdd') : t('article.favToastRemove'), 'info')
  })
}

let knowledgeState = {
  form: { groupId: 'default', title: '', summary: '', tags: [], contentText: '' },
  tagInput: '',
}
let myKnowledgeState = { q: '', groupId: 'all', showGroupForm: false, editingGroup: null, groupForm: { name: '', description: '' } }
let lastKnowledgeRoute = ''

function emptyKnowledgeForm(groupId = 'default') {
  const groups = loadKnowledgeGroups()
  const gid = groups.some((g) => g.id === groupId) ? groupId : (groups[0]?.id || 'default')
  return { groupId: gid, title: '', summary: '', tags: [], contentText: '' }
}

function renderMyKnowledgeHub() {
  const groups = loadKnowledgeGroups()
  const { q, groupId } = myKnowledgeState
  const items = K.searchMyKnowledge(q, groupId)
  const groupCounts = {}
  for (const g of groups) {
    groupCounts[g.id] = K.getMyKnowledgeItems(g.id).length
  }
  const total = K.getMyKnowledgeItems().length

  return `
    <div class="page my-knowledge-page">
      <header class="memory-header">
        <h1>我的知识库</h1>
        <p>自定义分组、新增与编辑个人知识，支持关键词与分组筛选</p>
      </header>
      ${renderCloudPanel()}
      <div class="my-knowledge-layout">
        <aside class="my-knowledge-sidebar">
          <button type="button" class="btn-secondary btn-block" id="btn-new-group">+ 新建分组</button>
          <nav class="group-nav">
            <button type="button" class="group-nav-item ${groupId === 'all' ? 'active' : ''}" data-group="all">全部 <span class="nav-count">${total}</span></button>
            ${groups.map((g) => `
              <button type="button" class="group-nav-item ${groupId === g.id ? 'active' : ''}" data-group="${g.id}">
                <span class="group-nav-name">${escapeHtml(g.name)}</span>
                <span class="nav-count">${groupCounts[g.id] || 0}</span>
              </button>`).join('')}
          </nav>
          ${myKnowledgeState.showGroupForm ? renderGroupForm() : ''}
          <div class="group-manage-list">
            ${groups.map((g) => `
              <div class="group-manage-row">
                <span>${escapeHtml(g.name)}</span>
                <span>
                  <button type="button" class="btn-ghost btn-sm btn-edit-group" data-id="${g.id}">编辑</button>
                  ${g.id !== 'default' ? `<button type="button" class="btn-ghost btn-sm btn-del-group" data-id="${g.id}">删</button>` : ''}
                </span>
              </div>`).join('')}
          </div>
        </aside>
        <main class="my-knowledge-main">
          <div class="my-knowledge-toolbar">
            <input type="search" id="my-k-search" placeholder="搜索标题、标签、正文、分组…" value="${escapeHtml(q)}" />
            <a href="#/my-knowledge/add${groupId !== 'all' ? `?group=${groupId}` : ''}" class="btn-primary">+ 新增知识</a>
          </div>
          <div class="article-list">
            ${items.length ? items.map((item, i) => `
              <a href="#/my-knowledge/view/${item.id}" class="article-card custom-item">
                <span class="article-index">${String(i + 1).padStart(2, '0')}</span>
                <div class="article-card-body">
                  <h3>${escapeHtml(item.title)} <span class="custom-badge">${escapeHtml(item.groupName)}</span></h3>
                  <p>${escapeHtml(item.summary)}</p>
                  <div class="article-tags">${item.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
                </div>
                <span class="article-arrow">→</span>
              </a>`).join('') : '<p class="empty-hint">暂无知识，点击「新增知识」开始记录</p>'}
          </div>
        </main>
      </div>
    </div>`
}

function renderGroupForm() {
  const f = myKnowledgeState.groupForm
  const isEdit = Boolean(myKnowledgeState.editingGroup)
  return `
    <div class="form-card group-form-card">
      <h3>${isEdit ? '编辑分组' : '新建分组'}</h3>
      <div class="form-group">
        <label>分组名称</label>
        <input id="gf-name" value="${escapeHtml(f.name)}" placeholder="如：面试准备" />
      </div>
      <div class="form-group">
        <label>描述（可选）</label>
        <input id="gf-desc" value="${escapeHtml(f.description)}" />
      </div>
      <div class="form-actions">
        <button type="button" class="btn-primary" id="gf-save">${isEdit ? '保存' : '创建'}</button>
        <button type="button" class="btn-ghost" id="gf-cancel">取消</button>
      </div>
    </div>`
}

function renderMyKnowledgeView(itemId) {
  const item = K.getMyKnowledgeById(itemId)
  if (!item) return '<div class="page"><p>内容不存在</p><a href="#/my-knowledge">返回我的知识库</a></div>'
  const items = K.getMyKnowledgeItems(item.groupId)
  const idx = items.findIndex((i) => i.id === itemId)
  const prev = idx > 0 ? items[idx - 1] : null
  const next = idx < items.length - 1 ? items[idx + 1] : null
  const favRef = { source: 'my', itemId: item.id }
  const favorited = isFavorited(favRef)
  return `
    <div class="page article-page">
      <header class="page-header">
        <a href="#/my-knowledge" class="breadcrumb">我的知识库</a><span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">${escapeHtml(item.title)}</span>
      </header>
      <article class="article-content">
        <div class="article-meta">
          <span class="custom-badge">${escapeHtml(item.groupName)}</span>
          <div class="article-tags">${item.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
          <button type="button" class="btn-favorite ${favorited ? 'active' : ''}" id="btn-favorite" data-source="my" data-item="${item.id}">
            ${favorited ? '★ 已收藏' : '☆ 收藏'}
          </button>
        </div>
        <h1>${escapeHtml(item.title)}</h1>
        <p class="article-summary">${escapeHtml(item.summary)}</p>
        ${renderKnowledgeDetailBody(item)}
        ${renderArticleNotesPanel(favRef)}
        <div class="article-custom-actions">
          <a href="#/my-knowledge/edit/${item.id}" class="btn-secondary">编辑</a>
          <button type="button" class="btn-ghost btn-danger-text" id="btn-delete-my-knowledge">删除</button>
        </div>
      </article>
      <nav class="article-nav">
        ${prev ? `<a href="#/my-knowledge/view/${prev.id}" class="article-nav-link prev"><span class="nav-direction">上一篇</span><span class="nav-title">${prev.title}</span></a>` : '<div></div>'}
        ${next ? `<a href="#/my-knowledge/view/${next.id}" class="article-nav-link next"><span class="nav-direction">下一篇</span><span class="nav-title">${next.title}</span></a>` : '<div></div>'}
      </nav>
    </div>`
}

function renderKnowledgeForm(editItemId) {
  const groups = loadKnowledgeGroups()
  let editing = null
  if (editItemId) {
    editing = K.getMyKnowledgeEntry(editItemId)
    if (editing) {
      knowledgeState.form = {
        groupId: editing.groupId,
        title: editing.title,
        summary: editing.summary,
        tags: [...editing.tags],
        contentText: editing.content.join('\n\n'),
      }
    }
  }

  const { params } = parseRoute()
  if (!editing && params.get('group')) {
    knowledgeState.form.groupId = params.get('group')
  }

  const f = knowledgeState.form
  const isEdit = Boolean(editing)

  return `
    <div class="page knowledge-form-page">
      <header class="page-header">
        <a href="#/my-knowledge" class="breadcrumb">我的知识库</a><span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">${isEdit ? '编辑知识' : '新增知识'}</span>
      </header>
      <div class="knowledge-form-header">
        <h1>${isEdit ? '编辑知识点' : '新增知识点'}</h1>
        <p>保存后存入「我的知识库」，登录后自动云端同步。</p>
      </div>
      <div class="form-card knowledge-form">
        <div class="form-group">
          <label>所属分组</label>
          <select id="kf-group">
            ${groups.map((g) => `<option value="${g.id}" ${f.groupId === g.id ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>标题</label>
          <input id="kf-title" value="${escapeHtml(f.title)}" placeholder="如：Hook 模型" />
        </div>
        <div class="form-group">
          <label>摘要</label>
          <input id="kf-summary" value="${escapeHtml(f.summary)}" placeholder="一句话概括" />
        </div>
        <div class="form-group">
          <label>标签</label>
          <div class="tag-input-row">
            <input id="kf-tag-input" placeholder="输入后回车添加" value="${escapeHtml(knowledgeState.tagInput)}" />
            <button type="button" class="btn-secondary" id="kf-add-tag">添加</button>
          </div>
          <div class="tag-list" id="kf-tags">
            ${f.tags.map((t) => `<span class="tag removable" data-tag="${escapeHtml(t)}">${escapeHtml(t)} ×</span>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>正文</label>
          <textarea id="kf-content" rows="12" placeholder="每段之间空一行，将自动分段显示">${escapeHtml(f.contentText)}</textarea>
          <p class="form-hint">段落之间用空行分隔，支持多段内容</p>
        </div>
        <div class="form-actions">
          <button class="btn-primary" id="kf-save" data-edit-id="${isEdit ? editing.id : ''}">保存</button>
          <a href="#/my-knowledge" class="btn-ghost">取消</a>
        </div>
      </div>
    </div>`
}

function renderArticleNotesHub() {
  const notes = loadArticleNotes()
  const editingId = articleNotesEditState.id

  const listHtml = notes.length ? notes.map((note) => {
    const resolved = K.resolveArticleNote(note)
    const catLabel = resolved.source === 'my'
      ? (resolved.item.groupName || t('nav.myKnowledge'))
      : (resolved.category ? catTitle(resolved.category) : '')
    const editing = editingId === note.id
    const linkHtml = resolved.href
      ? `<a href="${resolved.href}" class="note-article-link">${escapeHtml(resolved.item.title)}</a>`
      : `<span class="note-article-link note-article-missing">${escapeHtml(t('notes.articleMissing'))}</span>`

    return `
      <div class="note-hub-card" data-note-id="${note.id}">
        <div class="note-hub-card-header">
          <div class="note-hub-article">${linkHtml}</div>
          ${catLabel ? `<span class="note-hub-meta">${escapeHtml(catLabel)}</span>` : ''}
          <span class="note-date">${formatDate(note.updatedAt)}</span>
        </div>
        ${editing ? `
          <textarea class="note-edit-input" id="hub-note-edit-${note.id}" rows="4">${escapeHtml(note.content)}</textarea>
          <div class="note-card-actions">
            <button type="button" class="btn-primary btn-hub-note-save" data-note-id="${note.id}">${escapeHtml(t('common.save'))}</button>
            <button type="button" class="btn-ghost btn-hub-note-cancel">${escapeHtml(t('common.cancel'))}</button>
          </div>
        ` : `
          <p class="note-content">${escapeHtml(note.content).replace(/\n/g, '<br>')}</p>
          <div class="note-card-actions">
            ${resolved.href ? `<a href="${resolved.href}" class="btn-ghost">${escapeHtml(t('notes.viewArticle'))}</a>` : ''}
            <button type="button" class="btn-hub-note-edit" data-note-id="${note.id}">${escapeHtml(t('common.edit'))}</button>
            <button type="button" class="btn-hub-note-delete danger" data-note-id="${note.id}">${escapeHtml(t('common.delete'))}</button>
          </div>
        `}
      </div>`
  }).join('') : `<p class="empty-hint">${escapeHtml(t('notes.empty'))}</p>`

  return `
    <div class="page notes-page">
      <header class="memory-header">
        <h1>${escapeHtml(t('notes.title'))}</h1>
        <p>${escapeHtml(t('notes.desc', { n: notes.length }))}</p>
      </header>
      <div class="notes-list">${listHtml}</div>
    </div>`
}

function bindArticleNotesHubEvents() {
  document.querySelectorAll('.btn-hub-note-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      articleNotesEditState.id = btn.dataset.noteId
      render()
    })
  })

  document.querySelectorAll('.btn-hub-note-cancel').forEach((btn) => {
    btn.addEventListener('click', () => {
      articleNotesEditState.id = null
      render()
    })
  })

  document.querySelectorAll('.btn-hub-note-save').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const content = document.getElementById(`hub-note-edit-${btn.dataset.noteId}`)?.value.trim()
      if (!content) {
        showToast(t('article.notesEmptyInput'), 'error')
        return
      }
      await updateArticleNote(btn.dataset.noteId, content)
      articleNotesEditState.id = null
      showToast(t('article.notesSaved'), 'success')
      render()
    })
  })

  document.querySelectorAll('.btn-hub-note-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm(t('notes.deleteConfirm'))) return
      await deleteArticleNote(btn.dataset.noteId)
      articleNotesEditState.id = null
      showToast(t('common.deleted'), 'info')
      render()
    })
  })
}

function renderFavoritesPage() {
  const favs = window.PDMStorage.loadFavorites()
  const resolved = favs.map((f) => K.resolveFavorite(f)).filter(Boolean)
  return `
    <div class="page favorites-page">
      <header class="memory-header">
        <h1>${escapeHtml(t('favorites.title'))}</h1>
        <p>${escapeHtml(t('favorites.desc', { n: resolved.length }))}</p>
      </header>
      <div class="article-list">
        ${resolved.length ? resolved.map(({ item, category, href, source }) => {
          const catLabel = source === 'my'
            ? item.groupName
            : t(`categories.${category?.id}.title`, null, category?.title || '')
          return `
          <a href="${href}" class="article-card">
            <div class="article-card-body">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.summary || '')}</p>
              <div class="article-tags">
                <span class="tag">${escapeHtml(catLabel)}</span>
                ${item.tags.slice(0, 3).map((tg) => `<span class="tag">${escapeHtml(tg)}</span>`).join('')}
              </div>
            </div>
            <span class="article-arrow">→</span>
          </a>`
        }).join('') : `<p class="empty-hint">${escapeHtml(t('favorites.empty'))}</p>`}
      </div>
    </div>`
}

function bindKnowledgeFormEvents() {
  document.getElementById('kf-add-tag')?.addEventListener('click', () => {
    const input = document.getElementById('kf-tag-input')
    const tag = input?.value.trim()
    if (tag && !knowledgeState.form.tags.includes(tag)) {
      knowledgeState.form.tags.push(tag)
      knowledgeState.tagInput = ''
      render()
    }
  })

  document.getElementById('kf-tag-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.getElementById('kf-add-tag')?.click()
    }
  })

  document.querySelectorAll('#kf-tags .removable').forEach(el => {
    el.addEventListener('click', () => {
      knowledgeState.form.tags = knowledgeState.form.tags.filter(t => t !== el.dataset.tag)
      render()
    })
  })

  document.getElementById('kf-save')?.addEventListener('click', async () => {
    const btn = document.getElementById('kf-save')
    const title = document.getElementById('kf-title')?.value.trim()
    const summary = document.getElementById('kf-summary')?.value.trim()
    const groupId = document.getElementById('kf-group')?.value
    const contentText = document.getElementById('kf-content')?.value || ''
    if (!title) {
      showToast('请填写标题', 'error')
      return
    }
    const content = contentText.split(/\n\n+/).map(s => s.trim()).filter(Boolean)
    if (content.length === 0) {
      showToast('请填写正文内容', 'error')
      return
    }
    const now = new Date().toISOString()
    const editId = btn?.dataset.editId
    const existing = editId ? loadCustomKnowledge().find(k => k.id === editId) : null
    const entry = {
      id: editId || `custom-${generateId()}`,
      groupId,
      title,
      summary: summary || title,
      tags: knowledgeState.form.tags,
      content,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }
    let items = loadCustomKnowledge()
    if (editId) {
      items = items.map(k => k.id === editId ? entry : k)
    } else {
      items = [entry, ...items]
    }
    await saveCustomKnowledge(items)
    knowledgeState.form = emptyKnowledgeForm(groupId)
    showToast('知识点已保存', 'success')
    navigate(`/my-knowledge/view/${entry.id}`)
  })
}

function bindMyKnowledgeHubEvents() {
  document.getElementById('my-k-search')?.addEventListener('input', (e) => {
    myKnowledgeState.q = e.target.value
    render()
  })
  document.querySelectorAll('.group-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      myKnowledgeState.groupId = btn.dataset.group
      render()
    })
  })
  document.getElementById('btn-new-group')?.addEventListener('click', () => {
    myKnowledgeState.showGroupForm = true
    myKnowledgeState.editingGroup = null
    myKnowledgeState.groupForm = { name: '', description: '' }
    render()
  })
  document.getElementById('gf-cancel')?.addEventListener('click', () => {
    myKnowledgeState.showGroupForm = false
    render()
  })
  document.getElementById('gf-save')?.addEventListener('click', async () => {
    const name = document.getElementById('gf-name')?.value.trim()
    if (!name) return showToast('请填写分组名称', 'error')
    const desc = document.getElementById('gf-desc')?.value.trim() || ''
    const now = new Date().toISOString()
    let groups = loadKnowledgeGroups()
    if (myKnowledgeState.editingGroup) {
      groups = groups.map((g) => g.id === myKnowledgeState.editingGroup
        ? { ...g, name, description: desc, updatedAt: now }
        : g)
    } else {
      groups = [...groups, { id: `grp-${generateId()}`, name, description: desc, createdAt: now, updatedAt: now }]
    }
    await saveKnowledgeGroups(groups)
    myKnowledgeState.showGroupForm = false
    showToast('分组已保存', 'success')
    render()
  })
  document.querySelectorAll('.btn-edit-group').forEach((btn) => {
    btn.addEventListener('click', () => {
      const g = loadKnowledgeGroups().find((x) => x.id === btn.dataset.id)
      if (!g) return
      myKnowledgeState.editingGroup = g.id
      myKnowledgeState.groupForm = { name: g.name, description: g.description || '' }
      myKnowledgeState.showGroupForm = true
      render()
    })
  })
  document.querySelectorAll('.btn-del-group').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('删除分组？组内知识将移入「默认分组」')) return
      const gid = btn.dataset.id
      let groups = loadKnowledgeGroups().filter((g) => g.id !== gid)
      let items = loadCustomKnowledge().map((k) => (k.groupId === gid ? { ...k, groupId: 'default', updatedAt: new Date().toISOString() } : k))
      await saveKnowledgeGroups(groups)
      await saveCustomKnowledge(items)
      if (myKnowledgeState.groupId === gid) myKnowledgeState.groupId = 'all'
      showToast('分组已删除', 'info')
      render()
    })
  })
}

function bindMyKnowledgeViewEvents(itemId) {
  bindFavoriteButton()
  bindArticleNotesEvents()
  document.getElementById('btn-delete-my-knowledge')?.addEventListener('click', async () => {
    if (!confirm('确定删除这条知识点？')) return
    const items = loadCustomKnowledge().filter(k => k.id !== itemId)
    await saveCustomKnowledge(items)
    showToast('已删除', 'info')
    navigate('/my-knowledge')
  })
}

function renderLoginRequired(message) {
  return `
    <div class="page login-required-page">
      <h1>${escapeHtml(t('auth.requiredTitle'))}</h1>
      <p>${escapeHtml(message || t('auth.requiredDefault'))}</p>
      <a href="#/login" class="btn-primary">${escapeHtml(t('auth.cta'))}</a>
    </div>`
}

function renderLoginPage() {
  const configured = Auth().isConfigured()
  return `
    <div class="page auth-page">
      <div class="auth-card">
        <h1>${escapeHtml(t('auth.pageTitle'))}</h1>
        <p class="auth-desc">${escapeHtml(t('auth.pageDesc'))}</p>
        ${!configured ? `<p class="auth-warn">${escapeHtml(t('auth.notConfigured'))}</p>` : ''}
        <div class="form-group">
          <label>${escapeHtml(t('auth.email'))}</label>
          <input id="auth-email" type="email" placeholder="your@email.com" />
        </div>
        <div class="form-group">
          <label>${escapeHtml(t('auth.password'))}</label>
          <input id="auth-password" type="password" placeholder="${escapeHtml(t('auth.passwordPlaceholder'))}" />
        </div>
        <div class="form-actions auth-actions">
          <button class="btn-primary" id="auth-login" ${configured ? '' : 'disabled'}>${escapeHtml(t('auth.login'))}</button>
          <button class="btn-secondary" id="auth-register" ${configured ? '' : 'disabled'}>${escapeHtml(t('auth.register'))}</button>
        </div>
      </div>
    </div>`
}

async function fetchAdminStats() {
  const sb = Auth().getClient()
  if (!sb || !Auth().isAdmin()) throw new Error('无权限')
  const [profilesRes, eventsRes, dauMauRes] = await Promise.all([
    sb.from('profiles').select('id, email, login_count, last_login_at, created_at').order('created_at', { ascending: false }),
    sb.from('usage_events').select('event_type'),
    sb.rpc('get_dau_mau_stats'),
  ])
  if (profilesRes.error) throw profilesRes.error
  if (eventsRes.error) throw eventsRes.error
  if (dauMauRes.error) throw new Error('请先执行 supabase/schema.sql 中的 DAU/MAU 脚本')
  const events = eventsRes.data || []
  const eventCounts = {}
  for (const e of events) eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1
  const dauMau = dauMauRes.data || {}
  return {
    users: profilesRes.data || [],
    totalUsers: (profilesRes.data || []).length,
    dau: dauMau.dau ?? 0,
    mau: dauMau.mau ?? 0,
    dauTrend: buildDauTrend(dauMau.dau_trend),
    eventCounts,
    totalEvents: events.length,
  }
}

function buildDauTrend(rawTrend) {
  const map = new Map((rawTrend || []).map((r) => [r.date, r.count]))
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`
    days.push({ date: key, label, count: map.get(key) || 0 })
  }
  return days
}

function renderDauTrend(trend) {
  const max = Math.max(...trend.map((d) => d.count), 1)
  return `
    <div class="dau-trend">
      ${trend.map((d) => {
        const pct = Math.round((d.count / max) * 100)
        return `
          <div class="dau-trend-col">
            <div class="dau-trend-bar-wrap">
              <div class="dau-trend-bar" style="height:${pct}%"></div>
            </div>
            <span class="dau-trend-val">${d.count}</span>
            <span class="dau-trend-label">${d.label}</span>
          </div>`
      }).join('')}
    </div>`
}

function renderAdminPage(stats) {
  const topEvents = Object.entries(stats.eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  return `
    <div class="page admin-page">
      <header class="memory-header">
        <h1>数据统计</h1>
        <p>用户注册、登录与功能使用概览（仅管理员可见）</p>
        <div class="admin-tabs">
          <span class="admin-tab active">数据统计</span>
          <a href="#/admin/knowledge" class="admin-tab">知识管理</a>
        </div>
      </header>
      <div class="admin-stats-grid">
        <div class="admin-stat-card"><span class="admin-stat-num">${stats.totalUsers}</span><span class="admin-stat-label">注册用户</span></div>
        <div class="admin-stat-card"><span class="admin-stat-num">${stats.dau}</span><span class="admin-stat-label">DAU（今日活跃）</span></div>
        <div class="admin-stat-card"><span class="admin-stat-num">${stats.mau}</span><span class="admin-stat-label">MAU（近 30 日）</span></div>
        <div class="admin-stat-card"><span class="admin-stat-num">${stats.totalEvents}</span><span class="admin-stat-label">行为记录总数</span></div>
      </div>
      <section class="section">
        <h2 class="section-title">近 7 日 DAU 趋势</h2>
        ${renderDauTrend(stats.dauTrend)}
      </section>
      <section class="section">
        <h2 class="section-title">行为分布</h2>
        <div class="admin-event-list">
          ${topEvents.length ? topEvents.map(([k, v]) => `<div class="admin-event-row"><span>${k}</span><span>${v}</span></div>`).join('') : '<p class="empty-hint">暂无数据</p>'}
        </div>
      </section>
      <section class="section">
        <h2 class="section-title">用户列表</h2>
        <div class="admin-user-table">
          <div class="admin-user-header"><span>邮箱</span><span>登录次数</span><span>最近登录</span><span>注册时间</span></div>
          ${stats.users.map(u => `
            <div class="admin-user-row">
              <span>${escapeHtml(u.email || '-')}</span>
              <span>${u.login_count || 0}</span>
              <span>${u.last_login_at ? formatDate(u.last_login_at) : '-'}</span>
              <span>${formatDate(u.created_at)}</span>
            </div>`).join('')}
        </div>
      </section>
    </div>`
}

let adminKnowledgeState = { filter: 'all', status: 'all', q: '' }
let adminKnowledgeFormState = { tags: [], tagInput: '' }

function renderAdminKnowledgePage(entries) {
  const q = adminKnowledgeState.q.toLowerCase().trim()
  const filtered = entries.filter((e) => {
    if (adminKnowledgeState.filter !== 'all' && e.sourceSkill !== adminKnowledgeState.filter) return false
    if (adminKnowledgeState.status === 'published' && !e.published) return false
    if (adminKnowledgeState.status === 'draft' && e.published) return false
    if (q) {
      const hay = `${e.title} ${e.summary} ${e.section} ${(e.tags || []).join(' ')} ${(e.content || []).join(' ')}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
  const publishedCount = entries.filter((e) => e.published).length
  const draftCount = entries.length - publishedCount

  return `
    <div class="page admin-page">
      <header class="memory-header">
        <h1>知识管理</h1>
        <p>在网页直接编辑 Skill 词条、新增知识，并选择是否发布到全站用户（无需 Cursor）</p>
        <div class="admin-tabs">
          <a href="#/admin" class="admin-tab">数据统计</a>
          <span class="admin-tab active">知识管理</span>
        </div>
      </header>
      <section class="section">
        <div class="skill-toolbar">
          <input type="search" id="skill-search" placeholder="搜索标题、正文、章节…" value="${escapeHtml(adminKnowledgeState.q)}" />
          <select id="skill-filter">
            <option value="all" ${adminKnowledgeState.filter === 'all' ? 'selected' : ''}>全部来源</option>
            <option value="pm-bagu" ${adminKnowledgeState.filter === 'pm-bagu' ? 'selected' : ''}>产品经理八股</option>
            <option value="industry-terms" ${adminKnowledgeState.filter === 'industry-terms' ? 'selected' : ''}>行业通用词语</option>
            <option value="admin" ${adminKnowledgeState.filter === 'admin' ? 'selected' : ''}>运营新增</option>
          </select>
          <select id="skill-status">
            <option value="all" ${adminKnowledgeState.status === 'all' ? 'selected' : ''}>全部状态</option>
            <option value="published" ${adminKnowledgeState.status === 'published' ? 'selected' : ''}>已发布全站</option>
            <option value="draft" ${adminKnowledgeState.status === 'draft' ? 'selected' : ''}>草稿</option>
          </select>
          <a href="#/admin/knowledge/new" class="btn-primary">+ 新增知识</a>
          <button type="button" class="btn-secondary" id="btn-import-catalog">导入内置 Skill</button>
        </div>
        <p class="form-hint">共 ${entries.length} 条 · 已发布 ${publishedCount} · 草稿 ${draftCount}。已发布内容对所有用户可见并带「全站」标记。</p>
        <div class="admin-knowledge-table">
          <div class="admin-knowledge-header">
            <span>标题</span><span>来源</span><span>分类</span><span>状态</span><span>操作</span>
          </div>
          ${filtered.length ? filtered.map((e) => `
            <div class="admin-knowledge-row">
              <div>
                <strong>${escapeHtml(e.title)}</strong>
                ${e.section ? `<span class="form-hint">${escapeHtml(e.section)}</span>` : ''}
              </div>
              <span>${escapeHtml(SharedK().getSkillLabel(e.sourceSkill))}</span>
              <span>${escapeHtml(e.categoryId)}</span>
              <span>${e.published ? '<span class="shared-badge">全站</span>' : '<span class="tag tag-muted">草稿</span>'}</span>
              <span class="admin-knowledge-actions">
                <a href="#/admin/knowledge/edit/${encodeURIComponent(e.id)}" class="btn-ghost btn-sm">编辑</a>
                <button type="button" class="btn-ghost btn-sm btn-admin-del" data-id="${escapeHtml(e.id)}">删除</button>
              </span>
            </div>`).join('') : '<p class="empty-hint">暂无知识。可「新增知识」或「导入内置 Skill」开始。</p>'}
        </div>
      </section>
    </div>`
}

function renderAdminKnowledgeEditor(entry) {
  const isEdit = Boolean(entry)
  const cats = K.builtinCategories()
  const skills = SharedK().SKILL_LABELS || {}
  const f = entry || {
    sourceSkill: 'admin',
    categoryId: 'methodology',
    section: '',
    title: '',
    summary: '',
    tags: [],
    content: [],
    published: false,
  }
  if (isEdit && !adminKnowledgeFormState.tags.length && f.tags?.length) {
    adminKnowledgeFormState.tags = [...f.tags]
  }
  const tags = adminKnowledgeFormState.tags.length ? adminKnowledgeFormState.tags : (f.tags || [])
  const contentText = Array.isArray(f.content) ? f.content.join('\n\n') : ''

  return `
    <div class="page admin-page">
      <header class="memory-header">
        <h1>${isEdit ? '编辑知识' : '新增知识'}</h1>
        <p>保存后可选择是否立即发布到全站用户</p>
        <div class="admin-tabs">
          <a href="#/admin/knowledge" class="admin-tab">← 返回列表</a>
        </div>
      </header>
      <div class="form-card knowledge-form admin-knowledge-form">
        <div class="form-row">
          <div class="form-group">
            <label>知识来源</label>
            <select id="ak-skill">
              ${Object.entries(skills).map(([k, v]) => `<option value="${k}" ${f.sourceSkill === k ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>公开分类</label>
            <select id="ak-category">
              ${cats.map((c) => `<option value="${c.id}" ${f.categoryId === c.id ? 'selected' : ''}>${escapeHtml(c.title)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>章节 / 小节（可选）</label>
          <input id="ak-section" value="${escapeHtml(f.section || '')}" placeholder="如：1. 核心模型（PM 必会）" />
        </div>
        <div class="form-group">
          <label>标题</label>
          <input id="ak-title" value="${escapeHtml(f.title || '')}" placeholder="如：AARRR（海盗模型）" />
        </div>
        <div class="form-group">
          <label>摘要</label>
          <input id="ak-summary" value="${escapeHtml(f.summary || '')}" placeholder="一句话概括" />
        </div>
        <div class="form-group">
          <label>标签</label>
          <div class="tag-input-row">
            <input id="ak-tag-input" placeholder="输入后回车添加" value="${escapeHtml(adminKnowledgeFormState.tagInput)}" />
            <button type="button" class="btn-secondary" id="ak-add-tag">添加</button>
          </div>
          <div class="tag-list" id="ak-tags">
            ${tags.map((t) => `<span class="tag removable" data-tag="${escapeHtml(t)}">${escapeHtml(t)} ×</span>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>正文</label>
          <textarea id="ak-content" rows="14" placeholder="每段之间空一行。建议格式：&#10;解释：...&#10;案例：...&#10;PM 应用：...">${escapeHtml(contentText)}</textarea>
        </div>
        <div class="form-group publish-toggle-box">
          <label class="checkbox-label publish-toggle">
            <input type="checkbox" id="ak-published" ${f.published ? 'checked' : ''} />
            <strong>发布到全站用户</strong>
          </label>
          <p class="form-hint">勾选后所有访客可在知识库中看到（带「全站」标记）；不勾选仅保存为草稿，仅管理员可见。</p>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-primary" id="ak-save" data-id="${isEdit ? escapeHtml(f.id) : ''}">保存</button>
          <a href="#/admin/knowledge" class="btn-ghost">取消</a>
          ${isEdit ? `<button type="button" class="btn-ghost btn-danger-text" id="ak-delete">删除</button>` : ''}
        </div>
      </div>
    </div>`
}

function bindAdminKnowledgeEvents() {
  document.getElementById('skill-search')?.addEventListener('input', (e) => {
    adminKnowledgeState.q = e.target.value
    renderAdminKnowledgeRoute()
  })
  document.getElementById('skill-filter')?.addEventListener('change', (e) => {
    adminKnowledgeState.filter = e.target.value
    renderAdminKnowledgeRoute()
  })
  document.getElementById('skill-status')?.addEventListener('change', (e) => {
    adminKnowledgeState.status = e.target.value
    renderAdminKnowledgeRoute()
  })
  document.getElementById('btn-import-catalog')?.addEventListener('click', async () => {
    if (!confirm('从内置 Skill 目录导入尚未存在的词条（默认草稿）？')) return
    try {
      const n = await SharedK().importBuiltinCatalog()
      showToast(n ? `已导入 ${n} 条` : '没有新词条需要导入', n ? 'success' : 'info')
      renderAdminKnowledgeRoute()
    } catch (e) { showToast(e.message, 'error') }
  })
  document.querySelectorAll('.btn-admin-del').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('确定删除该知识？已发布内容将从全站下架。')) return
      try {
        await SharedK().deleteEntry(btn.dataset.id)
        showToast('已删除', 'info')
        renderAdminKnowledgeRoute()
        render()
      } catch (e) { showToast(e.message, 'error') }
    })
  })
}

function refreshAdminEditorTags() {
  const el = document.getElementById('ak-tags')
  if (!el) return
  el.innerHTML = adminKnowledgeFormState.tags
    .map((t) => `<span class="tag removable" data-tag="${escapeHtml(t)}">${escapeHtml(t)} ×</span>`)
    .join('')
  el.querySelectorAll('.removable').forEach((tagEl) => {
    tagEl.addEventListener('click', () => {
      adminKnowledgeFormState.tags = adminKnowledgeFormState.tags.filter((t) => t !== tagEl.dataset.tag)
      refreshAdminEditorTags()
    })
  })
}

function bindAdminKnowledgeEditorEvents() {
  document.getElementById('ak-add-tag')?.addEventListener('click', () => {
    const input = document.getElementById('ak-tag-input')
    const tag = input?.value.trim()
    if (tag && !adminKnowledgeFormState.tags.includes(tag)) {
      adminKnowledgeFormState.tags.push(tag)
      if (input) input.value = ''
      refreshAdminEditorTags()
    }
  })
  document.getElementById('ak-tag-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('ak-add-tag')?.click() }
  })
  refreshAdminEditorTags()
  document.getElementById('ak-save')?.addEventListener('click', async () => {
    const title = document.getElementById('ak-title')?.value.trim()
    const contentText = document.getElementById('ak-content')?.value || ''
    if (!title) return showToast('请填写标题', 'error')
    const content = contentText.split(/\n\n+/).map((s) => s.trim()).filter(Boolean)
    if (!content.length) return showToast('请填写正文', 'error')
    try {
      await SharedK().saveEntry({
        id: document.getElementById('ak-save')?.dataset.id || undefined,
        sourceSkill: document.getElementById('ak-skill')?.value,
        categoryId: document.getElementById('ak-category')?.value,
        section: document.getElementById('ak-section')?.value.trim(),
        title,
        summary: document.getElementById('ak-summary')?.value.trim() || title,
        tags: adminKnowledgeFormState.tags,
        content,
        published: document.getElementById('ak-published')?.checked,
      })
      adminKnowledgeFormState = { tags: [], tagInput: '' }
      showToast('已保存', 'success')
      render()
      navigate('/admin/knowledge')
    } catch (e) { showToast(e.message, 'error') }
  })
  document.getElementById('ak-delete')?.addEventListener('click', async () => {
    const id = document.getElementById('ak-save')?.dataset.id
    if (!id || !confirm('确定删除？')) return
    try {
      await SharedK().deleteEntry(id)
      adminKnowledgeFormState = { tags: [], tagInput: '' }
      showToast('已删除', 'info')
      navigate('/admin/knowledge')
    } catch (e) { showToast(e.message, 'error') }
  })
}

function renderAdminKnowledgeRoute() {
  const main = document.getElementById('main')
  if (!Auth().isAdmin()) {
    main.innerHTML = renderForbidden()
    return
  }
  main.innerHTML = '<div class="page"><p>加载知识库…</p></div>'
  SharedK().fetchAdminList().then((list) => {
    main.innerHTML = renderAdminKnowledgePage(list)
    bindAdminKnowledgeEvents()
    Analytics()?.track('admin_knowledge_view')
  }).catch((e) => {
    main.innerHTML = `<div class="page"><p>${escapeHtml(e.message)}</p><p class="form-hint">请先在 Supabase SQL Editor 执行 supabase/schema.sql。</p></div>`
  })
}

function renderAdminKnowledgeEditorRoute(id) {
  const main = document.getElementById('main')
  if (!Auth().isAdmin()) {
    main.innerHTML = renderForbidden()
    return
  }
  if (!id || id === 'new') {
    adminKnowledgeFormState = { tags: [], tagInput: '' }
    main.innerHTML = renderAdminKnowledgeEditor(null)
    bindAdminKnowledgeEditorEvents()
    return
  }
  main.innerHTML = '<div class="page"><p>加载中…</p></div>'
  SharedK().getById(decodeURIComponent(id)).then((entry) => {
    if (!entry) {
      main.innerHTML = '<div class="page"><p>内容不存在</p><a href="#/admin/knowledge">返回</a></div>'
      return
    }
    adminKnowledgeFormState = { tags: [...(entry.tags || [])], tagInput: '' }
    main.innerHTML = renderAdminKnowledgeEditor(entry)
    bindAdminKnowledgeEditorEvents()
  }).catch((e) => {
    main.innerHTML = `<div class="page"><p>${escapeHtml(e.message)}</p></div>`
  })
}

function renderDailyLearnPage() {
  const settings = DailyPush()?.getSettings() || {}
  const cats = K.builtinCategories()
  const today = DailyPush()?.todayKey()
  const todayItems = settings.lastPushDate === today ? (settings.lastPushItems || []) : []
  return `
    <div class="page daily-learn-page">
      <header class="memory-header">
        <h1>每日学习</h1>
        <p>自定义推送时间，每天为你精选 3 条知识（需保持页面打开或允许浏览器通知）</p>
      </header>
      <section class="section daily-learn-settings">
        <h2 class="section-title">推送设置</h2>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="push-enabled" ${settings.enabled ? 'checked' : ''} />
            开启每日推送
          </label>
        </div>
        <div class="form-group">
          <label>推送时间（每天）</label>
          <input type="time" id="push-time" value="${settings.time || '09:00'}" />
        </div>
        <div class="form-group">
          <label>知识分类（不选则全库随机）</label>
          <div class="push-category-chips">
            ${cats.map((c) => `
              <label class="chip-label">
                <input type="checkbox" class="push-cat" value="${c.id}" ${(settings.categories || []).includes(c.id) ? 'checked' : ''} />
                ${c.title}
              </label>`).join('')}
          </div>
        </div>
        <p class="form-hint">每次固定推送 <strong>3</strong> 条，优先避开近 7 天已推送过的内容。</p>
        <div class="form-actions">
          <button type="button" class="btn-primary" id="btn-save-push">保存设置</button>
          <button type="button" class="btn-secondary" id="btn-push-now">立即推送今日 3 条</button>
          <button type="button" class="btn-ghost" id="btn-push-notify">开启浏览器通知</button>
        </div>
      </section>
      <section class="section">
        <h2 class="section-title">今日推送 ${settings.lastPushDate === today ? `（${settings.time || '09:00'}）` : ''}</h2>
        ${todayItems.length ? `
          <div class="daily-push-cards">
            ${todayItems.map((item) => `
              <a href="#/article/${item.categoryId}/${item.itemId}" class="daily-push-card">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.summary || '')}</p>
                <span class="memory-banner-action">去学习 →</span>
              </a>`).join('')}
          </div>` : '<p class="empty-hint">今日尚未推送。可点击「立即推送」或等到设定时间（需打开网站）。</p>'}
      </section>
    </div>`
}

function bindDailyLearnEvents() {
  document.getElementById('btn-save-push')?.addEventListener('click', async () => {
    const enabled = document.getElementById('push-enabled')?.checked
    const time = document.getElementById('push-time')?.value || '09:00'
    const categories = [...document.querySelectorAll('.push-cat:checked')].map((el) => el.value)
    try {
      await DailyPush().saveSettings({ enabled, time, count: 3, categories })
      showToast('推送设置已保存', 'success')
      render()
    } catch (e) { showToast(e.message, 'error') }
  })
  document.getElementById('btn-push-now')?.addEventListener('click', async () => {
    try {
      const records = await DailyPush().executePush(true)
      if (!records?.length) return showToast('知识库为空，无法推送', 'error')
      showDailyPushModal(records)
      showToast('已推送今日 3 条知识', 'success')
      render()
    } catch (e) { showToast(e.message, 'error') }
  })
  document.getElementById('btn-push-notify')?.addEventListener('click', async () => {
    const r = await DailyPush().requestNotificationPermission()
    showToast(r === 'granted' ? '通知已开启' : r === 'denied' ? '通知被拒绝，请在浏览器设置中允许' : '当前浏览器不支持通知', r === 'granted' ? 'success' : 'info')
  })
}

function showDailyPushModal(records) {
  document.getElementById('daily-push-modal')?.remove()
  const el = document.createElement('div')
  el.id = 'daily-push-modal'
  el.className = 'daily-push-overlay'
  el.innerHTML = `
    <div class="daily-push-modal">
      <h2>今日学习 · ${records.length} 条知识</h2>
      <p class="auth-desc">按计划为你精选的内容，点击可跳转阅读。</p>
      <div class="daily-push-cards">
        ${records.map((item) => `
          <a href="#/article/${item.categoryId}/${item.itemId}" class="daily-push-card">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.summary || '')}</p>
          </a>`).join('')}
      </div>
      <button type="button" class="btn-primary" id="push-modal-close">开始学习</button>
    </div>`
  document.body.appendChild(el)
  el.querySelector('#push-modal-close')?.addEventListener('click', () => {
    el.remove()
    navigate('/daily-learn')
  })
  el.addEventListener('click', (e) => {
    if (e.target === el) el.remove()
  })
}

function renderCloudPanel() {
  const cloud = PDMCloud.getCloudState()
  if (!cloud.loggedIn) return ''
  let syncHint = '已登录，保存时自动同步云端'
  if (cloud.syncStatus === 'syncing') syncHint = '同步中…'
  else if (cloud.syncStatus === 'ok' && cloud.lastSyncAt) syncHint = `上次同步：${formatDate(cloud.lastSyncAt)}`
  else if (cloud.syncStatus === 'error') syncHint = `同步失败：${escapeHtml(cloud.lastError || '')}`
  return `
    <div class="cloud-panel cloud-panel-logged-in">
      <div class="cloud-panel-header">
        <div>
          <h3>云端同步 <span class="cloud-badge">已连接</span></h3>
          <p class="cloud-sync-line ${cloud.syncStatus === 'error' ? 'error' : ''}">${syncHint}</p>
        </div>
        <button class="btn-secondary" id="btn-cloud-sync">立即同步</button>
      </div>
    </div>`
}

function bindLoginEvents() {
  document.getElementById('auth-login')?.addEventListener('click', async () => {
    const email = document.getElementById('auth-email')?.value?.trim()
    const password = document.getElementById('auth-password')?.value
    if (!email || !password) return showToast('请填写邮箱和密码', 'error')
    try {
      await Auth().signInWithEmail(email, password)
      await Analytics()?.trackDailyActive?.()
      await PDMCloud.init()
      if (Auth().isLoggedIn()) DailyPush()?.start?.(showDailyPushModal)
      showToast('登录成功', 'success')
      navigate('/')
    } catch (e) { showToast(e.message, 'error') }
  })
  document.getElementById('auth-register')?.addEventListener('click', async () => {
    const email = document.getElementById('auth-email')?.value?.trim()
    const password = document.getElementById('auth-password')?.value
    if (!email || !password) return showToast('请填写邮箱和密码', 'error')
    if (password.length < 6) return showToast('密码至少 6 位', 'error')
    try {
      const data = await Auth().signUpWithEmail(email, password)
      if (data.session) {
        await Analytics()?.trackDailyActive?.()
        await PDMCloud.init()
        if (Auth().isLoggedIn()) DailyPush()?.start?.(showDailyPushModal)
        showToast('注册成功', 'success')
        navigate('/')
      } else showToast('注册成功，请查收邮件确认后登录', 'info')
    } catch (e) { showToast(e.message, 'error') }
  })
}

function bindLocaleEvents() {
  document.querySelectorAll('.locale-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.PMLabI18n?.setLocale(btn.dataset.locale)
    })
  })
}

function bindSidebarAccountEvents() {
  const menuBtn = document.getElementById('sidebar-account-menu-btn')
  const menu = document.getElementById('sidebar-account-menu')

  const closeMenu = () => {
    menu?.setAttribute('hidden', '')
  }

  menuBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    if (!menu) return
    const open = menu.hasAttribute('hidden')
    if (open) menu.removeAttribute('hidden')
    else menu.setAttribute('hidden', '')
  })

  document.addEventListener('click', (e) => {
    if (!menu || menu.hasAttribute('hidden')) return
    if (!e.target.closest('.sidebar-account-actions')) closeMenu()
  })

  document.getElementById('sidebar-logout')?.addEventListener('click', async () => {
    closeMenu()
    await Auth().signOut()
    showToast(t('auth.toastLoggedOut'), 'info')
    navigate('/')
  })
}

function bindSyncEvents() {
  document.getElementById('btn-cloud-sync')?.addEventListener('click', async () => {
    try {
      await PDMCloud.syncNow()
      showToast(t('common.syncDone'), 'success')
      render()
    } catch (e) { showToast(e.message, 'error') }
  })
}

function renderStoragePanel() {
  const stats = getStorageStats()
  return `
    <div class="storage-panel">
      <div class="storage-panel-info">
        <h3>数据安全</h3>
        <p>记录保存在本机浏览器（IndexedDB + localStorage 双备份），登录云端后自动多设备同步。</p>
        <div class="storage-stats">
          <span>${stats.reviewCount} 条复盘</span>
          <span class="stat-sep">·</span>
          <span>${stats.customKnowledgeCount || 0} 条我的知识</span>
          <span class="stat-sep">·</span>
          <span>${stats.favoritesCount || 0} 条收藏</span>
          <span>${stats.articleNotesCount || 0} 条笔记</span>
          <span class="stat-sep">·</span>
          <span>约 ${stats.readable}</span>
          ${!stats.localMirrorOk ? '<span class="stat-warn">（数据较多，请务必导出备份）</span>' : ''}
        </div>
      </div>
      <div class="storage-panel-actions">
        <button class="btn-secondary" id="btn-export-backup">导出备份</button>
        <button class="btn-secondary" id="btn-import-merge">导入（合并）</button>
        <button class="btn-ghost btn-danger-text" id="btn-import-replace">导入（覆盖）</button>
        <input type="file" id="import-file" accept=".json,application/json" hidden />
      </div>
    </div>`
}

let reviewState = { showReviewForm: false, editingReview: null }

function renderReviews() {
  if (!Auth().isLoggedIn()) return renderLoginRequired(t('auth.requiredReviews'))
  const reviews = loadReviews()
  const s = reviewState

  let reviewContent = ''
  if (s.showReviewForm) {
    const f = s.reviewForm || { title: '', period: '', whatWorked: '', whatFailed: '', lessons: '', nextActions: '' }
    reviewContent = `
      <div class="form-card review-form" id="review-form">
        <h3>${s.editingReview ? '编辑复盘' : '新建复盘'}</h3>
        <div class="form-row">
          <div class="form-group"><label>复盘标题</label><input id="rf-title" value="${escapeHtml(f.title)}" placeholder="如：Q1 产品学习复盘" /></div>
          <div class="form-group"><label>复盘周期</label><input id="rf-period" value="${escapeHtml(f.period)}" placeholder="如：2025年3月" /></div>
        </div>
        <div class="form-group"><label>做得好的</label><textarea id="rf-worked" rows="3">${escapeHtml(f.whatWorked)}</textarea></div>
        <div class="form-group"><label>待改进的</label><textarea id="rf-failed" rows="3">${escapeHtml(f.whatFailed)}</textarea></div>
        <div class="form-group"><label>关键收获</label><textarea id="rf-lessons" rows="3">${escapeHtml(f.lessons)}</textarea></div>
        <div class="form-group"><label>下一步行动</label><textarea id="rf-actions" rows="3">${escapeHtml(f.nextActions)}</textarea></div>
        <div class="form-actions"><button class="btn-primary" id="rf-save">保存</button><button class="btn-ghost" id="rf-cancel">取消</button></div>
      </div>`
  } else if (reviews.length === 0) {
    reviewContent = `<div class="empty-state"><p>还没有复盘记录</p><p class="empty-hint">定期回顾学习与实践，用结构化复盘加速成长</p><button class="btn-primary" id="btn-new-review">开始第一次复盘</button></div>`
  } else {
    reviewContent = `<div class="review-list">${reviews.map(r => `
      <div class="review-card">
        <div class="review-card-header">
          <div><h3>${escapeHtml(r.title)}</h3>${r.period ? `<span class="review-period">${escapeHtml(r.period)}</span>` : ''}</div>
          <span class="memory-date">${formatDate(r.updatedAt)}</span>
        </div>
        <div class="review-blocks">
          ${r.whatWorked ? `<div class="review-block positive"><h4>做得好的</h4><p>${escapeHtml(r.whatWorked)}</p></div>` : ''}
          ${r.whatFailed ? `<div class="review-block negative"><h4>待改进的</h4><p>${escapeHtml(r.whatFailed)}</p></div>` : ''}
          ${r.lessons ? `<div class="review-block insight"><h4>关键收获</h4><p>${escapeHtml(r.lessons)}</p></div>` : ''}
          ${r.nextActions ? `<div class="review-block action"><h4>下一步行动</h4><p>${escapeHtml(r.nextActions)}</p></div>` : ''}
        </div>
        <div class="memory-card-actions">
          <button data-edit-review="${r.id}">编辑</button>
          <button class="danger" data-del-review="${r.id}">删除</button>
        </div>
      </div>`).join('')}</div>`
  }

  return `
    <div class="page memory-page">
      <header class="memory-header"><h1>复盘记录</h1><p>结构化记录学习与实践复盘，沉淀可复用的成长经验</p></header>
      ${renderCloudPanel()}
      ${renderStoragePanel()}
      <section class="memory-section">
        <div class="section-toolbar"><h2>我的复盘</h2><button class="btn-primary" id="btn-new-review">+ 新建复盘</button></div>
        ${reviewContent}
      </section>
    </div>`
}

let pendingImportMode = 'merge'

function bindReviewEvents() {
  bindSyncEvents()
  document.getElementById('btn-export-backup')?.addEventListener('click', () => {
    exportBackup()
    showToast('备份已下载到本地', 'success')
  })

  document.getElementById('btn-import-merge')?.addEventListener('click', () => {
    pendingImportMode = 'merge'
    document.getElementById('import-file')?.click()
  })

  document.getElementById('btn-import-replace')?.addEventListener('click', () => {
    if (!confirm('覆盖导入将替换当前所有个人数据，此操作不可撤销。确定继续？')) return
    pendingImportMode = 'replace'
    document.getElementById('import-file')?.click()
  })

  document.getElementById('import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importBackup(file, pendingImportMode)
      showToast(`导入成功：${result.reviewCount} 条复盘，${result.customKnowledgeCount} 条知识`, 'success')
      render()
    } catch (err) {
      showToast(err.message || '导入失败', 'error')
    }
    e.target.value = ''
    pendingImportMode = 'merge'
  })

  document.getElementById('btn-new-review')?.addEventListener('click', () => {
    reviewState.showReviewForm = true
    reviewState.editingReview = null
    reviewState.reviewForm = { title: '', period: '', whatWorked: '', whatFailed: '', lessons: '', nextActions: '' }
    render()
  })

  document.getElementById('rf-cancel')?.addEventListener('click', () => { reviewState.showReviewForm = false; render() })

  document.getElementById('rf-save')?.addEventListener('click', async () => {
    const title = document.getElementById('rf-title').value.trim()
    if (!title) return
    const now = new Date().toISOString()
    const entry = {
      id: reviewState.editingReview?.id || generateId(),
      title,
      period: document.getElementById('rf-period').value,
      whatWorked: document.getElementById('rf-worked').value,
      whatFailed: document.getElementById('rf-failed').value,
      lessons: document.getElementById('rf-lessons').value,
      nextActions: document.getElementById('rf-actions').value,
      createdAt: reviewState.editingReview?.createdAt || now,
      updatedAt: now,
    }
    let reviews = loadReviews()
    if (reviewState.editingReview) {
      reviews = reviews.map(r => r.id === entry.id ? entry : r)
    } else {
      reviews = [entry, ...reviews]
    }
    const { localOk } = await saveReviews(reviews)
    reviewState.showReviewForm = false
    if (!localOk) showToast('已保存（数据较多，建议导出备份）', 'info')
    else showToast('复盘已保存', 'success')
    render()
  })

  document.querySelectorAll('[data-edit-review]').forEach(btn => {
    btn.addEventListener('click', () => {
      const entry = loadReviews().find(r => r.id === btn.dataset.editReview)
      if (entry) {
        reviewState.editingReview = entry
        reviewState.reviewForm = { title: entry.title, period: entry.period, whatWorked: entry.whatWorked, whatFailed: entry.whatFailed, lessons: entry.lessons, nextActions: entry.nextActions }
        reviewState.showReviewForm = true
        render()
      }
    })
  })

  document.querySelectorAll('[data-del-review]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('确定删除这条复盘？')) return
      await saveReviews(loadReviews().filter(r => r.id !== btn.dataset.delReview))
      showToast('已删除', 'info')
      render()
    })
  })
}

function render() {
  const { parts } = parseRoute()
  const path = '/' + parts.join('/')
  renderLocaleSwitcher()
  renderSidebar(path)
  bindLocaleEvents()
  bindSidebarAccountEvents()
  bindSyncEvents()

  const forbiddenHtml = renderForbidden()

  const main = document.getElementById('main')
  if (parts.length === 0) {
    main.innerHTML = renderHome()
    Analytics()?.track('page_view', { page: 'home' })
  } else if (parts[0] === 'login') {
    main.innerHTML = renderLoginPage()
    bindLoginEvents()
  } else if (parts[0] === 'admin' && parts[1] === 'knowledge' && parts[2] === 'new') {
    if (!Auth().isAdmin()) {
      main.innerHTML = forbiddenHtml
    } else {
      renderAdminKnowledgeEditorRoute('new')
    }
  } else if (parts[0] === 'admin' && parts[1] === 'knowledge' && parts[2] === 'edit' && parts[3]) {
    if (!Auth().isAdmin()) {
      main.innerHTML = forbiddenHtml
    } else {
      renderAdminKnowledgeEditorRoute(parts[3])
    }
  } else if (parts[0] === 'admin' && parts[1] === 'knowledge') {
    if (!Auth().isAdmin()) {
      main.innerHTML = forbiddenHtml
    } else {
      renderAdminKnowledgeRoute()
    }
  } else if (parts[0] === 'admin') {
    if (!Auth().isAdmin()) {
      main.innerHTML = forbiddenHtml
    } else {
      main.innerHTML = '<div class="page"><p>加载统计数据…</p></div>'
      fetchAdminStats().then(stats => {
        main.innerHTML = renderAdminPage(stats)
        Analytics()?.track('admin_view')
      }).catch(e => {
        main.innerHTML = `<div class="page"><p>${escapeHtml(e.message)}</p></div>`
      })
    }
  } else if (parts[0] === 'industry' && parts[1] === 'learning-path' && parts[2]) {
    main.innerHTML = Sections().renderLearningPathDetail(parts[2])
    Analytics()?.track('page_view', { page: 'learning-path', id: parts[2] })
  } else if (parts[0] === 'industry' && parts[1] === 'learning-path') {
    main.innerHTML = Sections().renderLearningPathDetail('newcomer-8w')
    Analytics()?.track('page_view', { page: 'learning-path', id: 'newcomer-8w' })
  } else if (parts[0] === 'industry' && parts[1] && parts[2]) {
    main.innerHTML = Sections().renderIndustryArticle(parts[1], parts[2])
    Analytics()?.track('page_view', { page: 'industry', id: parts[2] })
  } else if (parts[0] === 'industry') {
    main.innerHTML = Sections().renderIndustryHub()
    Analytics()?.track('page_view', { page: 'industry' })
  } else if (parts[0] === 'tools' && parts[1]) {
    main.innerHTML = Sections().renderToolsCategory(parts[1])
    Analytics()?.track('page_view', { page: 'tools', id: parts[1] })
  } else if (parts[0] === 'tools') {
    main.innerHTML = Sections().renderToolsHub()
    Sections().bindToolsSearch()
    Analytics()?.track('page_view', { page: 'tools' })
  } else if (parts[0] === 'forum' && parts[1] === 'new') {
    if (!Auth().isLoggedIn()) main.innerHTML = renderLoginRequired(t('auth.requiredForum'))
    else {
      main.innerHTML = Sections().renderForumNew()
      Sections().bindForumNew()
    }
  } else if (parts[0] === 'forum' && parts[1] === 'post' && parts[2]) {
    Sections().renderForumPostRoute(parts[2])
  } else if (parts[0] === 'forum') {
    Sections().renderForumListRoute()
  } else if (parts[0] === 'category' && parts[1]) {
    main.innerHTML = renderCategory(parts[1])
    Analytics()?.track('page_view', { page: 'category', id: parts[1] })
  } else if (parts[0] === 'article' && parts[1] && parts[2]) {
    main.innerHTML = renderArticle(parts[1], parts[2])
    bindFavoriteButton()
    bindArticleNotesEvents()
    Analytics()?.track('page_view', { page: 'article', id: parts[2] })
  } else if (parts[0] === 'favorites') {
    main.innerHTML = renderFavoritesPage()
    Analytics()?.track('page_view', { page: 'favorites' })
  } else if (parts[0] === 'notes') {
    main.innerHTML = renderArticleNotesHub()
    bindArticleNotesHubEvents()
    Analytics()?.track('page_view', { page: 'notes' })
  } else if (parts[0] === 'my-knowledge' && parts[1] === 'view' && parts[2]) {
    if (!Auth().isLoggedIn()) main.innerHTML = renderLoginRequired(t('auth.requiredDefault'))
    else {
      main.innerHTML = renderMyKnowledgeView(parts[2])
      bindMyKnowledgeViewEvents(parts[2])
    }
  } else if (parts[0] === 'my-knowledge' && parts[1] === 'add') {
    if (!Auth().isLoggedIn()) main.innerHTML = renderLoginRequired(t('auth.requiredMyKnowledge'))
    else {
      const { params } = parseRoute()
      const routeKey = `add:${params.get('group') || ''}`
      if (lastKnowledgeRoute !== routeKey) {
        knowledgeState.form = emptyKnowledgeForm(params.get('group') || 'default')
        knowledgeState.tagInput = ''
        lastKnowledgeRoute = routeKey
      }
      main.innerHTML = renderKnowledgeForm()
      bindKnowledgeFormEvents()
    }
  } else if (parts[0] === 'my-knowledge' && parts[1] === 'edit' && parts[2]) {
    if (!Auth().isLoggedIn()) main.innerHTML = renderLoginRequired(t('auth.requiredDefault'))
    else {
      lastKnowledgeRoute = `edit:${parts[2]}`
      main.innerHTML = renderKnowledgeForm(parts[2])
      bindKnowledgeFormEvents()
    }
  } else if (parts[0] === 'my-knowledge') {
    if (!Auth().isLoggedIn()) main.innerHTML = renderLoginRequired(t('auth.requiredMyKnowledge'))
    else {
      main.innerHTML = renderMyKnowledgeHub()
      bindMyKnowledgeHubEvents()
      bindSyncEvents()
    }
  } else if (parts[0] === 'knowledge') {
    const sub = parts[1] === 'add' ? '/add' : ''
    location.replace(`#/my-knowledge${sub}`)
    return
  } else if (parts[0] === 'daily-learn') {
    if (!Auth().isLoggedIn()) {
      main.innerHTML = renderLoginRequired(t('auth.requiredDailyLearn'))
    } else {
      main.innerHTML = renderDailyLearnPage()
      bindDailyLearnEvents()
      Analytics()?.track('page_view', { page: 'daily-learn' })
    }
  } else if (parts[0] === 'reviews' || parts[0] === 'memory') {
    main.innerHTML = renderReviews()
    bindReviewEvents()
  } else {
    main.innerHTML = renderHome()
  }
}

window.addEventListener('hashchange', render)

render()
initStorage()
  .then(() => {
    window.PMLabI18n?.init()
    window.PMLabI18n?.onChange(() => render())
    return Auth().init()
  })
  .then(() => Analytics()?.trackDailyActive?.())
  .then(() => SharedK()?.init?.())
  .then(() => PDMCloud.init())
  .then(() => {
    window.escapeHtml = escapeHtml
    window.formatDate = formatDate
    window.Auth = Auth
    window.showToast = showToast
    window.navigate = navigate
    window.renderForumPostRoute = (id) => Sections().renderForumPostRoute(id)
    if (Auth().isLoggedIn()) {
      DailyPush()?.start?.(showDailyPushModal)
    }
    render()
  })
  .catch((err) => {
    console.warn('Init:', err)
    window.PMLabI18n?.init()
    window.PMLabI18n?.onChange(() => render())
    window.escapeHtml = escapeHtml
    window.formatDate = formatDate
    window.Auth = Auth
    window.showToast = showToast
    window.navigate = navigate
    window.renderForumPostRoute = (id) => Sections().renderForumPostRoute(id)
    render()
  })
