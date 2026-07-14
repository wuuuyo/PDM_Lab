/**

 * 全站知识 CMS（管理员网页编辑，无需 Cursor）

 * shared_knowledge：published=true 对所有用户可见

 */

;(function () {

  let items = []

  let loaded = false



  const SKILL_LABELS = {

    'pm-bagu': '产品经理八股',

    'industry-terms': '行业通用词语',

    'workflow': '工作流程',

    'product-methodology': '产品策划方法论',

    'system-architecture': '系统架构',

    admin: '运营新增',

  }



  function mapRow(row) {

    return {

      id: row.id,

      categoryId: row.category_id,

      title: row.title,

      summary: row.summary || '',

      tags: row.tags || [],

      content: row.content || [],

      sourceSkill: row.source_skill || 'admin',

      sourceKey: row.source_key,

      section: row.section || '',

      published: Boolean(row.published),

      isShared: Boolean(row.published),

      updatedAt: row.updated_at,

      createdAt: row.created_at,

    }

  }



  function getSkillLabel(skillId) {

    return SKILL_LABELS[skillId] || skillId || '运营新增'

  }



  async function fetchAll() {

    const Auth = window.PDMAuth

    if (!Auth?.isConfigured()) {

      items = []

      loaded = true

      return items

    }

    const sb = Auth.getClient()

    if (!sb) return items



    const { data, error } = await sb

      .from('shared_knowledge')

      .select('*')

      .eq('published', true)

      .order('updated_at', { ascending: false })



    if (error) {

      console.warn('Shared knowledge:', error.message)

      return items

    }



    items = (data || []).map(mapRow)

    loaded = true

    return items

  }



  async function fetchAdminList() {

    const Auth = window.PDMAuth

    if (!Auth?.isAdmin()) throw new Error('无权限')

    const sb = Auth.getClient()

    const { data, error } = await sb

      .from('shared_knowledge')

      .select('*')

      .order('updated_at', { ascending: false })

    if (error) throw error

    return (data || []).map(mapRow)

  }



  async function getById(id) {

    const Auth = window.PDMAuth

    if (!Auth?.isAdmin()) throw new Error('无权限')

    const sb = Auth.getClient()

    const { data, error } = await sb.from('shared_knowledge').select('*').eq('id', id).maybeSingle()

    if (error) throw error

    return data ? mapRow(data) : null

  }



  function getItems() {

    return items

  }



  function isLoaded() {

    return loaded

  }



  function slugify(text) {

    return String(text)

      .toLowerCase()

      .replace(/[（(][^）)]*[）)]/g, '')

      .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '-')

      .replace(/^-+|-+$/g, '')

      .slice(0, 48) || 'item'

  }



  async function saveEntry(entry) {

    const Auth = window.PDMAuth

    if (!Auth?.isAdmin()) throw new Error('无权限')

    const sb = Auth.getClient()

    const user = Auth.getSession()?.user

    const sourceSkill = entry.sourceSkill || 'admin'

    const sourceKey = entry.sourceKey || (sourceSkill !== 'admin' ? `${sourceSkill}:${slugify(entry.title)}` : null)

    const id = entry.id || sourceKey || `admin-${Date.now()}`

    const row = {

      id,

      category_id: entry.categoryId,

      title: entry.title,

      summary: entry.summary || entry.title,

      tags: entry.tags || [],

      content: entry.content || [],

      source_skill: sourceSkill,

      source_key: sourceKey,

      section: entry.section || '',

      published: Boolean(entry.published),

      created_by: entry.createdBy || user?.id || null,

      updated_at: new Date().toISOString(),

    }

    const { error } = await sb.from('shared_knowledge').upsert(row, { onConflict: 'id' })

    if (error) throw error

    await fetchAll()

    if (window.PDMAnalytics) {

      window.PDMAnalytics.track('admin_save_knowledge', { title: entry.title, published: row.published })

    }

    return mapRow(row)

  }



  async function deleteEntry(id) {

    const Auth = window.PDMAuth

    if (!Auth?.isAdmin()) throw new Error('无权限')

    const sb = Auth.getClient()

    const { error } = await sb.from('shared_knowledge').delete().eq('id', id)

    if (error) throw error

    await fetchAll()

  }



  async function importBuiltinCatalog() {

    const Auth = window.PDMAuth

    if (!Auth?.isAdmin()) throw new Error('无权限')

    const catalog = window.PDMSkillsCatalog || []

    if (!catalog.length) throw new Error('内置 Skill 目录为空')

    const existing = await fetchAdminList()

    const existingKeys = new Set(existing.map((e) => e.sourceKey || e.id))

    let imported = 0

    for (const e of catalog) {

      if (existingKeys.has(e.sourceKey)) continue

      await saveEntry({

        id: e.sourceKey,

        sourceKey: e.sourceKey,

        sourceSkill: e.skillId,

        categoryId: e.categoryId,

        section: e.section || '',

        title: e.title,

        summary: e.summary,

        tags: e.tags || [],

        content: e.content || [],

        published: false,

      })

      imported++

    }

    return imported

  }



  async function init() {

    return fetchAll()

  }



  window.PDMSharedKnowledge = {

    init,

    fetchAll,

    fetchAdminList,

    getById,

    getItems,

    isLoaded,

    saveEntry,

    deleteEntry,

    importBuiltinCatalog,

    getSkillLabel,

    SKILL_LABELS,

  }

})()


