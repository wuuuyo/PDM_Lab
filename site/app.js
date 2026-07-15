function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const { loadReviews, saveReviews, saveCustomKnowledge, loadCustomKnowledge, getStorageStats, exportBackup, importBackup, initStorage, toggleFavorite, isFavorited, loadKnowledgeGroups, saveKnowledgeGroups, loadArticleNotes, getArticleNotesForRef, addArticleNote, updateArticleNote, deleteArticleNote } = window.PDMStorage
const PDMCloud = window.PDMCloud
const K = window.PDMKnowledge
const Auth = () => window.PDMAuth || { isLoggedIn: () => false, isAdmin: () => false, isSuperAdmin: () => false, getRole: () => 'user', getSession: () => null, isConfigured: () => false }
const Analytics = () => window.PDMAnalytics
const SharedK = () => window.PDMSharedKnowledge
const DailyPush = () => window.PDMDailyPush
const Sections = () => window.PDMSections
const t = (key, params, fallback) => window.PMLabI18n?.t(key, params, fallback) ?? fallback ?? key
const catTitle = (cat) => window.PMLabI18n?.getCategoryMeta(cat.id, 'title', cat.title) ?? cat.title
const catDesc = (cat) => window.PMLabI18n?.getCategoryMeta(cat.id, 'description', cat.description) ?? cat.description
const ui = (group, key, params) => t(`content.${group}.${key}`, params)

/** 旧知识库分类 ID → README 主题（interview/skills/domain） */
function resolveKbCategoryId(id) {
  return Perm().resolveFeatureId?.(id) || id
}

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
  const parts = path.split('/').filter(Boolean).map((p) => {
    try {
      return decodeURIComponent(p)
    } catch {
      return p
    }
  })
  const params = new URLSearchParams(query || '')
  return { parts, params, raw: path }
}

function navigate(path) {
  const normalized = path.startsWith('#')
    ? path
    : `#${path.startsWith('/') ? path : `/${path}`}`
  if (location.hash === normalized || (normalized === '#/' && (!location.hash || location.hash === '#'))) {
    render()
    return
  }
  location.hash = normalized
}

/** 首次进入：无 hash 时落到首页，避免空白或误入登录页 */
function ensureDefaultHomeHash() {
  const h = location.hash
  if (!h || h === '#') {
    history.replaceState(null, '', `${location.pathname}${location.search}#/`)
  }
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

function getSidebarCollapsed() {
  try { return localStorage.getItem('pm-lab-sidebar-collapsed') === '1' } catch (_) { return false }
}

function setSidebarCollapsed(collapsed) {
  try { localStorage.setItem('pm-lab-sidebar-collapsed', collapsed ? '1' : '0') } catch (_) {}
  document.documentElement.classList.toggle('sidebar-collapsed', collapsed)
  const btn = document.getElementById('sidebar-collapse-btn')
  if (btn) {
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
    btn.title = collapsed ? t('nav.sidebarExpand') : t('nav.sidebarCollapse')
    btn.setAttribute('aria-label', collapsed ? t('nav.sidebarExpand') : t('nav.sidebarCollapse'))
  }
  // 手机端展开时显示遮罩
  const isMobile = window.matchMedia('(max-width: 900px)').matches
  document.documentElement.classList.toggle('sidebar-mobile-open', isMobile && !collapsed)
  const backdrop = document.getElementById('sidebar-backdrop')
  if (backdrop) {
    if (isMobile && !collapsed) backdrop.removeAttribute('hidden')
    else backdrop.setAttribute('hidden', '')
  }
}

function Perm() {
  return window.PDMPermissions || {
    can: () => true,
    routeFeature: () => null,
    resolveFeatureId: (id) => id,
    getFeatures: () => [],
    featureLabel: (f) => f.labelZh || f.id,
    actionLabel: (a) => a,
    normalizePerms: (p) => p || {},
    defaultPermMap: () => ({}),
  }
}

function renderPermissionDenied() {
  return `
    <div class="page login-required-page">
      <h1>${escapeHtml(t('auth.forbiddenTitle'))}</h1>
      <p>${escapeHtml(t('auth.forbiddenDesc'))}</p>
      <a href="#/" class="btn-primary">${escapeHtml(t('common.backHome'))}</a>
    </div>`
}

function renderTopbarCrumbs(crumbs) {
  const el = document.getElementById('topbar-crumbs')
  if (!el) return
  if (!crumbs?.length) {
    el.innerHTML = `<span class="topbar-crumb-current">${escapeHtml(t('nav.home'))}</span>`
    return
  }
  el.innerHTML = crumbs.map((c, i) => {
    const last = i === crumbs.length - 1
    if (last || !c.href) {
      return `<span class="topbar-crumb-current">${escapeHtml(c.label)}</span>`
    }
    return `<a href="${c.href}" class="topbar-crumb">${escapeHtml(c.label)}</a><span class="topbar-crumb-sep">/</span>`
  }).join('')
}

function buildCrumbsFromRoute(parts) {
  const home = { href: '#/', label: t('common.home') }
  if (!parts.length) return [{ label: t('nav.home') }]
  const p0 = parts[0]
  if (p0 === 'login') return [home, { label: t('auth.pageTitle') }]
  if (p0 === 'account') return [home, { label: t('account.profileTitle') }]
  if (p0 === 'reset-password') return [home, { label: t('auth.resetTitle') }]
  if (p0 === 'industry') {
    const c = [home, { href: '#/industry', label: t('nav.industry') }]
    if (parts[1] === 'learning-path') c.push({ label: t('home.pathTeaserCta') })
    else if (parts[2]) c.push({ label: t('common.loading') })
    return c
  }
  if (p0 === 'tools') {
    const c = [home, { href: '#/tools', label: t('nav.tools') }]
    if (parts[1]) c.push({ label: parts[1] })
    return c
  }
  if (p0 === 'forum') {
    const c = [home, { href: '#/forum', label: t('nav.forum') }]
    if (parts[1] === 'new') c.push({ label: t('auth.pageTitle') })
    else if (parts[1] === 'post') c.push({ label: '…' })
    return c
  }
  if (p0 === 'category' && parts[1]) {
    const cat = K.getCategoryByIdMerged(parts[1])
    return [home, { href: '#/kb', label: t('nav.sectionKnowledge') }, { label: catTitle(cat) || parts[1] }]
  }
  if (p0 === 'kb') {
    return [home, { label: t('nav.sectionKnowledge') }]
  }
  if (p0 === 'personal') {
    return [home, { label: t('nav.sectionPersonal') }]
  }
  if (p0 === 'admin' && !parts[1]) {
    return [home, { label: t('nav.sectionAdmin') }]
  }
  if (p0 === 'admin' && parts[1] === 'stats') {
    return [
      home,
      { href: '#/admin', label: t('nav.sectionAdmin') },
      { label: t('nav.adminStats') },
    ]
  }
  if (p0 === 'doc' && parts[1] && parts[2]) {
    const cat = K.getCategoryByIdMerged(parts[1])
    const docs = window.PDMKnowledgeViews?.getSidebarDocs?.()?.[parts[1]] || []
    const doc = docs.find((d) => d.id === parts[2])
    const crumbs = [home, { href: `#/category/${parts[1]}`, label: catTitle(cat) || parts[1] }]
    if (docs.length > 1) crumbs.push({ label: doc?.title || parts[2] })
    return crumbs
  }
  if (p0 === 'chapter' && parts[1] && parts[2] && parts[3]) {
    const cat = K.getCategoryByIdMerged(parts[1])
    const docs = window.PDMKnowledgeViews?.getSidebarDocs?.()?.[parts[1]] || []
    const doc = docs.find((d) => d.id === parts[2])
    const chapterLabel =
      window.PDMKnowledgeViews?.getChapterLabel?.(parts[1], parts[2], parts[3]) ||
      decodeURIComponent(parts[3])
    const crumbs = [home, { href: `#/category/${parts[1]}`, label: catTitle(cat) || parts[1] }]
    if (docs.length > 1) crumbs.push({ href: `#/doc/${parts[1]}/${parts[2]}`, label: doc?.title || parts[2] })
    crumbs.push({ label: chapterLabel })
    return crumbs
  }
  if (p0 === 'module' && parts[1] && parts[2]) {
    const cat = K.getCategoryByIdMerged(parts[1])
    const labels = {
      demand: t('kbMod.workflowDemandTitle', null, '需求处理 7 步'),
      prd: t('kbMod.workflowPrdTitle', null, 'PRD 模板'),
      retro: t('kbMod.workflowRetroTitle', null, '复盘 SOP'),
      collab: t('kbMod.workflowCollabTitle', null, '跨部门协作'),
      kb: t('kbMod.workflowKbTitle', null, '知识库管理'),
      glossary: t('kbMod.refGlossaryTitle', null, '关键词速查'),
      mindmap: t('kbMod.refMindmapTitle', null, '知识图谱'),
      path: t('kbMod.refPathTitle', null, '学习路径'),
    }
    return [
      home,
      { href: `#/category/${parts[1]}`, label: catTitle(cat) || parts[1] },
      { label: labels[parts[2]] || parts[2] },
    ]
  }
  if (p0 === 'article' && parts[1] && parts[2]) {
    const cat = K.getCategoryByIdMerged(parts[1])
    const item = K.getItemByIdMerged(parts[1], parts[2])
    const title = window.PDMKnowledgeViews?.stripLeadingIndex?.(item?.title) || item?.title || parts[2]
    return [
      home,
      { href: `#/category/${parts[1]}`, label: catTitle(cat) || parts[1] },
      { label: title },
    ]
  }
  if (p0 === 'favorites') return [home, { label: t('nav.favorites') }]
  if (p0 === 'notes') return [home, { label: t('nav.articleNotes') }]
  if (p0 === 'my-knowledge') {
    const c = [home, { href: '#/my-knowledge', label: t('nav.myKnowledge') }]
    if (parts[1] === 'add') c.push({ label: t('common.add') })
    else if (parts[1] === 'edit') c.push({ label: t('common.edit') })
    else if (parts[1] === 'view' && parts[2]) {
      const item = typeof loadCustomKnowledge === 'function'
        ? loadCustomKnowledge().find((x) => x.id === parts[2])
        : null
      c.push({ label: item?.title || parts[2] })
    }
    return c
  }
  if (p0 === 'reviews' || p0 === 'memory') return [home, { label: t('nav.reviews') }]
  if (p0 === 'daily-learn') return [home, { label: t('nav.dailyLearn') }]
  if (p0 === 'feedback') return [home, { label: t('nav.feedback') }]
  if (p0 === 'm') {
    const c = [home]
    if (parts[1] === 'learn') c.push({ label: t('nav.sectionLearning') })
    else if (parts[1] === 'knowledge') c.push({ label: t('nav.sectionKnowledge') })
    else if (parts[1] === 'personal') c.push({ label: t('nav.sectionPersonal') })
    else if (parts[1] === 'account') c.push({ label: t('mobile.accountTitle') })
    return c
  }
  if (p0 === 'admin') {
    return []
  }
  return [home]
}

let topbarSearchDocBound = false
function bindTopbarSearch() {
  const input = document.getElementById('topbar-search-input')
  const results = document.getElementById('topbar-search-results')
  if (!input || !results) return
  input.placeholder = t('nav.searchPlaceholder')

  const hide = () => results.setAttribute('hidden', '')
  const show = (html) => {
    results.innerHTML = html
    results.removeAttribute('hidden')
  }

  input.oninput = () => {
    const q = input.value.trim()
    if (!q) { hide(); return }
    const found = K.searchKnowledgeMerged(q).slice(0, 8)
    if (!found.length) {
      show(`<div class="topbar-search-empty">${escapeHtml(t('nav.searchEmpty'))}</div>`)
      return
    }
    show(found.map(({ category, item, source }) => {
      const catLabel = source === 'my'
        ? category.title
        : t(`categories.${category.id}.title`, null, category.title)
      return `<button type="button" class="topbar-search-item" data-src="${source || 'public'}" data-cat="${category.id}" data-item="${item.id}">
        <span class="result-title">${escapeHtml(item.title)}</span>
        <span class="result-meta">${escapeHtml(catLabel)}${source === 'my' ? escapeHtml(t('nav.searchSourceMy')) : ''}</span>
      </button>`
    }).join(''))
    results.querySelectorAll('.topbar-search-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.src === 'my') navigate(`/my-knowledge/view/${btn.dataset.item}`)
        else navigate(`/article/${btn.dataset.cat}/${btn.dataset.item}`)
        input.value = ''
        hide()
      })
    })
  }

  input.onkeydown = (e) => {
    if (e.key === 'Escape') hide()
  }

  if (!topbarSearchDocBound) {
    topbarSearchDocBound = true
    document.addEventListener('click', (e) => {
      if (!document.getElementById('topbar-search')?.contains(e.target)) {
        document.getElementById('topbar-search-results')?.setAttribute('hidden', '')
      }
    })
  }
}

let mobileNavBound = false
function bindMobileNavChrome() {
  if (mobileNavBound) return
  mobileNavBound = true
  document.getElementById('topbar-menu-btn')?.addEventListener('click', () => {
    setSidebarCollapsed(!getSidebarCollapsed())
  })
  document.getElementById('sidebar-backdrop')?.addEventListener('click', () => {
    setSidebarCollapsed(true)
  })
}

function renderTopAccount(activePath) {
  const el = document.getElementById('topbar-account')
  if (!el) return

  if (Auth().isLoggedIn()) {
    const session = Auth().getSession()
    const profile = Auth().getProfile?.() || null
    const email = session?.user?.email || ''
    const displayName = profile?.display_name?.trim()
    const initials = getUserInitials(email, displayName)
    el.innerHTML = `
    <div class="topbar-account topbar-account-logged-in">
      <button type="button" class="topbar-account-trigger topbar-account-icon-only" id="topbar-account-menu-btn" aria-label="${escapeHtml(t('nav.accountMenuAria'))}" title="${escapeHtml(email)}">
        <span class="topbar-account-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
      </button>
      <div class="topbar-account-menu" id="topbar-account-menu" hidden>
        <div class="topbar-account-menu-email">${escapeHtml(displayName || email)}</div>
        <a href="#/account" class="topbar-account-menu-item">${escapeHtml(t('account.profileLink'))}</a>
        <a href="#/daily-learn" class="topbar-account-menu-item">${escapeHtml(t('nav.dailyLearnSettings'))}</a>
        ${Auth().isAdmin() ? `<a href="#/admin" class="topbar-account-menu-item">${escapeHtml(t('nav.sectionAdmin'))}</a>` : ''}
        <a href="#/feedback" class="topbar-account-menu-item">${escapeHtml(t('nav.feedback'))}</a>
        <button type="button" class="topbar-account-menu-item topbar-account-menu-danger" id="topbar-logout">${escapeHtml(t('nav.logout'))}</button>
      </div>
    </div>`
    return
  }

  el.innerHTML = `
    <a href="#/login" class="topbar-account topbar-account-guest topbar-account-icon-only ${activePath === '/login' ? 'active' : ''}" title="${escapeHtml(t('nav.loginRegister'))}" aria-label="${escapeHtml(t('nav.loginRegister'))}">
      <span class="topbar-account-avatar topbar-account-avatar-guest" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="2.5" stroke="currentColor" stroke-width="1.4"/><path d="M3.5 13.5c.8-2.2 2.4-3.3 4.5-3.3s3.7 1.1 4.5 3.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
      </span>
    </a>`
}

function renderLocaleSwitcher() {
  const el = document.getElementById('locale-switcher')
  if (!el) return
  const current = window.PMLabI18n?.getLocale() || 'zh-CN'
  const label = current === 'en-US' ? 'En' : '中'
  const next = current === 'en-US' ? 'zh-CN' : 'en-US'
  el.innerHTML = `
    <button type="button" class="locale-toggle" data-locale="${next}" aria-label="${escapeHtml(t('locale.label'))}" title="${escapeHtml(t('locale.label'))}">${label}</button>`
}

function renderForbidden() {
  return `<div class="page"><p>${escapeHtml(t('common.forbidden'))}</p><a href="#/">${escapeHtml(t('common.backHome'))}</a></div>`
}

function resolveProfileRole(u) {
  if (!u) return 'user'
  if (u.role === 'super_admin' || u.role === 'admin' || u.role === 'user') return u.role
  const email = (u.email || '').toLowerCase()
  const cfg = Auth().getConfig?.() || {}
  if (email && Array.isArray(cfg.adminEmails) && cfg.adminEmails.map((e) => String(e).toLowerCase()).includes(email)) {
    return 'super_admin'
  }
  return u.is_admin ? 'admin' : 'user'
}

function roleLabel(role) {
  if (role === 'super_admin') return t('admin.roleSuper')
  if (role === 'admin') return t('admin.roleAdmin')
  return t('admin.roleUser')
}

function renderAdminHeader(title, desc) {
  return `
    <header class="admin-shell-head">
      <div class="admin-shell-eyebrow">${escapeHtml(t('nav.sectionAdmin'))}</div>
      <h1 class="admin-shell-title">${escapeHtml(title)}</h1>
      ${desc ? `<p class="admin-shell-desc">${escapeHtml(desc)}</p>` : ''}
    </header>`
}

function feedbackStatusLabel(status) {
  if (status === 'read') return t('feedback.statusRead')
  if (status === 'done') return t('feedback.statusDone')
  return t('feedback.statusNew')
}

function renderStars(rating, interactive = false, selected = 0) {
  const n = interactive ? 5 : Math.max(0, Math.min(5, Number(rating) || 0))
  if (!interactive) {
    return `<span class="feedback-stars" aria-label="${n}/5">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`
  }
  return `<div class="feedback-rating" role="radiogroup" aria-label="${escapeHtml(t('feedback.ratingLabel'))}">
    ${[1, 2, 3, 4, 5].map((i) => `
      <button type="button" class="feedback-star-btn ${selected >= i ? 'active' : ''}" data-rating="${i}" aria-label="${i}">★</button>
    `).join('')}
  </div>`
}

function renderFeedbackPage(mine = []) {
  return `
    <div class="page feedback-page">
      <header class="memory-header">
        <h1>${escapeHtml(t('feedback.title'))}</h1>
        <p>${escapeHtml(t('feedback.desc'))}</p>
      </header>
      ${!Auth().isLoggedIn() ? `
        <div class="login-required-page" style="padding-top:24px">
          <p>${escapeHtml(t('feedback.requiredLogin'))}</p>
          <a href="#/login" class="btn-primary">${escapeHtml(t('auth.cta'))}</a>
        </div>
      ` : `
        <form id="feedback-form" class="form-card feedback-form">
          <div class="form-group">
            <label>${escapeHtml(t('feedback.ratingLabel'))}</label>
            <p class="form-hint">${escapeHtml(t('feedback.ratingHint'))}</p>
            ${renderStars(0, true, 0)}
            <input type="hidden" id="feedback-rating" value="" />
          </div>
          <div class="form-group">
            <label for="feedback-content">${escapeHtml(t('feedback.contentLabel'))}</label>
            <textarea id="feedback-content" rows="5" placeholder="${escapeHtml(t('feedback.contentPlaceholder'))}" required></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" id="feedback-submit">${escapeHtml(t('feedback.submit'))}</button>
          </div>
        </form>
        <section class="section">
          <h2 class="section-title">${escapeHtml(t('feedback.myTitle'))}</h2>
          <div class="feedback-mine-list">
            ${mine.length ? mine.map((f) => `
              <article class="feedback-mine-card">
                <div class="feedback-mine-meta">
                  ${renderStars(f.rating)}
                  <span class="feedback-status feedback-status-${escapeHtml(f.status)}">${escapeHtml(feedbackStatusLabel(f.status))}</span>
                  <span class="feedback-time">${formatDate(f.createdAt)}</span>
                </div>
                <p>${escapeHtml(f.content)}</p>
              </article>`).join('') : `<p class="empty-hint">${escapeHtml(t('feedback.emptyMine'))}</p>`}
          </div>
        </section>
      `}
    </div>`
}

function bindFeedbackEvents() {
  let rating = 0
  const ratingInput = document.getElementById('feedback-rating')
  document.querySelectorAll('.feedback-star-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      rating = Number(btn.dataset.rating) || 0
      if (ratingInput) ratingInput.value = String(rating)
      document.querySelectorAll('.feedback-star-btn').forEach((b) => {
        b.classList.toggle('active', Number(b.dataset.rating) <= rating)
      })
    })
  })

  document.getElementById('feedback-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const content = document.getElementById('feedback-content')?.value || ''
    const r = Number(ratingInput?.value || rating || 0)
    try {
      await window.PDMFeedback.submitFeedback({ rating: r, content })
      showToast(t('feedback.toastOk'), 'success')
      const mine = await window.PDMFeedback.fetchMyFeedback()
      document.getElementById('main').innerHTML = renderFeedbackPage(mine)
      bindFeedbackEvents()
    } catch (err) {
      showToast(err.message || String(err), 'error')
    }
  })
}

async function renderFeedbackRoute() {
  const main = document.getElementById('main')
  if (!Auth().isLoggedIn()) {
    main.innerHTML = renderFeedbackPage([])
    return
  }
  main.innerHTML = `<div class="page"><p>${escapeHtml(t('common.loading'))}</p></div>`
  try {
    const mine = await window.PDMFeedback.fetchMyFeedback()
    main.innerHTML = renderFeedbackPage(mine)
    bindFeedbackEvents()
  } catch (e) {
    main.innerHTML = renderFeedbackPage([])
    bindFeedbackEvents()
    if (e.message) showToast(e.message, 'error')
  }
}

let adminFeedbackState = { status: 'all', q: '' }

function renderAdminFeedbackPage(list) {
  const q = adminFeedbackState.q.trim().toLowerCase()
  const filtered = list.filter((f) => {
    if (adminFeedbackState.status !== 'all' && f.status !== adminFeedbackState.status) return false
    if (!q) return true
    return `${f.email} ${f.content}`.toLowerCase().includes(q)
  })
  const avg = list.length
    ? (list.reduce((s, f) => s + f.rating, 0) / list.length).toFixed(1)
    : '—'
  const newCount = list.filter((f) => f.status === 'new').length

  return `
    <div class="page admin-page admin-console-page">
      ${renderAdminHeader(t('nav.adminFeedback'), t('admin.feedbackDesc', { avg, newCount }))}

      <div class="admin-filter-bar">
        <div class="admin-filter-fields">
          <label class="admin-filter-item admin-filter-item-search">
            <span>${escapeHtml(t('admin.permFilterSearch'))}</span>
            <input type="search" id="admin-feedback-search" placeholder="${escapeHtml(t('admin.feedbackSearch'))}" value="${escapeHtml(adminFeedbackState.q)}" />
          </label>
          <label class="admin-filter-item admin-filter-item-sm">
            <span>${escapeHtml(t('admin.feedbackFilterStatus'))}</span>
            <select id="admin-feedback-status">
              <option value="all" ${adminFeedbackState.status === 'all' ? 'selected' : ''}>${escapeHtml(t('admin.feedbackStatusAll'))}</option>
              <option value="new" ${adminFeedbackState.status === 'new' ? 'selected' : ''}>${escapeHtml(t('feedback.statusNew'))}</option>
              <option value="read" ${adminFeedbackState.status === 'read' ? 'selected' : ''}>${escapeHtml(t('feedback.statusRead'))}</option>
              <option value="done" ${adminFeedbackState.status === 'done' ? 'selected' : ''}>${escapeHtml(t('feedback.statusDone'))}</option>
            </select>
          </label>
          <div class="admin-filter-item admin-filter-item-btn">
            <span class="admin-filter-label-spacer" aria-hidden="true">&nbsp;</span>
            <button type="button" class="btn-ghost admin-filter-reset" id="admin-feedback-filter-reset">${escapeHtml(t('admin.permFilterReset'))}</button>
          </div>
        </div>
        <div class="admin-filter-item admin-filter-item-btn admin-filter-trailing">
          <span class="admin-filter-label-spacer" aria-hidden="true">&nbsp;</span>
          <div class="admin-filter-meta">${escapeHtml(t('admin.feedbackCount', { n: filtered.length, avg, newCount }))}</div>
        </div>
      </div>

      <div class="admin-perm-table-wrap">
        <table class="admin-data-table admin-feedback-data-table">
          <thead>
            <tr>
              <th>${escapeHtml(t('admin.feedbackColTime'))}</th>
              <th>${escapeHtml(t('admin.feedbackColRating'))}</th>
              <th>${escapeHtml(t('admin.feedbackColUser'))}</th>
              <th>${escapeHtml(t('admin.feedbackColContent'))}</th>
              <th>${escapeHtml(t('admin.feedbackColStatus'))}</th>
              <th class="admin-data-col-action">${escapeHtml(t('admin.permColAction'))}</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length ? filtered.map((f) => `
              <tr class="admin-data-row" data-id="${escapeHtml(f.id)}">
                <td class="admin-cell-muted">${formatDate(f.createdAt)}</td>
                <td>${renderStars(f.rating)}</td>
                <td><span class="admin-data-primary">${escapeHtml(f.email || '—')}</span></td>
                <td><span class="admin-cell-clip" title="${escapeHtml(f.content)}">${escapeHtml(f.content)}</span></td>
                <td><span class="feedback-status feedback-status-${escapeHtml(f.status)}">${escapeHtml(feedbackStatusLabel(f.status))}</span></td>
                <td class="admin-data-col-action">
                  <select class="admin-inline-select admin-feedback-status-select" data-id="${escapeHtml(f.id)}" aria-label="${escapeHtml(t('admin.feedbackColStatus'))}">
                    <option value="new" ${f.status === 'new' ? 'selected' : ''}>${escapeHtml(t('feedback.statusNew'))}</option>
                    <option value="read" ${f.status === 'read' ? 'selected' : ''}>${escapeHtml(t('feedback.statusRead'))}</option>
                    <option value="done" ${f.status === 'done' ? 'selected' : ''}>${escapeHtml(t('feedback.statusDone'))}</option>
                  </select>
                </td>
              </tr>`).join('') : `<tr><td colspan="6" class="admin-data-empty">${escapeHtml(t('admin.feedbackEmpty'))}</td></tr>`}
          </tbody>
        </table>
      </div>
      <p class="form-hint admin-console-footnote">${escapeHtml(t('admin.feedbackSqlHint'))}</p>
    </div>`
}

function bindAdminFeedbackEvents(list) {
  const rerender = () => {
    document.getElementById('main').innerHTML = renderAdminFeedbackPage(list)
    bindAdminFeedbackEvents(list)
  }

  document.getElementById('admin-feedback-search')?.addEventListener('input', (e) => {
    adminFeedbackState.q = e.target.value
    const pos = e.target.selectionStart
    rerender()
    const input = document.getElementById('admin-feedback-search')
    if (input) {
      input.focus()
      try { input.setSelectionRange(pos, pos) } catch (_) {}
    }
  })
  document.getElementById('admin-feedback-status')?.addEventListener('change', (e) => {
    adminFeedbackState.status = e.target.value
    rerender()
  })
  document.getElementById('admin-feedback-filter-reset')?.addEventListener('click', () => {
    adminFeedbackState.q = ''
    adminFeedbackState.status = 'all'
    rerender()
  })
  document.querySelectorAll('.admin-feedback-status-select').forEach((sel) => {
    sel.addEventListener('change', async () => {
      try {
        const updated = await window.PDMFeedback.updateFeedbackStatus(sel.dataset.id, sel.value)
        const idx = list.findIndex((x) => x.id === updated.id)
        if (idx >= 0) list[idx] = updated
        showToast(t('common.save'), 'success')
        rerender()
      } catch (e) {
        showToast(e.message || String(e), 'error')
      }
    })
  })
}

async function renderAdminFeedbackRoute() {
  const main = document.getElementById('main')
  main.innerHTML = `<div class="page"><p>${escapeHtml(t('common.loading'))}</p></div>`
  try {
    const list = await window.PDMFeedback.fetchAllFeedback()
    main.innerHTML = renderAdminFeedbackPage(list)
    bindAdminFeedbackEvents(list)
  } catch (e) {
    main.innerHTML = `<div class="page"><p>${escapeHtml(e.message)}</p><p class="form-hint">请先在 Supabase 执行 supabase/feedback.sql</p>${renderAdminHeader(t('nav.adminFeedback'), '')}</div>`
  }
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 900px)').matches
}

const MOBILE_TAB_ICONS = {
  home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-5.6H10.2V21H5a1 1 0 0 1-1-1v-9.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  learn: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  knowledge: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  personal: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 14.4 7.8 16.5l.8-4.7-3.4-3.3 4.7-.7L12 3.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  account: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.2" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 19c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
}

function getMobileTab(parts) {
  const p0 = parts[0] || ''
  if (!p0) return 'home'
  if (p0 === 'm') {
    if (parts[1] === 'learn') return 'learn'
    if (parts[1] === 'knowledge') return 'knowledge'
    if (parts[1] === 'personal') return 'personal'
    if (parts[1] === 'account') return 'account'
  }
  if (['industry', 'tools', 'forum'].includes(p0)) return 'learn'
  if (p0 === 'category' || p0 === 'article' || p0 === 'module' || p0 === 'doc' || p0 === 'chapter' || p0 === 'kb') return 'knowledge'
  if (p0 === 'personal' || ['favorites', 'notes', 'my-knowledge', 'reviews', 'memory', 'daily-learn', 'feedback'].includes(p0)) return 'personal'
  if (p0 === 'login' || p0 === 'reset-password' || p0 === 'admin' || p0 === 'account') return 'account'
  return 'home'
}

function getMobileBackHref(parts) {
  const tab = getMobileTab(parts)
  if (tab === 'learn') return '#/m/learn'
  if (tab === 'knowledge') return '#/m/knowledge'
  if (tab === 'personal') return '#/m/personal'
  if (tab === 'account') return '#/m/account'
  return '#/'
}

function getMobilePageMeta(parts) {
  if (!isMobileViewport()) return null
  if (!parts.length) return null
  if (parts[0] === 'm') return null

  const backHref = getMobileBackHref(parts)
  const p0 = parts[0]
  if (p0 === 'industry') return { title: t('nav.industry'), backHref }
  if (p0 === 'tools') return { title: t('nav.tools'), backHref }
  if (p0 === 'forum') return { title: t('nav.forum'), backHref }
  if (p0 === 'module' && parts[1] && parts[2]) {
    const labels = {
      demand: t('kbMod.workflowDemandTitle', null, '需求处理 7 步'),
      prd: t('kbMod.workflowPrdTitle', null, 'PRD 模板'),
      retro: t('kbMod.workflowRetroTitle', null, '复盘 SOP'),
      collab: t('kbMod.workflowCollabTitle', null, '跨部门协作'),
      kb: t('kbMod.workflowKbTitle', null, '知识库管理'),
      glossary: t('kbMod.refGlossaryTitle', null, '关键词速查'),
      mindmap: t('kbMod.refMindmapTitle', null, '知识图谱'),
      path: t('kbMod.refPathTitle', null, '学习路径'),
    }
    return { title: labels[parts[2]] || parts[2], backHref: `#/category/${parts[1]}` }
  }
  if (p0 === 'category' && parts[1]) {
    const cat = K.getCategoryByIdMerged?.(parts[1])
    return { title: catTitle(cat) || parts[1], backHref: '#/kb' }
  }
  if (p0 === 'kb') {
    return { title: t('nav.sectionKnowledge'), backHref: '#/' }
  }
  if (p0 === 'personal') {
    return { title: t('nav.sectionPersonal'), backHref }
  }
  if (p0 === 'doc' && parts[1] && parts[2]) {
    const docs = window.PDMKnowledgeViews?.getSidebarDocs?.()?.[parts[1]] || []
    const doc = docs.find((d) => d.id === parts[2])
    return {
      title: doc?.title || parts[2],
      backHref: docs.length > 1 ? `#/category/${parts[1]}` : backHref,
    }
  }
  if (p0 === 'chapter' && parts[1] && parts[2] && parts[3]) {
    return {
      title:
        window.PDMKnowledgeViews?.getChapterLabel?.(parts[1], parts[2], parts[3]) ||
        decodeURIComponent(parts[3]),
      backHref: `#/doc/${parts[1]}/${parts[2]}`,
    }
  }
  if (p0 === 'article' && parts[2]) {
    const item = K.getItemByIdMerged?.(parts[1], parts[2])
    const title = window.PDMKnowledgeViews?.stripLeadingIndex?.(item?.title) || item?.title || t('nav.sectionKnowledge')
    return { title, backHref: `#/category/${parts[1]}` }
  }
  if (p0 === 'favorites') return { title: t('nav.favorites'), backHref }
  if (p0 === 'notes') return { title: t('nav.articleNotes'), backHref }
  if (p0 === 'my-knowledge') return { title: t('nav.myKnowledge'), backHref }
  if (p0 === 'reviews' || p0 === 'memory') return { title: t('nav.reviews'), backHref }
  if (p0 === 'daily-learn') return { title: t('nav.dailyLearn'), backHref }
  if (p0 === 'feedback') return { title: t('nav.feedback'), backHref }
  if (p0 === 'login') return { title: t('auth.pageTitle'), backHref: '#/m/account' }
  if (p0 === 'account') return { title: t('account.profileTitle'), backHref: '#/m/account' }
  if (p0 === 'reset-password') return { title: t('auth.resetTitle'), backHref: '#/m/account' }
  if (p0 === 'admin') {
    if (parts[1] === 'knowledge') return { title: t('nav.adminKnowledge'), backHref: '#/m/account' }
    if (parts[1] === 'accounts' || parts[1] === 'permissions') return { title: t('nav.adminAccounts'), backHref: '#/m/account' }
    if (parts[1] === 'roles') return { title: t('nav.adminRoles'), backHref: '#/m/account' }
    if (parts[1] === 'feedback') return { title: t('nav.adminFeedback'), backHref: '#/m/account' }
    return { title: t('nav.adminStats'), backHref: '#/m/account' }
  }
  return { title: t('nav.home'), backHref: '#/' }
}

function renderMobilePageHead(title, backHref) {
  return `
    <header class="mobile-page-head">
      <a href="${backHref || '#/'}" class="mobile-back-btn" aria-label="${escapeHtml(t('common.back'))}">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>${escapeHtml(t('common.back'))}</span>
      </a>
      <h1 class="mobile-page-title">${escapeHtml(title || '')}</h1>
    </header>`
}

function applyMobilePageChrome(title, backHref) {
  if (!isMobileViewport()) return
  const main = document.getElementById('main')
  if (!main) return
  if (main.querySelector('.mobile-page-head')) return
  main.insertAdjacentHTML('afterbegin', renderMobilePageHead(title, backHref))
}

let mobileMainObserver = null
function ensureMobileMainObserver() {
  const main = document.getElementById('main')
  if (!main) return
  if (mobileMainObserver) return
  mobileMainObserver = new MutationObserver(() => {
    if (!isMobileViewport()) return
    const { parts } = parseRoute()
    const meta = getMobilePageMeta(parts)
    if (meta && !main.querySelector('.mobile-page-head')) {
      applyMobilePageChrome(meta.title, meta.backHref)
    }
    syncMobileChromeOffsets()
  })
  mobileMainObserver.observe(main, { childList: true })
}

function renderMobileHubList(items) {
  return `<div class="mobile-hub-list">${items.map((item) => `
    <a href="${item.href}" class="mobile-hub-item">
      <span class="mobile-hub-item-title">${escapeHtml(item.title)}</span>
      ${item.desc ? `<span class="mobile-hub-item-desc">${escapeHtml(item.desc)}</span>` : ''}
      ${item.meta != null ? `<span class="mobile-hub-item-meta">${escapeHtml(String(item.meta))}</span>` : ''}
      <span class="mobile-hub-item-arrow" aria-hidden="true">›</span>
    </a>
  `).join('')}</div>`
}

function renderMobileHubPage(title, desc, items) {
  return `
    <div class="page mobile-hub-page">
      <header class="mobile-hub-head">
        <h1>${escapeHtml(title)}</h1>
        ${desc ? `<p>${escapeHtml(desc)}</p>` : ''}
      </header>
      ${items.length ? renderMobileHubList(items) : `<p class="empty-hint">${escapeHtml(t('mobile.hubEmpty'))}</p>`}
    </div>`
}

/** 一级入口页：二级功能卡片（知识库 / 个人空间 / 管理后台） */
function renderSectionCardHub({ title, desc, eyebrow, cards, extraHtml = '' }) {
  const grid = cards.length
    ? `<div class="sec-hub-grid">
        ${cards
          .map(
            (c, i) => `
          <a href="${c.href}" class="sec-hub-card">
            <span class="sec-hub-card-index">${String(i + 1).padStart(2, '0')}</span>
            <div class="sec-hub-card-body">
              <h2>${escapeHtml(c.title)}</h2>
              ${c.desc ? `<p>${escapeHtml(c.desc)}</p>` : ''}
              ${c.meta ? `<span class="sec-hub-card-meta">${escapeHtml(c.meta)}</span>` : ''}
            </div>
            <span class="sec-hub-card-arrow" aria-hidden="true">→</span>
          </a>`,
          )
          .join('')}
      </div>`
    : `<p class="empty-hint">${escapeHtml(t('mobile.hubEmpty'))}</p>`

  return `
    <div class="page sec-hub-page">
      <header class="sec-hub-hero">
        ${eyebrow ? `<p class="sec-hub-eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
        <h1>${escapeHtml(title)}</h1>
        ${desc ? `<p class="sec-hub-desc">${escapeHtml(desc)}</p>` : ''}
      </header>
      ${grid}
      ${extraHtml}
    </div>`
}

function getKnowledgeHubCards() {
  const can = (id) => Perm().can(id)
  const docsMap = getSidebarKbDocs()
  const cards = []
  for (const c of K.getMergedCategories?.() || []) {
    if (!can(c.id)) continue
    const docs = docsMap[c.id]
    let href = `#/category/${c.id}`
    if (docs?.length === 1) href = `#/doc/${c.id}/${docs[0].id}`
    else if (docs?.length > 1) href = `#/category/${c.id}`
    cards.push({
      href,
      title: catTitle(c),
      desc: catDesc(c),
      meta: docs?.length > 1 ? `${docs.length} 个子文档` : `${c.items?.length || 0} 个知识点`,
    })
  }
  return cards
}

function getPersonalHubCards() {
  return getMobilePersonalItems().map((x) => ({
    href: x.href,
    title: x.title,
    desc: x.desc,
  }))
}

function getAdminHubCards() {
  if (!Auth().isAdmin()) return []
  return [
    { href: '#/admin/stats', title: t('nav.adminStats'), desc: t('admin.statsDesc') },
    { href: '#/admin/knowledge', title: t('nav.adminKnowledge'), desc: t('admin.knowledgeDesc') },
    { href: '#/admin/accounts', title: t('nav.adminAccounts'), desc: t('admin.accountsDesc') },
    { href: '#/admin/roles', title: t('nav.adminRoles'), desc: t('admin.rolesDesc') },
    { href: '#/admin/feedback', title: t('nav.adminFeedback'), desc: '查看与处理用户反馈' },
  ]
}

function renderKnowledgeHubPage() {
  const stages = (K.getCategoryByIdMerged?.('reference')?.items || [])
    .filter((i) => i.kind === 'path-stage' || i.sourceId === 'learning-path')
    .filter((i) => /阶段\s*[1-4]/.test(i.title))
    .sort((a, b) => {
      const na = Number((a.title.match(/阶段\s*(\d+)/) || [])[1] || 99)
      const nb = Number((b.title.match(/阶段\s*(\d+)/) || [])[1] || 99)
      return na - nb
    })

  const pathStrip = stages.length
    ? `<section class="sec-hub-path">
        <div class="sec-hub-path-head">
          <h2>${escapeHtml(t('kbMod.refPathTitle', null, '4 阶段学习路径'))}</h2>
          <a href="#/module/reference/path" class="sec-hub-path-link">${escapeHtml(t('kbMod.viewDetail', null, '查看详情'))}</a>
        </div>
        <ol class="sec-hub-path-steps">
          ${stages
            .map((s, idx) => {
              const label = String(s.title || '')
                .replace(/^阶段\s*\d+[：:.]?\s*/, '')
                .replace(/\(.*?\)/g, '')
                .trim()
              return `<li>
                <a href="#/module/reference/path">
                  <span class="sec-hub-path-num">${idx + 1}</span>
                  <span class="sec-hub-path-label">${escapeHtml(label || s.title)}</span>
                  <span class="sec-hub-path-goal">${escapeHtml(s.summary || '')}</span>
                </a>
              </li>`
            })
            .join('')}
        </ol>
      </section>`
    : ''

  return renderSectionCardHub({
    eyebrow: t('nav.sectionKnowledge'),
    title: t('kbMod.kbHomePickTitle', null, '选一个主题开始'),
    desc: t('kbMod.kbHomePickDesc', null, '按类目进入文档与章节，也可跟随下方路径系统学习'),
    cards: getKnowledgeHubCards(),
    extraHtml: pathStrip,
  })
}

function renderPersonalHubPage() {
  if (!Auth().isLoggedIn()) {
    return renderLoginRequired(t('auth.requiredPersonal'))
  }
  return renderSectionCardHub({
    eyebrow: t('nav.sectionPersonal'),
    title: t('kbMod.personalHubTitle', null, '个人空间'),
    desc: t('mobile.personalHubDesc'),
    cards: getPersonalHubCards(),
  })
}

function renderAdminHubPage() {
  if (!Auth().isAdmin()) return renderPermissionDenied()
  return renderSectionCardHub({
    eyebrow: t('nav.sectionAdmin'),
    title: t('kbMod.adminHubTitle', null, '管理后台'),
    desc: t('kbMod.adminHubDesc', null, '选择要管理的模块'),
    cards: getAdminHubCards(),
  })
}

function getMobileLearnItems() {
  const can = (id) => Perm().can(id)
  return [
    { id: 'industry', href: '#/industry', title: t('nav.industry'), desc: t('mobile.learnIndustryDesc') },
    { id: 'tools', href: '#/tools', title: t('nav.tools'), desc: t('mobile.learnToolsDesc') },
    { id: 'forum', href: '#/forum', title: t('nav.forum'), desc: t('mobile.learnForumDesc') },
  ].filter((x) => can(x.id))
}

function getMobileKnowledgeItems() {
  const can = (id) => Perm().can(id)
  const docsMap = getSidebarKbDocs()
  const items = []
  for (const c of K.getMergedCategories?.() || []) {
    if (!can(c.id)) continue
    const docs = docsMap[c.id]
    if (docs?.length > 1) {
      for (const d of docs) {
        items.push({
          href: `#/doc/${c.id}/${d.id}`,
          title: d.title,
          desc: d.desc || catTitle(c),
          meta: catTitle(c),
        })
      }
    } else if (docs?.length === 1) {
      items.push({
        href: `#/doc/${c.id}/${docs[0].id}`,
        title: catTitle(c),
        desc: docs[0].desc || catDesc(c),
        meta: `${c.items.length}`,
      })
    } else {
      items.push({
        href: `#/category/${c.id}`,
        title: catTitle(c),
        desc: catDesc(c),
        meta: `${c.items.length}`,
      })
    }
  }
  return items
}

function getMobilePersonalItems() {
  const can = (id) => Perm().can(id)
  return [
    { id: 'favorites', href: '#/favorites', title: t('nav.favorites'), desc: t('mobile.personalFavoritesDesc') },
    { id: 'notes', href: '#/notes', title: t('nav.articleNotes'), desc: t('mobile.personalNotesDesc') },
    { id: 'myKnowledge', href: '#/my-knowledge', title: t('nav.myKnowledge'), desc: t('mobile.personalMyKnowledgeDesc') },
    { id: 'reviews', href: '#/reviews', title: t('nav.reviews'), desc: t('mobile.personalReviewsDesc') },
    { id: 'dailyLearn', href: '#/daily-learn', title: t('nav.dailyLearn'), desc: t('mobile.personalDailyDesc'), needLogin: true },
    { id: 'feedback', href: '#/feedback', title: t('nav.feedback'), desc: t('mobile.personalFeedbackDesc') },
  ].filter((x) => {
    if (x.needLogin && !Auth().isLoggedIn()) return false
    return can(x.id)
  })
}

function renderMobileLearnHub() {
  return renderMobileHubPage(t('nav.sectionLearning'), t('mobile.learnHubDesc'), getMobileLearnItems())
}

function renderMobileKnowledgeHub() {
  return renderKnowledgeHubPage()
}

function renderMobilePersonalHub() {
  return renderPersonalHubPage()
}

function renderNicknameForm(profile, email) {
  const name = profile?.display_name?.trim() || ''
  return `
    <section class="account-nickname-card">
      <div class="account-nickname-head">
        <h2>${escapeHtml(t('account.nicknameTitle'))}</h2>
        <p>${escapeHtml(t('account.nicknameDesc'))}</p>
      </div>
      <label class="account-nickname-field">
        <span>${escapeHtml(t('account.nicknameLabel'))}</span>
        <input type="text" id="account-nickname-input" class="account-nickname-input" maxlength="32" value="${escapeHtml(name)}" placeholder="${escapeHtml(t('account.nicknamePlaceholder'))}" autocomplete="nickname" />
      </label>
      ${email ? `<p class="account-nickname-email">${escapeHtml(t('account.emailLabel'))}：${escapeHtml(email)}</p>` : ''}
      <div class="account-nickname-actions">
        <button type="button" class="btn-primary" id="account-nickname-save">${escapeHtml(t('account.nicknameSave'))}</button>
      </div>
    </section>`
}

function bindNicknameForm() {
  document.getElementById('account-nickname-save')?.addEventListener('click', async () => {
    const input = document.getElementById('account-nickname-input')
    const name = input?.value?.trim() || ''
    if (!name) {
      showToast(t('account.nicknameEmpty'), 'error')
      input?.focus()
      return
    }
    try {
      await Auth().updateDisplayName(name)
      showToast(t('account.nicknameSaved'), 'success')
      render()
    } catch (e) {
      showToast(e.message || t('account.nicknameFailed'), 'error')
    }
  })
  document.getElementById('account-nickname-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.getElementById('account-nickname-save')?.click()
    }
  })
}

function renderAccountProfilePage() {
  if (!Auth().isLoggedIn()) {
    return renderLoginRequired(t('auth.requiredDefault'))
  }
  const session = Auth().getSession?.()
  const email = session?.user?.email || ''
  const profile = Auth().getProfile?.()
  return `
    <div class="page account-profile-page">
      <header class="memory-header">
        <h1>${escapeHtml(t('account.profileTitle'))}</h1>
        <p>${escapeHtml(t('account.profileDesc'))}</p>
      </header>
      ${renderNicknameForm(profile, email)}
    </div>`
}

function renderMobileAccountHub() {
  const session = Auth().getSession?.()
  const email = session?.user?.email || ''
  const profile = Auth().getProfile?.()
  const name = profile?.display_name?.trim() || email || t('nav.guestHint')
  const adminItems = Auth().isAdmin() ? [
    { href: '#/admin', title: t('nav.sectionAdmin') },
    { href: '#/admin/stats', title: t('nav.adminStats') },
    { href: '#/admin/knowledge', title: t('nav.adminKnowledge') },
    { href: '#/admin/accounts', title: t('nav.adminAccounts') },
    { href: '#/admin/roles', title: t('nav.adminRoles') },
    { href: '#/admin/feedback', title: t('nav.adminFeedback') },
  ] : []

  return `
    <div class="page mobile-hub-page mobile-account-page">
      <header class="mobile-hub-head">
        <h1>${escapeHtml(t('mobile.accountTitle'))}</h1>
        <p>${escapeHtml(Auth().isLoggedIn() ? t('mobile.accountSignedIn') : t('mobile.accountSignedOut'))}</p>
      </header>
      <section class="mobile-account-card">
        <div class="mobile-account-card-name">${escapeHtml(name)}</div>
        ${Auth().isLoggedIn() && email ? `<div class="mobile-account-card-email">${escapeHtml(email)}</div>` : ''}
        ${Auth().isLoggedIn()
          ? `<button type="button" class="btn-secondary" id="mobile-account-logout">${escapeHtml(t('nav.logout'))}</button>`
          : `<a href="#/login" class="btn-primary">${escapeHtml(t('nav.loginRegister'))}</a>`}
      </section>
      ${Auth().isLoggedIn() ? renderNicknameForm(profile, email) : ''}
      ${adminItems.length ? `
        <section class="mobile-account-admin">
          <h2>${escapeHtml(t('nav.sectionAdmin'))}</h2>
          ${renderMobileHubList(adminItems)}
        </section>` : ''}
    </div>`
}

function bindMobileAccountHub() {
  bindNicknameForm()
  document.getElementById('mobile-account-logout')?.addEventListener('click', async () => {
    await Auth().signOut()
    showToast(t('auth.toastLoggedOut'), 'info')
    navigate('/m/account')
  })
}

function renderMobileChrome(activePath) {
  const bottomEl = document.getElementById('mobile-bottom-nav')
  if (!bottomEl) return

  if (!isMobileViewport()) {
    bottomEl.innerHTML = ''
    document.documentElement.classList.remove('mobile-chrome')
    return
  }

  document.documentElement.classList.add('mobile-chrome')
  setSidebarCollapsed(true)
  document.documentElement.classList.remove('sidebar-mobile-open')
  document.getElementById('sidebar-backdrop')?.setAttribute('hidden', '')
  ensureMobileMainObserver()

  const { parts } = parseRoute()
  const tab = getMobileTab(parts)
  const tabs = [
    { id: 'home', href: '#/', label: t('nav.home'), icon: MOBILE_TAB_ICONS.home },
    { id: 'learn', href: '#/m/learn', label: t('nav.sectionLearning'), icon: MOBILE_TAB_ICONS.learn },
    { id: 'knowledge', href: '#/m/knowledge', label: t('nav.sectionKnowledge'), icon: MOBILE_TAB_ICONS.knowledge },
    { id: 'personal', href: '#/m/personal', label: t('nav.sectionPersonal'), icon: MOBILE_TAB_ICONS.personal },
    { id: 'account', href: '#/m/account', label: t('mobile.accountTab'), icon: MOBILE_TAB_ICONS.account },
  ]

  bottomEl.innerHTML = `
    <div class="mobile-tabbar" role="tablist">
      ${tabs.map((item) => `
                <a href="${item.href}" class="mobile-tab ${tab === item.id ? 'active' : ''}" role="tab" aria-selected="${tab === item.id}">
          <span class="mobile-tab-icon" aria-hidden="true">${item.icon}</span>
          <span class="mobile-tab-label">${escapeHtml(item.id === 'learn' ? t('mobile.tabLearn') : item.id === 'knowledge' ? t('mobile.tabKnowledge') : item.id === 'personal' ? t('mobile.tabPersonal') : item.label)}</span>
        </a>
      `).join('')}
    </div>
  `
}

function getSidebarKbDocs() {
  const fromViews = window.PDMKnowledgeViews?.getSidebarDocs?.()
  if (fromViews && Object.keys(fromViews).length) return fromViews
  // 兜底：对齐 public/ 目录结构
  return {
    methodology: [
      { id: 'product-methodology', title: '产品方法论' },
      { id: 'pm-bagu', title: '产品经理八股' },
    ],
    architecture: [
      { id: 'system-architecture', title: '系统架构' },
      { id: 'industry-terms', title: '行业通用词语' },
    ],
    business: [{ id: 'industry-terms-business', title: '业务管理词语' }],
    security: [{ id: 'industry-terms-security', title: '权限与安全词语' }],
  }
}

const NAV_ICONS = {
  home: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 7.2L8 2.8l5.5 4.4V13a1 1 0 0 1-1 1H9.2V9.6H6.8V14H3.5a1 1 0 0 1-1-1V7.2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
  industry: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M3 8h10M3 11.5h7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  tools: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 11.5V6.6L8 3.7l4 2.9v4.9H4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`,
  forum: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="6.5" r="1.7" stroke="currentColor" stroke-width="1.3"/><circle cx="10.5" cy="6.5" r="1.7" stroke="currentColor" stroke-width="1.3"/><path d="M3 11.5c.5-1.4 1.5-2.1 2.5-2.1s2 .7 2.5 2.1M8 11.5c.5-1.4 1.5-2.1 2.5-2.1s2 .7 2.5 2.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  knowledge: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3.5" y="3" width="9" height="10" rx="1.2" stroke="currentColor" stroke-width="1.3"/><path d="M6 6h4M6 8.5h4M6 11h2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  personal: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.2" stroke="currentColor" stroke-width="1.3"/><path d="M3.5 12.2c.8-2 2.4-3 4.5-3s3.7 1 4.5 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  admin: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 12.5V8.2M8 12.5V4.5M12.5 12.5V6.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
}

function navIcon(name) {
  return `<span class="nav-icon" aria-hidden="true">${NAV_ICONS[name] || ''}</span>`
}

const NAV_EXPAND_KEY = 'pm-lab-nav-expand'

function getNavExpandState() {
  try {
    return JSON.parse(localStorage.getItem(NAV_EXPAND_KEY) || '{}') || {}
  } catch {
    return {}
  }
}

function isNavExpanded(id, fallback = true) {
  const state = getNavExpandState()
  if (Object.prototype.hasOwnProperty.call(state, id)) return Boolean(state[id])
  return fallback
}

function setNavExpanded(id, open) {
  const state = getNavExpandState()
  state[id] = Boolean(open)
  try {
    localStorage.setItem(NAV_EXPAND_KEY, JSON.stringify(state))
  } catch (_) {}
}

function navCaret(open) {
  return `<button type="button" class="nav-caret" aria-expanded="${open ? 'true' : 'false'}" title="${open ? '收起' : '展开'}">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>`
}

function renderNavL2Link(href, title, active) {
  return `<a href="${href}" class="nav-item nav-item-l2 ${active ? 'active' : ''}" title="${escapeHtml(title)}">
    <span class="nav-title">${escapeHtml(title)}</span>
  </a>`
}

function bindSidebarNavToggles() {
  document.querySelectorAll('[data-nav-toggle]').forEach((group) => {
    const id = group.getAttribute('data-nav-toggle')
    if (!id) return
    const caret = group.querySelector(':scope > .nav-item-l1 .nav-caret, :scope > .nav-item-branch .nav-caret, :scope > .nav-row .nav-caret')
    caret?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const open = !group.classList.contains('is-open')
      group.classList.toggle('is-open', open)
      caret.setAttribute('aria-expanded', open ? 'true' : 'false')
      setNavExpanded(id, open)
    })
  })
}

function renderSidebar(activePath) {
  const el = document.getElementById('sidebar')
  if (!el) return

  // 手机端取消侧边栏，仅渲染桌面导航
  if (isMobileViewport()) {
    el.innerHTML = ''
    return
  }

  const merged = K.getMergedCategories()
  const can = (id, action = 'view') => Perm().can(id, action)
  const collapsed = getSidebarCollapsed()
  const sidebarDocs = getSidebarKbDocs()

  const kbActive =
    activePath === '/kb' ||
    activePath.startsWith('/kb/') ||
    activePath.includes('/category/') ||
    activePath.includes('/doc/') ||
    activePath.includes('/chapter/') ||
    activePath.includes('/article/') ||
    activePath.includes('/module/') ||
    activePath.startsWith('/m/knowledge')
  const personalActive =
    activePath === '/personal' ||
    activePath.startsWith('/personal/') ||
    ['/favorites', '/notes', '/my-knowledge', '/reviews', '/memory', '/daily-learn', '/feedback'].some(
      (p) => activePath === p || activePath.startsWith(`${p}/`),
    ) ||
    activePath.startsWith('/m/personal')
  const adminActive = activePath.startsWith('/admin')

  const kbOpen = isNavExpanded('kb', kbActive || true)
  const personalOpen = isNavExpanded('personal', personalActive || true)
  const adminOpen = isNavExpanded('admin', adminActive || true)

  const knowledgeTree = merged.map((cat) => {
    if (!can(cat.id)) return ''
    const docs = sidebarDocs[cat.id]
    const catActive =
      activePath.includes(`/category/${cat.id}`) ||
      activePath.includes(`/doc/${cat.id}/`) ||
      activePath.includes(`/chapter/${cat.id}/`) ||
      activePath.includes(`/article/${cat.id}/`) ||
      activePath.includes(`/module/${cat.id}/`)

    if (docs?.length > 1) {
      const branchId = `cat-${cat.id}`
      const branchOpen = isNavExpanded(branchId, catActive)
      return `<div class="nav-branch ${branchOpen ? 'is-open' : ''} ${catActive ? 'is-active' : ''}" data-nav-toggle="${branchId}">
        <div class="nav-item nav-item-l2 nav-item-branch ${catActive ? 'active' : ''}" title="${escapeHtml(catTitle(cat))}">
          <span class="nav-title">${escapeHtml(catTitle(cat))}</span>
          ${navCaret(branchOpen)}
        </div>
        <div class="nav-sub">
          ${docs
            .map((d) => {
              const href = `#/doc/${cat.id}/${d.id}`
              const subActive =
                activePath === `/doc/${cat.id}/${d.id}` ||
                activePath.startsWith(`/doc/${cat.id}/${d.id}/`) ||
                activePath.includes(`/chapter/${cat.id}/${d.id}/`)
              return renderNavL2Link(href, d.title, subActive)
            })
            .join('')}
        </div>
      </div>`
    }

    if (docs?.length === 1) {
      return renderNavL2Link(`#/doc/${cat.id}/${docs[0].id}`, catTitle(cat), catActive)
    }

    return renderNavL2Link(`#/category/${cat.id}`, catTitle(cat), catActive)
  }).join('')

  const personalLinks = [
    can('favorites') && { href: '#/favorites', title: t('nav.favorites'), active: activePath === '/favorites' },
    can('notes') && { href: '#/notes', title: t('nav.articleNotes'), active: activePath === '/notes' },
    can('myKnowledge') && { href: '#/my-knowledge', title: t('nav.myKnowledge'), active: activePath.includes('/my-knowledge') },
    can('reviews') && { href: '#/reviews', title: t('nav.reviews'), active: activePath === '/reviews' || activePath === '/memory' },
    Auth().isLoggedIn() && can('dailyLearn') && { href: '#/daily-learn', title: t('nav.dailyLearn'), active: activePath === '/daily-learn' },
    can('feedback') && { href: '#/feedback', title: t('nav.feedback'), active: activePath === '/feedback' },
  ].filter(Boolean)

  const adminLinks = Auth().isAdmin()
    ? [
        { href: '#/admin/stats', title: t('nav.adminStats'), active: activePath.includes('/admin/stats') },
        { href: '#/admin/knowledge', title: t('nav.adminKnowledge'), active: activePath.includes('/admin/knowledge') },
        { href: '#/admin/accounts', title: t('nav.adminAccounts'), active: activePath.includes('/admin/accounts') || activePath.includes('/admin/permissions') },
        { href: '#/admin/roles', title: t('nav.adminRoles'), active: activePath.includes('/admin/roles') },
        { href: '#/admin/feedback', title: t('nav.adminFeedback'), active: activePath.includes('/admin/feedback') },
      ]
    : []

  el.innerHTML = `
    <div class="sidebar-header">
      <a href="#/" class="logo" title="PM Lab">
        <span class="logo-mark">PM</span>
        <span class="logo-text">Lab</span>
      </a>
      <button type="button" class="sidebar-collapse-btn" id="sidebar-collapse-btn" aria-label="${escapeHtml(collapsed ? t('nav.sidebarExpand') : t('nav.sidebarCollapse'))}" title="${escapeHtml(collapsed ? t('nav.sidebarExpand') : t('nav.sidebarCollapse'))}">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M11 3L6 8L11 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <p class="logo-sub">${escapeHtml(t('nav.brandSubtitle'))}</p>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section nav-section-primary">
        <a href="#/" class="nav-item nav-item-l1 ${activePath === '/' ? 'active' : ''}" title="${escapeHtml(t('nav.home'))}">
          ${navIcon('home')}
          <span class="nav-title">${escapeHtml(t('nav.home'))}</span>
        </a>
        ${can('industry') ? `<a href="#/industry" class="nav-item nav-item-l1 ${activePath.includes('/industry') ? 'active' : ''}" title="${escapeHtml(t('nav.industry'))}">
          ${navIcon('industry')}
          <span class="nav-title">${escapeHtml(t('nav.industry'))}</span>
        </a>` : ''}
        ${can('tools') ? `<a href="#/tools" class="nav-item nav-item-l1 ${activePath.includes('/tools') ? 'active' : ''}" title="${escapeHtml(t('nav.tools'))}">
          ${navIcon('tools')}
          <span class="nav-title">${escapeHtml(t('nav.tools'))}</span>
        </a>` : ''}
        ${can('forum') ? `<a href="#/forum" class="nav-item nav-item-l1 ${activePath.includes('/forum') ? 'active' : ''}" title="${escapeHtml(t('nav.forum'))}">
          ${navIcon('forum')}
          <span class="nav-title">${escapeHtml(t('nav.forum'))}</span>
        </a>` : ''}

        <div class="nav-l1-group ${kbOpen ? 'is-open' : ''} ${kbActive ? 'is-active' : ''}" data-nav-toggle="kb">
          <div class="nav-item nav-item-l1 nav-row ${kbActive ? 'active' : ''}">
            <a href="#/kb" class="nav-row-link" title="${escapeHtml(t('nav.sectionKnowledge'))}">
              ${navIcon('knowledge')}
              <span class="nav-title">${escapeHtml(t('nav.sectionKnowledge'))}</span>
            </a>
            ${navCaret(kbOpen)}
          </div>
          <div class="nav-tree">${knowledgeTree}</div>
        </div>

        <div class="nav-l1-group ${personalOpen ? 'is-open' : ''} ${personalActive ? 'is-active' : ''}" data-nav-toggle="personal">
          <div class="nav-item nav-item-l1 nav-row ${personalActive ? 'active' : ''}">
            <a href="#/personal" class="nav-row-link" title="${escapeHtml(t('nav.sectionPersonal'))}">
              ${navIcon('personal')}
              <span class="nav-title">${escapeHtml(t('nav.sectionPersonal'))}</span>
            </a>
            ${navCaret(personalOpen)}
          </div>
          <div class="nav-tree">
            ${personalLinks.map((l) => renderNavL2Link(l.href, l.title, l.active)).join('')}
          </div>
        </div>

        ${adminLinks.length ? `
        <div class="nav-l1-group ${adminOpen ? 'is-open' : ''} ${adminActive ? 'is-active' : ''}" data-nav-toggle="admin">
          <div class="nav-item nav-item-l1 nav-row ${adminActive ? 'active' : ''}">
            <a href="#/admin" class="nav-row-link" title="${escapeHtml(t('nav.sectionAdmin'))}">
              ${navIcon('admin')}
              <span class="nav-title">${escapeHtml(t('nav.sectionAdmin'))}</span>
            </a>
            ${navCaret(adminOpen)}
          </div>
          <div class="nav-tree">
            ${adminLinks.map((l) => renderNavL2Link(l.href, l.title, l.active)).join('')}
          </div>
        </div>` : ''}
      </div>
    </nav>
  `

  setSidebarCollapsed(getSidebarCollapsed())
  document.getElementById('sidebar-collapse-btn')?.addEventListener('click', () => {
    setSidebarCollapsed(!getSidebarCollapsed())
  })
  bindSidebarNavToggles()
}

function renderHomeTile(tile) {
  return `<a href="${tile.href}" class="home-cap">
    <span class="home-cap-icon" aria-hidden="true">${tile.icon}</span>
    <span class="home-cap-copy">
      <span class="home-cap-title">${escapeHtml(tile.title)}</span>
      <span class="home-cap-desc">${escapeHtml(tile.desc)}</span>
    </span>
  </a>`
}

function renderHome() {
  const stats = K.getKnowledgeStats?.() || { totalCount: 0 }
  const caps = [
    {
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 5.5h12M4 10h12M4 14.5h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
      href: '#/industry',
      title: t('home.featIndustryTitle'),
      desc: t('home.featIndustryDesc'),
    },
    {
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="3.5" width="12" height="13" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M7 7.5h6M7 10.5h6M7 13.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
      href: '#/kb',
      title: t('home.featKnowledgeTitle'),
      desc: t('home.featKnowledgeDesc'),
    },
    {
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 14.5V8.2L10 4.5l5 3.7v6.3H5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.2 14.5v-3.2h3.6v3.2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
      href: '#/tools',
      title: t('home.featToolsTitle'),
      desc: t('home.featToolsDesc'),
    },
    {
      icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="8" r="2.2" stroke="currentColor" stroke-width="1.5"/><circle cx="13" cy="8" r="2.2" stroke="currentColor" stroke-width="1.5"/><path d="M3.8 14.5c.7-1.8 2-2.7 3.2-2.7s2.5.9 3.2 2.7M9.8 14.5c.7-1.8 2-2.7 3.2-2.7s2.5.9 3.2 2.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
      href: '#/forum',
      title: t('home.featForumTitle'),
      desc: t('home.featForumDesc'),
    },
  ]
  const path = window.PDMIndustry?.getRecommendedPath?.()
  const cats = K.getMergedCategories()
  const total = stats.totalCount || cats.reduce((s, c) => s + c.items.length, 0)

  return `
    <div class="page home-page home-codex">
      <section class="home-stage">
        <div class="home-stage-glow" aria-hidden="true"></div>
        <p class="home-stage-kicker">${escapeHtml(t('nav.brandSubtitle'))}</p>
        <h1 class="home-stage-title">
          <span class="home-stage-brand">PM Lab</span>
        </h1>
        <p class="home-stage-line">${escapeHtml(t('home.heroTitle'))}</p>

        <div class="home-composer" id="home-composer" role="group" aria-label="${escapeHtml(t('home.composerLabel'))}">
          <span class="home-composer-prefix" aria-hidden="true">/</span>
          <input type="text" id="home-composer-input" class="home-composer-input" placeholder="${escapeHtml(t('home.composerPlaceholder'))}" autocomplete="off" />
          <button type="button" class="btn-primary home-composer-btn" id="home-composer-go" aria-label="${escapeHtml(t('nav.searchPlaceholder'))}" title="${escapeHtml(t('nav.searchPlaceholder'))}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.25" stroke="currentColor" stroke-width="2"/>
              <path d="M15.2 15.2L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="home-composer-results" id="home-composer-results" hidden></div>
        </div>

        <div class="home-stage-meta">
          <span>${escapeHtml(t('home.metaTopics', { n: total }))}</span>
          <span class="dot">·</span>
          <a href="#/industry">${escapeHtml(t('home.ctaNewcomer'))}</a>
          ${path ? `<span class="dot">·</span><a href="#/industry/learning-path/${path.id}">${escapeHtml(t('home.pathTeaserCta'))}</a>` : ''}
        </div>
      </section>

      <section class="home-section">
        <div class="home-section-head">
          <h2 class="home-section-title">${escapeHtml(t('home.sectionStart'))}</h2>
          <p class="home-section-desc">${escapeHtml(t('home.sectionStartDesc'))}</p>
        </div>
        <ol class="home-flow">
          <li>
            <a href="#/industry" class="home-flow-item">
              <span class="home-flow-num">01</span>
              <span class="home-flow-title">${escapeHtml(t('home.step1Title'))}</span>
              <span class="home-flow-desc">${escapeHtml(t('home.step1Desc'))}</span>
            </a>
          </li>
          <li>
            <a href="#/kb" class="home-flow-item">
              <span class="home-flow-num">02</span>
              <span class="home-flow-title">${escapeHtml(t('home.step2Title'))}</span>
              <span class="home-flow-desc">${escapeHtml(t('home.step2Desc'))}</span>
            </a>
          </li>
          <li>
            <a href="#/tools" class="home-flow-item">
              <span class="home-flow-num">03</span>
              <span class="home-flow-title">${escapeHtml(t('home.step3Title'))}</span>
              <span class="home-flow-desc">${escapeHtml(t('home.step3Desc'))}</span>
            </a>
          </li>
        </ol>
      </section>

      <section class="home-section home-caps-section home-section-last">
        <div class="home-section-head">
          <h2 class="home-section-title">${escapeHtml(t('home.sectionLearn'))}</h2>
        </div>
        <div class="home-cap-grid">${caps.map(renderHomeTile).join('')}</div>
      </section>
    </div>`
}

let homeComposerDocBound = false
function bindHomeEvents() {
  const input = document.getElementById('home-composer-input')
  const go = document.getElementById('home-composer-go')
  const results = document.getElementById('home-composer-results')
  if (!input || !go || !results) return

  const hideResults = () => results.setAttribute('hidden', '')
  const showResults = (html) => {
    results.innerHTML = html
    results.removeAttribute('hidden')
  }

  const paintResults = (q) => {
    const found = K.searchKnowledgeMerged(q).slice(0, 8)
    if (!found.length) {
      showResults(`<div class="home-composer-empty">${escapeHtml(t('nav.searchEmpty'))}</div>`)
      return
    }
    showResults(found.map(({ category, item, source }) => {
      const catLabel = source === 'my'
        ? category.title
        : t(`categories.${category.id}.title`, null, category.title)
      return `<button type="button" class="home-composer-item" data-src="${source || 'public'}" data-cat="${category.id}" data-item="${item.id}">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(catLabel)}</span>
      </button>`
    }).join(''))
    results.querySelectorAll('.home-composer-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.src === 'my') navigate(`/my-knowledge/view/${btn.dataset.item}`)
        else navigate(`/article/${btn.dataset.cat}/${btn.dataset.item}`)
      })
    })
  }

  const run = () => {
    const q = input.value.trim()
    if (!q) {
      hideResults()
      showToast(t('home.searchNeedQuery'), 'info')
      input.focus()
      return
    }
    paintResults(q)
    if (!K.searchKnowledgeMerged(q).length) showToast(t('nav.searchEmpty'), 'info')
  }

  go.onclick = (e) => {
    e.preventDefault()
    run()
  }
  input.oninput = () => {
    const q = input.value.trim()
    if (!q) {
      hideResults()
      return
    }
    paintResults(q)
  }
  input.onkeydown = (e) => {
    if (e.key === 'Escape') {
      hideResults()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const first = results.querySelector('.home-composer-item')
      if (first && !results.hasAttribute('hidden')) first.click()
      else run()
    }
  }

  if (!homeComposerDocBound) {
    homeComposerDocBound = true
    document.addEventListener('click', (e) => {
      if (!e.target.closest?.('.home-composer')) {
        document.getElementById('home-composer-results')?.setAttribute('hidden', '')
      }
    })
  }
}

function renderCategory(categoryId) {
  const smart = window.PDMKnowledgeViews?.renderCategorySmart?.(categoryId)
  if (smart) return smart
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
          <a href="#/article/${cat.id}/${encodeURIComponent(item.id)}" class="article-card ${item.isShared ? 'shared-item' : ''}">
            <span class="article-index">${String(i + 1).padStart(2, '0')}</span>
            <div class="article-card-body">
              <h3>${item.title}${item.isShared ? ` <span class="shared-badge">${escapeHtml(t('article.sharedShort'))}</span>` : ''}</h3><p>${item.summary}</p>
              <div class="article-tags">${item.tags.map(tg => `<span class="tag">${tg}</span>`).join('')}</div>
            </div>
          </a>
        `).join('')}
      </div>
    </div>`
}

function renderKnowledgeParagraphs(lines) {
  return (lines || []).map((p) => {
    const text = String(p)
    if (text.startsWith('【') && text.endsWith('】')) {
      return `<h3 class="article-subhead">${escapeHtml(text.slice(1, -1))}</h3>`
    }
    if (text.includes('\n')) {
      return `<p class="article-preline">${escapeHtml(text).replace(/\n/g, '<br>')}</p>`
    }
    // 表格式条目（含 · 或多处冒号）用等宽感列表展现
    if (text.includes(' · ') || /^[^：]{1,20}：/.test(text)) {
      return `<p class="article-kv">${escapeHtml(text)}</p>`
    }
    return `<p>${escapeHtml(text)}</p>`
  }).join('')
}

function renderKnowledgeDetailBody(item) {
  const explain = item.content || []
  const cases = item.cases || []
  const pmApp = item.pmApplication || []
  const mermaidBlocks = item.mermaid || []
  const hasStructured = cases.length > 0 || pmApp.length > 0

  if (!explain.length && !cases.length && !pmApp.length && !mermaidBlocks.length) {
    return `<div class="article-body"><p class="empty-hint">${escapeHtml(t('common.notFound'))}</p></div>`
  }

  const mermaidHtml = mermaidBlocks.length
    ? `<div class="kb-mindmap-stack">${mermaidBlocks.map((code, idx) => `
        <div class="kb-mermaid" data-mermaid-idx="${idx}">${escapeHtml(code)}</div>`).join('')}</div>`
    : ''

  // 长模板 / 带大量换行的正文用预格式块
  const looksTemplate = item.kind === 'prd-template' || explain.some((c) => String(c).includes('\n## ') || String(c).startsWith('# '))
  if (looksTemplate && !hasStructured) {
    return `<div class="article-body">
      <pre class="kb-prd-pre">${escapeHtml(explain.join('\n\n'))}</pre>
      ${mermaidHtml}
    </div>`
  }

  if (!hasStructured) {
    return `<div class="article-body">${renderKnowledgeParagraphs(explain)}${mermaidHtml}</div>`
  }

  return `
    <div class="article-sections">
      <section class="article-section article-section-explain">
        <div class="article-section-header">
          <span class="article-section-label">${escapeHtml(t('article.sectionExplainLabel'))}</span>
          <h2>${escapeHtml(t('article.sectionExplainTitle'))}</h2>
        </div>
        <div class="article-section-body">
          ${renderKnowledgeParagraphs(explain)}
          ${mermaidHtml}
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
              <p class="article-preline">${escapeHtml(c).replace(/\n/g, '<br>')}</p>
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

let articleNotesEditState = { id: null, composing: false }

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
    articleNotesEditState = { id: null, composing: false }
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
      articleNotesEditState = { id: btn.dataset.noteId, composing: false }
      render()
    })
  })

  section.querySelectorAll('.btn-note-cancel').forEach((btn) => {
    btn.addEventListener('click', () => {
      articleNotesEditState = { id: null, composing: false }
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
      articleNotesEditState = { id: null, composing: false }
      showToast(t('article.notesSaved'), 'success')
      render()
    })
  })

  section.querySelectorAll('.btn-note-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm(t('notes.deleteConfirm'))) return
      await deleteArticleNote(btn.dataset.noteId)
      articleNotesEditState = { id: null, composing: false }
      showToast(t('common.deleted'), 'info')
      render()
    })
  })
}

function renderArticle(categoryId, itemId) {
  let cat = K.getCategoryByIdMerged(categoryId)
  let item = cat?.items.find((i) => i.id === itemId)
  if (!item) {
    for (const c of K.getMergedCategories?.() || []) {
      const hit = c.items.find((i) => i.id === itemId)
      if (hit) {
        cat = c
        item = hit
        break
      }
    }
  }
  if (!cat || !item) return `<div class="page"><p>${escapeHtml(t('common.notFound'))}</p><a href="#/">${escapeHtml(t('common.backHome'))}</a></div>`
  const catLabel = catTitle(cat)
  const displayTitle = window.PDMKnowledgeViews?.stripLeadingIndex?.(item.title) || item.title
  const idx = cat.items.findIndex(i => i.id === item.id)
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
        <span class="breadcrumb-current">${escapeHtml(displayTitle)}</span>
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
        <h1>${escapeHtml(displayTitle)}</h1>
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
        ${prev ? `<a href="#/article/${cat.id}/${encodeURIComponent(prev.id)}" class="article-nav-link prev"><span class="nav-direction">${escapeHtml(t('article.navPrev'))}</span><span class="nav-title">${escapeHtml(prev.title)}</span></a>` : '<div></div>'}
        ${next ? `<a href="#/article/${cat.id}/${encodeURIComponent(next.id)}" class="article-nav-link next"><span class="nav-direction">${escapeHtml(t('article.navNext'))}</span><span class="nav-title">${escapeHtml(next.title)}</span></a>` : '<div></div>'}
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

function noteHubLinkOptionsHtml(selectedKey = '') {
  const opts = [`<option value="">${escapeHtml(t('notes.linkNone'))}</option>`]
  for (const cat of K.getMergedCategories?.() || []) {
    for (const item of cat.items) {
      const key = `public:${cat.id}:${item.id}`
      opts.push(`<option value="${key}" ${selectedKey === key ? 'selected' : ''}>${escapeHtml(`${catTitle(cat)} · ${item.title}`)}</option>`)
    }
  }
  for (const item of K.getMyKnowledgeItems?.() || []) {
    const key = `my:${item.id}`
    opts.push(`<option value="${key}" ${selectedKey === key ? 'selected' : ''}>${escapeHtml(`${t('nav.myKnowledge')} · ${item.title}`)}</option>`)
  }
  return opts.join('')
}

function parseNoteLinkKey(key) {
  if (!key) return { source: 'free' }
  if (key.startsWith('my:')) return { source: 'my', itemId: key.slice(3) }
  const m = key.match(/^public:([^:]+):(.+)$/)
  if (m) return { source: 'public', categoryId: m[1], itemId: m[2] }
  return { source: 'free' }
}

function renderArticleNotesHub() {
  const notes = loadArticleNotes()
  const editingId = articleNotesEditState.id
  const composing = articleNotesEditState.composing
  const canEdit = Perm().can('notes', 'edit')

  const composeHtml = composing ? `
    <section class="note-hub-compose" id="note-hub-compose">
      <div class="note-hub-compose-head">
        <h2>${escapeHtml(t('notes.addTitle'))}</h2>
        <p>${escapeHtml(t('notes.addDesc'))}</p>
      </div>
      <label class="note-hub-field">
        <span>${escapeHtml(t('notes.fieldTitle'))}</span>
        <input type="text" id="hub-note-title" class="note-hub-input" maxlength="80" placeholder="${escapeHtml(t('notes.titlePlaceholder'))}" />
      </label>
      <label class="note-hub-field">
        <span>${escapeHtml(t('notes.fieldLink'))}</span>
        <select id="hub-note-link" class="note-hub-input">${noteHubLinkOptionsHtml()}</select>
      </label>
      <label class="note-hub-field">
        <span>${escapeHtml(t('notes.fieldContent'))}</span>
        <textarea id="hub-note-content" class="note-edit-input" rows="5" placeholder="${escapeHtml(t('article.notesPlaceholder'))}"></textarea>
      </label>
      <div class="note-card-actions">
        <button type="button" class="btn-primary" id="btn-hub-note-create">${escapeHtml(t('notes.addSave'))}</button>
        <button type="button" class="btn-ghost" id="btn-hub-note-compose-cancel">${escapeHtml(t('common.cancel'))}</button>
      </div>
    </section>` : ''

  const listHtml = notes.length ? notes.map((note) => {
    const resolved = K.resolveArticleNote(note)
    const catLabel = resolved.source === 'my'
      ? (resolved.item.groupName || t('nav.myKnowledge'))
      : resolved.source === 'free'
        ? t('notes.freeLabel')
        : (resolved.category ? catTitle(resolved.category) : '')
    const editing = editingId === note.id
    const linkHtml = resolved.href
      ? `<a href="${resolved.href}" class="note-article-link">${escapeHtml(resolved.item.title)}</a>`
      : `<span class="note-article-link ${resolved.missing ? 'note-article-missing' : ''}">${escapeHtml(resolved.item.title || t('notes.freeLabel'))}</span>`

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
            ${canEdit ? `<button type="button" class="btn-hub-note-edit" data-note-id="${note.id}">${escapeHtml(t('common.edit'))}</button>` : ''}
            ${canEdit ? `<button type="button" class="btn-hub-note-delete danger" data-note-id="${note.id}">${escapeHtml(t('common.delete'))}</button>` : ''}
          </div>
        `}
      </div>`
  }).join('') : `<p class="empty-hint">${escapeHtml(t('notes.empty'))}</p>`

  return `
    <div class="page notes-page">
      <header class="memory-header notes-header">
        <div class="notes-header-copy">
          <h1>${escapeHtml(t('notes.title'))}</h1>
          <p>${escapeHtml(t('notes.desc', { n: notes.length }))}</p>
        </div>
        ${canEdit ? `
        <button type="button" class="btn-primary" id="btn-hub-note-add" ${composing ? 'hidden' : ''}>
          ${escapeHtml(t('notes.add'))}
        </button>` : ''}
      </header>
      ${composeHtml}
      <div class="notes-list">${listHtml}</div>
    </div>`
}

function bindArticleNotesHubEvents() {
  document.getElementById('btn-hub-note-add')?.addEventListener('click', () => {
    articleNotesEditState = { id: null, composing: true }
    render()
    document.getElementById('hub-note-content')?.focus()
  })

  document.getElementById('btn-hub-note-compose-cancel')?.addEventListener('click', () => {
    articleNotesEditState = { id: null, composing: false }
    render()
  })

  document.getElementById('btn-hub-note-create')?.addEventListener('click', async () => {
    const content = document.getElementById('hub-note-content')?.value.trim()
    const title = document.getElementById('hub-note-title')?.value.trim()
    const linkKey = document.getElementById('hub-note-link')?.value || ''
    if (!content) {
      showToast(t('article.notesEmptyInput'), 'error')
      return
    }
    const ref = { ...parseNoteLinkKey(linkKey), title }
    try {
      await addArticleNote(ref, content)
      articleNotesEditState = { id: null, composing: false }
      showToast(t('article.notesSaved'), 'success')
      render()
    } catch (e) {
      showToast(e.message || t('common.notFound'), 'error')
    }
  })

  document.querySelectorAll('.btn-hub-note-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      articleNotesEditState = { id: btn.dataset.noteId, composing: false }
      render()
    })
  })

  document.querySelectorAll('.btn-hub-note-cancel').forEach((btn) => {
    btn.addEventListener('click', () => {
      articleNotesEditState = { id: null, composing: false }
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
      articleNotesEditState = { id: null, composing: false }
      showToast(t('article.notesSaved'), 'success')
      render()
    })
  })

  document.querySelectorAll('.btn-hub-note-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm(t('notes.deleteConfirm'))) return
      await deleteArticleNote(btn.dataset.noteId)
      articleNotesEditState = { id: null, composing: false }
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

const AUTH_REMEMBER_KEY = 'pm-lab-auth-remember'

function loadRememberedAuth() {
  try {
    const raw = localStorage.getItem(AUTH_REMEMBER_KEY)
    if (!raw) return { remember: false, email: '' }
    const data = JSON.parse(raw)
    return { remember: Boolean(data.remember), email: data.email || '' }
  } catch {
    return { remember: false, email: '' }
  }
}

function saveRememberedAuth(remember, email) {
  try {
    if (remember && email) localStorage.setItem(AUTH_REMEMBER_KEY, JSON.stringify({ remember: true, email }))
    else localStorage.removeItem(AUTH_REMEMBER_KEY)
  } catch (_) {}
}

function renderLoginPage() {
  const configured = Auth().isConfigured()
  const remembered = loadRememberedAuth()
  return `
    <div class="page auth-page">
      <div class="auth-card auth-card-rich">
        <div class="auth-card-brand">PM Lab</div>
        <h1>${escapeHtml(t('auth.pageTitle'))}</h1>
        <p class="auth-desc">${escapeHtml(t('auth.pageDesc'))}</p>
        ${!configured ? `<p class="auth-warn">${escapeHtml(t('auth.notConfigured'))}</p>` : ''}
        <form id="auth-form" class="auth-form" autocomplete="on">
          <div class="form-group">
            <label for="auth-email">${escapeHtml(t('auth.email'))}</label>
            <input id="auth-email" name="email" type="email" inputmode="email" autocomplete="username" placeholder="your@email.com" value="${escapeHtml(remembered.email)}" required />
          </div>
          <div class="form-group">
            <div class="auth-label-row">
              <label for="auth-password">${escapeHtml(t('auth.password'))}</label>
              <button type="button" class="auth-text-btn" id="auth-forgot">${escapeHtml(t('auth.forgotPassword'))}</button>
            </div>
            <div class="auth-password-field">
              <input id="auth-password" name="password" type="password" autocomplete="current-password" placeholder="${escapeHtml(t('auth.passwordPlaceholder'))}" required minlength="6" />
              <button type="button" class="auth-eye" id="auth-toggle-password" aria-label="${escapeHtml(t('auth.showPassword'))}">${escapeHtml(t('auth.showPassword'))}</button>
            </div>
          </div>
          <label class="auth-remember">
            <input type="checkbox" id="auth-remember" ${remembered.remember ? 'checked' : ''} />
            <span>${escapeHtml(t('auth.rememberMe'))}</span>
          </label>
          <div class="form-actions auth-actions">
            <button type="submit" class="btn-primary" id="auth-login" ${configured ? '' : 'disabled'}>${escapeHtml(t('auth.login'))}</button>
            <button type="button" class="btn-secondary" id="auth-register" ${configured ? '' : 'disabled'}>${escapeHtml(t('auth.register'))}</button>
          </div>
        </form>
      </div>
    </div>`
}

function renderResetPasswordPage() {
  const configured = Auth().isConfigured()
  return `
    <div class="page auth-page">
      <div class="auth-card auth-card-rich">
        <div class="auth-card-brand">PM Lab</div>
        <h1>${escapeHtml(t('auth.resetTitle'))}</h1>
        <p class="auth-desc">${escapeHtml(t('auth.resetDesc'))}</p>
        ${!configured ? `<p class="auth-warn">${escapeHtml(t('auth.notConfigured'))}</p>` : ''}
        <div class="form-group">
          <label for="auth-new-password">${escapeHtml(t('auth.newPassword'))}</label>
          <input id="auth-new-password" type="password" autocomplete="new-password" placeholder="${escapeHtml(t('auth.passwordPlaceholder'))}" minlength="6" />
        </div>
        <div class="form-actions auth-actions">
          <button type="button" class="btn-primary" id="auth-update-password" ${configured ? '' : 'disabled'}>${escapeHtml(t('auth.savePassword'))}</button>
          <a href="#/login" class="btn-ghost">${escapeHtml(t('auth.backToLogin'))}</a>
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
      ${renderAdminHeader(t('nav.adminStats'), t('admin.statsDesc'))}
      <div class="admin-stats-grid">
        <div class="admin-stat-card"><span class="admin-stat-num">${stats.totalUsers}</span><span class="admin-stat-label">注册用户</span></div>
        <div class="admin-stat-card"><span class="admin-stat-num">${stats.dau}</span><span class="admin-stat-label">DAU（今日活跃）</span></div>
        <div class="admin-stat-card"><span class="admin-stat-num">${stats.mau}</span><span class="admin-stat-label">MAU（近 30 日）</span></div>
        <div class="admin-stat-card"><span class="admin-stat-num">${stats.totalEvents}</span><span class="admin-stat-label">行为记录总数</span></div>
      </div>
      <section class="section admin-retention-section">
        <div class="admin-retention-row">
          <div>
            <h2 class="section-title" style="margin-bottom:4px">${escapeHtml(t('admin.retentionTitle'))}</h2>
            <p class="form-hint">${escapeHtml(t('admin.retentionHint'))}</p>
          </div>
          <button type="button" class="btn-secondary" id="btn-cleanup-events">${escapeHtml(t('admin.retentionCleanup'))}</button>
        </div>
      </section>
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

function bindAdminStatsEvents() {
  document.getElementById('btn-cleanup-events')?.addEventListener('click', async () => {
    if (!confirm(t('admin.retentionConfirm'))) return
    try {
      const sb = Auth().getClient()
      if (!sb) throw new Error(t('auth.notConfigured'))
      const { data, error } = await sb.rpc('cleanup_usage_events', { p_days: 90 })
      if (error) throw error
      const deleted = data?.deleted ?? 0
      showToast(t('admin.retentionDone', { n: deleted }), 'success')
      const stats = await fetchAdminStats()
      document.getElementById('main').innerHTML = renderAdminPage(stats)
      bindAdminStatsEvents()
    } catch (e) {
      const msg = e.message || String(e)
      showToast(/function|schema cache|404/i.test(msg)
        ? t('admin.retentionSqlHint')
        : msg, 'error')
    }
  })
}

let adminKnowledgeState = { filter: 'all', status: 'all', q: '' }
let adminKnowledgeFormState = { tags: [], tagInput: '' }

function adminCategoryLabel(categoryId) {
  const cat = K.builtinCategories().find((c) => c.id === categoryId)
  return cat ? catTitle(cat) : categoryId
}

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
    <div class="page admin-page admin-console-page">
      ${renderAdminHeader(t('nav.adminKnowledge'), t('admin.knowledgeDesc'))}

      <div class="admin-filter-bar">
        <div class="admin-filter-fields">
          <label class="admin-filter-item admin-filter-item-search">
            <span>${escapeHtml(t('admin.permFilterSearch'))}</span>
            <input type="search" id="skill-search" placeholder="${escapeHtml(t('admin.knowledgeSearch'))}" value="${escapeHtml(adminKnowledgeState.q)}" />
          </label>
          <label class="admin-filter-item admin-filter-item-sm">
            <span>${escapeHtml(t('admin.knowledgeFilterSource'))}</span>
            <select id="skill-filter">
              <option value="all" ${adminKnowledgeState.filter === 'all' ? 'selected' : ''}>${escapeHtml(t('admin.knowledgeSourceAll'))}</option>
              <option value="pm-bagu" ${adminKnowledgeState.filter === 'pm-bagu' ? 'selected' : ''}>产品经理八股</option>
              <option value="industry-terms" ${adminKnowledgeState.filter === 'industry-terms' ? 'selected' : ''}>行业通用词语</option>
              <option value="admin" ${adminKnowledgeState.filter === 'admin' ? 'selected' : ''}>运营新增</option>
            </select>
          </label>
          <label class="admin-filter-item admin-filter-item-sm">
            <span>${escapeHtml(t('admin.knowledgeFilterStatus'))}</span>
            <select id="skill-status">
              <option value="all" ${adminKnowledgeState.status === 'all' ? 'selected' : ''}>${escapeHtml(t('admin.knowledgeStatusAll'))}</option>
              <option value="published" ${adminKnowledgeState.status === 'published' ? 'selected' : ''}>${escapeHtml(t('admin.knowledgePublished'))}</option>
              <option value="draft" ${adminKnowledgeState.status === 'draft' ? 'selected' : ''}>${escapeHtml(t('admin.knowledgeDraft'))}</option>
            </select>
          </label>
          <div class="admin-filter-item admin-filter-item-btn">
            <span class="admin-filter-label-spacer" aria-hidden="true">&nbsp;</span>
            <button type="button" class="btn-ghost admin-filter-reset" id="admin-knowledge-filter-reset">${escapeHtml(t('admin.permFilterReset'))}</button>
          </div>
        </div>
        <div class="admin-filter-item admin-filter-item-btn admin-filter-trailing">
          <span class="admin-filter-label-spacer" aria-hidden="true">&nbsp;</span>
          <div class="admin-filter-actions">
            <a href="#/admin/knowledge/new" class="btn-primary">${escapeHtml(t('admin.knowledgeAdd'))}</a>
            <button type="button" class="btn-secondary" id="btn-import-catalog">${escapeHtml(t('admin.knowledgeImport'))}</button>
          </div>
        </div>
      </div>
      <div class="admin-filter-meta-line">${escapeHtml(t('admin.knowledgeCount', { total: entries.length, published: publishedCount, draft: draftCount, shown: filtered.length }))}</div>

      <div class="admin-perm-table-wrap">
        <table class="admin-data-table admin-knowledge-data-table">
          <thead>
            <tr>
              <th>${escapeHtml(t('admin.knowledgeColTitle'))}</th>
              <th>${escapeHtml(t('admin.knowledgeColSource'))}</th>
              <th>${escapeHtml(t('admin.knowledgeColCategory'))}</th>
              <th>${escapeHtml(t('admin.knowledgeColStatus'))}</th>
              <th class="admin-data-col-action">${escapeHtml(t('admin.permColAction'))}</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length ? filtered.map((e) => `
              <tr class="admin-data-row">
                <td>
                  <div class="admin-cell-stack">
                    <span class="admin-data-primary">${escapeHtml(e.title)}</span>
                    ${e.section ? `<span class="admin-cell-sub">${escapeHtml(e.section)}</span>` : ''}
                  </div>
                </td>
                <td>${escapeHtml(SharedK().getSkillLabel(e.sourceSkill))}</td>
                <td>${escapeHtml(adminCategoryLabel(e.categoryId))}</td>
                <td>${e.published
                  ? `<span class="admin-status-badge is-published">${escapeHtml(t('admin.knowledgePublished'))}</span>`
                  : `<span class="admin-status-badge is-draft">${escapeHtml(t('admin.knowledgeDraft'))}</span>`}</td>
                <td class="admin-data-col-action">
                  <div class="admin-row-actions">
                    <a href="#/admin/knowledge/edit/${encodeURIComponent(e.id)}" class="btn-ghost btn-sm">${escapeHtml(t('common.edit'))}</a>
                    <button type="button" class="btn-ghost btn-sm btn-admin-del" data-id="${escapeHtml(e.id)}">${escapeHtml(t('common.delete'))}</button>
                  </div>
                </td>
              </tr>`).join('') : `<tr><td colspan="5" class="admin-data-empty">${escapeHtml(t('admin.knowledgeEmpty'))}</td></tr>`}
          </tbody>
        </table>
      </div>
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
      ${renderAdminHeader(isEdit ? '编辑知识' : '新增知识', '保存后可选择是否立即发布到全站用户', 'knowledge')}
      <p class="form-hint" style="margin-top:-12px;margin-bottom:20px"><a href="#/admin/knowledge">← 返回列表</a></p>
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
    const pos = e.target.selectionStart
    renderAdminKnowledgeRoute()
    requestAnimationFrame(() => {
      const input = document.getElementById('skill-search')
      if (input) {
        input.focus()
        try { input.setSelectionRange(pos, pos) } catch (_) {}
      }
    })
  })
  document.getElementById('skill-filter')?.addEventListener('change', (e) => {
    adminKnowledgeState.filter = e.target.value
    renderAdminKnowledgeRoute()
  })
  document.getElementById('skill-status')?.addEventListener('change', (e) => {
    adminKnowledgeState.status = e.target.value
    renderAdminKnowledgeRoute()
  })
  document.getElementById('admin-knowledge-filter-reset')?.addEventListener('click', () => {
    adminKnowledgeState.q = ''
    adminKnowledgeState.filter = 'all'
    adminKnowledgeState.status = 'all'
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
        <p>自定义推送时间，每天精选 3 条知识（需保持页面打开或允许浏览器通知）</p>
      </header>

      <section class="daily-learn-card">
        <div class="daily-learn-card-head">
          <h2>推送设置</h2>
          <p>固定节奏，优先避开近 7 天已推送内容</p>
        </div>

        <label class="daily-learn-switch">
          <input type="checkbox" id="push-enabled" ${settings.enabled ? 'checked' : ''} />
          <span class="daily-learn-switch-ui" aria-hidden="true"></span>
          <span class="daily-learn-switch-copy">
            <strong>开启每日推送</strong>
            <span>到点后自动挑选今日知识</span>
          </span>
        </label>

        <div class="daily-learn-field">
          <span class="daily-learn-label">推送时间</span>
          <input type="time" id="push-time" class="daily-learn-time" value="${settings.time || '09:00'}" />
        </div>

        <div class="daily-learn-field">
          <span class="daily-learn-label">知识分类</span>
          <span class="daily-learn-hint">不选则全库随机 · 每次固定 3 条</span>
          <div class="daily-learn-cats" role="group" aria-label="知识分类">
            ${cats.map((c) => `
              <label class="daily-learn-cat">
                <input type="checkbox" class="push-cat" value="${c.id}" ${(settings.categories || []).includes(c.id) ? 'checked' : ''} />
                <span class="daily-learn-cat-box" aria-hidden="true"></span>
                <span class="daily-learn-cat-text">${escapeHtml(catTitle(c))}</span>
              </label>`).join('')}
          </div>
        </div>

        <div class="daily-learn-actions">
          <button type="button" class="btn-primary" id="btn-save-push">保存设置</button>
          <button type="button" class="btn-secondary" id="btn-push-now">立即推送今日 3 条</button>
          <button type="button" class="btn-ghost" id="btn-push-notify">开启浏览器通知</button>
        </div>
      </section>

      <section class="daily-learn-card daily-learn-today">
        <div class="daily-learn-card-head">
          <h2>今日推送 ${settings.lastPushDate === today ? `· ${settings.time || '09:00'}` : ''}</h2>
        </div>
        ${todayItems.length ? `
          <div class="daily-push-cards">
            ${todayItems.map((item) => `
              <a href="#/article/${item.categoryId}/${item.itemId}" class="daily-push-card">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.summary || '')}</p>
                <span class="memory-banner-action">去学习</span>
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
  const emailEl = document.getElementById('auth-email')
  const passwordEl = document.getElementById('auth-password')
  const rememberEl = document.getElementById('auth-remember')

  const persistRemember = () => {
    saveRememberedAuth(Boolean(rememberEl?.checked), emailEl?.value?.trim() || '')
  }

  // 有记住的邮箱时，焦点落到密码，方便浏览器密码管理器联动填充
  if (rememberEl?.checked && emailEl?.value) passwordEl?.focus()
  else emailEl?.focus()

  rememberEl?.addEventListener('change', persistRemember)
  emailEl?.addEventListener('change', () => {
    if (rememberEl?.checked) persistRemember()
  })

  document.getElementById('auth-toggle-password')?.addEventListener('click', () => {
    if (!passwordEl) return
    const show = passwordEl.type === 'password'
    passwordEl.type = show ? 'text' : 'password'
    const btn = document.getElementById('auth-toggle-password')
    if (btn) btn.textContent = show ? t('auth.hidePassword') : t('auth.showPassword')
  })

  document.getElementById('auth-forgot')?.addEventListener('click', async () => {
    const email = emailEl?.value?.trim()
    if (!email) return showToast(t('auth.needEmail'), 'error')
    try {
      await Auth().resetPasswordForEmail(email)
      persistRemember()
      showToast(t('auth.resetSent'), 'success')
    } catch (e) { showToast(e.message, 'error') }
  })

  document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = emailEl?.value?.trim()
    const password = passwordEl?.value
    if (!email || !password) return showToast(t('auth.needBoth'), 'error')
    try {
      await Auth().signInWithEmail(email, password)
      persistRemember()
      await Perm().loadRolePermissions?.()
      await Analytics()?.trackDailyActive?.()
      await PDMCloud.init()
      if (Auth().isLoggedIn()) DailyPush()?.start?.(showDailyPushModal)
      showToast(t('auth.toastLoggedIn'), 'success')
      navigate('/')
      render()
    } catch (err) { showToast(err.message, 'error') }
  })

  document.getElementById('auth-register')?.addEventListener('click', async () => {
    const email = emailEl?.value?.trim()
    const password = passwordEl?.value
    if (!email || !password) return showToast(t('auth.needBoth'), 'error')
    if (password.length < 6) return showToast(t('auth.passwordTooShort'), 'error')
    try {
      const data = await Auth().signUpWithEmail(email, password)
      persistRemember()
      if (data.session) {
        await Perm().loadRolePermissions?.()
        await Analytics()?.trackDailyActive?.()
        await PDMCloud.init()
        if (Auth().isLoggedIn()) DailyPush()?.start?.(showDailyPushModal)
        showToast(t('auth.toastRegistered'), 'success')
        navigate('/')
        render()
      } else showToast(t('auth.toastConfirmEmail'), 'info')
    } catch (err) { showToast(err.message, 'error') }
  })
}

function bindResetPasswordEvents() {
  document.getElementById('auth-update-password')?.addEventListener('click', async () => {
    const password = document.getElementById('auth-new-password')?.value
    if (!password || password.length < 6) return showToast(t('auth.passwordTooShort'), 'error')
    try {
      await Auth().updatePassword(password)
      showToast(t('auth.passwordUpdated'), 'success')
      navigate('/')
    } catch (e) { showToast(e.message, 'error') }
  })
}

function bindLocaleEvents() {
  document.querySelectorAll('.locale-toggle, .locale-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.PMLabI18n?.setLocale(btn.dataset.locale)
    })
  })
}

let topAccountDocBound = false
function bindTopAccountEvents() {
  const menuBtn = document.getElementById('topbar-account-menu-btn')
  const menu = document.getElementById('topbar-account-menu')

  const closeMenu = () => {
    document.getElementById('topbar-account-menu')?.setAttribute('hidden', '')
  }

  menuBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    const m = document.getElementById('topbar-account-menu')
    if (!m) return
    const open = m.hasAttribute('hidden')
    if (open) m.removeAttribute('hidden')
    else m.setAttribute('hidden', '')
  })

  if (!topAccountDocBound) {
    topAccountDocBound = true
    document.addEventListener('click', (e) => {
      const m = document.getElementById('topbar-account-menu')
      if (!m || m.hasAttribute('hidden')) return
      if (!e.target.closest('.topbar-account')) closeMenu()
    })
  }

  document.getElementById('topbar-logout')?.addEventListener('click', async () => {
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

async function renderAdminAccountsRoute() {
  if (window.PDMAdminRbac?.renderAccountsRoute) return window.PDMAdminRbac.renderAccountsRoute()
  document.getElementById('main').innerHTML = `<div class="page"><p>${escapeHtml(t('common.loading'))}</p></div>`
}

async function renderAdminRolesRoute() {
  if (window.PDMAdminRbac?.renderRolesRoute) return window.PDMAdminRbac.renderRolesRoute()
  document.getElementById('main').innerHTML = `<div class="page"><p>${escapeHtml(t('common.loading'))}</p></div>`
}

function render() {
  const { parts } = parseRoute()
  const path = '/' + parts.join('/')

  if (window.matchMedia('(max-width: 900px)').matches) {
    if (localStorage.getItem('pm-lab-sidebar-collapsed') == null) setSidebarCollapsed(true)
  }

  renderLocaleSwitcher()
  renderTopAccount(path)
  renderSidebar(path)
  renderMobileChrome(path)
  renderTopbarCrumbs(buildCrumbsFromRoute(parts))
  bindLocaleEvents()
  bindTopAccountEvents()
  bindTopbarSearch()
  bindMobileNavChrome()
  bindMobileViewportWatcher()
  bindSyncEvents()
  syncMobileChromeOffsets()

  const forbiddenHtml = renderForbidden()

  const main = document.getElementById('main')
  const routePerm = Perm().routeFeature(parts)
  if (routePerm?.feature && routePerm.feature !== 'admin' && !Perm().can(routePerm.feature, routePerm.action)) {
    main.innerHTML = renderPermissionDenied()
    return
  }

  if (parts.length === 0) {
    main.innerHTML = renderHome()
    bindHomeEvents()
    Analytics()?.track('page_view', { page: 'home' })
  } else if (parts[0] === 'm' && parts[1] === 'learn') {
    main.innerHTML = renderMobileLearnHub()
  } else if (parts[0] === 'm' && parts[1] === 'knowledge') {
    main.innerHTML = renderMobileKnowledgeHub()
  } else if (parts[0] === 'm' && parts[1] === 'personal') {
    main.innerHTML = renderMobilePersonalHub()
  } else if (parts[0] === 'kb') {
    main.innerHTML = renderKnowledgeHubPage()
    Analytics()?.track('page_view', { page: 'kb-home' })
  } else if (parts[0] === 'personal') {
    main.innerHTML = renderPersonalHubPage()
    Analytics()?.track('page_view', { page: 'personal-hub' })
  } else if (parts[0] === 'm' && parts[1] === 'account') {
    main.innerHTML = renderMobileAccountHub()
    bindMobileAccountHub()
  } else if (parts[0] === 'account') {
    main.innerHTML = renderAccountProfilePage()
    if (Auth().isLoggedIn()) bindNicknameForm()
    Analytics()?.track('page_view', { page: 'account' })
  } else if (parts[0] === 'login') {
    if (Auth().isLoggedIn()) {
      navigate('/')
      return
    }
    main.innerHTML = renderLoginPage()
    bindLoginEvents()
  } else if (parts[0] === 'reset-password') {
    main.innerHTML = renderResetPasswordPage()
    bindResetPasswordEvents()
  } else if (parts[0] === 'admin' && parts[1] === 'feedback') {
    if (!Auth().isAdmin()) main.innerHTML = forbiddenHtml
    else renderAdminFeedbackRoute()
  } else if (parts[0] === 'admin' && (parts[1] === 'accounts' || parts[1] === 'permissions')) {
    if (!Auth().isAdmin()) main.innerHTML = forbiddenHtml
    else if (parts[1] === 'permissions') {
      navigate('/admin/accounts')
      return
    } else renderAdminAccountsRoute()
  } else if (parts[0] === 'admin' && parts[1] === 'roles') {
    if (!Auth().isAdmin()) main.innerHTML = forbiddenHtml
    else renderAdminRolesRoute()
  } else if (parts[0] === 'feedback') {
    if (!Perm().can('feedback', 'edit') && !Perm().can('feedback', 'view')) {
      main.innerHTML = renderPermissionDenied()
    } else {
      renderFeedbackRoute()
    }
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
  } else if (parts[0] === 'admin' && parts[1] === 'stats') {
    if (!Auth().isAdmin()) {
      main.innerHTML = forbiddenHtml
    } else {
      main.innerHTML = '<div class="page"><p>加载统计数据…</p></div>'
      fetchAdminStats().then(stats => {
        main.innerHTML = renderAdminPage(stats)
        bindAdminStatsEvents()
        Analytics()?.track('admin_view')
      }).catch(e => {
        main.innerHTML = `<div class="page"><p>${escapeHtml(e.message)}</p></div>`
      })
    }
  } else if (parts[0] === 'admin' && !parts[1]) {
    main.innerHTML = renderAdminHubPage()
    Analytics()?.track('page_view', { page: 'admin-hub' })
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
    else if (!Perm().can('forum', 'edit')) main.innerHTML = renderPermissionDenied()
    else {
      main.innerHTML = Sections().renderForumNew()
      Sections().bindForumNew()
    }
  } else if (parts[0] === 'forum' && parts[1] === 'post' && parts[2]) {
    Sections().renderForumPostRoute(parts[2])
  } else if (parts[0] === 'forum') {
    Sections().renderForumListRoute()
  } else if (parts[0] === 'doc' && parts[1] && parts[2]) {
    const legacyDoc = {
      'tech-terms': 'industry-terms',
      'business-terms': 'industry-terms-business',
      'access-security': 'industry-terms-security',
    }
    const docId = legacyDoc[parts[2]] || parts[2]
    if (docId !== parts[2]) {
      navigate(`/doc/${parts[1]}/${docId}`)
      return
    }
    const html = window.PDMKnowledgeViews?.renderDoc?.(parts[1], docId)
    main.innerHTML = html || `<div class="page"><p>${escapeHtml(t('common.notFound'))}</p></div>`
    window.PDMKnowledgeViews?.bindModulePage?.()
    Analytics()?.track('page_view', { page: 'kb-doc', id: `${parts[1]}/${docId}` })
  } else if (parts[0] === 'chapter' && parts[1] && parts[2] && parts[3]) {
    const legacyDoc = {
      'tech-terms': 'industry-terms',
      'business-terms': 'industry-terms-business',
      'access-security': 'industry-terms-security',
    }
    const docId = legacyDoc[parts[2]] || parts[2]
    if (docId !== parts[2]) {
      navigate(`/chapter/${parts[1]}/${docId}/${parts[3]}`)
      return
    }
    const html = window.PDMKnowledgeViews?.renderChapter?.(parts[1], docId, decodeURIComponent(parts[3]))
    main.innerHTML = html || `<div class="page"><p>${escapeHtml(t('common.notFound'))}</p></div>`
    Analytics()?.track('page_view', { page: 'kb-chapter', id: `${parts[1]}/${docId}/${parts[3]}` })
  } else if (parts[0] === 'module' && parts[1] && parts[2]) {
    const html = window.PDMKnowledgeViews?.renderModule?.(parts[1], parts[2])
    if (!html) {
      main.innerHTML = `<div class="page"><p>${escapeHtml(t('common.notFound'))}</p><a href="#/category/${parts[1]}">${escapeHtml(t('common.backHome'))}</a></div>`
    } else {
      main.innerHTML = html
      window.PDMKnowledgeViews?.bindModulePage?.()
      Analytics()?.track('page_view', { page: 'kb-module', id: `${parts[1]}/${parts[2]}` })
    }
  } else if (parts[0] === 'category' && parts[1]) {
    const catId = resolveKbCategoryId(parts[1])
    if (catId !== parts[1]) {
      navigate(`/category/${catId}`)
      return
    }
    main.innerHTML = renderCategory(catId)
    window.PDMKnowledgeViews?.bindModulePage?.()
    Analytics()?.track('page_view', { page: 'category', id: catId })
  } else if (parts[0] === 'article' && parts[1] && parts[2]) {
    const catId = resolveKbCategoryId(parts[1])
    if (catId !== parts[1]) {
      navigate(`/article/${catId}/${parts[2]}`)
      return
    }
    main.innerHTML = renderArticle(catId, parts[2])
    bindFavoriteButton()
    bindArticleNotesEvents()
    window.PDMKnowledgeViews?.bindModulePage?.()
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

  if (isMobileViewport()) {
    const meta = getMobilePageMeta(parts)
    if (meta) applyMobilePageChrome(meta.title, meta.backHref)
    requestAnimationFrame(() => syncMobileChromeOffsets())
  }
}

window.addEventListener('hashchange', render)
window.addEventListener('pdm-auth-changed', () => {
  // 登录态变化后立刻刷新顶栏/侧栏，避免仍显示「去登录」
  if (Auth().isLoggedIn() && (location.hash === '#/login' || location.hash === '#login')) {
    navigate('/')
    return
  }
  render()
})

let mobileMqBound = false
function bindMobileViewportWatcher() {
  if (mobileMqBound) return
  mobileMqBound = true
  const mq = window.matchMedia('(max-width: 900px)')
  const onChange = () => {
    const { parts } = parseRoute()
    const path = '/' + parts.join('/')
    renderSidebar(path)
    renderMobileChrome(path)
    syncMobileChromeOffsets()
  }
  if (mq.addEventListener) mq.addEventListener('change', onChange)
  else mq.addListener(onChange)
  window.addEventListener('resize', () => {
    if (isMobileViewport()) syncMobileChromeOffsets()
  })
}

function syncMobileChromeOffsets() {
  if (!isMobileViewport()) {
    document.documentElement.style.removeProperty('--mobile-top-offset')
    document.documentElement.style.removeProperty('--mobile-bottom-offset')
    return
  }
  const topbar = document.getElementById('topbar')
  const bottom = document.getElementById('mobile-bottom-nav')
  const topH = topbar ? Math.ceil(topbar.getBoundingClientRect().height) : 56
  const bottomH = bottom ? Math.ceil(bottom.getBoundingClientRect().height) : 64
  document.documentElement.style.setProperty('--mobile-top-offset', `${topH}px`)
  document.documentElement.style.setProperty('--mobile-bottom-offset', `${bottomH}px`)
}
ensureDefaultHomeHash()
render()
initStorage()
  .then(() => {
    window.PMLabI18n?.init()
    window.PMLabI18n?.onChange(() => render())
    document.title = t('site.title', null, document.title)
    return Auth().init()
  })
  .then(() => Perm().loadRolePermissions?.())
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
      if (location.hash === '#/login' || location.hash === '#login') navigate('/')
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
