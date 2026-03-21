import express from 'express'
import cors from 'cors'
import cujRoutes from './routes/cujRoutes.js'
import dynatraceRoutes from './routes/dynatraceRoutes.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/cuj', cujRoutes)
app.use('/api/dynatrace', dynatraceRoutes)

app.listen(4000, () => {
  console.log('Backend running on http://localhost:4000')
})
