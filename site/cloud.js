/**
 * 云端数据同步（依赖 PDMAuth 统一登录）
 */
;(function () {
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
    const { error } = await sb.from('pdm_sync').upsert({
      user_id: user.id,
      payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) throw error
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
      lastError = err.message
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

  window.PDMCloud = { getCloudState, syncNow, init }
})()
