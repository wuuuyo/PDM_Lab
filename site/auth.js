/**
 * 统一账号：邮箱登录
 * Supabase 由网站运营方配置（PDM_CONFIG），用户无需自行配置
 */
;(function () {
  let client = null
  let session = null
  let profile = null

  function normalizeSupabaseUrl(raw) {
    let u = String(raw || '').trim()
    if (!u) return ''
    u = u.replace(/\/+$/, '')
    u = u.replace(/\/(rest|auth|storage|functions)\/v1$/i, '')
    return u
  }

  function getConfig() {
    const cfg = window.PDM_CONFIG || {}
    return {
      url: normalizeSupabaseUrl(cfg.supabaseUrl || ''),
      anonKey: cfg.supabaseAnonKey || '',
      adminEmails: Array.isArray(cfg.adminEmails) ? cfg.adminEmails : [],
    }
  }

  function isConfigured() {
    const { url, anonKey } = getConfig()
    return Boolean(url && anonKey && url.includes('supabase'))
  }

  async function loadSupabaseLib() {
    if (window.supabase?.createClient) return true
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
      s.onload = () => resolve(true)
      s.onerror = () => reject(new Error('无法加载云服务，请检查网络'))
      document.head.appendChild(s)
    })
  }

  function getClient() {
    if (!isConfigured()) return null
    if (client) return client
    const { url, anonKey } = getConfig()
    client = window.supabase.createClient(url, anonKey)
    return client
  }

  function getSession() {
    return session
  }

  function getProfile() {
    return profile
  }

  function isLoggedIn() {
    return Boolean(session?.user)
  }

  function isAdmin() {
    if (profile?.is_admin) return true
    const email = session?.user?.email
    return email && getConfig().adminEmails.includes(email)
  }

  async function refreshSession() {
    const sb = getClient()
    if (!sb) return null
    const { data } = await sb.auth.getSession()
    session = data.session
    if (session?.user) await loadProfile()
    else profile = null
    return session
  }

  async function loadProfile() {
    const sb = getClient()
    if (!sb || !session?.user) return null
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
    if (error) throw error
    profile = data
    return profile
  }

  async function touchLogin() {
    const sb = getClient()
    if (!sb || !session?.user) return
    const now = new Date().toISOString()
    await sb.from('profiles').upsert({
      id: session.user.id,
      email: session.user.email,
      last_login_at: now,
      updated_at: now,
      login_count: (profile?.login_count || 0) + 1,
    }, { onConflict: 'id' })
    await loadProfile()
  }

  async function signInWithEmail(email, password) {
    await loadSupabaseLib()
    const sb = getClient()
    if (!sb) throw new Error('网站尚未配置云服务，请联系管理员')
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) throw error
    session = data.session
    await loadProfile()
    await touchLogin()
    if (window.PDMAnalytics) window.PDMAnalytics.track('login', { method: 'email' })
    return session
  }

  async function signUpWithEmail(email, password, displayName) {
    await loadSupabaseLib()
    const sb = getClient()
    if (!sb) throw new Error('网站尚未配置云服务，请联系管理员')
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split('@')[0] } },
    })
    if (error) throw error
    if (data.session) {
      session = data.session
      await loadProfile()
      await touchLogin()
      if (window.PDMAnalytics) window.PDMAnalytics.track('register', { method: 'email' })
    }
    return data
  }

  async function signOut() {
    const sb = getClient()
    if (sb) await sb.auth.signOut()
    session = null
    profile = null
    if (window.PDMAnalytics) window.PDMAnalytics.track('logout')
  }

  async function init() {
    if (!isConfigured()) return { configured: false, loggedIn: false }
    try {
      await loadSupabaseLib()
    } catch (err) {
      return { configured: true, loggedIn: false, error: err.message }
    }
    await refreshSession()
    const sb = getClient()
    if (sb) {
      sb.auth.onAuthStateChange((_event, newSession) => {
        session = newSession
        if (newSession?.user) loadProfile()
        else profile = null
      })
    }
    return { configured: true, loggedIn: isLoggedIn(), email: session?.user?.email, isAdmin: isAdmin() }
  }

  window.PDMAuth = {
    getConfig,
    isConfigured,
    getClient,
    getSession,
    getProfile,
    isLoggedIn,
    isAdmin,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshSession,
    init,
  }
})()
