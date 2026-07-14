---
name: industry-terms
description: >-
  行业通用词语知识库：技术架构（IaaS/PaaS/SaaS/HaaS、多租户、SPU/SKU）、
  业务管理（ERP/CRM/SCM/OA/IPD）、机器人行业（AMR/SLAM/ROS/OTA）、
  权限与安全（SSO/RBAC/账号映射）。
  用于解释科技/PM 行业术语、对比概念、撰写「词语+全称+解释+案例」式内容，
  或将词条同步到 PDM Learn 的 src/data/knowledge.ts。
  在用户提到行业通用词语、IaaS、SaaS、ERP、多租户、SPU、SKU、SSO、RBAC、AMR 时使用。
---

# 行业通用词语

## 知识来源

完整内容见 [reference.md](reference.md)。回答或写内容前**先读 reference**，优先引用其中的定义、表格与口诀，勿编造。

分类：**二、技术架构 + 三、业务管理 + 四、权限与安全**。科技/产品经理常用的行业词语——按主题分类，持续积累中。

## 使用场景

| 场景 | 做法 |
|------|------|
| 解释行业词语 | 从 reference 提取对应词条，按四段式组织 |
| 对比概念（如 SPU vs SKU、IaaS vs SaaS） | 用 reference 中的对比表 |
| 补充新词语 | 先更新 reference.md 对应部分，再视需要写入知识库 |
| 同步到网站 | 见下方「写入 PDM Learn」 |

## 回答格式（默认）

```markdown
**词语**：（缩写或中文名）

**全称**：（英文全称 + 中文）

**解释**：（一句话定义 + 展开）

**案例**：（来自 reference 的案例，无则写通用场景）
```

表格类内容（云服务模式、SaaS 指标、ERP 模块等）可直接引用 reference 中的表格。

## 写入 PDM Learn

内置知识库数据源：`src/data/knowledge.ts`。同步后运行 `npm run sync`（或 `node scripts/sync-knowledge.mjs`）。

### 分类映射

| reference 部分 | knowledge.ts 分类 id |
|----------------|----------------------|
| 第一部分 技术架构 | `domain` |
| 第二部分 业务管理 | `domain` |
| 第三部分 机器人/配送 | `domain` |
| 第四部分 权限与安全 | `domain` 或 `skills`（偏产品设计放 `skills`） |

### 单条知识点结构

```typescript
{
  id: 'saas-metrics',
  title: 'SaaS 关键指标（ARR/MRR/NRR）',
  summary: '年度/月度经常性收入、流失率、客户生命周期价值等',
  tags: ['SaaS', '行业词语'],
  content: [
    '词语：ARR — Annual Recurring Revenue 年度经常性收入',
    '词语：MRR — Monthly Recurring Revenue 月度经常性收入',
    '解释：...',
    '案例：...',
  ],
}
```

大主题（如 ERP 8 大模块）可拆成一条总览 + 多条子词条，避免单条 `content` 过长。

### 同步检查清单

- [ ] `id` 不与现有条目重复
- [ ] 保留「词语 + 全称 + 解释 + 案例」结构
- [ ] 案例与口诀来自 reference，不臆造
- [ ] 已运行 `npm run sync`
- [ ] 新增长内容同步回 `reference.md`（reference 为 skill 权威来源）

## 与网站融合

1. **推荐（生产）**：管理员登录 → `#/admin/knowledge` 在网页直接编辑、新增、勾选「发布到全站」
2. **可选（开发）**：更新 `reference.md` 后运行 `npm run build:skills`，在后台点「导入内置 Skill」同步到数据库
3. 已发布内容存入 Supabase `shared_knowledge`（`published=true`），所有用户可见

## 与 pm-bagu 的关系

- **pm-bagu**：产品方法论、面试八股（需求、文档、冒烟测试等）
- **industry-terms**：技术架构、企业系统、行业黑话（IaaS/SaaS、ERP、SSO 等）

两者有交叉（如 SLA、多租户）时，以**当前问题语境**选择主 skill；SaaS/权限类优先 industry-terms，产品流程类优先 pm-bagu。

## 维护

- **新增词语**：写入 reference.md 对应章节 → 可选写入 knowledge.ts → `npm run sync`
- **待补充词条**：见 reference 文末「待补充」
- 用户说「每次学习新词语后补充」时，更新 reference.md 并标注日期
