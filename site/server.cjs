const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 5173
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
}

const server = http.createServer((req, res) => {
  const pathname = (req.url || '/').split('?')[0]
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname)
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'text/plain' })
    res.end(data)
  })
})

server.listen(PORT, () => {
  console.log(`PM Lab → http://localhost:${PORT}`)
})
