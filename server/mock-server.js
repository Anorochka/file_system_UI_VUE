const express = require('express')
const multer = require('multer')
const mime = require('mime')
const app = express()
const upload = multer({ storage: multer.memoryStorage() })
let DB = [
  { id: 1, name: 'Документ.pdf', size: 234567, createdAt: new Date().toISOString(), type: 'application/pdf' },
  { id: 2, name: 'Фото.jpg', size: 1456789, createdAt: new Date(Date.now() - 86400000).toISOString(), type: 'image/jpeg' },
]
let idCounter = 100

app.use(express.json())

app.get('/api/files', (req, res) => res.json(DB))

app.post('/api/files', upload.array('files'), (req, res) => {
  const now = Date.now()
  const added = req.files.map((f, i) => {
    const item = { id: idCounter++, name: f.originalname, size: f.size, createdAt: new Date().toISOString(), type: f.mimetype || 'application/octet-stream' }
    DB.unshift(item)
    return item
  })
  res.json(added)
})

app.delete('/api/files/:id', (req, res) => {
  const id = Number(req.params.id)
  DB = DB.filter(f => f.id !== id)
  res.json({ ok: true })
})

const port = 3000
app.listen(port, () => console.log(`Mock API running at http://localhost:${port}`))
