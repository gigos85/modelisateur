import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import cujRoutes from './routes/cujRoutes.js'
import dynatraceRoutes from './routes/dynatraceRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/cuj', cujRoutes)
app.use('/api/dynatrace', dynatraceRoutes)

// Serve static frontend files
const frontendPath = path.join(__dirname, '../../frontend/dist')
app.use(express.static(frontendPath))

// SPA fallback: redirect to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Frontend not found. Please build the frontend first.')
    }
  })
})

app.listen(4000, () => {
  console.log('Backend running on http://localhost:4000')
})
