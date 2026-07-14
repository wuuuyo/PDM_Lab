/**
 * 云端数据同步（依赖 PDMAuth 统一登录）
 * 个人同步包上限 512KB，避免单用户占用过多数据库空间
 */
;(function () {
  const MAX_SYNC_BYTES = 512 * 1024

  let lastSyncAt = null
  let syncStatus = 'idle'
  let lastError = null

  function getCloudState() {
    const Auth = window.PDMAuth
    return {
      configured: Auth?.isConfigured() ?? false,
      loggedIn: Auth?.isLoggedIn() ?? false,
      email: Auth?.getSession()?.user?.email || '',
      lastSyncAt,
      syncStatus,
      lastError,
      maxSyncBytes: MAX_SYNC_BYTES,
    }
  }

  function measurePayloadBytes(payload) {
    try {
      return new TextEncoder().encode(JSON.stringify(payload)).length
    } catch (_) {
      return JSON.stringify(payload).length
    }
  }

  function assertPayloadSize(payload) {
    const bytes = measurePayloadBytes(payload)
    if (bytes <= MAX_SYNC_BYTES) return bytes
    const kb = Math.ceil(bytes / 1024)
    const limitKb = Math.floor(MAX_SYNC_BYTES / 1024)
    const err = new Error(
      window.PMLabI18n?.t?.('cloud.payloadTooLarge', { kb, limitKb })
      || `同步数据约 ${kb}KB，超过 ${limitKb}KB 上限。请精简笔记或我的知识库后再试。`
    )
    err.code = 'sync_payload_too_large'
    err.bytes = bytes
    err.limit = MAX_SYNC_BYTES
    throw err
  }

  function notifySyncError(err) {
    const msg = err?.message || String(err)
    if (typeof window.showToast === 'function') {
      window.showToast(msg, 'error')
    } else {
      console.warn('Cloud sync:', msg)
    }
  }

  async function pullRemote() {
    const Auth = window.PDMAuth
    const sb = Auth.getClient()
    const user = Auth.getSession()?.user
    if (!sb || !user) return null
    const { data, error } = await sb.from('pdm_sync').select('payload, updated_at').eq('user_id', user.id).maybeSingle()
    if (error) throw error
    return data
  }

  async function pushRemote(payload) {
    const Auth = window.PDMAuth
    const sb = Auth.getClient()
    const user = Auth.getSession()?.user
    if (!sb || !user) return
    assertPayloadSize(payload)
    const { error } = await sb.from('pdm_sync').upsert({
      user_id: user.id,
      payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) {
      if (/sync_payload_too_large|P0001/i.test(error.message || '')) {
        const err = new Error(
          window.PMLabI18n?.t?.('cloud.payloadTooLargeServer')
          || '云端同步数据过大（超过 512KB），请精简笔记或我的知识库。'
        )
        err.code = 'sync_payload_too_large'
        throw err
      }
      throw error
    }
  }

  async function syncNow() {
    const Auth = window.PDMAuth
    if (!Auth.isLoggedIn()) throw new Error('请先登录')
    syncStatus = 'syncing'
    lastError = null
    try {
      await window.PDMStorage.initStorage()
      const remote = await pullRemote()
      if (remote?.payload) await window.PDMStorage.mergeFromCloudPayload(remote.payload)
      const payload = window.PDMStorage.getSyncPayload()
      await pushRemote(payload)
      lastSyncAt = new Date().toISOString()
      syncStatus = 'ok'
      return payload
    } catch (err) {
      syncStatus = 'error'
      lastError = err.message || String(err)
      throw err
    }
  }

  async function pushIfLoggedIn() {
    const Auth = window.PDMAuth
    if (!Auth.isLoggedIn()) return
    try {
      syncStatus = 'syncing'
      await pushRemote(window.PDMStorage.getSyncPayload())
      lastSyncAt = new Date().toISOString()
      syncStatus = 'ok'
      lastError = null
    } catch (err) {
      syncStatus = 'error'
      lastError = err.message || String(err)
      if (err.code === 'sync_payload_too_large' || /sync_payload_too_large|过大|too large/i.test(lastError)) {
        notifySyncError(err)
      }
    }
  }

  async function init() {
    if (!window.PDMAuth?.isConfigured()) return getCloudState()
    window.PDMStorage.setCloudPush(pushIfLoggedIn)
    if (window.PDMAuth.isLoggedIn()) {
      try { await syncNow() } catch (e) { console.warn('Cloud sync:', e) }
    }
    return getCloudState()
  }

  window.PDMCloud = {
    getCloudState,
    syncNow,
    init,
    measurePayloadBytes,
    MAX_SYNC_BYTES,
  }
})()
