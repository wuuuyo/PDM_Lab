/**
 * 功能权限：读取 profiles.permissions，控制侧栏与路由
 * null / 缺省 = 全部允许；管理员始终全开
 */
;(function () {
  const FEATURES = [
    { id: 'industry', labelZh: '行业认知', labelEn: 'Industry', actions: ['view'] },
    { id: 'tools', labelZh: '工具库', labelEn: 'Tools', actions: ['view'] },
    { id: 'forum', labelZh: '学习论坛', labelEn: 'Forum', actions: ['view', 'edit'] },
    { id: 'methodology', labelZh: '产品方法论', labelEn: 'Methodology', actions: ['view'] },
    { id: 'interview', labelZh: '产品八股', labelEn: 'Interview', actions: ['view'] },
    { id: 'skills', labelZh: '核心技能', labelEn: 'Skills', actions: ['view'] },
    { id: 'domain', labelZh: '行业认知库', labelEn: 'Domain', actions: ['view'] },
    { id: 'favorites', labelZh: '我的收藏', labelEn: 'Favorites', actions: ['view', 'edit'] },
    { id: 'notes', labelZh: '我的笔记', labelEn: 'Notes', actions: ['view', 'edit'] },
    { id: 'myKnowledge', labelZh: '我的知识库', labelEn: 'My knowledge', actions: ['view', 'edit'] },
    { id: 'reviews', labelZh: '复盘记录', labelEn: 'Reviews', actions: ['view', 'edit'] },
    { id: 'dailyLearn', labelZh: '每日学习', labelEn: 'Daily learn', actions: ['view', 'edit'] },
    { id: 'feedback', labelZh: '意见反馈', labelEn: 'Feedback', actions: ['view', 'edit'] },
  ]

  const ACTION_LABEL = {
    view: { zh: '查看', en: 'View' },
    edit: { zh: '编辑', en: 'Edit' },
  }

  function getFeatures() {
    return FEATURES
  }

  function actionLabel(action) {
    const loc = window.PMLabI18n?.getLocale?.() === 'en-US' ? 'en' : 'zh'
    return ACTION_LABEL[action]?.[loc] || action
  }

  function featureLabel(f) {
    const en = window.PMLabI18n?.getLocale?.() === 'en-US'
    return en ? f.labelEn : f.labelZh
  }

  function getUserPermissions() {
    if (window.PDMAuth?.isAdmin?.()) return null
    const profile = window.PDMAuth?.getProfile?.()
    return profile?.permissions ?? null
  }

  function can(featureId, action = 'view') {
    if (window.PDMAuth?.isAdmin?.()) return true
    // 未登录：仅允许公开浏览类；个人功能在路由层会要求登录
    const perms = getUserPermissions()
    if (perms == null) return true
    const node = perms[featureId]
    if (node == null) return true
    if (typeof node === 'boolean') return node
    if (action === 'view') return node.view !== false
    return node[action] === true
  }

  function routeFeature(parts) {
    const p0 = parts[0] || ''
    if (!p0 || p0 === 'login' || p0 === 'reset-password') return null
    if (p0 === 'admin') return { feature: 'admin', action: 'view' }
    if (p0 === 'industry') return { feature: 'industry', action: 'view' }
    if (p0 === 'tools') return { feature: 'tools', action: 'view' }
    if (p0 === 'forum') {
      const write = p0 === 'forum' && (parts[1] === 'new' || parts[1] === 'post')
      return { feature: 'forum', action: parts[1] === 'new' ? 'edit' : 'view' }
    }
    if (p0 === 'category' || p0 === 'article') {
      const cat = parts[1]
      if (['methodology', 'interview', 'skills', 'domain'].includes(cat)) {
        return { feature: cat, action: 'view' }
      }
      return { feature: 'methodology', action: 'view' }
    }
    if (p0 === 'favorites') return { feature: 'favorites', action: 'view' }
    if (p0 === 'notes') return { feature: 'notes', action: 'view' }
    if (p0 === 'my-knowledge') {
      const write = parts[1] === 'add' || parts[1] === 'edit'
      return { feature: 'myKnowledge', action: write ? 'edit' : 'view' }
    }
    if (p0 === 'reviews' || p0 === 'memory') return { feature: 'reviews', action: 'view' }
    if (p0 === 'daily-learn') return { feature: 'dailyLearn', action: 'view' }
    if (p0 === 'feedback') return { feature: 'feedback', action: parts[1] === 'new' || !parts[1] ? 'edit' : 'view' }
    return null
  }

  function defaultPermMap() {
    const map = {}
    for (const f of FEATURES) {
      map[f.id] = {}
      for (const a of f.actions) map[f.id][a] = true
    }
    return map
  }

  function normalizePerms(raw) {
    const base = defaultPermMap()
    if (!raw || typeof raw !== 'object') return base
    for (const f of FEATURES) {
      const node = raw[f.id]
      if (node == null) continue
      if (typeof node === 'boolean') {
        for (const a of f.actions) base[f.id][a] = node
        continue
      }
      for (const a of f.actions) {
        if (typeof node[a] === 'boolean') base[f.id][a] = node[a]
      }
    }
    return base
  }

  window.PDMPermissions = {
    getFeatures,
    featureLabel,
    actionLabel,
    can,
    routeFeature,
    defaultPermMap,
    normalizePerms,
    getUserPermissions,
  }
})()
