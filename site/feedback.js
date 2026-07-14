/**
 * 用户反馈：满意度评分 + 建议
 */
;(function () {
  async function getClient() {
    const Auth = window.PDMAuth
    if (!Auth?.isConfigured()) throw new Error('网站尚未配置云服务')
    const sb = Auth.getClient()
    if (!sb) throw new Error('网站尚未配置云服务')
    return sb
  }

  function mapRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      email: row.email || '',
      rating: Number(row.rating) || 0,
      content: row.content || '',
      status: row.status || 'new',
      adminNote: row.admin_note || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  async function submitFeedback({ rating, content }) {
    const Auth = window.PDMAuth
    if (!Auth?.isLoggedIn()) throw new Error('请先登录后再提交反馈')
    const session = Auth.getSession()
    const email = session?.user?.email || ''
    const userId = session?.user?.id
    if (!userId) throw new Error('请先登录后再提交反馈')
    const r = Number(rating)
    if (!(r >= 1 && r <= 5)) throw new Error('请选择 1–5 分满意度')
    const text = String(content || '').trim()
    if (text.length < 2) throw new Error('请填写建议内容')
    if (text.length > 2000) throw new Error('建议内容请控制在 2000 字以内')

    const sb = await getClient()
    const { data, error } = await sb
      .from('user_feedback')
      .insert({
        user_id: userId,
        email,
        rating: r,
        content: text,
        status: 'new',
      })
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (window.PDMAnalytics) window.PDMAnalytics.track('feedback_submit', { rating: r })
    return mapRow(data)
  }

  async function fetchMyFeedback(limit = 20) {
    const Auth = window.PDMAuth
    if (!Auth?.isLoggedIn()) return []
    const userId = Auth.getSession()?.user?.id
    if (!userId) return []
    const sb = await getClient()
    const { data, error } = await sb
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data || []).map(mapRow)
  }

  async function fetchAllFeedback(limit = 200) {
    const Auth = window.PDMAuth
    if (!Auth?.isAdmin()) throw new Error('无权限')
    const sb = await getClient()
    const { data, error } = await sb
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data || []).map(mapRow)
  }

  async function updateFeedbackStatus(id, status, adminNote) {
    const Auth = window.PDMAuth
    if (!Auth?.isAdmin()) throw new Error('无权限')
    if (!['new', 'read', 'done'].includes(status)) throw new Error('无效状态')
    const sb = await getClient()
    const payload = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (adminNote != null) payload.admin_note = adminNote
    const { data, error } = await sb
      .from('user_feedback')
      .update(payload)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (error) throw error
    return mapRow(data)
  }

  window.PDMFeedback = {
    submitFeedback,
    fetchMyFeedback,
    fetchAllFeedback,
    updateFeedbackStatus,
  }
})()
