/**
 * 知识库分类骨架 — 条目主要由 knowledge/product-knowledge-public 经
 * scripts/import-knowledge-base.mjs → knowledge-from-md.json 导入，再由 sync-knowledge.mjs 合并。
 *
 * 分类对齐 README 主题（每日学习不在知识库，见我的空间 `#/daily-learn`）：
 * methodology | architecture | business | security | workflow | reference
 *
 * 同步：npm run sync:all
 */

export interface KnowledgeItem {
  id: string
  title: string
  summary: string
  content: string[]
  tags: string[]
  cases?: string[]
  pmApplication?: string[]
}

export interface Category {
  id: string
  title: string
  description: string
  icon: string
  items: KnowledgeItem[]
}

export const categories: Category[] = [
  {
    id: 'methodology',
    title: 'PM方法论',
    description: '产品策划方法论与核心八股速查',
    icon: '◈',
    items: [],
  },
  {
    id: 'architecture',
    title: '技术架构',
    description: '系统架构与技术/行业术语（含机器人）',
    icon: '⬡',
    items: [],
  },
  {
    id: 'business',
    title: '业务管理',
    description: 'ERP / CRM / SCM / OA / IPD 等业务系统认知',
    icon: '▣',
    items: [],
  },
  {
    id: 'security',
    title: '权限安全',
    description: 'SSO、RBAC、账号映射与安全边界',
    icon: '◇',
    items: [],
  },
  {
    id: 'workflow',
    title: '工作流程',
    description: '需求处理、PRD 与上线复盘流程',
    icon: '↻',
    items: [],
  },
  {
    id: 'reference',
    title: '快速参考',
    description: '关键词速查、知识图谱与学习路径',
    icon: '◎',
    items: [],
  },
]
