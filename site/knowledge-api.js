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

  const list = categories.map((cat) => {

    const sharedItems = shared

      .filter((k) => k.categoryId === cat.id)

      .map(sharedToItem)

    return {

      ...cat,

      items: [...cat.items.map(localizeItem), ...sharedItems],

    }

  })

  // 快速参考置顶，其余保持原有顺序
  const ref = list.find((c) => c.id === 'reference')
  if (!ref) return list
  return [ref, ...list.filter((c) => c.id !== 'reference')]

}



function getCategoryByIdMerged(id) {

  return getMergedCategories().find((c) => c.id === id)

}



function getItemByIdMerged(categoryId, itemId) {

  const cat = getCategoryByIdMerged(categoryId)

  const inCat = cat?.items.find((i) => i.id === itemId)

  if (inCat) return inCat

  // 分类重组后：按条目 id 全局回退查找

  for (const c of getMergedCategories()) {

    const hit = c.items.find((i) => i.id === itemId)

    if (hit) return hit

  }

  return null

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



/** 规范化检索词：小写、压缩空白、去常见标点 */
function normalizeSearchText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\u4e00-\u9fffa-z0-9\s]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 子序列模糊：needle 字符按序出现在 haystack 中 */
function isSubsequenceMatch(haystack, needle) {
  if (!needle) return true
  if (!haystack) return false
  let i = 0
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++
  }
  return i === needle.length
}

/**
 * 模糊得分：越大越相关。0 = 不匹配。
 * 支持整句包含、分词（空格）全命中、子序列弱匹配。
 */
function fuzzyMatchScore(text, query) {
  const hay = normalizeSearchText(text)
  const q = normalizeSearchText(query)
  if (!q || !hay) return 0
  if (hay === q) return 1000
  if (hay.includes(q)) return 800 - Math.min(200, hay.indexOf(q))

  const tokens = q.split(' ').filter(Boolean)
  if (tokens.length > 1) {
    if (tokens.every((tok) => hay.includes(tok) || isSubsequenceMatch(hay, tok))) {
      let score = 500
      for (const tok of tokens) {
        if (hay.includes(tok)) score += 40
        else score += 10
      }
      return score
    }
    return 0
  }

  if (isSubsequenceMatch(hay, q) && q.length >= 2) {
    return 120 + Math.min(80, q.length * 4)
  }
  return 0
}

function scoreKnowledgeItem(item, query, extraFields = []) {
  const packs = [
    [item.title, 3],
    [item.summary, 2],
    [(item.tags || []).join(' '), 2],
    [(item.content || []).join('\n'), 1],
    [(item.cases || []).join('\n'), 1],
    [(item.pmApplication || []).join('\n'), 1],
    ...extraFields.map((f) => [f, 1]),
  ]
  let best = 0
  for (const [text, weight] of packs) {
    const s = fuzzyMatchScore(text, query) * weight
    if (s > best) best = s
  }
  return best
}

function searchMyKnowledge(query, groupId = 'all') {
  const q = String(query || '').trim()
  let items = getMyKnowledgeItems(groupId === 'all' ? null : groupId)
  if (!q) return items
  return items
    .map((item) => ({
      item,
      score: scoreKnowledgeItem(item, q, [item.groupName]),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)
}

function searchKnowledgeMerged(query) {
  const q = String(query || '').trim()
  if (!q) return []

  const results = []

  for (const category of getMergedCategories()) {
    for (const item of category.items) {
      const score = scoreKnowledgeItem(item, q, [category.title])
      if (score > 0) results.push({ category, item, source: 'public', score })
    }
  }

  for (const item of searchMyKnowledge(q)) {
    results.push({
      category: { id: 'my', title: item.groupName, icon: '◎' },
      item,
      source: 'my',
      score: scoreKnowledgeItem(item, q, [item.groupName]),
    })
  }

  results.sort((a, b) => (b.score || 0) - (a.score || 0))
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

  if (note.source === 'free' || (!note.itemId && !note.categoryId)) {

    const title = note.title || String(note.content || '').split('\n')[0].slice(0, 40) || '未命名笔记'

    return {

      source: 'free',

      category: null,

      item: { id: note.id, title, summary: '' },

      href: null,

      missing: false,

    }

  }

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

      item: { id: note.itemId, title: note.title || note.itemId || '笔记', summary: '' },

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


