export interface MemoryNote {
  id: string
  title: string
  content: string
  category: 'insight' | 'framework' | 'case' | 'quote' | 'other'
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ReviewEntry {
  id: string
  title: string
  period: string
  whatWorked: string
  whatFailed: string
  lessons: string
  nextActions: string
  createdAt: string
  updatedAt: string
}

export interface BackupPayload {
  version: number
  app: string
  exportedAt: string
  memories: MemoryNote[]
  reviews: ReviewEntry[]
}

export interface StorageStats {
  memoryCount: number
  reviewCount: number
  bytes: number
  readable: string
  localMirrorOk: boolean
}

const MEMORY_KEY = 'pdm-learn-memories'
const REVIEW_KEY = 'pdm-learn-reviews'
const DB_NAME = 'pdm-learn-db'
const DB_VERSION = 1
const STORE = 'kv'
const LOCAL_STORAGE_SOFT_LIMIT = 4 * 1024 * 1024

let memoryCache: MemoryNote[] = []
let reviewCache: ReviewEntry[] = []
let ready = false
let initPromise: Promise<void> | null = null

function openDB(): Promise<IDBDatabase> {
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

function idbGet(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbSet(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function readLocal<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLocal(key: string, data: unknown): boolean {
  try {
    const json = JSON.stringify(data)
    if (json.length > LOCAL_STORAGE_SOFT_LIMIT) return false
    localStorage.setItem(key, json)
    return true
  } catch {
    return false
  }
}

function pickNewer<T extends { id: string; updatedAt: string }>(
  idbData: T[] | null | undefined,
  localData: T[] | null | undefined,
): T[] {
  const idb = Array.isArray(idbData) ? idbData : []
  const local = Array.isArray(localData) ? localData : []
  if (idb.length === 0 && local.length === 0) return []
  if (idb.length === 0) return local
  if (local.length === 0) return idb

  const map = new Map<string, T>()
  for (const item of idb) map.set(item.id, item)
  for (const item of local) {
    const existing = map.get(item.id)
    if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
      map.set(item.id, item)
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

async function persistAll(): Promise<{ localOk: boolean }> {
  const db = await openDB()
  await idbSet(db, MEMORY_KEY, memoryCache)
  await idbSet(db, REVIEW_KEY, reviewCache)
  db.close()

  const localOk =
    writeLocal(MEMORY_KEY, memoryCache) && writeLocal(REVIEW_KEY, reviewCache)

  if (cloudPushFn) {
    cloudPushFn().catch((err) => console.warn('Cloud push failed:', err))
  }

  return { localOk }
}

let cloudPushFn: (() => Promise<void>) | null = null

export function setCloudPush(fn: () => Promise<void>) {
  cloudPushFn = fn
}

export function getSyncPayload() {
  return {
    memories: memoryCache,
    reviews: reviewCache,
    clientUpdatedAt: new Date().toISOString(),
  }
}

export async function mergeAndPersist(
  memories: MemoryNote[],
  reviews: ReviewEntry[],
): Promise<{ localOk: boolean }> {
  memoryCache = mergeById(memoryCache, memories || [])
  reviewCache = mergeById(reviewCache, reviews || [])
  const prevPush = cloudPushFn
  cloudPushFn = null
  const result = await persistAll()
  cloudPushFn = prevPush
  return result
}

export async function initStorage(): Promise<void> {
  if (ready) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    const db = await openDB()
    const idbMemories = (await idbGet(db, MEMORY_KEY)) as MemoryNote[] | undefined
    const idbReviews = (await idbGet(db, REVIEW_KEY)) as ReviewEntry[] | undefined
    db.close()

    memoryCache = pickNewer(idbMemories, readLocal<MemoryNote>(MEMORY_KEY))
    reviewCache = pickNewer(idbReviews, readLocal<ReviewEntry>(REVIEW_KEY))

    await persistAll()
    ready = true
  })()

  return initPromise
}

export function loadMemories(): MemoryNote[] {
  return memoryCache
}

export function loadReviews(): ReviewEntry[] {
  return reviewCache
}

export async function saveMemories(notes: MemoryNote[]): Promise<{ localOk: boolean }> {
  await initStorage()
  memoryCache = notes
  return persistAll()
}

export async function saveReviews(reviews: ReviewEntry[]): Promise<{ localOk: boolean }> {
  await initStorage()
  reviewCache = reviews
  return persistAll()
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function getStorageStats(): StorageStats {
  const payload = JSON.stringify({ memories: memoryCache, reviews: reviewCache })
  const bytes = new Blob([payload]).size
  return {
    memoryCount: memoryCache.length,
    reviewCount: reviewCache.length,
    bytes,
    readable: formatBytes(bytes),
    localMirrorOk: bytes <= LOCAL_STORAGE_SOFT_LIMIT,
  }
}

export function exportBackup(): void {
  const payload: BackupPayload = {
    version: 1,
    app: 'pdm-learn',
    exportedAt: new Date().toISOString(),
    memories: memoryCache,
    reviews: reviewCache,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `pdm-learn-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

function mergeById<T extends { id: string; updatedAt: string }>(
  existing: T[],
  incoming: T[],
): T[] {
  const map = new Map(existing.map((item) => [item.id, item]))
  for (const item of incoming) {
    const old = map.get(item.id)
    if (!old || new Date(item.updatedAt) >= new Date(old.updatedAt)) {
      map.set(item.id, item)
    }
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export async function importBackup(
  file: File,
  mode: 'merge' | 'replace' = 'merge',
): Promise<{ memoryCount: number; reviewCount: number }> {
  const text = await file.text()
  const data = JSON.parse(text) as Partial<BackupPayload>
  if (!data || !Array.isArray(data.memories) || !Array.isArray(data.reviews)) {
    throw new Error('备份文件格式不正确')
  }

  if (mode === 'replace') {
    memoryCache = data.memories
    reviewCache = data.reviews
  } else {
    memoryCache = mergeById(memoryCache, data.memories)
    reviewCache = mergeById(reviewCache, data.reviews)
  }

  await persistAll()
  return { memoryCount: memoryCache.length, reviewCount: reviewCache.length }
}

export const memoryCategoryLabels: Record<MemoryNote['category'], string> = {
  insight: '洞察',
  framework: '框架',
  case: '案例',
  quote: '金句',
  other: '其他',
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
