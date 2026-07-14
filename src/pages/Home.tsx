import { Link } from 'react-router-dom'
import { categories } from '../data/knowledge'

export default function Home() {
  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0)

  return (
    <div className="page home-page">
      <header className="hero">
        <div className="hero-badge">产品经理新人指南</div>
        <h1>构建你的产品思维体系</h1>
        <p className="hero-desc">
          从方法论到面试八股，从核心技能到行业认知——
          分类清晰的知识库，助你系统化成长。配合记忆与复盘模块，让学习真正沉淀。
        </p>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-num">{categories.length}</span>
            <span className="stat-label">知识分类</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">{totalItems}</span>
            <span className="stat-label">核心知识点</span>
          </div>
        </div>
      </header>

      <section className="section">
        <h2 className="section-title">知识分类</h2>
        <div className="category-grid">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/category/${cat.id}`} className="category-card">
              <div className="category-card-icon">{cat.icon}</div>
              <h3>{cat.title}</h3>
              <p>{cat.description}</p>
              <div className="category-card-footer">
                <span>{cat.items.length} 个知识点</span>
                <span className="arrow">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <Link to="/memory" className="memory-banner">
          <div className="memory-banner-content">
            <h3>记忆与复盘</h3>
            <p>记录学习洞察、沉淀框架方法、定期复盘总结——你的个人知识资产库</p>
          </div>
          <span className="memory-banner-action">开始记录 →</span>
        </Link>
      </section>

      <section className="section">
        <h2 className="section-title">学习路径建议</h2>
        <div className="path-list">
          <div className="path-item">
            <span className="path-step">01</span>
            <div>
              <h4>夯实方法论基础</h4>
              <p>用户研究、需求分析、MVP——建立做产品的基本框架</p>
            </div>
          </div>
          <div className="path-item">
            <span className="path-step">02</span>
            <div>
              <h4>掌握面试八股</h4>
              <p>STAR 法则、竞品分析、估算题——为求职做好充分准备</p>
            </div>
          </div>
          <div className="path-item">
            <span className="path-step">03</span>
            <div>
              <h4>修炼核心技能</h4>
              <p>PRD、原型、Roadmap——将理论转化为日常产出能力</p>
            </div>
          </div>
          <div className="path-item">
            <span className="path-step">04</span>
            <div>
              <h4>拓展行业认知</h4>
              <p>B/C 端差异、商业模式、AI 产品——建立宏观视野</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
