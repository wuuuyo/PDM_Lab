import { useState, useEffect } from 'react'
import {
  getCloudState,
  getConfig,
  saveConfig,
  initCloud,
  signIn,
  signUp,
  signOut,
  syncNow,
} from '../data/cloud'

interface Props {
  onSynced: () => void
  onToast: (msg: string) => void
}

export default function CloudSyncPanel({ onSynced, onToast }: Props) {
  const [cloud, setCloud] = useState(getCloudState())
  const [showSetup, setShowSetup] = useState(!getCloudState().configured)
  const [url, setUrl] = useState(getConfig().url)
  const [anonKey, setAnonKey] = useState(getConfig().anonKey)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    initCloud().then(() => {
      setCloud(getCloudState())
      onSynced()
    })
  }, [onSynced])

  function refreshCloud() {
    setCloud(getCloudState())
  }

  async function handleSaveConfig() {
    if (!url.trim() || !anonKey.trim()) {
      onToast('请填写 URL 和 Anon Key')
      return
    }
    saveConfig(url, anonKey)
    setShowSetup(false)
    await initCloud()
    refreshCloud()
    onSynced()
    onToast('云端配置已保存')
  }

  async function handleLogin() {
    try {
      await signIn(email, password)
      refreshCloud()
      onSynced()
      onToast('登录成功，已同步云端数据')
    } catch (err) {
      onToast(err instanceof Error ? err.message : '登录失败')
    }
  }

  async function handleRegister() {
    if (password.length < 6) {
      onToast('密码至少 6 位')
      return
    }
    try {
      const data = await signUp(email, password)
      refreshCloud()
      onSynced()
      onToast(data.session ? '注册成功，已同步云端数据' : '注册成功，请查收邮件确认后登录')
    } catch (err) {
      onToast(err instanceof Error ? err.message : '注册失败')
    }
  }

  async function handleSync() {
    try {
      await syncNow()
      refreshCloud()
      onSynced()
      onToast('云端同步完成')
    } catch (err) {
      refreshCloud()
      onToast(err instanceof Error ? err.message : '同步失败')
    }
  }

  async function handleLogout() {
    await signOut()
    refreshCloud()
    onToast('已退出登录')
  }

  if (!cloud.configured || showSetup) {
    return (
      <div className="cloud-panel">
        <div className="cloud-panel-header">
          <h3>云端同步</h3>
          <p>使用 Supabase 免费云服务，多设备自动同步记忆与复盘。</p>
        </div>
        <div className="form-card cloud-setup">
          <div className="form-group">
            <label>Supabase 项目 URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" />
          </div>
          <div className="form-group">
            <label>Anon Public Key</label>
            <input value={anonKey} onChange={(e) => setAnonKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." />
          </div>
          <p className="cloud-setup-hint">
            在 <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">supabase.com</a> 创建项目 →
            Settings → API 复制 URL 与 anon key → SQL Editor 执行 <code>supabase/schema.sql</code>
          </p>
          <div className="form-actions">
            <button type="button" className="btn-primary" onClick={handleSaveConfig}>保存配置</button>
            {cloud.configured && (
              <button type="button" className="btn-ghost" onClick={() => setShowSetup(false)}>收起</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!cloud.loggedIn) {
    return (
      <div className="cloud-panel">
        <div className="cloud-panel-header">
          <h3>云端同步</h3>
          <p>登录后自动同步，保存时自动上传</p>
        </div>
        <div className="form-card cloud-auth">
          <div className="form-group">
            <label>邮箱</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 6 位" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-primary" onClick={handleLogin}>登录</button>
            <button type="button" className="btn-secondary" onClick={handleRegister}>注册</button>
            <button type="button" className="btn-ghost" onClick={() => setShowSetup(true)}>修改配置</button>
          </div>
        </div>
      </div>
    )
  }

  const syncHint =
    cloud.syncStatus === 'syncing'
      ? '同步中…'
      : cloud.syncStatus === 'error'
        ? `同步失败：${cloud.lastError}`
        : cloud.lastSyncAt
          ? `上次同步：${new Date(cloud.lastSyncAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
          : '已连接'

  return (
    <div className="cloud-panel cloud-panel-logged-in">
      <div className="cloud-panel-header">
        <div>
          <h3>云端同步 <span className="cloud-badge">已连接</span></h3>
          <p className="cloud-email-line">{cloud.email}</p>
          <p className={`cloud-sync-line ${cloud.syncStatus === 'error' ? 'error' : ''}`}>{syncHint}</p>
        </div>
        <div className="cloud-panel-actions">
          <button type="button" className="btn-secondary" onClick={handleSync}>立即同步</button>
          <button type="button" className="btn-ghost" onClick={handleLogout}>退出</button>
        </div>
      </div>
    </div>
  )
}
