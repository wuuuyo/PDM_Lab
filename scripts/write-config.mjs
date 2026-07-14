/**
 * 用环境变量生成 site/config.js（Cloudflare Pages / CI 用）
 * 本地若已有手写 config.js 且未设环境变量，则跳过。
 *
 * 环境变量：
 *   PDM_SUPABASE_URL
 *   PDM_SUPABASE_ANON_KEY
 *   PDM_ADMIN_EMAILS  （可选，逗号分隔）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outFile = path.join(root, 'site/config.js')

const url = normalizeSupabaseUrl(process.env.PDM_SUPABASE_URL || '')
const anonKey = (process.env.PDM_SUPABASE_ANON_KEY || '').trim()
const emailsRaw = (process.env.PDM_ADMIN_EMAILS || '').trim()

function normalizeSupabaseUrl(raw) {
  let u = String(raw || '').trim()
  if (!u) return ''
  u = u.replace(/\/+$/, '')
  u = u.replace(/\/(rest|auth|storage|functions)\/v1$/i, '')
  return u
}

if (!url || !anonKey) {
  console.log('未设置 PDM_SUPABASE_URL / PDM_SUPABASE_ANON_KEY，保留现有 site/config.js')
  process.exit(0)
}

const adminEmails = emailsRaw
  ? emailsRaw.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
  : []

const content = `// 由 scripts/write-config.mjs 根据环境变量生成，请勿手改线上文件
window.PDM_CONFIG = {
  supabaseUrl: ${JSON.stringify(url)},
  supabaseAnonKey: ${JSON.stringify(anonKey)},
  adminEmails: ${JSON.stringify(adminEmails)},
}
`

fs.writeFileSync(outFile, content, 'utf8')
console.log(`已写入 site/config.js（adminEmails: ${adminEmails.length}）`)
