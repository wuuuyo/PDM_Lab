/**
 * 从 src/data/knowledge-imports/*.md 解析知识点 → knowledge-from-md.json
 * 再由 sync-knowledge.mjs 合并进 site/data.js
 *
 * 用法：node scripts/import-knowledge-base.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const importDir = path.join(root, 'src/data/knowledge-imports')
const outPath = path.join(root, 'src/data/knowledge-from-md.json')

const SOURCES = [
  {
    id: 'pm-bagu',
    file: 'pm-bagu.md',
    label: '产品经理八股',
    headingLevel: '###',
    defaultCategory: 'interview',
    sectionCategory: {
      '1': 'methodology',
      '2': 'methodology',
      '3': 'methodology',
      '4': 'skills',
      '5': 'skills',
      '6': 'skills',
      '7': 'skills',
      '8': 'skills',
      '9': 'interview',
    },
  },
  {
    id: 'product-methodology',
    file: 'product-methodology.md',
    label: '产品策划方法论',
    headingLevel: '##',
    defaultCategory: 'methodology',
    sectionCategory: {
      '1': 'methodology',
      '2': 'methodology',
      '3': 'methodology',
      '4': 'skills',
      '5': 'skills',
      '6': 'skills',
    },
    skipTitles: ['6 大体系导览', '📑 6 大体系导览', '目录'],
  },
  {
    id: 'industry-terms',
    file: 'industry-terms.md',
    label: '行业通用词语',
    headingLevel: '###',
    defaultCategory: 'domain',
    sectionCategory: {
      '第一部分': 'domain',
      '第二部分': 'domain',
      '第三部分': 'domain',
      '第四部分': 'domain',
      '1': 'domain',
      '2': 'domain',
      '3': 'domain',
      '4': 'domain',
    },
  },
  {
    id: 'system-architecture',
    file: 'system-architecture.md',
    label: '系统架构',
    headingLevel: '###',
    defaultCategory: 'domain',
    sectionCategory: {
      '1': 'domain',
      '2': 'domain',
      '3': 'domain',
      '4': 'domain',
      '5': 'skills',
    },
  },
  {
    id: 'workflow',
    file: 'workflow.md',
    label: '工作流程',
    headingLevel: '###',
    defaultCategory: 'skills',
    sectionCategory: {
      '需求处理': 'skills',
      '普渡': 'skills',
      '文档': 'skills',
      '上线': 'skills',
    },
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
  return /^(补全自|来源|关联|参考)[：:]/.test(line)
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
      // 矩阵表（首列表头空）如 价值-成本（须先于 length<=1 说明表）
      if (!heads[0] && heads.length >= 3) {
        const rowLabel = cells[0]
        const parts = cells.slice(1).map((v, i) => `${heads[i + 1]}=${v}`)
        out.push(`${rowLabel} → ${parts.join('，')}`)
        continue
      }
      // # / 字母 开头的说明表 →「名称：含义」（排除空表头，避免误伤矩阵）
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
      // 常见两列表：字段 | 含义
      if (heads.length === 2) {
        out.push(`${cells[0]}：${cells[1]}`)
        continue
      }
      // 多列表：拼成「表头=值」
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

    // fenced code：保留内容，丢掉围栏
    if (trimmed.startsWith('```')) {
      i++
      const code = []
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        if (lines[i].trim()) code.push(lines[i].replace(/\s+$/, ''))
        i++
      }
      i++ // closing fence
      if (code.length) push(code.join('\n'))
      continue
    }

    if (trimmed === '---' || trimmed === '') {
      i++
      continue
    }

    // Markdown 表格
    if (trimmed.startsWith('|')) {
      const block = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        block.push(lines[i])
        i++
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

    // 小节标题 → 分区标签
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

    // 粗体小标题行（如「好北极星的 3 个特征:」）保留
    push(line)
    i++
  }
  flushCase()

  return {
    content: content.slice(0, 40),
    cases: cases.slice(0, 6),
    pmApplication: pmApplication.slice(0, 6),
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
    .replace(/^\d+(\.\d+)+\s+/, '') // 去掉 1.1 / 3.2 编号，与内置词条排版统一
    .trim()
}

function itemRichness(item) {
  const pack = [...(item.content || []), ...(item.cases || []), ...(item.pmApplication || [])]
  return pack.join('').length
}

function resolveCategory(sectionTitle, source) {
  if (!sectionTitle) return source.defaultCategory
  const numMatch = sectionTitle.match(/^(\d+|[一二三四]+部分)/)
  if (numMatch && source.sectionCategory[numMatch[1]]) {
    return source.sectionCategory[numMatch[1]]
  }
  for (const [key, cat] of Object.entries(source.sectionCategory || {})) {
    if (sectionTitle.includes(key)) return cat
  }
  return source.defaultCategory
}

function splitByHeading(md, level) {
  const prefix = level === '##' ? '## ' : '### '
  const re = level === '##' ? /\n(?=## )/ : /\n(?=### )/
  const parts = md.split(re)
  return parts
    .map((part) => {
      const lines = part.trim().split('\n')
      const first = lines[0] || ''
      if (!first.startsWith(prefix)) return null
      // avoid #### and higher when matching ###
      if (level === '###' && first.startsWith('####')) return null
      if (level === '##' && first.startsWith('###')) return null
      const title = first.slice(prefix.length).trim()
      const body = lines.slice(1).join('\n').trim()
      return { title, body }
    })
    .filter(Boolean)
}

function parseSource(md, source) {
  const items = []
  let currentSection = ''
  let currentCategory = source.defaultCategory

  // Track ## sections even when items are ###
  const lines = md.split('\n')
  let buffer = []
  let currentH3 = null

  function flushItem(title, body) {
    if (!title) return
    if (source.skipTitles?.some((s) => title.includes(s.replace(/📑\s*/, '')))) return
    if (title.includes('待补充') || title.includes('导览') || title.includes('相关词条')) return
    // skip pure section headers like "1. 战略与定位" when importing ## from methodology
    // keep "1.1 北极星指标" etc.
    if (source.headingLevel === '##' && /^\d+\.\s/.test(title) && !/^\d+\.\d+/.test(title)) {
      currentSection = title
      currentCategory = resolveCategory(title, source)
      return
    }

    const structured = extractStructured(body.split('\n'))
    const richness =
      structured.content.join('').length +
      structured.cases.join('').length +
      structured.pmApplication.join('').length
    // 去掉 meta 和表格后仍几乎空白的，不导入（避免出现「点进去是空的」）
    if (richness < 16) return

    const id = `kb-${source.id}-${slugify(title)}`
    const niceTitle = displayTitle(title)
    items.push({
      id,
      sourceId: source.id,
      sourceLabel: source.label,
      section: currentSection,
      categoryId: currentCategory,
      title: niceTitle,
      summary: firstSummary(structured.content, niceTitle),
      tags: [...new Set([source.label, ...(title.match(/[A-Z]{2,}/g) || []).slice(0, 2)])],
      content: structured.content,
      cases: structured.cases,
      pmApplication: structured.pmApplication,
    })
  }

  if (source.headingLevel === '##') {
    let h2Title = null
    let h2Body = []
    const flushH2 = () => {
      if (!h2Title) return
      flushItem(h2Title, h2Body.join('\n'))
      h2Title = null
      h2Body = []
    }
    for (const line of lines) {
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
        continue
      }
      if (h2Title) h2Body.push(line)
    }
    flushH2()
    return items
  }

  // ### items with ## section context
  for (const line of lines) {
    if (/^##\s+/.test(line) && !/^###\s+/.test(line)) {
      if (currentH3) {
        flushItem(currentH3, buffer.join('\n'))
        currentH3 = null
        buffer = []
      }
      currentSection = line.replace(/^##\s+/, '').trim()
      currentCategory = resolveCategory(currentSection, source)
      continue
    }
    if (/^###\s+/.test(line) && !/^####\s+/.test(line)) {
      if (currentH3) {
        flushItem(currentH3, buffer.join('\n'))
        buffer = []
      }
      currentH3 = line.replace(/^###\s+/, '').trim()
      continue
    }
    if (currentH3) buffer.push(line)
  }
  if (currentH3) flushItem(currentH3, buffer.join('\n'))

  return items
}

function main() {
  const all = []
  const seenIds = new Set()
  const byTitle = new Map() // titleKey → index in all

  // 优先导入产品策划方法论（更完整），再导入八股短条目，避免短条目占位
  const ordered = [
    ...SOURCES.filter((s) => s.id === 'product-methodology'),
    ...SOURCES.filter((s) => s.id !== 'product-methodology'),
  ]

  for (const source of ordered) {
    const filePath = path.join(importDir, source.file)
    if (!fs.existsSync(filePath)) {
      console.warn('Skip missing:', source.file)
      continue
    }
    const md = fs.readFileSync(filePath, 'utf8')
    const items = parseSource(md, source)
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

  fs.writeFileSync(outPath, JSON.stringify(all, null, 2), 'utf8')
  console.log(`\nWrote ${all.length} items → src/data/knowledge-from-md.json`)
}

main()
