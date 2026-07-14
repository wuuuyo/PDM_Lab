import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js'
import {
  initStorage,
  getSyncPayload,
  mergeAndPersist,
  loadMemories,
  loadReviews,
  setCloudPush,
} from './storage'

const CONFIG_URL_KEY = 'pdm-cloud-url'
const CONFIG_KEY_KEY = 'pdm-cloud-anon-key'

export interface CloudState {
  configured: boolean
  loggedIn: boolean
  email: string
  lastSyncAt: string | null
  syncStatus: 'idle' | 'syncing' | 'error' | 'ok'
  lastError: string | null
}

let client: SupabaseClient | null = null
let session: Session | null = null
let lastSyncAt: string | null = null
let syncStatus: CloudState['syncStatus'] = 'idle'
let lastError: string | null = null

export function getConfig() {
  const fromEnv = {
    url: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  }
  return {
    url: localStorage.getItem(CONFIG_URL_KEY) || fromEnv.url || '',
    anonKey: localStorage.getItem(CONFIG_KEY_KEY) || fromEnv.anonKey || '',
  }
}

export function saveConfig(url: string, anonKey: string) {
  localStorage.setItem(CONFIG_URL_KEY, url.trim())
  localStorage.setItem(CONFIG_KEY_KEY, anonKey.trim())
  client = null
}

export function isConfigured() {
  const { url, anonKey } = getConfig()
  return Boolean(url && anonKey && url.includes('supabase'))
}

function getClient() {
  if (!isConfigured()) return null
  if (client) return client
  const { url, anonKey } = getConfig()
  client = createClient(url, anonKey)
  return client
}

export function getCloudState(): CloudState {
  return {
    configured: isConfigured(),
    loggedIn: Boolean(session?.user),
    email: session?.user?.email || '',
    lastSyncAt,
    syncStatus,
    lastError,
  }
}

async function refreshSession() {
  const sb = getClient()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  session = data.session
  return session
}

async function pullRemote() {
  const sb = getClient()
  if (!sb || !session?.user) return null
  const { data, error } = await sb
    .from('pdm_sync')
    .select('payload, updated_at')
    .eq('user_id', session.user.id)
    .maybeSingle()
  if (error) throw error
  return data
}

async function pushRemote(payload: ReturnType<typeof getSyncPayload>) {
  const sb = getClient()
  if (!sb || !session?.user) return
  const { error } = await sb.from('pdm_sync').upsert(
    {
      user_id: session.user.id,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

export async function syncNow() {
  if (!session?.user) throw new Error('请先登录')
  syncStatus = 'syncing'
  lastError = null
  try {
    await initStorage()
    const remote = await pullRemote()
    if (remote?.payload) {
      const p = remote.payload as { memories?: unknown[]; reviews?: unknown[] }
      await mergeAndPersist(
        (p.memories || []) as Parameters<typeof mergeAndPersist>[0],
        (p.reviews || []) as Parameters<typeof mergeAndPersist>[1],
      )
    }
    const payload = getSyncPayload()
    await pushRemote(payload)
    lastSyncAt = new Date().toISOString()
    syncStatus = 'ok'
    return { memories: loadMemories(), reviews: loadReviews() }
  } catch (err) {
    syncStatus = 'error'
    lastError = err instanceof Error ? err.message : String(err)
    throw err
  }
}

async function pushIfLoggedIn() {
  if (!session?.user) return
  try {
    syncStatus = 'syncing'
    await pushRemote(getSyncPayload())
    lastSyncAt = new Date().toISOString()
    syncStatus = 'ok'
    lastError = null
  } catch (err) {
    syncStatus = 'error'
    lastError = err instanceof Error ? err.message : String(err)
  }
}

export async function signIn(email: string, password: string) {
  const sb = getClient()
  if (!sb) throw new Error('请先配置 Supabase')
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  session = data.session
  return syncNow()
}

export async function signUp(email: string, password: string) {
  const sb = getClient()
  if (!sb) throw new Error('请先配置 Supabase')
  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) throw error
  if (data.session) {
    session = data.session
    await syncNow()
  }
  return data
}

export async function signOut() {
  const sb = getClient()
  if (sb) await sb.auth.signOut()
  session = null
  lastSyncAt = null
  syncStatus = 'idle'
}

export async function initCloud() {
  if (!isConfigured()) return getCloudState()
  setCloudPush(pushIfLoggedIn)
  await refreshSession()
  if (session?.user) {
    try {
      await syncNow()
    } catch {
      // 离线时保留本地数据
    }
  }
  const sb = getClient()
  sb?.auth.onAuthStateChange((_event, newSession) => {
    session = newSession
  })
  return getCloudState()
}
