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

let copyProtectionBound = false
function isCopyAllowedTarget(target) {
  const el = target?.nodeType === Node.TEXT_NODE ? target.parentElement : target
  if (!el || !el.closest) return false
  return Boolean(el.closest('input, textarea, select, [contenteditable="true"], .allow-copy'))
}

function canCopySiteContent() {
  return Boolean(Auth().isSuperAdmin?.() || Perm().can?.('contentCopy', 'view'))
}

function syncCopyProtectionState() {
  document.body?.classList.toggle('copy-protected', !canCopySiteContent())
}

function bindCopyProtection() {
  if (copyProtectionBound) return
  copyProtectionBound = true
  syncCopyProtectionState()
  const block = (event) => {
    if (canCopySiteContent()) return
    if (isCopyAllowedTarget(event.target)) return
    event.preventDefault()
    showToast(t('common.copyDisabled', null, '\u672c\u7ad9\u5185\u5bb9\u5df2\u7981\u6b62\u590d\u5236'), 'info')
  }
  document.addEventListener('copy', block)
  document.addEventListener('cut', block)
  document.addEventListener('dragstart', block)
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
  saveMobileScrollPosition()
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

function getSafeAvatarText(name, email) {
  const source = String(name || email?.split('@')[0] || 'U').trim()
  const chars = Array.from(source).filter((char) => /[\p{L}\p{N}]/u.test(char))
  if (!chars.length) return 'U'
  const first = chars[0]
  const second = chars.find((char, index) => index > 0 && /[a-z0-9]/i.test(char))
  if (/[\u4e00-\u9fff]/u.test(first)) return first
  return (first + (second || '')).slice(0, 2).toUpperCase()
}

function getUserInitials(email, displayName) {
  return getSafeAvatarText(displayName, email)
}

function getSidebarCollapsed() {
  // Desktop preference only; default expanded. Mobile never writes this key.
  try {
    return localStorage.getItem('pm-lab-sidebar-desktop-collapsed') === '1'
  } catch (_) {
    return false
  }
}

function setSidebarCollapsed(collapsed) {
  const isMobile = window.matchMedia('(max-width: 900px)').matches
  if (!isMobile) {
    try {
      localStorage.setItem('pm-lab-sidebar-desktop-collapsed', collapsed ? '1' : '0')
    } catch (_) {}
  }
  document.documentElement.classList.toggle('sidebar-collapsed', collapsed)
  const btn = document.getElementById('sidebar-collapse-btn')
  if (btn) {
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
    btn.title = collapsed ? t('nav.sidebarExpand') : t('nav.sidebarCollapse')
    btn.setAttribute('aria-label', collapsed ? t('nav.sidebarExpand') : t('nav.sidebarCollapse'))
  }
  // 手机端展开时显示遮罩
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
    el.innerHTML = ''
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
  if (!parts.length) return []
  const kbCrumbs = window.PDMKnowledgeViews?.buildKbCrumbs?.(parts)
  if (kbCrumbs) return kbCrumbs

  const p0 = parts[0]
  if (p0 === 'login') return [{ label: t('auth.pageTitle') }]
  if (p0 === 'account') return [{ label: t('account.profileTitle') }]
  if (p0 === 'reset-password') return [{ label: t('auth.resetTitle') }]
  if (p0 === 'industry') {
    const c = [{ href: '#/industry', label: t('nav.sectionLearning') }]
    const industry = window.PDMIndustry
    const iu = (key, fb) => t(`content.industryUi.${key}`, null, fb)
    if (!parts[1]) return c
    if (parts[1] === 'learning-path') {
      c.push({ href: '#/industry/learning-path', label: iu('sectionPaths', '学习路径') })
      if (parts[2]) {
        const path = industry?.getLearningPath?.(parts[2])
        c.push({ label: path?.title || parts[2] })
      }
      return c
    }
    if (parts[1] === 'basics' || parts[1] === 'sub-roles') {
      const sectionLabel =
        parts[1] === 'basics'
          ? iu('sectionBasics', '基础认知')
          : iu('sectionRoles', '细分岗位')
      c.push({ href: `#/industry/${parts[1]}`, label: sectionLabel })
      if (parts[2] && industry?.getItem) {
        const item = industry.getItem(parts[1], parts[2])
        c.push({ label: item?.title || parts[2] })
      }
      return c
    }
    if (parts[1] === 'overview') {
      const overviewLabel = iu('sectionOverview', '行业概览')
      if (parts[1] === 'overview' && !parts[2]) {
        c.push({ label: overviewLabel })
        return c
      }
      const secId = parts[2]
      const itemId = parts[3]
      c.push({ href: '#/industry/overview', label: overviewLabel })
      if (secId && itemId && industry?.getItem) {
        const item = industry.getItem(secId, itemId)
        c.push({ label: item?.title || itemId })
      }
      return c
    }
    return c
  }
  if (p0 === 'tools') {
    return [{ label: t('nav.tools') }]
  }
  if (p0 === 'forum') {
    const c = [{ href: '#/forum', label: t('nav.forum') }]
    if (parts[1] === 'new') c.push({ label: ui('forumUi', 'newTitle') })
    else if (parts[1] === 'post') c.push({ label: ui('forumUi', 'postBreadcrumb') })
    return c
  }
  if (p0 === 'glossary') return [{ label: t('home.ctaKb') }]
  if (p0 === 'mindmap') return [{ label: t('home.ctaMindmap') }]
  if (p0 === 'personal') {
    return [{ label: t('nav.sectionPersonal') }]
  }
  if (p0 === 'admin' && !parts[1]) {
    return [{ label: t('nav.sectionAdmin') }]
  }
  if (p0 === 'admin' && parts[1] === 'stats') {
    return [
      { href: '#/admin', label: t('nav.sectionAdmin') },
      { label: t('nav.adminStats') },
    ]
  }
  if (p0 === 'favorites') return [{ label: t('nav.favorites') }]
  if (p0 === 'notes') return [{ label: t('nav.articleNotes') }]
  if (p0 === 'my-knowledge') {
    const c = [{ href: '#/my-knowledge', label: t('nav.myKnowledge') }]
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
  if (p0 === 'reviews' || p0 === 'memory') return [{ label: t('nav.reviews') }]
  if (p0 === 'daily-learn') return [{ label: t('nav.dailyLearn') }]
  if (p0 === 'feedback') return [{ label: t('nav.feedback') }]
  if (p0 === 'm') {
    const c = []
    if (parts[1] === 'learn') c.push({ label: t('nav.sectionLearning') })
    else if (parts[1] === 'knowledge') c.push({ label: t('nav.sectionKnowledge') })
    else if (parts[1] === 'personal') c.push({ label: t('nav.sectionPersonal') })
    else if (parts[1] === 'account') c.push({ label: t('mobile.accountTitle') })
    return c
  }
  if (p0 === 'admin') {
    return []
  }
  return []
}

let topbarSearchDocBound = false
const mobileScrollPositions = new Map()
let currentMobileScrollKey = location.hash || '#/'
let mobileScrollButtonBound = false
try {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
} catch (_) {}

function routeScrollKey(hash = location.hash) {
  return hash || '#/'
}

function mobileScrollStorageKey(key) {
  return `pm-lab-mobile-scroll:${key}`
}

const LEARNING_PATH_SOURCE_KEY = 'pm-lab-learning-path-source'
const LEARNING_PATH_SOURCE_TTL = 1000 * 60 * 60 * 2

function normalizeHashHref(href) {
  const raw = String(href || '').trim()
  if (!raw) return '#/'
  if (raw.startsWith('#/')) return raw
  if (raw.startsWith('/')) return `#${raw}`
  if (raw.startsWith('#')) return raw
  return `#/${raw}`
}

function comparableHashHref(href) {
  const normalized = normalizeHashHref(href)
  try {
    return decodeURIComponent(normalized)
  } catch (_) {
    return normalized
  }
}

function saveLearningPathSource(pathId, targetHref = '') {
  const path = window.PDMIndustry?.getLearningPath?.(pathId)
  const href = normalizeHashHref(location.hash || '#/')
  if (!href.startsWith('#/industry/learning-path/')) return
  const y = Math.max(0, window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0)
  const payload = {
    href,
    targetHref: normalizeHashHref(targetHref),
    title: path?.title || t('content.industryUi.pathBreadcrumb', null, '学习路径'),
    y,
    ts: Date.now(),
  }
  try {
    sessionStorage.setItem(LEARNING_PATH_SOURCE_KEY, JSON.stringify(payload))
    sessionStorage.setItem(mobileScrollStorageKey(routeScrollKey(href)), String(y))
  } catch (_) {}
}

function getLearningPathSource() {
  try {
    const raw = sessionStorage.getItem(LEARNING_PATH_SOURCE_KEY)
    if (!raw) return null
    const source = JSON.parse(raw)
    if (!source?.href || !source.href.startsWith('#/industry/learning-path/')) return null
    if (Date.now() - Number(source.ts || 0) > LEARNING_PATH_SOURCE_TTL) {
      sessionStorage.removeItem(LEARNING_PATH_SOURCE_KEY)
      return null
    }
    const current = comparableHashHref(location.hash || '#/')
    if (current === comparableHashHref(source.href)) return null
    if (source.targetHref && current !== comparableHashHref(source.targetHref)) return null
    return source
  } catch (_) {
    return null
  }
}

function clearLearningPathSource() {
  try { sessionStorage.removeItem(LEARNING_PATH_SOURCE_KEY) } catch (_) {}
}

function restoreLearningPathSourceScroll(source) {
  if (!source) return
  const target = Math.max(0, Number(source.y || 0))
  try { sessionStorage.setItem(mobileScrollStorageKey(routeScrollKey(source.href)), String(target)) } catch (_) {}
  const apply = () => window.scrollTo({ top: target, behavior: 'auto' })
  requestAnimationFrame(() => requestAnimationFrame(apply))
  window.setTimeout(apply, 120)
}

function saveMobileScrollPosition(key = currentMobileScrollKey) {
  if (!isMobileViewport()) return
  const y = Math.max(0, window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0)
  mobileScrollPositions.set(key, y)
  try {
    sessionStorage.setItem(mobileScrollStorageKey(key), String(y))
  } catch (_) {}
}

function restoreMobileScrollPosition() {
  if (!isMobileViewport()) return
  const key = routeScrollKey()
  let y = mobileScrollPositions.get(key)
  if (!Number.isFinite(y)) {
    try {
      const stored = Number(sessionStorage.getItem(mobileScrollStorageKey(key)))
      if (Number.isFinite(stored)) y = stored
    } catch (_) {}
  }
  const target = Number.isFinite(y) ? Math.max(0, y) : 0
  const apply = () => {
    window.scrollTo({ top: target, behavior: 'auto' })
    currentMobileScrollKey = key
    syncMobileScrollTopButton()
  }
  requestAnimationFrame(() => requestAnimationFrame(apply))
  window.setTimeout(apply, 120)
}

function syncMobileScrollTopButton() {
  const btn = document.getElementById('mobile-scroll-top')
  if (!btn) return
  const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
  const show = isMobileViewport() && y > 180
  btn.classList.toggle('visible', show)
}

function bindMobileScrollTopButton() {
  const btn = document.getElementById('mobile-scroll-top')
  if (!btn || mobileScrollButtonBound) return
  mobileScrollButtonBound = true
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const key = routeScrollKey()
    mobileScrollPositions.set(key, 0)
    try { sessionStorage.setItem(mobileScrollStorageKey(key), '0') } catch (_) {}
  })
  window.addEventListener('scroll', syncMobileScrollTopButton, { passive: true })
  window.addEventListener('resize', syncMobileScrollTopButton)
}

/** 全站检索：知识库 / 行业认知 / 学习路径 / 工具 / 站点页面 */
function searchSiteContent(query, limit = 10) {
  const q = String(query || '').trim()
  if (!q) return []
  const ql = q.toLowerCase()
  // 过短查询（1 个英文字母）几乎必误匹配，直接要求更明确输入
  if (/^[a-z0-9]$/i.test(q)) return []

  const buckets = [[], [], [], []]

  const pushBucket = (i, hit) => {
    if (buckets[i].some((x) => x.href === hit.href && x.title === hit.title)) return
    buckets[i].push(hit)
  }

  for (const { category, item, source, score } of K.searchKnowledgeMerged(q)) {
    // 丢弃弱相关正文命中
    if ((score || 0) < 200) continue
    const catLabel = source === 'my'
      ? category.title
      : t(`categories.${category.id}.title`, null, category.title)
    pushBucket(0, {
      title: item.title,
      meta: `${catLabel}${source === 'my' ? t('nav.searchSourceMy') : ''}`,
      href:
        source === 'my'
          ? `#/my-knowledge/view/${item.id}`
          : category.id === 'reference'
            ? item.kind === 'mermaid' || item.sourceId === 'mindmap'
              ? '#/mindmap'
              : '#/glossary'
            : `#/article/${category.id}/${item.id}`,
      score: score || 0,
    })
  }

  const industry = window.PDMIndustry
  if (industry?.searchAll) {
    for (const { section, item } of industry.searchAll(q)) {
      pushBucket(1, {
        title: item.title,
        meta: `${t('nav.sectionLearning')} · ${section.title}`,
        href: `#/industry/${section.id}/${item.id}`,
      })
    }
  }
  if (industry?.getLearningPaths) {
    for (const p of industry.getLearningPaths()) {
      const title = String(p.title || '').toLowerCase()
      const summary = String(p.summary || '').toLowerCase()
      if (title.includes(ql) || (ql.length >= 2 && summary.includes(ql))) {
        pushBucket(1, {
          title: p.title,
          meta: `${t('nav.sectionLearning')} · ${t('content.industryUi.pathBreadcrumb', null, '学习路径')}`,
          href: `#/industry/learning-path/${p.id}`,
        })
      }
    }
  }

  const tools = window.PDMTools
  if (tools?.searchTools) {
    for (const tool of tools.searchTools(q)) {
      pushBucket(2, {
        title: tool.name,
        meta: `${t('nav.tools')} · ${tool.categoryTitle}`,
        href: `#/tools?tab=${encodeURIComponent(tool.categoryId)}`,
      })
    }
  }

  const pages = [
    { title: t('nav.home'), meta: t('nav.home'), href: '#/', keys: ['首页', 'home'] },
    { title: t('nav.sectionLearning'), meta: t('nav.sectionLearning'), href: '#/industry', keys: ['学习导航', '行业认知', 'industry'] },
    { title: t('nav.sectionKnowledge'), meta: t('nav.sectionKnowledge'), href: '#/kb', keys: ['知识库', 'knowledge'] },
    { title: t('nav.tools'), meta: t('nav.tools'), href: '#/tools', keys: ['工具库', 'tools'] },
    { title: t('nav.forum'), meta: t('nav.forum'), href: '#/forum', keys: ['论坛', 'forum'] },
    { title: t('nav.dailyLearn'), meta: t('nav.sectionPersonal'), href: '#/daily-learn', keys: ['每日学习', 'daily'] },
    { title: t('nav.favorites'), meta: t('nav.sectionPersonal'), href: '#/favorites', keys: ['收藏', 'favorites'] },
    { title: t('nav.reviews'), meta: t('nav.sectionPersonal'), href: '#/reviews', keys: ['复盘', 'reviews'] },
    { title: t('home.primaryPathTitle', null, '学习主线'), meta: t('nav.sectionLearning'), href: '#/industry/learning-path/kb-4stage', keys: ['学习主线', '主线', '4阶段'] },
  ]
  for (const p of pages) {
    const title = String(p.title || '').toLowerCase()
    // 页面入口：标题包含，或关键字完全相等（避免「学」命中「学习」类过多误报时仍可控）
    const keyHit = (p.keys || []).some((k) => {
      const kk = String(k).toLowerCase()
      return kk === ql || (ql.length >= 2 && kk.includes(ql))
    })
    if (title.includes(ql) || keyHit) {
      pushBucket(3, { title: p.title, meta: p.meta, href: p.href })
    }
  }

  const out = []
  let guard = 0
  while (out.length < limit && guard < limit * 4) {
    let added = false
    for (const bucket of buckets) {
      if (out.length >= limit) break
      if (!bucket.length) continue
      out.push(bucket.shift())
      added = true
    }
    if (!added) break
    guard += 1
  }
  return out
}

function searchKnowledgeOnly(query, limit = 12) {
  const q = String(query || '').trim()
  if (!q || /^[a-z0-9]$/i.test(q)) return []
  const normalizedQuery = q.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '')
  const strictAcronym = /^[a-z0-9]{2}$/i.test(q)
  const results = []
  const seen = new Set()
  for (const { category, item, source, score } of K.searchKnowledgeMerged(q)) {
    if (source !== 'my' && (item.sourceId === 'keyword-index' || item.kind === 'keyword-index')) continue
    if (strictAcronym) {
      const rawTitleTags = `${item.title || ''} ${(item.tags || []).join(' ')}`.toLowerCase()
      const titleTagHay = rawTitleTags.replace(/[^a-z0-9\u4e00-\u9fff]+/g, '')
      const acronymHit =
        rawTitleTags.startsWith(normalizedQuery) ||
        new RegExp(`(^|[^a-z0-9])${normalizedQuery}([^a-z0-9]|$)`, 'i').test(rawTitleTags)
      if (!acronymHit && !titleTagHay.startsWith(normalizedQuery) && (score || 0) < 3600) continue
    }
    const href =
      source === 'my'
        ? `#/my-knowledge/view/${item.id}`
        : `#/article/${category.id}/${encodeURIComponent(item.id)}`
    const key = `${href}:${item.title}`
    if (seen.has(key)) continue
    seen.add(key)
    const catLabel = source === 'my'
      ? category.title
      : t(`categories.${category.id}.title`, null, category.title)
    results.push({
      title: item.title,
      desc: item.summary || item.section || '',
      meta: `${catLabel}${source === 'my' ? t('nav.searchSourceMy') : ''}`,
      href,
      score: score || 0,
      categoryId: category.id,
      itemId: item.id,
    })
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}

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
    const found = searchSiteContent(q, 10)
    if (!found.length) {
      show(`<div class="topbar-search-empty">${escapeHtml(t('nav.searchEmpty'))}</div>`)
      return
    }
    show(found.map((hit) => `
      <button type="button" class="topbar-search-item" data-href="${escapeHtml(hit.href)}">
        <span class="result-title">${escapeHtml(hit.title)}</span>
        <span class="result-meta">${escapeHtml(hit.meta)}</span>
      </button>`).join(''))
    results.querySelectorAll('.topbar-search-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const href = btn.dataset.href || ''
        const path = href.startsWith('#') ? href.slice(1) : href
        navigate(path || '/')
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
  document.getElementById('mobile-bottom-nav')?.addEventListener('click', (e) => {
    const a = e.target.closest('a.mobile-tab[data-tab]')
    if (!a || !isMobileViewport()) return
    const tabId = a.dataset.tab
    const root = MOBILE_TAB_ROOTS[tabId]
    if (!tabId || !root) return
    const { parts } = parseRoute()
    const currentTab = getMobileTab(parts)
    const cur = location.hash || '#/'
    // 已在当前 tab 的深层页：再点一次该 tab → 回到该 tab 根页
    if (tabId === currentTab && cur !== root) {
      e.preventDefault()
      saveMobileTabRoute(tabId, root)
      navigate(root.slice(1) || '/')
    }
  })
}

function renderTopAccount(activePath) {
  const el = document.getElementById('topbar-account')
  if (!el) return

  const menuActive =
    activePath === '/login' ||
    activePath === '/feedback' ||
    activePath === '/notifications' ||
    activePath === '/m/account' ||
    activePath === '/account' ||
    activePath === '/reset-password' ||
    activePath.startsWith('/admin')

  if (Auth().isLoggedIn()) {
    const session = Auth().getSession()
    const profile = Auth().getProfile?.() || null
    const email = session?.user?.email || ''
    const displayName = profile?.display_name?.trim()
    const initials = getUserInitials(email, displayName)
    el.innerHTML = `
    <div class="topbar-account topbar-account-logged-in ${menuActive ? 'active' : ''}">
      <button type="button" class="topbar-account-trigger topbar-account-icon-only" id="topbar-account-menu-btn" aria-label="${escapeHtml(t('nav.accountMenuAria'))}" title="${escapeHtml(email)}">
        <span class="topbar-account-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
      </button>
      <div class="topbar-account-menu" id="topbar-account-menu" hidden>
        <div class="topbar-account-menu-profile">
          <strong>${escapeHtml(displayName || t('account.profileLink'))}</strong>
          <span>${escapeHtml(email)}</span>
        </div>
        <a href="#/account" class="topbar-account-menu-item" data-account-menu-link>${escapeHtml(t('account.profileLink'))}</a>
        <a href="#/notifications" class="topbar-account-menu-item" id="topbar-notification-link" data-account-menu-link>${escapeHtml(t('notifications.menuTitle', null, '消息通知'))}</a>
        <a href="#/feedback" class="topbar-account-menu-item" data-account-menu-link>${escapeHtml(t('nav.feedback'))}</a>
        ${Auth().isSuperAdmin?.() ? `<a href="#/admin" class="topbar-account-menu-item" data-account-menu-link>${escapeHtml(t('nav.sectionAdmin'))}</a>` : ''}
        <button type="button" class="topbar-account-menu-item topbar-account-menu-danger" id="topbar-logout">${escapeHtml(t('nav.logout'))}</button>
      </div>
    </div>`
    return
  }

  el.innerHTML = `
    <div class="topbar-account topbar-account-guest ${menuActive ? 'active' : ''}">
      <button type="button" class="topbar-account-trigger topbar-account-icon-only" id="topbar-account-menu-btn" aria-label="${escapeHtml(t('nav.accountMenuAria'))}" title="${escapeHtml(t('nav.loginRegister'))}">
        <span class="topbar-account-avatar topbar-account-avatar-guest" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="2.5" stroke="currentColor" stroke-width="1.4"/><path d="M3.5 13.5c.8-2.2 2.4-3.3 4.5-3.3s3.7 1.1 4.5 3.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </span>
      </button>
      <div class="topbar-account-menu" id="topbar-account-menu" hidden>
        <a href="#/login" class="topbar-account-menu-item">${escapeHtml(t('nav.loginRegister'))}</a>
        <a href="#/notifications" class="topbar-account-menu-item" id="topbar-notification-link">${escapeHtml(t('notifications.menuTitle', null, '消息通知'))}</a>
        <a href="#/feedback" class="topbar-account-menu-item">${escapeHtml(t('nav.feedback'))}</a>
      </div>
    </div>`
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

function renderTopbarHelp() {
  const btn = document.getElementById('topbar-help-btn')
  if (!btn) return
  const label = t('home.openGuide')
  btn.setAttribute('aria-label', label)
  btn.setAttribute('title', label)
}

function notificationTypeLabel(type) {
  if (type === 'progress') return t('notifications.typeProgress', null, '进度')
  if (type === 'daily') return t('notifications.typeDaily', null, '学习')
  if (type === 'forum') return t('notifications.typeForum', null, '回复')
  return t('notifications.typeSystem', null, '系统')
}

function formatNotificationTime(value) {
  const ts = value ? new Date(value).getTime() : 0
  if (!ts) return ''
  const diff = Math.max(0, Date.now() - ts)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return t('notifications.justNow', null, '刚刚')
  if (diff < hour) return t('notifications.minutesAgo', { count: Math.floor(diff / minute) }, `${Math.floor(diff / minute)} 分钟前`)
  if (diff < day) return t('notifications.hoursAgo', { count: Math.floor(diff / hour) }, `${Math.floor(diff / hour)} 小时前`)
  return new Date(value).toLocaleDateString()
}

function renderTopbarNotifications() {
  const legacyEl = document.getElementById('topbar-notifications')
  if (legacyEl) legacyEl.innerHTML = ''
  const link = document.getElementById('topbar-notification-link')
  const api = window.PDMNotifications
  if (!link || !api) return
  const unread = api.unreadCount()
  const title = t('notifications.menuTitle', null, '消息通知')
  link.textContent = unread ? `${title}（${unread > 99 ? '99+' : unread}）` : title
}

function renderNotificationsPage() {
  const api = window.PDMNotifications
  const items = api?.list?.() || []
  const unread = api?.unreadCount?.() || 0
  const title = t('notifications.menuTitle', null, '消息通知')
  return `
    <div class="page notifications-page">
      <header class="page-hero-block notifications-hero">
        <span class="hero-badge">${escapeHtml(t('notifications.title', null, '通知'))}</span>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(unread ? `你有 ${unread} 条未读消息。` : '学习进度、评论回复和系统提醒都会集中在这里。')}</p>
        <div class="notifications-actions">
          <button type="button" class="btn-ghost" id="notifications-mark-all" ${unread ? '' : 'disabled'}>${escapeHtml(t('notifications.markAllRead', null, '全部已读'))}</button>
          <button type="button" class="btn-ghost" id="notifications-clear-all" ${items.length ? '' : 'disabled'}>${escapeHtml(t('notifications.clearAll', null, '清空'))}</button>
        </div>
      </header>
      <section class="notifications-list-card">
        ${items.length ? `
          <div class="notifications-list">
            ${items.map((item) => `
              <a href="${escapeHtml(item.href || '#/')}" class="notifications-item ${item.readAt ? '' : 'is-unread'}" data-notification-id="${escapeHtml(item.id)}">
                <span class="notifications-kind">${escapeHtml(notificationTypeLabel(item.type))}</span>
                <span class="notifications-copy">
                  <strong>${escapeHtml(item.title)}</strong>
                  ${item.body ? `<small>${escapeHtml(item.body)}</small>` : ''}
                  <time>${escapeHtml(formatNotificationTime(item.createdAt))}</time>
                </span>
              </a>`).join('')}
          </div>` : `
          <div class="notifications-empty">
            <strong>${escapeHtml(t('notifications.empty', null, '暂无通知'))}</strong>
            <span>有新的学习进度、评论回复时，会自动出现在这里。</span>
          </div>`}
      </section>
    </div>`
}

function bindNotificationsPageEvents() {
  const api = window.PDMNotifications
  if (!api) return
  document.querySelectorAll('.notifications-item').forEach((item) => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-notification-id')
      if (id) api.markRead(id)
    })
  })
  document.getElementById('notifications-mark-all')?.addEventListener('click', () => {
    api.markAllRead()
    render()
  })
  document.getElementById('notifications-clear-all')?.addEventListener('click', () => {
    api.clearAll()
    render()
  })
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
      ${Auth().isLoggedIn() ? `
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
      ` : ''}
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
    if (!Auth().isLoggedIn()) {
      showToast(t('feedback.requiredLogin'), 'info')
      return
    }
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

const MOBILE_TAB_ROUTES_KEY = 'pm-lab-mobile-tab-routes'
const MOBILE_TAB_ROOTS = {
  home: '#/',
  learnNav: '#/industry',
  knowledge: '#/m/knowledge',
  tools: '#/tools',
  forum: '#/forum',
  personal: '#/m/personal',
}

function loadMobileTabRoutes() {
  try {
    return JSON.parse(sessionStorage.getItem(MOBILE_TAB_ROUTES_KEY) || '{}') || {}
  } catch {
    return {}
  }
}

function saveMobileTabRoute(tab, hash) {
  if (!tab || !hash) return
  const state = loadMobileTabRoutes()
  const next = hash.startsWith('#') ? hash : `#${hash}`
  if (state[tab] === next) return
  state[tab] = next
  try {
    sessionStorage.setItem(MOBILE_TAB_ROUTES_KEY, JSON.stringify(state))
  } catch (_) {}
}

function getMobileTabHref(tabId) {
  const root = MOBILE_TAB_ROOTS[tabId] || '#/'
  const remembered = loadMobileTabRoutes()[tabId]
  return remembered || root
}

function rememberCurrentMobileTabRoute() {
  if (!isMobileViewport()) return
  const { parts } = parseRoute()
  const tab = getMobileTab(parts)
  saveMobileTabRoute(tab, location.hash || '#/')
}

const MOBILE_TAB_ICONS = {
  home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-5.6H10.2V21H5a1 1 0 0 1-1-1v-9.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  learnNav: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  knowledge: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  tools: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 14.5V8.2L10 4.5l5 3.7v6.3H5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.2 14.5v-3.2h3.6v3.2" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  forum: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="7" cy="9" r="2.2" stroke="currentColor" stroke-width="1.6"/><circle cx="13" cy="9" r="2.2" stroke="currentColor" stroke-width="1.6"/><path d="M3.8 14.5c.7-1.8 2-2.7 3.2-2.7s2.5.9 3.2 2.7M9.8 14.5c.7-1.8 2-2.7 3.2-2.7s2.5.9 3.2 2.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  personal: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 14.4 7.8 16.5l.8-4.7-3.4-3.3 4.7-.7L12 3.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  account: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.2" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 19c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
}

function getMobileTab(parts) {
  const p0 = parts[0] || ''
  if (!p0) return 'home'
  if (p0 === 'm') {
    if (parts[1] === 'learn') return 'learnNav'
    if (parts[1] === 'knowledge') return 'knowledge'
    if (parts[1] === 'personal') return 'personal'
    if (parts[1] === 'account') return 'account'
  }
  if (p0 === 'industry') return 'learnNav'
  if (p0 === 'tools') return 'tools'
  if (p0 === 'forum') return 'forum'
  if (p0 === 'category' || p0 === 'article' || p0 === 'module' || p0 === 'doc' || p0 === 'chapter' || p0 === 'kb' || p0 === 'glossary' || p0 === 'mindmap') return 'knowledge'
  if (p0 === 'personal' || ['favorites', 'notes', 'my-knowledge', 'reviews', 'memory', 'daily-learn'].includes(p0)) return 'personal'
  if (p0 === 'login' || p0 === 'reset-password' || p0 === 'admin' || p0 === 'account' || p0 === 'feedback') return 'account'
  return 'home'
}

function getMobileBackHref(parts) {
  const tab = getMobileTab(parts)
  if (tab === 'learnNav') return '#/industry'
  if (tab === 'knowledge') return '#/m/knowledge'
  if (tab === 'tools') return '#/tools'
  if (tab === 'forum') return '#/forum'
  if (tab === 'personal') return '#/m/personal'
  if (tab === 'account') return '#/m/account'
  return '#/'
}

const ACCOUNT_MENU_ORIGIN_KEY = 'pm-lab-account-menu-origin'

function saveAccountMenuOrigin() {
  const current = location.hash || '#/'
  if (/^#\/(account|notifications|reset-password|feedback|admin|personal|m\/account)/.test(current)) return
  try { sessionStorage.setItem(ACCOUNT_MENU_ORIGIN_KEY, current) } catch (_) {}
}

function getAccountMenuOrigin(fallback = '#/') {
  try {
    const value = sessionStorage.getItem(ACCOUNT_MENU_ORIGIN_KEY)
    if (value && value.startsWith('#/')) return value
  } catch (_) {}
  return fallback
}

function getMobilePageMeta(parts) {
  if (!isMobileViewport()) return null
  if (!parts.length) return null
  if (parts[0] === 'm') return null

  const tabRoot = getMobileBackHref(parts)
  const p0 = parts[0]
  const source = getLearningPathSource()
  const withSource = (meta) => {
    if (!meta || !source) return meta
    return { ...meta, backHref: source.href, sourceBack: true }
  }

  // 底部 Tab 第一层：不插返回条（页面自带 hero）
  if (p0 === 'industry' && !parts[1]) return null
  if (p0 === 'tools') return source ? { title: t('nav.tools'), backHref: source.href, sourceBack: true } : null
  if (p0 === 'forum' && !parts[1]) return source ? { title: t('nav.forum'), backHref: source.href, sourceBack: true } : null
  if (p0 === 'personal' && !parts[1]) return null
  if (p0 === 'kb') return null

  if (p0 === 'industry') {
    let title = t('nav.sectionLearning')
    if (parts[1] === 'basics' && !parts[2]) title = t('content.industryUi.sectionBasics', null, '基础认知')
    else if (parts[1] === 'sub-roles' && !parts[2]) title = t('content.industryUi.sectionRoles', null, '细分岗位')
    else if (parts[1] === 'overview') title = t('content.industryUi.sectionOverview', null, '行业认知')
    else if (parts[1] === 'learning-path' && !parts[2]) title = t('content.industryUi.pathBreadcrumb', null, '学习路径')
    else if (parts[1] === 'learning-path' && parts[2]) {
      const path = window.PDMIndustry?.getLearningPath?.(parts[2])
      title = path?.title || parts[2]
    } else if (parts[2]) {
      const item = window.PDMIndustry?.getItem?.(parts[1], parts[2])
      title = item?.title || parts[2]
    }
    return withSource({ title, backHref: '#/industry' })
  }
  if (p0 === 'forum') {
    const title =
      parts[1] === 'new'
        ? t('content.forumUi.newTitle', null, '发布帖子')
        : t('content.forumUi.postBreadcrumb', null, '帖子')
    return withSource({ title, backHref: '#/forum' })
  }
  if (p0 === 'glossary') return withSource({ title: t('home.ctaKb'), backHref: '#/kb' })
  if (p0 === 'mindmap') return withSource({ title: t('home.ctaMindmap'), backHref: '#/kb' })
  if (p0 === 'notifications') return withSource({ title: t('notifications.menuTitle', null, '消息通知'), backHref: getAccountMenuOrigin('#/') })
  if (p0 === 'module' && parts[1] && parts[2]) {
    const labels = {
      demand: t('kbMod.workflowDemandTitle', null, '需求处理 7 步'),
      prd: t('kbMod.workflowPrdTitle', null, 'PRD 模板'),
      collab: t('kbMod.workflowCollabTitle', null, '跨部门协作'),
      kb: t('kbMod.workflowKbTitle', null, '知识库管理'),
      glossary: t('kbMod.refGlossaryTitle', null, '关键词速查'),
      mindmap: t('kbMod.refMindmapTitle', null, '知识图谱'),
      path: t('kbMod.refPathTitle', null, '学习路径'),
    }
    return withSource({ title: labels[parts[2]] || parts[2], backHref: `#/category/${parts[1]}` })
  }
  if (p0 === 'category' && parts[1]) {
    const cat = K.getCategoryByIdMerged?.(parts[1])
    const label =
      window.PDMKnowledgeViews?.isFlatKbDoc?.(parts[1])
        ? t('nav.sectionKnowledge')
        : (catTitle(cat) || parts[1])
    return withSource({ title: label, backHref: '#/m/knowledge' })
  }
  if (p0 === 'doc' && parts[1] && parts[2]) {
    return withSource({
      title: window.PDMKnowledgeViews?.kbDocLabel?.(parts[1], parts[2]) || parts[2],
      backHref: '#/m/knowledge',
    })
  }
  if (p0 === 'chapter' && parts[1] && parts[2] && parts[3]) {
    return withSource({
      title:
        window.PDMKnowledgeViews?.getChapterLabel?.(parts[1], parts[2], parts[3]) ||
        decodeURIComponent(parts[3]),
      backHref: `#/doc/${parts[1]}/${parts[2]}`,
    })
  }
  if (p0 === 'article' && parts[1] && parts[2]) {
    const item = K.getItemByIdMerged?.(parts[1], parts[2])
    const title = window.PDMKnowledgeViews?.stripLeadingIndex?.(item?.title) || item?.title || t('nav.sectionKnowledge')
    const trail = window.PDMKnowledgeViews?.resolveArticleTrail?.(parts[1], parts[2])
    let backHref = '#/m/knowledge'
    if (trail?.doc) {
      backHref = `#/doc/${parts[1]}/${trail.doc.id}`
    } else if (parts[1] === 'workflow' || parts[1] === 'reference') {
      backHref = `#/category/${parts[1]}`
    }
    return withSource({ title, backHref })
  }
  if (p0 === 'favorites') return withSource({ title: t('nav.favorites'), backHref: tabRoot })
  if (p0 === 'notes') return withSource({ title: t('nav.articleNotes'), backHref: tabRoot })
  if (p0 === 'my-knowledge') return withSource({ title: t('nav.myKnowledge'), backHref: tabRoot })
  if (p0 === 'reviews' || p0 === 'memory') return withSource({ title: t('nav.reviews'), backHref: tabRoot })
  if (p0 === 'daily-learn') return withSource({ title: t('nav.dailyLearn'), backHref: tabRoot })
  if (p0 === 'feedback') return withSource({ title: t('nav.feedback'), backHref: getAccountMenuOrigin('#/m/account') })
  if (p0 === 'login') return withSource({ title: t('auth.pageTitle'), backHref: '#/m/account' })
  if (p0 === 'account') return withSource({ title: t('account.profileTitle'), backHref: getAccountMenuOrigin('#/m/account') })
  if (p0 === 'reset-password') return withSource({ title: t('auth.resetTitle'), backHref: getAccountMenuOrigin('#/m/account') })
  if (p0 === 'admin') {
    const backHref = getAccountMenuOrigin('#/m/account')
    if (parts[1] === 'knowledge') return withSource({ title: t('nav.adminKnowledge'), backHref })
    if (parts[1] === 'accounts' || parts[1] === 'permissions') return withSource({ title: t('nav.adminAccounts'), backHref })
    if (parts[1] === 'roles') return withSource({ title: t('nav.adminRoles'), backHref })
    if (parts[1] === 'feedback') return withSource({ title: t('nav.adminFeedback'), backHref })
    return withSource({ title: t('nav.adminStats'), backHref })
  }
  return null
}

function renderMobilePageHead(title, backHref, sourceBack = false) {
  const back = backHref
    ? `<a href="${backHref}" class="mobile-back-btn" ${sourceBack ? 'data-learning-source-back="1"' : ''} aria-label="${escapeHtml(t('common.back'))}">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>${escapeHtml(t('common.back'))}</span>
      </a>`
    : ''
  return `
    <header class="mobile-page-head">
      ${back}
      <h1 class="mobile-page-title">${escapeHtml(title || '')}</h1>
    </header>`
}

function applyMobilePageChrome(title, backHref, sourceBack = false) {
  if (!isMobileViewport()) return
  const main = document.getElementById('main')
  if (!main) return
  if (main.querySelector('.mobile-page-head')) return
  main.insertAdjacentHTML('afterbegin', renderMobilePageHead(title, backHref, sourceBack))
  main.querySelector('.mobile-back-btn')?.addEventListener('click', () => {
    saveMobileScrollPosition()
    if (main.querySelector('.mobile-back-btn')?.dataset.learningSourceBack === '1') {
      restoreLearningPathSourceScroll(getLearningPathSource())
    }
  })
}

function ensureMobilePageChromeForCurrentRoute() {
  if (!isMobileViewport()) return
  const main = document.getElementById('main')
  if (!main) return
  const { parts } = parseRoute()
  const meta = getMobilePageMeta(parts)
  if (!meta) {
    main.querySelector('.mobile-page-head')?.remove()
    return
  }
  const existing = main.querySelector('.mobile-page-head')
  if (existing) return
  applyMobilePageChrome(meta.title, meta.backHref, Boolean(meta.sourceBack))
}

let mobileMainObserver = null
function ensureMobileMainObserver() {
  const main = document.getElementById('main')
  if (!main) return
  if (mobileMainObserver) return
  mobileMainObserver = new MutationObserver(() => {
    if (!isMobileViewport()) return
    ensureMobilePageChromeForCurrentRoute()
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

/** 一级入口页：二级功能卡片（知识库 / 我的空间 / 管理后台） */
function renderSectionCardHub({ title, desc, eyebrow, cards, actionsHtml = '', beforeGridHtml = '', extraHtml = '', pageClass = '' }) {
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
    <div class="page sec-hub-page ${escapeHtml(pageClass)}">
      <header class="sec-hub-hero">
        ${eyebrow ? `<p class="sec-hub-eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
        <h1>${escapeHtml(title)}</h1>
        ${desc ? `<p class="sec-hub-desc">${escapeHtml(desc)}</p>` : ''}
        ${actionsHtml ? `<div class="hero-actions" style="margin-top:16px">${actionsHtml}</div>` : ''}
      </header>
      ${beforeGridHtml}
      ${grid}
      ${extraHtml}
    </div>`
}

function buildKnowledgeNavItems() {
  const can = (id) => Perm().can(id)
  const items = []
  const flat = window.PDMKnowledgeViews?.getFlatKbNavEntries?.() || []
  for (const entry of flat) {
    if (!can(entry.catId)) continue
    items.push({
      href: entry.href,
      title: entry.title,
      catId: entry.catId,
      docId: entry.docId,
    })
  }
  for (const c of K.getMergedCategories?.() || []) {
    if (!can(c.id)) continue
    if (c.id === 'workflow') {
      items.push({ href: `#/category/${c.id}`, title: catTitle(c), catId: c.id, docId: null })
    }
  }
  items.sort((a, b) => {
    if (a.docId === 'career-playbook') return 1
    if (b.docId === 'career-playbook') return -1
    return 0
  })
  return items
}

function isKnowledgeNavItemActive(activePath, item) {
  const hrefPath = (item.href || '').replace(/^#/, '')
  if (activePath === hrefPath || activePath.startsWith(`${hrefPath}/`)) return true
  if (item.docId) {
    return (
      activePath.includes(`/doc/${item.catId}/${item.docId}`) ||
      activePath.includes(`/chapter/${item.catId}/${item.docId}/`) ||
      (activePath.includes(`/article/${item.catId}/`) && activePath.includes(`/module/${item.catId}/`) === false)
    )
  }
  if (item.catId === 'workflow' || item.catId === 'reference') {
    return activePath.includes(`/category/${item.catId}`) || activePath.includes(`/module/${item.catId}/`)
  }
  return false
}

function getKnowledgeHubCards() {
  const can = (id) => Perm().can(id)
  return buildKnowledgeNavItems()
    .filter((item) => can(item.catId))
    .map((item) => {
      const cat = K.getCategoryByIdMerged(item.catId)
      const doc = item.docId ? window.PDMKnowledgeViews?.getDoc?.(item.catId, item.docId) : null
      let topicCount = cat?.items?.length || 0
      if (item.docId && doc && window.PDMKnowledgeViews) {
        const chapters = window.PDMKnowledgeViews.getDocChapters?.(item.catId, item.docId)
          || []
        topicCount = chapters.reduce((n, ch) => n + (ch.count || ch.items?.length || (ch.isArticle ? 1 : 0)), 0)
        if (!topicCount && chapters.length) topicCount = chapters.length
      }
      return {
        href: item.href,
        title: item.title,
        desc: doc?.desc || catDesc(cat),
        meta: t('home.itemCount', { n: topicCount }),
      }
    })
}

window.PDMKnowledgeNav = {
  buildItems: buildKnowledgeNavItems,
  getCards: getKnowledgeHubCards,
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
    { href: '#/admin/feedback', title: t('nav.adminFeedback'), desc: t('kbMod.adminFeedbackCardDesc') },
  ]
}

function renderKnowledgeHubPage() {
  const cards = getKnowledgeHubCards()
  return `
    <div class="page kb-home-page">
      <header class="kb-home-hero">
        <p class="kb-home-eyebrow">${escapeHtml(t('nav.sectionKnowledge'))}</p>
        <div class="kb-home-hero-main">
          <div>
            <h1>${escapeHtml(t('kbMod.kbHomePickTitle', null, '\u9009\u62e9\u5b66\u4e60\u4e3b\u9898'))}</h1>
            <p>${escapeHtml(t('kbMod.kbHomePickDesc', null, '\u5355\u77e5\u8bc6\u70b9\u5361\u7247\u5f0f\u9605\u8bfb\uff1b\u7cfb\u7edf\u5b66\u4e60\u8bf7\u4ece\u9996\u9875\u300c\u5b66\u4e60\u4e3b\u7ebf\u300d\u5f00\u59cb'))}</p>
          </div>
          <div class="kb-home-quick-actions">
            <a href="#/glossary" class="btn-ghost">${escapeHtml(t('kbMod.refGlossaryTitle', null, '\u77e5\u8bc6\u901f\u67e5'))}</a>
            <a href="#/mindmap" class="btn-ghost">${escapeHtml(t('kbMod.refMindmapTitle', null, '\u77e5\u8bc6\u56fe\u8c31'))}</a>
          </div>
        </div>
      </header>

      <section class="kb-home-toolbar" aria-label="${escapeHtml(t('kbMod.innerSearchTitle', null, '\u77e5\u8bc6\u5e93\u641c\u7d22'))}">
        <div class="kb-inner-search-box">
          <span aria-hidden="true">/</span>
          <input type="search" id="kb-inner-search-input" placeholder="${escapeHtml(t('kbMod.innerSearchPlaceholder', null, 'KANO / PRD / SSO'))}" autocomplete="off" />
          <button type="button" class="btn-primary" id="kb-inner-search-go">${escapeHtml(t('common.search', null, '\u641c\u7d22'))}</button>
        </div>
        <div class="kb-home-toolbar-hint">${escapeHtml(t('kbMod.innerSearchHint', null, '\u641c\u7d22\u4ec5\u5339\u914d\u77e5\u8bc6\u70b9\uff0c\u70b9\u51fb\u7ed3\u679c\u76f4\u8fbe\u77e5\u8bc6\u5361\u7247'))}</div>
      </section>
      <section class="kb-inner-search-results" id="kb-inner-search-results" hidden></section>

      <section class="kb-home-topic-grid" id="kb-home-topic-grid">
        ${cards.map((c, i) => `
          <a href="${c.href}" class="kb-home-topic-card" data-kb-cat="${escapeHtml(c.catId || '')}" data-kb-topic="${escapeHtml((c.title + ' ' + (c.desc || '') + ' ' + (c.meta || '')).toLowerCase())}">
            <span class="kb-home-topic-index">${String(i + 1).padStart(2, '0')}</span>
            <span class="kb-home-topic-copy">
              <strong>${escapeHtml(c.title)}</strong>
              ${c.desc ? `<em>${escapeHtml(c.desc)}</em>` : ''}
              ${c.meta ? `<small>${escapeHtml(c.meta)}</small>` : ''}
            </span>
            <span class="kb-home-topic-arrow" aria-hidden="true">&rarr;</span>
          </a>`).join('')}
      </section>
    </div>`
}
function bindKnowledgeHubEvents() {
  const input = document.getElementById('kb-inner-search-input')
  const go = document.getElementById('kb-inner-search-go')
  const results = document.getElementById('kb-inner-search-results')
  const grid = document.getElementById('kb-home-topic-grid')
  if (!input || !go || !results) return

  const hide = () => results.setAttribute('hidden', '')
  const show = (html) => {
    results.innerHTML = html
    results.removeAttribute('hidden')
  }
  const filterTopics = (q, found = []) => {
    if (!grid) return
    const cards = [...grid.querySelectorAll('.kb-home-topic-card')]
    const hitCats = new Set(found.map((hit) => hit.categoryId).filter(Boolean))
    for (const card of cards) {
      const hay = card.getAttribute('data-kb-topic') || ''
      const cat = card.getAttribute('data-kb-cat') || ''
      const related = hitCats.has(cat) || hay.includes(q.toLowerCase())
      card.hidden = Boolean(q) && found.length > 0 && !related
      card.classList.toggle('is-search-related', Boolean(q) && related)
    }
    grid.classList.toggle('is-filtering', Boolean(q))
  }
  const paint = () => {
    const q = input.value.trim()
    if (!q) {
      filterTopics('', [])
      hide()
      return
    }
    const found = searchKnowledgeOnly(q, 12)
    filterTopics(q, found)
    if (!found.length) {
      show(`<div class="kb-inner-search-empty">${escapeHtml(t('nav.searchEmpty'))}</div>`)
      return
    }
    show(`
      <div class="kb-inner-search-head">
        <strong>${escapeHtml(t('kbMod.innerSearchResults', null, '\u5339\u914d\u7684\u77e5\u8bc6\u5361\u7247'))}</strong>
        <span>${escapeHtml(t('home.itemCount', { n: found.length }, `${found.length} \u4e2a`))}</span>
      </div>
      <div class="kb-inner-search-list">
        ${found.map((hit) => `
          <a href="${escapeHtml(hit.href)}" class="kb-inner-search-item">
            <strong>${escapeHtml(hit.title)}</strong>
            ${hit.desc ? `<span>${escapeHtml(hit.desc)}</span>` : ''}
            <small>${escapeHtml(hit.meta)}</small>
          </a>`).join('')}
      </div>`)
  }

  go.addEventListener('click', paint)
  input.addEventListener('input', paint)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hide()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const first = results.querySelector('.kb-inner-search-item')
      if (first && !results.hasAttribute('hidden')) first.click()
      else paint()
    }
  })
}

function renderPersonalHubPage() {
  const loggedIn = Auth().isLoggedIn()
  return renderSectionCardHub({
    eyebrow: t('nav.sectionPersonal'),
    title: t('kbMod.personalHubTitle', null, '我的空间'),
    desc: loggedIn
      ? t('mobile.personalHubDescLoggedIn', null, '收藏、笔记、个人知识库与复盘，都在这里。')
      : t('auth.personalGateDesc'),
    cards: getPersonalHubCards(),
    actionsHtml: loggedIn
      ? ''
      : `<a href="#/login" class="btn-primary">${escapeHtml(t('auth.personalGateCta'))}</a>`,
    pageClass: 'personal-hub-page',
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
  return buildKnowledgeNavItems().map((item) => {
    const cat = K.getCategoryByIdMerged(item.catId)
    return {
      href: item.href,
      title: item.title,
      desc: item.docId
        ? (window.PDMKnowledgeViews?.getDoc?.(item.catId, item.docId)?.desc || catDesc(cat))
        : catDesc(cat),
      meta: cat ? catTitle(cat) : '',
    }
  })
}

function getMobilePersonalItems() {
  const can = (id) => Perm().can(id)
  return [
    { id: 'favorites', href: '#/favorites', title: t('nav.favorites'), desc: t('mobile.personalFavoritesDesc') },
    { id: 'notes', href: '#/notes', title: t('nav.articleNotes'), desc: t('mobile.personalNotesDesc') },
    { id: 'myKnowledge', href: '#/my-knowledge', title: t('nav.myKnowledge'), desc: t('mobile.personalMyKnowledgeDesc') },
    { id: 'reviews', href: '#/reviews', title: t('nav.reviews'), desc: t('mobile.personalReviewsDesc') },
    { id: 'dailyLearn', href: '#/daily-learn', title: t('nav.dailyLearn'), desc: t('mobile.personalDailyDesc'), needLogin: true },
  ].filter((x) => {
    if (x.needLogin && !Auth().isLoggedIn()) return false
    return can(x.id)
  })
}

function renderMobileLearnHub() {
  return renderSectionCardHub({
    eyebrow: t('nav.sectionLearning'),
    title: t('nav.sectionLearning'),
    desc: t('mobile.learnHubDesc'),
    cards: getMobileLearnItems().map((x) => ({
      href: x.href,
      title: x.title,
      desc: x.desc,
    })),
  })
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

function renderPasswordInlineForm() {
  const configured = Auth().isConfigured()
  return `
    <section class="account-nickname-card account-password-card">
      <div class="account-nickname-head">
        <h2>${escapeHtml(t('auth.resetTitle'))}</h2>
        <p>${escapeHtml(t('auth.resetDesc'))}</p>
      </div>
      ${!configured ? `<p class="auth-warn">${escapeHtml(t('auth.notConfigured'))}</p>` : ''}
      <label class="account-nickname-field">
        <span>${escapeHtml(t('auth.newPassword'))}</span>
        <input id="auth-new-password" class="account-nickname-input" type="password" autocomplete="new-password" placeholder="${escapeHtml(t('auth.passwordPlaceholder'))}" minlength="6" />
      </label>
      <div class="account-nickname-actions">
        <button type="button" class="btn-primary" id="auth-update-password" ${configured ? '' : 'disabled'}>${escapeHtml(t('auth.savePassword'))}</button>
      </div>
    </section>`
}

function accountInitial(name, email) {
  return getSafeAvatarText(name, email)
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

function bindAccountProfileActions() {
  bindNicknameForm()
  bindResetPasswordEvents()
  document.getElementById('account-profile-logout')?.addEventListener('click', async () => {
    await Auth().signOut()
    showToast(t('auth.toastLoggedOut'), 'info')
    navigate('/')
  })
}

function renderAccountProfilePage() {
  if (!Auth().isLoggedIn()) {
    return renderLoginRequired(t('auth.requiredDefault'))
  }
  const session = Auth().getSession?.()
  const email = session?.user?.email || ''
  const profile = Auth().getProfile?.()
  const name = profile?.display_name?.trim() || ''
  const initial = accountInitial(name, email)
  return `
    <div class="page account-profile-page">
      <header class="memory-header">
        <h1>${escapeHtml(t('account.profileTitle'))}</h1>
        <p>${escapeHtml(t('account.profileDesc'))}</p>
      </header>
      <section class="account-overview-panel">
        <div class="account-overview-id">
          <span class="account-overview-avatar" aria-hidden="true">${escapeHtml(initial)}</span>
          <div>
            <strong>${escapeHtml(name || email || t('account.profileTitle'))}</strong>
            ${email ? `<span>${escapeHtml(email)}</span>` : ''}
          </div>
        </div>
        <div class="account-overview-grid">
          ${renderNicknameForm(profile, email)}
          ${renderPasswordInlineForm()}
        </div>
        <button type="button" class="btn-secondary account-overview-logout" id="account-profile-logout">${escapeHtml(t('nav.logout'))}</button>
      </section>
    </div>`
}

function renderMobileAccountHub() {
  // 未登录：账号 Tab 直接展示登录/注册
  if (!Auth().isLoggedIn()) {
    return renderLoginPage()
  }

  const session = Auth().getSession?.()
  const email = session?.user?.email || ''
  const profile = Auth().getProfile?.()
  const name = profile?.display_name?.trim() || ''
  const showName = name || email || t('mobile.accountTitle')
  const initial = accountInitial(name, email)

  return `
    <div class="page mobile-hub-page mobile-account-page">
      <header class="mobile-account-head">
        <h1>${escapeHtml(t('account.profileTitle'))}</h1>
      </header>
      <section class="mobile-profile-card">
        <div class="mobile-profile-top">
          <span class="mobile-profile-avatar" aria-hidden="true">${escapeHtml(initial)}</span>
          <div class="mobile-profile-who">
            <strong>${escapeHtml(showName)}</strong>
            ${email ? `<span>${escapeHtml(email)}</span>` : ''}
          </div>
        </div>
        <div class="mobile-profile-fields">
          <label class="mobile-profile-field">
            <span>${escapeHtml(t('account.nicknameLabel'))}</span>
            <div class="mobile-profile-nickname-row">
              <input type="text" id="account-nickname-input" class="account-nickname-input" maxlength="32" value="${escapeHtml(name)}" placeholder="${escapeHtml(t('account.nicknamePlaceholder'))}" autocomplete="nickname" />
              <button type="button" class="btn-primary btn-sm" id="account-nickname-save">${escapeHtml(t('account.nicknameSave'))}</button>
            </div>
          </label>
          <div class="mobile-profile-field">
            <span>${escapeHtml(t('account.emailLabel'))}</span>
            <p class="mobile-profile-account">${escapeHtml(email || '—')}</p>
          </div>
        </div>
        <div class="mobile-profile-fields mobile-profile-password">
          <label class="mobile-profile-field">
            <span>${escapeHtml(t('auth.newPassword'))}</span>
            <div class="mobile-profile-nickname-row">
              <input id="auth-new-password" class="account-nickname-input" type="password" autocomplete="new-password" placeholder="${escapeHtml(t('auth.passwordPlaceholder'))}" minlength="6" />
              <button type="button" class="btn-primary btn-sm" id="auth-update-password" ${Auth().isConfigured() ? '' : 'disabled'}>${escapeHtml(t('auth.savePassword'))}</button>
            </div>
          </label>
        </div>
        <button type="button" class="btn-secondary mobile-profile-logout" id="mobile-account-logout">${escapeHtml(t('nav.logout'))}</button>
      </section>
      ${Perm().can('feedback') ? `
        <a href="#/feedback" class="mobile-account-action-link">
          <span>${escapeHtml(t('nav.feedback'))}</span>
          <span aria-hidden="true">→</span>
        </a>` : ''}
      ${Auth().isSuperAdmin?.() ? `
        <a href="#/admin" class="mobile-account-action-link mobile-account-admin-link">
          <span>${escapeHtml(t('nav.sectionAdmin'))}</span>
          <span aria-hidden="true">→</span>
        </a>` : ''}
    </div>`
}

function bindMobileAccountHub() {
  if (!Auth().isLoggedIn()) {
    bindLoginEvents()
    return
  }
  bindNicknameForm()
  bindResetPasswordEvents()
  document.getElementById('mobile-account-logout')?.addEventListener('click', async () => {
    await Auth().signOut()
    showToast(t('auth.toastLoggedOut'), 'info')
    navigate('/m/account')
  })
}

function getMobileTabItems() {
  const can = (id) => Perm().can(id)
  return [
    { id: 'home', label: t('nav.home'), icon: MOBILE_TAB_ICONS.home, enabled: true },
    { id: 'learnNav', label: t('mobile.tabLearnNav'), icon: MOBILE_TAB_ICONS.learnNav, enabled: can('industry') },
    { id: 'knowledge', label: t('mobile.tabKnowledge'), icon: MOBILE_TAB_ICONS.knowledge, enabled: true },
    { id: 'tools', label: t('mobile.tabTools'), icon: MOBILE_TAB_ICONS.tools, enabled: can('tools') },
    { id: 'forum', label: t('mobile.tabForum'), icon: MOBILE_TAB_ICONS.forum, enabled: can('forum') },
    { id: 'personal', label: t('mobile.tabPersonal'), icon: MOBILE_TAB_ICONS.personal, enabled: true },
  ].filter((item) => item.enabled)
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
  ensureMobilePageChromeForCurrentRoute()

  const { parts } = parseRoute()
  const tab = getMobileTab(parts)
  const tabs = getMobileTabItems()

  bottomEl.innerHTML = `
    <div class="mobile-tabbar" role="tablist" style="--mobile-tab-count:${tabs.length}">
      ${tabs
        .map((item) => {
          const href = getMobileTabHref(item.id)
          const active = tab === item.id
          return `
                <a href="${href}" class="mobile-tab ${active ? 'active' : ''}" role="tab" aria-selected="${active}" data-tab="${item.id}" title="${escapeHtml(item.label)}">
          <span class="mobile-tab-icon" aria-hidden="true">${item.icon}</span>
          <span class="mobile-tab-label">${escapeHtml(item.label)}</span>
        </a>`
        })
        .join('')}
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
    activePath === '/glossary' ||
    activePath === '/mindmap' ||
    activePath.startsWith('/m/knowledge')
  const personalActive =
    activePath === '/personal' ||
    activePath.startsWith('/personal/') ||
    ['/favorites', '/notes', '/my-knowledge', '/reviews', '/memory', '/daily-learn'].some(
      (p) => activePath === p || activePath.startsWith(`${p}/`),
    ) ||
    activePath.startsWith('/m/personal')
  const adminActive = activePath.startsWith('/admin')

  const kbOpen = isNavExpanded('kb', kbActive || true)
  const personalOpen = isNavExpanded('personal', personalActive || true)
  const adminOpen = isNavExpanded('admin', adminActive || true)

  const knowledgeTree = buildKnowledgeNavItems()
    .map((item) => {
      const active = isKnowledgeNavItemActive(activePath, item)
      return renderNavL2Link(item.href, item.title, active)
    })
    .join('')

  const personalLinks = [
    can('favorites') && { href: '#/favorites', title: t('nav.favorites'), active: activePath === '/favorites' },
    can('notes') && { href: '#/notes', title: t('nav.articleNotes'), active: activePath === '/notes' },
    can('myKnowledge') && { href: '#/my-knowledge', title: t('nav.myKnowledge'), active: activePath.includes('/my-knowledge') },
    can('reviews') && { href: '#/reviews', title: t('nav.reviews'), active: activePath === '/reviews' || activePath === '/memory' },
    Auth().isLoggedIn() && can('dailyLearn') && { href: '#/daily-learn', title: t('nav.dailyLearn'), active: activePath === '/daily-learn' },
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
        ${can('industry') ? `<a href="#/industry" class="nav-item nav-item-l1 ${activePath.includes('/industry') ? 'active' : ''}" title="${escapeHtml(t('nav.sectionLearning'))}">
          ${navIcon('industry')}
          <span class="nav-title">${escapeHtml(t('nav.sectionLearning'))}</span>
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

        ${can('tools') ? `<a href="#/tools" class="nav-item nav-item-l1 ${activePath.includes('/tools') ? 'active' : ''}" title="${escapeHtml(t('nav.tools'))}">
          ${navIcon('tools')}
          <span class="nav-title">${escapeHtml(t('nav.tools'))}</span>
        </a>` : ''}
        ${can('forum') ? `<a href="#/forum" class="nav-item nav-item-l1 ${activePath.includes('/forum') ? 'active' : ''}" title="${escapeHtml(t('nav.forum'))}">
          ${navIcon('forum')}
          <span class="nav-title">${escapeHtml(t('nav.forum'))}</span>
        </a>` : ''}

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

function renderHomeDashboard({ total, pathProgress, pathHref }) {
  const pushSettings = DailyPush()?.getSettings?.()
  const cards = [
    {
      label: t('home.dashNext'),
      value: pushSettings?.enabled ? t('home.dashPushTime', { time: pushSettings.time || '09:00' }) : t('home.dashPushOff'),
      desc: pushSettings?.lastPushItems?.length
        ? t('home.dashPushReady', { n: pushSettings.lastPushItems.length })
        : t('home.dashPushDesc'),
      href: '#/daily-learn',
    },
    {
      label: t('home.dashProgress'),
      value: pathProgress?.total ? `${pathProgress.done}/${pathProgress.total}` : t('home.dashProgressEmpty'),
      desc: t('home.dashProgressDesc'),
      href: pathHref,
    },
    {
      label: t('home.dashKnowledge'),
      value: t('home.metaTopics', { n: total }),
      desc: t('home.dashKnowledgeDesc'),
      href: '#/kb',
    },
  ]

  return `
    <div class="home-dashboard" aria-label="${escapeHtml(t('home.dashLabel'))}">
      ${cards
        .map(
          (card) => `
        <a href="${card.href}" class="home-dash-card">
          <span class="home-dash-label">${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
          <span>${escapeHtml(card.desc)}</span>
        </a>`,
        )
        .join('')}
    </div>`
}

function renderHome() {
  const stats = K.getKnowledgeStats?.() || { totalCount: 0 }
  const path = window.PDMIndustry?.getRecommendedPath?.()
  const cats = K.getMergedCategories()
  const knowledgeNavItems = buildKnowledgeNavItems()
  const total = stats.totalCount || cats.reduce((s, c) => s + c.items.length, 0)
  const topicCount = knowledgeNavItems.length || stats.categoryCount || cats.length
  const pathHref = path ? `#/industry/learning-path/${path.id}` : '#/industry/learning-path'
  const pathProgress = path ? window.PDMStorage?.countPathProgress?.(path) : null
  const heroTitle = t('home.heroTitle')

  const lookupCards = [
    {
      href: '#/kb',
      title: t('home.lookupTopicsTitle'),
      desc: t('home.lookupTopicsDesc', { n: topicCount }),
    },
    {
      href: '#/glossary',
      title: t('home.lookupGlossaryTitle'),
      desc: t('home.lookupGlossaryDesc'),
    },
    {
      href: '#/mindmap',
      title: t('home.lookupMapTitle'),
      desc: t('home.lookupMapDesc'),
    },
  ]

  const learningLinks = [
    { href: pathHref, title: t('home.primaryPathTitle'), featured: true },
    { href: '#/industry/learning-path/newcomer-8w', title: t('home.sceneNewcomerShort', null, '新人') },
    { href: '#/industry/learning-path/job-hunt', title: t('home.sceneJobShort', null, '求职') },
    { href: '#/industry/learning-path/intern', title: t('home.sceneInternShort', null, '实习') },
    { href: '#/industry/learning-path/career-switch', title: t('home.sceneSwitchShort', null, '转行') },
  ]

  const guideSteps = [
    { num: '01', title: t('home.guideStep1Title'), desc: t('home.guideStep1Desc'), href: '#/industry/basics' },
    { num: '02', title: t('home.guideStep2Title'), desc: t('home.guideStep2Desc'), href: pathHref },
    { num: '03', title: t('home.guideStep3Title'), desc: t('home.guideStep3Desc'), href: '#/kb' },
    { num: '04', title: t('home.guideStep4Title'), desc: t('home.guideStep4Desc'), href: pathHref },
    { num: '05', title: t('home.guideStep5Title'), desc: t('home.guideStep5Desc'), href: '#/industry/learning-path' },
  ]

  return `
    <div class="page home-page home-codex">
      <section class="home-stage">
        <div class="home-stage-glow" aria-hidden="true"></div>
        <p class="home-stage-kicker">${escapeHtml(t('home.audienceBadge'))}</p>
        <h1 class="home-stage-title">
          <span class="home-stage-brand">PM Lab</span>
        </h1>
        ${heroTitle ? `<p class="home-stage-line">${escapeHtml(heroTitle)}</p>` : ''}
        <p class="home-stage-sub">${escapeHtml(t('home.heroSubtitle'))}</p>

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
          <span>${escapeHtml(t('home.metaKbHubs', { n: topicCount }))}</span>
          <span class="dot">·</span>
          <span>${escapeHtml(t('home.metaTopics', { n: total }))}</span>
        </div>
      </section>

      <section class="home-section home-entry-section home-lookup-section">
        <div class="home-entry-bar home-entry-bar-primary">
          <div class="home-entry-copy">
            <h2>${escapeHtml(t('home.lookupTitle'))}</h2>
            <p>${escapeHtml(t('home.lookupDesc'))}</p>
          </div>
          <div class="home-entry-pills">
            ${lookupCards
              .map(
                (card) => `
              <a href="${card.href}" class="home-entry-pill" title="${escapeHtml(card.desc)}">${escapeHtml(card.title)}</a>`,
              )
              .join('')}
          </div>
        </div>
      </section>

      <section class="home-section home-entry-section home-learning-section" id="home-scenarios">
        <div class="home-entry-bar home-entry-bar-secondary">
          <div class="home-entry-copy">
            <h2>${escapeHtml(t('home.learningTitle', null, '学习路径'))}</h2>
            <p>${escapeHtml(t('home.learningDesc', null, '默认从学习主线开始；有明确目标时选择对应计划。'))}</p>
            ${pathProgress?.total ? `<em>${escapeHtml(t('home.pathProgress', { done: pathProgress.done, total: pathProgress.total }))}</em>` : ''}
          </div>
          <div class="home-entry-pills home-entry-pills-learning">
            ${learningLinks
              .map(
                (item) => `
              <a href="${item.href}" class="home-entry-pill ${item.featured ? 'home-entry-pill-featured' : ''}">${escapeHtml(item.title)}</a>`,
              )
              .join('')}
          </div>
        </div>
      </section>

      <section class="home-section home-about-section home-section-last">
        <div class="home-about-card">
          <p class="home-about-eyebrow">${escapeHtml(t('home.aboutEyebrow'))}</p>
          <h2>${escapeHtml(t('home.aboutTitle'))}</h2>
          <p>${escapeHtml(t('home.aboutDesc'))}</p>
          <p class="home-about-maintainer">${(() => {
            const email = t('home.aboutContactEmail')
            const line = t('home.aboutMaintainer')
            const safe = escapeHtml(line)
            const safeEmail = escapeHtml(email)
            return safe.includes(safeEmail)
              ? safe.replace(safeEmail, `<a href="mailto:${safeEmail}" class="home-about-contact"><strong>${safeEmail}</strong></a>`)
              : safe
          })()}</p>
        </div>
      </section>

      <div class="home-onboarding" id="home-onboarding" hidden>
        <div class="home-onboarding-backdrop" id="home-onboarding-backdrop"></div>
        <div class="home-onboarding-panel" role="dialog" aria-labelledby="home-onboarding-title">
          <button type="button" class="home-onboarding-close" id="home-onboarding-close" aria-label="${escapeHtml(t('common.cancel'))}">×</button>
          <p class="home-onboarding-kicker">${escapeHtml(t('home.onboardingKicker'))}</p>
          <h2 id="home-onboarding-title">${escapeHtml(t('home.onboardingTitle'))}</h2>
          <p>${escapeHtml(t('home.onboardingDesc'))}</p>
          <ol class="home-onboarding-list">
            ${guideSteps.map((step) => `<li><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.desc)}</span></li>`).join('')}
          </ol>
          <div class="home-onboarding-actions">
            <a href="#/kb" class="btn-primary" id="home-onboarding-kb">${escapeHtml(t('home.onboardingKbCta', null, '查看知识库'))}</a>
            <a href="${pathHref}" class="btn-ghost" id="home-onboarding-start">${escapeHtml(t('home.onboardingStart'))}</a>
            <button type="button" class="btn-ghost" id="home-onboarding-dismiss">${escapeHtml(t('home.onboardingDismiss'))}</button>
          </div>
        </div>
      </div>
    </div>`
}

let homeComposerDocBound = false
const ONBOARDING_KEY = 'pm-lab-onboarding-done'
const GUIDE_PENDING_KEY = 'pm-lab-open-guide'

function closeHomeOnboarding(persist = true) {
  document.getElementById('home-onboarding')?.setAttribute('hidden', '')
  if (persist) {
    try { localStorage.setItem(ONBOARDING_KEY, '1') } catch (_) {}
  }
}

function openHomeOnboarding() {
  document.getElementById('home-onboarding')?.removeAttribute('hidden')
}

function maybeOpenHomeOnboarding() {
  try {
    if (sessionStorage.getItem(GUIDE_PENDING_KEY) === '1') {
      sessionStorage.removeItem(GUIDE_PENDING_KEY)
      openHomeOnboarding()
      return
    }
    if (localStorage.getItem(ONBOARDING_KEY) === '1') return
  } catch (_) {}
  openHomeOnboarding()
}

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
    const found = searchSiteContent(q, 8)
    if (!found.length) {
      showResults(`<div class="home-composer-empty">${escapeHtml(t('nav.searchEmpty'))}</div>`)
      return
    }
    showResults(found.map((hit) => `
      <button type="button" class="home-composer-item" data-href="${escapeHtml(hit.href)}">
        <strong>${escapeHtml(hit.title)}</strong>
        <span>${escapeHtml(hit.meta)}</span>
      </button>`).join(''))
    results.querySelectorAll('.home-composer-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const href = btn.dataset.href || ''
        navigate(href.startsWith('#') ? href.slice(1) : href || '/')
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

  document.getElementById('home-onboarding-close')?.addEventListener('click', () => closeHomeOnboarding(true))
  document.getElementById('home-onboarding-dismiss')?.addEventListener('click', () => closeHomeOnboarding(true))
  document.getElementById('home-onboarding-backdrop')?.addEventListener('click', () => closeHomeOnboarding(true))
  document.getElementById('home-onboarding-kb')?.addEventListener('click', () => closeHomeOnboarding(true))
  document.getElementById('home-onboarding-start')?.addEventListener('click', () => closeHomeOnboarding(true))
  maybeOpenHomeOnboarding()
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

function normalizeKnowledgeText(text) {
  return String(text || '')
    .replace(/\u3010\u8865\u5145\u5b8c\u5584\uff5c([^\u3011]+)\u3011/g, '$1\uff1a')
    .replace(/^\u8865\u5145\u5b8c\u5584\s*/g, '')
}

function splitKnowledgeLabel(text) {
  const normalized = normalizeKnowledgeText(text).trim()
  const match = normalized.match(/^([^\uff1a:]{2,18})[\uff1a:]\s*(.+)$/)
  if (!match) return null
  const label = match[1].trim()
  const body = match[2].trim()
  if (!label || !body || /^https?$/i.test(label)) return null
  return { label, body }
}

function renderSplitKnowledgeBody(text) {
  const parts = String(text || '').split(/(?=\d+[.\u3001]\s*)/).map((x) => x.trim()).filter(Boolean)
  if (parts.length < 2) return escapeHtml(text)
  return '<ol class="article-mini-list">' + parts.map((part) => '<li>' + escapeHtml(part.replace(/^\d+[.\u3001]\s*/, '')) + '</li>').join('') + '</ol>'
}

function isKnowledgeDiagram(text) {
  const value = String(text || '')
  if (!value.includes('\n')) return false
  return /[\u2500-\u257f\u2190-\u21ff]|(\n\s*[\u2502\u251c\u2514\u250c\u2510\u2518\u2524])|(\s{2,}[-\u2500>])/.test(value)
}
function renderKnowledgeDiagram(text) {
  return '<div class="article-diagram-card"><pre>' + escapeHtml(text) + '</pre></div>'
}

function renderKnowledgeLineList(text) {
  const rawLines = String(text || '').split('\n').filter((line) => line.trim())
  const lines = rawLines.map((line) => line.trim())
  const listLines = lines.filter((line) => /^(\d+[.\u3001]|[-*\u2022]|[\u251c\u2514\u2502])\s*/.test(line))
  if (lines.length < 2 || listLines.length < Math.ceil(lines.length * 0.45)) return ''
  return '<div class="article-structured-list">' + rawLines.map((rawLine) => {
    const line = rawLine.trim()
    const level = (/^\s{2,}/.test(rawLine) || /^[\u251c\u2514\u2502]/.test(line)) ? ' is-sub' : ''
    const clean = line.replace(/^(\d+[.\u3001]|[-*\u2022]|[\u251c\u2514\u2502\u2500\s]+)\s*/, '').trim()
    return '<div class="article-structured-item' + level + '">' + escapeHtml(clean || line) + '</div>'
  }).join('') + '</div>'
}

function parseKnowledgeChecklistLine(text) {
  const value = normalizeKnowledgeText(text).trim()
  if (!/\[\s*\]/.test(value)) return null
  const colonIndex = value.search(/[：:]/)
  const title = colonIndex > 0 && colonIndex < 24 ? value.slice(0, colonIndex).trim() : ''
  const body = title ? value.slice(colonIndex + 1).trim() : value
  const items = body
    .split(/\s+\/\s+|\s*；\s*|\s*;\s*/)
    .map((part) => part.replace(/^\[\s*\]\s*/, '').trim())
    .filter(Boolean)
  if (!items.length) return null
  return { title, items }
}

function renderKnowledgeChecklist(lines) {
  const parsed = (lines || []).map(parseKnowledgeChecklistLine).filter(Boolean)
  if (parsed.length < 2) return ''
  return '<div class="article-checklist-list">' + parsed.map((group) => {
    const title = group.title ? `<h3>${escapeHtml(group.title)}</h3>` : ''
    const items = group.items.map((item) =>
      `<li><span class="article-checkmark" aria-hidden="true"></span><span>${escapeHtml(item)}</span></li>`,
    ).join('')
    return `<section class="article-checklist-group">${title}<ul>${items}</ul></section>`
  }).join('') + '</div>'
}

function splitLongKnowledgeText(text) {
  const value = String(text || '').trim()
  if (value.length < 96) return []
  return value
    .split(/(?<=[\u3002\uff1b;])\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 8)
}

function renderKnowledgeLongCard(text) {
  const parts = splitLongKnowledgeText(text)
  if (parts.length < 2) return ''
  return '<div class="article-long-card">' + parts.map((part) => '<p>' + escapeHtml(part) + '</p>').join('') + '</div>'
}

function renderKnowledgeMultiline(text) {
  if (isKnowledgeDiagram(text)) return renderKnowledgeDiagram(text)
  const listHtml = renderKnowledgeLineList(text)
  if (listHtml) return listHtml
  return '<div class="article-long-card article-preline">' + escapeHtml(text).replace(/\n/g, '<br>') + '</div>'
}

function renderKnowledgeFieldRow(text) {
  const value = normalizeKnowledgeText(text)
  if (!value.includes(' · ') || !value.includes('=')) return ''
  const parts = value.split(/\s+·\s+/).map((part) => part.trim()).filter(Boolean)
  if (parts.length < 2) return ''
  const title = parts.shift()
  if (!title || title.includes('=')) return ''
  const fields = parts
    .map((part) => {
      const index = part.indexOf('=')
      if (index <= 0) return null
      const label = part.slice(0, index).trim()
      const body = part.slice(index + 1).trim()
      if (!label || !body) return null
      return { label, body }
    })
    .filter(Boolean)
  if (!fields.length) return ''
  return '<section class="article-field-row">' +
    '<h3>' + escapeHtml(title) + '</h3>' +
    '<dl>' + fields.map((field) =>
      '<div>' +
        '<dt>' + escapeHtml(field.label) + '</dt>' +
        '<dd>' + escapeHtml(field.body) + '</dd>' +
      '</div>',
    ).join('') + '</dl>' +
  '</section>'
}

function renderKnowledgeParagraphs(lines) {
  const checklistHtml = renderKnowledgeChecklist(lines)
  if (checklistHtml) return checklistHtml
  return (lines || []).map((p, index) => {
    const text = normalizeKnowledgeText(p)
    const fieldRow = renderKnowledgeFieldRow(text)
    if (fieldRow) return fieldRow
    const labeled = splitKnowledgeLabel(text)
    if (labeled) {
      return '<section class="article-insight-card">' +
        '<div class="article-insight-label">' + escapeHtml(labeled.label) + '</div>' +
        '<div class="article-insight-body">' + renderSplitKnowledgeBody(labeled.body) + '</div>' +
      '</section>'
    }
    if (index === 0 && text.length >= 8 && text.length <= 88 && !text.includes('\n')) {
      return '<section class="article-insight-card article-insight-card-lead">' +
        '<div class="article-insight-label">' + escapeHtml(t('article.coreUnderstanding', null, '\u6838\u5fc3\u7406\u89e3')) + '</div>' +
        '<div class="article-insight-body">' + escapeHtml(text) + '</div>' +
      '</section>'
    }
    if (text.includes('\n')) {
      return renderKnowledgeMultiline(text)
    }
    if (text.includes(' \u8def ') || /^[^\u952b\uff1a:]{1,20}[\u952b\uff1a:]/.test(text)) {
      return '<p class="article-kv">' + escapeHtml(text) + '</p>'
    }
    const longCard = renderKnowledgeLongCard(text)
    if (longCard) return longCard
    return '<p>' + escapeHtml(text) + '</p>'
  }).join('')
}
/** 业务词条正文：分区标题 + 要点列表 + 键值行 */
function renderTermDetailBody(item) {
  const lines = item.content || []
  const blocks = []
  let current = { title: '', kind: 'text', rows: [] }

  const flush = () => {
    if (!current.rows.length && !current.title) return
    blocks.push(current)
    current = { title: '', kind: 'text', rows: [] }
  }

  for (const raw of lines) {
    const text = String(raw || '').trim()
    if (!text) continue
    const isHeading = (/[：:]$/.test(text) && !text.includes(' · ') && text.length <= 28)
      || (!text.includes(' · ') && !text.includes('：') && !text.includes(':') && text.length <= 20 && !/^定义/.test(text))
    if (isHeading && !/^定义/.test(text)) {
      flush()
      current = { title: text.replace(/[：:]$/, ''), kind: 'section', rows: [] }
      continue
    }
    if (text.includes(' · ')) {
      current.kind = current.kind === 'section' ? 'kv' : (current.kind === 'text' && !current.rows.length ? 'kv' : current.kind === 'kv' ? 'kv' : 'kv')
      const parts = text.split(' · ').map((x) => x.trim()).filter(Boolean)
      current.rows.push({ type: 'kv', parts })
      continue
    }
    if (/^[：:].+/.test(text) === false && /：/.test(text) && text.length < 80 && !/^定义：/.test(text)) {
      const [k, ...rest] = text.split(/[：:]/)
      current.rows.push({ type: 'point', key: k.trim(), value: rest.join('：').trim() })
      continue
    }
    current.rows.push({ type: 'para', text })
  }
  flush()

  return `
    <div class="term-detail-body">
      ${blocks.map((b) => {
        const head = b.title ? `<h3 class="term-detail-h">${escapeHtml(b.title)}</h3>` : ''
        const list = b.rows.map((row) => {
          if (row.type === 'kv') {
            const label = row.parts[0] || ''
            const rest = row.parts.slice(1)
            return `<div class="term-kv-row">
              <span class="term-kv-label">${escapeHtml(label)}</span>
              <span class="term-kv-value">${rest.map((p) => escapeHtml(p.replace(/^[^=]+=/, ''))).join(' · ')}</span>
            </div>`
          }
          if (row.type === 'point') {
            return `<div class="term-point-row"><strong>${escapeHtml(row.key)}</strong><span>${escapeHtml(row.value)}</span></div>`
          }
          const t = String(row.text || '').replace(/^定义[：:]\s*/, '')
          return `<p class="term-para">${escapeHtml(t)}</p>`
        }).join('')
        return `<section class="term-detail-block">${head}${list}</section>`
      }).join('')}
    </div>`
}

function renderKnowledgeDetailBody(item, opts = {}) {
  const explain = item.content || []
  const cases = item.cases || []
  const pmApp = item.pmApplication || []
  const mermaidBlocks = item.mermaid || []
  const hasStructured = cases.length > 0 || pmApp.length > 0
  const useTermLayout = opts.termLayout === true

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

  const explainHtml = `<div class="article-body ${useTermLayout ? 'article-body-term-unified' : ''}">${renderKnowledgeParagraphs(explain)}</div>`

  // 业务词条：解释区走 term 排版，案例由页面单独渲染，避免双层分区
  if (useTermLayout || !hasStructured) {
    return `${explainHtml}${mermaidHtml}`
  }

  return `
    <div class="article-sections">
      <section class="article-section article-section-explain">
        <div class="article-section-header">
          <span class="article-section-label">${escapeHtml(t('article.sectionExplainLabel'))}</span>
          <h2>${escapeHtml(t('article.sectionExplainTitle'))}</h2>
        </div>
        <div class="article-section-body">
          ${explainHtml}
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
    if (!Auth().isLoggedIn()) {
      showToast(t('auth.noteLoginRequired', null, '请先登录后再添加笔记'), 'info')
      return
    }
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

const LEGACY_ARTICLE_TARGETS = {
  'methodology/kb-pm-bagu-案例-代理商平台接企学宝': ['methodology', 'kb-pm-bagu-文档体系案例-b-端平台对接外部培训系统'],
  'methodology/kb-pm-bagu-4-个关键边界': ['methodology', 'kb-pm-bagu-冒烟测试-4-个关键边界'],
  'methodology/user-research': ['methodology', 'kb-product-methodology-2-5-用户访谈'],
  'methodology/requirement-analysis': ['workflow', 'kb-workflow-2-需求分析'],
  'methodology/mvp': ['methodology', 'kb-pm-bagu-mvp'],
  'skills/prd': ['methodology', 'kb-product-methodology-4-3-prd-标准-7-章节'],
  'skills/prototype': ['methodology', 'kb-career-playbook-原型设计'],
  'skills/roadmap': ['methodology', 'kb-career-playbook-roadmap-版本规划'],
  'skills/metrics-design': ['methodology', 'kb-career-playbook-核心指标设计'],
  'domain/b-vs-c': ['methodology', 'kb-career-playbook-b-端-vs-c-端产品差异'],
  'domain/business-model': ['methodology', 'kb-product-methodology-1-2-商业模式画布补全项-2'],
  'domain/ai-product': ['methodology', 'kb-career-playbook-ai-产品专题'],
  'interview/star': ['methodology', 'kb-career-playbook-star-法则'],
  'interview/competitor-analysis': ['methodology', 'kb-career-playbook-竞品分析'],
  'interview/estimate-dau': ['methodology', 'kb-career-playbook-估算题'],
  'interview/why-pm': ['methodology', 'kb-career-playbook-为什么想做-pm'],
  'interview/favorite-product': ['methodology', 'kb-career-playbook-介绍一个喜欢的产品'],
}

const LEGACY_ARTICLE_HINTS = {
  'methodology/user-research': '用户访谈 用户研究',
  'methodology/requirement-analysis': '需求分析 KANO RICE 真伪需求',
  'methodology/mvp': 'MVP 最小可行产品',
  'skills/prd': 'PRD 需求文档',
  'skills/prototype': '原型设计 低保真',
  'skills/roadmap': 'Roadmap 版本规划',
  'skills/metrics-design': '核心指标 北极星 漏斗',
  'domain/b-vs-c': 'B端 C端 产品差异',
  'domain/business-model': '商业模式画布 商业模式',
  'domain/ai-product': 'AI 产品专题',
  'interview/star': 'STAR 法则',
  'interview/competitor-analysis': '竞品分析',
  'interview/estimate-dau': '估算题 DAU',
  'interview/why-pm': '为什么想做 PM',
  'interview/favorite-product': '介绍一个喜欢的产品',
}

function resolveMissingArticleCandidates(categoryId, itemId, limit = 4) {
  const key = `${categoryId}/${itemId}`
  const query = LEGACY_ARTICLE_HINTS[key] || String(itemId || '')
    .replace(/^kb-/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\d+/g, ' ')
    .trim()
  if (!query) return []
  const results = K.searchKnowledgeMerged?.(query) || []
  const seen = new Set()
  const candidates = []
  for (const result of results) {
    if (result.source === 'my' || !result.category?.id || !result.item?.id) continue
    const href = `#/article/${result.category.id}/${encodeURIComponent(result.item.id)}`
    if (seen.has(href)) continue
    seen.add(href)
    candidates.push({
      href,
      title: result.item.title,
      desc: result.item.summary || result.item.section || '',
      meta: catTitle(result.category),
    })
    if (candidates.length >= limit) break
  }
  return candidates
}

function getKnowledgeArticleTarget(categoryId, itemId) {
  const cat = K.getCategoryByIdMerged(categoryId)
  const item = cat?.items.find((i) => i.id === itemId)
  if (cat && item) return { category: cat, item }
  for (const c of K.getMergedCategories?.() || []) {
    const hit = c.items.find((i) => i.id === itemId)
    if (hit) return { category: c, item: hit }
  }
  return null
}

function articleHref(categoryId, itemId) {
  return `#/article/${categoryId}/${encodeURIComponent(itemId)}`
}

function resolveKnowledgeArticleHref(categoryId, itemId, hint = '') {
  const key = `${categoryId}/${itemId}`
  const legacyTarget = LEGACY_ARTICLE_TARGETS[key]
  if (legacyTarget) {
    const target = getKnowledgeArticleTarget(legacyTarget[0], legacyTarget[1])
    if (target) return articleHref(target.category.id, target.item.id)
  }

  const direct = getKnowledgeArticleTarget(categoryId, itemId)
  if (direct) return articleHref(direct.category.id, direct.item.id)

  const candidates = resolveMissingArticleCandidates(categoryId, itemId, 1)
  if (candidates[0]?.href) return candidates[0].href

  const searchText = [hint, LEGACY_ARTICLE_HINTS[key], itemId]
    .filter(Boolean)
    .join(' ')
    .replace(/[-_/#]+/g, ' ')
    .trim()
  if (searchText) {
    const result = (K.searchKnowledgeMerged?.(searchText) || [])
      .find((r) => r.source !== 'my' && r.category?.id && r.item?.id)
    if (result) return articleHref(result.category.id, result.item.id)
  }

  return null
}

function resolveKnownRouteHref(href, hint = '') {
  const raw = String(href || '').trim()
  if (!raw || !raw.startsWith('#/')) return raw
  const [path, query = ''] = raw.slice(2).split('?')
  const parts = path.split('/').filter(Boolean).map((p) => {
    try {
      return decodeURIComponent(p)
    } catch {
      return p
    }
  })

  if (parts[0] === 'article' && parts[1] && parts[2]) {
    const catId = resolveKbCategoryId(parts[1])
    const resolved = resolveKnowledgeArticleHref(catId, parts[2], hint)
    if (resolved) return resolved
  }

  if (parts[0] === 'category' && parts[1]) {
    if (['interview', 'skills', 'domain'].includes(parts[1])) return '#/doc/methodology/career-playbook'
    if (['methodology', 'architecture'].includes(parts[1])) return '#/kb'
    if (parts[1] === 'reference') return '#/glossary'
    const catId = resolveKbCategoryId(parts[1])
    if (catId !== parts[1]) return `#/category/${catId}`
  }

  return query ? `#/${path}?${query}` : `#/${path}`
}

window.PDMRouteResolver = {
  resolveHref: resolveKnownRouteHref,
  resolveArticleHref: resolveKnowledgeArticleHref,
}

window.PDMLearningPathSource = {
  save: saveLearningPathSource,
  get: getLearningPathSource,
  clear: clearLearningPathSource,
}

let internalRouteGuardBound = false
function bindInternalRouteGuard() {
  if (internalRouteGuardBound) return
  internalRouteGuardBound = true
  document.addEventListener('click', (event) => {
    const link = event.target?.closest?.('a[href^="#/"]')
    if (!link) return
    const href = link.getAttribute('href')
    const resolved = resolveKnownRouteHref(href, link.textContent || '')
    if (!resolved || resolved === href) return
    event.preventDefault()
    navigate(resolved)
  })
}

function renderMissingArticlePage(categoryId, itemId) {
  const candidates = resolveMissingArticleCandidates(categoryId, itemId)
  return `
    <div class="page article-missing-page">
      <section class="article-missing-panel">
        <p class="eyebrow">${escapeHtml(t('nav.sectionKnowledge'))}</p>
        <h1>${escapeHtml(t('common.notFound'))}</h1>
        <p>${escapeHtml(t('kbMod.missingArticleHint', null, '这个入口可能来自旧版知识库，当前内容已迁移或重命名。'))}</p>
        <div class="article-missing-actions">
          <a href="#/kb" class="btn-primary">${escapeHtml(t('nav.sectionKnowledge'))}</a>
          <a href="#/glossary" class="btn-ghost">${escapeHtml(t('kbMod.refGlossaryTitle', null, '知识速查'))}</a>
        </div>
      </section>
      ${candidates.length ? `
        <section class="article-missing-suggestions">
          <h2>${escapeHtml(t('kbMod.relatedKnowledge', null, '你可能要找'))}</h2>
          <div class="article-missing-grid">
            ${candidates.map((item) => `
              <a href="${escapeHtml(item.href)}" class="article-missing-card">
                <small>${escapeHtml(item.meta)}</small>
                <strong>${escapeHtml(item.title)}</strong>
                ${item.desc ? `<span>${escapeHtml(item.desc)}</span>` : ''}
              </a>`).join('')}
          </div>
        </section>` : ''}
    </div>`
}

function renderArticle(categoryId, itemId) {
  const resolvedHref = resolveKnowledgeArticleHref(categoryId, itemId)
  if (resolvedHref) {
    const [resolvedCatId, resolvedItemId] = resolvedHref
      .replace(/^#\/article\//, '')
      .split('/')
      .map((p) => {
        try {
          return decodeURIComponent(p)
        } catch {
          return p
        }
      })
    categoryId = resolvedCatId
    itemId = resolvedItemId
  }
  const target = getKnowledgeArticleTarget(categoryId, itemId)
  let cat = target?.category
  let item = target?.item
  if (!cat || !item) return renderMissingArticlePage(categoryId, itemId)
  const catLabel = catTitle(cat)
  const trail = window.PDMKnowledgeViews?.resolveArticleTrail?.(cat.id, item.id)
  const topicLabel = trail?.doc
    ? window.PDMKnowledgeViews?.kbDocLabel?.(cat.id, trail.doc.id)
    : catLabel
  const parsed = window.PDMKnowledgeViews?.splitTitleParen?.(item.title) || { short: item.title, expansion: '' }
  const displayTitle = parsed.short || item.title
  const fullName = item.fullName || ''
  const fullNameZh = item.fullNameZh || parsed.expansion || ''
  const isTermArticle = cat.id === 'business' || cat.id === 'security' || !!(item.fullName || item.fullNameZh)
  const idx = cat.items.findIndex(i => i.id === item.id)
  const prev = idx > 0 ? cat.items[idx - 1] : null
  const next = idx < cat.items.length - 1 ? cat.items[idx + 1] : null
  const favRef = { source: 'public', categoryId: cat.id, itemId: item.id }
  const favorited = isFavorited(favRef)
  const hasStructured = (item.cases?.length || 0) > 0 || (item.pmApplication?.length || 0) > 0
  const summaryClean = String(item.summary || '').replace(/^定义[：:]\s*/, '').replace(/[（(][^）)]*[）)]/g, '').trim()
  return `
    <div class="page article-page ${isTermArticle ? 'term-article-page' : ''}">
      <article class="article-content ${isTermArticle ? 'term-article' : ''}">
        <div class="article-meta">
          <span class="article-category">${escapeHtml(topicLabel)}</span>
          ${item.isShared ? `<span class="shared-badge">${escapeHtml(t('article.sharedBadge'))}</span>` : ''}
          <div class="article-tags">${(item.tags || []).filter((tg) => tg !== displayTitle).map(tg => `<span class="tag">${escapeHtml(tg)}</span>`).join('')}</div>
          <button type="button" class="btn-favorite ${favorited ? 'active' : ''}" id="btn-favorite" data-source="public" data-cat="${cat.id}" data-item="${item.id}">
            ${favorited ? escapeHtml(t('article.favoriteAdded')) : escapeHtml(t('article.favoriteAdd'))}
          </button>
        </div>
        ${isTermArticle ? `
        <header class="term-article-hero">
          <p class="term-article-abbr">${escapeHtml(displayTitle)}</p>
          ${(fullName || fullNameZh) ? `
          <p class="term-article-fullname">
            ${fullName ? `<span>${escapeHtml(fullName)}</span>` : ''}
            ${fullNameZh ? `<span>${escapeHtml(fullNameZh)}</span>` : ''}
          </p>` : ''}
          ${summaryClean ? `<p class="term-article-summary">${escapeHtml(summaryClean)}</p>` : ''}
        </header>` : `
        <h1>${escapeHtml(displayTitle)}</h1>
        <p class="article-summary">${escapeHtml(item.summary)}</p>`}
        ${hasStructured && !isTermArticle ? `
        <div class="article-format-hint">
          <span class="format-chip">${escapeHtml(t('article.formatExplain'))}</span>
          <span class="format-chip format-chip-case">${escapeHtml(t('article.formatCase'))}</span>
          <span class="format-chip format-chip-pm">${escapeHtml(t('article.formatPm'))}</span>
          <span class="format-hint-text">${escapeHtml(t('article.formatHint'))}</span>
        </div>` : ''}
        ${renderKnowledgeDetailBody(item, { termLayout: isTermArticle })}
        ${isTermArticle && hasStructured ? `
        <section class="term-detail-block term-cases-block">
          <h3 class="term-detail-h">${escapeHtml(t('article.sectionCaseTitle', null, '案例'))}</h3>
          <ul class="term-case-list">
            ${(item.cases || []).map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </section>` : ''}
        <div class="article-copyright-notice">
          <span>${escapeHtml(t('article.copyrightTitle', null, '\u539f\u521b\u58f0\u660e'))}</span>
          <p>${escapeHtml(t('article.copyrightDesc', null, '\u672c\u6587\u4e3a Justine WU \u539f\u521b\u5185\u5bb9\uff0c\u672a\u7ecf\u6388\u6743\u4e0d\u5f97\u590d\u5236\u3001\u8f6c\u8f7d\u3001\u5546\u7528\u6216\u7528\u4e8e\u6a21\u578b\u8bad\u7ec3\u3002'))}</p>
        </div>
        ${renderArticleNotesPanel(favRef)}
      </article>
      <nav class="article-nav">
        ${prev ? `<a href="#/article/${cat.id}/${encodeURIComponent(prev.id)}" class="article-nav-link prev"><span class="nav-direction">${escapeHtml(t('article.navPrev'))}</span><span class="nav-title">${escapeHtml((window.PDMKnowledgeViews?.splitTitleParen?.(prev.title) || {}).short || prev.title)}</span></a>` : '<div></div>'}
        ${next ? `<a href="#/article/${cat.id}/${encodeURIComponent(next.id)}" class="article-nav-link next"><span class="nav-direction">${escapeHtml(t('article.navNext'))}</span><span class="nav-title">${escapeHtml((window.PDMKnowledgeViews?.splitTitleParen?.(next.title) || {}).short || next.title)}</span></a>` : '<div></div>'}
      </nav>
    </div>`
}

function bindFavoriteButton() {
  document.getElementById('btn-favorite')?.addEventListener('click', async () => {
    if (!Auth().isLoggedIn()) {
      showToast(t('article.favLoginRequired'), 'info')
      navigate('/login')
      return
    }
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
let myKnowledgeState = { q: '', groupId: 'all', showGroupForm: false, editingGroup: null, openGroupMenu: null, groupForm: { name: '', description: '' } }
let lastKnowledgeRoute = ''

function emptyKnowledgeForm(groupId = 'default') {
  const groups = loadKnowledgeGroups()
  const gid = groups.some((g) => g.id === groupId) ? groupId : (groups[0]?.id || 'default')
  return { groupId: gid, title: '', summary: '', tags: [], contentText: '' }
}

const ADMIN_ARCHITECTURE_GROUP_ID = 'admin-system-architecture'
const ADMIN_ARCHITECTURE_SEED_VERSION = 1
const ADMIN_SOFTWARE_PLATFORM_GROUP_ID = 'admin-software-platform'
const ADMIN_SOFTWARE_PLATFORM_SEED_VERSION = 1
const ADMIN_PROTOTYPE_DESIGN_GROUP_ID = 'admin-prototype-design'
const ADMIN_PROTOTYPE_DESIGN_SEED_VERSION = 1
const ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID = 'admin-pm-knowledge-framework'
const ADMIN_PM_KNOWLEDGE_FRAMEWORK_SEED_VERSION = 1
let adminArchitectureSeedPromise = null

function getAdminArchitectureKnowledgeSeeds() {
  return [
    {
      id: 'admin-architecture-7-robot-iot',
      groupId: ADMIN_ARCHITECTURE_GROUP_ID,
      title: '7. 机器人 / IoT 系统特有架构',
      summary: '内部场景知识：用云-边-端、OTA、数据双轨解释机器人 / IoT 系统为什么不能只按普通 Web 系统理解。',
      tags: ['系统架构', '机器人', 'IoT', '云边端', '内部知识'],
      content: [
        '云-边-端架构把业务管理、边缘计算、实时控制拆到不同层级：云端负责平台与数据，边缘端负责本地计算与路径规划，设备端负责低延迟控制。',
        '云端：承载账号、组织、设备管理、订单 / 工单、报表分析、OTA 策略、权限与审计。云端适合做“统一管理”和“跨设备协同”，但不适合承接毫秒级控制。',
        '边缘端：通常在机器人本体或现场网关中，负责 SLAM、路径规划、任务调度、离线缓存、局域网通信。网络不稳定时，边缘端要能独立完成核心任务。',
        '设备端：传感器、控制器、电机、急停、避障等低延迟能力。像“检测到障碍物立即停止”必须在设备端或边缘端完成，不能依赖云端请求。',
        'OTA 空中升级要有灰度、校验、备份、回滚、升级窗口和结果上报。PM 写需求时要明确：升级对象、版本范围、失败策略、是否强制升级、用户是否可感知。',
        '机器人数据通常是双轨：时序数据用于运行状态、故障诊断、传感器监控；业务数据用于订单、工单、客户、设备资产；地图、视频、图像则更适合专用地图服务或对象存储。',
      ],
      pmApplication: [
        '实时性需求必须明确放在哪一层。业务平台可以等 1 秒，路径规划可能只能等 100ms，紧急制动必须在 10ms 级别内处理。',
        '凡是涉及机器人、硬件、IoT 的需求，PRD 里要补充网络异常、离线策略、升级失败、设备状态回传和数据存储位置。',
      ],
    },
    {
      id: 'admin-architecture-8-evolution',
      groupId: ADMIN_ARCHITECTURE_GROUP_ID,
      title: '8. 架构演进路径与技术债判断',
      summary: '从单体、模块化单体、微服务、服务网格到云原生，帮助 PM 判断什么时候应该偿还技术债。',
      tags: ['系统架构', '技术债', '架构演进', '内部知识'],
      content: [
        '常见演进路径：单体架构 → 模块化单体 → 微服务 → 服务网格 → 云原生 / Serverless。不是越高级越好，而是要匹配团队规模、业务复杂度和系统压力。',
        '单体适合早期验证，研发效率高、部署简单；问题是模块边界容易混乱，后期改动牵一发动全身。',
        '模块化单体适合中期治理，通过清晰模块边界降低耦合，是很多 B 端系统最现实的过渡形态。',
        '微服务适合团队多人并行、业务域稳定、流量压力较高的阶段；代价是链路追踪、服务治理、数据一致性、发布运维复杂度都会上升。',
        '服务网格和云原生适合多服务、大规模、多地域部署场景。PM 不需要掌握底层实现，但要理解它们通常是为了解决治理、弹性、可观测和发布效率问题。',
        '技术债信号：改一个小需求耗时明显变长、发版频繁引发连锁故障、新人无法独立理解模块、线上事故频发、同类逻辑在多个地方重复实现。',
      ],
      pmApplication: [
        'PM 不要把“重构”当成研发自己的事。当技术债开始影响交付速度、稳定性和客户体验时，应推动技术债偿还 Sprint。',
        '判断是否重构时，要问清楚：影响哪些业务目标、不重构的代价是什么、重构范围多大、如何灰度、如何验收。',
      ],
    },
    {
      id: 'admin-architecture-9-diagram',
      groupId: ADMIN_ARCHITECTURE_GROUP_ID,
      title: '9. 架构图绘制：PM 必会的沟通工具',
      summary: '用 C4 模型区分上下文图、容器图、组件图和代码图，避免架构沟通只停留在口头描述。',
      tags: ['系统架构', '架构图', 'C4模型', '内部知识'],
      content: [
        'C4 模型分为四层：Context、Container、Component、Code。PM 通常需要掌握前两层，用于业务、产品、研发、测试之间快速对齐。',
        'Context 图回答“系统和谁交互”：用户、内部角色、外部系统、第三方服务、核心数据流。适合立项、评审、跨团队沟通。',
        'Container 图回答“系统由哪些大块组成”：Web 前端、移动端、后端服务、数据库、缓存、消息队列、对象存储、第三方接口等。',
        'Component 图回答“某个服务内部怎么拆”：通常由研发主导，PM 只需要能看懂关键模块边界。',
        'Code 图回答具体类、函数、代码结构，PM 一般不需要参与。',
        '画架构图时要避免三个问题：只画框不画关系、只画技术组件不画业务角色、没有标注同步 / 异步 / 数据方向 / 权限边界。',
      ],
      pmApplication: [
        '评审复杂需求时，PM 至少准备一张 Context 图，说明用户、平台、外部系统、数据流和关键依赖。',
        '如果一个需求涉及登录、支付、第三方对接、设备控制、数据同步，建议补一张 Container 图，让研发提前发现风险。',
      ],
    },
    {
      id: 'admin-architecture-10-review-questions',
      groupId: ADMIN_ARCHITECTURE_GROUP_ID,
      title: '10. PM 必会的 10 个架构评审问题',
      summary: '用于需求评审前自检：数据存储、同步方式、QPS、延迟、一致性、失败兜底、数据量、维护和上线标准。',
      tags: ['系统架构', '需求评审', '技术评审', '内部知识'],
      content: [
        '1. 数据存在哪：主库、缓存、对象存储、时序库、日志平台分别存什么，是否涉及敏感数据。',
        '2. 同步还是异步：用户是否必须立刻看到结果，是否可以用消息队列或异步任务处理。',
        '3. 能扛多少 QPS：预估峰值、平均值、活动流量、设备上报频率，避免只说“很多用户”。',
        '4. 延迟要求是什么：同步接口、异步任务、设备控制、报表生成的可接受时间不同。',
        '5. 一致性要求是什么：强一致、最终一致、允许延迟多久，失败后是否需要补偿。',
        '6. 触发频率是什么：用户主动触发、定时任务、设备自动上报、外部系统回调，要分别说明。',
        '7. 失败怎么兜底：重试、回滚、降级、人工处理、用户提示、告警通知分别怎么设计。',
        '8. 数据量预估是多少：日增、峰值、保留周期、归档策略、查询范围。',
        '9. 谁来维护：研发、运维、业务运营、客服是否有明确责任边界和 oncall 机制。',
        '10. 上线标准是什么：灰度比例、监控指标、告警阈值、回滚条件、验收 checklist。',
      ],
      pmApplication: [
        '正确答案不是“研发决定”，而是 PM 先给业务口径和约束，研发再设计技术方案。',
        '评审前可以用模板表达：数据位置 + 同步方式 + 性能目标 + 一致性口径 + 失败兜底 + 灰度上线标准。',
      ],
    },
  ].map((entry) => ({
    ...entry,
    seedVersion: ADMIN_ARCHITECTURE_SEED_VERSION,
  }))
}

function getAdminSoftwarePlatformKnowledgeSeeds() {
  return [
    {
      id: 'admin-software-platform-1-platform-product-map',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '1. 软件平台产品经理的能力地图',
      summary: '平台型产品经理要同时理解用户场景、系统边界、权限、数据、配置、开放能力和运营治理。',
      tags: ['软件平台', '平台产品经理', '能力地图', '内部知识'],
      content: [
        '软件平台不是单个功能集合，而是一套能承载多角色、多流程、多系统协作的基础能力。平台 PM 的核心任务，是把复杂业务沉淀成稳定、可配置、可扩展、可运营的产品底座。',
        '能力地图可以分 7 层：用户与组织、业务对象、流程引擎、权限体系、配置体系、数据体系、开放与集成能力。',
        '平台 PM 需要避免只做页面和按钮。真正的平台价值在于：同一套能力能不能复用到多个业务线，业务变化时能不能通过配置解决，而不是每次都重新开发。',
        '判断一个需求是不是平台能力，可以看三个问题：是否多个业务会复用、是否规则经常变化、是否需要统一治理和数据沉淀。',
      ],
      pmApplication: [
        '写需求前先画“平台能力地图”：用户角色、核心对象、流程状态、权限边界、配置项、数据指标、外部系统依赖。',
        '评审时不要只问“这个页面怎么做”，要问“这个能力未来能不能复用、怎么配置、怎么扩展、谁来维护”。',
      ],
      examples: [
        '案例：一个业务线提出“新增客户等级审批”。普通做法是写死一个审批页面；平台做法是抽象出“对象 + 状态流 + 审批节点 + 权限 + 通知”，后续订单审批、退款审批也能复用。',
      ],
    },
    {
      id: 'admin-software-platform-2-ia-navigation',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '2. 信息架构与导航设计',
      summary: '平台越复杂，越要用清晰的信息架构降低用户认知成本。',
      tags: ['软件平台', '信息架构', '导航', '菜单设计', '内部知识'],
      content: [
        '信息架构决定用户能不能找到功能、理解功能、完成任务。平台产品常见问题不是功能少，而是功能太多、入口重复、命名不一致。',
        '平台 IA 通常包含：一级模块、二级菜单、详情页、配置页、操作入口、全局搜索、面包屑、快捷入口。',
        '菜单分组不要只按研发模块拆，要按用户任务和业务对象组织。例如“客户、订单、工单、设备、报表、系统设置”比“基础服务、业务服务、配置服务”更容易被业务用户理解。',
        '平台导航要处理两类用户：高频用户需要快速入口，低频用户需要清晰路径。两者不能只靠一个大菜单解决。',
      ],
      pmApplication: [
        '做 IA 时先列用户任务，而不是先列功能清单。用“用户来平台是为了做什么”反推导航结构。',
        '评审菜单时检查三件事：同类功能是否集中、命名是否用户能懂、从首页到目标功能是否不超过 3 次点击。',
      ],
      examples: [
        '案例：后台原来把“角色管理、账号管理、权限配置”分散在三个模块，用户经常找不到。改为“系统管理 / 账号与权限”后，管理员配置路径变短，客服提问减少。',
      ],
    },
    {
      id: 'admin-software-platform-3-role-permission',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '3. 角色、权限与组织体系',
      summary: '平台产品必须把“谁能看、谁能做、能看到哪些数据”设计清楚。',
      tags: ['软件平台', '权限', '组织架构', 'RBAC', '内部知识'],
      content: [
        '权限体系一般拆成三层：账号体系、角色体系、数据范围。账号解决“你是谁”，角色解决“你能做什么”，数据范围解决“你能看哪些数据”。',
        '平台常用 RBAC：用户绑定角色，角色拥有功能权限。复杂场景再叠加组织、区域、项目、客户归属等数据权限。',
        '权限设计不能只控制菜单。按钮、接口、导出、批量操作、敏感字段、审批节点都要纳入权限边界。',
        '权限越灵活，维护成本越高。平台 PM 要在“可配置”和“可理解”之间取平衡，避免角色碎片化。',
      ],
      pmApplication: [
        'PRD 中必须补权限矩阵：角色 × 页面 × 操作 × 数据范围 × 敏感字段。',
        '涉及权限的需求，要同时写异常：无权限时展示什么、申请权限怎么走、管理员如何排查用户为什么看不到。',
      ],
      examples: [
        '案例：区域经理只能看本区域客户和订单，总部管理员可看全局。若只做菜单权限，区域经理仍可能通过接口查到其他区域数据，因此后端数据权限也必须一起做。',
      ],
    },
    {
      id: 'admin-software-platform-4-workflow-engine',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '4. 流程引擎与状态流转',
      summary: '审批、工单、订单、任务类平台需求，本质都是状态机和流程规则。',
      tags: ['软件平台', '流程引擎', '状态机', '审批', '内部知识'],
      content: [
        '平台里的审批、工单、订单、任务都可以抽象成“对象 + 状态 + 动作 + 角色 + 条件 + 通知”。',
        '状态流转要明确：初始状态、处理中状态、终态、异常状态、可回退状态。不要只画正常流程。',
        '流程引擎的价值是把变化的业务规则配置化，例如审批节点、负责人、超时规则、抄送通知、撤回和驳回。',
        '复杂流程要避免一开始就做万能引擎。先沉淀 2-3 个高频流程，抽象共性，再逐步平台化。',
      ],
      pmApplication: [
        '写流程需求时，用状态机表替代纯文字描述：当前状态、可执行动作、动作人、前置条件、下一状态、通知对象。',
        '验收时必须覆盖撤回、驳回、超时、重复提交、并发审批、流程中角色变更等异常。',
      ],
      examples: [
        '案例：退款审批从“提交 → 财务审核 → 完成”扩展到“大额需要主管复核”。如果一开始把审批节点写死，后续就要改代码；如果抽象成流程配置，只需要新增条件节点。',
      ],
    },
    {
      id: 'admin-software-platform-5-config-system',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '5. 配置化与规则引擎',
      summary: '平台 PM 要判断哪些变化应该配置化，哪些不应该过早平台化。',
      tags: ['软件平台', '配置化', '规则引擎', '内部知识'],
      content: [
        '配置化的目标是让高频变化的规则不必每次研发发版。常见配置包括：字段、表单、流程、权限、通知、字典、阈值、展示模板。',
        '不是所有需求都要配置化。只有变化频繁、复用场景多、规则边界清晰、配置责任人明确时，才适合平台化。',
        '配置项必须有默认值、校验规则、预览效果、版本记录、回滚能力和操作日志，否则很容易把平台变成“黑盒”。',
        '规则引擎适合多条件判断，例如“如果客户等级=A 且金额>10万，则进入主管审批”。PM 需要把规则表达方式设计得业务可理解。',
      ],
      pmApplication: [
        '评估配置化时问：谁来配、多久变一次、配错有什么影响、是否需要审批、是否要灰度、是否要回滚。',
        'PRD 不要只写“支持配置”，要列配置项表：字段名、类型、默认值、可选值、校验、影响范围、权限。',
      ],
      examples: [
        '案例：不同客户的工单 SLA 不同。写死会导致每个客户改代码；配置化后，管理员可按客户等级设置响应时限，但必须有上限校验和变更日志。',
      ],
    },
    {
      id: 'admin-software-platform-6-data-model',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '6. 数据模型与核心对象',
      summary: '软件平台的稳定性，取决于核心对象和字段边界是否设计清楚。',
      tags: ['软件平台', '数据模型', '业务对象', '字段设计', '内部知识'],
      content: [
        '平台 PM 必须能识别核心对象：用户、组织、客户、订单、工单、设备、合同、商品、任务、审批单等。',
        '每个对象都要定义：唯一 ID、关键字段、状态、归属关系、创建/更新规则、删除规则、审计字段。',
        '数据模型不是数据库设计，但 PM 要能说清楚业务含义。字段命名、状态枚举、对象关系会直接影响后续扩展。',
        '常见风险是同一个概念多个系统各叫各的，例如“客户、门店、租户、组织”混用，最后导致搜索、权限和报表全乱。',
      ],
      pmApplication: [
        'PRD 里补“对象字段表”和“状态枚举表”，尤其是新增对象或跨系统同步时。',
        '评审时确认 ID 口径：业务 ID、数据库 ID、第三方系统 ID、展示编号不能混用。',
      ],
      examples: [
        '案例：一个平台同时有“客户”和“门店”。客户是签约主体，门店是履约地点。如果把两者混为一个对象，后续合同、工单、设备归属都会出错。',
      ],
    },
    {
      id: 'admin-software-platform-7-api-integration',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '7. API、开放平台与系统集成',
      summary: '平台型产品经常要和外部系统对接，PM 要懂接口边界、鉴权、字段映射和失败兜底。',
      tags: ['软件平台', 'API', '开放平台', '系统集成', '内部知识'],
      content: [
        '系统集成不是“调一个接口”这么简单，而是身份、字段、状态、异常、权限、频率和对账的整体协同。',
        'API 对接要写清：调用方、被调用方、触发时机、请求字段、返回字段、鉴权方式、失败重试、幂等规则、限流策略。',
        '开放平台还要考虑开发者体验：API 文档、密钥管理、沙箱环境、错误码、Webhook、调用日志。',
        '跨系统同步要明确主数据来源。谁是主系统，谁只能读取，谁可以修改，冲突时以谁为准。',
      ],
      pmApplication: [
        'PRD 中新增“接口协作表”：接口名、方向、触发条件、字段映射、失败策略、验收方式。',
        '验收时不要只看成功调用，还要测超时、重复回调、字段缺失、签名错误、限流、对方系统不可用。',
      ],
      examples: [
        '案例：业务门户同步培训完成记录到 CRM。若只同步成功状态，失败记录无人处理，销售看到的数据就不准。正确做法是增加同步日志、失败重试和人工补偿入口。',
      ],
    },
    {
      id: 'admin-software-platform-8-search-filter',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '8. 搜索、筛选与列表体验',
      summary: '平台用户每天大量使用列表，搜索筛选体验直接影响效率。',
      tags: ['软件平台', '搜索', '筛选', '列表', '内部知识'],
      content: [
        '平台的高频页面通常是列表页。用户关心的是快速定位对象、批量处理、导出和追踪状态。',
        '搜索分三类：精确搜索、模糊搜索、高级筛选。不同字段要明确是否支持模糊、是否分词、是否大小写敏感。',
        '筛选项要围绕任务设计，不要把所有字段都塞进高级筛选。常用筛选应前置，低频筛选可收起。',
        '列表要设计空态、加载态、错误态、无权限态、筛选无结果态，以及保存筛选条件和列配置。',
      ],
      pmApplication: [
        'PRD 中明确每个搜索字段的匹配方式：标题模糊、编号精确、手机号后四位、标签多选、日期范围。',
        '验收时用真实业务数据测试：同名、错别字、大小写、空格、特殊符号、无结果、超大结果集。',
      ],
      examples: [
        '案例：工单列表只支持工单号精确搜索，客服不知道编号时无法定位。增加客户名、手机号后四位、设备 SN 模糊搜索后，查询效率明显提升。',
      ],
    },
    {
      id: 'admin-software-platform-9-dashboard-metrics',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '9. 数据看板与指标体系',
      summary: '平台看板不是堆图表，而是围绕角色决策提供可行动指标。',
      tags: ['软件平台', '数据看板', '指标体系', '内部知识'],
      content: [
        '平台指标要区分经营指标、过程指标、质量指标、效率指标和风险指标。不同角色看不同指标。',
        '看板要回答三个问题：现在怎么样、哪里异常、下一步该做什么。',
        '常见指标包括：活跃用户、任务完成率、处理时长、超时率、异常率、转化率、留存、导出次数、配置变更次数。',
        '指标必须定义口径：统计对象、时间范围、去重方式、状态范围、刷新频率、权限范围。',
      ],
      pmApplication: [
        'PRD 中为每个指标写“指标口径卡”：指标名、定义、公式、数据源、刷新频率、展示角色、异常阈值。',
        '不要只做展示。关键指标要能下钻到明细，并能触发处理动作，例如查看超时工单列表。',
      ],
      examples: [
        '案例：管理者看到“工单处理时长上升”，但无法定位原因。补充分部门、分问题类型、分负责人下钻后，发现主要是某类设备问题等待备件导致。',
      ],
    },
    {
      id: 'admin-software-platform-10-notification',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '10. 消息通知与待办体系',
      summary: '平台通知要帮助用户及时处理任务，而不是制造噪音。',
      tags: ['软件平台', '消息通知', '待办', '内部知识'],
      content: [
        '通知体系通常包含站内信、邮件、短信、企业 IM、浏览器通知和待办中心。',
        '通知设计要明确：触发事件、接收人、渠道、文案、频率、是否可关闭、是否需要已读/未读、是否需要跳转处理。',
        '待办和通知不同。通知偏提醒，待办偏需要用户行动。不要把所有通知都变成待办。',
        '平台要避免通知风暴。高频事件应聚合，低优事件可日报汇总，关键事件才实时推送。',
      ],
      pmApplication: [
        'PRD 中补通知矩阵：事件 × 接收角色 × 通知渠道 × 文案 × 跳转页 × 频控规则。',
        '验收通知时检查：未登录、无权限、对象已删除、重复触发、已读状态、多端同步。',
      ],
      examples: [
        '案例：审批流每一步都发 IM，用户很快屏蔽。优化后只有“轮到我处理”和“超时未处理”进入待办，普通状态变更改为站内消息。',
      ],
    },
    {
      id: 'admin-software-platform-11-saas-tenant',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '11. SaaS、多租户与客户配置',
      summary: '面向多个客户的平台，要提前设计租户隔离、客户配置和数据边界。',
      tags: ['软件平台', 'SaaS', '多租户', '客户配置', '内部知识'],
      content: [
        'SaaS 平台通常多客户共用一套系统，因此必须有租户隔离。租户可以理解为客户、组织或业务空间。',
        '多租户要隔离：数据、配置、权限、成员、日志、报表、文件、外部系统密钥。',
        '客户配置包括：品牌、字段、流程、权限、菜单、通知、SLA、集成方式。配置能力越多，运营和测试成本越高。',
        '租户级功能开关可以支持灰度、套餐差异和客户定制，但必须有清晰的管理入口和审计记录。',
      ],
      pmApplication: [
        '做 SaaS 需求时，PRD 必须写“租户维度”：这个功能是全局配置、租户配置，还是用户个人配置。',
        '测试用例要覆盖跨租户访问、租户删除/停用、租户配置变更、套餐权限变化。',
      ],
      examples: [
        '案例：A 客户启用了自定义字段，B 客户没有。若报表查询没有按租户隔离字段配置，B 客户可能看到不存在的字段或错误空值。',
      ],
    },
    {
      id: 'admin-software-platform-12-release-ops',
      groupId: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      title: '12. 发布、灰度与运营治理',
      summary: '平台上线后会长期运营，PM 要设计发布节奏、灰度策略、回滚和治理机制。',
      tags: ['软件平台', '发布', '灰度', '运营治理', '内部知识'],
      content: [
        '平台功能影响面广，上线不能只看开发完成。需要灰度、监控、告警、回滚、公告、客服知识库和用户反馈入口。',
        '灰度可以按用户、角色、租户、区域、比例或功能开关放量。不同策略对应不同风险控制方式。',
        '发布前要准备：上线说明、影响范围、配置清单、迁移脚本、数据备份、回滚方案、客服话术、验收指标。',
        '运营治理包括：权限治理、配置治理、数据质量治理、重复功能治理、过期入口下线。',
      ],
      pmApplication: [
        '每个较大平台需求都要写上线 checklist：灰度对象、监控指标、告警阈值、回滚条件、负责人。',
        '上线后 1-2 周做复盘：使用率、失败率、反馈问题、客服咨询、是否产生新配置负担。',
      ],
      examples: [
        '案例：新权限系统直接全量上线，部分用户当天无法操作。更稳妥的方式是先对内部管理员灰度，再选 1-2 个低风险租户试用，最后全量切换。',
      ],
    },
  ].map((entry) => ({
    ...entry,
    seedVersion: ADMIN_SOFTWARE_PLATFORM_SEED_VERSION,
  }))
}

function getAdminPrototypeDesignKnowledgeSeeds() {
  return [
    {
      id: 'admin-prototype-design-1-prototype-purpose',
      groupId: ADMIN_PROTOTYPE_DESIGN_GROUP_ID,
      title: '1. 原型设计的目的与边界',
      summary: '原型不是画好看的页面，而是用最低成本验证流程、信息、交互和业务规则。',
      tags: ['原型设计', '产品经理', '需求表达', '内部知识'],
      content: [
        '产品经理做原型的核心目的，是把抽象需求变成团队可以讨论、评审、验证和开发的具体界面与流程。',
        '原型需要回答四个问题：用户在哪里开始、要完成什么任务、过程中看到什么信息、遇到异常时怎么处理。',
        '原型不是最终 UI。低保真用于讨论结构和流程，高保真用于对齐交互细节和视觉氛围，研发交付前还需要结合 PRD、字段、接口和状态规则。',
        '不要把原型当成“美术稿”。PM 原型最重要的是表达业务逻辑、信息层级、状态流转和操作反馈。',
      ],
      pmApplication: [
        '开始画原型前先写清目标：这张原型是用于需求评审、用户测试、研发估时，还是老板汇报。目标不同，精细度不同。',
        '评审时主动说明“哪些是确定规则、哪些是示意布局、哪些待 UI 细化”，避免研发或设计误解。'
      ],
      examples: [
        '案例：做“批量导入客户”时，原型不应该只画上传按钮，还要画模板下载、字段校验、错误行提示、导入中、导入成功、部分失败、重复数据处理等状态。',
      ],
    },
    {
      id: 'admin-prototype-design-2-user-flow',
      groupId: ADMIN_PROTOTYPE_DESIGN_GROUP_ID,
      title: '2. 用户流程与任务路径',
      summary: '先画流程再画页面，避免页面堆出来但用户任务走不通。',
      tags: ['原型设计', '用户流程', '任务路径', '内部知识'],
      content: [
        '用户流程描述用户从入口到完成目标的完整路径，包括触发点、关键步骤、判断条件、成功结果和失败兜底。',
        '常见流程图节点包括：开始、页面、操作、判断、系统处理、通知、结束。复杂流程要标明角色和系统边界。',
        '好的流程图能提前暴露问题：是否有重复步骤、是否缺少返回路径、异常是否无人处理、跨角色协作是否断裂。',
        '流程图不是越复杂越好。主流程清晰，异常流程独立补充，才能让评审更高效。',
      ],
      pmApplication: [
        '原型前先画“主流程 + 关键异常流程”，再进入页面设计。',
        '对每个关键按钮追问：点击后去哪、失败怎么办、能否撤销、是否需要权限、是否要通知其他人。'
      ],
      examples: [
        '案例：审批原型如果只画“提交审批”，会漏掉撤回、驳回、重新提交、审批人离职、超时提醒。先画流程图能把这些分支提前暴露。',
      ],
    },
    {
      id: 'admin-prototype-design-3-information-architecture',
      groupId: ADMIN_PROTOTYPE_DESIGN_GROUP_ID,
      title: '3. 信息架构与页面层级',
      summary: '原型的信息架构决定用户能否快速理解页面重点。',
      tags: ['原型设计', '信息架构', '页面层级', '内部知识'],
      content: [
        '页面信息架构包括：页面标题、核心操作、筛选搜索、主要内容、辅助信息、状态提示、底部操作区。',
        'PM 画原型时要先确定页面优先级：用户最常做什么、最需要先看到什么、哪些信息可以折叠或后置。',
        'B 端后台常见结构：列表页负责查找和批量操作，详情页负责查看全量信息，编辑页负责变更数据，配置页负责维护规则。',
        '不要把所有字段平铺在一个页面。按用户任务分区，例如“基础信息、业务信息、权限信息、操作记录”。',
      ],
      pmApplication: [
        '画页面前先列“信息优先级表”：必看、常看、偶尔看、仅管理员看。',
        '评审原型时让业务用户用真实任务走一遍，看是否能在 3 秒内找到关键入口。'
      ],
      examples: [
        '案例：客户详情页原来把合同、工单、设备、联系人混在一起，用户看不出重点。改成顶部摘要 + 分 Tab 展示后，客服能更快定位客户状态和历史问题。',
      ],
    },
    {
      id: 'admin-prototype-design-4-list-detail-form',
      groupId: ADMIN_PROTOTYPE_DESIGN_GROUP_ID,
      title: '4. 列表、详情、表单三大基础页面',
      summary: '大多数后台原型都离不开列表、详情和表单，三者各有设计重点。',
      tags: ['原型设计', '列表页', '详情页', '表单', '内部知识'],
      content: [
        '列表页用于查找、筛选、排序、批量操作和快速判断状态。重点是字段选择、筛选条件、空态、分页、批量操作。',
        '详情页用于呈现完整对象信息。重点是信息分区、状态展示、操作入口、关联记录和操作日志。',
        '表单页用于新增或编辑数据。重点是字段类型、必填规则、默认值、校验提示、保存反馈和取消确认。',
        '三类页面要形成闭环：列表能进入详情，详情能编辑，编辑保存后能回到来源位置并看到更新结果。',
      ],
      pmApplication: [
        '做后台原型时优先补齐列表、详情、表单的状态：加载、空、错误、无权限、保存中、保存成功、保存失败。',
        '表单字段必须写清类型、默认值、必填、可编辑条件和错误提示，不要只在原型里放一个输入框。'
      ],
      examples: [
        '案例：设备管理列表需要展示设备 SN、在线状态、电量、门店、版本号、最后在线时间；详情页再展示日志、任务、告警和维保记录。',
      ],
    },
    {
      id: 'admin-prototype-design-5-form-validation',
      groupId: ADMIN_PROTOTYPE_DESIGN_GROUP_ID,
      title: '5. 表单设计与字段校验',
      summary: '表单原型要把字段规则和错误提示画清楚，否则研发无法准确实现。',
      tags: ['原型设计', '表单设计', '字段校验', '内部知识'],
      content: [
        '表单字段不是简单输入框。每个字段都要明确字段名、类型、是否必填、取值范围、默认值、可编辑条件、提交校验和错误文案。',
        '复杂表单要分步骤或分区，减少用户一次性填写压力。高风险操作要增加确认提示。',
        '错误提示要靠近错误字段，并告诉用户怎么修正，而不是只提示“提交失败”。',
        '有依赖关系的字段要画出联动规则，例如选择客户后自动带出合同、选择区域后筛选门店。',
      ],
      pmApplication: [
        'PRD 中补字段规则表，并在原型里展示至少 2-3 个关键错误状态。',
        '验收时用边界值测试：空值、超长、重复、非法字符、权限不足、网络失败。'
      ],
      examples: [
        '案例：新增成员表单中，手机号格式错误时提示“请输入 11 位手机号”；邮箱重复时提示“该邮箱已绑定账号，可直接邀请加入组织”。',
      ],
    },
    {
      id: 'admin-prototype-design-6-interaction-states',
      groupId: ADMIN_PROTOTYPE_DESIGN_GROUP_ID,
      title: '6. 交互状态与反馈机制',
      summary: '原型要覆盖用户操作后的反馈，让用户知道系统正在发生什么。',
      tags: ['原型设计', '交互状态', '反馈', '内部知识'],
      content: [
        '交互状态包括默认、悬停、点击、加载中、成功、失败、禁用、选中、已读、未读、空态、异常态。',
        '平台产品尤其要重视异步状态：提交后正在处理、后台任务执行中、导入中、同步中、部分成功、失败重试。',
        '反馈机制要匹配操作风险。轻操作用 Toast，重要操作用弹窗确认，高风险操作要二次确认或输入确认词。',
        '禁用按钮不能只变灰，要告诉用户为什么不能点，例如“请先选择至少 1 条数据”。',
      ],
      pmApplication: [
        '每个关键操作至少补三种状态：操作前、操作中、操作后。',
        '评审时检查所有按钮：点击后是否有反馈、能否重复点击、失败后用户是否知道下一步。'
      ],
      examples: [
        '案例：批量导入 1000 条客户时，不能只显示“导入成功”。应展示进度、成功数量、失败数量、失败原因下载和重新导入入口。',
      ],
    },
    {
      id: 'admin-prototype-design-7-empty-error-permission',
      groupId: ADMIN_PROTOTYPE_DESIGN_GROUP_ID,
      title: '7. 空态、异常态与权限态',
      summary: '好的原型不是只有理想状态，还要画用户最容易卡住的状态。',
      tags: ['原型设计', '空态', '异常态', '权限态', '内部知识'],
      content: [
        '空态包括无数据、筛选无结果、搜索无结果、未配置、未登录、无权限等。不同空态需要不同引导。',
        '异常态包括网络失败、接口超时、保存失败、数据冲突、对象已删除、版本过期。',
        '权限态要告诉用户是“没有权限”还是“需要登录”还是“角色不支持”。如果允许申请权限，要提供申请入口。',
        '空态不是装饰图。空态要告诉用户为什么为空，以及下一步可以做什么。',
      ],
      pmApplication: [
        '关键页面必须补空态和异常态原型，尤其是列表页、详情页、配置页、导入导出。',
        '权限相关页面要同步写角色矩阵，避免前端显示和后端接口权限不一致。'
      ],
      examples: [
        '案例：用户搜索“张三”无结果时，不应只显示空白页；应提示“未找到相关客户”，并提供“清空筛选”“新增客户”或“检查搜索条件”。',
      ],
    },
    {
      id: 'admin-prototype-design-8-mobile-responsive',
      groupId: ADMIN_PROTOTYPE_DESIGN_GROUP_ID,
      title: '8. 移动端与响应式原型',
      summary: '移动端不是桌面端缩小版，要重新规划信息密度和操作路径。',
      tags: ['原型设计', '移动端', '响应式', '内部知识'],
      content: [
        '移动端空间有限，要优先保留核心任务。次要信息可以折叠、下钻或放到详情页。',
        '移动端常见问题：按钮过小、顶部栏遮挡、搜索框溢出、表格无法阅读、返回路径不清晰、底部导航挡内容。',
        '后台类产品在移动端应减少复杂表格，改用卡片、筛选抽屉、底部操作栏和分段详情。',
        '移动端原型要考虑手指点击区域、键盘弹起、长页面返回、回到顶部、滚动位置保留。',
      ],
      pmApplication: [
        '同一功能至少检查桌面和移动两种布局，不能只交桌面原型。',
        '移动端优先画主任务路径：查看、搜索、筛选、提交、返回，而不是完整复刻所有后台能力。'
      ],
      examples: [
        '案例：桌面端订单列表有 12 列，移动端直接缩放会看不清。改为订单卡片，只展示订单号、客户、状态、金额、更新时间，详情页再展示完整字段。',
      ],
    },
    {
      id: 'admin-prototype-design-9-usability-test',
      groupId: ADMIN_PROTOTYPE_DESIGN_GROUP_ID,
      title: '9. 原型评审与可用性测试',
      summary: '原型做完不是结束，要用真实任务验证用户是否能走通。',
      tags: ['原型设计', '可用性测试', '评审', '内部知识'],
      content: [
        '原型评审分三类：业务评审看流程是否符合业务，设计评审看体验和一致性，研发评审看实现边界和成本。',
        '可用性测试不一定要很正式，找 3-5 个目标用户完成真实任务，就能发现大部分明显问题。',
        '测试时不要教用户怎么点。观察他们在哪里犹豫、点错、找不到、误解文案。',
        '原型测试结果要沉淀为问题清单：问题描述、影响用户、严重程度、修改方案、是否本期处理。',
      ],
      pmApplication: [
        '评审前准备任务脚本，例如“请新增一个客户并分配给区域经理”。',
        '评审后不要只改视觉意见，要优先处理阻断主流程、影响理解和造成错误操作的问题。'
      ],
      examples: [
        '案例：新手用户在“保存配置”和“发布配置”之间犹豫，说明按钮命名不清。改成“保存草稿”和“发布到用户端”，并增加发布确认说明。',
      ],
    },
    {
      id: 'admin-prototype-design-10-handoff',
      groupId: ADMIN_PROTOTYPE_DESIGN_GROUP_ID,
      title: '10. 原型交付与研发协作',
      summary: '原型交付给研发时，要配套规则、字段、状态和验收标准。',
      tags: ['原型设计', '研发协作', '交付', '内部知识'],
      content: [
        '研发不能只靠原型开发。PM 需要同时提供 PRD、字段说明、状态流转、接口依赖、权限规则、埋点和验收标准。',
        '原型标注要说明：按钮行为、跳转路径、弹窗逻辑、字段校验、默认排序、分页规则、异常提示。',
        '如果原型与 PRD 不一致，研发会不知道以哪个为准。因此改原型后要同步更新 PRD 或评审纪要。',
        '交付前要整理“待确认问题”，不要把未定规则藏在原型里。',
      ],
      pmApplication: [
        '交付研发前跑一遍 checklist：页面齐全、状态齐全、字段齐全、权限齐全、异常齐全、验收齐全。',
        '开发中若变更交互，要更新版本记录，说明改了什么、为什么改、影响哪些页面。'
      ],
      examples: [
        '案例：原型里有“导出”按钮，但 PRD 没写导出字段、权限、文件格式和数据量限制，研发只能猜。正确做法是补导出字段表、权限要求和超大数据异步导出规则。',
      ],
    },
  ].map((entry) => ({
    ...entry,
    seedVersion: ADMIN_PROTOTYPE_DESIGN_SEED_VERSION,
  }))
}

function getAdminPmKnowledgeFrameworkSeeds() {
  return [
    {
      id: 'admin-pm-framework-1-overview',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '1. 产品经理知识框架总览',
      summary: '产品经理能力不是零散技能，而是从用户、业务、产品、技术、数据、协作到增长的完整系统。',
      tags: ['产品经理知识体系', '能力框架', 'PM成长', '内部知识'],
      content: [
        '产品经理知识框架可以拆成 9 个模块：行业与商业、用户与场景、需求与规划、产品设计、项目交付、数据分析、技术理解、运营增长、沟通协作。',
        '初级 PM 常从需求和原型开始，但长期成长必须补齐商业判断、系统思维、数据闭环和组织协作能力。',
        '知识框架的意义不是一次学完，而是帮助你判断当前短板：是不会发现问题、不会定义问题、不会设计方案，还是不会推动落地。',
        '一个成熟 PM 的工作闭环是：理解行业 → 洞察用户 → 定义问题 → 设计方案 → 推动交付 → 数据验证 → 复盘沉淀。',
      ],
      pmApplication: [
        '每次学习新知识时，把它归到框架中的一个模块，避免知识碎片化。',
        '做个人成长规划时，用 9 个模块给自己打分，优先补齐影响当前工作的短板。',
      ],
      examples: [
        '案例：如果你正在做后台权限功能，只懂原型不够，还要懂组织角色、RBAC、数据权限、审计日志、异常提示、上线灰度和客服反馈，这就是知识框架的联动。',
      ],
    },
    {
      id: 'admin-pm-framework-2-industry-business',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '2. 行业与商业认知',
      summary: 'PM 要理解产品为什么存在、服务谁、怎么赚钱、行业约束是什么。',
      tags: ['行业认知', '商业模式', 'B端', '内部知识'],
      content: [
        '行业认知包括：产业链、客户类型、业务流程、竞争格局、政策约束、付费方式、采购决策链。',
        '商业认知包括：目标客户、价值主张、收入模式、成本结构、毛利、续费、增长空间和商业风险。',
        'B 端 PM 要尤其理解客户组织结构和采购逻辑：使用者、决策者、付费者、管理员往往不是同一个人。',
        '商业判断决定需求优先级。不是声音最大的客户最重要，而是要看客户价值、复用价值、战略价值和交付成本。',
      ],
      pmApplication: [
        '需求评估时补一列“商业价值”：影响收入、续费、交付成本、客户满意度还是战略样板。',
        '写 PRD 背景时不要只写“客户要求”，要写清业务目标和为什么现在做。',
      ],
      examples: [
        '案例：某客户要求定制报表。如果只是单客户需求，可能不优先；如果多个行业客户都有监管报送需求，就可以抽象成“可配置报表模板”平台能力。',
      ],
    },
    {
      id: 'admin-pm-framework-3-user-scenario',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '3. 用户、场景与问题定义',
      summary: 'PM 的第一能力是定义真实问题，而不是马上给方案。',
      tags: ['用户研究', '场景分析', '问题定义', '内部知识'],
      content: [
        '用户理解包括用户画像、角色分层、任务目标、痛点、动机、行为路径和使用环境。',
        '场景分析要回答：谁，在什么情况下，为了什么目标，遇到什么阻碍，当前怎么解决，为什么现方案不够好。',
        '问题定义要避免把方案当问题。例如“要加导出按钮”不是问题，真正的问题可能是“运营需要离线对账”。',
        '好的问题定义通常包含：目标用户、业务场景、当前痛点、影响范围、成功标准。',
      ],
      pmApplication: [
        '接需求时先问 5 个问题：谁用、什么时候用、现在怎么做、哪里卡、做好后怎么判断有效。',
        'PRD 里单独写“问题定义”，帮助团队区分需求背景和具体方案。',
      ],
      examples: [
        '案例：客服说“需要批量关闭工单”。追问后发现真实问题是重复工单太多。最终方案可能不是批量关闭，而是重复工单识别和合并。',
      ],
    },
    {
      id: 'admin-pm-framework-4-demand-planning',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '4. 需求管理与产品规划',
      summary: '需求管理负责把想法变成有优先级、有边界、有节奏的产品计划。',
      tags: ['需求管理', '产品规划', '优先级', 'Roadmap', '内部知识'],
      content: [
        '需求管理包括：需求收集、需求澄清、价值评估、优先级排序、版本规划、范围控制、变更管理。',
        '常用方法包括 RICE、MoSCoW、KANO、优先级矩阵、影响地图、OKR 对齐。',
        '产品规划要区分长期方向和短期版本。Roadmap 不是承诺清单，而是围绕目标分阶段推进的策略。',
        '需求边界比功能清单更重要。要明确本期做什么、不做什么、为什么不做。',
      ],
      pmApplication: [
        '评审需求时同时看用户价值、商业价值、技术成本、风险、复用性和紧急程度。',
        '版本规划要输出“目标 + 范围 + 不做清单 + 指标 + 风险”，不要只有功能列表。',
      ],
      examples: [
        '案例：V1 做客户列表、搜索、详情和手动分配；V2 再做批量导入、自动分配和数据看板。这样能先验证核心流程，再平台化高级能力。',
      ],
    },
    {
      id: 'admin-pm-framework-5-product-design',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '5. 产品设计与交互表达',
      summary: '产品设计不是画界面，而是把业务规则转成用户可理解、可操作的流程。',
      tags: ['产品设计', '交互设计', '原型', 'PRD', '内部知识'],
      content: [
        '产品设计包括信息架构、用户流程、页面结构、交互状态、异常兜底、文案提示和权限状态。',
        'PM 的设计产物通常包括流程图、原型图、字段表、状态机、权限矩阵、PRD 和验收标准。',
        '好的设计要兼顾三件事：用户能完成任务、研发能理解实现、业务能确认规则。',
        '复杂后台产品要特别关注列表、详情、表单、配置、搜索筛选、批量操作、导入导出。',
      ],
      pmApplication: [
        '画原型前先画流程，写 PRD 前先定义对象和状态。',
        '每个关键页面至少补齐：默认态、空态、加载态、错误态、无权限态和成功反馈。',
      ],
      examples: [
        '案例：新增成员功能需要原型展示邀请入口、邮箱校验、角色选择、发送中、邀请成功、邮箱已存在、无权限邀请等状态。',
      ],
    },
    {
      id: 'admin-pm-framework-6-project-delivery',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '6. 项目交付与研发协作',
      summary: 'PM 不只负责想方案，还要推动方案按质量、节奏和边界落地。',
      tags: ['项目管理', '研发协作', '交付', '内部知识'],
      content: [
        '交付能力包括需求评审、排期、任务拆分、风险识别、进度跟踪、测试验收、上线准备和复盘。',
        'PM 要理解研发、测试、设计、运营、客服、销售等角色在交付链路中的职责。',
        '常用协作方法包括 Scrum、看板、RACI、风险清单、上线 Checklist、UAT 验收。',
        '交付中的核心能力是边界管理：需求变更怎么处理，延期怎么沟通，风险怎么升级。',
      ],
      pmApplication: [
        '需求进入开发前，确认 PRD、原型、字段、接口、权限、埋点、验收标准都完整。',
        '上线前准备公告、灰度策略、回滚方案、监控指标、客服话术和用户反馈渠道。',
      ],
      examples: [
        '案例：一个导入功能上线前，PM 不只验上传成功，还要验模板下载、错误报告、重复数据、权限限制、大文件超时和失败重试。',
      ],
    },
    {
      id: 'admin-pm-framework-7-data-analysis',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '7. 数据分析与指标闭环',
      summary: '数据能力帮助 PM 判断问题是否真实、方案是否有效、下一步该优化什么。',
      tags: ['数据分析', '指标体系', '埋点', '内部知识'],
      content: [
        '数据分析包括指标定义、埋点设计、数据看板、漏斗分析、留存分析、A/B 测试、归因分析和复盘。',
        '指标要分层：北极星指标、业务指标、过程指标、质量指标、风险指标。',
        '指标必须有口径。没有口径的数据会造成争议，例如“活跃用户”到底是登录、浏览、完成任务还是产生价值行为。',
        '数据闭环不是只看涨跌，而是要能解释原因，并推动下一轮产品动作。',
      ],
      pmApplication: [
        '每个需求在 PRD 中写清成功指标、埋点事件、字段、触发时机和分析维度。',
        '上线后用数据复盘：有没有人用、是否完成目标、哪里流失、是否带来副作用。',
      ],
      examples: [
        '案例：搜索功能上线后搜索次数增加，但转化没提升。拆漏斗后发现搜索结果点击率低，说明问题不在搜索入口，而在结果排序和摘要信息。',
      ],
    },
    {
      id: 'admin-pm-framework-8-technical-literacy',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '8. 技术理解与系统思维',
      summary: 'PM 不需要写代码，但要理解技术边界、系统依赖和实现成本。',
      tags: ['技术理解', '系统架构', '接口', '内部知识'],
      content: [
        '技术理解包括前后端、数据库、缓存、接口、消息队列、权限、安全、日志、监控、部署和灰度。',
        '系统思维要求 PM 能看懂一个功能背后的数据流、状态流、权限流和异常链路。',
        '技术判断不是替研发做方案，而是能提出正确问题：数据在哪、同步还是异步、失败怎么办、是否可回滚。',
        '技术理解越强，需求边界越清楚，评审效率越高，返工越少。',
      ],
      pmApplication: [
        '复杂需求评审前，准备一张简化架构图或系统交互图。',
        '涉及第三方、设备、支付、权限、数据同步时，一定补异常、幂等、日志和人工兜底。',
      ],
      examples: [
        '案例：账号同步失败时，如果没有日志和重试机制，用户只看到“无法登录”。PM 应要求后台记录失败原因，并提供重新绑定或人工处理入口。',
      ],
    },
    {
      id: 'admin-pm-framework-9-growth-operation',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '9. 运营增长与用户生命周期',
      summary: '产品上线后需要通过运营和增长手段持续提升使用、留存和转化。',
      tags: ['运营增长', '用户生命周期', 'AARRR', '内部知识'],
      content: [
        '运营增长包括拉新、激活、留存、转化、召回、推荐和用户教育。',
        '不同产品阶段关注不同指标：早期看激活和核心行为，中期看留存和转化，成熟期看效率和商业化。',
        '用户生命周期要看新手期、成长期、成熟期、沉默期和流失期，每个阶段需要不同触达策略。',
        'B 端增长不等于做活动，更多是提升使用深度、客户成功、续费、培训和组织内扩散。',
      ],
      pmApplication: [
        '设计新功能时同步考虑新手引导、默认模板、帮助文档、消息触达和使用反馈。',
        '如果用户不用功能，先分析是不知道、不理解、不会用、不信任，还是没有场景。',
      ],
      examples: [
        '案例：知识库功能上线后没人用，原因不是功能差，而是用户不知道如何分类沉淀。增加首次引导、示例模板和首页入口后，新增知识数提升。',
      ],
    },
    {
      id: 'admin-pm-framework-10-communication-leadership',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '10. 沟通协作与影响力',
      summary: '产品经理没有天然权力，靠结构化表达、共识构建和推进能力影响团队。',
      tags: ['沟通协作', '影响力', '跨部门', '内部知识'],
      content: [
        'PM 的沟通对象包括用户、业务、研发、测试、设计、运营、销售、客服、管理层。',
        '不同对象关心点不同：用户关心能否解决问题，研发关心边界和成本，管理层关心目标和结果。',
        '结构化表达通常按“背景 → 问题 → 目标 → 方案 → 影响 → 风险 → 下一步”组织。',
        '影响力来自持续可靠：需求清楚、判断有依据、承诺可兑现、问题能兜底。',
      ],
      pmApplication: [
        '重要沟通前先写 1 页纸：目标是什么、要对方做什么决定、有哪些选项和风险。',
        '冲突时先回到共同目标，再讨论方案取舍，不要陷入个人偏好争论。',
      ],
      examples: [
        '案例：研发认为某需求成本高，业务认为必须做。PM 可以拆成 MVP 和后续版本，先满足关键流程，再把低频边界放到二期。',
      ],
    },
    {
      id: 'admin-pm-framework-11-pm-levels',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '11. 产品经理成长阶段',
      summary: '不同阶段的 PM 关注点不同，从执行需求到定义方向，再到构建体系。',
      tags: ['PM成长', '能力阶段', '职业发展', '内部知识'],
      content: [
        '初级 PM：能写清需求、画清原型、跟进开发、完成验收。重点是执行质量和基础方法。',
        '中级 PM：能独立负责模块，理解业务目标，做需求取舍，推动跨角色协作。',
        '高级 PM：能负责产品线或平台能力，搭建体系，处理复杂利益关系，推动长期指标。',
        '负责人/专家：能定义方向、组织资源、建立机制，影响业务结果和团队能力。',
      ],
      pmApplication: [
        '评估自己时不要只看工作年限，要看能独立负责多大问题、影响多少用户和业务结果。',
        '成长最快的方法是每个项目后复盘：判断错在哪里、信息缺在哪里、协作卡在哪里、下次如何提前规避。',
      ],
      examples: [
        '案例：初级 PM 接到“加筛选项”会直接画页面；中级 PM 会问筛选的业务场景和使用频率；高级 PM 会判断是否需要统一筛选配置能力。',
      ],
    },
    {
      id: 'admin-pm-framework-12-learning-roadmap',
      groupId: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      title: '12. 产品经理学习路线图',
      summary: '按阶段学习产品知识，先建立基础闭环，再补齐专项能力。',
      tags: ['学习路线', 'PM成长', '知识体系', '内部知识'],
      content: [
        '第一阶段：产品基础。学习角色认知、用户场景、需求分析、PRD、原型、评审、上线和复盘。',
        '第二阶段：业务与数据。学习商业模式、行业分析、指标体系、埋点、漏斗、留存和 A/B 测试。',
        '第三阶段：平台与技术。学习权限、数据模型、接口、系统架构、配置化、流程引擎和多租户。',
        '第四阶段：增长与组织。学习用户生命周期、运营增长、客户成功、路线图、跨部门推进和影响力。',
        '学习方法：每学一个概念，都用“定义 + 场景 + 案例 + PM 应用 + 常见误区”沉淀到自己的知识库。',
      ],
      pmApplication: [
        '如果你是新人，先不要贪多，优先掌握“需求 → 原型 → PRD → 评审 → 验收”的基础闭环。',
        '如果你已进入平台/B端方向，重点补权限、组织、数据模型、流程、配置化和系统集成。',
      ],
      examples: [
        '案例：学习 KANO 模型后，不只记住兴奋型需求，还要拿自己的功能做分类：哪些是基础必备、哪些是性能提升、哪些是惊喜点。',
      ],
    },
  ].map((entry) => ({
    ...entry,
    seedVersion: ADMIN_PM_KNOWLEDGE_FRAMEWORK_SEED_VERSION,
  }))
}

function ensureSuperAdminArchitectureKnowledgeSeed() {
  if (!Auth().isSuperAdmin?.()) return false
  if (adminArchitectureSeedPromise) return true
  const now = new Date().toISOString()
  const groupsToEnsure = [
    {
      id: ADMIN_ARCHITECTURE_GROUP_ID,
      name: '系统架构（内部）',
      description: '仅超级管理员可见的内部架构知识沉淀',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: ADMIN_SOFTWARE_PLATFORM_GROUP_ID,
      name: '软件平台',
      description: '仅超级管理员可见的软件平台产品经理知识体系',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: ADMIN_PROTOTYPE_DESIGN_GROUP_ID,
      name: '产品经理原型设计',
      description: '仅超级管理员可见的产品经理原型设计知识体系',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: ADMIN_PM_KNOWLEDGE_FRAMEWORK_GROUP_ID,
      name: '产品经理知识框架体系',
      description: '仅超级管理员可见的产品经理完整知识框架体系',
      createdAt: now,
      updatedAt: now,
    },
  ]
  const groups = loadKnowledgeGroups()
  const items = loadCustomKnowledge()
  const seeds = [
    ...getAdminArchitectureKnowledgeSeeds(),
    ...getAdminSoftwarePlatformKnowledgeSeeds(),
    ...getAdminPrototypeDesignKnowledgeSeeds(),
    ...getAdminPmKnowledgeFrameworkSeeds(),
  ]
  let changed = false
  let nextGroups = groups
  for (const group of groupsToEnsure) {
    const hadGroup = nextGroups.some((g) => g.id === group.id)
    nextGroups = hadGroup
      ? nextGroups.map((g) => (g.id === group.id ? { ...g, ...group, createdAt: g.createdAt || now } : g))
      : [group, ...nextGroups]
    changed = changed || !hadGroup
  }
  const byId = new Map(items.map((item) => [item.id, item]))
  for (const seed of seeds) {
    const existing = byId.get(seed.id)
    if (!existing || Number(existing.seedVersion || 0) < Number(seed.seedVersion || 0)) {
      byId.set(seed.id, {
        ...existing,
        ...seed,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      })
      changed = true
    }
  }
  if (!changed) return false
  adminArchitectureSeedPromise = Promise.resolve()
    .then(() => saveKnowledgeGroups(nextGroups))
    .then(() => saveCustomKnowledge(Array.from(byId.values())))
    .then(() => {
      adminArchitectureSeedPromise = null
      render()
    })
    .catch((e) => {
      adminArchitectureSeedPromise = null
      console.warn('seed admin architecture knowledge failed:', e)
    })
  return true
}

function updateKnowledgeFormDraftFromDom() {
  const form = knowledgeState.form || emptyKnowledgeForm()
  knowledgeState.form = {
    ...form,
    groupId: document.getElementById('kf-group')?.value || form.groupId || 'default',
    title: document.getElementById('kf-title')?.value || '',
    summary: document.getElementById('kf-summary')?.value || '',
    tags: Array.isArray(form.tags) ? form.tags : [],
    contentText: document.getElementById('kf-content')?.value || '',
  }
  knowledgeState.tagInput = document.getElementById('kf-tag-input')?.value || ''
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
  const allTags = [...new Set(K.getMyKnowledgeItems().flatMap((item) => item.tags || []))].filter(Boolean)
  const activeGroupName = groupId === 'all'
    ? '全部分组'
    : (groups.find((g) => g.id === groupId)?.name || '当前分组')

  return `
    <div class="page my-knowledge-page">
      <header class="memory-header my-knowledge-header">
        <h1>我的知识库</h1>
        <p>自定义分组、新增与编辑个人知识，支持关键词与分组筛选。</p>
        <div class="my-knowledge-stats" aria-label="我的知识库统计">
          <span><strong>${total}</strong> 个知识点</span>
          <span><strong>${groups.length}</strong> 个分组</span>
          <span><strong>${allTags.length}</strong> 个标签</span>
        </div>
      </header>
      <div class="my-knowledge-layout">
        <aside class="my-knowledge-sidebar">
          <button type="button" class="btn-secondary btn-block" id="btn-new-group">+ 新建分组</button>
          <nav class="group-nav">
            <button type="button" class="group-nav-item ${groupId === 'all' ? 'active' : ''}" data-group="all">全部 <span class="nav-count">${total}</span></button>
            ${groups.map((g) => `
              <div class="group-nav-row ${groupId === g.id ? 'active' : ''}">
                <button type="button" class="group-nav-item" data-group="${g.id}">
                  <span class="group-nav-name">${escapeHtml(g.name)}</span>
                  <span class="nav-count">${groupCounts[g.id] || 0}</span>
                </button>
                <button type="button" class="group-more-btn" data-group-menu="${g.id}" aria-label="分组操作：${escapeHtml(g.name)}" aria-expanded="${myKnowledgeState.openGroupMenu === g.id}">
                  <span aria-hidden="true">⋯</span>
                </button>
                ${myKnowledgeState.openGroupMenu === g.id ? `
                  <div class="group-action-menu">
                    <button type="button" class="group-action-menu-item btn-edit-group" data-id="${g.id}">编辑分组</button>
                    ${g.id !== 'default' ? `<button type="button" class="group-action-menu-item danger btn-del-group" data-id="${g.id}">删除分组</button>` : ''}
                  </div>` : ''}
              </div>`).join('')}
          </nav>
          ${myKnowledgeState.showGroupForm ? renderGroupForm() : ''}
        </aside>
        <main class="my-knowledge-main">
          <div class="my-knowledge-toolbar">
            <input type="search" id="my-k-search" placeholder="搜索标题、标签、正文、分组…" value="${escapeHtml(q)}" />
            <span class="my-knowledge-filter-pill">${escapeHtml(activeGroupName)} · ${items.length} 条</span>
            <a href="#/my-knowledge/add${groupId !== 'all' ? `?group=${groupId}` : ''}" class="btn-primary">+ 新增知识</a>
          </div>
          <div class="article-list my-knowledge-list">
            ${items.length ? items.map((item, i) => `
              <div class="article-card custom-item my-knowledge-item-card">
                <a href="#/my-knowledge/view/${item.id}" class="my-knowledge-item-link">
                  <span class="article-index">${String(i + 1).padStart(2, '0')}</span>
                  <div class="article-card-body">
                    <h3>${escapeHtml(item.title)} <span class="custom-badge">${escapeHtml(item.groupName)}</span></h3>
                    <p>${escapeHtml(item.summary)}</p>
                    <div class="article-tags">${(item.tags || []).slice(0, 4).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
                  </div>
                </a>
                <div class="my-knowledge-card-actions">
                  <label for="move-${escapeHtml(item.id)}">移动到</label>
                  <select id="move-${escapeHtml(item.id)}" class="my-knowledge-move-select" data-id="${escapeHtml(item.id)}">
                    ${groups.map((g) => `<option value="${g.id}" ${item.groupId === g.id ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
                  </select>
                </div>
              </div>`).join('') : '<p class="empty-hint">暂无知识，点击「新增知识」开始记录</p>'}
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
  }

  const { params } = parseRoute()
  if (!editing && params.get('group')) {
    knowledgeState.form.groupId = params.get('group')
  }

  const f = knowledgeState.form
  const isEdit = Boolean(editing)

  return `
    <div class="page knowledge-form-page">
      <div class="knowledge-form-header">
        <h1>${isEdit ? '编辑知识点' : '新增知识点'}</h1>
        <p>保存后存入「我的知识库」，可按分组管理，也可用标签做跨分组检索。</p>
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
          <p class="form-hint tag-definition">标签用于标记知识点的属性或场景，例如「面试」「方法论」「数据分析」。它不替代分组，主要用于搜索与快速识别。</p>
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
    if (!Auth().isLoggedIn()) {
      showToast(t('auth.noteLoginRequired', null, '请先登录后再添加笔记'), 'info')
      return
    }
    articleNotesEditState = { id: null, composing: true }
    render()
    document.getElementById('hub-note-content')?.focus()
  })

  document.getElementById('btn-hub-note-compose-cancel')?.addEventListener('click', () => {
    articleNotesEditState = { id: null, composing: false }
    render()
  })

  document.getElementById('btn-hub-note-create')?.addEventListener('click', async () => {
    if (!Auth().isLoggedIn()) {
      showToast(t('auth.noteLoginRequired', null, '请先登录后再添加笔记'), 'info')
      return
    }
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
    updateKnowledgeFormDraftFromDom()
    const input = document.getElementById('kf-tag-input')
    const tag = input?.value.trim()
    if (tag && !knowledgeState.form.tags.includes(tag)) {
      knowledgeState.form.tags.push(tag)
      knowledgeState.tagInput = ''
      render()
    }
  })

  document.getElementById('kf-tag-input')?.addEventListener('input', (e) => {
    knowledgeState.tagInput = e.target.value
  })

  document.getElementById('kf-tag-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      document.getElementById('kf-add-tag')?.click()
    }
  })

  document.querySelectorAll('#kf-tags .removable').forEach(el => {
    el.addEventListener('click', () => {
      updateKnowledgeFormDraftFromDom()
      knowledgeState.form.tags = knowledgeState.form.tags.filter(t => t !== el.dataset.tag)
      render()
    })
  })

  document.getElementById('kf-save')?.addEventListener('click', async () => {
    updateKnowledgeFormDraftFromDom()
    const btn = document.getElementById('kf-save')
    const title = knowledgeState.form.title.trim()
    const summary = knowledgeState.form.summary.trim()
    const groupId = knowledgeState.form.groupId
    const contentText = knowledgeState.form.contentText || ''
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
  document.querySelectorAll('.my-knowledge-move-select').forEach((select) => {
    select.addEventListener('click', (e) => e.stopPropagation())
    select.addEventListener('change', async (e) => {
      const itemId = e.target.dataset.id
      const nextGroupId = e.target.value
      const groups = loadKnowledgeGroups()
      const groupName = groups.find((g) => g.id === nextGroupId)?.name || '目标分组'
      const now = new Date().toISOString()
      const items = loadCustomKnowledge().map((item) => (
        item.id === itemId ? { ...item, groupId: nextGroupId, updatedAt: now } : item
      ))
      await saveCustomKnowledge(items)
      showToast(`已移动到「${groupName}」`, 'success')
      render()
    })
  })
  document.querySelectorAll('.group-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      myKnowledgeState.groupId = btn.dataset.group
      myKnowledgeState.openGroupMenu = null
      render()
    })
  })
  document.querySelectorAll('.group-more-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const id = btn.dataset.groupMenu
      myKnowledgeState.openGroupMenu = myKnowledgeState.openGroupMenu === id ? null : id
      render()
    })
  })
  document.getElementById('btn-new-group')?.addEventListener('click', () => {
    myKnowledgeState.showGroupForm = true
    myKnowledgeState.editingGroup = null
    myKnowledgeState.openGroupMenu = null
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
      myKnowledgeState.openGroupMenu = null
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
      myKnowledgeState.openGroupMenu = null
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
  return renderLoginGate({ title: t('auth.requiredTitle'), desc: message || t('auth.requiredDefault') })
}

function renderPersonalLoginGate() {
  return renderLoginGate({
    eyebrow: t('nav.sectionPersonal'),
    title: t('auth.personalGateTitle'),
    desc: t('auth.personalGateDesc'),
    footnote: t('auth.personalGateFootnote'),
    ctaLabel: t('auth.personalGateCta'),
  })
}

function renderLoginGate({ eyebrow, title, desc, features = [], featuresTitle, footnote, showGuestHint = true, ctaLabel }) {
  const featureHtml = features.length
    ? `<div class="login-gate-features-block">
        ${featuresTitle ? `<p class="login-gate-features-title">${escapeHtml(featuresTitle)}</p>` : ''}
        <ul class="login-gate-features">
          ${features
            .map((f) => {
              if (typeof f === 'string') return `<li>${escapeHtml(f)}</li>`
              return `<li><strong>${escapeHtml(f.title)}</strong><span>${escapeHtml(f.desc)}</span></li>`
            })
            .join('')}
        </ul>
      </div>`
    : ''
  return `
    <div class="page login-gate-page">
      <div class="login-gate-card">
        ${eyebrow ? `<p class="login-gate-eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
        <h1>${escapeHtml(title || t('auth.requiredTitle'))}</h1>
        <p class="login-gate-desc">${escapeHtml(desc || t('auth.requiredDefault'))}</p>
        ${featureHtml}
        <div class="login-gate-actions">
          <a href="#/login" class="btn-primary">${escapeHtml(ctaLabel || t('auth.cta'))}</a>
        </div>
        ${footnote ? `<p class="login-gate-footnote">${escapeHtml(footnote)}</p>` : ''}
        ${showGuestHint ? `<p class="login-gate-note">${escapeHtml(t('auth.guestBrowseHint'))}</p>` : ''}
      </div>
    </div>`
}

function scrollKbDocGroupAnchor() {
  const { params } = parseRoute()
  const group = params.get('group')
  if (!group) return
  requestAnimationFrame(() => {
    document.getElementById(`group-${group}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
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
      navigate(isMobileViewport() ? '/m/account' : '/')
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
        navigate(isMobileViewport() ? '/m/account' : '/')
        render()
      } else showToast(t('auth.toastConfirmEmail'), 'info')
    } catch (err) { showToast(err.message, 'error') }
  })
}

function bindResetPasswordEvents() {
  document.getElementById('auth-update-password')?.addEventListener('click', async () => {
    const input = document.getElementById('auth-new-password')
    const password = input?.value
    if (!password || password.length < 6) return showToast(t('auth.passwordTooShort'), 'error')
    try {
      await Auth().updatePassword(password)
      if (input) input.value = ''
      showToast(t('auth.passwordUpdated'), 'success')
      if ((location.hash || '').startsWith('#/reset-password')) navigate('/')
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
let topbarHelpBound = false
let topbarNotificationDocBound = false
let notificationScanTimer = null
let notificationScanInFlight = false
function bindTopbarHelpEvents() {
  if (topbarHelpBound) return
  topbarHelpBound = true
  document.getElementById('topbar-help-btn')?.addEventListener('click', () => {
    const { parts } = parseRoute()
    if (!parts.length) {
      openHomeOnboarding()
      return
    }
    try { sessionStorage.setItem(GUIDE_PENDING_KEY, '1') } catch (_) {}
    navigate('/')
  })
}

function bindTopbarNotificationEvents() {
  if (!topbarNotificationDocBound) {
    topbarNotificationDocBound = true
    window.addEventListener('pdm:notifications', () => {
      renderTopbarNotifications()
      if ((location.hash || '').startsWith('#/notifications')) render()
    })
  }
}

async function scanNotificationsSoon() {
  const api = window.PDMNotifications
  if (!api?.scanForumReplies || notificationScanInFlight) return
  notificationScanInFlight = true
  try {
    await api.scanForumReplies()
  } catch (_) {
  } finally {
    notificationScanInFlight = false
  }
}

function scheduleNotificationScans() {
  if (!window.PDMNotifications?.scanForumReplies || notificationScanTimer) return
  scanNotificationsSoon()
  notificationScanTimer = window.setInterval(scanNotificationsSoon, 180000)
}

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

  document.querySelectorAll('[data-account-menu-link]').forEach((link) => {
    link.addEventListener('click', () => {
      saveAccountMenuOrigin()
      closeMenu()
    })
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
    reviewContent = `<div class="empty-state"><p>还没有复盘记录</p><p class="empty-hint">定期回顾学习与实践，用结构化复盘加速成长</p></div>`
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
      <section class="memory-section">
        <div class="section-toolbar"><h2>我的复盘</h2><button class="btn-primary" id="btn-new-review">+ 新建复盘</button></div>
        ${reviewContent}
      </section>
    </div>`
}

let pendingImportMode = 'merge'

function bindReviewEvents() {
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

function syncSiteWatermark() {
  const el = document.getElementById('site-watermark')
  if (!el) return
  el.textContent = t('home.siteWatermark', null, '\u00a9 2026 Justine WU. All rights reserved.')
}

function syncMobileScrollTopLabel() {
  const el = document.getElementById('mobile-scroll-top')
  if (!el) return
  const label = t('common.backToTop', null, '回到顶部')
  el.textContent = label
  el.setAttribute('aria-label', label)
  el.setAttribute('title', label)
}

function render() {
  const { parts } = parseRoute()
  const path = '/' + parts.join('/')

  rememberCurrentMobileTabRoute()

  renderLocaleSwitcher()
  renderTopAccount(path)
  renderSidebar(path)
  renderMobileChrome(path)
  renderTopbarCrumbs(buildCrumbsFromRoute(parts))
  syncSiteWatermark()
  renderTopbarHelp()
  renderTopbarNotifications()
  syncMobileScrollTopLabel()
  syncCopyProtectionState()
  bindLocaleEvents()
  bindTopbarHelpEvents()
  bindTopbarNotificationEvents()
  bindTopAccountEvents()
  bindMobileNavChrome()
  bindMobileViewportWatcher()
  bindMobileScrollTopButton()
  bindSyncEvents()
  scheduleNotificationScans()
  syncMobileChromeOffsets()

  const forbiddenHtml = renderForbidden()

  const main = document.getElementById('main')
  const routePerm = Perm().routeFeature(parts)
  if (routePerm?.feature && routePerm.feature !== 'admin' && !Perm().can(routePerm.feature, routePerm.action)) {
    const personalFeatures = ['favorites', 'notes', 'myKnowledge', 'reviews', 'dailyLearn']
    // 未登录访问个人能力：引导登录，而不是「无权访问」
    if (!Auth().isLoggedIn() && personalFeatures.includes(routePerm.feature)) {
      main.innerHTML = renderPersonalLoginGate()
      return
    }
    main.innerHTML = renderPermissionDenied()
    return
  }

  if (parts.length === 0) {
    main.innerHTML = renderHome()
    bindHomeEvents()
    Analytics()?.track('page_view', { page: 'home' })
  } else if (parts[0] === 'm' && parts[1] === 'learn') {
    navigate('/industry')
    return
  } else if (parts[0] === 'm' && parts[1] === 'knowledge') {
    main.innerHTML = renderMobileKnowledgeHub()
  } else if (parts[0] === 'm' && parts[1] === 'personal') {
    main.innerHTML = renderMobilePersonalHub()
  } else if (parts[0] === 'kb') {
    main.innerHTML = renderKnowledgeHubPage()
    bindKnowledgeHubEvents()
    Analytics()?.track('page_view', { page: 'kb-home' })
  } else if (parts[0] === 'personal') {
    main.innerHTML = renderPersonalHubPage()
    Analytics()?.track('page_view', { page: 'personal-hub' })
  } else if (parts[0] === 'm' && parts[1] === 'account') {
    main.innerHTML = renderMobileAccountHub()
    bindMobileAccountHub()
  } else if (parts[0] === 'account') {
    main.innerHTML = renderAccountProfilePage()
    if (Auth().isLoggedIn()) bindAccountProfileActions()
    Analytics()?.track('page_view', { page: 'account' })
  } else if (parts[0] === 'notifications') {
    main.innerHTML = renderNotificationsPage()
    bindNotificationsPageEvents()
    Analytics()?.track('page_view', { page: 'notifications' })
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
    renderFeedbackRoute()
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
  } else if (parts[0] === 'industry' && parts[1] === 'learning-path' && parts[2] === 'path-overview') {
    navigate('/industry/learning-path')
    return
  } else if (parts[0] === 'industry' && parts[1] === 'learning-path' && parts[2]) {
    const path = window.PDMIndustry?.getLearningPath?.(parts[2])
    if (path) {
      main.innerHTML = Sections().renderLearningPathDetail(parts[2])
      Sections().bindLearningPathDetail(parts[2])
      Analytics()?.track('page_view', { page: 'learning-path', id: parts[2] })
    } else {
      main.innerHTML = Sections().renderIndustryArticle(parts[1], parts[2])
      Analytics()?.track('page_view', { page: 'industry', id: parts[2] })
    }
  } else if (parts[0] === 'industry' && parts[1] && parts[2]) {
    main.innerHTML = Sections().renderIndustryArticle(parts[1], parts[2])
    Analytics()?.track('page_view', { page: 'industry', id: parts[2] })
  } else if (parts[0] === 'industry' && parts[1]) {
    main.innerHTML = Sections().renderIndustrySection(parts[1])
    if (parts[1] === 'overview') Sections().bindOverviewTabs?.()
    Analytics()?.track('page_view', { page: 'industry-section', id: parts[1] })
  } else if (parts[0] === 'industry') {
    main.innerHTML = Sections().renderIndustryHub()
    Analytics()?.track('page_view', { page: 'industry' })
  } else if (parts[0] === 'tools') {
    const catId = parts[1] || null
    main.innerHTML = Sections().renderToolsHub(catId)
    Sections().bindToolsHub(catId)
    Analytics()?.track('page_view', { page: 'tools', id: catId || 'hub' })
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
    scrollKbDocGroupAnchor()
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
    if (window.PDMKnowledgeViews?.isGroupedDoc?.(parts[1], docId)) {
      navigate(`/doc/${parts[1]}/${docId}?group=${encodeURIComponent(parts[3])}`)
      return
    }
    const html = window.PDMKnowledgeViews?.renderChapter?.(parts[1], docId, decodeURIComponent(parts[3]))
    main.innerHTML = html || `<div class="page"><p>${escapeHtml(t('common.notFound'))}</p></div>`
    Analytics()?.track('page_view', { page: 'kb-chapter', id: `${parts[1]}/${docId}/${parts[3]}` })
  } else if (parts[0] === 'glossary') {
    main.innerHTML = window.PDMKnowledgeViews?.renderGlossary?.() || `<div class="page"><p>${escapeHtml(t('common.notFound'))}</p></div>`
    window.PDMKnowledgeViews?.bindModulePage?.()
    Analytics()?.track('page_view', { page: 'glossary' })
  } else if (parts[0] === 'mindmap') {
    main.innerHTML = window.PDMKnowledgeViews?.renderMindmap?.() || `<div class="page"><p>${escapeHtml(t('common.notFound'))}</p></div>`
    window.PDMKnowledgeViews?.bindModulePage?.()
    Analytics()?.track('page_view', { page: 'mindmap' })
  } else if (parts[0] === 'module' && parts[1] === 'reference' && parts[2] === 'path') {
    navigate('/industry/learning-path/kb-4stage')
    return
  } else if (parts[0] === 'module' && parts[1] === 'reference' && parts[2] === 'glossary') {
    navigate('/glossary')
    return
  } else if (parts[0] === 'module' && parts[1] === 'reference' && parts[2] === 'mindmap') {
    navigate('/mindmap')
    return
  } else if (parts[0] === 'module' && parts[1] === 'workflow' && parts[2] === 'retro') {
    navigate('/category/workflow')
    return
  } else if (parts[0] === 'module' && parts[1] && parts[2]) {
    const html = window.PDMKnowledgeViews?.renderModule?.(parts[1], parts[2])
    if (!html) {
      main.innerHTML = `<div class="page"><p>${escapeHtml(t('common.notFound'))}</p><a href="#/category/${parts[1]}">${escapeHtml(t('common.backHome'))}</a></div>`
    } else {
      main.innerHTML = html
      window.PDMKnowledgeViews?.bindModulePage?.()
      Analytics()?.track('page_view', { page: 'kb-module', id: `${parts[1]}/${parts[2]}` })
    }
  } else if (parts[0] === 'category' && parts[1] && ['methodology', 'architecture'].includes(parts[1])) {
    navigate('/kb')
    return
  } else if (parts[0] === 'category' && parts[1] === 'reference') {
    navigate('/glossary')
    return
  } else if (parts[0] === 'category' && parts[1] && ['interview', 'skills', 'domain'].includes(parts[1])) {
    navigate('/doc/methodology/career-playbook')
    return
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
    if (!Auth().isLoggedIn()) main.innerHTML = renderPersonalLoginGate()
    else {
      main.innerHTML = renderFavoritesPage()
      Analytics()?.track('page_view', { page: 'favorites' })
    }
  } else if (parts[0] === 'notes') {
    if (!Auth().isLoggedIn()) main.innerHTML = renderPersonalLoginGate()
    else {
      main.innerHTML = renderArticleNotesHub()
      bindArticleNotesHubEvents()
      Analytics()?.track('page_view', { page: 'notes' })
    }
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
      const routeKey = `edit:${parts[2]}`
      if (lastKnowledgeRoute !== routeKey) {
        const editing = K.getMyKnowledgeEntry(parts[2])
        if (editing) {
          knowledgeState.form = {
            groupId: editing.groupId,
            title: editing.title,
            summary: editing.summary,
            tags: [...(editing.tags || [])],
            contentText: (editing.content || []).join('\n\n'),
          }
          knowledgeState.tagInput = ''
        }
        lastKnowledgeRoute = routeKey
      }
      main.innerHTML = renderKnowledgeForm(parts[2])
      bindKnowledgeFormEvents()
    }
  } else if (parts[0] === 'my-knowledge') {
    if (!Auth().isLoggedIn()) main.innerHTML = renderLoginRequired(t('auth.requiredMyKnowledge'))
    else {
      if (ensureSuperAdminArchitectureKnowledgeSeed()) {
        main.innerHTML = `<div class="page"><p>${escapeHtml(t('common.loading'))}</p></div>`
        return
      }
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
      main.innerHTML = renderPersonalLoginGate()
    } else {
      main.innerHTML = renderDailyLearnPage()
      bindDailyLearnEvents()
      Analytics()?.track('page_view', { page: 'daily-learn' })
    }
  } else if (parts[0] === 'reviews' || parts[0] === 'memory') {
    if (!Auth().isLoggedIn()) main.innerHTML = renderPersonalLoginGate()
    else {
      main.innerHTML = renderReviews()
      bindReviewEvents()
    }
  } else {
    main.innerHTML = renderHome()
  }

  if (isMobileViewport()) {
    ensureMobilePageChromeForCurrentRoute()
    requestAnimationFrame(() => syncMobileChromeOffsets())
    restoreMobileScrollPosition()
  }
}

window.addEventListener('hashchange', (event) => {
  let oldHash = currentMobileScrollKey
  try {
    oldHash = new URL(event.oldURL).hash || oldHash
  } catch (_) {}
  saveMobileScrollPosition(routeScrollKey(oldHash))
  render()
})
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
    ensureMobilePageChromeForCurrentRoute()
    syncMobileChromeOffsets()
  }
  if (mq.addEventListener) mq.addEventListener('change', onChange)
  else mq.addListener(onChange)
  window.addEventListener('resize', () => {
    if (isMobileViewport()) {
      ensureMobilePageChromeForCurrentRoute()
      syncMobileChromeOffsets()
    }
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
bindInternalRouteGuard()
bindCopyProtection()
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
