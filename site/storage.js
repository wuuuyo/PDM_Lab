/**
 * 个人数据持久化：IndexedDB 主存储 + localStorage 镜像备份
 * 知识库同步（sync-knowledge）不会触及此处数据。
 */
;(function () {
const MEMORY_KEY = 'pdm-learn-memories'
const REVIEW_KEY = 'pdm-learn-reviews'
const CUSTOM_KNOWLEDGE_KEY = 'pdm-learn-custom-knowledge'
const FAVORITES_KEY = 'pdm-learn-favorites'
const ARTICLE_NOTES_KEY = 'pdm-learn-article-notes'
const KNOWLEDGE_GROUPS_KEY = 'pdm-learn-knowledge-groups'
const PATH_PROGRESS_KEY = 'pdm-learn-path-progress'
const DB_NAME = 'pdm-learn-db'
const DB_VERSION = 1
const STORE = 'kv'
const LOCAL_STORAGE_SOFT_LIMIT = 4 * 1024 * 1024 // 4MB，localStorage 安全上限

let memoryCache = []
let reviewCache = []
let customKnowledgeCache = []
let favoritesCache = []
let articleNotesCache = []
let knowledgeGroupsCache = []
let pathProgressCache = {}
let pushSettingsCache = { enabled: false, time: '09:00', count: 3, categories: [], lastPushDate: null, lastPushItems: [], pushHistory: [] }
let ready = false
let initPromise = null

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGet(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbSet(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLocal(key, data) {
  try {
    const json = JSON.stringify(data)
    if (json.length > LOCAL_STORAGE_SOFT_LIMIT) return false
    localStorage.setItem(key, json)
    return true
  } catch {
    return false
  }
}

function pickNewer(idbData, localData) {
  const idb = Array.isArray(idbData) ? idbData : []
  const local = Array.isArray(localData) ? localData : []
  if (idb.length === 0 && local.length === 0) return []
  if (idb.length === 0) return local
  if (local.length === 0) return idb

  const map = new Map()
  for (const item of idb) map.set(item.id, item)
  for (const item of local) {
    const existing = map.get(item.id)
    if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
      map.set(item.id, item)
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  )
}

async function persistAll() {
  const db = await openDB()
  await idbSet(db, MEMORY_KEY, memoryCache)
  await idbSet(db, REVIEW_KEY, reviewCache)
  await idbSet(db, CUSTOM_KNOWLEDGE_KEY, customKnowledgeCache)
  await idbSet(db, FAVORITES_KEY, favoritesCache)
  await idbSet(db, ARTICLE_NOTES_KEY, articleNotesCache)
  await idbSet(db, KNOWLEDGE_GROUPS_KEY, knowledgeGroupsCache)
  await idbSet(db, PATH_PROGRESS_KEY, pathProgressCache)
  await idbSet(db, 'pdm-learn-push-settings', pushSettingsCache)
  db.close()

  const localOk =
    writeLocal(MEMORY_KEY, memoryCache) &&
    writeLocal(REVIEW_KEY, reviewCache) &&
    writeLocal(CUSTOM_KNOWLEDGE_KEY, customKnowledgeCache) &&
    writeLocal(FAVORITES_KEY, favoritesCache) &&
    writeLocal(ARTICLE_NOTES_KEY, articleNotesCache) &&
    writeLocal(KNOWLEDGE_GROUPS_KEY, knowledgeGroupsCache) &&
    writeLocal(PATH_PROGRESS_KEY, pathProgressCache) &&
    writeLocal('pdm-learn-push-settings', pushSettingsCache)

  if (cloudPushFn) {
    cloudPushFn().catch((err) => console.warn('Cloud push failed:', err))
  }

  return { localOk }
}

let cloudPushFn = null

function setCloudPush(fn) {
  cloudPushFn = fn
}

function getSyncPayload() {
  return {
    memories: memoryCache,
    reviews: reviewCache,
    customKnowledge: customKnowledgeCache,
    favorites: favoritesCache,
    articleNotes: articleNotesCache,
    knowledgeGroups: knowledgeGroupsCache,
    pushSettings: pushSettingsCache,
    clientUpdatedAt: new Date().toISOString(),
  }
}

async function mergeFromCloudPayload(payload) {
  memoryCache = mergeById(memoryCache, payload.memories || [])
  reviewCache = mergeById(reviewCache, payload.reviews || [])
  customKnowledgeCache = mergeById(customKnowledgeCache, payload.customKnowledge || [])
  favoritesCache = mergeFavorites(favoritesCache, payload.favorites || [])
  articleNotesCache = mergeById(articleNotesCache, payload.articleNotes || [])
  knowledgeGroupsCache = mergeById(knowledgeGroupsCache, payload.knowledgeGroups || [])
  if (payload.pushSettings && typeof payload.pushSettings === 'object') {
    pushSettingsCache = { ...pushSettingsCache, ...payload.pushSettings }
  }
  const prevPush = cloudPushFn
  cloudPushFn = null
  const result = await persistAll()
  cloudPushFn = prevPush
  return result
}

async function mergeAndPersist(memories, reviews) {
  return mergeFromCloudPayload({ memories, reviews })
}

function mergeFavorites(existing, incoming) {
  const map = new Map()
  for (const f of existing) map.set(favoriteKey(f), f)
  for (const f of incoming) {
    const k = favoriteKey(f)
    const old = map.get(k)
    if (!old || new Date(f.favoritedAt) >= new Date(old.favoritedAt)) map.set(k, f)
  }
  return [...map.values()].sort((a, b) => new Date(b.favoritedAt) - new Date(a.favoritedAt))
}

function articleNoteRefKey(ref) {
  if (ref.source === 'free') return `free:${ref.id || ref.itemId || 'loose'}`
  if (ref.source === 'my') return `my:${ref.itemId}`
  return `public:${ref.categoryId}:${ref.itemId}`
}

function favoriteKey(f) {
  return f.source === 'my' ? `my:${f.itemId}` : `public:${f.categoryId}:${f.itemId}`
}

function migrateData() {
  const now = new Date().toISOString()
  if (!knowledgeGroupsCache.length) {
    knowledgeGroupsCache = [{
      id: 'default',
      name: '默认分组',
      description: '未指定分组的知识',
      createdAt: now,
      updatedAt: now,
    }]
  }
  customKnowledgeCache = customKnowledgeCache.map((k) => {
    if (k.groupId) return k
    return { ...k, groupId: 'default' }
  })
}

async function initStorage() {
  if (ready) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    const db = await openDB()
    const idbMemories = await idbGet(db, MEMORY_KEY)
    const idbReviews = await idbGet(db, REVIEW_KEY)
    const idbCustom = await idbGet(db, CUSTOM_KNOWLEDGE_KEY)
    const idbFav = await idbGet(db, FAVORITES_KEY)
    const idbNotes = await idbGet(db, ARTICLE_NOTES_KEY)
    const idbGroups = await idbGet(db, KNOWLEDGE_GROUPS_KEY)
    const idbPathProgress = await idbGet(db, PATH_PROGRESS_KEY)
    const idbPush = await idbGet(db, 'pdm-learn-push-settings')
    db.close()

    const localMemories = readLocal(MEMORY_KEY)
    const localReviews = readLocal(REVIEW_KEY)
    const localCustom = readLocal(CUSTOM_KNOWLEDGE_KEY)
    const localFav = readLocal(FAVORITES_KEY)
    const localNotes = readLocal(ARTICLE_NOTES_KEY)
    const localGroups = readLocal(KNOWLEDGE_GROUPS_KEY)
    const localPathProgress = readLocal(PATH_PROGRESS_KEY)
    const localPush = readLocal('pdm-learn-push-settings')

    memoryCache = pickNewer(idbMemories, localMemories)
    reviewCache = pickNewer(idbReviews, localReviews)
    customKnowledgeCache = pickNewer(idbCustom, localCustom)
    favoritesCache = mergeFavorites(
      Array.isArray(idbFav) ? idbFav : [],
      Array.isArray(localFav) ? localFav : [],
    )
    articleNotesCache = pickNewer(
      Array.isArray(idbNotes) ? idbNotes : [],
      Array.isArray(localNotes) ? localNotes : [],
    )
    knowledgeGroupsCache = pickNewer(idbGroups, localGroups)
    pathProgressCache =
      idbPathProgress && typeof idbPathProgress === 'object' && !Array.isArray(idbPathProgress)
        ? idbPathProgress
        : localPathProgress && typeof localPathProgress === 'object' && !Array.isArray(localPathProgress)
          ? localPathProgress
          : {}
    if (idbPush || localPush) {
      pushSettingsCache = { ...pushSettingsCache, ...(idbPush || localPush) }
    }

    migrateData()

    await persistAll()
    ready = true
  })()

  return initPromise
}

function loadMemories() {
  return memoryCache
}

function loadReviews() {
  return reviewCache
}

async function saveMemories(notes) {
  await initStorage()
  memoryCache = notes
  return persistAll()
}

async function saveReviews(reviews) {
  await initStorage()
  reviewCache = reviews
  return persistAll()
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function loadCustomKnowledge() {
  return customKnowledgeCache
}

async function saveCustomKnowledge(items) {
  await initStorage()
  customKnowledgeCache = items
  return persistAll()
}

function getPushSettings() {
  return pushSettingsCache
}

async function savePushSettings(settings) {
  await initStorage()
  pushSettingsCache = { ...pushSettingsCache, ...settings }
  return persistAll()
}

function loadFavorites() {
  return favoritesCache
}

async function saveFavorites(items) {
  await initStorage()
  favoritesCache = items
  return persistAll()
}

function isFavorited(ref) {
  const key = favoriteKey(ref)
  return favoritesCache.some((f) => favoriteKey(f) === key)
}

async function toggleFavorite(ref) {
  await initStorage()
  const key = favoriteKey(ref)
  const exists = favoritesCache.find((f) => favoriteKey(f) === key)
  if (exists) {
    favoritesCache = favoritesCache.filter((f) => favoriteKey(f) !== key)
  } else {
    favoritesCache = [{
      ...ref,
      favoritedAt: new Date().toISOString(),
    }, ...favoritesCache]
  }
  return persistAll()
}

function loadKnowledgeGroups() {
  return knowledgeGroupsCache
}

async function saveKnowledgeGroups(groups) {
  await initStorage()
  knowledgeGroupsCache = groups
  return persistAll()
}

function loadArticleNotes() {
  return articleNotesCache
}

async function saveArticleNotes(notes) {
  await initStorage()
  articleNotesCache = notes
  return persistAll()
}

function getArticleNotesForRef(ref) {
  const key = articleNoteRefKey(ref)
  return articleNotesCache
    .filter((n) => articleNoteRefKey(n) === key)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

async function addArticleNote(ref, content) {
  await initStorage()
  const now = new Date().toISOString()
  const note = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    source: ref.source || 'free',
    categoryId: ref.categoryId || null,
    itemId: ref.itemId || null,
    title: (ref.title || '').trim() || null,
    content: content.trim(),
    createdAt: now,
    updatedAt: now,
  }
  articleNotesCache = [note, ...articleNotesCache]
  return persistAll()
}

async function updateArticleNote(id, content) {
  await initStorage()
  const now = new Date().toISOString()
  articleNotesCache = articleNotesCache.map((n) =>
    n.id === id ? { ...n, content: content.trim(), updatedAt: now } : n,
  )
  return persistAll()
}

async function deleteArticleNote(id) {
  await initStorage()
  articleNotesCache = articleNotesCache.filter((n) => n.id !== id)
  return persistAll()
}

function getStorageStats() {
  const payload = JSON.stringify({
    memories: memoryCache,
    reviews: reviewCache,
    customKnowledge: customKnowledgeCache,
    favorites: favoritesCache,
    articleNotes: articleNotesCache,
    knowledgeGroups: knowledgeGroupsCache,
    pushSettings: pushSettingsCache,
  })
  const bytes = new Blob([payload]).size
  return {
    memoryCount: memoryCache.length,
    reviewCount: reviewCache.length,
    customKnowledgeCount: customKnowledgeCache.length,
    favoritesCount: favoritesCache.length,
    articleNotesCount: articleNotesCache.length,
    groupCount: knowledgeGroupsCache.length,
    bytes,
    readable: formatBytes(bytes),
    localMirrorOk: bytes <= LOCAL_STORAGE_SOFT_LIMIT,
  }
}

function exportBackup() {
  const payload = {
    version: 1,
    app: 'pdm-learn',
    exportedAt: new Date().toISOString(),
    memories: memoryCache,
    reviews: reviewCache,
    customKnowledge: customKnowledgeCache,
    favorites: favoritesCache,
    articleNotes: articleNotesCache,
    knowledgeGroups: knowledgeGroupsCache,
    pushSettings: pushSettingsCache,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `pdm-learn-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

function mergeById(existing, incoming) {
  const map = new Map(existing.map((item) => [item.id, item]))
  for (const item of incoming) {
    const old = map.get(item.id)
    if (!old || new Date(item.updatedAt) >= new Date(old.updatedAt)) {
      map.set(item.id, item)
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  )
}

async function importBackup(file, mode = 'merge') {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.memories) || !Array.isArray(data.reviews)) {
    throw new Error('备份文件格式不正确')
  }

  if (mode === 'replace') {
    memoryCache = data.memories
    reviewCache = data.reviews
    customKnowledgeCache = Array.isArray(data.customKnowledge) ? data.customKnowledge : []
    favoritesCache = Array.isArray(data.favorites) ? data.favorites : []
    articleNotesCache = Array.isArray(data.articleNotes) ? data.articleNotes : []
    knowledgeGroupsCache = Array.isArray(data.knowledgeGroups) ? data.knowledgeGroups : []
  } else {
    memoryCache = mergeById(memoryCache, data.memories)
    reviewCache = mergeById(reviewCache, data.reviews)
    if (Array.isArray(data.customKnowledge)) {
      customKnowledgeCache = mergeById(customKnowledgeCache, data.customKnowledge)
    }
    if (Array.isArray(data.favorites)) {
      favoritesCache = mergeFavorites(favoritesCache, data.favorites)
    }
    if (Array.isArray(data.articleNotes)) {
      articleNotesCache = mergeById(articleNotesCache, data.articleNotes)
    }
    if (Array.isArray(data.knowledgeGroups)) {
      knowledgeGroupsCache = mergeById(knowledgeGroupsCache, data.knowledgeGroups)
    }
    if (data.pushSettings) {
      pushSettingsCache = { ...pushSettingsCache, ...data.pushSettings }
    }
  }

  await persistAll()
  migrateData()
  return {
    memoryCount: memoryCache.length,
    reviewCount: reviewCache.length,
    customKnowledgeCount: customKnowledgeCache.length,
    favoritesCount: favoritesCache.length,
    articleNotesCount: articleNotesCache.length,
    groupCount: knowledgeGroupsCache.length,
  }
}

function pathTaskKey(phaseIdx, taskIdx) {
  return `${phaseIdx}:${taskIdx}`
}

function loadPathProgress(pathId) {
  if (!pathId) return {}
  return pathProgressCache[pathId] || {}
}

async function savePathProgress(pathId, progress) {
  if (!pathId) return
  pathProgressCache = { ...pathProgressCache, [pathId]: progress || {} }
  await persistAll()
}

function isPathTaskDone(pathId, phaseIdx, taskIdx) {
  return Boolean(loadPathProgress(pathId)[pathTaskKey(phaseIdx, taskIdx)])
}

async function togglePathTask(pathId, phaseIdx, taskIdx) {
  const progress = { ...loadPathProgress(pathId) }
  const key = pathTaskKey(phaseIdx, taskIdx)
  progress[key] = !progress[key]
  await savePathProgress(pathId, progress)
  return progress[key]
}

function countPathProgress(path) {
  if (!path?.phases) return { done: 0, total: 0 }
  const progress = loadPathProgress(path.id)
  let done = 0
  let total = 0
  path.phases.forEach((ph, pi) => {
    ;(ph.tasks || []).forEach((_, ti) => {
      total += 1
      if (progress[pathTaskKey(pi, ti)]) done += 1
    })
  })
  return { done, total }
}

// 挂载到全局，供 app.js 使用
window.PDMStorage = {
  initStorage,
  loadMemories,
  loadReviews,
  loadCustomKnowledge,
  saveMemories,
  saveReviews,
  saveCustomKnowledge,
  getPushSettings,
  savePushSettings,
  loadFavorites,
  saveFavorites,
  isFavorited,
  toggleFavorite,
  loadKnowledgeGroups,
  saveKnowledgeGroups,
  loadArticleNotes,
  saveArticleNotes,
  getArticleNotesForRef,
  addArticleNote,
  updateArticleNote,
  deleteArticleNote,
  getStorageStats,
  exportBackup,
  importBackup,
  mergeAndPersist,
  mergeFromCloudPayload,
  getSyncPayload,
  setCloudPush,
  loadPathProgress,
  savePathProgress,
  isPathTaskDone,
  togglePathTask,
  countPathProgress,
  isReady: () => ready,
}
})()
