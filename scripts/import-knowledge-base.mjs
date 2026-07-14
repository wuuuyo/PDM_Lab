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

function cleanLine(line) {
  return line
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+[\.、]\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/^>\s*/, '')
    .trim()
}

function extractStructured(lines) {
  const content = []
  const cases = []
  const pmApplication = []
  for (const raw of lines) {
    const line = cleanLine(raw)
    if (!line || line.startsWith('|') || line.startsWith('```') || line === '---') continue
    if (/^解释[：:]/.test(line)) {
      content.push(line.replace(/^解释[：:]\s*/, ''))
      continue
    }
    if (/^案例[：:]/.test(line)) {
      cases.push(line.replace(/^案例[：:]\s*/, ''))
      continue
    }
    if (/^PM\s*应用[：:]|^应用[：:]/.test(line)) {
      pmApplication.push(line.replace(/^(PM\s*应用|应用)[：:]\s*/, ''))
      continue
    }
    content.push(line)
  }
  return {
    content: content.slice(0, 16),
    cases: cases.slice(0, 4),
    pmApplication: pmApplication.slice(0, 4),
  }
}

function firstSummary(content, title) {
  const line = content.find((c) => c.length > 8) || title
  return line.slice(0, 120)
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
    if (structured.content.length === 0) return

    const id = `kb-${source.id}-${slugify(title)}`
    items.push({
      id,
      sourceId: source.id,
      sourceLabel: source.label,
      section: currentSection,
      categoryId: currentCategory,
      title: title.replace(/⭐.*$/, '').replace(/补全项.*$/, '').trim(),
      summary: firstSummary(structured.content, title),
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
  const seen = new Set()

  for (const source of SOURCES) {
    const filePath = path.join(importDir, source.file)
    if (!fs.existsSync(filePath)) {
      console.warn('Skip missing:', source.file)
      continue
    }
    const md = fs.readFileSync(filePath, 'utf8')
    const items = parseSource(md, source)
    let added = 0
    for (const item of items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      all.push(item)
      added++
    }
    console.log(`${source.label}: +${added} items`)
  }

  fs.writeFileSync(outPath, JSON.stringify(all, null, 2), 'utf8')
  console.log(`\nWrote ${all.length} items → src/data/knowledge-from-md.json`)
}

main()
