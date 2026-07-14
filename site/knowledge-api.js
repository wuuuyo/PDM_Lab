/**

 * 合并内置知识库、全站共享知识（公开库）

 * 个人自定义知识见 getMyKnowledge* 系列 API

 */

;(function () {

function sharedToItem(entry) {

  return {

    id: entry.id,

    title: entry.title,

    summary: entry.summary,

    tags: entry.tags || [],

    content: entry.content || [],

    isShared: true,

    sourceSkill: entry.sourceSkill,

    updatedAt: entry.updatedAt,

  }

}



function myEntryToItem(entry, group) {

  return {

    id: entry.id,

    groupId: entry.groupId,

    groupName: group?.name || '未分组',

    title: entry.title,

    summary: entry.summary,

    tags: entry.tags || [],

    content: entry.content || [],

    isCustom: true,

    updatedAt: entry.updatedAt,

  }

}



function isEnglishLocale() {

  return window.PMLabI18n?.getLocale() === 'en-US'

}



function localizeItem(item) {

  if (!isEnglishLocale()) return item

  const en = window.PM_KNOWLEDGE_EN?.[item.id]

  if (!en) return item

  return {

    ...item,

    title: en.title ?? item.title,

    summary: en.summary ?? item.summary,

    tags: en.tags ?? item.tags,

    content: en.content ?? item.content,

    cases: en.cases ?? item.cases,

    pmApplication: en.pmApplication ?? item.pmApplication,

  }

}



/** 公开知识库（内置 + 全站共享） */

function getMergedCategories() {

  const shared = window.PDMSharedKnowledge?.getItems() || []

  return categories.map((cat) => {

    const sharedItems = shared

      .filter((k) => k.categoryId === cat.id)

      .map(sharedToItem)

    return {

      ...cat,

      items: [...cat.items.map(localizeItem), ...sharedItems],

    }

  })

}



function getCategoryByIdMerged(id) {

  return getMergedCategories().find((c) => c.id === id)

}



function getItemByIdMerged(categoryId, itemId) {

  const cat = getCategoryByIdMerged(categoryId)

  return cat?.items.find((i) => i.id === itemId)

}



function getMyKnowledgeEntry(itemId) {

  return window.PDMStorage.loadCustomKnowledge().find((k) => k.id === itemId)

}



function getMyKnowledgeGroups() {

  return window.PDMStorage.loadKnowledgeGroups()

}



function getMyKnowledgeItems(groupId = null) {

  const groups = getMyKnowledgeGroups()

  const groupMap = new Map(groups.map((g) => [g.id, g]))

  let items = window.PDMStorage.loadCustomKnowledge()

  if (groupId && groupId !== 'all') {

    items = items.filter((k) => k.groupId === groupId)

  }

  return items

    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    .map((e) => myEntryToItem(e, groupMap.get(e.groupId)))

}



function getMyKnowledgeById(itemId) {

  const entry = getMyKnowledgeEntry(itemId)

  if (!entry) return null

  const group = getMyKnowledgeGroups().find((g) => g.id === entry.groupId)

  return myEntryToItem(entry, group)

}



function searchMyKnowledge(query, groupId = 'all') {

  const q = query.toLowerCase().trim()

  let items = getMyKnowledgeItems(groupId === 'all' ? null : groupId)

  if (!q) return items

  return items.filter((item) =>

    item.title.toLowerCase().includes(q) ||

    item.summary.toLowerCase().includes(q) ||

    item.groupName.toLowerCase().includes(q) ||

    item.tags.some((t) => t.toLowerCase().includes(q)) ||

    item.content.some((c) => c.toLowerCase().includes(q))

  )

}



function searchKnowledgeMerged(query) {

  const q = query.toLowerCase().trim()

  if (!q) return []

  const results = []

  for (const category of getMergedCategories()) {

    for (const item of category.items) {

      const match =

        item.title.toLowerCase().includes(q) ||

        item.summary.toLowerCase().includes(q) ||

        item.tags.some((t) => t.toLowerCase().includes(q)) ||

        item.content.some((c) => c.toLowerCase().includes(q)) ||

        (item.cases || []).some((c) => c.toLowerCase().includes(q)) ||

        (item.pmApplication || []).some((c) => c.toLowerCase().includes(q))

      if (match) results.push({ category, item, source: 'public' })

    }

  }

  for (const item of searchMyKnowledge(q)) {

    results.push({

      category: { id: 'my', title: item.groupName, icon: '◎' },

      item,

      source: 'my',

    })

  }

  return results

}



function getKnowledgeStats() {

  const merged = getMergedCategories()

  const builtinTotal = categories.reduce((s, c) => s + c.items.length, 0)

  const customTotal = window.PDMStorage.loadCustomKnowledge().length

  const sharedTotal = (window.PDMSharedKnowledge?.getItems() || []).length

  const groupTotal = window.PDMStorage.loadKnowledgeGroups().length

  return {

    categoryCount: merged.length,

    totalCount: builtinTotal + sharedTotal,

    publicCount: builtinTotal + sharedTotal,

    customCount: customTotal,

    sharedCount: sharedTotal,

    groupCount: groupTotal,

  }

}



function resolveFavorite(fav) {

  if (fav.source === 'my') {

    const item = getMyKnowledgeById(fav.itemId)

    if (!item) return null

    return { source: 'my', item, href: `#/my-knowledge/view/${item.id}` }

  }

  const cat = getCategoryByIdMerged(fav.categoryId)

  const item = cat?.items.find((i) => i.id === fav.itemId)

  if (!item || !cat) return null

  return { source: 'public', category: cat, item, href: `#/article/${cat.id}/${item.id}` }

}



function resolveArticleNote(note) {

  if (note.source === 'my') {

    const item = getMyKnowledgeById(note.itemId)

    if (!item) {

      return {

        source: 'my',

        item: { id: note.itemId, title: note.itemId, summary: '' },

        href: null,

        missing: true,

      }

    }

    return { source: 'my', item, href: `#/my-knowledge/view/${item.id}` }

  }

  const cat = getCategoryByIdMerged(note.categoryId)

  const item = cat?.items.find((i) => i.id === note.itemId)

  if (!item || !cat) {

    return {

      source: 'public',

      category: null,

      item: { id: note.itemId, title: note.itemId, summary: '' },

      href: null,

      missing: true,

    }

  }

  return { source: 'public', category: cat, item, href: `#/article/${cat.id}/${item.id}` }

}



window.PDMKnowledge = {

  getMergedCategories,

  getCategoryByIdMerged,

  getItemByIdMerged,

  getMyKnowledgeEntry,

  getMyKnowledgeGroups,

  getMyKnowledgeItems,

  getMyKnowledgeById,

  searchMyKnowledge,

  searchKnowledgeMerged,

  getKnowledgeStats,

  resolveFavorite,

  resolveArticleNote,

  builtinCategories: () => categories,

}

})()


