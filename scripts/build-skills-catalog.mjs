/**
 * 从 .cursor/skills 的 reference.md 生成 site/skills-catalog.js
 * 运行：node scripts/build-skills-catalog.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const SKILL_CONFIG = [
  {
    id: 'pm-bagu',
    label: '产品经理八股',
    file: '.cursor/skills/pm-bagu/reference.md',
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
    id: 'industry-terms',
    label: '行业通用词语',
    file: '.cursor/skills/industry-terms/reference.md',
    sectionCategory: {
      '第一部分': 'domain',
      '第二部分': 'domain',
      '第三部分': 'domain',
      '第四部分': 'domain',
    },
  },
  {
    id: 'workflow',
    label: '工作流程',
    file: '.cursor/skills/workflow/reference.md',
    sectionCategory: {
      '1': 'skills',
      '2': 'skills',
      '3': 'skills',
      '4': 'skills',
      '5': 'skills',
    },
  },
  {
    id: 'product-methodology',
    label: '产品策划方法论',
    file: '.cursor/skills/product-methodology/reference.md',
    sectionCategory: {
      '1': 'methodology',
      '2': 'methodology',
      '3': 'methodology',
      '4': 'skills',
      '5': 'skills',
      '6': 'skills',
    },
  },
  {
    id: 'system-architecture',
    label: '系统架构',
    file: '.cursor/skills/system-architecture/reference.md',
    sectionCategory: {
      '1': 'domain',
      '2': 'domain',
      '3': 'domain',
      '4': 'domain',
      '5': 'skills',
    },
  },
]

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'item'
}

function linesToContent(body) {
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith('>') && !l.startsWith('|') && !l.startsWith('```'))
  const content = []
  for (const line of lines) {
    const cleaned = line.replace(/^[-*]\s*\*\*/, '').replace(/\*\*：/, '：').replace(/\*\*/g, '')
    if (cleaned.startsWith('- ')) content.push(cleaned.slice(2))
    else if (cleaned.startsWith('* ')) content.push(cleaned.slice(2))
    else if (/^\d+\./.test(cleaned)) content.push(cleaned.replace(/^\d+\.\s*/, ''))
    else content.push(cleaned)
  }
  return content.slice(0, 12)
}

function firstSummary(content, title) {
  const line = content.find((c) => c.includes('解释') || c.includes('定义') || c.length > 8)
  if (!line) return title
  return line.replace(/^解释[：:]\s*/, '').replace(/^定义[：:]\s*/, '').slice(0, 120)
}

function parseReference(md, skill) {
  const items = []
  let currentCategory = 'methodology'
  let currentSection = ''
  const blocks = md.split(/\n(?=### )/)

  for (const block of blocks) {
    const sectionMatch = block.match(/^## ([^\n]+)/m)
    if (sectionMatch) {
      const sectionTitle = sectionMatch[1].trim()
      const numMatch = sectionTitle.match(/^(\d+|[一二三四]+部分)/)
      const key = numMatch ? numMatch[1] : sectionTitle.split(/[：.\s]/)[0]
      if (skill.sectionCategory[key]) currentCategory = skill.sectionCategory[key]
      currentSection = sectionTitle
    }

    const h3Match = block.match(/^### ([^\n]+)/m)
    if (!h3Match) continue

    const title = h3Match[1].trim()
    if (title.includes('待补充') || title.includes('相关词条')) continue

    const body = block.slice(h3Match.index + h3Match[0].length).trim()
    const content = linesToContent(body)
    if (content.length === 0) continue

    const sourceKey = `${skill.id}:${slugify(title)}`
    const tags = [skill.label]
    if (title.match(/[A-Z]{2,}/)) tags.push(title.match(/[A-Z]{2,}/)[0])

    items.push({
      sourceKey,
      skillId: skill.id,
      skillLabel: skill.label,
      section: currentSection,
      categoryId: currentCategory,
      title,
      summary: firstSummary(content, title),
      tags: [...new Set(tags)],
      content,
    })
  }

  return items
}

function main() {
  const catalog = []

  for (const skill of SKILL_CONFIG) {
    const filePath = path.join(root, skill.file)
    if (!fs.existsSync(filePath)) {
      console.warn('Skip missing:', skill.file)
      continue
    }
    const md = fs.readFileSync(filePath, 'utf8')
    catalog.push(...parseReference(md, skill))
  }

  const out = `// 由 scripts/build-skills-catalog.mjs 自动生成，请勿手改
// 更新 skill 后运行：npm run build:skills
window.PDMSkillsCatalog = ${JSON.stringify(catalog, null, 2)}
`

  const outPath = path.join(root, 'site', 'skills-catalog.js')
  fs.writeFileSync(outPath, out, 'utf8')
  console.log(`Wrote ${catalog.length} items to site/skills-catalog.js`)
}

main()
