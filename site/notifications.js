;(function () {
  const KEY = 'pm-lab-notifications'
  const SEEN_FORUM_KEY = 'pm-lab-seen-forum-comments'
  const LIMIT = 80

  function nowIso() {
    return new Date().toISOString()
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch (_) {
      return fallback
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (_) {
      return false
    }
  }

  function emit() {
    try { window.dispatchEvent(new CustomEvent('pdm:notifications')) } catch (_) {}
  }

  function list() {
    const items = readJson(KEY, [])
    return Array.isArray(items) ? items : []
  }

  function save(items) {
    writeJson(KEY, items.slice(0, LIMIT))
    emit()
  }

  function unreadCount() {
    return list().filter((n) => !n.readAt).length
  }

  function add(input) {
    if (!input?.title) return null
    const items = list()
    const dedupeKey = input.dedupeKey || ''
    if (dedupeKey && items.some((n) => n.dedupeKey === dedupeKey)) return null
    const item = {
      id: input.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: input.type || 'system',
      title: input.title,
      body: input.body || '',
      href: input.href || '#/',
      createdAt: input.createdAt || nowIso(),
      readAt: input.readAt || null,
      dedupeKey,
    }
    save([item, ...items])
    return item
  }

  function markRead(id) {
    save(list().map((n) => n.id === id ? { ...n, readAt: n.readAt || nowIso() } : n))
  }

  function markAllRead() {
    const ts = nowIso()
    save(list().map((n) => n.readAt ? n : { ...n, readAt: ts }))
  }

  function clearAll() {
    save([])
  }

  function readSeenForum() {
    const seen = readJson(SEEN_FORUM_KEY, {})
    return seen && typeof seen === 'object' && !Array.isArray(seen) ? seen : {}
  }

  function writeSeenForum(seen) {
    writeJson(SEEN_FORUM_KEY, seen)
  }

  function notifyPathProgress(path, done, total) {
    if (!path || !total) return
    const pct = Math.round((done / total) * 100)
    const milestones = [25, 50, 75, 100]
    const hit = milestones.find((m) => pct >= m && done > 0)
    if (!hit) return
    add({
      type: 'progress',
      title: hit >= 100 ? '学习计划已完成' : `学习进度达到 ${hit}%`,
      body: hit >= 100 ? `${path.title} 已完成，记得做一次复盘。` : `${path.title} 已完成 ${done}/${total} 项任务。`,
      href: `#/industry/learning-path/${path.id}`,
      dedupeKey: `progress:${path.id}:${hit}`,
    })
  }

  function notifyDailyPush(records) {
    if (!records?.length) return
    const titles = records.map((r) => r.title).filter(Boolean).join('、')
    add({
      type: 'daily',
      title: '今日学习已准备好',
      body: `为你推送 ${records.length} 条知识：${titles.slice(0, 54)}`,
      href: '#/daily-learn',
      dedupeKey: `daily:${new Date().toISOString().slice(0, 10)}`,
    })
  }

  async function scanForumReplies() {
    const Auth = window.PDMAuth
    const Forum = window.PDMForum
    if (!Auth?.isLoggedIn?.() || !Forum?.fetchPosts || !Forum?.fetchComments) return
    const userId = Auth.getSession()?.user?.id
    if (!userId) return
    const posts = await Forum.fetchPosts(80)
    const mine = posts.filter((p) => p.userId === userId && p.commentCount > 0).slice(0, 12)
    if (!mine.length) return
    const seen = readSeenForum()
    for (const post of mine) {
      const comments = await Forum.fetchComments(post.id)
      const others = comments.filter((c) => c.userId !== userId)
      if (!others.length) {
        seen[post.id] = seen[post.id] || ''
        continue
      }
      const latest = others[others.length - 1]
      const latestTime = latest.createdAt || latest.created_at || ''
      if (!seen[post.id]) {
        seen[post.id] = latestTime || nowIso()
        continue
      }
      if (latestTime && latestTime > seen[post.id]) {
        add({
          type: 'forum',
          title: '你的帖子有新回复',
          body: `${latest.authorName || latest.author_name || '有人'} 回复了「${post.title}」。`,
          href: `#/forum/post/${post.id}`,
          dedupeKey: `forum:${latest.id}`,
          createdAt: latestTime,
        })
        seen[post.id] = latestTime
      }
    }
    writeSeenForum(seen)
  }

  window.PDMNotifications = {
    list,
    unreadCount,
    add,
    markRead,
    markAllRead,
    clearAll,
    notifyPathProgress,
    notifyDailyPush,
    scanForumReplies,
  }
})()
