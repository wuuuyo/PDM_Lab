import { Link, useParams } from 'react-router-dom'
import { getCategoryById, getItemById } from '../data/knowledge'

export default function ArticlePage() {
  const { categoryId, itemId } = useParams<{ categoryId: string; itemId: string }>()
  const category = getCategoryById(categoryId ?? '')
  const item = getItemById(categoryId ?? '', itemId ?? '')

  if (!category || !item) {
    return (
      <div className="page">
        <p>内容不存在</p>
        <Link to="/">返回首页</Link>
      </div>
    )
  }

  const currentIndex = category.items.findIndex((i) => i.id === itemId)
  const prevItem = currentIndex > 0 ? category.items[currentIndex - 1] : null
  const nextItem = currentIndex < category.items.length - 1 ? category.items[currentIndex + 1] : null

  return (
    <div className="page article-page">
      <header className="page-header">
        <Link to="/" className="breadcrumb">首页</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/category/${category.id}`} className="breadcrumb">{category.title}</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{item.title}</span>
      </header>

      <article className="article-content">
        <div className="article-meta">
          <span className="article-category">{category.title}</span>
          <div className="article-tags">
            {item.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        <h1>{item.title}</h1>
        <p className="article-summary">{item.summary}</p>

        <div className="article-body">
          {item.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>

      <nav className="article-nav">
        {prevItem ? (
          <Link to={`/article/${category.id}/${prevItem.id}`} className="article-nav-link prev">
            <span className="nav-direction">上一篇</span>
            <span className="nav-title">{prevItem.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {nextItem ? (
          <Link to={`/article/${category.id}/${nextItem.id}`} className="article-nav-link next">
            <span className="nav-direction">下一篇</span>
            <span className="nav-title">{nextItem.title}</span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </div>
  )
}
