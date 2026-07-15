// 此文件由 scripts/sync-knowledge.mjs 自动生成，请勿直接编辑
// 请修改 src/data/knowledge.ts 后运行: node scripts/sync-knowledge.mjs

const categories = [
  {
    "id": "methodology",
    "title": "PM方法论",
    "description": "产品策划方法论与核心八股速查",
    "icon": "◈",
    "items": [
      {
        "id": "kb-product-methodology-1-1-北极星指标补全项-1",
        "title": "北极星指标（North Star Metric）",
        "summary": "用一个\"最能反映产品核心价值\"的数字给整个团队\"指北\"。",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "用一个\"最能反映产品核心价值\"的数字给整个团队\"指北\"。",
          "好北极星的 3 个特征:",
          "1. 用户从产品获得核心价值时它会拉高 —— 反映\"用户真的从中获益\"",
          "2. 业务增长时它会拉高 —— 反映\"业务真在增长\",不是自嗨",
          "3. 团队任何人能解释\"我做的事怎么影响它\" —— 不是高管的 KPI,是一线员工也能用的\"指南针\"",
          "选错北极星的代价:KPI 全达成但产品失败。例:把\"DAU\"当北极星 → 团队为拉 DAU 做签到、弹窗、虚假活动,DAU 涨了但用户没获得价值,留存崩盘。",
          "【指标体系设计（北极星 → 一级指标 → 二级指标）】",
          "北极星指标(NSM):代理月活解决工单数\n    │\n    ├─ 一级指标:工单总量 / 工单解决率 / 代理活跃率\n    │\n    ├─ 二级指标:\n    │   ├─ 渠道效率(获客):新代理首月工单数 / 渠道来源占比\n    │   ├─ 激活(上手):首日完成工单比例 / AI 悬浮球首次使用率\n    │   ├─ 留存(留下):7 日活跃代理 / 30 日活跃代理 / 流失率\n    │   ├─ 变现(收入):订阅续费率 / 增值服务使用率\n    │   └─ 推荐(传播):代理推荐新代理数 / NPS 净推荐值\n    │\n    └─ 行动指标(PM 可直接干预):\n        ├─ AI 悬浮球首响时长\n        ├─ 工单页 P50 / P95 加载时长\n        └─ 关键功能使用率"
        ],
        "cases": [
          "代理商平台北极星候选对比\nDAU：容易被刷量拉高,不代表真有用\nGMV：涨了但代理可能不开心不续约\nAI 咨询次数：自娱自乐,没真解决问题\n代理月活解决工单数 ⭐：反映\"代理觉得平台有用\"——最贴近核心价值"
        ],
        "pmApplication": [
          "每个季度评审前,先问\"我做的这个需求,是拉高北极星、还是只让某个 KPI 好看?\"。只拉高 DAU 不拉高工单解决数的功能,要砍掉或重做。",
          "指标体系是\"对北极星的可分解\"——北极星是\"一句话目标\",指标体系是\"具体怎么衡量\",行动指标是\"我下周能改什么\"。"
        ],
        "section": "1. 战略与定位（决定\"做对的事\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-1-2-商业模式画布补全项-2",
        "title": "商业模式画布（BMC, Business Model Canvas）",
        "summary": "来源:daily-log 6/22",
        "tags": [
          "产品策划方法论",
          "BMC"
        ],
        "content": [
          "来源:daily-log 6/22",
          "把商业模式拆成 9 个格子,PM 拿到新方向时先画一遍,看\"商业逻辑能不能跑通\"。",
          "客户细分（CS）：我服务谁？",
          "价值主张（VP）：我为他们解决什么问题？",
          "渠道通路（CH）：我怎么触达他们？",
          "客户关系（CR）：我怎么和他们互动？",
          "收入流（R$）：他们为什么付钱？",
          "核心资源（KR）：我需要什么资源？",
          "关键活动（KA）：我必须做什么？",
          "重要伙伴（KP）：谁帮我一起做？",
          "成本结构（C$）：我要花什么钱？"
        ],
        "cases": [
          "代理商平台\"AI 悬浮球\"的 BMC\nCS：区域代理商（核心）、客服（次要）\nVP：5 秒发起售后咨询,跨系统不用切\nCH：代理商平台首页常驻入口 + 飞书推送\nCR：自助为主 + AI 转人工兜底\nR$：不直接变现,但提活跃度带动培训订阅\nKR：LLM API + 客服知识库 + 行为数据\nKA：对话设计 + 知识库更新 + 模型调优\nKP：企学宝(内容供应)、阿里云(算力)\nC$：API 调用费(月 5-10 万) + 维护人力(1 FTE)"
        ],
        "pmApplication": [
          "9 格填完如果发现\"价值主张\"清晰但\"收入流\"弱,要么补变现路径,要么承认\"作为留存工具推进、不能单独立项\"。"
        ],
        "section": "1. 战略与定位（决定\"做对的事\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-1-3-价值主张画布补全项-3",
        "title": "价值主张画布（VPC, Value Proposition Canvas）",
        "summary": "来源:daily-log 6/30",
        "tags": [
          "产品策划方法论",
          "VPC"
        ],
        "content": [
          "来源:daily-log 6/30",
          "把\"产品价值\"和\"用户需求\"对齐的双面图——左侧产品,右侧用户,两侧\"对上\"=真解决问题,\"对不上\"=做了没人要。",
          "┌──────────────────────────────┐  ┌──────────────────────────────┐\n│      产品侧 (Product)         │  │      用户侧 (Customer)        │\n├──────────────────────────────┤  ├──────────────────────────────┤\n│ 产品/服务 (Products & Services)│  │ 任务 (Jobs to be Done)        │\n│                                │  │                                │\n│ 痛点解药 (Pain Relievers)     │←→│ 痛点 (Pains)                  │\n│                                │  │                                │\n│ 收益创造 (Gain Creators)      │←→│ 收益 (Gains)                  │\n└──────────────────────────────┘  └──────────────────────────────┘"
        ],
        "cases": [
          "AI 悬浮球的 VPC\n任务:快速解决售后卡点：产品:AI 对话 + 知识库\n痛点:跨系统反复切换登录：解药:一句话描述问题,AI 自动派单\n收益:5 分钟搞定问题：创造:AI 给出 3 个备选方案\n→ 严丝合缝对得上,真解决了用户问题。"
        ],
        "pmApplication": [
          "PRD 评审前 10 分钟画一遍,3 个判断口诀:",
          "左侧有产品特性但找不到对应用户痛点 → 砍",
          "右侧有用户痛点但左侧找不到产品解药 → 补",
          "两侧对得上 → 这版就做这个"
        ],
        "section": "1. 战略与定位（决定\"做对的事\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-1-4-okr",
        "title": "OKR（Objectives & Key Results）",
        "summary": "来源:产品经理八股.md 1. 核心模型",
        "tags": [
          "产品策划方法论",
          "OKR"
        ],
        "content": [
          "来源:产品经理八股.md 1. 核心模型",
          "目标管理工具。\"目标 O\"是定性的、鼓舞人心的方向;\"关键结果 KR\"是 3-5 个可量化的指标,衡量 O 是否达成。",
          "OKR vs KPI:",
          "性质 · OKR=灵活、挑战性 · KPI=刚性、考核用",
          "完成度 · OKR=0.7 就算成功 · KPI=必须 100% 达成",
          "透明度 · OKR=全员可见 · KPI=通常不公开",
          "周期 · OKR=季度 · KPI=月/季度"
        ],
        "pmApplication": [
          "OKR 帮你\"知道自己做的事为什么重要\"——把每周做的需求挂到季度 KR 上,周报/复盘里能清晰展示\"我做的 AI 悬浮球对话效果,贡献了 KR1 30% 的提升\"。"
        ],
        "section": "1. 战略与定位（决定\"做对的事\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-2-1-用户画像",
        "title": "用户画像（User Persona）",
        "summary": "来源:产品经理八股.md 3. 用户研究",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:产品经理八股.md 3. 用户研究",
          "通过调研把目标用户抽象成典型的\"虚拟人物\",包含基本属性、行为特征、目标动机、痛点障碍。",
          "4 大要素:",
          "1. 基本属性:年龄/职业/地区/收入/教育",
          "2. 行为特征:使用频率/常用功能/触达渠道",
          "3. 目标动机:用产品要达成什么",
          "4. 痛点障碍:为什么没达成/什么阻止了他"
        ],
        "cases": [
          "代理商平台的\"区域代理小王\"画像\n基本：30 岁,大专,深圳,月入 1.5 万,管 30+ 客户\n行为：每天 50+ 工单,习惯用手机查进度\n目标：当月完成续约,客户不流失\n痛点：跨系统反复切换登录、查一个工单要点 5 次"
        ],
        "pmApplication": [
          "做功能时\"对齐小王用起来顺不顺\"——他看不懂/嫌麻烦的功能,90% 是失败功能。"
        ],
        "section": "2. 用户研究（决定\"对的人\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-2-2-同理心地图",
        "title": "同理心地图（Empathy Map）",
        "summary": "来源:daily-log 6/30",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:daily-log 6/30",
          "把用户\"看不见的内心\"画出来——6 个维度:说/想/做/感受/痛点/目标。",
          "说（Says）：\"这培训视频太长了根本看不完\"",
          "想（Thinks）：\"我能不能只看考点不学其他的\"",
          "做（Does）：跳过视频直接搜题库",
          "感受（Feels）：焦虑,怕考不过影响接单",
          "痛点（Pains）：没时间看完 1 小时培训",
          "目标（Gains）：快速通过考试、有资格接单"
        ],
        "pmApplication": [
          "基于这张图设计\"5 分钟考点速览\"功能,比\"AI 悬浮球加表情包\"这种自嗨功能靠谱 10 倍。",
          "3 个核心问题:用户嘴上在抱怨什么？心里真正担心什么？为了目标愿意做出什么妥协？"
        ],
        "section": "2. 用户研究（决定\"对的人\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-2-3-用户旅程地图",
        "title": "用户旅程地图（User Journey Map）",
        "summary": "来源:产品经理八股.md 4. 产品设计 / daily-log 6/26",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:产品经理八股.md 4. 产品设计 / daily-log 6/26",
          "把用户从\"第一次听说产品\"到\"成为忠实用户\"的整段路拆成阶段,标出目标/行为/触点/情绪曲线/痛点。",
          "5 段式标准结构:",
          "认知 → 考虑 → 首次使用 → 习惯 → 复购/推荐\n  ↑     ↑        ↑          ↑        ↑\n 触点  触点     触点       触点      触点\n 情绪  情绪     情绪       情绪      情绪\n 痛点  痛点     痛点       痛点      痛点"
        ],
        "cases": [
          "企学宝代理商用户旅程\n认知 · 触点=飞书推送上线公告 · 情绪=+1 · 痛点=没注意到\n考虑 · 触点=点进代理商平台看入口 · 情绪=0 · 痛点=入口埋太深\n首次使用 · 触点=扫码登录企学宝 · 情绪=+1 · 痛点=扫码失败\n学习 · 触点=看培训视频 · 情绪=-2 · 痛点=视频太长\n考试 · 触点=提交并查成绩 · 情绪=-1 · 痛点=反馈不够细\n习惯 · 触点=每月主动学 · 情绪=+2 · 痛点=通知太频繁"
        ],
        "pmApplication": [
          "情绪低谷段就是优化重点——\"学习\"段情绪 -2,优先加\"5 分钟考点速览\"和\"模拟考试\"功能。"
        ],
        "section": "2. 用户研究（决定\"对的人\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-2-4-可用性测试",
        "title": "可用性测试（Usability Testing）",
        "summary": "来源:daily-log 6/29",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:daily-log 6/29",
          "找 5-8 个真实用户、给 3-5 个具体任务、观察他们怎么操作、卡在哪、问什么。5 个用户就能发现 85% 的可用性问题(Nielsen Norman Group 经验法则)。",
          "3 种形式:",
          "Moderated(测试员边观察边追问):最有价值,适合上线前",
          "Unmoderated(后台录屏+点击流):省人力,但追问不了",
          "A/B 远程异步:大流量产品的灰度验证",
          "3 步流程:",
          "1. 写 3-5 个\"用户可能卡住\"的任务(如\"请找'你上个月看的培训视频'\")",
          "2. 找 3-5 个不是同事的真实用户(同事太熟会给好评)",
          "3. 看他们\"卡在哪、问什么、表情如何\",改完再上线"
        ],
        "cases": [
          "V17 升级功能上线前可用性测试\n\"请查看你这台机器人的固件版本\" · 原版通过率=2/5 卡 2 分钟 · 改版后=改名\"软件版本\",15 秒搞定\n\"请找到这次升级的内容说明\" · 原版通过率=1/5 找到 · 改版后=放首页 banner,5/5 找到\n\"请主动发起升级\" · 原版通过率=3/5 担心 · 改版后=加\"建议升级\"绿色徽章"
        ],
        "pmApplication": [
          "可用性测试找的是\"用户心智和你的设计不一致\"的地方,不是测\"功能对不对\"——后者是 QA 的事。"
        ],
        "section": "2. 用户研究（决定\"对的人\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-2-5-用户访谈",
        "title": "用户访谈（User Interview）",
        "summary": "一对一深度访谈,挖出用户\"为什么这样做\"。",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "一对一深度访谈,挖出用户\"为什么这样做\"。",
          "5 步结构:",
          "1. 暖场（5 分钟）:聊点轻松的,建立信任",
          "2. 行为回顾（10 分钟）:\"上次遇到 XX 问题,你做了什么？\"",
          "3. 痛点深挖（15 分钟）:\"那时候最难的是什么？\"",
          "4. 方案探索（10 分钟）:\"如果有办法,理想是什么样的？\"",
          "5. 总结确认（5 分钟）:\"我理解你刚才说的是...对吗？\"",
          "3 个不要:",
          "❌ 不要问\"你想要什么功能\" → 用户也不知道自己未来要什么",
          "❌ 不要引导性提问 → \"你是不是觉得 X 不好？\"会带偏",
          "❌ 不要在会议室做 → 让用户在自己真实工作环境里操作"
        ],
        "pmApplication": [
          "访谈前先列 10 个问题,但只背 3 个——剩下 7 个根据用户的回答即兴追问,才有价值。"
        ],
        "section": "2. 用户研究（决定\"对的人\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-3-1-需求评估-4-维度",
        "title": "需求评估 4 维度",
        "summary": "来源:产品经理八股.md 2. 需求分析",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:产品经理八股.md 2. 需求分析",
          "PM 拿到一个需求不能拍脑袋说\"做\"或\"不做\",要按 4 维度量化。",
          "商业价值：为业务带来什么？收入/成本/效率各占多少？",
          "用户价值：解决用户什么痛点？多少人/多高频/多痛？",
          "技术成本：研发要多少人力/时间/风险？",
          "ROI：综合下来值不值？"
        ],
        "cases": [
          "代理商平台 3 个需求评估\nAI 悬浮球支持语音输入 · 商业=中 · 用户=高 · 技术=中 · ROI=不错 · 决策=✅ 本 Sprint\n工单页加深色模式 · 商业=低 · 用户=中 · 技术=低 · ROI=一般 · 决策=⏸ Backlog\n重做整个权限体系 · 商业=看场景 · 用户=低 · 技术=极高 · ROI=差 · 决策=🔪 拆 3 个小需求"
        ],
        "section": "3. 需求管理（决定\"做哪些\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-3-2-rice-评分法",
        "title": "RICE 评分法（精细化需求排序）",
        "summary": "来源:daily-log 6/23",
        "tags": [
          "产品策划方法论",
          "RICE"
        ],
        "content": [
          "来源:daily-log 6/23",
          "用一个标准公式给每个需求打分排序。",
          "公式:RICE Score = (R × I × C) / E",
          "Reach 触达多少用户：数字（如 500）",
          "Impact 影响多大：1=微小 2=低 3=中 4=高 5=巨大",
          "Confidence 信心指数：0-100%",
          "Effort 投入工作量：人月"
        ],
        "cases": [
          "代理商平台 3 个候选需求\nAI 悬浮球支持语音输入 · R=500 · I=3 · C=80% · E=3 · Score=400\n工单页加深色模式 · R=200 · I=1 · C=50% · E=1 · Score=100\n标签同步对接海外代理 · R=80 · I=4 · C=90% · E=4 · Score=72"
        ],
        "pmApplication": [
          "把讨论从\"谁拍脑袋\"变成\"谁有数据\"——分数高的先做。"
        ],
        "section": "3. 需求管理（决定\"做哪些\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-3-3-moscow-优先级法",
        "title": "MoSCoW 优先级法（轻量级版本分桶）",
        "summary": "来源:daily-log 6/29",
        "tags": [
          "产品策划方法论",
          "SC"
        ],
        "content": [
          "来源:daily-log 6/29",
          "用 4 个字母把需求按\"必须做\"程度分桶。",
          "必须有,没它这版本就不该上：必做",
          "应该有,没它有遗憾但能上：优先做",
          "可以有,时间够就做、没时间就砍：争取做",
          "这版不做,先放 backlog：不做"
        ],
        "cases": [
          "V17 上线前 1 周确定本版本范围\nMust(4)：OTA 4 集群分时升级 / 失败自动回滚 / 上线公告 / 客户通知模板\nShould(3)：升级进度条 / 失败原因展示 / 客服知识库更新\nCould(3)：升级前自动备份 / 多语言文案 / 升级成功动画\nWon't(2)：AI 推荐升级时机 / 客户分级灰度（放 V18）"
        ],
        "pmApplication": [
          "RICE + MoSCoW 配合用——先用 RICE 从 10 个候选里排\"分数前 5\",再用 MoSCoW 把前 5 个分\"M/S/C/W\"决定\"这版本做哪几个\"。"
        ],
        "section": "3. 需求管理（决定\"做哪些\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-3-4-优先级矩阵",
        "title": "优先级矩阵（价值-成本矩阵）",
        "summary": "来源:产品经理八股.md 2. 需求分析",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:产品经理八股.md 2. 需求分析",
          "成本高 → 价值高=战略性投入，价值低=放 backlog",
          "成本低 → 价值高=快速做，价值低=砍掉"
        ],
        "section": "3. 需求管理（决定\"做哪些\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-3-5-砍需求",
        "title": "砍需求（PM 的\"必杀技\"）",
        "summary": "来源:产品经理八股.md 2. 需求分析（隐含）",
        "tags": [
          "产品策划方法论",
          "PM"
        ],
        "content": [
          "来源:产品经理八股.md 2. 需求分析（隐含）",
          "5 个砍需求的理由:",
          "1. 价值不明确 — \"做了也没人用\"",
          "2. ROI 太低 — 投入远超回报",
          "3. 范围蔓延 — 原 PRD 没写,后期加进来",
          "4. 依赖缺失 — 必须等另一个系统先就绪",
          "5. 时机不对 — 这版不合适,下版再说",
          "砍需求的 3 个话术:",
          "\"这个我先记下,这版我们聚焦核心场景\"（温和）",
          "\"这个 ROI 不够,能不能砍掉 30% 范围变成 1 周能做完？\"（折中）",
          "\"这个我们做 P2,先做更重要的\"（明确）"
        ],
        "pmApplication": [
          "砍需求的能力 = 把资源留给更重要的事的能力——PM 不砍需求,团队会被拖死。"
        ],
        "section": "3. 需求管理（决定\"做哪些\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-4-1-用户故事",
        "title": "用户故事（User Story）",
        "summary": "来源:产品经理八股.md 3. 用户研究",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:产品经理八股.md 3. 用户研究",
          "格式:As a [用户角色], I want [做某事], so that [实现某个目标]",
          "配套验收标准（Given/When/Then）:",
          "来源:daily-log 6/28",
          "Given · 作用=前置条件 · 示例=我之前和 AI 聊过 3 轮",
          "When · 作用=用户动作 · 示例=我再次点击悬浮球",
          "Then · 作用=系统响应 · 示例=页面自动展开最近 1 轮对话摘要",
          "3 条 Given/When/Then = 3 个测试用例——主路径 1 + 边界状态 1 + 异常分支 1。"
        ],
        "pmApplication": [
          "每个用户故事至少配 3 条验收标准——只写\"做什么\"不写\"做到什么程度\"的 PRD,研发交付出来大概率\"够用但不是你想要的\"。"
        ],
        "section": "4. 设计与交付（决定\"做对\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-4-2-信息架构",
        "title": "信息架构（Information Architecture, IA）",
        "summary": "来源:产品经理八股.md 4. 产品设计 / daily-log 6/28",
        "tags": [
          "产品策划方法论",
          "IA"
        ],
        "content": [
          "来源:产品经理八股.md 4. 产品设计 / daily-log 6/28",
          "把\"一堆功能/内容\"组织成\"用户能找到、能理解、能使用\"的结构。",
          "核心 4 件事:",
          "1. 组织系统 — 功能怎么分组",
          "2. 导航系统 — 用户怎么跳转",
          "3. 标签系统 — 菜单/按钮叫什么",
          "4. 搜索系统 — 找不到怎么办",
          "画 IA 的 3 步法:",
          "1. 拿张纸把所有功能/内容画成方块",
          "2. 按\"用户找东西的心智路径\"重排(不是按你的开发目录)",
          "3. 找 3 个真实用户跑\"找任务测试\",看他们点哪、卡哪"
        ],
        "cases": [
          "代理商平台 IA 改造效果\n分组 → 改造前=按业务模块，改造后=按\"用户角色 + 高频任务\"\n培训入口点击率 → 改造前=12%，改造后=38%"
        ],
        "pmApplication": [
          "IA 决定\"产品好不好用\"的 80%,再炫的视觉救不回来混乱的结构。"
        ],
        "section": "4. 设计与交付（决定\"做对\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-4-3-prd-标准-7-章节",
        "title": "PRD 标准 7 章节",
        "summary": "来源:产品经理八股.md 4. 产品设计 + 工作流程.md",
        "tags": [
          "产品策划方法论",
          "PRD"
        ],
        "content": [
          "来源:产品经理八股.md 4. 产品设计 + 工作流程.md",
          "1. 背景与目的\n   - 业务背景\n   - 需求目的\n   - 目标用户\n\n2. 用户故事\n   - As a / I want / so that\n\n3. 功能需求\n   - 功能点 1/2/3\n   - 业务流程\n   - 验收标准(Given/When/Then)\n\n4. 非功能需求\n   - 性能要求\n   - 安全要求\n   - 兼容性\n\n5. 风险与依赖\n   - 风险点\n   - 依赖方\n\n6. 排期计划\n   - 计划开始\n   - 计划结束\n   - 负责人\n\n7. 验收标准\n   - UAT 用例\n   - 上线标准"
        ],
        "section": "4. 设计与交付（决定\"做对\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-4-4-prd-评审-checklist补全项-4",
        "title": "PRD 评审 Checklist（7 维自检）",
        "summary": "来源:daily-log 6/25",
        "tags": [
          "产品策划方法论",
          "PRD"
        ],
        "content": [
          "来源:daily-log 6/25",
          "PRD 写完 → 评审会前 15 分钟,自检 7 维:",
          "背景/目的：一句话能说清\"为什么做\"吗？",
          "用户故事：主要场景都有故事覆盖吗？",
          "功能边界：写明\"做什么\"和\"不做什么\"了吗？",
          "业务流程：流程图画了吗？",
          "异常分支：异常状态列了吗？（如\"用户没登录\"\"接口超时\"）",
          "验收标准：每个功能点都 Given/When/Then 了吗？",
          "依赖/排期/风险：列了吗？负责人明确吗？",
          "反着用——评审会上研发提\"这块没写\",PM 翻 checklist 知道\"对,这块是第 5 维我马上补\",而不是\"哦我忘了\"。"
        ],
        "cases": [
          "弹窗 PRD 漏掉\"用户没登录态\"分支(4 类异常 → 实际 5 类),就是没跑 checklist 里的\"异常分支\"——上线后才发现要打回重做。"
        ],
        "section": "4. 设计与交付（决定\"做对\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-4-5-上线-checklist",
        "title": "上线 Checklist",
        "summary": "代码完成：[ ] 主流程已实现 / [ ] 异常分支已处理 / [ ] 单测覆盖率 ≥ 80%",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "代码完成：[ ] 主流程已实现 / [ ] 异常分支已处理 / [ ] 单测覆盖率 ≥ 80%",
          "测试通过：[ ] 冒烟测试通过(5 步 checklist) / [ ] 功能测试通过 / [ ] 性能测试通过 / [ ] 兼容性测试通过",
          "UAT 通过：[ ] 业务方验收用例 100% 通过 / [ ] 业务方签字确认",
          "上线物料：[ ] 上线公告已发 / [ ] 客服知识库已更新 / [ ] 客户通知模板已准备",
          "监控告警：[ ] 核心指标已埋点 / [ ] 告警阈值已设置 / [ ] oncall 排班已确认",
          "灰度计划：[ ] 灰度比例已确认(5%/20%/50%/100%) / [ ] 回滚预案已写",
          "时间窗：[ ] 按 4 集群分时上线规则 / [ ] 避开业务高峰"
        ],
        "section": "4. 设计与交付（决定\"做对\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-5-1-aarrr",
        "title": "AARRR（海盗模型）",
        "summary": "来源:产品经理八股.md 1. 核心模型",
        "tags": [
          "产品策划方法论",
          "AARRR"
        ],
        "content": [
          "来源:产品经理八股.md 1. 核心模型",
          "5 阶段深度拆解:",
          "Acquisition 获客 · 核心指标=CAC、渠道来源 · 优化动作=渠道质量分析、SEO/SEM",
          "Activation 激活 · 核心指标=首日完成核心动作率 · 优化动作=首次体验优化、新手引导",
          "Retention 留存 · 核心指标=次日/7 日/30 日留存 · 优化动作=召回机制、价值交付",
          "Revenue 变现 · 核心指标=ARPU、付费转化 · 优化动作=定价策略、套餐设计",
          "Referral 推荐 · 核心指标=邀请转化率、K 因子 · 优化动作=分享激励、口碑传播"
        ],
        "pmApplication": [
          "每一步都有独立指标,不能只盯\"获客\"不看\"留存\"。"
        ],
        "section": "5. 数据与增长（决定\"做得好\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-5-2-上瘾模型",
        "title": "上瘾模型（Hook Model）",
        "summary": "来源:daily-log 6/27",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:daily-log 6/27",
          "4 步循环:触发 → 行动 → 多变的奖励 → 投入",
          "外部推送/内部情绪：推送通知/无聊",
          "阻力极小的操作：打开 App",
          "不知道下次会刷到什么：下一条视频的未知性",
          "用户产生数据/内容：点赞、关注、收藏"
        ],
        "pmApplication": [
          "做产品时反问自己\"用户为什么每天回来\"——靠\"必须用业务\"驱动 vs 靠\"想用就用\"驱动,设计策略完全不同。"
        ],
        "section": "5. 数据与增长（决定\"做得好\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-5-3-cohort-队列分析",
        "title": "Cohort 队列分析（同期群分析）",
        "summary": "来源:daily-log 6/27",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:daily-log 6/27",
          "把用户按\"首次使用时间\"分组,看每组在后续时间的行为(7 日/30 日留存、复购率),而不是\"所有用户平均\"。",
          "\"平均数陷阱\"案例:企学宝上线后,整体 7 日留存 30%。但 Cohort 一拆——6/17 首登的代理 7 日留存 45%,6/22 首登的代理 7 日留存只有 18%。"
        ],
        "pmApplication": [
          "所有\"留存问题\"先跑 Cohort 再说结论——平均数会掩盖真相。"
        ],
        "section": "5. 数据与增长（决定\"做得好\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-5-4-nps-净推荐值",
        "title": "NPS 净推荐值",
        "summary": "来源:daily-log 6/27",
        "tags": [
          "产品策划方法论",
          "NPS"
        ],
        "content": [
          "来源:daily-log 6/27",
          "公式:NPS = 推荐者%(9-10分) - 贬损者%(0-6分)(范围 -100 到 +100)",
          "判断标准:",
          "> 50 优秀",
          "> 30 良好",
          "< 0 危险"
        ],
        "pmApplication": [
          "NPS 的真正价值不是数字本身,是\"贬损者的具体吐槽\"——深度追问后分类汇总,高频痛点就是下一期 P0。"
        ],
        "section": "5. 数据与增长（决定\"做得好\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-5-5-a-b-测试-5-步",
        "title": "A/B 测试 5 步",
        "summary": "来源:产品经理八股.md 5. 数据分析 / daily-log 6/20",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:产品经理八股.md 5. 数据分析 / daily-log 6/20",
          "1：定义假设 — \"X 改版后转化率会提升 10%\"",
          "2：设计实验 — 分流比例、观察时长、核心指标",
          "3：分配流量 — 新老用户各 50%、灰度放出",
          "4：分析结果 — 数据有显著差异才作数(p<0.05)",
          "5：决策上线 — 胜出版全量、败出版回滚"
        ],
        "pmApplication": [
          "指标必须\"先于上线\"定义好——不然跑完数据你也不知道\"涨了\"是因为按钮位置还是别的因素。"
        ],
        "section": "5. 数据与增长（决定\"做得好\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-5-6-增长飞轮",
        "title": "增长飞轮（Growth Flywheel）",
        "summary": "来源:补全(daily-log 6/26 内串联)",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:补全(daily-log 6/26 内串联)",
          "找到\"用户增长 → 产品更好 → 用户更愿意来\"的正反馈循环,而不是线性漏斗。"
        ],
        "cases": [
          "代理商平台\"代理活跃度\"飞轮\n代理活跃使用\n    ↓\n积累数据 + 改进产品\n    ↓\n产品更好用\n    ↓\n新代理主动注册\n    ↓\n代理活跃使用(循环)"
        ],
        "pmApplication": [
          "找到你的飞轮,把每个动作挂上去——每个新需求反问\"它推动飞轮的哪一环\"。"
        ],
        "section": "5. 数据与增长（决定\"做得好\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-6-1-raci-矩阵",
        "title": "RACI 矩阵",
        "summary": "来源:daily-log 6/26",
        "tags": [
          "产品策划方法论",
          "RACI"
        ],
        "content": [
          "来源:daily-log 6/26",
          "4 种角色:",
          "R Responsible · 含义=执行人,真干活 · 数量=可多个",
          "A Accountable · 含义=责任人,兜底拍板 · 数量=只能 1 个",
          "C Consulted · 含义=咨询人,给意见 · 数量=可多个",
          "I Informed · 含义=知会人,结果通知 · 数量=可多个"
        ],
        "cases": [
          "V17 OTA 升级的 RACI(涉及 6 个部门)\n研发：R(出固件包)\n运维：R(监控升级状态)\n产品：A(出问题产品兜底)\n客服：C(看上线公告提供反馈)\n销售：I(升级期间不发新单)\n供应链：I(主板版本变更知会)\n3 步落地:\n1. 列出事项\n2. 标 R/A/C/I\n3. 找\"A 超过 1 个\"或\"全是 R 没 A\"的格子重调"
        ],
        "pmApplication": [
          "RACI 跑完,谁也不甩锅——研发知道自己得干、产品知道自己兜底、客服知道自己该给客户怎么答。"
        ],
        "section": "6. 协作与决策（决定\"和谁一起做\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-6-2-鱼骨图",
        "title": "鱼骨图（Ishikawa Diagram）",
        "summary": "来源:daily-log 6/26",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:daily-log 6/26",
          "6M 分类:Man(人) / Machine(机器) / Method(方法) / Material(物料) / Measurement(测量) / Environment(环境)"
        ],
        "cases": [
          "V17 升级\"国内集群升级成功率只有 96.5%\"\nMan：运维值班操作漏步骤\nMachine：OTA 服务器在德国机房,国内访问慢\nMethod：升级窗口 22:00 但部分代理时区偏早\nMaterial：新固件包 1.2GB,部分弱网下载失败\nMeasurement：监控告警阈值太高,问题没暴露\nEnvironment：部分代理餐厅 WiFi 不稳定"
        ],
        "pmApplication": [
          "鱼骨图的核心不是\"画得多漂亮\"而是\"团队一起画\"——研发看技术、客服看用户、运维看流程,3 视角拼出全貌。"
        ],
        "section": "6. 协作与决策（决定\"和谁一起做\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-6-3-5why-分析法",
        "title": "5Why 分析法",
        "summary": "来源:daily-log 6/23",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:daily-log 6/23",
          "遇到问题不要停在\"表面原因\",连续追问 5 次\"为什么\"找到\"根本原因\"。"
        ],
        "cases": [
          "配送机器人\"突然停在餐厅中央不动\"\nWhy 1：激光雷达报警\nWhy 2：检测到正前方 30cm 有障碍\nWhy 3：顾客把椅子推到机器人正前方\nWhy 4：机器人避障策略是\"绕行\",但卡在桌椅间窄通道没法绕\nWhy 5：建图时这块区域宽度只够机器人单行通过,没在地图上标记\"单行通道\"约束\n根因：地图数据缺失\"单行通道\"标记\n解决方案：建图阶段让服务员标注单行通道(不是优化避障算法)"
        ],
        "pmApplication": [
          "不 5Why 的话,可能去优化避障算法,治标不治本。"
        ],
        "section": "6. 协作与决策（决定\"和谁一起做\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-6-4-pdca-戴明环",
        "title": "PDCA 戴明环",
        "summary": "来源:daily-log 6/23",
        "tags": [
          "产品策划方法论",
          "PDCA"
        ],
        "content": [
          "来源:daily-log 6/23",
          "4 步循环:Plan(计划) → Do(执行) → Check(检查) → Act(处理)",
          "核心思想:螺旋上升——每跑一轮 PDCA 改进一个具体问题,再跑下一轮再改进一个。"
        ],
        "cases": [
          "代理商平台\"工单平均处理时长\"优化\nP50 4h → 2.5h：改版工单页 + AI 推荐 / 3h(达预期 80%) / AI 推荐用得少,改规则引擎\n2.5h → 2.3h：规则引擎 + 反馈学习 / 2.3h ✅ / 进入下一轮优化"
        ],
        "pmApplication": [
          "复盘是\"事后总结经验\",PDCA 是\"边做边改的循环\"——强调\"持续\"。"
        ],
        "section": "6. 协作与决策（决定\"和谁一起做\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-6-5-设计冲刺",
        "title": "设计冲刺（Design Sprint）",
        "summary": "来源:daily-log 6/30",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:daily-log 6/30",
          "Google Ventures 的 5 天产品决策法:",
          "理解：和专家聊、定问题",
          "发散：画草图不评论",
          "决策：投票选方案",
          "原型：做最简可用原型",
          "测试：5 个真用户跑一遍",
          "核心思想:5 天节奏逼出所有假设——不是真要做 5 天。"
        ],
        "cases": [
          "V17 升级前跑过一轮设计冲刺——周一对齐\"升级失败要自动回滚还是人工介入\"、周二画 3 套方案、周三投票(自动回滚胜出)、周四做纸面原型、周五找 5 个代理测试。结果:3/5 代理问\"如果回滚失败会怎样\"——PRD 之前没写这个问题,最后补进 PRD。"
        ],
        "pmApplication": [
          "重要功能上线前、需求大但方向不明时跑一轮设计冲刺,哪怕压缩成 5 小时也能帮 PM ① 在动手前暴露分歧 ② 用真用户验证而不是\"领导拍板\" ③ 节省\"做完才发现方向错\"的几周返工。"
        ],
        "section": "6. 协作与决策（决定\"和谁一起做\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-6-6-影响地图",
        "title": "影响地图（Impact Mapping）",
        "summary": "用\"目标 → 参与者 → 影响 → 交付物\"4 层结构,把\"为什么做\"和\"做什么\"对齐。",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "用\"目标 → 参与者 → 影响 → 交付物\"4 层结构,把\"为什么做\"和\"做什么\"对齐。",
          "4 层结构:",
          "目标 (Goal)\n  ↓ 服务谁\n参与者 (Actor)\n  ↓ 怎么影响他们\n影响 (Impact)\n  ↓ 怎么实现\n交付物 (Deliverable)"
        ],
        "cases": [
          "代理商平台\"降低工单解决时长\"\n目标：区域代理工单 P50 解决时长 4h → 2.5h\n参与者：区域代理、客服\n影响：代理能更快速找到答案、客服能复用历史方案\n交付物：AI 悬浮球 + 工单页改版 + 历史方案库"
        ],
        "pmApplication": [
          "让团队对齐\"为什么做\"——避免\"做完发现不是用户要的\"。"
        ],
        "section": "6. 协作与决策（决定\"和谁一起做\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-product-methodology-6-7-复盘-8-步法",
        "title": "复盘 8 步法",
        "summary": "来源:工作流程.md 复盘 SOP",
        "tags": [
          "产品策划方法论"
        ],
        "content": [
          "来源:工作流程.md 复盘 SOP",
          "8 步:",
          "1. 确认范围(time-context 拿日期)",
          "2. 拉日历(本周所有会议)",
          "3. 拉妙记(4 份/周典型)",
          "4. 拉群消息(关键对接群)",
          "5. 读工作日志(还原日常工作)",
          "6. 结构化分析(11 字段)",
          "7. 写复盘表(NO.XXX)",
          "8. 关联需求(link 字段挂本周需求)"
        ],
        "pmApplication": [
          "8 步缺一步,复盘就会变成\"印象流\",失去\"可索引、可追溯、可复盘经验\"的价值。"
        ],
        "section": "6. 协作与决策（决定\"和谁一起做\"）",
        "sourceId": "product-methodology",
        "sourceLabel": "产品策划方法论",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-kano-模型",
        "title": "KANO 模型",
        "summary": "基本型需求（必须有）/ 期望型需求（越满足越满意）/ 兴奋型需求（超出预期）",
        "tags": [
          "产品经理八股",
          "KANO"
        ],
        "content": [
          "基本型需求（必须有）/ 期望型需求（越满足越满意）/ 兴奋型需求（超出预期）"
        ],
        "pmApplication": [
          "做需求评估时，先分清属于哪一型——基本型必做，期望型性价比最高，兴奋型是差异化"
        ],
        "section": "1. 核心模型（PM 必会）",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-mvp",
        "title": "MVP（最小可行产品）",
        "summary": "用最小成本验证核心假设的产品版本",
        "tags": [
          "产品经理八股",
          "MVP"
        ],
        "content": [
          "用最小成本验证核心假设的产品版本"
        ],
        "pmApplication": [
          "先做\"刚好能验证市场\"的版本，不要一开始就做\"大而全\""
        ],
        "section": "1. 核心模型（PM 必会）",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-pmf",
        "title": "PMF（产品市场匹配）",
        "summary": "产品真正满足市场需求，能留住用户",
        "tags": [
          "产品经理八股",
          "PMF"
        ],
        "content": [
          "产品真正满足市场需求，能留住用户"
        ],
        "pmApplication": [
          "MVP → PMF 是创业产品必经之路，PMF 没找到之前不要盲目扩张"
        ],
        "section": "1. 核心模型（PM 必会）",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-ucd",
        "title": "UCD（用户中心设计）",
        "summary": "User-Centered Design，以用户需求为出发点的设计哲学",
        "tags": [
          "产品经理八股",
          "UCD"
        ],
        "content": [
          "User-Centered Design，以用户需求为出发点的设计哲学"
        ],
        "pmApplication": [
          "先访谈真实用户（不是脑补\"用户需要什么\"），用原型验证再迭代",
          "对比：\"老板说要加什么功能\"或\"竞品有什么我们也要有\"是反 UCD"
        ],
        "section": "1. 核心模型（PM 必会）",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-jtbd",
        "title": "JTBD（用户的待办任务）",
        "summary": "Jobs To Be Done，用户\"雇用\"产品来完成什么任务",
        "tags": [
          "产品经理八股",
          "JTBD"
        ],
        "content": [
          "Jobs To Be Done，用户\"雇用\"产品来完成什么任务"
        ],
        "pmApplication": [
          "用户买的不是\"产品\"，是\"完成任务的能力\"——理解任务比理解功能更重要"
        ],
        "section": "1. 核心模型（PM 必会）",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-okr-vs-kpi",
        "title": "OKR vs KPI",
        "summary": "OKR：Objectives and Key Results，目标 + 关键结果（更灵活，鼓励挑战）",
        "tags": [
          "产品经理八股",
          "OKR",
          "KPI"
        ],
        "content": [
          "OKR：Objectives and Key Results，目标 + 关键结果（更灵活，鼓励挑战）",
          "KPI：Key Performance Indicator，关键绩效指标（更刚性，考核用）"
        ],
        "pmApplication": [
          "OKR 定方向（季度），KPI 盯执行（周/月）"
        ],
        "section": "1. 核心模型（PM 必会）",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-sla",
        "title": "SLA（服务水平协议）",
        "summary": "Service Level Agreement，服务提供方对客户的质量承诺",
        "tags": [
          "产品经理八股",
          "SLA"
        ],
        "content": [
          "Service Level Agreement，服务提供方对客户的质量承诺",
          "核心指标：",
          "可用率：99.9%（年宕机 < 8.76 小时）",
          "首次响应时长：30 分钟内",
          "解决时长：4 小时内",
          "故障恢复时长：1 小时内"
        ],
        "cases": [
          "企学宝对接的 SLA 承诺——\"培训通知 5 分钟触达、成绩同步 1 小时完成\"\nSLO/SLI 补充：\nSLO（Service Level Objective）：服务水平的内部目标（比 SLA 更严，是 SLA 的安全垫）\nSLI（Service Level Indicator）：服务水平的具体指标（如错误率、延迟）"
        ],
        "pmApplication": [
          "未达成通常按合同赔偿（扣款、延服务期）；SLA 指标要拆到架构和监控上"
        ],
        "section": "1. 核心模型（PM 必会）",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-需求来源",
        "title": "需求来源",
        "summary": "用户反馈 / 数据分析 / 竞品分析 / 业务方需求 / 战略规划",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "用户反馈 / 数据分析 / 竞品分析 / 业务方需求 / 战略规划"
        ],
        "section": "2. 需求分析",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-需求评估维度",
        "title": "需求评估维度（4 个）",
        "summary": "商业价值：对业务指标的贡献",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "商业价值：对业务指标的贡献",
          "用户价值：解决用户什么问题",
          "技术成本：开发难度和资源",
          "ROI：投入产出比"
        ],
        "section": "2. 需求分析",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-交互设计",
        "title": "交互设计",
        "summary": "任务流程 / 操作反馈 / 异常处理",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "任务流程 / 操作反馈 / 异常处理"
        ],
        "section": "4. 产品设计",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-prd-结构",
        "title": "PRD 结构（标准 7 章节）",
        "summary": "PRD 结构（标准 7 章节）",
        "tags": [
          "产品经理八股",
          "PRD"
        ],
        "content": [
          "1. 背景与目的",
          "2. 用户故事",
          "3. 功能需求",
          "4. 非功能需求",
          "5. 业务流程",
          "6. 原型/设计稿",
          "7. 验收标准"
        ],
        "section": "4. 产品设计",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-核心指标",
        "title": "核心指标",
        "summary": "DAU/MAU（日活/月活）/ GMV（成交总额）/ 转化率 / 留存率 / 流失率",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "DAU/MAU（日活/月活）/ GMV（成交总额）/ 转化率 / 留存率 / 流失率"
        ],
        "section": "5. 数据分析",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-三层核心文档",
        "title": "三层核心文档",
        "summary": "BRD（商业需求文档） · 回答什么=做这个值不值得 · 给谁看=老板/决策层 · 写多少=5-10 页",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "BRD（商业需求文档） · 回答什么=做这个值不值得 · 给谁看=老板/决策层 · 写多少=5-10 页",
          "MRD（市场需求文档） · 回答什么=市场要什么 · 给谁看=市场/产品 · 写多少=10-20 页",
          "PRD（产品需求文档） · 回答什么=具体怎么做 · 给谁看=研发/设计 · 写多少=20-50 页"
        ],
        "section": "6. 文档体系（3 层 + 2 类）",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-两类辅助文档",
        "title": "两类辅助文档",
        "summary": "FSD：Functional Specification Document 功能规格文档（详细功能技术规格，研发自测用）",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "FSD：Functional Specification Document 功能规格文档（详细功能技术规格，研发自测用）",
          "UAT：User Acceptance Testing 用户验收测试（用户验收用例，业务方确认）"
        ],
        "section": "6. 文档体系（3 层 + 2 类）",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article",
        "terms": [
          {
            "term": "FSD",
            "meaning": "Functional Specification Document 功能规格文档",
            "explain": "Functional Specification Document 功能规格文档",
            "loc": "详细功能技术规格，研发自测用",
            "case": ""
          },
          {
            "term": "UAT",
            "meaning": "User Acceptance Testing 用户验收测试",
            "explain": "User Acceptance Testing 用户验收测试",
            "loc": "用户验收用例，业务方确认",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-pm-bagu-文档选择时机",
        "title": "文档选择时机",
        "summary": "老板拍板资源：BRD（算账 + 风险 + ROI）",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "老板拍板资源：BRD（算账 + 风险 + ROI）",
          "市场/产品对齐：MRD（市场分析 + 竞品 + 用户需求）",
          "研发拆任务：PRD（功能 + 流程 + 验收）",
          "技术实现细节：FSD（接口 + 数据结构）",
          "业务方验收：UAT（用例 + 通过标准）"
        ],
        "section": "6. 文档体系（3 层 + 2 类）",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-案例-代理商平台接企学宝",
        "title": "案例：代理商平台接企学宝",
        "summary": "BRD：给老板算\"这个对接能减少 XX% 培训成本、提升 XX% 代理活跃度、6 个月回本\"",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "BRD：给老板算\"这个对接能减少 XX% 培训成本、提升 XX% 代理活跃度、6 个月回本\"",
          "MRD：给市场/产品分析\"企学宝是行业头部、目标代理 100% 覆盖、培训内容能直接复用\"",
          "PRD：给研发拆解\"账号映射接口、标签同步规则、通知推送时序、异常弹窗 5 类\""
        ],
        "section": "6. 文档体系（3 层 + 2 类）",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-需求评审-10-步",
        "title": "需求评审 10 步",
        "summary": "3. 内部评审（PM 组）",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "1. 需求提出",
          "2. 需求分析",
          "3. 内部评审（PM 组）",
          "4. 跨部门评审（研发/设计/测试）",
          "5. 技术方案评审",
          "6. 排期确认",
          "7. 开发跟踪",
          "8. 测试验收",
          "9. 上线发布",
          "10. 效果复盘"
        ],
        "section": "7. 项目管理",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-敏捷开发-4-个会议",
        "title": "敏捷开发 4 个会议",
        "summary": "Sprint Planning：冲刺计划会",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "Sprint Planning：冲刺计划会",
          "Daily Standup：每日站会",
          "Sprint Review：冲刺评审",
          "Sprint Retrospective：冲刺回顾"
        ],
        "section": "7. 项目管理",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-跨部门沟通-4-原则",
        "title": "跨部门沟通 4 原则",
        "summary": "跨部门沟通 4 原则",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "明确共同目标",
          "用数据说话",
          "提前对齐预期",
          "及时同步进展"
        ],
        "section": "8. 沟通协作",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-需求宣讲-4-段式",
        "title": "需求宣讲 4 段式",
        "summary": "需求宣讲 4 段式",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "为什么做（背景）",
          "做什么（范围）",
          "怎么做（方案）",
          "做成什么样（验收标准）"
        ],
        "section": "8. 沟通协作",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-9-1-冒烟测试",
        "title": "冒烟测试（Smoke Testing）",
        "summary": "一句话定义：保证\"软件能起来\"的最浅测试——验证核心流程能跑通，不深究细节。目的不是找 bug，是过滤明显的\"开不起来\"。",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "一句话定义：保证\"软件能起来\"的最浅测试——验证核心流程能跑通，不深究细节。目的不是找 bug，是过滤明显的\"开不起来\"。",
          "关键 3 维：",
          "目的：验证\"主流程不挂\"——不是找 bug",
          "范围：关键路径走一遍，能正常打开/登录/发送——不测异常分支",
          "结论：通过→转详细测试；不通过→当天打回开发，不进详细测试"
        ],
        "section": "9. 测试与质量保障",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-4-个关键边界",
        "title": "4 个关键边界（避免被挑战）",
        "summary": "❌ 不是单元测试：不针对函数/方法级别",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "❌ 不是单元测试：不针对函数/方法级别",
          "❌ 不是集成测试：不测模块交互",
          "❌ 不是验收测试：不测业务需求满足度（那是 UAT 的事）",
          "❌ 不是回归测试：不验证历史 bug 没复发",
          "口诀：冒烟测试 = \"冒个烟看冒不冒黑烟\"——能正常冒白烟（跑起来）就过，冒黑烟（跑不起来）就返工。"
        ],
        "section": "9. 测试与质量保障",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-相邻黑话对比",
        "title": "相邻黑话对比（被问\"和 X 什么区别\"用得上）",
        "summary": "冒烟测试 · 一句话=软件能跑起来 · 谁做=QA · 时机=提测当天",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "冒烟测试 · 一句话=软件能跑起来 · 谁做=QA · 时机=提测当天",
          "回归测试 · 一句话=改完代码后没把老功能搞坏 · 谁做=QA · 时机=每次发版前",
          "UAT（用户验收） · 一句话=业务方确认\"满足需求\" · 谁做=业务方 · 时机=上线前",
          "灰度 · 一句话=只对部分用户放量 · 谁做=运维/PM · 时机=上线后"
        ],
        "section": "9. 测试与质量保障",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-提测日标准流程",
        "title": "提测日标准流程",
        "summary": "1. 提测邮件/IM 通知（产品/QA/研发）\n2. 研发部署到测试环境\n3. QA 冒烟测试（5 步 checklist）\n   ├─ 通过 → 进入详细测试周期\n   └─ 不通过 → 当天打回，循环回到第 1 步\n4. 详细测试（功能",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "1. 提测邮件/IM 通知（产品/QA/研发）\n2. 研发部署到测试环境\n3. QA 冒烟测试（5 步 checklist）\n   ├─ 通过 → 进入详细测试周期\n   └─ 不通过 → 当天打回，循环回到第 1 步\n4. 详细测试（功能 / 性能 / 异常 / 兼容性）\n5. Bug 修复 + 回归测试\n6. UAT（业务方验收）\n7. 上线",
          "关键：冒烟测试是\"准入门槛\"，不通过就不进详细测试——这能避免\"带病进入详细测试\"导致的时间和精力浪费。"
        ],
        "section": "9. 测试与质量保障",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-容易踩的坑",
        "title": "容易踩的坑",
        "summary": "⚠️ 冒烟通过 ≠ 无 bug：冒烟只验证\"能起来\"，详细 bug 留给详细测试",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "⚠️ 冒烟通过 ≠ 无 bug：冒烟只验证\"能起来\"，详细 bug 留给详细测试",
          "⚠️ 环境差异：测试环境冒烟通过 ≠ 生产环境没问题（数据库、网络、配置都可能不同）",
          "⚠️ 数据准备：冒烟测试前要准备好测试数据（账号、订单、库存等），否则跑不通",
          "⚠️ 不要替代 UAT：冒烟测试是技术验证，UAT 是业务验证，两件事都做"
        ],
        "section": "9. 测试与质量保障",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      },
      {
        "id": "kb-pm-bagu-记忆口诀",
        "title": "记忆口诀",
        "summary": "\"白烟过、黑烟回\"：能跑通就过，跑不通就打回",
        "tags": [
          "产品经理八股"
        ],
        "content": [
          "\"白烟过、黑烟回\"：能跑通就过，跑不通就打回",
          "\"5 步清单\"：入口→主流程→写→读→按钮",
          "\"4 个不是\"：不是单测 / 不是集成 / 不是验收 / 不是回归"
        ],
        "section": "9. 测试与质量保障",
        "sourceId": "pm-bagu",
        "sourceLabel": "产品经理八股",
        "kind": "article"
      }
    ]
  },
  {
    "id": "architecture",
    "title": "技术架构",
    "description": "系统架构与技术/行业术语（含机器人）",
    "icon": "⬡",
    "items": [
      {
        "id": "kb-system-architecture-1-1-三层架构",
        "title": "三层架构（最经典的分层思维）",
        "summary": "所有系统都可以拆成 3 层，PM 提任何需求都先问\"动哪一层\"",
        "tags": [
          "系统架构"
        ],
        "content": [
          "所有系统都可以拆成 3 层，PM 提任何需求都先问\"动哪一层\"",
          "表现层 · 职责=用户看到和操作的界面 · 技术组件举例=Web（React/Vue）、移动端（iOS/Android/小程序）、桌面端 · [本公司]对应=代理商平台 Web、运营管理平台 Web",
          "业务层 · 职责=处理业务逻辑、流程编排、规则校验 · 技术组件举例=后端服务（Java/Go/Node）、API 网关 · [本公司]对应=订单服务、工单服务、CRM 服务",
          "数据层 · 职责=存储、查询、数据分析 · 技术组件举例=关系数据库（MySQL/PG）、缓存（Redis）、搜索（ES）、数仓 · [本公司]对应=代理商平台 DB、培训记录库"
        ],
        "pmApplication": [
          "写需求时明确\"动哪几层\"。例：\"工单页加深色模式\" = 只动表现层（前端 CSS）；\"接企学宝同步培训记录\" = 动业务层 + 数据层（要新加同步服务、新加表）。分层意识能让 PM 评估\"这个需求改 1 天还是 1 个月\"。"
        ],
        "section": "1. 架构基础（PM 必须懂的核心概念）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-1-2-单体架构-vs-微服务架构",
        "title": "单体架构 vs 微服务架构",
        "summary": "[本公司]现状：A、B 两平台是模块化单体（按业务模块拆代码包，但部署还是一个应用），还没到微服务阶段。",
        "tags": [
          "系统架构"
        ],
        "content": [
          "形态 · 单体（Monolith）=所有功能打包在一个应用里 · 微服务（Microservices）=按业务域拆成几十个独立小服务",
          "部署 · 单体（Monolith）=一处改全部重新部署 · 微服务（Microservices）=每个服务独立部署、独立伸缩",
          "技术栈 · 单体（Monolith）=一种语言/框架 · 微服务（Microservices）=多种语言共存",
          "团队协作 · 单体（Monolith）=改动容易冲突 · 微服务（Microservices）=每个团队负责一个服务",
          "故障影响 · 单体（Monolith）=一个 bug 全站挂 · 微服务（Microservices）=一个服务挂了不影响其他",
          "适合 · 单体（Monolith）=产品初期（用户<10万） · 微服务（Microservices）=规模化后（用户>百万、服务多）",
          "[本公司]现状：A、B 两平台是模块化单体（按业务模块拆代码包，但部署还是一个应用），还没到微服务阶段。"
        ],
        "pmApplication": [
          "不要在单体阶段硬上微服务——成本高、收益小。触发微服务化的 3 个信号：① 单次部署超过 30 分钟 ② 一个团队改动影响另一个团队的发布 ③ 不同模块的资源消耗差 10 倍以上。"
        ],
        "section": "1. 架构基础（PM 必须懂的核心概念）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-1-3-前后端分离",
        "title": "前后端分离",
        "summary": "传统模式：后端渲染 HTML 页面（PHP/JSP），前端写死在 HTML 里",
        "tags": [
          "系统架构"
        ],
        "content": [
          "传统模式：后端渲染 HTML 页面（PHP/JSP），前端写死在 HTML 里",
          "现代模式：前端是独立 SPA（单页应用），后端只提供 JSON API",
          "前端后端并行开发，效率高：SEO 不友好（要 SSR 解决）",
          "一套后端 API 服务多端（Web/iOS/Android）：跨域问题（CORS）",
          "前端技术栈灵活（React/Vue）：接口管理成本上升（要 OpenAPI/GraphQL）",
          "[本公司]：A 平台是前后端分离架构，前端是 Vue、后端是 Java。"
        ],
        "section": "1. 架构基础（PM 必须懂的核心概念）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-2-1-数据库",
        "title": "数据库（数据层核心）",
        "summary": "关系数据库（MySQL/PG） · 用途=结构化数据，强事务 · [本公司]场景=代理商平台、工单、订单",
        "tags": [
          "系统架构"
        ],
        "content": [
          "关系数据库（MySQL/PG） · 用途=结构化数据，强事务 · [本公司]场景=代理商平台、工单、订单",
          "缓存（Redis/Memcached） · 用途=高频读、临时数据 · [本公司]场景=Session、Token、热数据",
          "搜索引擎（Elasticsearch） · 用途=全文搜索、复杂查询 · [本公司]场景=工单搜索、知识库检索",
          "时序数据库（InfluxDB/TDengine） · 用途=时间序列数据 · [本公司]场景=机器人运行数据、传感器日志",
          "对象存储（OSS/S3） · 用途=大文件存储 · [本公司]场景=OTA 固件包、培训视频",
          "消息队列（Kafka/RocketMQ） · 用途=异步任务、削峰填谷 · [本公司]场景=通知推送、数据同步"
        ],
        "pmApplication": [
          "写需求必问\"数据存在哪\"——涉及\"数据搬家\"的需求（接企学宝、接 CRM）一定涉及数据层改造。"
        ],
        "section": "2. 关键组件（PM 经常听研发提到的\"零件\"）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-2-2-中间件",
        "title": "中间件（连接各个服务的\"基础设施\"）",
        "summary": "中间件=API 网关 · 干什么=统一入口、限流、鉴权 · PM 视角的翻译=\"所有外部调用都从这进\"",
        "tags": [
          "系统架构"
        ],
        "content": [
          "中间件=API 网关 · 干什么=统一入口、限流、鉴权 · PM 视角的翻译=\"所有外部调用都从这进\"",
          "中间件=消息队列 · 干什么=异步任务、削峰填谷 · PM 视角的翻译=\"用户点完通知后，后台慢慢处理、不卡页面\"",
          "中间件=配置中心 · 干什么=动态改配置不重启 · PM 视角的翻译=\"改个功能开关不用发版\"",
          "中间件=服务注册/发现 · 干什么=服务之间怎么找到对方 · PM 视角的翻译=\"微服务之间互相打电话要拨号本\"",
          "中间件=链路追踪 · 干什么=一次请求经过哪些服务 · PM 视角的翻译=\"用户报'工单页卡了'，研发能定位到是哪个服务慢\""
        ],
        "section": "2. 关键组件（PM 经常听研发提到的\"零件\"）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-2-3-缓存策略",
        "title": "缓存策略（最常被问的\"性能优化\"）",
        "summary": "① 什么数据要缓存？答：读多写少的（用户档案、字典、配置）",
        "tags": [
          "系统架构"
        ],
        "content": [
          "PM 必懂 3 个问题：",
          "① 什么数据要缓存？答：读多写少的（用户档案、字典、配置）",
          "② 缓存多久？答：按业务容忍度（5 分钟？1 小时？1 天？）",
          "③ 缓存和数据库不一致怎么办？答：最终一致 + 设置合理的过期时间",
          "经典 3 模式：",
          "Cache-Aside（旁路缓存）：应用先查缓存，命中就返回；不命中查 DB 再写缓存。最常用",
          "Write-Through（写穿透）：写 DB 时同步写缓存。强一致场景",
          "Write-Behind（写回）：先写缓存，异步写 DB。性能高但可能丢数据"
        ],
        "section": "2. 关键组件（PM 经常听研发提到的\"零件\"）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-3-1-多租户架构",
        "title": "多租户架构（SaaS 化必备）",
        "summary": "之前在 行业通用词语.md 1.4 节讲过 3 种隔离模式，这里补充选型决策树",
        "tags": [
          "系统架构"
        ],
        "content": [
          "之前在 行业通用词语.md 1.4 节讲过 3 种隔离模式，这里补充选型决策树",
          "是否在金融/医疗等强合规行业？\n├─ 是 → 独立数据库（合规+客户定制）\n└─ 否 → 是否需要租户级字段/表结构定制？\n    ├─ 是 → 共享 DB + 独立 schema\n    └─ 否 → 共享 DB + tenant_id（X 培训平台当前方案）",
          "[本公司]场景：",
          "X 培训平台：共享 DB + tenant_id，4 个子站 = 4 个租户",
          "代理商平台：单租户（只服务[本公司]自己），但内部有\"代理商 → 客户\"的二级权限隔离",
          "未来 SaaS 化：代理商平台如果对外开放给其他机器人厂商，就要升级到多租户"
        ],
        "section": "3. 架构模式（成熟方案，直接套）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-3-2-读写分离",
        "title": "读写分离（数据库性能优化标配）",
        "summary": "模式：主库写、从库读，应用层按 SQL 类型路由",
        "tags": [
          "系统架构"
        ],
        "content": [
          "模式：主库写、从库读，应用层按 SQL 类型路由",
          "读多写少（10:1 以上）：写多读少（写主库直接挂）",
          "单表数据量 > 1000 万行：表小、业务简单",
          "报表/分析类查询：强实时一致（金融交易）",
          "[本公司]场景：工单列表查询是典型读多写少，配置了 1 主 2 从；订单表写多读少，没做读写分离。"
        ],
        "section": "3. 架构模式（成熟方案，直接套）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-3-3-分库分表",
        "title": "分库分表（数据库扛不住时的最后一招）",
        "summary": "触发条件（PM 该知道的红线）：",
        "tags": [
          "系统架构"
        ],
        "content": [
          "做法 · 垂直拆分=按业务把表分到不同库 · 水平拆分=按某个字段（user_id/order_id）把同一张表分到多库",
          "典型场景 · 垂直拆分=用户库、订单库、商品库分开放 · 水平拆分=订单表按月份分 12 个库",
          "PM 视角 · 垂直拆分=\"业务大了，一个 DB 装不下\" · 水平拆分=\"单表 1 亿行查询太慢\"",
          "触发条件（PM 该知道的红线）：",
          "单表 > 5000 万行 或 单库 > 2TB",
          "单条 SQL 走全表扫描 > 3 秒",
          "数据库 CPU 长期 > 70%",
          "[本公司]场景：当前工单表最大也就几百万行，还没到分库分表阶段。PM 知道有这根红线即可。"
        ],
        "section": "3. 架构模式（成熟方案，直接套）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-4-1-3-大经典问题",
        "title": "3 大经典问题",
        "summary": "高可用（HA）：系统挂的时间少（主备切换、集群部署）",
        "tags": [
          "系统架构"
        ],
        "content": [
          "高可用（HA）：系统挂的时间少（主备切换、集群部署）",
          "高并发：同时很多人访问不卡（缓存、限流、扩容）",
          "高扩展：加机器就能扛更多流量（微服务、读写分离、CDN）"
        ],
        "pmApplication": [
          "写非功能需求时，\"能扛多少 QPS/多少用户\" 一定要明确——研发不会主动告诉你系统能扛什么。"
        ],
        "section": "4. 高可用与高并发（PM 必懂的\"系统健壮性\"）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article",
        "terms": [
          {
            "term": "高可用（HA）",
            "meaning": "系统挂的时间少",
            "explain": "系统挂的时间少",
            "loc": "主备切换、集群部署",
            "case": ""
          },
          {
            "term": "高并发",
            "meaning": "同时很多人访问不卡",
            "explain": "同时很多人访问不卡",
            "loc": "缓存、限流、扩容",
            "case": ""
          },
          {
            "term": "高扩展",
            "meaning": "加机器就能扛更多流量",
            "explain": "加机器就能扛更多流量",
            "loc": "微服务、读写分离、CDN",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-system-architecture-4-2-限流-降级-熔断",
        "title": "限流 / 降级 / 熔断（保护系统的\"三道闸\"）",
        "summary": "[本公司]场景：第三方系统对接必须设计熔断——如果企学宝接口挂了 30 秒，代理商平台不能卡死，要自动\"切回老逻辑\"或\"提示用户稍后重试\"。",
        "tags": [
          "系统架构"
        ],
        "content": [
          "限流 · 作用=限制每秒最多 N 个请求 · 触发场景=秒杀活动、API 被刷",
          "降级 · 作用=主动关掉非核心功能 · 触发场景=大促关推荐、保核心",
          "熔断 · 作用=下游服务挂了，上游自动断开 · 触发场景=企学宝接口超时 → 代理商平台停止调用",
          "[本公司]场景：第三方系统对接必须设计熔断——如果企学宝接口挂了 30 秒，代理商平台不能卡死，要自动\"切回老逻辑\"或\"提示用户稍后重试\"。"
        ],
        "section": "4. 高可用与高并发（PM 必懂的\"系统健壮性\"）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-4-3-监控告警",
        "title": "监控告警（\"线上出问题能第一时间发现\"）",
        "summary": "① Metrics（指标）：QPS、延迟、错误率、CPU 内存",
        "tags": [
          "系统架构"
        ],
        "content": [
          "3 大监控支柱：",
          "① Metrics（指标）：QPS、延迟、错误率、CPU 内存",
          "② Logs（日志）：请求链路、错误堆栈",
          "③ Traces（链路追踪）：一次请求经过哪些服务、各花了多少时间"
        ],
        "pmApplication": [
          "上线后必问\"监控接好了吗\"——没监控就是\"盲飞\"。"
        ],
        "section": "4. 高可用与高并发（PM 必懂的\"系统健壮性\"）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-5-1-认证-vs-授权",
        "title": "认证 vs 授权",
        "summary": "认证（Authentication） · 回答什么=你是谁？ · [本公司]组件=飞书 OAuth、用户名密码",
        "tags": [
          "系统架构"
        ],
        "content": [
          "认证（Authentication） · 回答什么=你是谁？ · [本公司]组件=飞书 OAuth、用户名密码",
          "授权（Authorization） · 回答什么=你能做什么？ · [本公司]组件=RBAC 角色权限、数据权限",
          "审计（Audit） · 回答什么=你做了什么？ · [本公司]组件=操作日志、登录日志"
        ],
        "section": "5. 安全架构（PM 容易忽略的\"红线\"）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-5-2-常见攻击与防御",
        "title": "常见攻击与防御（PM 知道术语即可）",
        "summary": "SQL 注入：参数化查询、ORM",
        "tags": [
          "系统架构",
          "PM"
        ],
        "content": [
          "SQL 注入：参数化查询、ORM",
          "XSS：输入过滤、输出编码",
          "CSRF：Token 验证、SameSite Cookie",
          "DDoS：CDN、高防 IP、限流",
          "数据泄露：字段加密、脱敏、最小权限"
        ],
        "pmApplication": [
          "To B 系统的数据安全是\"必答题\"——尤其涉及客户档案、培训记录、订单数据。PRD 里要明确\"敏感字段加密\"、\"权限最小化\"、\"操作留痕\"。"
        ],
        "section": "5. 安全架构（PM 容易忽略的\"红线\"）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-6-云原生与运维",
        "title": "6. 云原生与运维（PM 知道就行）",
        "summary": "容器化（Docker）：应用打包成镜像，\"一处构建处处运行\"（[本公司]后端服务已容器化）",
        "tags": [
          "系统架构",
          "PM"
        ],
        "content": [
          "容器化（Docker）：应用打包成镜像，\"一处构建处处运行\"（[本公司]后端服务已容器化）",
          "K8s：容器编排系统，\"自动部署 + 自动伸缩\"（部分核心服务在 K8s）",
          "CI/CD：持续集成/持续部署，\"代码提交后自动测试自动上\"（[本公司]已有 CI/CD 流水线）",
          "IaC：基础设施即代码，\"服务器配置写成脚本可追溯\"（部分使用 Terraform）",
          "Serverless：\"不用管服务器，写函数就行\"（还未使用）"
        ],
        "pmApplication": [
          "写非功能需求时——\"环境一致性\"（本地跑通 ≠ 测试环境跑通 ≠ 生产跑通）需要 CI/CD 保证；\"弹性伸缩\"是云原生的核心价值。"
        ],
        "section": "6. 云原生与运维（PM 知道就行）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article",
        "terms": [
          {
            "term": "容器化（Docker）",
            "meaning": "应用打包成镜像，\"一处构建处处运行\"",
            "explain": "应用打包成镜像，\"一处构建处处运行\"",
            "loc": "[本公司]后端服务已容器化",
            "case": ""
          },
          {
            "term": "K8s",
            "meaning": "容器编排系统，\"自动部署 + 自动伸缩\"",
            "explain": "容器编排系统，\"自动部署 + 自动伸缩\"",
            "loc": "部分核心服务在 K8s",
            "case": ""
          },
          {
            "term": "CI/CD",
            "meaning": "持续集成/持续部署，\"代码提交后自动测试自动上\"",
            "explain": "持续集成/持续部署，\"代码提交后自动测试自动上\"",
            "loc": "[本公司]已有 CI/CD 流水线",
            "case": ""
          },
          {
            "term": "IaC",
            "meaning": "基础设施即代码，\"服务器配置写成脚本可追溯\"",
            "explain": "基础设施即代码，\"服务器配置写成脚本可追溯\"",
            "loc": "部分使用 Terraform",
            "case": ""
          },
          {
            "term": "Serverless",
            "meaning": "\"不用管服务器，写函数就行\"",
            "explain": "\"不用管服务器，写函数就行\"",
            "loc": "还未使用",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-system-architecture-7-1-云-边-端架构",
        "title": "云-边-端架构",
        "summary": "┌──────────┐         ┌──────────┐         ┌──────────┐\n│   云端    │  4G/WiFi │  边缘端   │  局域网  │   设备端  │\n│ ([本公司]云) │ ←──",
        "tags": [
          "系统架构"
        ],
        "content": [
          "┌──────────┐         ┌──────────┐         ┌──────────┐\n│   云端    │  4G/WiFi │  边缘端   │  局域网  │   设备端  │\n│ ([本公司]云) │ ←────→  │(机器人本体)│ ←────→ │(传感器)  │\n└──────────┘         └──────────┘         └──────────┘\n   ↑                                              ↑\n   业务平台                                   实时控制\n   (代理商平台)                               (低延迟要求)\n   - 用户管理                                 - SLAM\n   - 订单/工单                                - 避障\n   - 数据分析                                 - 运动控制\n   - 报表                                     - 紧急制动",
          "设备端 · 延迟要求=< 10ms · [本公司]组件=实时避障、紧急制动",
          "边缘端（机器人本体） · 延迟要求=< 100ms · [本公司]组件=SLAM、路径规划",
          "云端 · 延迟要求=< 1s · [本公司]组件=业务平台、报表、OTA"
        ],
        "pmApplication": [
          "实时性需求必须明确放哪一层——\"机器人撞到障碍物要立刻停下\"是设备端的事，不能依赖云端。"
        ],
        "section": "7. 机器人/IoT 系统特有架构（[本公司]专属）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-7-2-ota-空中升级架构",
        "title": "OTA 空中升级架构",
        "summary": "代理商平台(运营管理)\n       ↓ 生成升级包\nCDN 分发\n       ↓ 下载\n机器人(边缘端)\n       ↓ 校验 + 备份旧版\n       ↓ 应用新版\n       ↓ 失败回滚\n       ↓ 上报结果\n代理商平",
        "tags": [
          "系统架构",
          "OTA"
        ],
        "content": [
          "代理商平台(运营管理)\n       ↓ 生成升级包\nCDN 分发\n       ↓ 下载\n机器人(边缘端)\n       ↓ 校验 + 备份旧版\n       ↓ 应用新版\n       ↓ 失败回滚\n       ↓ 上报结果\n代理商平台(状态监控)",
          "PM 视角 3 个关键点：",
          "灰度发布：先 5% → 20% → 50% → 100%（每档观察 1-2 天）",
          "失败回滚：升级失败 30 秒内自动回到旧版（蓝绿部署）",
          "升级窗口：默认 4 集群分时（国内/新加坡 22:00，德国次日 14:00，美国次日 11:00）"
        ],
        "section": "7. 机器人/IoT 系统特有架构（[本公司]专属）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-7-3-机器人数据流",
        "title": "机器人数据流（时序数据 + 业务数据双轨）",
        "summary": "数据类型=时序数据 · 来源=机器人传感器、运行状态 · 存储=时序 DB（InfluxDB/TDengine） · 用途=实时监控、故障诊断",
        "tags": [
          "系统架构"
        ],
        "content": [
          "数据类型=时序数据 · 来源=机器人传感器、运行状态 · 存储=时序 DB（InfluxDB/TDengine） · 用途=实时监控、故障诊断",
          "数据类型=业务数据 · 来源=订单、工单、CRM · 存储=关系 DB · 用途=业务流转",
          "数据类型=地图数据 · 来源=SLAM 建图 · 存储=专用地图服务 · 用途=导航",
          "数据类型=视频/图像 · 来源=摄像头、深度相机 · 存储=对象存储 · 用途=巡检、清洁效果检测"
        ],
        "pmApplication": [
          "\"机器人数据存储\"是个跨多存储的复杂架构——PM 提需求时要知道\"清洁报告里的地图图片从对象存储拉\"。"
        ],
        "section": "7. 机器人/IoT 系统特有架构（[本公司]专属）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-8-1-系统演进的-5-个阶段",
        "title": "系统演进的 5 个阶段",
        "summary": "代理商平台：阶段 1-2（模块化单体）",
        "tags": [
          "系统架构"
        ],
        "content": [
          "阶段 1：单体 (Monolith)\n   ↓ 用户>10万\n阶段 2：模块化单体\n   ↓ 团队>50人\n阶段 3：微服务\n   ↓ 流量>100万QPS\n阶段 4：服务网格（Service Mesh）\n   ↓ 全球化部署\n阶段 5：云原生 + Serverless",
          "[本公司]现状：",
          "代理商平台：阶段 1-2（模块化单体）",
          "[本公司]云：阶段 2-3（部分服务已拆）",
          "机器人本体：阶段 2（边缘端轻量化服务）"
        ],
        "section": "8. 架构演进路径（PM 视角的\"技术债\"认知）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-8-2-技术债识别",
        "title": "技术债识别（PM 怎么判断\"系统是不是要重构\"）",
        "summary": "技术债 = 现在偷的懒 = 未来要还的债",
        "tags": [
          "系统架构",
          "PM"
        ],
        "content": [
          "技术债 = 现在偷的懒 = 未来要还的债",
          "4 大信号：",
          "1. 改一个需求要 3 倍时间（\"这功能本来 1 天能做完，现在要 3 天\"）",
          "2. 每次发版都有\"连锁反应\"（\"我改 A 模块，B 模块崩了\"）",
          "3. 新人看不懂代码（\"老员工不解释就改不动\"）",
          "4. 线上事故频发（\"每周都有 P 级故障\"）"
        ],
        "pmApplication": [
          "当技术债信号出现时，主动提\"技术债偿还 Sprint\"——不然业务会越来越慢。"
        ],
        "section": "8. 架构演进路径（PM 视角的\"技术债\"认知）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-9-1-c4-模型",
        "title": "C4 模型（4 个层次的架构图）",
        "summary": "PM 必会画前 2 层——评审会上能用一张 Context 图让所有人\"对齐\"。",
        "tags": [
          "系统架构"
        ],
        "content": [
          "Context（系统上下文） · 回答什么=系统在更大的世界里和谁互动 · 受众=所有人",
          "Container（容器） · 回答什么=系统由哪些\"大块\"组成（Web/DB/Service） · 受众=研发、PM",
          "Component（组件） · 回答什么=每个容器内部由哪些模块组成 · 受众=研发",
          "Code（代码） · 回答什么=具体的类、函数 · 受众=研发",
          "PM 必会画前 2 层——评审会上能用一张 Context 图让所有人\"对齐\"。"
        ],
        "section": "9. 架构图绘制（PM 必会的\"沟通工具\"）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-9-2-本公司-云系统-context-图",
        "title": "[本公司]云系统 Context 图（示例）",
        "summary": "[本公司]云（代理商平台）\n                              │\n        ┌─────────────────────┼─────────────────────┐\n        │           ",
        "tags": [
          "系统架构"
        ],
        "content": [
          "[本公司]云（代理商平台）\n                              │\n        ┌─────────────────────┼─────────────────────┐\n        │                     │                     │\n    终端用户                内部用户              外部系统\n   (代理商)              (销售/客服)            (企学宝/CRM)\n        │                     │                     │\n        └───── 飞书 OAuth 登录 ─────────────────────┘\n                              │\n                         对象存储(OSS)\n                         数据库(MySQL)\n                         缓存(Redis)"
        ],
        "section": "9. 架构图绘制（PM 必会的\"沟通工具\"）",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-10-pm-必会的-10-个架构问题",
        "title": "10. PM 必会的 10 个架构问题",
        "summary": "评审会上被研发问\"这个需求怎么做\"时，能答出这些 = 入门",
        "tags": [
          "系统架构",
          "PM"
        ],
        "content": [
          "评审会上被研发问\"这个需求怎么做\"时，能答出这些 = 入门",
          "数据存在哪？：\"就存起来啊\"",
          "同步还是异步？：\"都行\"",
          "能扛多少 QPS？：\"应该挺多的\"",
          "延迟要求是？：\"快点就行\"",
          "一致性要求？：\"别出错\"",
          "触发频率？：\"用户点就触发\"",
          "失败怎么兜底？：\"应该不会失败\"",
          "数据量预估？：\"几千条吧\"",
          "谁来维护？：\"开发吧\"",
          "上线标准？：\"做完就上\"",
          "正确答案模板：",
          "1. 数据存在 MySQL 主库 + Redis 缓存",
          "2. 异步推送（Kafka 消息队列）",
          "3. 预估 QPS 1000（早高峰 + 晚高峰）",
          "4. 同步接口 P99 < 200ms，异步任务 < 5min",
          "5. 最终一致即可（允许 1 分钟内同步）",
          "6. 用户主动触发 + 定时（每天 9:00）",
          "7. 接口失败重试 3 次 + 兜底页提示",
          "8. 日均新增 1 万条，3 年保留",
          "9. 研发 + 运维共同维护（oncall 轮值）",
          "10. 灰度 1% → 10% → 100%，监控告警接好"
        ],
        "section": "10. PM 必会的 10 个架构问题",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-system-architecture-11-关联文件-推荐阅读",
        "title": "11. 关联文件 / 推荐阅读",
        "summary": "基础术语：行业通用词语.md → 第一部分（云服务模式 / SaaS 指标）",
        "tags": [
          "系统架构"
        ],
        "content": [
          "基础术语：行业通用词语.md → 第一部分（云服务模式 / SaaS 指标）",
          "业务流程：工作流程.md → PRD 模板 + 需求处理 7 步",
          "PM 视角：产品经理八股.md → SLA / SLO / SLI / 上线规则",
          "机器人特有：daily-log.md → ROS 2.0（6/28 推送）"
        ],
        "section": "11. 关联文件 / 推荐阅读",
        "sourceId": "system-architecture",
        "sourceLabel": "系统架构",
        "kind": "article"
      },
      {
        "id": "kb-industry-terms-1-1-云服务模式",
        "title": "云服务模式（4 种 X as a Service）",
        "summary": "记忆口诀：IaaS 卖算力 / PaaS 卖平台 / SaaS 卖软件 / HaaS 卖硬件",
        "tags": [
          "行业通用词语"
        ],
        "content": [
          "记忆口诀：IaaS 卖算力 / PaaS 卖平台 / SaaS 卖软件 / HaaS 卖硬件",
          "IaaS：Infrastructure as a Service 基础设施即服务 — 卖\"服务器/存储/网络\"等底层资源",
          "PaaS：Platform as a Service 平台即服务 — 卖\"开发平台/中间件\"，让开发者专注业务",
          "SaaS：Software as a Service 软件即服务 — 卖\"成品软件订阅\"，客户按月/年付费，厂商统一部署升级",
          "HaaS：Hardware as a Service 硬件即服务 — 卖\"硬件订阅\"，客户按月付使用费，所有权不转移，运维打包",
          "【本公司的\"云服务\"地图】",
          "IaaS · [本公司]对应=阿里云、华为云 · 说明=别人做的，本公司租用",
          "PaaS · [本公司]对应=阿里云函数计算 · 说明=别人做的",
          "SaaS（外部） · [本公司]对应=企学宝、飞书、Salesforce · 说明=本公司订阅使用",
          "SaaS（自研） · [本公司]对应=X 培训平台（bizlearnify.com） · 说明=[本公司]自己做的多租户 SaaS",
          "HaaS（未来） · [本公司]对应=配送机器人按月租 · 说明=未来方向，订阅制 + 服务打包",
          "本地软件 · [本公司]对应=代理商平台、运营管理平台 · 说明=[本公司]自研，未来可 SaaS 化"
        ],
        "cases": [
          "IaaS：AWS EC2、阿里云 ECS",
          "PaaS：Heroku、阿里云函数计算",
          "SaaS：飞书、钉钉、Salesforce、企学宝",
          "HaaS：配送机器人按月租、医疗 CT 按扫描次数付、打印机按张数付"
        ],
        "section": "第一部分：技术架构",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article",
        "terms": [
          {
            "term": "IaaS",
            "meaning": "Infrastructure as a Service 基础设施即服务",
            "explain": "卖\"服务器/存储/网络\"等底层资源",
            "loc": "",
            "case": "AWS EC2、阿里云 ECS"
          },
          {
            "term": "PaaS",
            "meaning": "Platform as a Service 平台即服务",
            "explain": "卖\"开发平台/中间件\"，让开发者专注业务",
            "loc": "",
            "case": "Heroku、阿里云函数计算"
          },
          {
            "term": "SaaS",
            "meaning": "Software as a Service 软件即服务",
            "explain": "卖\"成品软件订阅\"，客户按月/年付费，厂商统一部署升级",
            "loc": "",
            "case": "飞书、钉钉、Salesforce、企学宝"
          },
          {
            "term": "HaaS",
            "meaning": "Hardware as a Service 硬件即服务",
            "explain": "卖\"硬件订阅\"，客户按月付使用费，所有权不转移，运维打包",
            "loc": "",
            "case": "配送机器人按月租、医疗 CT 按扫描次数付、打印机按张数付"
          }
        ]
      },
      {
        "id": "kb-industry-terms-1-2-saas-关键指标",
        "title": "SaaS 关键指标",
        "summary": "ARR：Annual Recurring Revenue（年度经常性收入）",
        "tags": [
          "行业通用词语"
        ],
        "content": [
          "ARR：Annual Recurring Revenue（年度经常性收入）",
          "MRR：Monthly Recurring Revenue（月度经常性收入）",
          "Churn Rate：流失率（客户停用比例）",
          "LTV：Life-Time Value（客户生命周期价值）",
          "CAC：Customer Acquisition Cost（客户获取成本）",
          "NRR：Net Revenue Retention（净收入留存率（>100% 才是好 SaaS））"
        ],
        "section": "第一部分：技术架构",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article",
        "terms": [
          {
            "term": "ARR",
            "meaning": "Annual Recurring Revenue",
            "explain": "Annual Recurring Revenue",
            "loc": "年度经常性收入",
            "case": ""
          },
          {
            "term": "MRR",
            "meaning": "Monthly Recurring Revenue",
            "explain": "Monthly Recurring Revenue",
            "loc": "月度经常性收入",
            "case": ""
          },
          {
            "term": "Churn Rate",
            "meaning": "流失率",
            "explain": "流失率",
            "loc": "客户停用比例",
            "case": ""
          },
          {
            "term": "LTV",
            "meaning": "Life-Time Value",
            "explain": "Life-Time Value",
            "loc": "客户生命周期价值",
            "case": ""
          },
          {
            "term": "CAC",
            "meaning": "Customer Acquisition Cost",
            "explain": "Customer Acquisition Cost",
            "loc": "客户获取成本",
            "case": ""
          },
          {
            "term": "NRR",
            "meaning": "Net Revenue Retention",
            "explain": "Net Revenue Retention",
            "loc": "净收入留存率（>100% 才是好 SaaS）",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-industry-terms-1-3-saas-pm-特有设计点",
        "title": "SaaS PM 特有设计点",
        "summary": "多租户：一套服务服务多客户，租户间数据隔离",
        "tags": [
          "行业通用词语",
          "PM"
        ],
        "content": [
          "多租户：一套服务服务多客户，租户间数据隔离",
          "订阅计费：按月/年/用量/超额付费（不是一次性买断）",
          "API 开放：客户要集成，必须开放",
          "租户级配置：皮肤、品牌、字段可按租户配置（不写死）",
          "向后兼容：升级不能影响老客户",
          "SLA 承诺：99.9% 可用率是常见的，要写入合同",
          "数据导出：客户要能带走数据（防锁定）"
        ],
        "section": "第一部分：技术架构",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article"
      },
      {
        "id": "kb-industry-terms-1-4-多租户3-种模式",
        "title": "多租户（Multi-Tenancy）3 种模式",
        "summary": "X 培训平台用的是子站点 + 共享数据库模式（每个子站点 = 一个租户），4 个子站点隔离。",
        "tags": [
          "行业通用词语"
        ],
        "content": [
          "共享数据库 + tenant_id 区分 · 隔离级别=低 · 成本=低 · 适合场景=中小型 SaaS",
          "共享数据库 + 独立 schema · 隔离级别=中 · 成本=中 · 适合场景=中型 SaaS",
          "独立数据库 · 隔离级别=高 · 成本=高 · 适合场景=大客户/金融/医疗",
          "X 培训平台用的是子站点 + 共享数据库模式（每个子站点 = 一个租户），4 个子站点隔离。"
        ],
        "section": "第一部分：技术架构",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article"
      },
      {
        "id": "kb-industry-terms-1-5-产品标准化术语",
        "title": "产品标准化术语",
        "summary": "SPU：Standard Product Unit 标准化产品单元 — 产品的\"概念集合\"，描述\"这是一类什么产品\"",
        "tags": [
          "行业通用词语"
        ],
        "content": [
          "SPU：Standard Product Unit 标准化产品单元 — 产品的\"概念集合\"，描述\"这是一类什么产品\"",
          "SKU：Stock Keeping Unit 库存计量单元 — 产品的\"具体一箱/一台\"，带具体属性",
          "BOM：Bill of Materials 物料清单 — 产品所需的全部零部件及数量",
          "ECN：Engineering Change Notice 工程变更通知 — 产品设计/工艺的变更通知",
          "【SPU vs SKU 关键差异】",
          "SPU = 产品的\"型号\"（粗颗粒度） — 跨代升级",
          "SKU = 产品的\"具体一箱/一台\"（细颗粒度，带属性） — 同代内属性变化",
          "颗粒度 · SPU=粗 · SKU=细",
          "变化频率 · SPU=季度/年级 · SKU=一次发布会新增几十个",
          "颗粒度增长 · SPU=加法 · SKU=乘法（颜色×尺码×容量 = 大量 SKU）",
          "用途 · SPU=营销/规划 · SKU=仓储/销售/库存",
          "【PM 设计原则】",
          "SPU 控制在 5-15 个，单 SPU 下 SKU 控制在 20-50 个",
          "选 3-5 个关键属性（颜色、尺寸、容量、版本），不要 10 个",
          "SKU 4 个生命周期：新品期 / 主销期 / 滞销期 / 退市期",
          "SPU/SKU/库存/订单/财务 5 套数据实时同步（否则对账灾难）"
        ],
        "cases": [
          "SPU：[本公司]\"欢乐送\"是 1 个 SPU；iPhone 16 Pro 是 1 个 SPU",
          "SKU：欢乐送-标准版/欢乐送-Pro-带顶视-白色 = 2 个 SKU",
          "BOM：机器人 BOM：主板+激光雷达+轮组+...",
          "ECN：\"这款机器人主板 V2.0 发出 ECN\""
        ],
        "section": "第一部分：技术架构",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article",
        "terms": [
          {
            "term": "SPU",
            "meaning": "Standard Product Unit 标准化产品单元",
            "explain": "产品的\"概念集合\"，描述\"这是一类什么产品\"",
            "loc": "",
            "case": "[本公司]\"欢乐送\"是 1 个 SPU；iPhone 16 Pro 是 1 个 SPU"
          },
          {
            "term": "SKU",
            "meaning": "Stock Keeping Unit 库存计量单元",
            "explain": "产品的\"具体一箱/一台\"，带具体属性",
            "loc": "",
            "case": "欢乐送-标准版/欢乐送-Pro-带顶视-白色 = 2 个 SKU"
          },
          {
            "term": "BOM",
            "meaning": "Bill of Materials 物料清单",
            "explain": "产品所需的全部零部件及数量",
            "loc": "",
            "case": "机器人 BOM：主板+激光雷达+轮组+..."
          },
          {
            "term": "ECN",
            "meaning": "Engineering Change Notice 工程变更通知",
            "explain": "产品设计/工艺的变更通知",
            "loc": "",
            "case": "\"这款机器人主板 V2.0 发出 ECN\""
          }
        ]
      },
      {
        "id": "kb-industry-terms-amr",
        "title": "AMR",
        "summary": "Autonomous Mobile Robot 自主移动机器人",
        "tags": [
          "行业通用词语",
          "AMR"
        ],
        "content": [
          "Autonomous Mobile Robot 自主移动机器人",
          "参见：本公司的配送机器人属于 AMR"
        ],
        "section": "第三部分：机器人/配送行业",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "term",
        "terms": [
          {
            "term": "AMR",
            "meaning": "Autonomous Mobile Robot 自主移动机器人",
            "explain": "Autonomous Mobile Robot 自主移动机器人",
            "loc": "本公司的配送机器人属于 AMR",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-industry-terms-slam",
        "title": "SLAM",
        "summary": "Simultaneous Localization and Mapping 即时定位与地图构建",
        "tags": [
          "行业通用词语",
          "SLAM"
        ],
        "content": [
          "Simultaneous Localization and Mapping 即时定位与地图构建",
          "参见：机器人自主导航的核心技术"
        ],
        "section": "第三部分：机器人/配送行业",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "term",
        "terms": [
          {
            "term": "SLAM",
            "meaning": "Simultaneous Localization and Mapping 即时定位与地图构建",
            "explain": "Simultaneous Localization and Mapping 即时定位与地图构建",
            "loc": "机器人自主导航的核心技术",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-industry-terms-ros",
        "title": "ROS",
        "summary": "Robot Operating System 机器人操作系统",
        "tags": [
          "行业通用词语",
          "ROS"
        ],
        "content": [
          "Robot Operating System 机器人操作系统",
          "参见：机器人软件开发框架"
        ],
        "section": "第三部分：机器人/配送行业",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "term",
        "terms": [
          {
            "term": "ROS",
            "meaning": "Robot Operating System 机器人操作系统",
            "explain": "Robot Operating System 机器人操作系统",
            "loc": "机器人软件开发框架",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-industry-terms-ota",
        "title": "OTA",
        "summary": "Over-The-Air 空中升级",
        "tags": [
          "行业通用词语",
          "OTA"
        ],
        "content": [
          "Over-The-Air 空中升级",
          "参见：远程推送软件更新"
        ],
        "section": "第三部分：机器人/配送行业",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "term",
        "terms": [
          {
            "term": "OTA",
            "meaning": "Over-The-Air 空中升级",
            "explain": "Over-The-Air 空中升级",
            "loc": "远程推送软件更新",
            "case": ""
          }
        ]
      }
    ]
  },
  {
    "id": "business",
    "title": "业务管理",
    "description": "ERP / CRM / SCM / OA / IPD 等业务系统认知",
    "icon": "▣",
    "items": [
      {
        "id": "kb-industry-terms-2-1-erp",
        "title": "ERP（Enterprise Resource Planning 企业资源计划）",
        "summary": "定义：整合企业核心业务（财务/采购/库存/生产/销售/人力）的管理系统，让数据一处录入、处处可用。",
        "tags": [
          "行业通用词语",
          "ERP"
        ],
        "content": [
          "定义：整合企业核心业务（财务/采购/库存/生产/销售/人力）的管理系统，让数据一处录入、处处可用。",
          "关键特征：",
          "🏢 企业级：服务整个公司",
          "🔗 高度集成：财务+采购+库存+生产+销售+人力一套系统",
          "💾 统一数据库：所有模块共享数据源",
          "🔄 流程自动化：跨部门流程自动触发",
          "📊 实时报表：业务数据实时汇总",
          "经典 ERP 8 大模块",
          "💡 记忆口诀：「财采销存、生人客供」",
          "财务 · 管什么=总账、应收应付、固定资产、报表 · [本公司]场景类比=[本公司]财务系统",
          "采购 · 管什么=采购申请、订单、收货、付款 · [本公司]场景类比=物料采购",
          "销售 · 管什么=报价、订单、发货、回款 · [本公司]场景类比=代理商订单",
          "库存 · 管什么=入库、出库、盘点、调拨 · [本公司]场景类比=运营管理平台-调拨维保",
          "生产 · 管什么=BOM、工单、生产排程、车间管理 · [本公司]场景类比=机器人装配线",
          "人力 · 管什么=员工档案、考勤、薪资、绩效 · [本公司]场景类比=HR 系统",
          "CRM · 管什么=客户、商机、合同、售后 · [本公司]场景类比=代理商/客户管理",
          "供应链 · 管什么=物流、仓储、供应商 · [本公司]场景类比=物流系统",
          "本公司的\"轻量级 ERP 生态\"（用自研 + 多个 SaaS 组合）：",
          "经典 ERP 模块=销售 · [本公司]自研系统=代理商平台 · 状态=✅ 已落地",
          "经典 ERP 模块=库存 · [本公司]自研系统=运营管理平台-调拨 · 状态=✅ 已优化（V3.5.0）",
          "经典 ERP 模块=维保 · [本公司]自研系统=运营管理平台-维保 · 状态=✅ 已落地",
          "经典 ERP 模块=财务 · [本公司]自研系统=[本公司]财务系统 · 状态=✅ 独立系统",
          "经典 ERP 模块=生产 · [本公司]自研系统=[本公司] MES/装配线 · 状态=✅ 独立系统",
          "经典 ERP 模块=培训 · [本公司]自研系统=企学宝（外部 SaaS） · 状态=⏳ 对接中（6.17 上线）",
          "经典 ERP 模块=CRM · [本公司]自研系统=代理商平台-CRM · 状态=✅ 已落地",
          "经典 ERP 模块=OA · [本公司]自研系统=飞书审批 + OA 调拨单 · 状态=✅ 已落地",
          "经典 ERP 模块=BI · [本公司]自研系统=数据看板（自研） · 状态=✅ 已有雏形",
          "主流 ERP 产品：",
          "国际顶级 · 产品=SAP S/4HANA、Oracle ERP Cloud · 适合=500 强",
          "国际中端 · 产品=Microsoft Dynamics 365、Infor · 适合=跨国企业",
          "国内老牌 · 产品=用友 U9/NC Cloud、金蝶云·星瀚 · 适合=中大型企业",
          "云 ERP 新势力 · 产品=Workday、NetSuite · 适合=中型企业",
          "开源/低成本 · 产品=Odoo、ERPNext · 适合=中小企业",
          "行业垂直 · 产品=明源云（地产）、蓝凌 OA · 适合=单一行业"
        ],
        "section": "第二部分：业务管理",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article"
      },
      {
        "id": "kb-industry-terms-2-2-crm",
        "title": "CRM（Customer Relationship Management 客户关系管理）",
        "summary": "管理企业与客户关系的系统和方法",
        "tags": [
          "行业通用词语",
          "CRM"
        ],
        "content": [
          "管理企业与客户关系的系统和方法"
        ],
        "cases": [
          "代理商平台对接 CRM，实现客户信息统一管理"
        ],
        "section": "第二部分：业务管理",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article"
      },
      {
        "id": "kb-industry-terms-2-3-scm",
        "title": "SCM（Supply Chain Management 供应链管理）",
        "summary": "SCM（Supply Chain Management 供应链管理）",
        "tags": [
          "行业通用词语",
          "SCM"
        ],
        "content": [
          "机器人配件和维修备件管理"
        ],
        "section": "第二部分：业务管理",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article"
      },
      {
        "id": "kb-industry-terms-2-4-oa",
        "title": "OA（Office Automation 办公自动化）",
        "summary": "流程审批、文档管理、协同办公",
        "tags": [
          "行业通用词语",
          "OA"
        ],
        "content": [
          "流程审批、文档管理、协同办公",
          "[本公司]用飞书审批 + OA 调拨单"
        ],
        "section": "第二部分：业务管理",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article"
      },
      {
        "id": "kb-industry-terms-2-5-ipd",
        "title": "IPD（Integrated Product Development 集成产品开发）",
        "summary": "一套产品开发流程和方法论，强调跨部门协作、异步开发、结构化流程",
        "tags": [
          "行业通用词语",
          "IPD"
        ],
        "content": [
          "一套产品开发流程和方法论，强调跨部门协作、异步开发、结构化流程"
        ],
        "cases": [
          "华为引入 IPD 后，产品上市周期大幅缩短"
        ],
        "section": "第二部分：业务管理",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article"
      },
      {
        "id": "kb-industry-terms-2-6-bu",
        "title": "BU（Business Unit 业务单元）",
        "summary": "企业内部相对独立的业务部门/利润中心",
        "tags": [
          "行业通用词语",
          "BU"
        ],
        "content": [
          "企业内部相对独立的业务部门/利润中心"
        ],
        "cases": [
          "\"这个需求需要协调多个 BU\""
        ],
        "section": "第二部分：业务管理",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article"
      },
      {
        "id": "kb-industry-terms-2-7-服务请求类",
        "title": "服务请求类",
        "summary": "SR：Service Request 服务请求 — 客户服务请求，通常指售后问题处理",
        "tags": [
          "行业通用词语"
        ],
        "content": [
          "SR：Service Request 服务请求 — 客户服务请求，通常指售后问题处理",
          "PR：Problem Report / Pull Request — 问题报告 / 代码合并请求"
        ],
        "cases": [
          "SR：\"收到一个 SR，需要处理机器故障\"",
          "PR：研发场景指代码合并；客服场景指问题报告"
        ],
        "section": "第二部分：业务管理",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "article",
        "terms": [
          {
            "term": "SR",
            "meaning": "Service Request 服务请求",
            "explain": "客户服务请求，通常指售后问题处理",
            "loc": "",
            "case": "\"收到一个 SR，需要处理机器故障\""
          },
          {
            "term": "PR",
            "meaning": "Problem Report / Pull Request",
            "explain": "问题报告 / 代码合并请求",
            "loc": "",
            "case": "研发场景指代码合并；客服场景指问题报告"
          }
        ]
      }
    ]
  },
  {
    "id": "security",
    "title": "权限安全",
    "description": "SSO、RBAC、账号映射与安全边界",
    "icon": "◇",
    "items": [
      {
        "id": "kb-industry-terms-sso",
        "title": "SSO",
        "summary": "用户只需登录一次，即可访问所有相互信任的系统",
        "tags": [
          "行业通用词语",
          "SSO"
        ],
        "content": [
          "SSO（Single Sign-On 单点登录）",
          "用户只需登录一次，即可访问所有相互信任的系统"
        ],
        "cases": [
          "代理商用飞书账号登录代理商平台后，跳转企学宝/CRM 时无需重新登录"
        ],
        "section": "第四部分：权限与安全",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "term",
        "terms": [
          {
            "term": "SSO",
            "meaning": "Single Sign-On 单点登录",
            "explain": "用户只需登录一次，即可访问所有相互信任的系统",
            "loc": "",
            "case": "代理商用飞书账号登录代理商平台后，跳转企学宝/CRM 时无需重新登录"
          }
        ]
      },
      {
        "id": "kb-industry-terms-账号映射",
        "title": "账号映射",
        "summary": "不同系统间账号的对应关系，确保用户在一个系统登录后，其他关联系统能识别同一用户",
        "tags": [
          "行业通用词语",
          "账号映射"
        ],
        "content": [
          "账号映射（Account Mapping）",
          "不同系统间账号的对应关系，确保用户在一个系统登录后，其他关联系统能识别同一用户"
        ],
        "cases": [
          "代理商平台账号与企学宝账号的映射：国内用 SSO+手机号，海外独立对接"
        ],
        "section": "第四部分：权限与安全",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "term",
        "terms": [
          {
            "term": "账号映射",
            "meaning": "Account Mapping",
            "explain": "不同系统间账号的对应关系，确保用户在一个系统登录后，其他关联系统能识别同一用户",
            "loc": "",
            "case": "代理商平台账号与企学宝账号的映射：国内用 SSO+手机号，海外独立对接"
          }
        ]
      },
      {
        "id": "kb-industry-terms-rbac",
        "title": "RBAC",
        "summary": "按角色分配权限，用户属于某个角色，角色拥有一组权限",
        "tags": [
          "行业通用词语",
          "RBAC"
        ],
        "content": [
          "RBAC（Role-Based Access Control 基于角色的访问控制）",
          "按角色分配权限，用户属于某个角色，角色拥有一组权限"
        ],
        "cases": [
          "代理商平台的权限体系：管理员拥有全部功能权限，普通客服仅有查看工单权限"
        ],
        "section": "第四部分：权限与安全",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "term",
        "terms": [
          {
            "term": "RBAC",
            "meaning": "Role-Based Access Control 基于角色的访问控制",
            "explain": "按角色分配权限，用户属于某个角色，角色拥有一组权限",
            "loc": "",
            "case": "代理商平台的权限体系：管理员拥有全部功能权限，普通客服仅有查看工单权限"
          }
        ]
      },
      {
        "id": "kb-industry-terms-功能权限",
        "title": "功能权限",
        "summary": "决定用户能看到/操作哪些菜单、按钮",
        "tags": [
          "行业通用词语",
          "功能权限"
        ],
        "content": [
          "功能权限（能否操作某个功能）",
          "决定用户能看到/操作哪些菜单、按钮"
        ],
        "cases": [
          "代理商能看到\"工单管理\"菜单，普通客服看不到"
        ],
        "section": "第四部分：权限与安全",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "term",
        "terms": [
          {
            "term": "功能权限",
            "meaning": "能否操作某个功能",
            "explain": "决定用户能看到/操作哪些菜单、按钮",
            "loc": "",
            "case": "代理商能看到\"工单管理\"菜单，普通客服看不到"
          }
        ]
      },
      {
        "id": "kb-industry-terms-数据权限",
        "title": "数据权限",
        "summary": "决定用户能看到哪些具体数据范围",
        "tags": [
          "行业通用词语",
          "数据权限"
        ],
        "content": [
          "数据权限（能否看到某些数据）",
          "决定用户能看到哪些具体数据范围"
        ],
        "cases": [
          "区域 A 代理商只能看到自己区域的工单，看不到区域 B 的"
        ],
        "section": "第四部分：权限与安全",
        "sourceId": "industry-terms",
        "sourceLabel": "行业通用词语",
        "kind": "term",
        "terms": [
          {
            "term": "数据权限",
            "meaning": "能否看到某些数据",
            "explain": "决定用户能看到哪些具体数据范围",
            "loc": "",
            "case": "区域 A 代理商只能看到自己区域的工单，看不到区域 B 的"
          }
        ]
      }
    ]
  },
  {
    "id": "workflow",
    "title": "工作流程",
    "description": "需求处理、PRD 与上线复盘流程",
    "icon": "↻",
    "items": [
      {
        "id": "kb-workflow-1-需求接收",
        "title": "1. 需求接收",
        "summary": "来源：用户反馈 / 业务方 / 数据分析 / 竞品",
        "tags": [
          "工作流程"
        ],
        "content": [
          "来源：用户反馈 / 业务方 / 数据分析 / 竞品",
          "动作：进入需求池，标注来源和初步描述"
        ],
        "section": "需求处理 7 步流程",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "workflow-step"
      },
      {
        "id": "kb-workflow-2-需求分析",
        "title": "2. 需求分析",
        "summary": "2. 需求分析",
        "tags": [
          "工作流程"
        ],
        "content": [
          "理解业务背景和目标",
          "明确目标用户和使用场景",
          "梳理核心流程和边界",
          "评估价值和优先级"
        ],
        "section": "需求处理 7 步流程",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "workflow-step"
      },
      {
        "id": "kb-workflow-3-方案设计",
        "title": "3. 方案设计",
        "summary": "3. 方案设计",
        "tags": [
          "工作流程"
        ],
        "content": [
          "撰写 PRD",
          "制作原型/低保真",
          "确定验收标准"
        ],
        "section": "需求处理 7 步流程",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "workflow-step"
      },
      {
        "id": "kb-workflow-4-评审对齐",
        "title": "4. 评审对齐",
        "summary": "跨部门评审（研发/设计/测试）",
        "tags": [
          "工作流程"
        ],
        "content": [
          "内部评审（PM 组）",
          "跨部门评审（研发/设计/测试）",
          "确认排期和分工"
        ],
        "section": "需求处理 7 步流程",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "workflow-step"
      },
      {
        "id": "kb-workflow-5-开发跟踪",
        "title": "5. 开发跟踪",
        "summary": "5. 开发跟踪",
        "tags": [
          "工作流程"
        ],
        "content": [
          "加入需求看板",
          "跟踪开发进展",
          "处理技术疑问",
          "验收功能实现"
        ],
        "section": "需求处理 7 步流程",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "workflow-step"
      },
      {
        "id": "kb-workflow-6-上线发布",
        "title": "6. 上线发布",
        "summary": "6. 上线发布",
        "tags": [
          "工作流程"
        ],
        "content": [
          "确认上线时间",
          "准备上线文档",
          "跟踪上线效果"
        ],
        "section": "需求处理 7 步流程",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "workflow-step"
      },
      {
        "id": "kb-workflow-7-复盘总结",
        "title": "7. 复盘总结",
        "summary": "7. 复盘总结",
        "tags": [
          "工作流程"
        ],
        "content": [
          "回顾目标达成",
          "记录问题和解决方案",
          "更新知识库"
        ],
        "section": "需求处理 7 步流程",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "workflow-step"
      },
      {
        "id": "kb-workflow-prd-模板",
        "title": "PRD 模板（7 章节标准结构）",
        "summary": "# [需求名称]\n\n## 1. 背景与目的\n- 业务背景\n- 需求目的\n- 目标用户\n\n## 2. 用户故事\n- 作为...我希望...以便...\n\n## 3. 功能需求\n### 3.1 功能点 1\n- 描述\n- 业务流程\n- 验收标准\n\n",
        "tags": [
          "工作流程",
          "PRD"
        ],
        "content": [
          "# [需求名称]\n\n## 1. 背景与目的\n- 业务背景\n- 需求目的\n- 目标用户\n\n## 2. 用户故事\n- 作为...我希望...以便...\n\n## 3. 功能需求\n### 3.1 功能点 1\n- 描述\n- 业务流程\n- 验收标准\n\n### 3.2 功能点 2\n...\n\n## 4. 非功能需求\n- 性能要求\n- 安全要求\n- 兼容性\n\n## 5. 风险与依赖\n- 风险点\n- 依赖方\n\n## 6. 排期计划\n- 计划开始\n- 计划结束\n- 负责人"
        ],
        "section": "文档规范",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "prd-template"
      },
      {
        "id": "kb-workflow-prd-写作-4-原则",
        "title": "PRD 写作 4 原则",
        "summary": "1. 结构清晰：7 章节固定，方便跨人查阅",
        "tags": [
          "工作流程",
          "PRD"
        ],
        "content": [
          "1. 结构清晰：7 章节固定，方便跨人查阅",
          "2. 需求可测：每个功能点都有验收标准",
          "3. 边界明确：说清楚\"做什么\"和\"不做什么\"",
          "4. 风险可视：列清楚依赖方 + 风险点"
        ],
        "section": "文档规范",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "prd-template"
      },
      {
        "id": "kb-workflow-与研发协作",
        "title": "与研发协作",
        "summary": "对接时机：需求评审前 1 天发 PRD 预告",
        "tags": [
          "工作流程"
        ],
        "content": [
          "对接时机：需求评审前 1 天发 PRD 预告",
          "对接方式：技术方案评审会",
          "响应时效：技术疑问 24 小时内回复",
          "协作工具：飞书项目 / 多维表格"
        ],
        "section": "与各部门协作 SOP",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "collab-item"
      },
      {
        "id": "kb-workflow-与设计协作",
        "title": "与设计协作",
        "summary": "对接时机：PRD 评审通过后",
        "tags": [
          "工作流程"
        ],
        "content": [
          "对接时机：PRD 评审通过后",
          "对接方式：设计评审会 + 走查",
          "响应时效：原型 3-5 个工作日",
          "协作工具：Figma / 即时设计"
        ],
        "section": "与各部门协作 SOP",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "collab-item"
      },
      {
        "id": "kb-workflow-与测试协作",
        "title": "与测试协作",
        "summary": "对接时机：开发完成前 1 天",
        "tags": [
          "工作流程"
        ],
        "content": [
          "对接时机：开发完成前 1 天",
          "对接方式：测试用例评审会",
          "响应时效：测试用例 1 个工作日",
          "协作工具：测试用例库"
        ],
        "section": "与各部门协作 SOP",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "collab-item"
      },
      {
        "id": "kb-workflow-与业务方协作",
        "title": "与业务方协作",
        "summary": "对接时机：需求启动前对齐 + 上线前验收",
        "tags": [
          "工作流程"
        ],
        "content": [
          "对接时机：需求启动前对齐 + 上线前验收",
          "对接方式：需求宣讲会 + 验收会",
          "响应时效：业务方反馈 1 个工作日",
          "协作工具：飞书群 + 邮件"
        ],
        "section": "与各部门协作 SOP",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "collab-item"
      },
      {
        "id": "kb-workflow-日常积累",
        "title": "日常积累",
        "summary": "每天 10:00 自动推送 3 个 PM 知识点到 daily-log.md",
        "tags": [
          "工作流程"
        ],
        "content": [
          "每天 10:00 自动推送 3 个 PM 知识点到 daily-log.md",
          "每周五 18:00 复盘——把值得长期保留的知识点从 daily-log.md 迁移到对应主题文件"
        ],
        "section": "知识库管理 SOP",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "workflow-item"
      },
      {
        "id": "kb-workflow-月度整理",
        "title": "月度整理",
        "summary": "把 daily-log.md 中高频出现的术语沉淀到 行业通用词语.md",
        "tags": [
          "工作流程"
        ],
        "content": [
          "把 daily-log.md 中高频出现的术语沉淀到 行业通用词语.md",
          "把高频需求类型沉淀到本文档的\"典型需求场景\"章节"
        ],
        "section": "知识库管理 SOP",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "workflow-item"
      },
      {
        "id": "kb-workflow-知识检索",
        "title": "知识检索",
        "summary": "遇到陌生术语 → 查 行业通用词语.md",
        "tags": [
          "工作流程"
        ],
        "content": [
          "遇到陌生术语 → 查 行业通用词语.md",
          "写 PRD 前 → 查 工作流程.md（本文档）+ 产品经理八股.md",
          "跨部门沟通前 → 查 产品经理八股.md 的\"沟通协作\""
        ],
        "section": "知识库管理 SOP",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "workflow-item"
      },
      {
        "id": "kb-workflow-默认节奏",
        "title": "默认节奏",
        "summary": "每周五 18:00 推送复盘报告（USER.md 立规）",
        "tags": [
          "工作流程"
        ],
        "content": [
          "每周五 18:00 推送复盘报告（USER.md 立规）",
          "例外：重大节点冲刺/上线前，可临时提前到周四，需在 W 复盘文件里标注（MEMORY 立规 6/11）"
        ],
        "section": "复盘 SOP（W23 立规，W24 落地）",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "retro-item"
      },
      {
        "id": "kb-workflow-8-步走完",
        "title": "8 步走完",
        "summary": "1. 确认范围 — time-context 拿到本周日期范围（不要凭记忆）",
        "tags": [
          "工作流程"
        ],
        "content": [
          "1. 确认范围 — time-context 拿到本周日期范围（不要凭记忆）",
          "2. 拉日历 — calendar +agenda 拉本周所有日历事件，输出 9 个会议清单",
          "3. 拉妙记 — vc +notes --meeting-ids <id> 按会议 ID 拉智能纪要（4 份/周典型），整理关键决策和行动项",
          "4. 拉群消息 — im +chat-messages-list 拉关键群聊（对接群/方案沟通群/项目群）本周消息",
          "5. 读工作日志 — 读 memory/work/daily/{本周日期}.md 还原日常工作",
          "6. 结构化分析 — 按 11 字段组织内容（见下方\"复盘表字段\"）",
          "7. 写复盘表 — 在「个人需求管理系统」Base 的「复盘表」（table_id=tblbeEeBpcBsLfaL）按 NO.XXX 编号写入",
          "8. 关联需求 — 通过 link 字段关联本周涉及的需求 record_id（W23 关联 5 个，W24 关联 3 个）"
        ],
        "section": "复盘 SOP（W23 立规，W24 落地）",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "retro-item"
      },
      {
        "id": "kb-workflow-复盘表-11-字段",
        "title": "复盘表 11 字段（个人需求管理系统 → 复盘表）",
        "summary": "ID · 类型=auto_number · 用途=NO.001 自动递增",
        "tags": [
          "工作流程"
        ],
        "content": [
          "ID · 类型=auto_number · 用途=NO.001 自动递增",
          "复盘周期 · 类型=text · 用途=\"2026-06-08 ~ 2026-06-14\"",
          "本周完成 · 类型=text · 用途=已完成的任务/需求（多行）",
          "关键进展 · 类型=text · 用途=里程碑/评审通过/对齐完成",
          "进行中事项 · 类型=text · 用途=跨周推进的项目",
          "关键卡点 · 类型=text · 用途=问题+卡在哪+截止+负责人",
          "未考虑到的地方 · 类型=text · 用途=遗漏点+原因+教训",
          "沉淀与收获 · 类型=text · 用途=方法论/经验教训",
          "下周计划 · 类型=text · 用途=优先级最高的事项",
          "同类问题解决方案 · 类型=text · 用途=下次遇到同类怎么解决",
          "关联需求 · 类型=link → 需求表 · 用途=本周涉及的需求 record_id 列表"
        ],
        "section": "复盘 SOP（W23 立规，W24 落地）",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "retro-item"
      },
      {
        "id": "kb-workflow-复盘表写入命令模板",
        "title": "复盘表写入命令模板",
        "summary": "# 1. 准备 batch JSON\njq '{fields: [\"复盘周期\",\"本周完成\",...,\"关联需求\"], rows: [[<value1>,<value2>,...]]}' \\\n   /home/gem/.aily/workd",
        "tags": [
          "工作流程"
        ],
        "content": [
          "# 1. 准备 batch JSON\njq '{fields: [\"复盘周期\",\"本周完成\",...,\"关联需求\"], rows: [[<value1>,<value2>,...]]}' \\\n   /home/gem/.aily/workdir/w{N}_review.json \\\n   > /home/gem/.aily/workdir/w{N}_review_batch.json\n\n# 2. 批量创建\nlarksuite-cli base +record-batch-create --as user \\\n  --base-token \"QTrqbJ0wDadiZasNii5ctD61nle\" \\\n  --table-id \"tblbeEeBpcBsLfaL\" \\\n  --json \"$(cat /home/gem/.aily/workdir/w{N}_review_batch.json)\""
        ],
        "section": "复盘 SOP（W23 立规，W24 落地）",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "prd-template"
      },
      {
        "id": "kb-workflow-复盘产物-3-件套",
        "title": "复盘产物 3 件套",
        "summary": "复盘表（NO.XXX）：结构化记录，可索引、可关联",
        "tags": [
          "工作流程"
        ],
        "content": [
          "复盘表（NO.XXX）：结构化记录，可索引、可关联",
          "周复盘文件 memory/work/weekly/2026-W{N}.md：详细版，含链接、引用",
          "IM 推送摘要：用 im_message 推给用户，3 行总结 + 复盘表链接"
        ],
        "section": "复盘 SOP（W23 立规，W24 落地）",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "retro-item"
      },
      {
        "id": "kb-workflow-关联需求识别",
        "title": "关联需求识别",
        "summary": "W23 关联的 5 个需求 record_id：recviZSHCzeWNq（企学宝）/ recvln3jRpRClX（飞书消息推送）/ recXQNm2ZGlg61（CRM）/ recvln3jjA4QEM（企学宝调研）/ recgSI6",
        "tags": [
          "工作流程"
        ],
        "content": [
          "W23 关联的 5 个需求 record_id：recviZSHCzeWNq（企学宝）/ recvln3jRpRClX（飞书消息推送）/ recXQNm2ZGlg61（CRM）/ recvln3jjA4QEM（企学宝调研）/ recgSI6zYHaIoh（巡航任务）",
          "新增需求需先在「需求表」（table_id=tbl4ZqjX8c8OyQhG）创建，再在复盘表 link 字段引用",
          "复盘表写完后必须验证关联：打开 Base 链接，肉眼检查「关联需求」字段是否显示"
        ],
        "section": "复盘 SOP（W23 立规，W24 落地）",
        "sourceId": "workflow",
        "sourceLabel": "工作流程",
        "kind": "retro-item"
      }
    ]
  },
  {
    "id": "reference",
    "title": "快速参考",
    "description": "关键词速查、知识图谱与学习路径",
    "icon": "◎",
    "items": [
      {
        "id": "kb-keyword-index-a",
        "title": "A",
        "summary": "AARRR：增长黑客 5 阶段:Acquisition/Activation/Retention/Revenue/Referral（01-PM方法论/产品策划方法论.md 5. 数据层）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "AARRR：增长黑客 5 阶段:Acquisition/Activation/Retention/Revenue/Referral（01-PM方法论/产品策划方法论.md 5. 数据层）",
          "A/B 测试：同一功能做 2 个版本,看哪个数据好（01-PM方法论/产品策划方法论.md 5. 数据层）",
          "AMR：Autonomous Mobile Robot,自主移动机器人（02-技术架构/行业通用词语.md）",
          "API：Application Programming Interface,系统间对接接口（02-技术架构/系统架构.md）",
          "AIDA：营销漏斗:Attention/Interest/Desire/Action（01-PM方法论/产品策划方法论.md 1. 战略层）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "AARRR",
            "meaning": "增长黑客 5 阶段:Acquisition/Activation/Retention/Revenue/Referral",
            "explain": "增长黑客 5 阶段:Acquisition/Activation/Retention/Revenue/Referral",
            "loc": "01-PM方法论/产品策划方法论.md 5. 数据层",
            "case": ""
          },
          {
            "term": "A/B 测试",
            "meaning": "同一功能做 2 个版本,看哪个数据好",
            "explain": "同一功能做 2 个版本,看哪个数据好",
            "loc": "01-PM方法论/产品策划方法论.md 5. 数据层",
            "case": ""
          },
          {
            "term": "AMR",
            "meaning": "Autonomous Mobile Robot,自主移动机器人",
            "explain": "Autonomous Mobile Robot,自主移动机器人",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "API",
            "meaning": "Application Programming Interface,系统间对接接口",
            "explain": "Application Programming Interface,系统间对接接口",
            "loc": "02-技术架构/系统架构.md",
            "case": ""
          },
          {
            "term": "AIDA",
            "meaning": "营销漏斗:Attention/Interest/Desire/Action",
            "explain": "营销漏斗:Attention/Interest/Desire/Action",
            "loc": "01-PM方法论/产品策划方法论.md 1. 战略层",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-b",
        "title": "B",
        "summary": "BMC：Business Model Canvas,商业模式画布 9 格子（01-PM方法论/产品策划方法论.md 1. 战略层）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "BMC：Business Model Canvas,商业模式画布 9 格子（01-PM方法论/产品策划方法论.md 1. 战略层）",
          "BOM：Bill of Materials,物料清单（02-技术架构/行业通用词语.md）",
          "BRD：Business Requirements Document,商业需求文档（01-PM方法论/产品策划方法论.md 4. 设计层）",
          "BU：Business Unit,业务单元（02-技术架构/行业通用词语.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "BMC",
            "meaning": "Business Model Canvas,商业模式画布 9 格子",
            "explain": "Business Model Canvas,商业模式画布 9 格子",
            "loc": "01-PM方法论/产品策划方法论.md 1. 战略层",
            "case": ""
          },
          {
            "term": "BOM",
            "meaning": "Bill of Materials,物料清单",
            "explain": "Bill of Materials,物料清单",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "BRD",
            "meaning": "Business Requirements Document,商业需求文档",
            "explain": "Business Requirements Document,商业需求文档",
            "loc": "01-PM方法论/产品策划方法论.md 4. 设计层",
            "case": ""
          },
          {
            "term": "BU",
            "meaning": "Business Unit,业务单元",
            "explain": "Business Unit,业务单元",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-c",
        "title": "C",
        "summary": "Cohort：队列分析(同期群分析)（01-PM方法论/产品策划方法论.md 5. 数据层）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "Cohort：队列分析(同期群分析)（01-PM方法论/产品策划方法论.md 5. 数据层）",
          "CI/CD：Continuous Integration/Continuous Deployment（02-技术架构/系统架构.md 云原生章节）",
          "CRM：Customer Relationship Management,客户关系管理（02-技术架构/行业通用词语.md）",
          "CR：Change Request,变更请求（02-技术架构/行业通用词语.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "Cohort",
            "meaning": "队列分析(同期群分析)",
            "explain": "队列分析(同期群分析)",
            "loc": "01-PM方法论/产品策划方法论.md 5. 数据层",
            "case": ""
          },
          {
            "term": "CI/CD",
            "meaning": "Continuous Integration/Continuous Deployment",
            "explain": "Continuous Integration/Continuous Deployment",
            "loc": "02-技术架构/系统架构.md 云原生章节",
            "case": ""
          },
          {
            "term": "CRM",
            "meaning": "Customer Relationship Management,客户关系管理",
            "explain": "Customer Relationship Management,客户关系管理",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "CR",
            "meaning": "Change Request,变更请求",
            "explain": "Change Request,变更请求",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-d",
        "title": "D",
        "summary": "Docker：容器化技术,打包应用+依赖（02-技术架构/系统架构.md 云原生）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "Docker：容器化技术,打包应用+依赖（02-技术架构/系统架构.md 云原生）",
          "DAU：Daily Active Users,日活跃用户（01-PM方法论/产品经理八股.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "Docker",
            "meaning": "容器化技术,打包应用+依赖",
            "explain": "容器化技术,打包应用+依赖",
            "loc": "02-技术架构/系统架构.md 云原生",
            "case": ""
          },
          {
            "term": "DAU",
            "meaning": "Daily Active Users,日活跃用户",
            "explain": "Daily Active Users,日活跃用户",
            "loc": "01-PM方法论/产品经理八股.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-e",
        "title": "E",
        "summary": "ECN：Engineering Change Notice,工程变更通知（02-技术架构/行业通用词语.md）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "ECN：Engineering Change Notice,工程变更通知（02-技术架构/行业通用词语.md）",
          "ERP：Enterprise Resource Planning,企业资源计划(8 大模块)（02-技术架构/行业通用词语.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "ECN",
            "meaning": "Engineering Change Notice,工程变更通知",
            "explain": "Engineering Change Notice,工程变更通知",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "ERP",
            "meaning": "Enterprise Resource Planning,企业资源计划(8 大模块)",
            "explain": "Enterprise Resource Planning,企业资源计划(8 大模块)",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-f",
        "title": "F",
        "summary": "FSD：Functional Specifications Document,功能规格说明（01-PM方法论/产品策划方法论.md 4. 设计层）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "FSD：Functional Specifications Document,功能规格说明（01-PM方法论/产品策划方法论.md 4. 设计层）",
          "Fogg 行为模型：B=MAP,行为=动机+能力+提示（01-PM方法论/产品策划方法论.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "FSD",
            "meaning": "Functional Specifications Document,功能规格说明",
            "explain": "Functional Specifications Document,功能规格说明",
            "loc": "01-PM方法论/产品策划方法论.md 4. 设计层",
            "case": ""
          },
          {
            "term": "Fogg 行为模型",
            "meaning": "B=MAP,行为=动机+能力+提示",
            "explain": "B=MAP,行为=动机+能力+提示",
            "loc": "01-PM方法论/产品策划方法论.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-h",
        "title": "H",
        "summary": "HaaS：Hardware as a Service,硬件即服务（02-技术架构/行业通用词语.md）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "HaaS：Hardware as a Service,硬件即服务（02-技术架构/行业通用词语.md）",
          "HA：High Availability,高可用（02-技术架构/系统架构.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "HaaS",
            "meaning": "Hardware as a Service,硬件即服务",
            "explain": "Hardware as a Service,硬件即服务",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "HA",
            "meaning": "High Availability,高可用",
            "explain": "High Availability,高可用",
            "loc": "02-技术架构/系统架构.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-i",
        "title": "I",
        "summary": "IaaS：Infrastructure as a Service（02-技术架构/行业通用词语.md）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "IaaS：Infrastructure as a Service（02-技术架构/行业通用词语.md）",
          "IA：Information Architecture,信息架构（01-PM方法论/产品策划方法论.md 4. 设计层）",
          "IPD：Integrated Product Development,集成产品开发（02-技术架构/行业通用词语.md）",
          "ICE：Impact+Confidence+Ease,增长实验评分（01-PM方法论/产品策划方法论.md 3. 需求层）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "IaaS",
            "meaning": "Infrastructure as a Service",
            "explain": "Infrastructure as a Service",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "IA",
            "meaning": "Information Architecture,信息架构",
            "explain": "Information Architecture,信息架构",
            "loc": "01-PM方法论/产品策划方法论.md 4. 设计层",
            "case": ""
          },
          {
            "term": "IPD",
            "meaning": "Integrated Product Development,集成产品开发",
            "explain": "Integrated Product Development,集成产品开发",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "ICE",
            "meaning": "Impact+Confidence+Ease,增长实验评分",
            "explain": "Impact+Confidence+Ease,增长实验评分",
            "loc": "01-PM方法论/产品策划方法论.md 3. 需求层",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-j",
        "title": "J",
        "summary": "JTBD：Jobs To Be Done,待完成任务理论（01-PM方法论/产品策划方法论.md）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "JTBD：Jobs To Be Done,待完成任务理论（01-PM方法论/产品策划方法论.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "JTBD",
            "meaning": "Jobs To Be Done,待完成任务理论",
            "explain": "Jobs To Be Done,待完成任务理论",
            "loc": "01-PM方法论/产品策划方法论.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-k",
        "title": "K",
        "summary": "K8s：Kubernetes,容器编排系统（02-技术架构/系统架构.md）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "K8s：Kubernetes,容器编排系统（02-技术架构/系统架构.md）",
          "KANO 模型：3 维度需求分类:基本/期望/兴奋（01-PM方法论/产品经理八股.md）",
          "KPI：Key Performance Indicator（01-PM方法论/产品经理八股.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "K8s",
            "meaning": "Kubernetes,容器编排系统",
            "explain": "Kubernetes,容器编排系统",
            "loc": "02-技术架构/系统架构.md",
            "case": ""
          },
          {
            "term": "KANO 模型",
            "meaning": "3 维度需求分类:基本/期望/兴奋",
            "explain": "3 维度需求分类:基本/期望/兴奋",
            "loc": "01-PM方法论/产品经理八股.md",
            "case": ""
          },
          {
            "term": "KPI",
            "meaning": "Key Performance Indicator",
            "explain": "Key Performance Indicator",
            "loc": "01-PM方法论/产品经理八股.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-m",
        "title": "M",
        "summary": "MVP：Minimum Viable Product,最小可行产品（01-PM方法论/产品经理八股.md）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "MVP：Minimum Viable Product,最小可行产品（01-PM方法论/产品经理八股.md）",
          "MRD：Market Requirements Document,市场需求文档（01-PM方法论/产品策划方法论.md）",
          "MoSCoW：Must/Should/Could/Won't 优先级分桶（01-PM方法论/产品策划方法论.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "MVP",
            "meaning": "Minimum Viable Product,最小可行产品",
            "explain": "Minimum Viable Product,最小可行产品",
            "loc": "01-PM方法论/产品经理八股.md",
            "case": ""
          },
          {
            "term": "MRD",
            "meaning": "Market Requirements Document,市场需求文档",
            "explain": "Market Requirements Document,市场需求文档",
            "loc": "01-PM方法论/产品策划方法论.md",
            "case": ""
          },
          {
            "term": "MoSCoW",
            "meaning": "Must/Should/Could/Won't 优先级分桶",
            "explain": "Must/Should/Could/Won't 优先级分桶",
            "loc": "01-PM方法论/产品策划方法论.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-n",
        "title": "N",
        "summary": "NPS：Net Promoter Score,净推荐值（01-PM方法论/产品策划方法论.md 5. 数据层）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "NPS：Net Promoter Score,净推荐值（01-PM方法论/产品策划方法论.md 5. 数据层）",
          "NSM：North Star Metric,北极星指标（01-PM方法论/产品策划方法论.md 1. 战略层）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "NPS",
            "meaning": "Net Promoter Score,净推荐值",
            "explain": "Net Promoter Score,净推荐值",
            "loc": "01-PM方法论/产品策划方法论.md 5. 数据层",
            "case": ""
          },
          {
            "term": "NSM",
            "meaning": "North Star Metric,北极星指标",
            "explain": "North Star Metric,北极星指标",
            "loc": "01-PM方法论/产品策划方法论.md 1. 战略层",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-o",
        "title": "O",
        "summary": "OA：Office Automation,办公自动化（02-技术架构/行业通用词语.md）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "OA：Office Automation,办公自动化（02-技术架构/行业通用词语.md）",
          "OTA：Over The Air,空中下载升级(机器人远程升级)（02-技术架构/系统架构.md 机器人架构）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "OA",
            "meaning": "Office Automation,办公自动化",
            "explain": "Office Automation,办公自动化",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "OTA",
            "meaning": "Over The Air,空中下载升级(机器人远程升级)",
            "explain": "Over The Air,空中下载升级(机器人远程升级)",
            "loc": "02-技术架构/系统架构.md 机器人架构",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-p",
        "title": "P",
        "summary": "PaaS：Platform as a Service（02-技术架构/行业通用词语.md）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "PaaS：Platform as a Service（02-技术架构/行业通用词语.md）",
          "PDCA：Plan-Do-Check-Act,戴明环（01-PM方法论/产品策划方法论.md 6. 协作层）",
          "PMF：Product Market Fit,产品市场契合（01-PM方法论/产品经理八股.md）",
          "PRD：Product Requirements Document,产品需求文档（05-工作流程/工作流程.md PRD 模板）",
          "PR：Problem Report,问题报告（02-技术架构/行业通用词语.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "PaaS",
            "meaning": "Platform as a Service",
            "explain": "Platform as a Service",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "PDCA",
            "meaning": "Plan-Do-Check-Act,戴明环",
            "explain": "Plan-Do-Check-Act,戴明环",
            "loc": "01-PM方法论/产品策划方法论.md 6. 协作层",
            "case": ""
          },
          {
            "term": "PMF",
            "meaning": "Product Market Fit,产品市场契合",
            "explain": "Product Market Fit,产品市场契合",
            "loc": "01-PM方法论/产品经理八股.md",
            "case": ""
          },
          {
            "term": "PRD",
            "meaning": "Product Requirements Document,产品需求文档",
            "explain": "Product Requirements Document,产品需求文档",
            "loc": "05-工作流程/工作流程.md PRD 模板",
            "case": ""
          },
          {
            "term": "PR",
            "meaning": "Problem Report,问题报告",
            "explain": "Problem Report,问题报告",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-r",
        "title": "R",
        "summary": "RACI：Responsible/Accountable/Consulted/Informed 责任图（01-PM方法论/产品策划方法论.md 6. 协作层）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "RACI：Responsible/Accountable/Consulted/Informed 责任图（01-PM方法论/产品策划方法论.md 6. 协作层）",
          "RBAC：Role-Based Access Control,基于角色访问控制（02-技术架构/行业通用词语.md）",
          "RICE：Reach/Impact/Confidence/Effort 评分（01-PM方法论/产品策划方法论.md 3. 需求层）",
          "ROS：Robot Operating System,机器人操作系统（02-技术架构/行业通用词语.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "RACI",
            "meaning": "Responsible/Accountable/Consulted/Informed 责任图",
            "explain": "Responsible/Accountable/Consulted/Informed 责任图",
            "loc": "01-PM方法论/产品策划方法论.md 6. 协作层",
            "case": ""
          },
          {
            "term": "RBAC",
            "meaning": "Role-Based Access Control,基于角色访问控制",
            "explain": "Role-Based Access Control,基于角色访问控制",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "RICE",
            "meaning": "Reach/Impact/Confidence/Effort 评分",
            "explain": "Reach/Impact/Confidence/Effort 评分",
            "loc": "01-PM方法论/产品策划方法论.md 3. 需求层",
            "case": ""
          },
          {
            "term": "ROS",
            "meaning": "Robot Operating System,机器人操作系统",
            "explain": "Robot Operating System,机器人操作系统",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-s",
        "title": "S",
        "summary": "SaaS：Software as a Service（02-技术架构/行业通用词语.md）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "SaaS：Software as a Service（02-技术架构/行业通用词语.md）",
          "SCM：Supply Chain Management,供应链管理（02-技术架构/行业通用词语.md）",
          "SLAM：Simultaneous Localization and Mapping,同时定位与建图（02-技术架构/行业通用词语.md）",
          "SLA：Service Level Agreement,服务等级协议（01-PM方法论/产品经理八股.md）",
          "SKU：Stock Keeping Unit,库存单位（02-技术架构/行业通用词语.md）",
          "SPU：Standard Product Unit,标准产品单元（02-技术架构/行业通用词语.md）",
          "SR：Service Request,服务请求（02-技术架构/行业通用词语.md）",
          "SSO：Single Sign-On,单点登录（02-技术架构/行业通用词语.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "SaaS",
            "meaning": "Software as a Service",
            "explain": "Software as a Service",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "SCM",
            "meaning": "Supply Chain Management,供应链管理",
            "explain": "Supply Chain Management,供应链管理",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "SLAM",
            "meaning": "Simultaneous Localization and Mapping,同时定位与建图",
            "explain": "Simultaneous Localization and Mapping,同时定位与建图",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "SLA",
            "meaning": "Service Level Agreement,服务等级协议",
            "explain": "Service Level Agreement,服务等级协议",
            "loc": "01-PM方法论/产品经理八股.md",
            "case": ""
          },
          {
            "term": "SKU",
            "meaning": "Stock Keeping Unit,库存单位",
            "explain": "Stock Keeping Unit,库存单位",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "SPU",
            "meaning": "Standard Product Unit,标准产品单元",
            "explain": "Standard Product Unit,标准产品单元",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "SR",
            "meaning": "Service Request,服务请求",
            "explain": "Service Request,服务请求",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          },
          {
            "term": "SSO",
            "meaning": "Single Sign-On,单点登录",
            "explain": "Single Sign-On,单点登录",
            "loc": "02-技术架构/行业通用词语.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-u",
        "title": "U",
        "summary": "UAT：User Acceptance Testing,用户验收测试（01-PM方法论/产品策划方法论.md 4. 设计层）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "UAT：User Acceptance Testing,用户验收测试（01-PM方法论/产品策划方法论.md 4. 设计层）",
          "UCD：User Centered Design,以用户为中心设计（01-PM方法论/产品经理八股.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "UAT",
            "meaning": "User Acceptance Testing,用户验收测试",
            "explain": "User Acceptance Testing,用户验收测试",
            "loc": "01-PM方法论/产品策划方法论.md 4. 设计层",
            "case": ""
          },
          {
            "term": "UCD",
            "meaning": "User Centered Design,以用户为中心设计",
            "explain": "User Centered Design,以用户为中心设计",
            "loc": "01-PM方法论/产品经理八股.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-v",
        "title": "V",
        "summary": "VPC：Value Proposition Canvas,价值主张画布（01-PM方法论/产品策划方法论.md 1. 战略层）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "VPC：Value Proposition Canvas,价值主张画布（01-PM方法论/产品策划方法论.md 1. 战略层）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "VPC",
            "meaning": "Value Proposition Canvas,价值主张画布",
            "explain": "Value Proposition Canvas,价值主张画布",
            "loc": "01-PM方法论/产品策划方法论.md 1. 战略层",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-5-why",
        "title": "5 Why",
        "summary": "5Why：连续问 5 次为什么,找根因（01-PM方法论/产品策划方法论.md 6. 协作层）",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "5Why：连续问 5 次为什么,找根因（01-PM方法论/产品策划方法论.md 6. 协作层）",
          "4P / 4C：营销 4 元素(产品/价格/渠道/促销)（01-PM方法论/产品策划方法论.md）"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter",
        "terms": [
          {
            "term": "5Why",
            "meaning": "连续问 5 次为什么,找根因",
            "explain": "连续问 5 次为什么,找根因",
            "loc": "01-PM方法论/产品策划方法论.md 6. 协作层",
            "case": ""
          },
          {
            "term": "4P / 4C",
            "meaning": "营销 4 元素(产品/价格/渠道/促销)",
            "explain": "营销 4 元素(产品/价格/渠道/促销)",
            "loc": "01-PM方法论/产品策划方法论.md",
            "case": ""
          }
        ]
      },
      {
        "id": "kb-keyword-index-用法",
        "title": "用法",
        "summary": "# 找术语定义\ngrep -A 5 \"^### .* SR \" 02-技术架构/行业通用词语.md\n\n# 找方法论案例\ngrep -B 2 -A 8 \"RICE\" 01-PM方法论/产品策划方法论.md",
        "tags": [
          "关键词速查表"
        ],
        "content": [
          "# 找术语定义\ngrep -A 5 \"^### .* SR \" 02-技术架构/行业通用词语.md\n\n# 找方法论案例\ngrep -B 2 -A 8 \"RICE\" 01-PM方法论/产品策划方法论.md"
        ],
        "sourceId": "keyword-index",
        "sourceLabel": "关键词速查表",
        "kind": "glossary-letter"
      },
      {
        "id": "kb-mindmap-主图谱",
        "title": "主图谱",
        "summary": "主图谱",
        "tags": [
          "思维导图"
        ],
        "content": [
          "【知识图谱】"
        ],
        "section": "6 大主题知识图谱",
        "sourceId": "mindmap",
        "sourceLabel": "思维导图",
        "kind": "mermaid",
        "mermaid": [
          "mindmap\n  root((产品知识库<br/>v1.0))\n    1. PM 方法论\n      战略层\n        北极星指标 NSM\n        商业模式画布 BMC\n        价值主张画布 VPC\n        OKR\n        影响地图\n      用户层\n        用户画像\n        同理心地图\n        用户旅程地图 UJM\n        可用性测试\n        用户访谈\n      需求层\n        4 维度评估\n        RICE\n        MoSCoW\n        优先级矩阵\n      设计层\n        用户故事\n        IA 信息架构\n        PRD 7 章节\n        PRD 评审 Checklist\n        上线 Checklist\n      数据层\n        AARRR\n        Cohort\n        NPS\n        A/B 测试\n        增长飞轮\n      协作层\n        RACI\n        5Why\n        PDCA\n        鱼骨图\n        设计冲刺\n    2. 技术架构\n      架构基础\n        三层架构\n        单体 vs 微服务\n        前后端分离\n      关键组件\n        数据库\n        中间件\n        缓存\n      架构模式\n        多租户\n        读写分离\n        分库分表\n      高可用\n        HA\n        限流/降级/熔断\n        3 大监控\n      云原生\n        Docker\n        K8s\n        CI/CD\n      机器人特有\n        云-边-端\n        OTA\n        SLAM\n    3. 业务管理\n      企业系统\n        ERP\n        CRM\n        SCM\n        OA\n      机器人\n        AMR\n        SLAM\n        ROS\n        OTA\n      研发方法\n        IPD\n        BU\n      服务请求\n        SR\n        PR\n        CR\n    4. 权限安全\n      单点登录\n        SSO\n        OAuth 2.0\n      账号映射\n      权限控制\n        RBAC\n        功能权限\n        数据权限\n    5. 工作流程\n      需求处理 7 步\n      PRD 模板\n      跨部门协作 SOP\n      复盘 8 步\n    6. 每日学习\n      130+ 方法论\n      每天 3 个推送"
        ]
      },
      {
        "id": "kb-mindmap-4-阶段学习路径图",
        "title": "4 阶段学习路径图",
        "summary": "4 阶段学习路径图",
        "tags": [
          "思维导图"
        ],
        "content": [
          "【知识图谱】"
        ],
        "section": "6 大主题知识图谱",
        "sourceId": "mindmap",
        "sourceLabel": "思维导图",
        "kind": "mermaid",
        "mermaid": [
          "graph LR\n  A[阶段 1<br/>入门] --> B[阶段 2<br/>基础]\n  B --> C[阶段 3<br/>进阶]\n  C --> D[阶段 4<br/>实战]\n\n  A1[PM 八股<br/>30 分钟] --> A\n  A2[daily-log<br/>看 30 个] --> A\n\n  B1[产品策划<br/>6 大体系] --> B\n  B2[工作流程<br/>7 步] --> B\n\n  C1[系统架构<br/>10 题] --> C\n  C2[行业术语<br/>300+] --> C\n\n  D1[实战 owner<br/>中型需求] --> D\n  D2[跨部门协作<br/>RACI] --> D"
        ]
      },
      {
        "id": "kb-mindmap-需求处理-7-步流程",
        "title": "需求处理 7 步流程",
        "summary": "*注:Mermaid 语法可在 GitHub / VS Code / 飞书云文档直接渲染*",
        "tags": [
          "思维导图"
        ],
        "content": [
          "【知识图谱】",
          "*注:Mermaid 语法可在 GitHub / VS Code / 飞书云文档直接渲染*"
        ],
        "section": "6 大主题知识图谱",
        "sourceId": "mindmap",
        "sourceLabel": "思维导图",
        "kind": "mermaid",
        "mermaid": [
          "graph LR\n  A[1. 接收] --> B[2. 分析]\n  B --> C[3. 设计]\n  C --> D[4. 评审]\n  D --> E[5. 跟踪]\n  E --> F[6. 上线]\n  F --> G[7. 复盘]\n  G --> A"
        ]
      },
      {
        "id": "kb-learning-path-阶段-1-入门",
        "title": "阶段 1:入门(第 1-2 周)",
        "summary": "目标:能讲清楚 PM 核心 10 个概念",
        "tags": [
          "学习路径"
        ],
        "content": [
          "目标:能讲清楚 PM 核心 10 个概念",
          "【必读(共 1 小时)】",
          "[ ] 01-PM方法论/产品经理八股.md — 30 分钟通读",
          "[ ] 06-每日学习/daily-log.md — 看前 30 个方法论,每天 5 个,1 周看完",
          "【输出物】",
          "一张\"我理解的 AARRR / MVP / KANO / RICE\"手写笔记",
          "一段\"我是产品经理\"的 60 秒自我介绍(用上至少 3 个术语)",
          "【检验标准】",
          "别人问\"什么是 RICE?\",你能用 30 秒讲清楚并举例"
        ],
        "section": "4 阶段 8 周学习路径",
        "sourceId": "learning-path",
        "sourceLabel": "学习路径",
        "kind": "path-stage"
      },
      {
        "id": "kb-learning-path-阶段-2-基础",
        "title": "阶段 2:基础(第 3-4 周)",
        "summary": "目标:能独立写一份简单 PRD",
        "tags": [
          "学习路径"
        ],
        "content": [
          "目标:能独立写一份简单 PRD",
          "【必读(共 3 小时)】",
          "[ ] 01-PM方法论/产品策划方法论.md — 通读 6 大体系",
          "战略层 / 用户层(2 小时)",
          "需求层 / 设计层(1 小时)",
          "[ ] 05-工作流程/工作流程.md — 需求处理 7 步 + PRD 模板(30 分钟)",
          "【输出物】",
          "一份完整 PRD(从背景到验收标准,7 章节齐全)",
          "一份\"我做的需求\"复盘(8 步法)",
          "【检验标准】",
          "你的 PRD 能在 30 分钟内给到研发,对方不需要追问\"为什么这么做\""
        ],
        "section": "4 阶段 8 周学习路径",
        "sourceId": "learning-path",
        "sourceLabel": "学习路径",
        "kind": "path-stage"
      },
      {
        "id": "kb-learning-path-阶段-3-进阶",
        "title": "阶段 3:进阶(第 5-6 周)",
        "summary": "目标:能听懂研发的技术方案,不被术语唬住",
        "tags": [
          "学习路径"
        ],
        "content": [
          "目标:能听懂研发的技术方案,不被术语唬住",
          "【必读(共 3 小时)】",
          "[ ] 02-技术架构/系统架构.md — 重点看\"PM 必会 10 个架构问题\"(2 小时)",
          "[ ] 02-技术架构/行业通用词语.md — 全部章节速查(1 小时)",
          "【输出物】",
          "一份\"我评审过的技术方案\"5W 分析(What/Why/Who/When/How)",
          "一份\"我用的术语清单\"(≥30 个)",
          "【检验标准】",
          "评审会上,研发说\"这个用消息队列做异步解耦\",你立刻懂他在说什么"
        ],
        "section": "4 阶段 8 周学习路径",
        "sourceId": "learning-path",
        "sourceLabel": "学习路径",
        "kind": "path-stage"
      },
      {
        "id": "kb-learning-path-阶段-4-实战",
        "title": "阶段 4:实战(第 7-8 周)",
        "summary": "目标:能独立 owner 一个中型需求,跨 3 个部门",
        "tags": [
          "学习路径"
        ],
        "content": [
          "目标:能独立 owner 一个中型需求,跨 3 个部门",
          "【必做(共 4 小时学习 + 实战)】",
          "[ ] 01-PM方法论/产品策划方法论.md — 协作层(RACI / 4 原则)",
          "[ ] 实战:在工作中选 1 个中型需求,完整跑一遍 7 步流程",
          "[ ] 用 4 维度评估 / RICE 排过 1 次优先级",
          "[ ] 做过 1 次跨部门复盘",
          "【输出物】",
          "一份\"我 owner 的需求\"完整记录(背景/分析/PRD/评审/上线/复盘)",
          "一份\"我的方法论应用清单\"(≥10 个,用上的方法论)",
          "【检验标准】",
          "你的 mentor 说\"这个需求可以独立 owner\" → 入门完成 ✅"
        ],
        "section": "4 阶段 8 周学习路径",
        "sourceId": "learning-path",
        "sourceLabel": "学习路径",
        "kind": "path-stage"
      },
      {
        "id": "kb-learning-path-进阶",
        "title": "进阶(9-16 周)",
        "summary": "目标:从\"做事\"到\"做对的事\"",
        "tags": [
          "学习路径"
        ],
        "content": [
          "目标:从\"做事\"到\"做对的事\"",
          "【选读】",
          "[ ] 01-PM方法论/产品策划方法论.md — 反复看,每次有新理解",
          "[ ] 02-技术架构/系统架构.md — 配合实际项目读",
          "[ ] 06-每日学习/daily-log.md — 持续每天 3 个",
          "【输出物】",
          "一份\"我做过的 10 个需求\"复盘合集",
          "一份\"我用的方法论体系\"(3-5 个最常用)",
          "【检验标准】",
          "跨部门找你评审 → 你有\"PM 专业\"的口碑"
        ],
        "section": "4 阶段 8 周学习路径",
        "sourceId": "learning-path",
        "sourceLabel": "学习路径",
        "kind": "path-stage"
      },
      {
        "id": "kb-learning-path-3-个常见坑",
        "title": "3 个常见坑",
        "summary": "1 周想全读完：按 4 阶段走,每阶段 1-2 周",
        "tags": [
          "学习路径"
        ],
        "content": [
          "1 周想全读完：按 4 阶段走,每阶段 1-2 周",
          "知道 RICE 但没排过需求：每个方法论找 1 个工作场景用",
          "读了一堆笔记没了：每阶段必须有输出物"
        ],
        "section": "4 阶段 8 周学习路径",
        "sourceId": "learning-path",
        "sourceLabel": "学习路径",
        "kind": "path-stage"
      },
      {
        "id": "kb-learning-path-学习方法-3-句话",
        "title": "学习方法 3 句话",
        "summary": "1. 先框架,后细节 — 先看 README,再看具体章节",
        "tags": [
          "学习路径"
        ],
        "content": [
          "1. 先框架,后细节 — 先看 README,再看具体章节",
          "2. 边学边用 — 学 RICE 就立刻排一次自己手里的需求",
          "3. 写出来 — 每个方法论用 1 句话讲给非 PM 听,讲得出来才算懂",
          "*最后更新:2026-07-15*"
        ],
        "section": "4 阶段 8 周学习路径",
        "sourceId": "learning-path",
        "sourceLabel": "学习路径",
        "kind": "path-stage"
      }
    ]
  }
];

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
