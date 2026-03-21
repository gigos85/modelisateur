import React, { useEffect, useState } from 'react'
import StageCard from './StageCard'
import { getCujs, getCuj, createStep, createCuj, createMacro } from '../api/cujApi'
import { useCujStore } from '../store/store'
import { applyHierarchicalLayout } from '../utils/layoutEngine'

type Cuj = {
  id: string
  name: string
  steps?: any[]
  macros?: any[]
}

const Sidebar: React.FC = () => {
  const [cujs, setCujs] = useState<Cuj[]>([])
  const [selected, setSelected] = useState<Cuj | null>(null)
  const { setSelectedCujId, addNode, setSelectedCujTitle, setSelectedCujCriticity, nodes, startStepId, setStartStepId } = useCujStore()
  const [localTitle, setLocalTitle] = useState<string | null>(null)
  const [localCriticity, setLocalCriticity] = useState<'or' | 'argent' | 'bronze' | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await getCujs()
        setCujs(data)
        if (data && data.length > 0) {
          const first = data[0]
          const detailed = await getCuj(first.id)
          setSelected(detailed)
          setSelectedCujId(detailed.id)
          setSelectedCujTitle(detailed.name)
          setSelectedCujCriticity(detailed.criticity || null)
          setLocalTitle(detailed.name)
          setLocalCriticity(detailed.criticity || null)
          setStartStepId(detailed.start_step_id || null)
          
          // populate canvas with layout
          const nodesRaw = (detailed.steps || []).map((s: any) => ({
            id: s.id,
            position: { x: 0, y: 0 },
            data: { label: s.name, macros: s.macros || [], ...(s.data || {}) },
            type: 'cujNode'
          }))
          const edges = (detailed.edges || []).map((e: any, idx: number) => ({ id: `e${idx}-${e.from}-${e.to}`, source: e.from, target: e.to }))
          const nodes = applyHierarchicalLayout(nodesRaw, edges, detailed.start_step_id || null)
          
          const { setNodes, setEdges } = useCujStore.getState()
          setNodes(nodes)
          setEdges(edges)
        }
      } catch (err) {
        console.error(err)
      }
    })()
  }, [setSelectedCujId, setSelectedCujTitle, setSelectedCujCriticity, setStartStepId])

  // When canvas nodes change, reload CUJ data to keep sidebar in sync
  const syncFromCanvas = React.useCallback(async () => {
    if (!selected?.id) return
    try {
      const updated = await getCuj(selected.id)
      setSelected(updated)
    } catch (err) {
      console.error('Error syncing from canvas:', err)
    }
  }, [selected?.id])

  React.useEffect(() => {
    // Debounce the sync to avoid too many API calls
    const timer = setTimeout(syncFromCanvas, 500)
    return () => clearTimeout(timer)
  }, [nodes, syncFromCanvas])

  const onSelect = async (id: string) => {
    const d = await getCuj(id)
    setSelected(d)
    setSelectedCujId(d.id)
    setStartStepId(d.start_step_id || null)
    setSelectedCujTitle(d.name)
    setSelectedCujCriticity(d.criticity || null)
    setLocalTitle(d.name)
    setLocalCriticity(d.criticity || null)
    
    const nodesRaw = (d.steps || []).map((s: any) => ({
      id: s.id,
      position: { x: 0, y: 0 },
      data: { label: s.name, macros: s.macros || [], ...(s.data || {}) },
      type: 'cujNode'
    }))
    const edges = (d.edges || []).map((e: any, idx: number) => ({ id: `e${idx}-${e.from}-${e.to}`, source: e.from, target: e.to }))
    const nodes = applyHierarchicalLayout(nodesRaw, edges, d.start_step_id || null)
    
    const { setNodes, setEdges } = useCujStore.getState()
    setNodes(nodes)
    setEdges(edges)
  }

  const onCreateStep = async () => {
    if (!selected) return
    const newStep = { name: 'Nouvelle Étape', data: {} }
    const created = await createStep(selected.id, newStep)
    // add to local list
    const updated = await getCuj(selected.id)
    setSelected(updated)
    
    // Recalculate layout with new step
    const nodesRaw = (updated.steps || []).map((s: any) => ({
      id: s.id,
      position: { x: 0, y: 0 },
      data: { label: s.name, macros: s.macros || [], ...(s.data || {}) },
      type: 'cujNode'
    }))
    const edges = (updated.edges || []).map((e: any, idx: number) => ({ id: `e${idx}-${e.from}-${e.to}`, source: e.from, target: e.to }))
    const nodes = applyHierarchicalLayout(nodesRaw, edges, startStepId)
    
    const { setNodes, setEdges } = useCujStore.getState()
    setNodes(nodes)
    setEdges(edges)
  }

  const onCreateMacro = async () => {
    if (!selected) return
    // Create macro with auto-generated empty name (like CUJs)
    const timestamp = Date.now()
    const name = `Macro ${new Date(timestamp).toLocaleTimeString('fr-FR')}`
    try {
      await createMacro(selected.id, { name, desc: '' })
      const updated = await getCuj(selected.id)
      setSelected(updated)
      console.log(`✅ Macro "${name}" créée automatiquement`)
    } catch (err) {
      console.error('❌ Erreur création macro:', err)
    }
  }

  const onCreateCuj = async () => {
    const name = prompt('Nom du nouveau parcours')
    if (!name) return
    const created = await createCuj({ name })
    // refresh list
    const data = await getCujs()
    setCujs(data)
    // select created
    const detailed = await getCuj(created.id)
    setSelected(detailed)
    setSelectedCujId(detailed.id)
    setStartStepId(null)
    setSelectedCujTitle(detailed.name)
    setSelectedCujCriticity(detailed.criticity || null)
    setLocalTitle(detailed.name)
    setLocalCriticity(detailed.criticity || null)
    const { setNodes, setEdges } = useCujStore.getState()
    setNodes([])
    setEdges([])
  }

  return (
    <aside className="sidebar">
      <div className="panel">
        <div className="panel-title">Parcours Existants</div>
        <div className="panel-body">
          {cujs.map((c) => (
            <label key={c.id} className="list-item">
              <input type="radio" name="cuj" checked={selected?.id === c.id} onChange={() => onSelect(c.id)} /> {c.name}
            </label>
          ))}
            <div style={{ marginTop: 8 }}>
              <button className="add-btn" onClick={onCreateCuj}>+ Nouveau parcours</button>
            </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Étapes du parcours</div>
        <div className="panel-body">
          <button className="add-btn" onClick={onCreateStep}>+ Créer une nouvelle étape</button>
          {selected?.steps?.map((step: any) => (
            <StageCard
              key={step.id}
              id={step.id}
              kind="step"
              title={step.name || step.label || 'Étape'}
              subtitle={step.service || ''}
              onRename={(newName) => {
                setSelected((prev:any) => {
                  if (!prev) return prev
                  return { ...prev, steps: (prev.steps || []).map((st:any) => st.id === step.id ? { ...st, name: newName } : st) }
                })
                const { setNodes, nodes } = useCujStore.getState()
                setNodes(nodes.map((n:any) => n.id === step.id ? { ...n, data: { ...n.data, label: newName } } : n))
              }}
              onDelete={() => {
                setSelected((prev:any) => {
                  if (!prev) return prev
                  return { ...prev, steps: (prev.steps || []).filter((st:any) => st.id !== step.id) }
                })
              }}
            />
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Macrofonctionnalités Disponibles</div>
        <div className="panel-body macro-list">
          <div style={{ marginBottom: 8 }}>
            <button className="add-btn" onClick={onCreateMacro}>+ Ajouter Macro au parcours</button>
          </div>
          {selected?.macros?.map((m: any) => (
            <StageCard
              key={m.id}
              id={m.id}
              title={m.name}
              subtitle={m.desc || ''}
              kind="macro"
              onRename={(newName, oldName) => {
                setSelected((prev:any) => {
                  if (!prev) return prev
                  return { ...prev, macros: (prev.macros || []).map((mm:any) => mm.id === m.id ? { ...mm, name: newName } : mm) }
                })
                // Also sync to canvas nodes - update macros on all steps
                const { setNodes } = useCujStore.getState()
                setNodes(nodes.map((n:any) => {
                  const macrosOnStep = (n.data?.macros || []).map((macro:any) =>
                    macro.name === (oldName || m.name) ? { ...macro, name: newName } : macro
                  )
                  return { ...n, data: { ...n.data, macros: macrosOnStep } }
                }))
              }}
              onDelete={async () => {
                const nameToRemove = m.name
                setSelected((prev:any) => {
                  if (!prev) return prev
                  return { ...prev, macros: (prev.macros || []).filter((mm:any) => mm.id !== m.id) }
                })
                // Also remove from canvas nodes
                const { setNodes } = useCujStore.getState()
                setNodes(nodes.map((n:any) => {
                  const macrosOnStep = (n.data?.macros || []).filter((macro:any) => macro.name !== nameToRemove)
                  return { ...n, data: { ...n.data, macros: macrosOnStep } }
                }))
                // refresh full CUJ from backend to ensure consistency
                try {
                  if (selected && selected.id) {
                    const updated = await getCuj(selected.id)
                    setSelected(updated)
                  }
                } catch (err) {
                  console.error('Error reloading CUJ after macro delete:', err)
                }
              }}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
