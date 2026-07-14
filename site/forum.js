/**
 * 学习论坛 — 登录用户发帖与评论
 */
;(function () {
  async function getClient() {
    const Auth = window.PDMAuth
    if (!Auth?.isConfigured()) throw new Error('网站尚未配置云服务')
    return Auth.getClient()
  }

  function mapPost(row, profile) {
    return {
      id: row.id,
      userId: row.user_id,
      authorEmail: profile?.email || row.author_email || '用户',
      authorName: profile?.display_name || row.author_email?.split('@')[0] || '用户',
      title: row.title,
      body: row.body,
      commentCount: row.comment_count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  function mapComment(row, profile) {
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      authorEmail: profile?.email || '用户',
      authorName: profile?.display_name || '用户',
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
    if (!Auth.isLoggedIn()) throw new Error('请先登录')
    const sb = await getClient()
    const user = Auth.getSession().user
    const { data, error } = await sb.from('forum_posts').insert({
      user_id: user.id,
      title: title.trim(),
      body: body.trim(),
      author_email: user.email,
    }).select().single()
    if (error) throw error
    if (window.PDMAnalytics) window.PDMAnalytics.track('forum_post', { title })
    return data
  }

  async function createComment(postId, body) {
    const Auth = window.PDMAuth
    if (!Auth.isLoggedIn()) throw new Error('请先登录')
    const sb = await getClient()
    const user = Auth.getSession().user
    const { data, error } = await sb.from('forum_comments').insert({
      post_id: postId,
      user_id: user.id,
      body: body.trim(),
    }).select().single()
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
