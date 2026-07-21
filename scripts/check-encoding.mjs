/**
 * Pre-release guard for PM Lab.
 *
 * Checks:
 * - replacement characters and question-mark corruption
 * - common UTF-8 / GBK mojibake fragments
 * - abnormal article titles
 * - empty links and static broken article/doc links
 *
 * Usage:
 *   node scripts/check-encoding.mjs
 */
import fs from 'fs'
import path from 'path'
import vm from 'vm'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const SCAN_DIRS = ['site', 'src', 'knowledge', 'scripts', 'supabase']
const TEXT_EXTS = new Set(['.js', '.mjs', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.sql', '.txt'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.vite', '.wrangler', '.vercel'])
const SKIP_FILES = new Set(['scripts/check-encoding.mjs'])

const HARD_MOJIBAKE_PATTERNS = [
  /\uFFFD/,
  /(?:Ã|Â|â€|â€™|â€œ|â€�|ðŸ)/,
  /[åæç][\u0080-\u00ff]/,
  /(?:绋|鐭|浜|鍝|瀛|鏉|绠|璇|妗|鍔|鍗|澶|鎴|涓|杩|闇|姣|鍏|璁|搴|寮|棣|椤|熸|炴|弸)/,
]

const SOFT_MOJIBAKE_PATTERNS = [
  /[¶à»§¼Ü¹¹£¡¿½¾]/,
  /\?{3,}/,
]

const KNOWN_DYNAMIC_LINK_PREFIXES = [
  '#/article/${',
  '#/doc/${',
  '#/my-knowledge/',
  '#/forum/post/',
  '#/chapter/${',
]

let issueCount = 0
let warningCount = 0

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/')
}

function report(kind, file, message) {
  issueCount += 1
  console.error(`[${kind}] ${file}: ${message}`)
}

function warn(kind, file, message) {
  warningCount += 1
  console.warn(`[warn:${kind}] ${file}: ${message}`)
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (TEXT_EXTS.has(path.extname(entry.name).toLowerCase())) acc.push(full)
  }
  return acc
}

function getLine(text, index) {
  return text.slice(0, index).split(/\r?\n/).length
}

function scanTextFile(file) {
  if (SKIP_FILES.has(rel(file))) return
  const text = fs.readFileSync(file, 'utf8')
  const relative = rel(file)
  for (const pattern of HARD_MOJIBAKE_PATTERNS) {
    const match = pattern.exec(text)
    if (match) {
      report('encoding', `${relative}:${getLine(text, match.index)}`, `suspicious mojibake/replacement fragment "${match[0]}"`)
    }
  }
  for (const pattern of SOFT_MOJIBAKE_PATTERNS) {
    const match = pattern.exec(text)
    if (match) {
      warn('encoding', `${relative}:${getLine(text, match.index)}`, `possible mojibake/question corruption "${match[0]}"`)
    }
  }
}

function loadCategories() {
  const dataFile = path.join(root, 'site', 'data.js')
  const code = fs.readFileSync(dataFile, 'utf8')
  const context = {}
  vm.createContext(context)
  vm.runInContext(`${code}\n;globalThis.__categories = categories;`, context, { filename: dataFile })
  return context.__categories || []
}

function buildKnowledgeIndexes(categories) {
  const articleSet = new Set()
  const docSet = new Set()
  const categorySet = new Set()

  for (const category of categories) {
    categorySet.add(category.id)
    for (const item of category.items || []) {
      articleSet.add(`${category.id}/${item.id}`)
      if (item.sourceId) docSet.add(`${category.id}/${item.sourceId}`)
    }
  }

  return { articleSet, docSet, categorySet }
}

function isSuspiciousTitle(title) {
  return (
    /\uFFFD/.test(title) ||
    /\?{2,}/.test(title) ||
    HARD_MOJIBAKE_PATTERNS.some((pattern) => pattern.test(title)) ||
    SOFT_MOJIBAKE_PATTERNS.some((pattern) => pattern.test(title))
  )
}

function scanArticleData(categories) {
  for (const category of categories) {
    for (const item of category.items || []) {
      const label = `site/data.js article ${category.id}/${item.id}`
      if (!item.id || !item.title) report('article', label, 'missing id or title')
      if (isSuspiciousTitle(String(item.title || ''))) report('article-title', label, `abnormal title "${item.title}"`)
      if (isSuspiciousTitle(String(item.summary || ''))) warn('article-summary', label, `possible abnormal summary "${item.summary}"`)
      for (const field of ['content', 'cases', 'pmApplication']) {
        for (const text of item[field] || []) {
          if (/\uFFFD|\?{3,}/.test(String(text))) report('article-content', label, `abnormal ${field} text`)
        }
      }
    }
  }
}

function extractStaticLinks(file) {
  const text = fs.readFileSync(file, 'utf8')
  const links = []
  const seen = new Set()
  const patterns = [
    /\bhref\s*[:=]\s*["'`]([^"'`]+)["'`]/g,
    /\blink\s*:\s*\{\s*href\s*:\s*["'`]([^"'`]+)["'`]/g,
  ]
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text))) {
      const key = `${match[1]}@${getLine(text, match.index)}`
      if (seen.has(key)) continue
      seen.add(key)
      links.push({ href: match[1], line: getLine(text, match.index) })
    }
  }
  return links
}

function decodeJsEscapes(value) {
  return String(value).replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_, braced, fixed) => {
    const code = Number.parseInt(braced || fixed, 16)
    return Number.isFinite(code) ? String.fromCodePoint(code) : _
  })
}

function isDynamicLink(href) {
  return href.includes('${') || KNOWN_DYNAMIC_LINK_PREFIXES.some((prefix) => href.startsWith(prefix))
}

function decodeRoutePart(part) {
  try {
    return decodeURIComponent(part)
  } catch {
    return part
  }
}

function validateLink(href, file, line, indexes) {
  href = decodeJsEscapes(href)
  const where = `${rel(file)}:${line}`
  if (!href || href === '#' || href === 'javascript:void(0)') {
    report('link-empty', where, `empty/non-navigating link "${href}"`)
    return
  }
  if (!href.startsWith('#/')) return
  if (isDynamicLink(href)) return

  const [route] = href.slice(2).split('?')
  const parts = route.split('/').filter(Boolean).map(decodeRoutePart)
  if (!parts.length) return

  if (parts[0] === 'article') {
    const key = `${parts[1] || ''}/${parts[2] || ''}`
    if (!parts[1] || !parts[2] || !indexes.articleSet.has(key)) {
      report('link-broken', where, `article target not found "${href}"`)
    }
    return
  }

  if (parts[0] === 'doc') {
    const key = `${parts[1] || ''}/${parts[2] || ''}`
    if (!parts[1] || !parts[2] || !indexes.docSet.has(key)) {
      report('link-broken', where, `doc target not found "${href}"`)
    }
    return
  }

  if (parts[0] === 'category') {
    const legacyCategory = { interview: 'methodology', skills: 'workflow', domain: 'architecture' }[parts[1]]
    if (!parts[1] || (!indexes.categorySet.has(parts[1]) && !legacyCategory)) {
      report('link-broken', where, `category target not found "${href}"`)
    }
  }
}

function scanLinks(indexes) {
  const files = [
    path.join(root, 'site', 'app.js'),
    path.join(root, 'site', 'sections-ui.js'),
    path.join(root, 'site', 'knowledge-views.js'),
    path.join(root, 'site', 'industry-cognition.js'),
    path.join(root, 'site', 'index.html'),
  ]
  for (const file of files) {
    if (!fs.existsSync(file)) continue
    for (const link of extractStaticLinks(file)) {
      validateLink(link.href, file, link.line, indexes)
    }
  }
}

function main() {
  const files = SCAN_DIRS.flatMap((dir) => walk(path.join(root, dir)))
  for (const file of files) scanTextFile(file)

  const categories = loadCategories()
  const indexes = buildKnowledgeIndexes(categories)
  scanArticleData(categories)
  scanLinks(indexes)

  if (issueCount > 0) {
    console.error(`\nPre-release check failed: ${issueCount} issue(s), ${warningCount} warning(s).`)
    process.exit(1)
  }
  console.log(`Pre-release check passed. ${warningCount} warning(s).`)
}

main()
