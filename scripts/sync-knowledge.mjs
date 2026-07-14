/**
 * 将 src/data/knowledge.ts 同步到 site/data.js
 * 用法：node scripts/sync-knowledge.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const srcFile = path.join(root, 'src/data/knowledge.ts')
const outFile = path.join(root, 'site/data.js')

const src = fs.readFileSync(srcFile, 'utf8')
const start = src.indexOf('export const categories')
if (start === -1) {
  console.error('未找到 export const categories')
  process.exit(1)
}

const eq = src.indexOf('=', start)
const arrStart = src.indexOf('[', eq)
let depth = 0
let arrEnd = -1
for (let i = arrStart; i < src.length; i++) {
  if (src[i] === '[') depth++
  if (src[i] === ']') {
    depth--
    if (depth === 0) {
      arrEnd = i
      break
    }
  }
}

const categoriesRaw = src.slice(arrStart, arrEnd + 1)
// knowledge.ts 使用 JS 对象字面量（单引号），用 Function 解析
const categories = new Function(`return ${categoriesRaw}`)()

const enrichmentPath = path.join(root, 'src/data/knowledge-enrichment.json')
let enrichment = {}
if (fs.existsSync(enrichmentPath)) {
  enrichment = JSON.parse(fs.readFileSync(enrichmentPath, 'utf8'))
  for (const cat of categories) {
    for (const item of cat.items) {
      const extra = enrichment[item.id]
      if (extra) {
        if (extra.cases) item.cases = extra.cases
        if (extra.pmApplication) item.pmApplication = extra.pmApplication
      }
    }
  }
} else {
  console.warn('未找到 knowledge-enrichment.json，跳过案例合并')
}

const fromMdPath = path.join(root, 'src/data/knowledge-from-md.json')
let mdImportCount = 0
if (fs.existsSync(fromMdPath)) {
  const fromMd = JSON.parse(fs.readFileSync(fromMdPath, 'utf8'))
  const byCat = new Map(categories.map((c) => [c.id, c]))
  const existingIds = new Set(categories.flatMap((c) => c.items.map((i) => i.id)))
  for (const item of fromMd) {
    if (existingIds.has(item.id)) continue
    const cat = byCat.get(item.categoryId)
    if (!cat) continue
    cat.items.push({
      id: item.id,
      title: item.title,
      summary: item.summary,
      tags: item.tags || [],
      content: item.content || [],
      ...(item.cases?.length ? { cases: item.cases } : {}),
      ...(item.pmApplication?.length ? { pmApplication: item.pmApplication } : {}),
    })
    existingIds.add(item.id)
    mdImportCount++
  }
  if (mdImportCount) console.log(`已合并 ${mdImportCount} 条 Markdown 导入知识点`)
} else {
  console.warn('未找到 knowledge-from-md.json，跳过 MD 导入（可先运行 node scripts/import-knowledge-base.mjs）')
}

const helpers = `
function getCategoryById(id) { return categories.find(c => c.id === id); }
function getItemById(categoryId, itemId) {
  const cat = getCategoryById(categoryId);
  return cat?.items.find(i => i.id === itemId);
}
function searchKnowledge(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results = [];
  for (const category of categories) {
    for (const item of category.items) {
      const match =
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q)) ||
        item.content.some(c => c.toLowerCase().includes(q)) ||
        (item.cases || []).some(c => c.toLowerCase().includes(q)) ||
        (item.pmApplication || []).some(c => c.toLowerCase().includes(q));
      if (match) results.push({ category, item });
    }
  }
  return results;
}
`

const output = `// 此文件由 scripts/sync-knowledge.mjs 自动生成，请勿直接编辑\n// 请修改 src/data/knowledge.ts 后运行: node scripts/sync-knowledge.mjs\n\nconst categories = ${JSON.stringify(categories, null, 2)};\n${helpers}`

fs.writeFileSync(outFile, output)
const count = categories.reduce((s, c) => s + c.items.length, 0)
console.log(`已同步 ${count} 个知识点 → site/data.js`)

const enPath = path.join(root, 'src/data/knowledge-en.json')
const enOutFile = path.join(root, 'site/knowledge-en.js')
if (fs.existsSync(enPath)) {
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'))
  const enOutput = `// 此文件由 scripts/sync-knowledge.mjs 自动生成，请勿直接编辑\n// 请修改 src/data/knowledge-en.json 后运行: node scripts/sync-knowledge.mjs\n\nwindow.PM_KNOWLEDGE_EN = ${JSON.stringify(enData, null, 2)};\n`
  fs.writeFileSync(enOutFile, enOutput)
  console.log(`已同步 ${Object.keys(enData).length} 条英文翻译 → site/knowledge-en.js`)
} else {
  console.warn('未找到 knowledge-en.json，跳过英文 bundle')
}
