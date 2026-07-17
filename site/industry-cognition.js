/**
 * 行业认知 — 解决「产品经理到底是干嘛的」
 */
;(function () {
  const sections = [
    {
      id: 'basics',
      title: '基础认知专区',
      description: '先建立对产品经理岗位的整体认知，再谈方法论与技能',
      icon: '◉',
      items: [
        {
          id: 'what-is-pm',
          title: '产品经理到底是干什么的？',
          summary: '连接用户、商业与技术，对「做成什么、为什么做」负责',
          tags: ['入门', '认知'],
          content: [
            '一句话：产品经理（PM）对用户价值、商业目标和可落地的产品方案负责，推动团队把正确的事做出来。',
            '核心职责：发现真实问题 → 定义要解决什么 → 设计解决方案 → 协调研发/设计/运营落地 → 用数据验证效果并迭代。',
            'PM 不是「写文档的人」，也不是「传话的人」，而是问题的 owner：对结果负责，而不只是对交付物负责。',
            '日常常见工作：用户访谈、竞品分析、画原型、写 PRD、需求评审、跟进开发测试、看数据、做复盘。',
            '新人建议：先搞懂「用户问题」和「业务目标」，再学工具和方法论；能讲清楚「为什么做这个功能」比会画漂亮原型更重要。',
          ],
        },
        {
          id: 'pm-vs-other',
          title: '产品经理 / 产品运营 / 项目经理 / UI / 前端：核心区别',
          summary: '五个岗位都在「做产品」，但关注点与交付物完全不同',
          tags: ['岗位', '区分'],
          content: [
            '产品经理（PM）：定义「做什么、为什么做、做成什么样」——对需求与方案负责，输出 PRD、原型、优先级。',
            '产品运营：定义「怎么让用户来、留下来、用起来」——对增长、活跃、留存负责，输出活动方案、运营策略、数据复盘。',
            '项目经理（PjM）：定义「谁、何时、按什么节奏交付」——对进度、资源、风险负责，输出排期、里程碑、跨团队协调。',
            'UI 设计师：定义「长什么样、好不好用」——对视觉、交互、体验负责，输出高保真稿、设计规范、走查。',
            '前端开发：定义「怎么在浏览器/App 里实现」——对页面实现、性能、交互落地负责，输出可运行代码。',
            '协作关系：PM 提需求和验收标准，UI 出稿，前端实现，PjM 保交付节奏，运营在上线后拉增长。新人常混淆 PM 与运营：PM 更偏「产品能力建设」，运营更偏「用户与业务指标增长」。',
          ],
        },
        {
          id: 'pm-daily',
          title: '产品经理的一天（真实工作场景）',
          summary: '会议、文档、沟通、决策——没有固定模板，但有规律可循',
          tags: ['日常', '入门'],
          content: [
            '上午：看数据/用户反馈 → 站会同步进度 → 处理研发/设计的阻塞问题。',
            '中午前后：写或改 PRD、画流程/原型、准备评审材料。',
            '下午：需求评审、方案讨论、和运营/业务对齐目标，或做用户访谈。',
            '傍晚：更新需求状态、记录决策、规划明天优先级。',
            '真相：大量时间在沟通和对齐，「想清楚」比「写得多」更重要。新人容易陷入只写文档不验证假设，要刻意留出用户接触时间。',
          ],
        },
      ],
    },
    {
      id: 'sub-roles',
      title: '细分岗位拆解',
      description: 'ToC、ToB、硬件、AI……新人适合从哪类切入？',
      icon: '◎',
      items: [
        {
          id: 'toc-product',
          title: 'ToC 产品（面向消费者）',
          summary: '用户量大、体验敏感、增长与留存是核心',
          tags: ['ToC', '方向'],
          content: [
            '特点：用户即大众，重视体验、增长、留存、商业化（广告/会员/电商等）。',
            '能力侧重：用户洞察、数据分析、增长策略、快速迭代、A/B 测试。',
            '典型产品：社交、内容、电商、工具类 App。',
            '新人适合度：★★★★☆ — 岗位多、案例好理解，但竞争激烈，需要强用户感与数据感。',
          ],
        },
        {
          id: 'tob-product',
          title: 'ToB 产品（面向企业）',
          summary: '决策链长、重流程与交付，客单价高',
          tags: ['ToB', '方向'],
          content: [
            '特点：客户是企业，重视效率、合规、集成、销售与交付，迭代周期往往更长。',
            '能力侧重：业务理解、流程梳理、需求管理、跨部门协调、客户沟通。',
            '典型产品：SaaS、ERP、CRM、协同办公、行业解决方案。',
            '新人适合度：★★★☆☆ — 逻辑与文档能力要求高，适合喜欢结构化思考的人；需耐心理解业务。',
          ],
        },
        {
          id: 'hardware-product',
          title: '硬件产品',
          summary: '软硬件一体，周期长、供应链与成本敏感',
          tags: ['硬件', '方向'],
          content: [
            '特点：涉及结构、电子、固件、供应链，版本迭代慢，试错成本高。',
            '能力侧重：跨学科协作、项目节奏、成本与规格权衡、质量与量产。',
            '典型产品：智能硬件、机器人、消费电子、IoT 设备。',
            '新人适合度：★★☆☆☆ — 入行门槛较高，通常需要相关行业背景或从助理岗切入。',
          ],
        },
        {
          id: 'ai-product',
          title: 'AI 产品',
          summary: '模型能力 + 产品场景，不确定性更高',
          tags: ['AI', '方向'],
          content: [
            '特点：依赖大模型/算法能力，需处理「不准、不稳、难评估」等问题，场景创新快。',
            '能力侧重：场景定义、Prompt/工作流设计、效果评估、伦理与合规、快速实验。',
            '典型产品：Copilot、智能客服、AI 写作/绘图、行业 AI 助手。',
            '新人适合度：★★★★☆ — 风口岗位多，但要求对 AI 能力边界有清醒认知；适合爱尝鲜、愿快速学习的人。',
          ],
        },
        {
          id: 'newcomer-pick',
          title: '新人怎么选方向？',
          summary: '先宽后窄：实习/项目经历 > 凭空选择',
          tags: ['职业规划', '入门'],
          content: [
            '优先策略：能接触真实用户和数据的方向 > 只看行业热度。',
            '文科/商科背景：ToC 内容/社交、ToB 协同类往往上手快。',
            '理工科背景：ToB、AI、硬件（若有工程常识）匹配度更高。',
            '无论选哪类，都要准备：一个能讲清楚的项目（校内/实习/个人）、基础方法论、结构化表达。',
            '本站的「知识库 + 工具库 + 论坛」就是帮你完成从认知 → 学习 → 交流 → 沉淀的闭环。',
          ],
        },
      ],
    },
    {
      id: 'learning-path',
      title: '学习路径规划',
      description: '按周拆解、可执行的任务清单，帮你从 0 到具备求职与上手能力',
      icon: '▤',
      items: [],
    },
  ]

  const learningPaths = [
    {
      id: 'kb-4stage',
      title: '学习主线',
      badge: '主线',
      duration: '6-8 周',
      weeklyHours: '每阶段 1-2 周',
      cardDesc: '入门 → 基础 → 进阶 → 实战，系统走完 PM 核心知识',
      summary: '按知识库体系推进：读什么、做什么、验什么，每阶段有明确输出。',
      layout: 'stages',
      outcomes: [
        '讲清 AARRR / MVP / RICE',
        '独立写出简单 PRD',
        '听懂常见技术方案',
        '跨部门 own 中型需求',
      ],
      phases: [
        {
          week: '阶段 1 · 1–2 周',
          title: '入门',
          goal: '建立产品词汇表，能口头讲清核心概念',
          visual: 'seed',
          tasks: [
            { text: '通读《产品经理八股》', link: { href: '#/doc/methodology/pm-bagu', label: '八股' } },
            { text: '每日学习 · 方法论短读', link: { href: '#/daily-learn', label: '每日' } },
          ],
          milestone: '能讲清 AARRR / MVP / RICE 是什么',
        },
        {
          week: '阶段 2 · 1–2 周',
          title: '基础',
          goal: '掌握从问题到方案的完整链路',
          visual: 'book',
          tasks: [
            { text: '读《产品策划方法论》六大体系', link: { href: '#/doc/methodology/product-methodology', label: '方法论' } },
            { text: '读《工作流程》需求 7 步', link: { href: '#/category/workflow', label: '流程' } },
          ],
          milestone: '独立写出一份简单 PRD',
        },
        {
          week: '阶段 3 · 1–2 周',
          title: '进阶',
          goal: '补齐技术与行业语境，沟通不被术语卡住',
          visual: 'layers',
          tasks: [
            { text: '读《系统架构》必会问题', link: { href: '#/doc/architecture/system-architecture', label: '架构' } },
            { text: '读《行业通用词语》', link: { href: '#/doc/architecture/industry-terms', label: '术语' } },
          ],
          milestone: '能听懂研发的技术方案要点',
        },
        {
          week: '阶段 4 · 1–2 周',
          title: '实战',
          goal: '把方法用到真实协作与需求推进',
          visual: 'rocket',
          tasks: [
            { text: '协作层：RACI / 跨部门原则落地', link: { href: '#/doc/methodology/product-methodology', label: '协作' } },
            { text: '挑 5 个方法论写进真实需求', link: { href: '#/daily-learn', label: '应用' } },
          ],
          milestone: '独立 own 一个中型需求（跨 3 个部门）',
        },
      ],
    },
    {
      id: 'newcomer-8w',
      title: '新人计划',
      badge: '计划',
      duration: '6-8 周',
      weeklyHours: '10-15 小时/周',
      cardDesc: '认知 → 作品 → 求职，零基础闭环',
      summary: '适合零基础、在校生与转行新人：从岗位认知到可展示作品。',
      outcomes: ['讲清 PM 职责与协作', '掌握基础方法论', '产出 PRD + 低保真原型', '具备初级面试应答'],
      phases: [
        {
          week: '第 1-2 周',
          title: '建立岗位认知',
          goal: '搞懂「产品经理到底是干嘛的」，不再迷茫',
          tasks: [
            { text: '阅读「产品经理到底是干什么的」「岗位核心区别」', link: { href: '#/industry/basics/what-is-pm', label: '开始阅读' } },
            { text: '阅读「产品经理的一天」，建立真实工作场景感', link: { href: '#/industry/basics/pm-daily', label: '查看' } },
            { text: '浏览细分方向（ToC/ToB/AI），初步判断自己倾向', link: { href: '#/industry/sub-roles/toc-product', label: '方向对比' } },
            { text: '在工具库熟悉 Figma、飞书文档，完成账号注册', link: { href: '#/tools', label: '工具库' } },
          ],
          milestone: '能用 3 分钟向朋友讲清楚：PM 做什么、和运营/项目的区别',
        },
        {
          week: '第 3-4 周',
          title: '夯实方法论基础',
          goal: '建立「从问题到方案」的思维框架',
          tasks: [
            { text: '学习用户研究：访谈技巧、用户画像、痛点清单', link: { href: '#/article/methodology/user-research', label: '用户研究' } },
            { text: '学习需求分析：真伪需求、KANO、RICE 优先级', link: { href: '#/article/methodology/requirement-analysis', label: '需求分析' } },
            { text: '学习 MVP 与迭代：Build-Measure-Learn', link: { href: '#/article/methodology/mvp', label: 'MVP' } },
            { text: '开启每日学习推送，养成固定学习习惯', link: { href: '#/daily-learn', label: '去设置' } },
            { text: '产出：选一个你常用的 App，写 500 字痛点分析', link: null },
          ],
          milestone: '能针对一个真实产品说出 3 个用户痛点及验证思路',
        },
        {
          week: '第 5 周',
          title: '修炼核心技能',
          goal: '把想法变成可评审的 PRD 与原型',
          tasks: [
            { text: '学习 PRD 结构与写作要点', link: { href: '#/article/skills/prd', label: 'PRD' } },
            { text: '学习原型设计：线框图 → 可点击 Demo', link: { href: '#/article/skills/prototype', label: '原型' } },
            { text: '学习 Roadmap 与版本规划', link: { href: '#/article/skills/roadmap', label: 'Roadmap' } },
            { text: '用 Figma/墨刀完成一个功能的低保真原型', link: { href: '#/tools/prototype', label: '原型工具' } },
            { text: '产出：针对上周痛点，写一份 2-3 页 PRD + 原型', link: null },
          ],
          milestone: '有一份可展示的 PRD + 原型作品（校内项目/个人练习均可）',
        },
        {
          week: '第 6 周',
          title: '拓展行业视野',
          goal: '从「做功能」升级到「懂业务」',
          tasks: [
            { text: '学习 B 端 vs C 端产品差异', link: { href: '#/article/domain/b-vs-c', label: 'B/C 差异' } },
            { text: '了解商业模式画布与常见变现方式', link: { href: '#/article/domain/business-model', label: '商业模式' } },
            { text: '学习核心指标设计（北极星、漏斗）', link: { href: '#/article/skills/metrics-design', label: '指标设计' } },
            { text: '若倾向 AI 方向，阅读 AI 产品专题', link: { href: '#/article/domain/ai-product', label: 'AI 产品' } },
            { text: '收藏重要文章到「我的收藏」，建立复习清单', link: { href: '#/favorites', label: '收藏' } },
          ],
          milestone: '能分析一个产品的商业模式与核心增长指标',
        },
        {
          week: '第 7 周',
          title: '求职冲刺准备',
          goal: '把知识转化为面试可用的表达',
          tasks: [
            { text: '掌握 STAR 法则，准备 3 个行为面试故事', link: { href: '#/article/interview/star', label: 'STAR' } },
            { text: '练习竞品分析框架与表达', link: { href: '#/article/interview/competitor-analysis', label: '竞品分析' } },
            { text: '了解估算题（DAU/市场规模）思路', link: { href: '#/article/interview/estimate-dau', label: '估算题' } },
            { text: '准备「介绍一个你喜欢的产品」类问题', link: { href: '#/article/interview/favorite-product', label: '参考' } },
            { text: '在论坛发帖，请他人帮忙 mock 面试或点评项目', link: { href: '#/forum', label: '论坛' } },
          ],
          milestone: '能流畅完成 30 分钟模拟面试（自我介绍 + 项目 + 开放题）',
        },
        {
          week: '第 8 周',
          title: '沉淀与持续迭代',
          goal: '把学习成果固化，形成长期成长机制',
          tasks: [
            { text: '整理项目故事：背景 → 你的角色 → 行动 → 结果（量化）', link: null },
            { text: '写一份结构化复盘，记录 8 周收获与不足', link: { href: '#/reviews', label: '复盘记录' } },
            { text: '将个人笔记迁入「我的知识库」，按主题分组', link: { href: '#/my-knowledge', label: '知识库' } },
            { text: '制定下一阶段计划：实习投递 / 深度方向 / 作品集优化', link: { href: '#/industry/learning-path/intern', label: '实习路径' } },
          ],
          milestone: '有一份完整作品集（痛点分析 + PRD + 原型 + 项目故事）',
        },
      ],
    },
    {
      id: 'job-hunt',
      title: '求职计划',
      badge: '计划',
      duration: '2-3 周',
      weeklyHours: '15-20 小时/周',
      cardDesc: '面试框架 + STAR + 开放题',
      summary: '已有基础、临近面试：快速强化表达与答题结构。',
      outcomes: ['八股答题有框架', '2–3 个 STAR 脱口而出', '竞品/估算有结构'],
      phases: [
        {
          week: '第 1 周',
          title: '面试框架搭建',
          goal: '建立答题结构，避免临场慌乱',
          tasks: [
            { text: '通读面试八股分类，标记薄弱项', link: { href: '#/category/interview', label: '面试八股' } },
            { text: '精读 STAR、竞品分析、估算题三篇', link: { href: '#/article/interview/star', label: 'STAR' } },
            { text: '整理 2 个项目故事（学校/实习/个人均可）', link: null },
            { text: '每天复述一个故事，录音自查逻辑', link: null },
          ],
          milestone: '3 个 STAR 故事各能在 2 分钟内讲完',
        },
        {
          week: '第 2 周',
          title: '开放题与行业题',
          goal: '覆盖高频开放题与行业认知题',
          tasks: [
            { text: '练习「为什么想做 PM」「你的优势是什么」', link: { href: '#/article/interview/why-pm', label: '参考' } },
            { text: '准备「介绍一个喜欢的产品」', link: { href: '#/article/interview/favorite-product', label: '参考' } },
            { text: '复习 B/C 端、商业模式、增长相关文章', link: { href: '#/category/domain', label: '行业视野' } },
            { text: '论坛发帖求 mock 面试或组队练习', link: { href: '#/forum/new', label: '发帖' } },
          ],
          milestone: '能独立完成一次 45 分钟模拟面试',
        },
        {
          week: '第 3 周',
          title: '查漏补缺',
          goal: '针对薄弱项强化，调整投递策略',
          tasks: [
            { text: '复盘模拟面试反馈，优化项目故事', link: { href: '#/reviews', label: '写复盘' } },
            { text: '补充技能短板（PRD/数据/原型任一项）', link: { href: '#/category/skills', label: '核心技能' } },
            { text: '收藏高频题，考前快速复习', link: { href: '#/favorites', label: '收藏' } },
          ],
          milestone: '简历 + 作品集 + 面试故事三者一致、可互相印证',
        },
      ],
    },
    {
      id: 'intern',
      title: '实习计划',
      badge: '计划',
      duration: '4-6 周',
      weeklyHours: '8-12 小时/周',
      cardDesc: '作品优先，冲第一份产品实习',
      summary: '在校生争取实习：重可讲述的作品与简历表达。',
      outcomes: ['完成 1 个可展示作品', '简历有产品相关描述', '理解实习中 PM 工作'],
      phases: [
        {
          week: '第 1 周',
          title: '认知 + 方向',
          goal: '确定实习目标行业与岗位类型',
          tasks: [
            { text: '完成行业认知基础阅读', link: { href: '#/industry/basics/what-is-pm', label: '基础认知' } },
            { text: '选定 ToC 或 ToB 主攻方向', link: { href: '#/industry/sub-roles/newcomer-pick', label: '选方向' } },
            { text: '分析 3 个目标公司的产品与用户', link: null },
          ],
          milestone: '明确想投的公司类型与 1 个目标岗位 JD 关键词',
        },
        {
          week: '第 2-3 周',
          title: '作品打磨',
          goal: '做出能写进简历的作品',
          tasks: [
            { text: '选一个校园场景或细分需求做 mini 项目', link: null },
            { text: '完成用户调研（至少 5 人访谈或问卷）', link: { href: '#/article/methodology/user-research', label: '用户研究' } },
            { text: '输出 PRD + 原型', link: { href: '#/article/skills/prd', label: 'PRD' } },
          ],
          milestone: '作品可公开分享（Notion/语雀链接或 PDF）',
        },
        {
          week: '第 4-5 周',
          title: '简历与投递',
          goal: '把作品转化为简历亮点',
          tasks: [
            { text: '用 STAR 改写项目经历（即使无正式实习）', link: { href: '#/article/interview/star', label: 'STAR' } },
            { text: '准备实习常见面试题', link: { href: '#/category/interview', label: '面试题' } },
            { text: '论坛交流实习经验与内推信息', link: { href: '#/forum', label: '论坛' } },
          ],
          milestone: '简历上有一条完整的产品项目描述',
        },
        {
          week: '第 6 周',
          title: '面试与复盘',
          goal: '从每次面试中迭代',
          tasks: [
            { text: '每次面试后 24 小时内写复盘', link: { href: '#/reviews', label: '复盘' } },
            { text: '根据反馈优化作品与故事', link: null },
          ],
          milestone: '至少完成 3 次面试或模拟面试',
        },
      ],
    },
    {
      id: 'career-switch',
      title: '转行计划',
      badge: '计划',
      duration: '8-12 周',
      weeklyHours: '12-18 小时/周',
      cardDesc: '经验迁移 + 方法论补课 + 叙事',
      summary: '从运营/设计/开发等转向产品：翻译旧经验、补齐短板。',
      outcomes: ['过往经验译为产品能力', '补齐方法论短板', '转行叙事清晰'],
      phases: [
        {
          week: '第 1-2 周',
          title: '认知对齐 + 经验盘点',
          goal: '弄清 PM 与当前岗位的差异，挖掘可迁移能力',
          tasks: [
            { text: '阅读岗位区别，明确转行动机与预期', link: { href: '#/industry/basics/pm-vs-other', label: '岗位区别' } },
            { text: '列出过往工作中「像 PM」的经历（需求、协调、数据）', link: null },
            { text: '选定转行方向（ToC/ToB/AI）', link: { href: '#/industry/sub-roles/newcomer-pick', label: '选方向' } },
          ],
          milestone: '能解释「为什么转行」且与过往经历逻辑自洽',
        },
        {
          week: '第 3-5 周',
          title: '方法论补课',
          goal: '系统补产品方法论，避免只依赖旧岗位经验',
          tasks: [
            { text: '按顺序学习方法论分类核心文章', link: { href: '#/category/methodology', label: '方法论' } },
            { text: '学习 PRD 与需求评审流程', link: { href: '#/article/skills/prd', label: 'PRD' } },
            { text: '用当前公司业务做一份「如果我是 PM」练习', link: null },
          ],
          milestone: '有一份结合旧领域经验的 PRD 练习作',
        },
        {
          week: '第 6-8 周',
          title: '作品 + 叙事',
          goal: '打造转行作品集与面试故事',
          tasks: [
            { text: '将旧经验改写成 STAR 产品故事', link: { href: '#/article/interview/star', label: 'STAR' } },
            { text: '完成一个独立 side project 或深度行业分析', link: null },
            { text: '论坛寻找转行成功者的经验', link: { href: '#/forum', label: '论坛' } },
          ],
          milestone: '面试中能回答「你的产品经验从哪里来」',
        },
        {
          week: '第 9-12 周',
          title: '求职与过渡',
          goal: '投递、面试、争取平迁或初级岗',
          tasks: [
            { text: '冲刺面试八股与开放题', link: { href: '#/category/interview', label: '面试' } },
            { text: '考虑内部转岗或产品助理岗作为跳板', link: null },
            { text: '持续复盘并更新知识库', link: { href: '#/my-knowledge', label: '知识库' } },
          ],
          milestone: '获得产品相关 offer 或明确的内部转岗路径',
        },
      ],
    },
  ]

  function getLearningPaths() {
    return learningPaths
  }

  function getLearningPath(id) {
    return learningPaths.find((p) => p.id === id)
  }

  function getRecommendedPath() {
    return getLearningPath('kb-4stage') || learningPaths[0]
  }

  function getKbPathStages() {
    const path = getLearningPath('kb-4stage')
    if (!path) return []
    return path.phases.map((ph, i) => ({
      stage: `阶段 ${i + 1}`,
      title: ph.title,
      outcome: ph.milestone,
      tasks: (ph.tasks || []).map((t) => ({
        text: t.text,
        href: t.link?.href || null,
      })),
    }))
  }

  function getSections() {
    return sections
  }

  function getSection(id) {
    return sections.find((s) => s.id === id)
  }

  function getItem(sectionId, itemId) {
    const sec = getSection(sectionId)
    return sec?.items.find((i) => i.id === itemId)
  }

  function searchAll(query) {
    const q = String(query || '').toLowerCase().trim()
    if (!q) return []
    const results = []
    for (const sec of sections) {
      for (const item of sec.items) {
        const title = String(item.title || '').toLowerCase()
        const summary = String(item.summary || '').toLowerCase()
        const tags = (item.tags || []).join(' ').toLowerCase()
        // 短词只匹配标题/摘要/标签；较长词才扫正文，减少误命中
        let hit = title.includes(q) || summary.includes(q) || tags.includes(q)
        if (!hit && q.length >= 2) {
          const body = (item.content || []).join(' ').toLowerCase()
          hit = body.includes(q)
        }
        if (hit) results.push({ section: sec, item })
      }
    }
    return results
  }

  window.PDMIndustry = {
    getSections,
    getSection,
    getItem,
    searchAll,
    getLearningPaths,
    getLearningPath,
    getRecommendedPath,
    getKbPathStages,
  }
})()
