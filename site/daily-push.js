/**
 * 每日知识推送：用户自定义时间，每次 3 条
 * 需在浏览器打开页面时触发（可配合系统通知）
 */
;(function () {
  const TICK_MS = 60000
  let timer = null
  let onPushCallback = null

  const DEFAULT_SETTINGS = {
    enabled: false,
    time: '09:00',
    count: 3,
    categories: [],
    lastPushDate: null,
    lastPushItems: [],
    pushHistory: [],
  }

  const LEGACY_CAT = {
    interview: 'methodology',
    skills: 'workflow',
    domain: 'architecture',
  }

  function remapCategoryIds(ids) {
    if (!ids?.length) return []
    const next = []
    const seen = new Set()
    for (const id of ids) {
      const resolved = LEGACY_CAT[id] || id
      if (seen.has(resolved)) continue
      seen.add(resolved)
      next.push(resolved)
    }
    return next
  }

  function getSettings() {
    const raw = { ...DEFAULT_SETTINGS, ...(window.PDMStorage?.getPushSettings?.() || {}) }
    raw.categories = remapCategoryIds(raw.categories)
    return raw
  }

  async function saveSettings(partial) {
    const next = { ...getSettings(), ...partial }
    await window.PDMStorage.savePushSettings(next)
    return next
  }

  function todayKey() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function parseTime(timeStr) {
    const [h, m] = (timeStr || '09:00').split(':').map(Number)
    return { hour: h || 9, minute: m || 0 }
  }

  function isPushTimeNow(settings) {
    const { hour, minute } = parseTime(settings.time)
    const now = new Date()
    return now.getHours() === hour && now.getMinutes() === minute
  }

  function getAllPoolItems() {
    const K = window.PDMKnowledge
    if (!K) return []
    const cats = settingsCategoriesFilter(K.getMergedCategories(), getSettings().categories)
    const pool = []
    for (const cat of cats) {
      for (const item of cat.items) {
        pool.push({ category: cat, item })
      }
    }
    return pool
  }

  function settingsCategoriesFilter(categories, filterIds) {
    if (!filterIds?.length) return categories
    return categories.filter((c) => filterIds.includes(c.id))
  }

  function pickRandomItems(count, excludeIds = []) {
    const pool = getAllPoolItems().filter(({ item }) => !excludeIds.includes(`${item.id}`))
    if (pool.length === 0) return getAllPoolItems().slice(0, count)
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, shuffled.length))
  }

  function toPushRecord(picks) {
    return picks.map(({ category, item }) => ({
      categoryId: category.id,
      itemId: item.id,
      title: item.title,
      summary: item.summary,
      pushedAt: new Date().toISOString(),
    }))
  }

  async function executePush(force = false) {
    const settings = getSettings()
    if (!settings.enabled && !force) return null

    const today = todayKey()
    if (!force && settings.lastPushDate === today) return null

    const recentIds = (settings.pushHistory || [])
      .flatMap((h) => h.items || [])
      .slice(-21)
      .map((i) => i.itemId)

    const picks = pickRandomItems(settings.count || 3, recentIds)
    if (picks.length === 0) return null

    const records = toPushRecord(picks)
    const history = [...(settings.pushHistory || []), { date: today, items: records }].slice(-30)

    await saveSettings({
      lastPushDate: today,
      lastPushItems: records,
      pushHistory: history,
    })

    if (window.PDMAnalytics) {
      window.PDMAnalytics.track('daily_push', { count: records.length, forced: force })
    }

    if (onPushCallback) onPushCallback(records)
    tryNotify(records)
    return records
  }

  function tryNotify(records) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const titles = records.map((r) => r.title).join('、')
    new Notification('PM Lab · 今日学习', {
      body: `为你推送 ${records.length} 条知识：${titles.slice(0, 80)}…`,
      tag: 'pdm-daily-push',
    })
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied') return 'denied'
    return Notification.requestPermission()
  }

  async function tick() {
    if (!window.PDMAuth?.isLoggedIn()) return
    const settings = getSettings()
    if (!settings.enabled) return
    if (settings.lastPushDate === todayKey()) return
    if (!isPushTimeNow(settings)) return
    await executePush(false)
  }

  function start(onPush) {
    onPushCallback = onPush
    stop()
    timer = setInterval(() => { tick().catch(() => {}) }, TICK_MS)
    tick().catch(() => {})
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  window.PDMDailyPush = {
    getSettings,
    saveSettings,
    executePush,
    pickRandomItems,
    getAllPoolItems,
    requestNotificationPermission,
    start,
    stop,
    todayKey,
    DEFAULT_SETTINGS,
  }
})()
