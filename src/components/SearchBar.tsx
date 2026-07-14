import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchKnowledge } from '../data/knowledge'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<ReturnType<typeof searchKnowledge>>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (query.trim()) {
      setResults(searchKnowledge(query).slice(0, 6))
      setOpen(true)
    } else {
      setResults([])
      setOpen(false)
    }
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function goToArticle(categoryId: string, itemId: string) {
    navigate(`/article/${categoryId}/${itemId}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className="search-bar">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="搜索知识点..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="search-results">
          {results.map(({ category, item }) => (
            <button
              key={item.id}
              className="search-result-item"
              onClick={() => goToArticle(category.id, item.id)}
            >
              <span className="result-title">{item.title}</span>
              <span className="result-meta">{category.title}</span>
            </button>
          ))}
        </div>
      )}
      {open && query && results.length === 0 && (
        <div className="search-results">
          <div className="search-empty">未找到相关内容</div>
        </div>
      )}
    </div>
  )
}
