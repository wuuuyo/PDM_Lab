/**
 * 产品经理工具库 — 按类型分类，附学习链接
 */
;(function () {
  const categories = [
    {
      id: 'prototype',
      tabLabel: '原型',
      title: '原型与交互',
      description: '把想法可视化，让团队对齐「长什么样」',
      icon: '◇',
      tools: [
        { name: 'Figma', desc: '业界主流 UI/原型协作工具，免费版够用', url: 'https://www.figma.com', learn: 'https://www.figma.com/community/learn', networkHint: true },
        { name: '墨刀', desc: '国内常用，上手快，适合低保真到高保真', url: 'https://modao.cc', learn: 'https://modao.cc/feature/prototype.html' },
        { name: 'Axure RP', desc: '复杂交互与动态原型，传统企业用得较多', url: 'https://www.axure.com', learn: 'https://www.axure.com/support' },
        { name: '即时设计', desc: '国产 Figma 替代，中文生态好', url: 'https://js.design', learn: 'https://js.design/learn' },
      ],
    },
    {
      id: 'doc',
      tabLabel: '文档',
      title: '文档与协作',
      description: 'PRD、会议纪要、团队知识沉淀',
      icon: '▤',
      tools: [
        { name: '飞书文档', desc: '国内团队协作首选，文档+多维表+会议一体', url: 'https://www.feishu.cn/product/docs', learn: 'https://www.feishu.cn/hc/zh-CN' },
        { name: 'Notion', desc: '灵活的知识库与项目管理，适合个人与小团队', url: 'https://www.notion.so', learn: 'https://www.notion.so/help', networkHint: true },
        { name: '语雀', desc: '阿里系知识库，结构清晰，适合团队文档', url: 'https://www.yuque.com', learn: 'https://www.yuque.com/help' },
        { name: 'Confluence', desc: '海外企业常用 Wiki，与 Jira 配套', url: 'https://www.atlassian.com/software/confluence', learn: 'https://www.atlassian.com/software/confluence/guides', networkHint: true },
      ],
    },
    {
      id: 'data',
      tabLabel: '数据',
      title: '数据分析',
      description: '看数、埋点、增长与行为分析',
      icon: '◆',
      tools: [
        { name: 'Google Analytics', desc: '网站/应用流量分析国际标准', url: 'https://analytics.google.com', learn: 'https://support.google.com/analytics', networkHint: true },
        { name: '神策数据', desc: '国内行为分析平台，埋点与漏斗成熟', url: 'https://www.sensorsdata.cn', learn: 'https://manual.sensorsdata.cn' },
        { name: 'GrowingIO', desc: '无埋点+有埋点，增长分析', url: 'https://www.growingio.com', learn: 'https://docs.growingio.com' },
        { name: 'Excel / Google 表格', desc: '基础数据处理必备，透视表与图表', url: 'https://sheets.google.com', learn: 'https://support.google.com/docs/topic/9054603', networkHint: true },
      ],
    },
    {
      id: 'project',
      tabLabel: '项目',
      title: '项目管理',
      description: '需求排期、迭代跟踪、缺陷管理',
      icon: '▣',
      tools: [
        { name: 'Jira', desc: '海外研发管理标准，Scrum/Kanban', url: 'https://www.atlassian.com/software/jira', learn: 'https://www.atlassian.com/software/jira/guides', networkHint: true },
        { name: '禅道', desc: '国产项目管理，适合中小研发团队', url: 'https://www.zentao.net', learn: 'https://www.zentao.net/book' },
        { name: 'Teambition', desc: '阿里系项目协作，任务看板简洁', url: 'https://www.teambition.com', learn: 'https://help.teambition.com' },
        { name: '飞书项目', desc: '与飞书生态打通的研发管理', url: 'https://www.feishu.cn/product/devops', learn: 'https://www.feishu.cn/hc/zh-CN' },
      ],
    },
    {
      id: 'research',
      tabLabel: '用户',
      title: '用户研究',
      description: '问卷、访谈、可用性测试',
      icon: '○',
      tools: [
        { name: '问卷星', desc: '国内问卷调查最普及', url: 'https://www.wjx.cn', learn: 'https://www.wjx.cn/help/help.aspx' },
        { name: '腾讯问卷', desc: '免费好用，与微信生态结合', url: 'https://wj.qq.com', learn: 'https://wj.qq.com/help.html' },
        { name: 'UserTesting', desc: '海外远程可用性测试平台', url: 'https://www.usertesting.com', learn: 'https://www.usertesting.com/resources', networkHint: true },
        { name: '飞书妙记', desc: '访谈录音转文字，方便整理纪要', url: 'https://www.feishu.cn/product/minutes', learn: 'https://www.feishu.cn/hc/zh-CN' },
      ],
    },
    {
      id: 'diagram',
      tabLabel: '流程',
      title: '流程与思维导图',
      description: '业务流程、架构图、脑图梳理',
      icon: '◎',
      tools: [
        { name: 'ProcessOn', desc: '在线流程图、思维导图，国内常用', url: 'https://www.processon.com', learn: 'https://www.processon.com/support' },
        { name: 'draw.io', desc: '免费开源图表工具（现 diagrams.net）', url: 'https://www.diagrams.net', learn: 'https://www.diagrams.net/doc/', networkHint: true },
        { name: 'XMind', desc: '思维导图经典工具，适合拆解问题', url: 'https://xmind.cn', learn: 'https://xmind.cn/user-guide/' },
        { name: 'Whimsical', desc: '流程图+线框图，风格简洁', url: 'https://whimsical.com', learn: 'https://docs.whimsical.com', networkHint: true },
      ],
    },
    {
      id: 'ai',
      tabLabel: 'AI',
      title: 'AI 辅助',
      description: '提效写作、分析、原型与代码理解',
      icon: '✦',
      tools: [
        { name: 'ChatGPT', desc: '通用对话与写作辅助，适合头脑风暴', url: 'https://chat.openai.com', learn: 'https://help.openai.com', networkHint: true },
        { name: 'Cursor', desc: 'AI 编程与产品原型探索（本站在用）', url: 'https://cursor.com', learn: 'https://docs.cursor.com', networkHint: true },
        { name: 'Kimi / 通义', desc: '国内长文档阅读与总结', url: 'https://kimi.moonshot.cn', learn: 'https://kimi.moonshot.cn' },
        { name: 'Midjourney', desc: 'AI 出图，适合概念视觉探索', url: 'https://www.midjourney.com', learn: 'https://docs.midjourney.com', networkHint: true },
      ],
    },
    {
      id: 'presentation',
      tabLabel: '演示',
      title: '演示与汇报',
      description: '评审汇报、路演、方案展示',
      icon: '★',
      tools: [
        { name: 'PowerPoint / Keynote', desc: '经典汇报工具，评审必备', url: 'https://www.microsoft.com/microsoft-365/powerpoint', learn: 'https://support.microsoft.com/powerpoint' },
        { name: 'Canva', desc: '在线设计，模板多，适合快速出图', url: 'https://www.canva.cn', learn: 'https://www.canva.cn/help/' },
        { name: 'Gamma', desc: 'AI 生成演示文稿', url: 'https://gamma.app', learn: 'https://help.gamma.app', networkHint: true },
        { name: '飞书幻灯片', desc: '与文档协作一体，在线演示', url: 'https://www.feishu.cn/product/slides', learn: 'https://www.feishu.cn/hc/zh-CN' },
      ],
    },
  ]

  function getCategories() {
    return categories
  }

  function getCategory(id) {
    return categories.find((c) => c.id === id)
  }

  function getAllTools() {
    return categories.flatMap((c) => c.tools.map((t) => ({ ...t, categoryId: c.id, categoryTitle: c.title })))
  }

  function searchTools(query) {
    const q = String(query || '').toLowerCase().trim()
    if (!q) return getAllTools()
    return getAllTools().filter((t) => {
      const name = String(t.name || '').toLowerCase()
      const desc = String(t.desc || '').toLowerCase()
      const cat = String(t.categoryTitle || '').toLowerCase()
      // 优先名称；短词不匹配分类/描述，避免「随便输入」扫到整库
      if (name.includes(q)) return true
      if (q.length < 2) return false
      return desc.includes(q) || cat.includes(q)
    })
  }

  window.PDMTools = { getCategories, getCategory, getAllTools, searchTools }
})()
