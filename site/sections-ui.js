/**
 * 行业认知 / 工具库 / 论坛 页面渲染
 */
;(function () {
  const Industry = () => window.PDMIndustry
  const Tools = () => window.PDMTools
  const Forum = () => window.PDMForum
  const tr = (key, params, fallback) => window.PMLabI18n?.t(key, params, fallback) ?? fallback ?? key
  const ui = (group, key, params) => tr(`content.${group}.${key}`, params)

  function renderLearningPathCards(paths, compact) {
    return paths.map((p) => `
      <a href="#/industry/learning-path/${p.id}" class="learning-path-card ${compact ? 'learning-path-card-compact' : ''}">
        ${p.badge ? `<span class="path-badge">${window.escapeHtml(p.badge)}</span>` : ''}
        <h3>${window.escapeHtml(p.title)}</h3>
        <p>${window.escapeHtml(p.summary)}</p>
        <div class="learning-path-meta">
          <span>${window.escapeHtml(p.duration)}</span>
          <span>${window.escapeHtml(p.weeklyHours)}</span>
        </div>
        ${!compact ? `<span class="map-link">${window.escapeHtml(ui('industryUi', 'viewDetail'))}</span>` : ''}
      </a>`).join('')
  }

  function renderLearningPathPhase(phase, index) {
    return `
      <div class="learning-path-phase">
        <div class="learning-path-phase-head">
          <span class="path-phase-num">${String(index + 1).padStart(2, '0')}</span>
          <div>
            <span class="path-phase-week">${window.escapeHtml(phase.week)}</span>
            <h3>${window.escapeHtml(phase.title)}</h3>
            <p class="path-phase-goal">${window.escapeHtml(ui('industryUi', 'phaseGoalPrefix'))}${window.escapeHtml(phase.goal)}</p>
          </div>
        </div>
        <ul class="path-task-list">
          ${phase.tasks.map((task) => `
            <li>
              <span>${window.escapeHtml(task.text)}</span>
              ${task.link ? `<a href="${window.escapeHtml(task.link.href)}" class="path-link-chip">${window.escapeHtml(task.link.label)}</a>` : ''}
            </li>`).join('')}
        </ul>
        <div class="path-milestone">
          <strong>${window.escapeHtml(ui('industryUi', 'milestoneLabel'))}</strong>
          <span>${window.escapeHtml(phase.milestone)}</span>
        </div>
      </div>`
  }

  function renderIndustryHub() {
    const sections = Industry().getSections()
    const paths = Industry().getLearningPaths()
    return `
      <div class="page industry-page">
        <header class="page-hero-block">
          <span class="hero-badge">${window.escapeHtml(ui('industryUi', 'badge'))}</span>
          <h1>${window.escapeHtml(ui('industryUi', 'hubTitle'))}</h1>
          <p>${window.escapeHtml(ui('industryUi', 'hubDesc'))}</p>
        </header>

        <section class="section learning-path-section">
          <h2 class="section-title">${window.escapeHtml(ui('industryUi', 'pathsSectionTitle'))}</h2>
          <p class="section-desc">${window.escapeHtml(ui('industryUi', 'pathsSectionDesc'))}</p>
          <div class="learning-path-grid">
            ${renderLearningPathCards(paths, false)}
          </div>
        </section>

        ${sections.map((sec) => `
          <section class="section">
            <h2 class="section-title">${sec.icon} ${sec.title}</h2>
            <p class="section-desc">${sec.description}</p>
            <div class="article-list">
              ${sec.items.map((item) => `
                <a href="#/industry/${sec.id}/${item.id}" class="article-card">
                  <div class="article-card-body">
                    <h3>${window.escapeHtml(item.title)}</h3>
                    <p>${window.escapeHtml(item.summary)}</p>
                    <div class="article-tags">${item.tags.map((t) => `<span class="tag">${window.escapeHtml(t)}</span>`).join('')}</div>
                  </div>
                  <span class="article-arrow">→</span>
                </a>`).join('')}
            </div>
          </section>`).join('')}
      </div>`
  }

  function renderLearningPathDetail(pathId) {
    const path = Industry().getLearningPath(pathId)
    if (!path) return `<div class="page"><p>${window.escapeHtml(ui('industryUi', 'notFound'))}</p><a href="#/industry">${window.escapeHtml(tr('common.back'))}</a></div>`
    return `
      <div class="page learning-path-page">
        <header class="page-header">
          <a href="#/industry" class="breadcrumb">${window.escapeHtml(ui('industryUi', 'breadcrumb'))}</a><span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">${window.escapeHtml(ui('industryUi', 'pathBreadcrumb'))}</span>
        </header>
        <header class="page-hero-block">
          ${path.badge ? `<span class="hero-badge">${window.escapeHtml(path.badge)}</span>` : ''}
          <h1>${window.escapeHtml(path.title)}</h1>
          <p>${window.escapeHtml(path.summary)}</p>
          <div class="learning-path-meta learning-path-meta-hero">
            <span>${window.escapeHtml(ui('industryUi', 'durationPrefix'))}${window.escapeHtml(path.duration)}</span>
            <span>${window.escapeHtml(path.weeklyHours)}</span>
          </div>
        </header>

        <section class="section">
          <h2 class="section-title">${window.escapeHtml(ui('industryUi', 'outcomesTitle'))}</h2>
          <ul class="path-outcomes">
            ${path.outcomes.map((o) => `<li>${window.escapeHtml(o)}</li>`).join('')}
          </ul>
        </section>

        <section class="section">
          <h2 class="section-title">${window.escapeHtml(ui('industryUi', 'phasesTitle'))}</h2>
          <div class="learning-path-timeline">
            ${path.phases.map((ph, i) => renderLearningPathPhase(ph, i)).join('')}
          </div>
        </section>

        <section class="section path-more-section">
          <h2 class="section-title">${window.escapeHtml(ui('industryUi', 'otherPathsTitle'))}</h2>
          <div class="learning-path-grid learning-path-grid-compact">
            ${renderLearningPathCards(Industry().getLearningPaths().filter((p) => p.id !== pathId), true)}
          </div>
        </section>
      </div>`
  }

  function renderIndustryArticle(sectionId, itemId) {
    const sec = Industry().getSection(sectionId)
    const item = Industry().getItem(sectionId, itemId)
    if (!sec || !item) return `<div class="page"><p>${window.escapeHtml(ui('industryUi', 'notFound'))}</p><a href="#/industry">${window.escapeHtml(tr('common.back'))}</a></div>`
    const pathCta = sectionId === 'learning-path'
      ? `<div class="hero-actions"><a href="#/industry/learning-path/newcomer-8w" class="btn-primary">${window.escapeHtml(ui('industryUi', 'viewFullPath'))}</a></div>`
      : ''
    return `
      <div class="page article-page">
        <header class="page-header">
          <a href="#/industry" class="breadcrumb">${window.escapeHtml(ui('industryUi', 'breadcrumb'))}</a><span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">${window.escapeHtml(item.title)}</span>
        </header>
        <article class="article-content">
          <div class="article-meta"><span class="article-category">${window.escapeHtml(sec.title)}</span></div>
          <h1>${window.escapeHtml(item.title)}</h1>
          <p class="article-summary">${window.escapeHtml(item.summary)}</p>
          ${pathCta}
          <div class="article-body">${item.content.map((p) => `<p>${window.escapeHtml(p)}</p>`).join('')}</div>
        </article>
      </div>`
  }

  function renderToolsHub() {
    const cats = Tools().getCategories()
    return `
      <div class="page tools-page">
        <header class="page-hero-block">
          <span class="hero-badge">${window.escapeHtml(ui('toolsUi', 'badge'))}</span>
          <h1>${window.escapeHtml(ui('toolsUi', 'hubTitle'))}</h1>
          <p>${window.escapeHtml(ui('toolsUi', 'hubDesc'))}</p>
        </header>
        <div class="tools-search-bar">
          <input type="search" id="tools-search" placeholder="${window.escapeHtml(ui('toolsUi', 'searchPlaceholder'))}" />
        </div>
        <div class="category-grid" id="tools-category-grid">
          ${cats.map((c) => `
            <a href="#/tools/${c.id}" class="category-card">
              <div class="category-card-icon">${c.icon}</div>
              <h3>${window.escapeHtml(c.title)}</h3>
              <p>${window.escapeHtml(c.description)}</p>
              <div class="category-card-footer"><span>${window.escapeHtml(ui('toolsUi', 'itemCount', { n: c.tools.length }))}</span><span class="arrow">→</span></div>
            </a>`).join('')}
        </div>
        <div id="tools-search-results" class="tools-search-results" style="display:none"></div>
      </div>`
  }

  function renderToolsCategory(categoryId) {
    const cat = Tools().getCategory(categoryId)
    if (!cat) return `<div class="page"><p>${window.escapeHtml(ui('toolsUi', 'categoryNotFound'))}</p><a href="#/tools">${window.escapeHtml(tr('common.back'))}</a></div>`
    return `
      <div class="page tools-page">
        <header class="page-header">
          <a href="#/tools" class="breadcrumb">${window.escapeHtml(ui('toolsUi', 'badge'))}</a><span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-current">${window.escapeHtml(cat.title)}</span>
        </header>
        <div class="tools-list">
          ${cat.tools.map((tool) => `
            <div class="tool-card">
              <div class="tool-card-main">
                <h3>${window.escapeHtml(tool.name)}</h3>
                <p>${window.escapeHtml(tool.desc)}</p>
              </div>
              <div class="tool-card-links">
                <a href="${window.escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer" class="btn-secondary btn-sm">${window.escapeHtml(ui('toolsUi', 'official'))}</a>
                <a href="${window.escapeHtml(tool.learn)}" target="_blank" rel="noopener noreferrer" class="btn-primary btn-sm">${window.escapeHtml(ui('toolsUi', 'learn'))}</a>
              </div>
            </div>`).join('')}
        </div>
      </div>`
  }

  function bindToolsSearch() {
    const input = document.getElementById('tools-search')
    const grid = document.getElementById('tools-category-grid')
    const results = document.getElementById('tools-search-results')
    if (!input || !grid || !results) return
    input.addEventListener('input', () => {
      const q = input.value.trim()
      if (!q) {
        grid.style.display = ''
        results.style.display = 'none'
        return
      }
      const found = Tools().searchTools(q)
      grid.style.display = 'none'
      results.style.display = 'block'
      results.innerHTML = found.length ? found.map((tool) => `
        <div class="tool-card">
          <div class="tool-card-main">
            <span class="tag">${window.escapeHtml(tool.categoryTitle)}</span>
            <h3>${window.escapeHtml(tool.name)}</h3>
            <p>${window.escapeHtml(tool.desc)}</p>
          </div>
          <div class="tool-card-links">
            <a href="${window.escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer" class="btn-secondary btn-sm">${window.escapeHtml(ui('toolsUi', 'official'))}</a>
            <a href="${window.escapeHtml(tool.learn)}" target="_blank" rel="noopener noreferrer" class="btn-primary btn-sm">${window.escapeHtml(ui('toolsUi', 'learn'))}</a>
          </div>
        </div>`).join('') : `<p class="empty-hint">${window.escapeHtml(ui('toolsUi', 'searchEmpty'))}</p>`
    })
  }

  function renderForumList(posts) {
    return `
      <div class="page forum-page">
        <header class="page-hero-block">
          <span class="hero-badge">${window.escapeHtml(ui('forumUi', 'badge'))}</span>
          <h1>${window.escapeHtml(ui('forumUi', 'listTitle'))}</h1>
          <p>${window.escapeHtml(ui('forumUi', 'listDesc'))}</p>
          <div class="hero-actions">
            ${window.Auth().isLoggedIn()
              ? `<a href="#/forum/new" class="btn-primary">${window.escapeHtml(ui('forumUi', 'newPost'))}</a>`
              : `<a href="#/login" class="btn-primary">${window.escapeHtml(ui('forumUi', 'loginToPost'))}</a>`}
          </div>
        </header>
        <div class="forum-post-list">
          ${posts.length ? posts.map((p) => `
            <a href="#/forum/post/${p.id}" class="forum-post-card">
              <h3>${window.escapeHtml(p.title)}</h3>
              <p class="forum-post-preview">${window.escapeHtml(p.body.slice(0, 120))}${p.body.length > 120 ? '…' : ''}</p>
              <div class="forum-post-meta">
                <span>${window.escapeHtml(p.authorName)}</span>
                <span>${window.formatDate(p.createdAt)}</span>
                <span>${window.escapeHtml(ui('forumUi', 'commentCount', { n: p.commentCount }))}</span>
              </div>
            </a>`).join('') : `<p class="empty-hint">${window.escapeHtml(ui('forumUi', 'empty'))}</p>`}
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
          </div>` : `<p class="form-hint"><a href="#/login">${window.escapeHtml(tr('auth.login'))}</a> ${window.escapeHtml(ui('forumUi', 'loginHint'))}</p>`}
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
    renderIndustryArticle,
    renderLearningPathDetail,
    renderToolsHub,
    renderToolsCategory,
    bindToolsSearch,
    renderForumList,
    renderForumNew,
    bindForumNew,
    renderForumListRoute,
    renderForumPostRoute,
  }
})()
