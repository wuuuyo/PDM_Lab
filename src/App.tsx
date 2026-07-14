import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import ArticlePage from './pages/ArticlePage'
import MemoryPage from './pages/MemoryPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/article/:categoryId/:itemId" element={<ArticlePage />} />
        <Route path="/memory" element={<MemoryPage />} />
      </Routes>
    </Layout>
  )
}
