/**
 * 管理者后台 · 账号管理 & 角色管理（列表 + 一二级权限树）
 */
;(function () {
  const Auth = () => window.PDMAuth || {}
  const Perm = () => window.PDMPermissions || {}
  const t = (key, params, fallback) => window.PMLabI18n?.t(key, params, fallback) ?? fallback ?? key
  const escapeHtml = (s) => (window.escapeHtml ? window.escapeHtml(s) : String(s ?? ''))
  const formatDate = (iso) => (window.formatDate ? window.formatDate(iso) : (iso || '—'))
  const showToast = (msg, type) => {
    if (typeof window.showToast === 'function') window.showToast(msg, type)
  }

  let accountState = {
    users: [],
    roles: [],
    q: '',
    appliedQ: '',
    roleFilter: 'all',
    panelOpen: false,
    panelMode: 'edit', // view | edit
    userId: null,
    roleDraft: null,
  }

  let roleState = {
    roles: [],
    userCounts: {},
    q: '',
    appliedQ: '',
    panelOpen: false,
    panelMode: 'edit', // view | edit | create
    editingCode: null,
    nameDraft: '',
    draft: null,
    expanded: {},
  }

  function resolveProfileRole(u) {
    if (!u) return 'user'
    if (u.role) return u.role
    const email = (u.email || '').toLowerCase()
    const cfg = Auth().getConfig?.() || {}
    if (email && Array.isArray(cfg.adminEmails) && cfg.adminEmails.map((e) => String(e).toLowerCase()).includes(email)) {
      return 'super_admin'
    }
    return u.is_admin ? 'admin' : 'user'
  }

  function roleMeta(code) {
    const list = accountState.roles.length ? accountState.roles : (roleState.roles.length ? roleState.roles : Perm().getRolesList?.() || [])
    return list.find((r) => r.code === code) || null
  }

  function roleLabel(code) {
    const meta = roleMeta(code)
    if (meta?.name) return meta.name
    if (code === 'super_admin') return t('admin.roleSuper')
    if (code === 'admin') return t('admin.roleAdmin')
    if (code === 'user') return t('admin.roleUser')
    return code || t('admin.roleUser')
  }

  function isSystemRole(code) {
    return Boolean(roleMeta(code)?.is_system) || ['user', 'admin', 'super_admin'].includes(code)
  }

  function renderAdminHeader(title, desc) {
    return `
      <header class="admin-shell-head">
        <div class="admin-shell-eyebrow">${escapeHtml(t('nav.sectionAdmin'))}</div>
        <h1 class="admin-shell-title">${escapeHtml(title)}</h1>
        ${desc ? `<p class="admin-shell-desc">${escapeHtml(desc)}</p>` : ''}
      </header>`
  }

  function makeRoleCode(name) {
    const base = String(name || 'role')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_\u4e00-\u9fff-]/g, '')
      .slice(0, 40) || 'role'
    return `custom_${base}_${Date.now().toString(36)}`
  }

  async function fetchAdminUsers() {
    const sb = Auth().getClient()
    if (!sb || !Auth().isAdmin()) throw new Error('无权限')
    let data = null
    let error = null
    ;({ data, error } = await sb
      .from('profiles')
      .select('id, email, display_name, is_admin, role, is_disabled, last_login_at, created_at')
      .order('created_at', { ascending: false }))
    if (error && /is_disabled/i.test(error.message || '')) {
      ;({ data, error } = await sb
        .from('profiles')
        .select('id, email, display_name, is_admin, role, last_login_at, created_at')
        .order('created_at', { ascending: false }))
    }
    if (error && /role/i.test(error.message || '')) {
      ;({ data, error } = await sb
        .from('profiles')
        .select('id, email, display_name, is_admin, last_login_at, created_at')
        .order('created_at', { ascending: false }))
    }
    if (error) throw error
    return (data || []).map((u) => ({ ...u, role: resolveProfileRole(u), is_disabled: Boolean(u.is_disabled) }))
  }

  async function fetchRoles() {
    await Perm().loadRolePermissions?.()
    return Perm().getRolesList?.() || []
  }

  function countUsersByRole(users) {
    const map = {}
    for (const u of users) {
      if (u.is_disabled) continue
      const role = resolveProfileRole(u)
      map[role] = (map[role] || 0) + 1
    }
    return map
  }

  /* ========== 权限树 ========== */

  function ensureExpandedDefaults() {
    const tree = Perm().getFeatureTree?.() || []
    for (const g of tree) {
      if (roleState.expanded[g.id] == null) roleState.expanded[g.id] = true
    }
  }

  function renderPermTree(draft, editable) {
    ensureExpandedDefaults()
    const tree = Perm().getFeatureTree?.() || []
    return `
      <div class="admin-perm-tree">
        <div class="admin-perm-tree-head">
          <span>${escapeHtml(t('admin.permFeature'))}</span>
          <span>${escapeHtml(t('admin.permView'))}</span>
          <span>${escapeHtml(t('admin.permEdit'))}</span>
        </div>
        ${tree.map((group) => {
          const open = roleState.expanded[group.id] !== false
          const viewState = Perm().groupActionState(draft, group, 'view')
          const editState = Perm().groupActionState(draft, group, 'edit')
          const hasEditKids = group.children.some((f) => f.actions.includes('edit'))
          return `
            <div class="admin-perm-group ${open ? 'is-open' : ''}" data-group="${escapeHtml(group.id)}">
              <div class="admin-perm-group-row">
                <button type="button" class="admin-perm-toggle" data-toggle-group="${escapeHtml(group.id)}" aria-expanded="${open}">
                  <span class="admin-perm-caret" aria-hidden="true"></span>
                  <span>${escapeHtml(Perm().groupLabel(group))}</span>
                </button>
                <label class="admin-perm-check">
                  <input type="checkbox" data-group-action="view" data-group="${escapeHtml(group.id)}"
                    ${viewState === 'all' ? 'checked' : ''} ${viewState === 'mixed' ? 'data-indeterminate="1"' : ''}
                    ${editable ? '' : 'disabled'} />
                </label>
                <label class="admin-perm-check">
                  ${hasEditKids
                    ? `<input type="checkbox" data-group-action="edit" data-group="${escapeHtml(group.id)}"
                        ${editState === 'all' ? 'checked' : ''} ${editState === 'mixed' ? 'data-indeterminate="1"' : ''}
                        ${editable ? '' : 'disabled'} />`
                    : '<span class="admin-perm-na">—</span>'}
                </label>
              </div>
              <div class="admin-perm-children" ${open ? '' : 'hidden'}>
                ${group.children.map((f) => {
                  const node = draft[f.id] || {}
                  const hasEdit = f.actions.includes('edit')
                  return `<div class="admin-perm-child-row" data-feature="${escapeHtml(f.id)}">
                    <span class="admin-perm-child-label">${escapeHtml(Perm().featureLabel(f))}</span>
                    <label class="admin-perm-check"><input type="checkbox" data-action="view" ${node.view !== false ? 'checked' : ''} ${editable ? '' : 'disabled'} /></label>
                    <label class="admin-perm-check">${hasEdit
                      ? `<input type="checkbox" data-action="edit" ${node.edit ? 'checked' : ''} ${editable ? '' : 'disabled'} />`
                      : '<span class="admin-perm-na">—</span>'}</label>
                  </div>`
                }).join('')}
              </div>
            </div>`
        }).join('')}
      </div>`
  }

  function applyIndeterminate(root) {
    root?.querySelectorAll('input[data-indeterminate="1"]').forEach((el) => {
      el.indeterminate = true
    })
  }

  function bindPermTreeEvents(getDraft, setDraft, rerender) {
    const root = document.querySelector('.admin-perm-tree')
    applyIndeterminate(root)

    document.querySelectorAll('[data-toggle-group]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.toggleGroup
        roleState.expanded[id] = roleState.expanded[id] === false
        rerender()
      })
    })

    document.querySelectorAll('.admin-perm-group-row input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => {
        const groupId = input.dataset.group
        const action = input.dataset.groupAction
        const group = (Perm().getFeatureTree?.() || []).find((g) => g.id === groupId)
        if (!group || !action) return
        const next = Perm().setGroupAction(getDraft() || Perm().defaultPermMap(), group, action, input.checked)
        setDraft(next)
        rerender()
      })
    })

    document.querySelectorAll('.admin-perm-child-row input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => {
        const row = input.closest('.admin-perm-child-row')
        const feature = row?.dataset.feature
        const action = input.dataset.action
        if (!feature || !action) return
        const draft = { ...(getDraft() || Perm().defaultPermMap()) }
        draft[feature] = { ...(draft[feature] || {}) }
        draft[feature][action] = input.checked
        if (action === 'view' && !input.checked) draft[feature].edit = false
        if (action === 'edit' && input.checked) draft[feature].view = true
        setDraft(draft)
        rerender()
      })
    })
  }

  /* ========== 角色管理 ========== */

  function getFilteredRoles() {
    const q = (roleState.appliedQ || '').trim().toLowerCase()
    return (roleState.roles || []).filter((r) => {
      if (!q) return true
      return `${r.name || ''} ${r.code || ''}`.toLowerCase().includes(q)
    })
  }

  function renderRolePanel() {
    if (!roleState.panelOpen) return ''
    const mode = roleState.panelMode
    const code = roleState.editingCode
    const meta = code ? roleMeta(code) : null
    const editable = mode !== 'view' && Auth().isSuperAdmin?.() === true && code !== 'super_admin'
    const title = mode === 'create'
      ? t('admin.roleCreateTitle')
      : mode === 'view'
        ? t('admin.roleViewTitle')
        : t('admin.roleEditTitle')
    const draft = roleState.draft || Perm().defaultPermMap()

    return `
      <section class="admin-perm-panel" id="admin-role-panel">
        <div class="admin-perm-panel-head">
          <div>
            <div class="admin-perm-panel-kicker">${escapeHtml(title)}</div>
            <h2>${escapeHtml(mode === 'create' ? (roleState.nameDraft || t('admin.roleNewName')) : roleLabel(code))}</h2>
            <p>${escapeHtml(code === 'super_admin' ? t('admin.roleSuperPermHint') : (editable ? t('admin.rolePermHint') : t('admin.rolePermViewOnly')))}</p>
          </div>
          <div class="admin-perm-actions">
            <button type="button" class="btn-ghost" id="admin-role-close">${escapeHtml(t('common.cancel'))}</button>
            ${editable ? `<button type="button" class="btn-primary" id="admin-role-save">${escapeHtml(t('common.save'))}</button>` : ''}
          </div>
        </div>
        <div class="admin-perm-panel-body">
          ${mode !== 'view' ? `
            <label class="admin-field">
              <span>${escapeHtml(t('admin.roleNameLabel'))}</span>
              <input type="text" id="admin-role-name" value="${escapeHtml(roleState.nameDraft)}" ${editable && !(meta?.is_system) ? '' : (mode === 'create' ? '' : 'disabled')} placeholder="${escapeHtml(t('admin.roleNamePlaceholder'))}" />
            </label>` : ''}
          ${renderPermTree(draft, editable)}
          <p class="form-hint">${escapeHtml(t('admin.roleSqlHint'))}</p>
        </div>
      </section>`
  }

  function renderRolesPage() {
    const filtered = getFilteredRoles()
    const canSuper = Auth().isSuperAdmin?.() === true
    const counts = roleState.userCounts || {}

    return `
      <div class="page admin-page admin-console-page">
        ${renderAdminHeader(t('nav.adminRoles'), t('admin.rolesDesc'))}

        <div class="admin-filter-bar">
          <div class="admin-filter-fields">
            <label class="admin-filter-item admin-filter-item-search">
              <span>${escapeHtml(t('admin.roleNameLabel'))}</span>
              <input type="search" id="admin-role-search" placeholder="${escapeHtml(t('admin.roleNamePlaceholder'))}" value="${escapeHtml(roleState.q)}" />
            </label>
            <div class="admin-filter-item admin-filter-item-btn">
              <span class="admin-filter-label-spacer" aria-hidden="true">&nbsp;</span>
              <button type="button" class="btn-ghost admin-filter-reset" id="admin-role-filter-reset">${escapeHtml(t('admin.permFilterReset'))}</button>
            </div>
            <div class="admin-filter-item admin-filter-item-btn">
              <span class="admin-filter-label-spacer" aria-hidden="true">&nbsp;</span>
              <button type="button" class="btn-primary" id="admin-role-filter-query">${escapeHtml(t('admin.filterQuery'))}</button>
            </div>
          </div>
        </div>

        <div class="admin-toolbar-row">
          <button type="button" class="btn-primary" id="admin-role-create" ${canSuper ? '' : 'disabled'}>${escapeHtml(t('admin.roleAdd'))}</button>
        </div>

        <div class="admin-perm-table-wrap">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t('admin.roleColName'))}</th>
                <th>${escapeHtml(t('admin.roleColUsers'))}</th>
                <th class="admin-data-col-action">${escapeHtml(t('admin.permColAction'))}</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length ? filtered.map((r) => {
                const n = counts[r.code] || 0
                const canDelete = canSuper && !r.is_system
                return `<tr class="admin-data-row" data-role-code="${escapeHtml(r.code)}">
                  <td><span class="admin-data-primary">${escapeHtml(r.name || r.code)}</span>${r.is_system ? ` <span class="admin-role-system-tag">${escapeHtml(t('admin.roleSystemTag'))}</span>` : ''}</td>
                  <td><button type="button" class="admin-link-btn admin-role-users" data-role-code="${escapeHtml(r.code)}">${n}</button></td>
                  <td class="admin-data-col-action admin-op-links">
                    <button type="button" class="admin-link-btn" data-op="view" data-role-code="${escapeHtml(r.code)}">${escapeHtml(t('admin.opViewPerm'))}</button>
                    <button type="button" class="admin-link-btn" data-op="edit" data-role-code="${escapeHtml(r.code)}" ${canSuper && r.code !== 'super_admin' ? '' : 'disabled'}>${escapeHtml(t('admin.opEdit'))}</button>
                    <button type="button" class="admin-link-btn admin-link-danger" data-op="delete" data-role-code="${escapeHtml(r.code)}" ${canDelete ? '' : 'disabled'}>${escapeHtml(t('admin.opDelete'))}</button>
                  </td>
                </tr>`
              }).join('') : `<tr><td colspan="3" class="admin-data-empty">${escapeHtml(t('admin.roleEmpty'))}</td></tr>`}
            </tbody>
          </table>
        </div>
        ${renderRolePanel()}
      </div>`
  }

  function bindRolesEvents() {
    const rerender = () => {
      document.getElementById('main').innerHTML = renderRolesPage()
      bindRolesEvents()
    }

    document.getElementById('admin-role-search')?.addEventListener('input', (e) => {
      roleState.q = e.target.value
    })
    document.getElementById('admin-role-search')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        roleState.appliedQ = roleState.q
        rerender()
      }
    })
    document.getElementById('admin-role-filter-reset')?.addEventListener('click', () => {
      roleState.q = ''
      roleState.appliedQ = ''
      rerender()
    })
    document.getElementById('admin-role-filter-query')?.addEventListener('click', () => {
      roleState.appliedQ = roleState.q
      rerender()
    })

    document.getElementById('admin-role-create')?.addEventListener('click', () => {
      if (!Auth().isSuperAdmin?.()) return
      roleState.panelOpen = true
      roleState.panelMode = 'create'
      roleState.editingCode = null
      roleState.nameDraft = ''
      roleState.draft = Perm().defaultPermMap()
      rerender()
      document.getElementById('admin-role-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })

    document.querySelectorAll('.admin-role-users').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (typeof window.navigate === 'function') window.navigate('/admin/accounts')
        else location.hash = '#/admin/accounts'
      })
    })

    document.querySelectorAll('.admin-op-links [data-op]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        if (btn.disabled) return
        const code = btn.dataset.roleCode
        const op = btn.dataset.op
        const meta = roleMeta(code)
        if (!meta && op !== 'create') return

        if (op === 'view' || op === 'edit') {
          roleState.panelOpen = true
          roleState.panelMode = op
          roleState.editingCode = code
          roleState.nameDraft = meta.name || code
          roleState.draft = Perm().getPermsForRole(code)
          rerender()
          document.getElementById('admin-role-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          return
        }

        if (op === 'delete') {
          if (!Auth().isSuperAdmin?.() || isSystemRole(code)) {
            showToast(t('admin.roleDeleteDenied'), 'error')
            return
          }
          const n = roleState.userCounts[code] || 0
          if (n > 0) {
            showToast(t('admin.roleDeleteHasUsers', { n }), 'error')
            return
          }
          if (!confirm(t('admin.roleDeleteConfirm', { name: meta.name || code }))) return
          try {
            const sb = Auth().getClient()
            if (!sb) throw new Error(t('auth.notConfigured'))
            const { error } = await sb.from('app_roles').delete().eq('code', code).eq('is_system', false)
            if (error) throw error
            Perm().removeCachedRole?.(code)
            roleState.roles = roleState.roles.filter((r) => r.code !== code)
            roleState.panelOpen = false
            showToast(t('admin.permSaved'), 'success')
            rerender()
          } catch (err) {
            const msg = err.message || String(err)
            showToast(/relation|does not exist|schema cache/i.test(msg) ? t('admin.roleSqlHint') : msg, 'error')
          }
        }
      })
    })

    document.getElementById('admin-role-close')?.addEventListener('click', () => {
      roleState.panelOpen = false
      rerender()
    })

    document.getElementById('admin-role-name')?.addEventListener('input', (e) => {
      roleState.nameDraft = e.target.value
    })

    if (roleState.panelOpen) {
      bindPermTreeEvents(
        () => roleState.draft,
        (d) => { roleState.draft = d },
        rerender,
      )
    }

    document.getElementById('admin-role-save')?.addEventListener('click', async () => {
      if (!Auth().isSuperAdmin?.()) {
        showToast(t('admin.roleBindNeedSuper'), 'error')
        return
      }
      const name = (roleState.nameDraft || '').trim()
      if (!name) {
        showToast(t('admin.roleNameRequired'), 'error')
        return
      }
      try {
        const sb = Auth().getClient()
        if (!sb) throw new Error(t('auth.notConfigured'))
        const permissions = roleState.draft || Perm().defaultPermMap()
        const now = new Date().toISOString()

        if (roleState.panelMode === 'create') {
          const code = makeRoleCode(name)
          const row = { code, name, is_system: false, permissions, updated_at: now }
          const { data, error } = await sb.from('app_roles').insert(row).select('id, code, name, is_system, permissions').single()
          if (error) throw error
          Perm().upsertCachedRole?.(data)
          roleState.roles = [...roleState.roles, data]
          roleState.panelOpen = false
          showToast(t('admin.permSaved'), 'success')
          rerender()
          return
        }

        const code = roleState.editingCode
        if (code === 'super_admin') {
          showToast(t('admin.roleSuperPermHint'), 'info')
          return
        }
        const meta = roleMeta(code)
        const payload = {
          permissions,
          updated_at: now,
        }
        if (meta && !meta.is_system) payload.name = name
        const { data, error } = await sb
          .from('app_roles')
          .update(payload)
          .eq('code', code)
          .select('id, code, name, is_system, permissions')
          .single()
        if (error) throw error
        Perm().upsertCachedRole?.(data)
        const idx = roleState.roles.findIndex((r) => r.code === code)
        if (idx >= 0) roleState.roles[idx] = data
        showToast(t('admin.permSaved'), 'success')
        roleState.panelOpen = false
        rerender()
      } catch (e) {
        const msg = e.message || String(e)
        showToast(/relation|does not exist|schema cache/i.test(msg) ? t('admin.roleSqlHint') : msg, 'error')
      }
    })
  }

  async function renderRolesRoute() {
    const main = document.getElementById('main')
    main.innerHTML = `<div class="page"><p>${escapeHtml(t('common.loading'))}</p></div>`
    try {
      const [roles, users] = await Promise.all([fetchRoles(), fetchAdminUsers().catch(() => [])])
      roleState.roles = roles
      accountState.roles = roles
      roleState.userCounts = countUsersByRole(users)
      roleState.panelOpen = false
      main.innerHTML = renderRolesPage()
      bindRolesEvents()
    } catch (e) {
      main.innerHTML = `<div class="page admin-page">${renderAdminHeader(t('nav.adminRoles'), '')}<p>${escapeHtml(e.message)}</p><p class="form-hint">${escapeHtml(t('admin.roleSqlHint'))}</p></div>`
    }
  }

  /* ========== 账号管理 ========== */

  function getFilteredUsers(users) {
    const q = (accountState.appliedQ || '').trim().toLowerCase()
    const roleFilter = accountState.roleFilter || 'all'
    return users.filter((u) => {
      if (u.is_disabled) return false
      const role = resolveProfileRole(u)
      if (roleFilter !== 'all' && role !== roleFilter) return false
      if (!q) return true
      return `${u.email || ''} ${u.display_name || ''} ${roleLabel(role)}`.toLowerCase().includes(q)
    })
  }

  function renderAccountPanel(selected) {
    if (!selected) return ''
    const canEdit = accountState.panelMode === 'edit' && Auth().isSuperAdmin?.() === true
    const selectedRole = accountState.roleDraft || resolveProfileRole(selected)
    const roles = accountState.roles.length ? accountState.roles : Perm().getRolesList?.() || []
    const draft = Perm().getPermsForRole(selectedRole)
    const isSuper = resolveProfileRole(selected) === 'super_admin'

    return `
      <section class="admin-perm-panel" id="admin-account-panel">
        <div class="admin-perm-panel-head">
          <div>
            <div class="admin-perm-panel-kicker">${escapeHtml(accountState.panelMode === 'view' ? t('admin.opViewPerm') : t('admin.accountBindTitle'))}</div>
            <h2>${escapeHtml(selected.email || selected.id)}</h2>
            <p>${escapeHtml(selected.display_name || t('admin.permNoName'))}</p>
          </div>
          <div class="admin-perm-actions">
            <button type="button" class="btn-ghost" id="admin-account-close">${escapeHtml(t('common.cancel'))}</button>
            ${canEdit && !isSuper ? `<button type="button" class="btn-primary" id="admin-account-save">${escapeHtml(t('common.save'))}</button>` : ''}
          </div>
        </div>
        <div class="admin-perm-panel-body">
          <div class="admin-rbac-block">
            <div class="admin-rbac-block-head">
              <h3>${escapeHtml(t('admin.roleBindTitle'))}</h3>
              <p>${escapeHtml(isSuper ? t('admin.roleSuperLocked') : (canEdit ? t('admin.accountBindHint') : t('admin.roleBindNeedSuper')))}</p>
            </div>
            ${isSuper
              ? `<span class="admin-role-seg-item active locked">${escapeHtml(roleLabel('super_admin'))}</span>`
              : `<select id="admin-account-role" class="admin-select" ${canEdit ? '' : 'disabled'}>
                  ${roles.filter((r) => r.code !== 'super_admin').map((r) => `
                    <option value="${escapeHtml(r.code)}" ${selectedRole === r.code ? 'selected' : ''}>${escapeHtml(r.name || r.code)}</option>
                  `).join('')}
                </select>`}
          </div>
          <div class="admin-rbac-block" style="margin-top:16px">
            <div class="admin-rbac-block-head">
              <h3>${escapeHtml(t('admin.rolePermTitle'))}</h3>
              <p>${escapeHtml(t('admin.accountPermReadonlyHint'))}</p>
            </div>
            ${renderPermTree(draft, false)}
          </div>
        </div>
      </section>`
  }

  function renderAccountsPage(users) {
    const filtered = getFilteredUsers(users)
    const selected = accountState.panelOpen
      ? (users.find((u) => u.id === accountState.userId) || null)
      : null
    if (selected && !accountState.roleDraft) accountState.roleDraft = resolveProfileRole(selected)
    const canSuper = Auth().isSuperAdmin?.() === true
    const roleFilter = accountState.roleFilter || 'all'
    const roles = accountState.roles.length ? accountState.roles : Perm().getRolesList?.() || []

    return `
      <div class="page admin-page admin-console-page">
        ${renderAdminHeader(t('nav.adminAccounts'), t('admin.accountsDesc'))}

        <div class="admin-filter-bar">
          <div class="admin-filter-fields">
            <label class="admin-filter-item admin-filter-item-search">
              <span>${escapeHtml(t('admin.permFilterSearch'))}</span>
              <input type="search" id="admin-account-search" placeholder="${escapeHtml(t('admin.permSearch'))}" value="${escapeHtml(accountState.q)}" />
            </label>
            <label class="admin-filter-item admin-filter-item-sm">
              <span>${escapeHtml(t('admin.permFilterRole'))}</span>
              <select id="admin-account-role-filter">
                <option value="all" ${roleFilter === 'all' ? 'selected' : ''}>${escapeHtml(t('admin.permRoleAll'))}</option>
                ${roles.map((r) => `<option value="${escapeHtml(r.code)}" ${roleFilter === r.code ? 'selected' : ''}>${escapeHtml(r.name || r.code)}</option>`).join('')}
              </select>
            </label>
            <div class="admin-filter-item admin-filter-item-btn">
              <span class="admin-filter-label-spacer" aria-hidden="true">&nbsp;</span>
              <button type="button" class="btn-ghost admin-filter-reset" id="admin-account-filter-reset">${escapeHtml(t('admin.permFilterReset'))}</button>
            </div>
            <div class="admin-filter-item admin-filter-item-btn">
              <span class="admin-filter-label-spacer" aria-hidden="true">&nbsp;</span>
              <button type="button" class="btn-primary" id="admin-account-filter-query">${escapeHtml(t('admin.filterQuery'))}</button>
            </div>
          </div>
          <div class="admin-filter-item admin-filter-item-btn admin-filter-trailing">
            <span class="admin-filter-label-spacer" aria-hidden="true">&nbsp;</span>
            <div class="admin-filter-meta">${escapeHtml(t('admin.permCount', { n: filtered.length }))}</div>
          </div>
        </div>

        <div class="admin-perm-table-wrap">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t('admin.permColEmail'))}</th>
                <th>${escapeHtml(t('admin.permColName'))}</th>
                <th>${escapeHtml(t('admin.permColRole'))}</th>
                <th>${escapeHtml(t('admin.permColLastLogin'))}</th>
                <th>${escapeHtml(t('admin.permColCreated'))}</th>
                <th class="admin-data-col-action">${escapeHtml(t('admin.permColAction'))}</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length ? filtered.map((u) => {
                const role = resolveProfileRole(u)
                const me = Auth().getSession?.()?.user?.id === u.id
                const canDelete = canSuper && role !== 'super_admin' && !me
                return `<tr class="admin-data-row" data-user-id="${escapeHtml(u.id)}">
                  <td><span class="admin-data-primary">${escapeHtml(u.email || '-')}</span></td>
                  <td>${escapeHtml(u.display_name || '—')}</td>
                  <td><span class="admin-role-badge admin-role-${['user','admin','super_admin'].includes(role) ? role : 'user'}">${escapeHtml(roleLabel(role))}</span></td>
                  <td>${u.last_login_at ? formatDate(u.last_login_at) : '—'}</td>
                  <td>${u.created_at ? formatDate(u.created_at) : '—'}</td>
                  <td class="admin-data-col-action admin-op-links">
                    <button type="button" class="admin-link-btn" data-op="view" data-user-id="${escapeHtml(u.id)}">${escapeHtml(t('admin.opViewPerm'))}</button>
                    <button type="button" class="admin-link-btn" data-op="edit" data-user-id="${escapeHtml(u.id)}" ${canSuper ? '' : 'disabled'}>${escapeHtml(t('admin.opEdit'))}</button>
                    <button type="button" class="admin-link-btn admin-link-danger" data-op="delete" data-user-id="${escapeHtml(u.id)}" ${canDelete ? '' : 'disabled'}>${escapeHtml(t('admin.opDelete'))}</button>
                  </td>
                </tr>`
              }).join('') : `<tr><td colspan="6" class="admin-data-empty">${escapeHtml(t('admin.permEmpty'))}</td></tr>`}
            </tbody>
          </table>
        </div>
        ${selected ? renderAccountPanel(selected) : ''}
      </div>`
  }

  function bindAccountsEvents(users) {
    const rerender = () => {
      document.getElementById('main').innerHTML = renderAccountsPage(users)
      bindAccountsEvents(users)
    }

    document.getElementById('admin-account-search')?.addEventListener('input', (e) => {
      accountState.q = e.target.value
    })
    document.getElementById('admin-account-search')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        accountState.appliedQ = accountState.q
        rerender()
      }
    })
    document.getElementById('admin-account-role-filter')?.addEventListener('change', (e) => {
      accountState.roleFilter = e.target.value || 'all'
    })
    document.getElementById('admin-account-filter-reset')?.addEventListener('click', () => {
      accountState.q = ''
      accountState.appliedQ = ''
      accountState.roleFilter = 'all'
      rerender()
    })
    document.getElementById('admin-account-filter-query')?.addEventListener('click', () => {
      accountState.appliedQ = accountState.q
      rerender()
    })

    const openUser = (userId, mode) => {
      const user = users.find((u) => u.id === userId)
      if (!user) return
      accountState.userId = user.id
      accountState.roleDraft = resolveProfileRole(user)
      accountState.panelMode = mode
      accountState.panelOpen = true
      rerender()
      document.getElementById('admin-account-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    document.querySelectorAll('.admin-op-links [data-op]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        if (btn.disabled) return
        const userId = btn.dataset.userId
        const op = btn.dataset.op
        if (op === 'view' || op === 'edit') {
          openUser(userId, op)
          return
        }
        if (op === 'delete') {
          const user = users.find((u) => u.id === userId)
          if (!user) return
          if (!Auth().isSuperAdmin?.()) {
            showToast(t('admin.accountDeleteDenied'), 'error')
            return
          }
          if (resolveProfileRole(user) === 'super_admin') {
            showToast(t('admin.roleSuperLocked'), 'error')
            return
          }
          if (Auth().getSession?.()?.user?.id === userId) {
            showToast(t('admin.accountDeleteSelf'), 'error')
            return
          }
          if (!confirm(t('admin.accountDeleteConfirm', { email: user.email || user.id }))) return
          try {
            const sb = Auth().getClient()
            if (!sb) throw new Error(t('auth.notConfigured'))
            let error = null
            ;({ error } = await sb.from('profiles').update({
              is_disabled: true,
              updated_at: new Date().toISOString(),
            }).eq('id', userId))
            if (error && /is_disabled/i.test(error.message || '')) {
              throw new Error(t('admin.roleSqlHint'))
            }
            if (error) throw error
            const idx = users.findIndex((u) => u.id === userId)
            if (idx >= 0) users[idx] = { ...users[idx], is_disabled: true }
            accountState.panelOpen = false
            showToast(t('admin.accountDeleted'), 'success')
            rerender()
          } catch (err) {
            showToast(err.message || String(err), 'error')
          }
        }
      })
    })

    document.getElementById('admin-account-close')?.addEventListener('click', () => {
      accountState.panelOpen = false
      rerender()
    })

    document.getElementById('admin-account-role')?.addEventListener('change', (e) => {
      accountState.roleDraft = e.target.value
      rerender()
    })

    document.getElementById('admin-account-save')?.addEventListener('click', async () => {
      const userId = accountState.userId
      const selected = users.find((u) => u.id === userId)
      if (!selected) return
      const currentRole = resolveProfileRole(selected)
      const nextRole = currentRole === 'super_admin' ? 'super_admin' : (accountState.roleDraft || 'user')
      try {
        if (!Auth().isSuperAdmin?.()) throw new Error(t('admin.roleBindNeedSuper'))
        if (currentRole === 'super_admin' && nextRole !== 'super_admin') {
          throw new Error(t('admin.roleSuperLocked'))
        }
        const sb = Auth().getClient()
        if (!sb) throw new Error(t('auth.notConfigured'))
        const payload = {
          updated_at: new Date().toISOString(),
          is_admin: nextRole === 'admin' || nextRole === 'super_admin',
          role: nextRole,
        }
        const { error } = await sb.from('profiles').update(payload).eq('id', userId)
        if (error) throw error
        const idx = users.findIndex((u) => u.id === userId)
        if (idx >= 0) users[idx] = { ...users[idx], role: nextRole, is_admin: payload.is_admin }
        accountState.roleDraft = nextRole
        showToast(t('admin.permSaved'), 'success')
        accountState.panelOpen = false
        rerender()
      } catch (e) {
        showToast(e.message || String(e), 'error')
      }
    })
  }

  async function renderAccountsRoute() {
    const main = document.getElementById('main')
    main.innerHTML = `<div class="page"><p>${escapeHtml(t('common.loading'))}</p></div>`
    try {
      const [users, roles] = await Promise.all([fetchAdminUsers(), fetchRoles()])
      accountState.users = users
      accountState.roles = roles
      accountState.panelOpen = false
      main.innerHTML = renderAccountsPage(users)
      bindAccountsEvents(users)
    } catch (e) {
      main.innerHTML = `<div class="page admin-page">${renderAdminHeader(t('nav.adminAccounts'), '')}<p>${escapeHtml(e.message)}</p><p class="form-hint">${escapeHtml(t('admin.permSqlHint'))}</p></div>`
    }
  }

  window.PDMAdminRbac = {
    renderAccountsRoute,
    renderRolesRoute,
    resolveProfileRole,
    roleLabel,
  }
})()
