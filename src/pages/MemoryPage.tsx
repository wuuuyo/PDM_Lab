import { useState, useEffect, useRef, useCallback } from 'react'
import CloudSyncPanel from '../components/CloudSyncPanel'
import {
  initStorage,
  loadMemories,
  saveMemories,
  loadReviews,
  saveReviews,
  getStorageStats,
  exportBackup,
  importBackup,
  memoryCategoryLabels,
  generateId,
  type MemoryNote,
  type ReviewEntry,
} from '../data/storage'

type Tab = 'memory' | 'review'

const emptyMemory = (): Omit<MemoryNote, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  content: '',
  category: 'insight',
  tags: [],
})

const emptyReview = (): Omit<ReviewEntry, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  period: '',
  whatWorked: '',
  whatFailed: '',
  lessons: '',
  nextActions: '',
})

export default function MemoryPage() {
  const [tab, setTab] = useState<Tab>('memory')
  const [memories, setMemories] = useState<MemoryNote[]>([])
  const [reviews, setReviews] = useState<ReviewEntry[]>([])
  const [editingMemory, setEditingMemory] = useState<MemoryNote | null>(null)
  const [editingReview, setEditingReview] = useState<ReviewEntry | null>(null)
  const [showMemoryForm, setShowMemoryForm] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [memoryForm, setMemoryForm] = useState(emptyMemory())
  const [reviewForm, setReviewForm] = useState(emptyReview())
  const [tagInput, setTagInput] = useState('')
  const [toast, setToast] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const importModeRef = useRef<'merge' | 'replace'>('merge')

  useEffect(() => {
    initStorage().then(() => {
      setMemories(loadMemories())
      setReviews(loadReviews())
    })
  }, [])

  const reloadData = useCallback(() => {
    setMemories(loadMemories())
    setReviews(loadReviews())
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3200)
  }

  async function persistMemories(notes: MemoryNote[]) {
    setMemories(notes)
    const { localOk } = await saveMemories(notes)
    if (!localOk) showToast('已保存（数据较多，建议导出备份）')
  }

  async function persistReviews(entries: ReviewEntry[]) {
    setReviews(entries)
    const { localOk } = await saveReviews(entries)
    if (!localOk) showToast('已保存（数据较多，建议导出备份）')
  }

  function openNewMemory() {
    setEditingMemory(null)
    setMemoryForm(emptyMemory())
    setTagInput('')
    setShowMemoryForm(true)
  }

  function openEditMemory(note: MemoryNote) {
    setEditingMemory(note)
    setMemoryForm({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags,
    })
    setTagInput('')
    setShowMemoryForm(true)
  }

  function saveMemory() {
    if (!memoryForm.title.trim()) return
    const now = new Date().toISOString()
    if (editingMemory) {
      const updated = memories.map((m) =>
        m.id === editingMemory.id
          ? { ...m, ...memoryForm, updatedAt: now }
          : m,
      )
      persistMemories(updated)
    } else {
      const newNote: MemoryNote = {
        id: generateId(),
        ...memoryForm,
        createdAt: now,
        updatedAt: now,
      }
      persistMemories([newNote, ...memories])
    }
    setShowMemoryForm(false)
  }

  function deleteMemory(id: string) {
    persistMemories(memories.filter((m) => m.id !== id))
    if (editingMemory?.id === id) setShowMemoryForm(false)
  }

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !memoryForm.tags.includes(tag)) {
      setMemoryForm({ ...memoryForm, tags: [...memoryForm.tags, tag] })
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setMemoryForm({ ...memoryForm, tags: memoryForm.tags.filter((t) => t !== tag) })
  }

  function openNewReview() {
    setEditingReview(null)
    setReviewForm(emptyReview())
    setShowReviewForm(true)
  }

  function openEditReview(entry: ReviewEntry) {
    setEditingReview(entry)
    setReviewForm({
      title: entry.title,
      period: entry.period,
      whatWorked: entry.whatWorked,
      whatFailed: entry.whatFailed,
      lessons: entry.lessons,
      nextActions: entry.nextActions,
    })
    setShowReviewForm(true)
  }

  function saveReview() {
    if (!reviewForm.title.trim()) return
    const now = new Date().toISOString()
    if (editingReview) {
      const updated = reviews.map((r) =>
        r.id === editingReview.id
          ? { ...r, ...reviewForm, updatedAt: now }
          : r,
      )
      persistReviews(updated)
    } else {
      const newEntry: ReviewEntry = {
        id: generateId(),
        ...reviewForm,
        createdAt: now,
        updatedAt: now,
      }
      persistReviews([newEntry, ...reviews])
    }
    setShowReviewForm(false)
  }

  function deleteReview(id: string) {
    persistReviews(reviews.filter((r) => r.id !== id))
    if (editingReview?.id === id) setShowReviewForm(false)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const stats = getStorageStats()

  async function handleImport(file: File) {
    try {
      const result = await importBackup(file, importModeRef.current)
      setMemories(loadMemories())
      setReviews(loadReviews())
      showToast(`导入成功：${result.memoryCount} 条记忆，${result.reviewCount} 条复盘`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '导入失败')
    }
  }

  return (
    <div className="page memory-page">
      {toast && <div className="pdm-toast show success">{toast}</div>}
      <header className="memory-header">
        <h1>记忆与复盘</h1>
        <p>记录学习过程中的洞察与框架，定期复盘沉淀成长</p>
      </header>

      <CloudSyncPanel onSynced={reloadData} onToast={showToast} />

      <div className="storage-panel">
        <div className="storage-panel-info">
          <h3>数据安全</h3>
          <p>记录保存在本机浏览器（IndexedDB + localStorage 双备份），登录云端后自动多设备同步。</p>
          <div className="storage-stats">
            <span>{stats.memoryCount} 条记忆</span>
            <span className="stat-sep">·</span>
            <span>{stats.reviewCount} 条复盘</span>
            <span className="stat-sep">·</span>
            <span>约 {stats.readable}</span>
            {!stats.localMirrorOk && (
              <span className="stat-warn">（数据较多，请务必导出备份）</span>
            )}
          </div>
        </div>
        <div className="storage-panel-actions">
          <button type="button" className="btn-secondary" onClick={() => exportBackup()}>
            导出备份
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              importModeRef.current = 'merge'
              importRef.current?.click()
            }}
          >
            导入（合并）
          </button>
          <button
            type="button"
            className="btn-ghost btn-danger-text"
            onClick={() => {
              if (!confirm('覆盖导入将替换当前所有记忆与复盘，此操作不可撤销。确定继续？')) return
              importModeRef.current = 'replace'
              importRef.current?.click()
            }}
          >
            导入（覆盖）
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="memory-tabs">
        <button
          className={`memory-tab ${tab === 'memory' ? 'active' : ''}`}
          onClick={() => setTab('memory')}
        >
          记忆存储
          <span className="tab-count">{memories.length}</span>
        </button>
        <button
          className={`memory-tab ${tab === 'review' ? 'active' : ''}`}
          onClick={() => setTab('review')}
        >
          复盘总结
          <span className="tab-count">{reviews.length}</span>
        </button>
      </div>

      {tab === 'memory' && (
        <section className="memory-section">
          <div className="section-toolbar">
            <h2>我的记忆</h2>
            <button className="btn-primary" onClick={openNewMemory}>
              + 新建记忆
            </button>
          </div>

          {showMemoryForm && (
            <div className="form-card">
              <h3>{editingMemory ? '编辑记忆' : '新建记忆'}</h3>
              <div className="form-group">
                <label>标题</label>
                <input
                  type="text"
                  value={memoryForm.title}
                  onChange={(e) => setMemoryForm({ ...memoryForm, title: e.target.value })}
                  placeholder="一句话概括这条记忆"
                />
              </div>
              <div className="form-group">
                <label>分类</label>
                <select
                  value={memoryForm.category}
                  onChange={(e) =>
                    setMemoryForm({
                      ...memoryForm,
                      category: e.target.value as MemoryNote['category'],
                    })
                  }
                >
                  {Object.entries(memoryCategoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>内容</label>
                <textarea
                  value={memoryForm.content}
                  onChange={(e) => setMemoryForm({ ...memoryForm, content: e.target.value })}
                  placeholder="详细记录你的洞察、框架或案例..."
                  rows={5}
                />
              </div>
              <div className="form-group">
                <label>标签</label>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="输入后回车添加"
                  />
                  <button type="button" className="btn-secondary" onClick={addTag}>添加</button>
                </div>
                {memoryForm.tags.length > 0 && (
                  <div className="tag-list">
                    {memoryForm.tags.map((tag) => (
                      <span key={tag} className="tag removable" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={saveMemory}>保存</button>
                <button className="btn-ghost" onClick={() => setShowMemoryForm(false)}>取消</button>
              </div>
            </div>
          )}

          {memories.length === 0 && !showMemoryForm ? (
            <div className="empty-state">
              <p>还没有记忆记录</p>
              <p className="empty-hint">学习时随时记录洞察、框架和金句，构建你的个人知识库</p>
              <button className="btn-primary" onClick={openNewMemory}>写下第一条记忆</button>
            </div>
          ) : (
            <div className="memory-grid">
              {memories.map((note) => (
                <div key={note.id} className="memory-card">
                  <div className="memory-card-header">
                    <span className="memory-category">{memoryCategoryLabels[note.category]}</span>
                    <span className="memory-date">{formatDate(note.updatedAt)}</span>
                  </div>
                  <h3>{note.title}</h3>
                  <p className="memory-content">{note.content}</p>
                  {note.tags.length > 0 && (
                    <div className="tag-list">
                      {note.tags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="memory-card-actions">
                    <button onClick={() => openEditMemory(note)}>编辑</button>
                    <button className="danger" onClick={() => deleteMemory(note.id)}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'review' && (
        <section className="memory-section">
          <div className="section-toolbar">
            <h2>复盘记录</h2>
            <button className="btn-primary" onClick={openNewReview}>
              + 新建复盘
            </button>
          </div>

          {showReviewForm && (
            <div className="form-card review-form">
              <h3>{editingReview ? '编辑复盘' : '新建复盘'}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>复盘标题</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    placeholder="如：Q1 产品学习复盘"
                  />
                </div>
                <div className="form-group">
                  <label>复盘周期</label>
                  <input
                    type="text"
                    value={reviewForm.period}
                    onChange={(e) => setReviewForm({ ...reviewForm, period: e.target.value })}
                    placeholder="如：2025年3月 / 第一周"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>做得好的</label>
                <textarea
                  value={reviewForm.whatWorked}
                  onChange={(e) => setReviewForm({ ...reviewForm, whatWorked: e.target.value })}
                  placeholder="哪些方法有效？哪些习惯值得保持？"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>待改进的</label>
                <textarea
                  value={reviewForm.whatFailed}
                  onChange={(e) => setReviewForm({ ...reviewForm, whatFailed: e.target.value })}
                  placeholder="遇到了什么问题？哪些做法需要调整？"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>关键收获</label>
                <textarea
                  value={reviewForm.lessons}
                  onChange={(e) => setReviewForm({ ...reviewForm, lessons: e.target.value })}
                  placeholder="提炼出的核心认知与方法论"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>下一步行动</label>
                <textarea
                  value={reviewForm.nextActions}
                  onChange={(e) => setReviewForm({ ...reviewForm, nextActions: e.target.value })}
                  placeholder="具体、可执行的改进计划"
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={saveReview}>保存</button>
                <button className="btn-ghost" onClick={() => setShowReviewForm(false)}>取消</button>
              </div>
            </div>
          )}

          {reviews.length === 0 && !showReviewForm ? (
            <div className="empty-state">
              <p>还没有复盘记录</p>
              <p className="empty-hint">定期回顾学习与实践，用结构化复盘加速成长</p>
              <button className="btn-primary" onClick={openNewReview}>开始第一次复盘</button>
            </div>
          ) : (
            <div className="review-list">
              {reviews.map((entry) => (
                <div key={entry.id} className="review-card">
                  <div className="review-card-header">
                    <div>
                      <h3>{entry.title}</h3>
                      {entry.period && <span className="review-period">{entry.period}</span>}
                    </div>
                    <span className="memory-date">{formatDate(entry.updatedAt)}</span>
                  </div>
                  <div className="review-blocks">
                    {entry.whatWorked && (
                      <div className="review-block positive">
                        <h4>做得好的</h4>
                        <p>{entry.whatWorked}</p>
                      </div>
                    )}
                    {entry.whatFailed && (
                      <div className="review-block negative">
                        <h4>待改进的</h4>
                        <p>{entry.whatFailed}</p>
                      </div>
                    )}
                    {entry.lessons && (
                      <div className="review-block insight">
                        <h4>关键收获</h4>
                        <p>{entry.lessons}</p>
                      </div>
                    )}
                    {entry.nextActions && (
                      <div className="review-block action">
                        <h4>下一步行动</h4>
                        <p>{entry.nextActions}</p>
                      </div>
                    )}
                  </div>
                  <div className="memory-card-actions">
                    <button onClick={() => openEditReview(entry)}>编辑</button>
                    <button className="danger" onClick={() => deleteReview(entry.id)}>删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
