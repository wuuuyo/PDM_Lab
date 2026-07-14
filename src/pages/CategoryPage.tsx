import { Link, useParams } from 'react-router-dom'
import { getCategoryById } from '../data/knowledge'

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const category = getCategoryById(categoryId ?? '')

  if (!category) {
    return (
      <div className="page">
        <p>分类不存在</p>
        <Link to="/">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="page category-page">
      <header className="page-header">
        <Link to="/" className="breadcrumb">首页</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{category.title}</span>
      </header>

      <div className="category-hero">
        <span className="category-hero-icon">{category.icon}</span>
        <h1>{category.title}</h1>
        <p>{category.description}</p>
      </div>

      <div className="article-list">
        {category.items.map((item, index) => (
          <Link
            key={item.id}
            to={`/article/${category.id}/${item.id}`}
            className="article-card"
          >
            <span className="article-index">{String(index + 1).padStart(2, '0')}</span>
            <div className="article-card-body">
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <div className="article-tags">
                {item.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
            <span className="article-arrow">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
