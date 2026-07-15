/**
 * 从 knowledge/product-knowledge-public 解析知识点 → knowledge-from-md.json
 * 再由 sync-knowledge.mjs 合并进 site/data.js
 *
 * 分类对齐 README 主题（不含每日学习）：
 * methodology | architecture | business | security | workflow | reference
 *
 * 用法：node scripts/import-knowledge-base.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const sourceRoot = path.join(root, 'knowledge/product-knowledge-public')
const outPath = path.join(root, 'src/data/knowledge-from-md.json')

const SOURCES = [
  {
    id: 'product-methodology',
    file: '01-PM方法论/产品策划方法论.md',
    label: '产品策划方法论',
    headingLevel: '##',
    defaultCategory: 'methodology',
    sectionCategory: {
      '1': 'methodology',
      '2': 'methodology',
      '3': 'methodology',
      '4': 'methodology',
      '5': 'methodology',
      '6': 'methodology',
      '7': 'methodology',
      '8': 'methodology',
      '9': 'methodology',
    },
    skipTitles: ['6 大体系导览', '📑 6 大体系导览', '目录', '关联文件'],
  },
  {
    id: 'pm-bagu',
    file: '01-PM方法论/产品经理八股.md',
    label: '产品经理八股',
    headingLevel: '###',
    defaultCategory: 'methodology',
    sectionCategory: {
      '1': 'methodology',
      '2': 'methodology',
      '3': 'methodology',
      '4': 'methodology',
      '5': 'methodology',
      '6': 'methodology',
      '7': 'methodology',
      '8': 'methodology',
      '9': 'methodology',
    },
  },
  {
    id: 'system-architecture',
    file: '02-技术架构/系统架构.md',
    label: '系统架构',
    headingLevel: '###',
    defaultCategory: 'architecture',
    sectionCategory: {
      '1': 'architecture',
      '2': 'architecture',
      '3': 'architecture',
      '4': 'architecture',
      '5': 'architecture',
    },
  },
  {
    id: 'industry-terms',
    file: '02-技术架构/行业通用词语.md',
    label: '行业通用词语',
    headingLevel: '###',
    defaultCategory: 'architecture',
    sectionCategory: {
      '第一部分': 'architecture',
      '第二部分': 'business',
      '第三部分': 'architecture',
      '第四部分': 'security',
      '1': 'architecture',
      '2': 'business',
      '3': 'architecture',
      '4': 'security',
    },
  },
  {
    id: 'workflow',
    file: '03-工作流程/工作流程.md',
    label: '工作流程',
    headingLevel: '###',
    defaultCategory: 'workflow',
    sectionCategory: {
      '需求处理': 'workflow',
      '文档': 'workflow',
      '上线': 'workflow',
      '复盘': 'workflow',
    },
  },
  {
    id: 'keyword-index',
    file: '05-快速参考/关键词速查表.md',
    label: '关键词速查表',
    headingLevel: '##',
    defaultCategory: 'reference',
    sectionCategory: {},
  },
  {
    id: 'mindmap',
    file: '05-快速参考/思维导图.md',
    label: '思维导图',
    headingLevel: '##',
    defaultCategory: 'reference',
    sectionCategory: {},
  },
  {
    id: 'learning-path',
    file: '05-快速参考/学习路径.md',
    label: '学习路径',
    headingLevel: '##',
    defaultCategory: 'reference',
    sectionCategory: {},
  },
]

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[⭐★]/g, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56) || 'item'
}

function stripMdInline(line) {
  return String(line)
    .replace(/\*\*/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s*/, '')
    .trim()
}

function cleanLine(line) {
  return stripMdInline(line)
    .replace(/^[-*]\s+/, '')
    .trim()
}

function isMetaLine(line) {
  // 仅过滤文档元信息，保留「来源：用户反馈」等正文列表项
  return /^(补全自|关联Skill|参考文档|来源文档)[：:]/.test(line)
}

function isTableSep(line) {
  const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c))
}

function tableCells(line) {
  const raw = String(line).trim()
  if (!raw.includes('|')) return []
  let s = raw
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => stripMdInline(c)).map((c) => c.trim())
}

/** 把 Markdown 表转成可读行，避免导入时整表被丢光 */
function formatTableBlock(tableLines) {
  const rows = tableLines
    .filter((l) => l.trim().startsWith('|') && !isTableSep(l))
    .map(tableCells)
    .filter((cells) => cells.some((c) => c && !/^[-:]+$/.test(c)))
  if (!rows.length) return []

  const header = rows[0]
  const looksHeader = header.every((c) => c.length <= 24) && rows.length > 1
  const dataRows = looksHeader ? rows.slice(1) : rows
  const heads = looksHeader ? header : null
  const out = []

  for (const cells of dataRows) {
    if (heads && heads.length === cells.length) {
      if (!heads[0] && heads.length >= 3) {
        const rowLabel = cells[0]
        const parts = cells.slice(1).map((v, i) => `${heads[i + 1]}=${v}`)
        out.push(`${rowLabel} → ${parts.join('，')}`)
        continue
      }
      if (
        heads.length >= 3 &&
        heads[0] &&
        (/^#|字母|序号/.test(heads[0]) || heads[0].length <= 1)
      ) {
        const name = cells[1] || cells[0]
        const rest = cells.slice(2).filter(Boolean).join(' / ')
        out.push(rest ? `${name}：${rest}` : name)
        continue
      }
      if (heads.length === 2) {
        out.push(`${cells[0]}：${cells[1]}`)
        continue
      }
      // 术语表：术语 | 解释 | 详细位置
      if (heads.length === 3 && /术语|词语/.test(heads[0])) {
        out.push(`${cells[0]}：${cells[1]}${cells[2] ? `（${cells[2]}）` : ''}`)
        continue
      }
      const parts = cells
        .map((v, i) => {
          const h = heads[i] || `列${i + 1}`
          if (!v) return ''
          if (h === '#' || /^#{1,3}$/.test(h)) return ''
          if (i === 0 && (h.length <= 2 || /字母|格子|维度|需求|阶段/.test(h))) return v
          return `${h}=${v}`
        })
        .filter(Boolean)
      out.push(parts.join(' · '))
    } else if (cells.length >= 2) {
      out.push(`${cells[0]}：${cells.slice(1).join(' / ')}`)
    } else if (cells[0]) {
      out.push(cells[0])
    }
  }
  return out
}

function extractStructured(lines) {
  const content = []
  const cases = []
  const pmApplication = []
  const mermaidBlocks = []
  const terms = []
  let i = 0
  let bucket = 'content' // content | cases | pm
  let caseBuf = null

  const flushCase = () => {
    if (caseBuf?.length) {
      cases.push(caseBuf.join('\n'))
      caseBuf = null
    }
  }

  const push = (text, forceBucket) => {
    const t = String(text || '').trim()
    if (!t || isMetaLine(t)) return
    const b = forceBucket || bucket
    if (b === 'cases') {
      if (!caseBuf) caseBuf = []
      caseBuf.push(t)
      return
    }
    if (b === 'pm') {
      pmApplication.push(t)
      return
    }
    content.push(t)
  }

  while (i < lines.length) {
    const raw = lines[i]
    const trimmed = raw.trim()

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim().toLowerCase()
      i++
      const code = []
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i].replace(/\s+$/, ''))
        i++
      }
      i++ // closing fence
      const body = code.join('\n').trim()
      if (!body) continue
      if (lang.startsWith('mermaid')) {
        mermaidBlocks.push(body)
        push('【知识图谱】')
      } else {
        push(body)
      }
      continue
    }

    if (trimmed === '---' || trimmed === '') {
      i++
      continue
    }

    if (trimmed.startsWith('|')) {
      const block = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        block.push(lines[i])
        i++
      }
      const rows = block
        .filter((l) => l.trim().startsWith('|') && !isTableSep(l))
        .map(tableCells)
        .filter((cells) => cells.some((c) => c && !/^[-:]+$/.test(c)))
      if (rows.length > 1) {
        const heads = rows[0]
        const isTermTable =
          heads.length >= 2 &&
          (/术语|词语/.test(heads[0]) || /解释|全称/.test(heads[1] || '') || /解释/.test(heads[2] || ''))
        if (isTermTable) {
          for (const cells of rows.slice(1)) {
            if (!cells[0]) continue
            // 3 列: 术语|解释|位置；4 列: 词语|全称|解释|案例
            const term = cells[0]
            const full = heads.length >= 4 ? cells[1] || '' : ''
            const explain = heads.length >= 4 ? cells[2] || '' : cells[1] || ''
            const exampleOrLoc = heads.length >= 4 ? cells[3] || '' : cells[2] || ''
            terms.push({
              term,
              meaning: full || explain,
              explain,
              loc: heads.length >= 4 ? '' : exampleOrLoc,
              case: heads.length >= 4 ? exampleOrLoc : '',
            })
            const line = full
              ? `${term}：${full}${explain ? ` — ${explain}` : ''}`
              : `${term}：${explain}${exampleOrLoc ? `（${exampleOrLoc}）` : ''}`
            push(line)
            if (exampleOrLoc && heads.length >= 4) {
              // 案例进 cases 槽，文章页可展示三段式
            }
          }
          continue
        }
      }
      const formatted = formatTableBlock(block)
      for (const row of formatted) push(row)
      continue
    }

    const line = cleanLine(raw)
    if (!line || isMetaLine(line)) {
      i++
      continue
    }

    if (/^#{2,4}\s+/.test(trimmed)) {
      flushCase()
      bucket = 'content'
      push(`【${line.replace(/^#+\s*/, '')}】`)
      i++
      continue
    }

    if (/^解释[：:]/.test(line)) {
      flushCase()
      bucket = 'content'
      push(line.replace(/^解释[：:]\s*/, ''), 'content')
      i++
      continue
    }
    if (/^案例[：:]/.test(line)) {
      flushCase()
      bucket = 'cases'
      const rest = line.replace(/^案例[：:]\s*/, '')
      if (rest) push(rest, 'cases')
      i++
      continue
    }
    if (/^PM\s*应用[：:]|^应用[：:]/.test(line)) {
      flushCase()
      bucket = 'pm'
      push(line.replace(/^(PM\s*应用|应用)[：:]\s*/, ''), 'pm')
      i++
      continue
    }

    push(line)
    i++
  }
  flushCase()

  return {
    content: content.slice(0, 100),
    cases: cases.slice(0, 8),
    pmApplication: pmApplication.slice(0, 8),
    mermaid: mermaidBlocks,
    terms,
  }
}

function firstSummary(content, title) {
  const candidates = (content || []).filter((c) => c.length > 12 && !c.startsWith('【') && !isMetaLine(c))
  const prose = candidates.find((c) => !c.includes(' · ') && (c.match(/：/g) || []).length <= 1)
  return String(prose || candidates[0] || title).slice(0, 120)
}

function titleKey(title) {
  return String(title)
    .replace(/^\d+(\.\d+)+\s+/, '')
    .replace(/[⭐★].*$/, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

function displayTitle(title) {
  return String(title)
    .replace(/⭐.*$/, '')
    .replace(/补全项.*$/, '')
    .replace(/^\d+(\.\d+)+\s+/, '')
    .trim()
}

function itemRichness(item) {
  const pack = [...(item.content || []), ...(item.cases || []), ...(item.pmApplication || [])]
  return pack.join('').length
}

function resolveCategory(sectionTitle, source) {
  if (!sectionTitle) return source.defaultCategory
  const partMatch = sectionTitle.match(/第([一二三四])部分/)
  if (partMatch) {
    const key = `第${partMatch[1]}部分`
    if (source.sectionCategory[key]) return source.sectionCategory[key]
  }
  const numMatch = sectionTitle.match(/^(\d+)/)
  if (numMatch && source.sectionCategory[numMatch[1]]) {
    return source.sectionCategory[numMatch[1]]
  }
  for (const [key, cat] of Object.entries(source.sectionCategory || {})) {
    if (sectionTitle.includes(key)) return cat
  }
  return source.defaultCategory
}

function inferKind(source, title, structured) {
  if (source.id === 'keyword-index') return 'glossary-letter'
  if (source.id === 'mindmap' || structured.mermaid?.length) return 'mermaid'
  if (source.id === 'learning-path') return 'path-stage'
  if (source.id === 'workflow') {
    if (/PRD|模板/.test(title)) return 'prd-template'
    if (/^\d+\.\s/.test(title) || /需求接收|需求分析|方案设计|评审|开发跟踪|上线|复盘总结/.test(title)) {
      return 'workflow-step'
    }
    if (/复盘|8\s*步|产物|关联需求|默认节奏/.test(title)) return 'retro-item'
    if (/协作/.test(title)) return 'collab-item'
    return 'workflow-item'
  }
  return 'article'
}

function parseSource(md, source) {
  const items = []
  let currentSection = ''
  let currentCategory = source.defaultCategory

  const lines = md.split('\n')
  let buffer = []
  let currentH3 = null

  function flushItem(title, body) {
    if (!title) return
    if (source.skipTitles?.some((s) => title.includes(s.replace(/📑\s*/, '')))) return
    if (title.includes('待补充') || title.includes('导览') || title.includes('相关词条')) return
    if (source.headingLevel === '##' && /^\d+\.\s/.test(title) && !/^\d+\.\d+/.test(title)) {
      currentSection = title
      currentCategory = resolveCategory(title, source)
      return
    }

    const structured = extractStructured(body.split('\n'))
    const richness =
      structured.content.join('').length +
      structured.cases.join('').length +
      structured.pmApplication.join('').length +
      (structured.mermaid || []).join('').length +
      (structured.terms || []).length * 20
    if (richness < 12) return

    const id = `kb-${source.id}-${slugify(title)}`
    const niceTitle = displayTitle(title)
    const kind = inferKind(source, title, structured)
    const cases = [...(structured.cases || [])]
    for (const tm of structured.terms || []) {
      if (tm.case) cases.push(`${tm.term}：${tm.case}`)
    }
    items.push({
      id,
      sourceId: source.id,
      sourceLabel: source.label,
      section: currentSection,
      categoryId: currentCategory,
      kind,
      title: niceTitle,
      summary: firstSummary(structured.content, niceTitle),
      tags: [...new Set([source.label, ...(title.match(/[A-Z]{2,}/g) || []).slice(0, 2)])],
      content: structured.content,
      cases,
      pmApplication: structured.pmApplication,
      ...(structured.mermaid?.length ? { mermaid: structured.mermaid } : {}),
      ...(structured.terms?.length ? { terms: structured.terms } : {}),
    })
  }

  if (source.headingLevel === '##') {
    let h2Title = null
    let h2Body = []
    let inFence = false
    const flushH2 = () => {
      if (!h2Title) return
      flushItem(h2Title, h2Body.join('\n'))
      h2Title = null
      h2Body = []
    }
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('```')) {
        inFence = !inFence
        if (h2Title) h2Body.push(line)
        continue
      }
      if (inFence) {
        if (h2Title) h2Body.push(line)
        continue
      }
      const h1 = line.match(/^#\s+(\d+)[\.\s]/)
      if (h1) {
        flushH2()
        currentCategory = source.sectionCategory[h1[1]] || source.defaultCategory
        currentSection = line.replace(/^#\s+/, '').trim()
        continue
      }
      if (/^##\s+/.test(line) && !/^###\s+/.test(line)) {
        flushH2()
        h2Title = line.replace(/^##\s+/, '').trim()
        currentCategory = resolveCategory(h2Title, source)
        continue
      }
      if (h2Title) h2Body.push(line)
    }
    flushH2()
    return items
  }

  // 无 ### 时整段 ##（如表格章节）自成一条
  let sectionBody = []
  let sectionHadH3 = false
  let inFence = false

  const flushSectionFallback = () => {
    if (sectionHadH3 || !currentSection || !sectionBody.length) {
      sectionBody = []
      sectionHadH3 = false
      return
    }
    flushItem(currentSection, sectionBody.join('\n'))
    sectionBody = []
    sectionHadH3 = false
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      inFence = !inFence
      if (currentH3) buffer.push(line)
      else if (currentSection) sectionBody.push(line)
      continue
    }
    if (inFence) {
      if (currentH3) buffer.push(line)
      else if (currentSection) sectionBody.push(line)
      continue
    }

    if (/^##\s+/.test(line) && !/^###\s+/.test(line)) {
      if (currentH3) {
        flushItem(currentH3, buffer.join('\n'))
        currentH3 = null
        buffer = []
      }
      flushSectionFallback()
      currentSection = line.replace(/^##\s+/, '').trim()
      currentCategory = resolveCategory(currentSection, source)
      sectionBody = []
      sectionHadH3 = false
      continue
    }
    if (/^###\s+/.test(line) && !/^####\s+/.test(line)) {
      if (currentH3) {
        flushItem(currentH3, buffer.join('\n'))
        buffer = []
      }
      sectionHadH3 = true
      currentH3 = line.replace(/^###\s+/, '').trim()
      continue
    }
    if (currentH3) buffer.push(line)
    else if (currentSection) sectionBody.push(line)
  }
  if (currentH3) flushItem(currentH3, buffer.join('\n'))
  flushSectionFallback()

  return items
}

/** 表格整章（如权限安全）拆成独立词条，避免分类页只有一块空壳 */
function expandTermBlobItems(items) {
  const out = []
  for (const item of items) {
    const isBlob =
      item.terms?.length &&
      (/第三部分|第四部分/.test(item.section || '') || /第三部分|第四部分/.test(item.title || ''))
    if (!isBlob) {
      out.push(item)
      continue
    }
    for (const tm of item.terms) {
      const explain = tm.explain || tm.meaning || ''
      const content = []
      if (tm.meaning && tm.explain && tm.meaning !== tm.explain) {
        content.push(`${tm.term}（${tm.meaning}）`)
        content.push(tm.explain)
      } else if (explain) {
        content.push(explain)
      }
      if (tm.loc) content.push(`参见：${tm.loc}`)
      out.push({
        id: `kb-${item.sourceId}-${slugify(tm.term)}`,
        sourceId: item.sourceId,
        sourceLabel: item.sourceLabel,
        section: item.section || item.title,
        categoryId: item.categoryId,
        kind: 'term',
        title: tm.term,
        summary: String(explain || tm.meaning || tm.term).slice(0, 120),
        tags: [...new Set([item.sourceLabel, tm.term].filter(Boolean))],
        content,
        cases: tm.case ? [tm.case] : [],
        pmApplication: [],
        terms: [tm],
      })
    }
  }
  return out
}

function main() {
  const all = []
  const seenIds = new Set()
  const byTitle = new Map()

  const ordered = [
    ...SOURCES.filter((s) => s.id === 'product-methodology'),
    ...SOURCES.filter((s) => s.id !== 'product-methodology'),
  ]

  for (const source of ordered) {
    const filePath = path.join(sourceRoot, source.file)
    if (!fs.existsSync(filePath)) {
      console.warn('Skip missing:', source.file)
      continue
    }
    const md = fs.readFileSync(filePath, 'utf8')
    let items = parseSource(md, source)
    if (source.id === 'industry-terms') items = expandTermBlobItems(items)
    let added = 0
    let skippedDup = 0
    for (const item of items) {
      if (seenIds.has(item.id)) continue
      const key = `${item.categoryId}::${titleKey(item.title)}`
      const prevIdx = byTitle.get(key)
      if (prevIdx != null) {
        const prev = all[prevIdx]
        if (itemRichness(item) > itemRichness(prev) + 20) {
          seenIds.delete(prev.id)
          seenIds.add(item.id)
          all[prevIdx] = item
          added++
        } else {
          skippedDup++
        }
        continue
      }
      seenIds.add(item.id)
      byTitle.set(key, all.length)
      all.push(item)
      added++
    }
    console.log(`${source.label}: +${added} items` + (skippedDup ? ` (skip ${skippedDup} shorter dups)` : ''))
  }

  const byCat = {}
  for (const item of all) {
    byCat[item.categoryId] = (byCat[item.categoryId] || 0) + 1
  }
  console.log('By category:', byCat)

  fs.writeFileSync(outPath, JSON.stringify(all, null, 2), 'utf8')
  console.log(`\nWrote ${all.length} items → src/data/knowledge-from-md.json`)
}

main()

