import { Link, useLocation } from 'react-router-dom'
import { categories } from '../data/knowledge'
import SearchBar from './SearchBar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="logo">
            <span className="logo-mark">PDM</span>
            <span className="logo-text">Learn</span>
          </Link>
          <p className="logo-sub">产品经理学习站</p>
        </div>

        <SearchBar />

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-label">知识库</span>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className={`nav-item ${location.pathname.includes(cat.id) ? 'active' : ''}`}
              >
                <span className="nav-icon">{cat.icon}</span>
                <span className="nav-title">{cat.title}</span>
                <span className="nav-count">{cat.items.length}</span>
              </Link>
            ))}
          </div>

          <div className="nav-section">
            <span className="nav-label">我的空间</span>
            <Link
              to="/memory"
              className={`nav-item ${location.pathname === '/memory' ? 'active' : ''}`}
            >
              <span className="nav-icon">◆</span>
              <span className="nav-title">记忆与复盘</span>
            </Link>
          </div>
        </nav>

        <div className="sidebar-footer">
          <p>系统化学习 · 持续沉淀</p>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  )
}
