/**
 * 学习论坛 — 登录用户发帖与评论
 */
;(function () {
  async function getClient() {
    const Auth = window.PDMAuth
    if (!Auth?.isConfigured()) throw new Error('网站尚未配置云服务')
    return Auth.getClient()
  }

  function cleanAuthorName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 32)
  }

  function getFallbackName(email) {
    return email?.includes('@') ? email.split('@')[0] : ''
  }

  function getCurrentAuthorName() {
    const Auth = window.PDMAuth
    const profileName = cleanAuthorName(Auth?.getProfile?.()?.display_name)
    const metaName = cleanAuthorName(Auth?.getSession?.()?.user?.user_metadata?.display_name)
    const emailName = getFallbackName(Auth?.getSession?.()?.user?.email)
    return profileName || metaName || emailName || '\u7528\u6237'
  }

  function mapPost(row, profile) {
    const profileName = cleanAuthorName(profile?.display_name)
    const snapshotName = cleanAuthorName(row.author_name)
    const fallbackName = getFallbackName(row.author_email)
    return {
      id: row.id,
      userId: row.user_id,
      authorEmail: profile?.email || row.author_email || '\u7528\u6237',
      authorName: profileName || snapshotName || fallbackName || '\u7528\u6237',
      title: row.title,
      body: row.body,
      commentCount: row.comment_count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  function mapComment(row, profile) {
    const profileName = cleanAuthorName(profile?.display_name)
    const snapshotName = cleanAuthorName(row.author_name)
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      authorEmail: profile?.email || '\u7528\u6237',
      authorName: profileName || snapshotName || '\u7528\u6237',
      body: row.body,
      createdAt: row.created_at,
    }
  }

  async function fetchPosts(limit = 50) {
    const sb = await getClient()
    const { data, error } = await sb
      .from('forum_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    const posts = data || []
    const userIds = [...new Set(posts.map((p) => p.user_id))]
    const profiles = await fetchProfiles(userIds)
    const profileMap = new Map(profiles.map((p) => [p.id, p]))
    return posts.map((p) => mapPost(p, profileMap.get(p.user_id)))
  }

  async function fetchProfiles(userIds) {
    if (!userIds.length) return []
    const sb = await getClient()
    const { data } = await sb.from('profiles').select('id, email, display_name').in('id', userIds)
    return data || []
  }

  async function fetchPost(postId) {
    const sb = await getClient()
    const { data, error } = await sb.from('forum_posts').select('*').eq('id', postId).maybeSingle()
    if (error) throw error
    if (!data) return null
    const profiles = await fetchProfiles([data.user_id])
    return mapPost(data, profiles[0])
  }

  async function fetchComments(postId) {
    const sb = await getClient()
    const { data, error } = await sb
      .from('forum_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (error) throw error
    const comments = data || []
    const userIds = [...new Set(comments.map((c) => c.user_id))]
    const profiles = await fetchProfiles(userIds)
    const profileMap = new Map(profiles.map((p) => [p.id, p]))
    return comments.map((c) => mapComment(c, profileMap.get(c.user_id)))
  }

  async function createPost(title, body) {
    const Auth = window.PDMAuth
    if (!Auth.isLoggedIn()) throw new Error('\u8bf7\u5148\u767b\u5f55')
    const t = (title || '').trim()
    const b = (body || '').trim()
    if (!t) throw new Error('\u8bf7\u586b\u5199\u6807\u9898')
    if (t.length > 100) throw new Error('\u6807\u9898\u6700\u5927 100 \u5b57')
    if (!b) throw new Error('\u8bf7\u586b\u5199\u5185\u5bb9')
    if (b.length > 5000) throw new Error('\u6b63\u6587\u6700\u5927 5000 \u5b57')
    const sb = await getClient()
    const user = Auth.getSession().user
    const payload = {
      user_id: user.id,
      title: t,
      body: b,
      author_email: user.email,
      author_name: getCurrentAuthorName(),
    }
    let { data, error } = await sb.from('forum_posts').insert(payload).select().single()
    if (error && /author_name|column/i.test(error.message || '')) {
      const fallbackPayload = { ...payload }
      delete fallbackPayload.author_name
      ;({ data, error } = await sb.from('forum_posts').insert(fallbackPayload).select().single())
    }
    if (error) throw error
    if (window.PDMAnalytics) window.PDMAnalytics.track('forum_post', { title: t.slice(0, 80) })
    return data
  }

  async function createComment(postId, body) {
    const Auth = window.PDMAuth
    if (!Auth.isLoggedIn()) throw new Error('\u8bf7\u5148\u767b\u5f55')
    const b = (body || '').trim()
    if (!b) throw new Error('\u8bf7\u586b\u5199\u8bc4\u8bba')
    if (b.length > 2000) throw new Error('\u8bc4\u8bba\u6700\u5927 2000 \u5b57')
    const sb = await getClient()
    const user = Auth.getSession().user
    const payload = {
      post_id: postId,
      user_id: user.id,
      body: b,
      author_name: getCurrentAuthorName(),
    }
    let { data, error } = await sb.from('forum_comments').insert(payload).select().single()
    if (error && /author_name|column/i.test(error.message || '')) {
      const fallbackPayload = { ...payload }
      delete fallbackPayload.author_name
      ;({ data, error } = await sb.from('forum_comments').insert(fallbackPayload).select().single())
    }
    if (error) throw error
    if (window.PDMAnalytics) window.PDMAnalytics.track('forum_comment', { postId })
    return data
  }

  async function deletePost(postId) {
    const Auth = window.PDMAuth
    if (!Auth.isLoggedIn()) throw new Error('请先登录')
    const sb = await getClient()
    const { error } = await sb.from('forum_posts').delete().eq('id', postId).eq('user_id', Auth.getSession().user.id)
    if (error) throw error
  }

  window.PDMForum = {
    fetchPosts,
    fetchPost,
    fetchComments,
    createPost,
    createComment,
    deletePost,
  }
})()
