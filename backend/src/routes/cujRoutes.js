import express from 'express'
import * as dbOps from '../db/database.js'

const router = express.Router()

// List all CUJs
router.get('/', async (req, res) => {
  try {
    const cujs = await dbOps.getAllCujs()
    res.json(cujs)
  } catch (err) {
    console.error('Error fetching CUJs:', err)
    res.status(500).json({ error: err.message })
  }
})

// Create a new CUJ
router.post('/', async (req, res) => {
  try {
    const cuj = await dbOps.createCuj(req.body)
    res.json(cuj)
  } catch (err) {
    console.error('Error creating CUJ:', err)
    res.status(500).json({ error: err.message })
  }
})

// Get a single CUJ by id
router.get('/:id', async (req, res) => {
  try {
    const cuj = await dbOps.getCujById(req.params.id)
    if (!cuj) return res.status(404).json({ error: 'Not found' })
    res.json(cuj)
  } catch (err) {
    console.error('Error fetching CUJ:', err)
    res.status(500).json({ error: err.message })
  }
})

// Add a step to a CUJ
router.post('/:id/steps', async (req, res) => {
  try {
    const step = await dbOps.createStep(req.params.id, req.body)
    res.json(step)
  } catch (err) {
    console.error('Error creating step:', err)
    res.status(500).json({ error: err.message })
  }
})

// Update a step (e.g., rename, position)
router.put('/:id/steps/:stepId', async (req, res) => {
  try {
    const step = await dbOps.updateStep(req.params.id, req.params.stepId, req.body)
    if (!step) return res.status(404).json({ error: 'Step not found' })
    res.json({ success: true, step })
  } catch (err) {
    console.error('Error updating step:', err)
    res.status(500).json({ error: err.message })
  }
})

// Delete a step
router.delete('/:id/steps/:stepId', async (req, res) => {
  try {
    await dbOps.deleteStep(req.params.id, req.params.stepId)
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting step:', err)
    res.status(500).json({ error: err.message })
  }
})

// Link a macro to a step
router.post('/:id/steps/:stepId/macros', async (req, res) => {
  try {
    const macro = await dbOps.linkMacroToStep(req.params.id, req.params.stepId, req.body)
    res.json({ success: true, macro })
  } catch (err) {
    console.error('Error linking macro to step:', err)
    res.status(500).json({ error: err.message })
  }
})

// Update a macro name on a step
router.put('/:id/steps/:stepId/macros/:macroName', async (req, res) => {
  try {
    await dbOps.updateMacro(req.params.id, req.params.macroName, req.body)
    res.json({ success: true })
  } catch (err) {
    console.error('Error updating macro:', err)
    res.status(500).json({ error: err.message })
  }
})

// Delete a macro from a step
router.delete('/:id/steps/:stepId/macros/:macroName', async (req, res) => {
  try {
    await dbOps.unlinkMacroFromStep(req.params.id, req.params.stepId, req.params.macroName)
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting macro from step:', err)
    res.status(500).json({ error: err.message })
  }
})

// Link a dynatrace page to a macro on a step
router.post('/:id/steps/:stepId/macros/:macroName/pages', async (req, res) => {
  try {
    await dbOps.linkPageToMacro(req.params.id, req.params.stepId, req.params.macroName, req.body)
    res.json({ success: true })
  } catch (err) {
    console.error('Error linking page to macro:', err)
    res.status(500).json({ error: err.message })
  }
})

// Delete a page from a macro on a step
router.delete('/:id/steps/:stepId/macros/:macroName/pages/:pageId', async (req, res) => {
  try {
    await dbOps.unlinkPageFromMacro(req.params.id, req.params.stepId, req.params.macroName, req.params.pageId)
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting page from macro:', err)
    res.status(500).json({ error: err.message })
  }
})

// Add an edge (ordered link) between steps
router.post('/:id/edges', async (req, res) => {
  try {
    const edge = await dbOps.createEdge(req.params.id, req.body)
    res.json(edge)
  } catch (err) {
    console.error('Error creating edge:', err)
    res.status(500).json({ error: err.message })
  }
})

// Delete an edge between steps
router.delete('/:id/edges', async (req, res) => {
  try {
    const { from, to } = req.body || {}
    if (!from || !to) return res.status(400).json({ error: 'from and to are required' })
    await dbOps.deleteEdge(req.params.id, { from, to })
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting edge:', err)
    res.status(500).json({ error: err.message })
  }
})

// Add a macro at CUJ level (not attached to a step)
router.post('/:id/macros', async (req, res) => {
  try {
    const macro = await dbOps.createMacro(req.params.id, req.body)
    res.json({ success: true, macro })
  } catch (err) {
    console.error('Error creating macro:', err)
    res.status(500).json({ error: err.message })
  }
})

// Delete a macro defined at CUJ level by name (legacy)
router.delete('/:id/macros/:macroName', async (req, res) => {
  try {
    await dbOps.deleteCujMacro(req.params.id, req.params.macroName)
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting CUJ macro:', err)
    res.status(500).json({ error: err.message })
  }
})

// Delete a macro by its internal ID (preferred, avoids encoding problems)
router.delete('/:id/macros/id/:macroId', async (req, res) => {
  try {
    await dbOps.deleteCujMacroById(req.params.id, req.params.macroId)
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting CUJ macro by id:', err)
    res.status(500).json({ error: err.message })
  }
})

// Update CUJ macros by id
router.put('/:id/macros/id/:macroId', async (req, res) => {
  try {
    console.log(`PUT /${req.params.id}/macros/id/${req.params.macroId}`)
    console.log('Request body:', req.body)
    const macroId = parseInt(req.params.macroId, 10)
    console.log(`Parsed macroId: ${macroId}`)
    await dbOps.updateMacroById(req.params.id, macroId, req.body)
    res.json({ success: true })
  } catch (err) {
    console.error('Error updating CUJ macro by id:', err)
    res.status(500).json({ error: err.message })
  }
})

// Update CUJ metadata (name, criticity)
router.put('/:id', async (req, res) => {
  try {
    const cuj = await dbOps.updateCuj(req.params.id, req.body)
    if (!cuj) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true, cuj })
  } catch (err) {
    console.error('Error updating CUJ:', err)
    res.status(500).json({ error: err.message })
  }
})

// Save the complete layout (all nodes and edges)
router.post('/:id/save-layout', async (req, res) => {
  try {
    const { nodes, edges, startStepId } = req.body
    const cujId = req.params.id
    
    // Persist start step if provided
    if (startStepId !== undefined) {
      await dbOps.updateCuj(cujId, { start_step_id: startStepId })
    }

    // Update each step's position and any attached data
    for (const node of nodes || []) {
      const updatePayload = {}
      if (node.position) {
        updatePayload.position = node.position
      }
      if (node.data !== undefined) {
        // strip transient stepNumber/isStartStep if desired? keep it anyway
        updatePayload.data = node.data
      }
      if (Object.keys(updatePayload).length > 0) {
        await dbOps.updateStep(cujId, node.id, updatePayload)
      }
    }

    // Delete all existing edges
    const cuj = await dbOps.getCujById(cujId)
    if (cuj && cuj.edges) {
      for (const edge of cuj.edges) {
        await dbOps.deleteEdge(cujId, { from: edge.from, to: edge.to })
      }
    }

    // Create new edges
    for (const edge of edges || []) {
      await dbOps.createEdge(cujId, { from: edge.source, to: edge.target })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Error saving layout:', err)
    res.status(500).json({ error: err.message })
  }
})

// Update a macro name at CUJ level
router.put('/:id/macros/:macroName', async (req, res) => {
  try {
    await dbOps.updateMacro(req.params.id, req.params.macroName, req.body)
    res.json({ success: true })
  } catch (err) {
    console.error('Error updating macro:', err)
    res.status(500).json({ error: err.message })
  }
})

// ============================================
// COMPONENT ROUTES
// ============================================

// Create a component
router.post('/:id/components', async (req, res) => {
  try {
    const component = await dbOps.createComponent(req.params.id, req.body)
    res.json({ success: true, component })
  } catch (err) {
    console.error('Error creating component:', err)
    res.status(500).json({ error: err.message })
  }
})

// Update a component
router.put('/:id/components/:componentId', async (req, res) => {
  try {
    await dbOps.updateComponent(req.params.id, req.params.componentId, req.body)
    res.json({ success: true })
  } catch (err) {
    console.error('Error updating component:', err)
    res.status(500).json({ error: err.message })
  }
})

// Delete a component
router.delete('/:id/components/:componentId', async (req, res) => {
  try {
    await dbOps.deleteComponent(req.params.id, req.params.componentId)
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting component:', err)
    res.status(500).json({ error: err.message })
  }
})

// Create macro directly in component
router.post('/:id/components/:componentId/macros', async (req, res) => {
  try {
    const macro = await dbOps.createMacroInComponent(req.params.id, req.params.componentId, req.body)
    res.json({ success: true, macro })
  } catch (err) {
    console.error('Error creating macro in component:', err)
    res.status(500).json({ error: err.message })
  }
})

// Add macro to component
router.post('/:id/components/:componentId/macros/:macroId', async (req, res) => {
  try {
    console.log(`Adding macro ${req.params.macroId} to component ${req.params.componentId} in CUJ ${req.params.id}`)
    await dbOps.addMacroToComponent(req.params.id, req.params.componentId, req.params.macroId)
    res.json({ success: true })
  } catch (err) {
    console.error('Error adding macro to component:', err)
    res.status(500).json({ error: err.message })
  }
})

// Remove macro from component
router.delete('/:id/components/:componentId/macros/:macroId', async (req, res) => {
  try {
    await dbOps.removeMacroFromComponent(req.params.id, req.params.macroId)
    res.json({ success: true })
  } catch (err) {
    console.error('Error removing macro from component:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
