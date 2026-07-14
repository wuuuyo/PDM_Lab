/**
 * PM Lab 多语言
 */
;(function () {
  const STORAGE_KEY = 'pm-lab-locale'
  const DEFAULT = 'zh-CN'
  const LOCALES = ['zh-CN', 'en-US']

  let locale = DEFAULT
  const listeners = []

  function getDict(loc) {
    return window.PM_LAB_LOCALES?.[loc] || window.PM_LAB_LOCALES?.[DEFAULT] || {}
  }

  function resolve(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj)
  }

  function getLocale() {
    return locale
  }

  function getLocales() {
    return LOCALES
  }

  function getLocaleLabel(loc) {
    return loc === 'en-US' ? 'EN' : '中文'
  }

  function t(key, params, fallback) {
    let str = resolve(getDict(locale), key)
    if (str == null) str = resolve(getDict(DEFAULT), key)
    if (str == null) str = fallback ?? key
    if (params && typeof str === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      })
    }
    return str
  }

  /** 读取 content 覆盖（行业/工具等结构化内容） */
  function getContent(type, id) {
    const path = `content.${type}.${id}`
    let val = resolve(getDict(locale), path)
    if (val == null && locale !== DEFAULT) val = resolve(getDict(DEFAULT), path)
    return val
  }

  function getCategoryMeta(categoryId, field, fallback) {
    const key = `categories.${categoryId}.${field}`
    const val = t(key, null, null)
    return val === key ? fallback : val
  }

  function applyDocumentLocale() {
    document.documentElement.lang = locale === 'en-US' ? 'en' : 'zh-CN'
    document.title = t('site.title')
  }

  function setLocale(next) {
    if (!LOCALES.includes(next) || next === locale) return
    locale = next
    try { localStorage.setItem(STORAGE_KEY, next) } catch (_) {}
    applyDocumentLocale()
    listeners.forEach((fn) => fn(locale))
  }

  function init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && LOCALES.includes(saved)) locale = saved
    } catch (_) {}
    applyDocumentLocale()
  }

  function onChange(fn) {
    listeners.push(fn)
  }

  function formatDate(iso) {
    const loc = locale === 'en-US' ? 'en-US' : 'zh-CN'
    return new Date(iso).toLocaleDateString(loc, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  window.PMLabI18n = {
    init,
    t,
    getContent,
    getCategoryMeta,
    getLocale,
    setLocale,
    getLocales,
    getLocaleLabel,
    onChange,
    formatDate,
  }
})()
