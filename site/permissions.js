/**
 * 功能权限（RBAC）：按角色 app_roles.permissions 判定
 * 超级管理员全开；管理员可进后台；空配置=全开
 * 权限树：一级分组 + 二级功能，一级勾选联动二级
 */
;(function () {
  const FEATURE_TREE = [
    {
      id: 'group_learning',
      labelZh: '学习导航',
      labelEn: 'Learn',
      children: [
        { id: 'industry', labelZh: '行业认知', labelEn: 'Industry', actions: ['view'] },
        { id: 'tools', labelZh: '工具库', labelEn: 'Tools', actions: ['view'] },
        { id: 'forum', labelZh: '学习论坛', labelEn: 'Forum', actions: ['view', 'edit'] },
      ],
    },
    {
      id: 'group_knowledge',
      labelZh: '知识库',
      labelEn: 'Knowledge',
      children: [
        { id: 'methodology', labelZh: 'PM方法论', labelEn: 'PM Methodology', actions: ['view'] },
        { id: 'architecture', labelZh: '技术架构', labelEn: 'Architecture', actions: ['view'] },
        { id: 'business', labelZh: '业务管理', labelEn: 'Business', actions: ['view'] },
        { id: 'security', labelZh: '权限安全', labelEn: 'Security', actions: ['view'] },
        { id: 'workflow', labelZh: '工作流程', labelEn: 'Workflow', actions: ['view'] },
        { id: 'reference', labelZh: '速查知识库', labelEn: 'Keyword lookup', actions: ['view'] },
      ],
    },
    {
      id: 'group_personal',
      labelZh: '我的空间',
      labelEn: 'Workspace',
      children: [
        { id: 'favorites', labelZh: '我的收藏', labelEn: 'Favorites', actions: ['view', 'edit'] },
        { id: 'notes', labelZh: '我的笔记', labelEn: 'Notes', actions: ['view', 'edit'] },
        { id: 'myKnowledge', labelZh: '我的知识库', labelEn: 'My knowledge', actions: ['view', 'edit'] },
        { id: 'reviews', labelZh: '复盘记录', labelEn: 'Reviews', actions: ['view', 'edit'] },
        { id: 'dailyLearn', labelZh: '每日学习', labelEn: 'Daily learn', actions: ['view', 'edit'] },
        { id: 'feedback', labelZh: '意见反馈', labelEn: 'Feedback', actions: ['view', 'edit'] },
      ],
    },
  ]

  const FEATURES = FEATURE_TREE.flatMap((g) => g.children)

  const ACTION_LABEL = {
    view: { zh: '查看', en: 'View' },
    edit: { zh: '编辑', en: 'Edit' },
  }

  const SYSTEM_ROLE_IDS = ['user', 'admin', 'super_admin']

  /** 旧知识库 feature / 路由 ID → 新主题 */
  const LEGACY_FEATURE = {
    interview: 'methodology',
    skills: 'workflow',
    domain: 'architecture',
  }

  const KB_FEATURE_IDS = ['methodology', 'architecture', 'business', 'security', 'workflow', 'reference']

  /** @type {Record<string, object|null>} */
  let rolePermCache = {}
  /** @type {Array<{code:string,name:string,is_system:boolean,permissions:object}>} */
  let rolesListCache = []

  function resolveFeatureId(featureId) {
    return LEGACY_FEATURE[featureId] || featureId
  }

  function getFeatureTree() {
    return FEATURE_TREE
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

  function groupLabel(g) {
    const en = window.PMLabI18n?.getLocale?.() === 'en-US'
    return en ? g.labelEn : g.labelZh
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
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base
    if (Object.keys(raw).length === 0) return base
    for (const f of FEATURES) {
      let node = raw[f.id]
      if (node == null) {
        // 旧矩阵：interview/skills/domain → 新主题
        for (const [oldId, newId] of Object.entries(LEGACY_FEATURE)) {
          if (newId === f.id && raw[oldId] != null) {
            node = raw[oldId]
            break
          }
        }
      }
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

  function getRole() {
    return window.PDMAuth?.getRole?.() || 'user'
  }

  function getPermsForRole(role) {
    const key = role || 'user'
    if (Object.prototype.hasOwnProperty.call(rolePermCache, key) && rolePermCache[key] != null) {
      return normalizePerms(rolePermCache[key])
    }
    return defaultPermMap()
  }

  function getUserPermissions() {
    return getPermsForRole(getRole())
  }

  function can(featureId, action = 'view') {
    if (featureId === 'admin') return Boolean(window.PDMAuth?.isAdmin?.())
    featureId = resolveFeatureId(featureId)
    const role = getRole()
    if (role === 'super_admin') return true
    if (!window.PDMAuth?.isLoggedIn?.()) {
      const guestOk = ['industry', 'tools', 'forum', ...KB_FEATURE_IDS].includes(featureId)
      return action === 'view' && guestOk
    }
    if (window.PDMAuth?.getProfile?.()?.is_disabled) return false
    const perms = getPermsForRole(role)
    const node = perms[featureId]
    if (node == null) return true
    if (typeof node === 'boolean') return node
    if (action === 'view') return node.view !== false
    return node[action] === true
  }

  function routeFeature(parts) {
    const p0 = parts[0] || ''
    if (!p0 || p0 === 'login' || p0 === 'reset-password' || p0 === 'm') return null
    if (p0 === 'admin') return { feature: 'admin', action: 'view' }
    if (p0 === 'industry') return { feature: 'industry', action: 'view' }
    if (p0 === 'tools') return { feature: 'tools', action: 'view' }
    if (p0 === 'forum') {
      return { feature: 'forum', action: parts[1] === 'new' ? 'edit' : 'view' }
    }
    if (p0 === 'category' || p0 === 'article' || p0 === 'module' || p0 === 'doc' || p0 === 'chapter' || p0 === 'kb') {
      if (p0 === 'kb') return { feature: 'methodology', action: 'view' }
      const cat = resolveFeatureId(parts[1])
      if (KB_FEATURE_IDS.includes(cat)) {
        return { feature: cat, action: 'view' }
      }
      return { feature: 'methodology', action: 'view' }
    }
    if (p0 === 'personal') return null
    if (p0 === 'favorites') return { feature: 'favorites', action: 'view' }
    if (p0 === 'notes') return { feature: 'notes', action: 'view' }
    if (p0 === 'my-knowledge') {
      const write = parts[1] === 'add' || parts[1] === 'edit'
      return { feature: 'myKnowledge', action: write ? 'edit' : 'view' }
    }
    if (p0 === 'reviews' || p0 === 'memory') return { feature: 'reviews', action: 'view' }
    if (p0 === 'daily-learn') return { feature: 'dailyLearn', action: 'view' }
    if (p0 === 'feedback') return null
    return null
  }

  /** 一级分组在某 action 上的勾选状态：all | none | mixed */
  function groupActionState(draft, group, action) {
    const kids = action === 'view'
      ? group.children
      : group.children.filter((f) => f.actions.includes(action))
    if (!kids.length) return 'none'
    let on = 0
    for (const f of kids) {
      const node = draft[f.id] || {}
      if (action === 'view') {
        if (node.view !== false) on += 1
      } else if (node[action]) {
        on += 1
      }
    }
    if (on === 0) return 'none'
    if (on === kids.length) return 'all'
    return 'mixed'
  }

  function setGroupAction(draft, group, action, checked) {
    const next = { ...draft }
    for (const f of group.children) {
      if (action !== 'view' && !f.actions.includes(action)) continue
      next[f.id] = { ...(next[f.id] || {}) }
      next[f.id][action] = checked
      if (action === 'view' && !checked) next[f.id].edit = false
      if (action === 'edit' && checked) next[f.id].view = true
    }
    return next
  }

  async function loadRolePermissions() {
    try {
      const Auth = window.PDMAuth
      if (!Auth?.isConfigured?.()) return rolePermCache
      const sb = Auth.getClient?.()
      if (!sb) return rolePermCache

      let data = null
      let error = null
      ;({ data, error } = await sb
        .from('app_roles')
        .select('id, code, name, is_system, permissions')
        .order('is_system', { ascending: false })
        .order('created_at', { ascending: true }))

      if (error) {
        // 兼容仅执行过 role-permissions.sql 的环境
        const legacy = await sb.from('role_permissions').select('role, permissions')
        if (legacy.error) {
          console.warn('app_roles:', error.message)
          return rolePermCache
        }
        const next = {}
        const list = []
        for (const row of legacy.data || []) {
          next[row.role] = row.permissions || {}
          list.push({
            id: row.role,
            code: row.role,
            name: row.role,
            is_system: SYSTEM_ROLE_IDS.includes(row.role),
            permissions: row.permissions || {},
          })
        }
        rolePermCache = next
        rolesListCache = list
        return rolePermCache
      }

      const next = {}
      rolesListCache = (data || []).map((row) => {
        next[row.code] = row.permissions || {}
        return row
      })
      rolePermCache = next
      return rolePermCache
    } catch (e) {
      console.warn('loadRolePermissions:', e.message || e)
      return rolePermCache
    }
  }

  function getRolesList() {
    if (rolesListCache.length) return rolesListCache
    return SYSTEM_ROLE_IDS.map((code) => ({
      id: code,
      code,
      name: code,
      is_system: true,
      permissions: rolePermCache[code] || {},
    }))
  }

  function getCachedRolePermissions(role) {
    return rolePermCache[role] ?? null
  }

  function setCachedRolePermissions(role, permissions) {
    if (!role) return
    rolePermCache[role] = permissions
    const idx = rolesListCache.findIndex((r) => r.code === role)
    if (idx >= 0) rolesListCache[idx] = { ...rolesListCache[idx], permissions }
  }

  function upsertCachedRole(roleRow) {
    if (!roleRow?.code) return
    rolePermCache[roleRow.code] = roleRow.permissions || {}
    const idx = rolesListCache.findIndex((r) => r.code === roleRow.code)
    if (idx >= 0) rolesListCache[idx] = { ...rolesListCache[idx], ...roleRow }
    else rolesListCache.push(roleRow)
  }

  function removeCachedRole(code) {
    delete rolePermCache[code]
    rolesListCache = rolesListCache.filter((r) => r.code !== code)
  }

  window.PDMPermissions = {
    getFeatureTree,
    getFeatures,
    featureLabel,
    groupLabel,
    actionLabel,
    can,
    routeFeature,
    resolveFeatureId,
    LEGACY_FEATURE,
    KB_FEATURE_IDS,
    defaultPermMap,
    normalizePerms,
    getUserPermissions,
    getPermsForRole,
    groupActionState,
    setGroupAction,
    loadRolePermissions,
    getRolesList,
    getCachedRolePermissions,
    setCachedRolePermissions,
    upsertCachedRole,
    removeCachedRole,
    SYSTEM_ROLE_IDS,
    ROLE_IDS: SYSTEM_ROLE_IDS,
  }
})()
