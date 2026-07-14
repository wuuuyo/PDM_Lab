/**
 * 使用行为埋点（登录用户自动关联 user_id）
 * DAU/MAU：登录用户每日首次访问时写入 user_daily_activity
 */
;(function () {
  function todayUtcKey() {
    return new Date().toISOString().slice(0, 10)
  }

  function dauStorageKey(userId) {
    return `pdm_dau_${userId}_${todayUtcKey()}`
  }

  async function track(eventType, metadata = {}) {
    try {
      const Auth = window.PDMAuth
      if (!Auth?.isConfigured()) return
      const sb = Auth.getClient()
      if (!sb) return
      const user = Auth.getSession()?.user
      const page = (location.hash.slice(1) || '/').split('?')[0]
      let meta = metadata && typeof metadata === 'object' ? metadata : {}
      try {
        const raw = JSON.stringify(meta)
        if (raw.length > 2000) meta = { truncated: true }
      } catch (_) {
        meta = {}
      }
      await sb.from('usage_events').insert({
        user_id: user?.id || null,
        event_type: String(eventType || 'event').slice(0, 64),
        page: String(page || '/').slice(0, 200),
        metadata: meta,
      })
    } catch (err) {
      console.warn('Analytics:', err.message)
    }
  }

  /** 每日活跃埋点：每用户每天最多上报一次（UTC 日） */
  async function trackDailyActive() {
    try {
      const Auth = window.PDMAuth
      if (!Auth?.isConfigured() || !Auth.isLoggedIn()) return
      const userId = Auth.getSession()?.user?.id
      if (!userId) return

      const storageKey = dauStorageKey(userId)
      if (localStorage.getItem(storageKey)) return

      const sb = Auth.getClient()
      if (!sb) return

      const { error } = await sb.rpc('record_daily_activity')
      if (error) throw error

      localStorage.setItem(storageKey, '1')
      await track('daily_active', { date: todayUtcKey() })
    } catch (err) {
      console.warn('DAU track:', err.message)
    }
  }

  window.PDMAnalytics = { track, trackDailyActive }
})()
