---
name: pm-bagu
description: >-
  产品经理八股知识库：核心模型、需求分析、用户研究、文档体系、项目管理、冒烟测试等。
  用于回答 PM 面试题、解释产品术语、撰写「解释+案例+PM应用」式内容，
  或将知识点同步到 PDM Learn 的 src/data/knowledge.ts。
  在用户提到产品经理八股、面试八股、AARRR、KANO、MVP、PMF、SLA、BRD/MRD/PRD、冒烟测试、UAT 时使用。
---

# 产品经理八股

## 知识来源

完整内容见 [reference.md](reference.md)。回答或写内容前**先读 reference**，优先引用其中的定义、案例与口诀，勿编造。

分类：**一、产品与设计（PM 核心方法论）**。持续积累中——每个知识点按 **「解释 + 案例 + PM 应用」** 三段式沉淀。

## 使用场景

| 场景 | 做法 |
|------|------|
| 解释概念 / 面试答题 | 从 reference 提取对应章节，按三段式组织回答 |
| 对比术语（如冒烟 vs UAT） | 用 reference 中的对比表与边界说明 |
| 补充新知识点 | 先更新 reference.md，再视需要写入知识库 |
| 同步到网站 | 见下方「写入 PDM Learn」 |

## 回答格式（默认）

```markdown
**解释**：（一句话定义 + 展开）

**案例**：（来自 reference 的真实案例，无则写通用场景）

**PM 应用**：（面试/工作中怎么用）
```

冒烟测试、文档体系等多步骤内容，可保留 checklist / 流程图 / 对比表。

## 写入 PDM Learn

内置知识库数据源：`src/data/knowledge.ts`。同步后运行 `npm run sync`（或 `node scripts/sync-knowledge.mjs`）。

### 分类映射

| reference 章节 | knowledge.ts 分类 id |
|----------------|----------------------|
| 1 核心模型、2 需求分析、3 用户研究 | `methodology` |
| 4 产品设计、5 数据分析、6 文档体系 | `skills` |
| 7 项目管理、8 沟通协作 | `skills` |
| 9 测试与质量保障 | `interview` 或 `skills`（偏面试黑话放 `interview`） |

### 单条知识点结构

```typescript
{
  id: 'english-kebab-case',      // 全局唯一
  title: 'AARRR（海盗模型）',
  summary: '获客→激活→留存→变现→推荐的增长漏斗',
  tags: ['增长', '八股'],
  content: [
    '解释：...',
    '案例：...',
    'PM 应用：...',
  ],
}
```

### 同步检查清单

- [ ] `id` 不与现有条目重复
- [ ] `content` 保留三段式，案例来自 reference
- [ ] 已运行 `npm run sync`
- [ ] 新增长内容同步回 `reference.md`（reference 为 skill 权威来源）

## 与网站融合

1. **推荐（生产）**：管理员登录 → `#/admin/knowledge` 在网页直接编辑、新增、勾选「发布到全站」
2. **可选（开发）**：更新 `reference.md` 后运行 `npm run build:skills`，在后台点「导入内置 Skill」同步到数据库
3. 已发布内容存入 Supabase `shared_knowledge`（`published=true`），所有用户可见

## 维护

- **新增八股**：写入 reference.md 对应章节 → 可选写入 knowledge.ts → `npm run sync`
- **待补充词条**：见 reference 文末「待补充」与「相关词条（待补）」
- 用户说「每次学习新知识后补充」时，更新 reference.md 并标注日期
