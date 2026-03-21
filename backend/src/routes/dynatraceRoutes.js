import express from 'express'

const router = express.Router()

router.get('/pages', (req, res) => {
  res.json([
    { id: 'APP-001', name: 'Simulation Page', url: 'https://dynatrace.example/app/simulation' },
    { id: 'APP-002', name: 'Souscription Page', url: 'https://dynatrace.example/app/souscription' },
    { id: 'APP-003', name: 'Création Dossier Page', url: 'https://dynatrace.example/app/creation' },
    { id: 'APP-004', name: 'Signature Page', url: 'https://dynatrace.example/app/signature' }
  ])
})

router.post('/pages', (req, res) => {
  // In a real integration this would create a page entry; here we just echo
  const page = req.body
  page.id = page.id || `APP-${Date.now()}`
  page.url = page.url || `https://dynatrace.example/app/${page.id}`
  res.json(page)
})

export default router
