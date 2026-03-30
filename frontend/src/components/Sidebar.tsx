import React, { useEffect, useState } from 'react'
import StageCard from './StageCard'
import { getCujs, getCuj, createStep, createCuj, createMacro, createComponent, updateComponent, deleteComponent, addMacroToComponent, removeMacroFromComponent, createMacroInComponent } from '../api/cujApi'
import { useCujStore } from '../store/store'
import { applyHierarchicalLayout } from '../utils/layoutEngine'

type Cuj = {
  id: string
  name: string
  steps?: any[]
  components?: any[]
  standaloneMacros?: any[]
}

const Sidebar: React.FC = () => {
  const [cujs, setCujs] = useState<Cuj[]>([])
  const [selected, setSelected] = useState<Cuj | null>(null)
  const { setSelectedCujId, addNode, setSelectedCujTitle, setSelectedCujCriticity, nodes, startStepId, setStartStepId } = useCujStore()
  const [localTitle, setLocalTitle] = useState<string | null>(null)
  const [localCriticity, setLocalCriticity] = useState<'or' | 'argent' | 'bronze' | null>(null)
  const [expandedComponents, setExpandedComponents] = useState<Set<number>>(new Set())
  const [editingComponentId, setEditingComponentId] = useState<number | null>(null)
  const [editingComponentValue, setEditingComponentValue] = useState<string>('')
  const [dragOverComponentId, setDragOverComponentId] = useState<number | null>(null)
  const [dragEnterCount, setDragEnterCount] = useState<Record<number, number>>({})

  useEffect(() => {
    ;(async () => {
      try {
        const data = await getCujs()
        setCujs(data)
        if (data && data.length > 0) {
          const first = data[0]
          const detailed = await getCuj(first.id)
          console.log('Detailed CUJ data:', detailed)
          console.log('Components in CUJ:', detailed.components)
          if (detailed.components) {
            detailed.components.forEach((comp: any, idx: number) => {
              console.log(`Component ${idx}: ${comp.name}, macros:`, comp.macros)
            })
          }
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
    // Auto-expand components that have macros
    if (selected?.components) {
      const componentsWithMacros = selected.components
        .filter((comp: any) => comp.macros && comp.macros.length > 0)
        .map((comp: any) => comp.id)
      
      setExpandedComponents(prev => {
        const newSet = new Set(prev)
        componentsWithMacros.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }, [selected?.components])

  const onSelect = async (id: string) => {
    const d = await getCuj(id)
    console.log('Selected CUJ:', d)
    console.log('Standalone macros:', d.standaloneMacros)
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
      await createMacro(selected.id, { name, desc: '', code: null, criticity: null })
      const updated = await getCuj(selected.id)
      setSelected(updated)
      console.log(`✅ Macro "${name}" créée automatiquement`)
    } catch (err) {
      console.error('❌ Erreur création macro:', err)
    }
  }

  const onCreateComponent = async () => {
    if (!selected) return
    const code = prompt('Code du composant (ex: COMP001)')
    if (!code) return
    const name = prompt('Nom du composant')
    if (!name) return
    try {
      await createComponent(selected.id, { code, name, desc: '' })
      const updated = await getCuj(selected.id)
      setSelected(updated)
      console.log(`✅ Composant "${name}" créé`)
    } catch (err) {
      console.error('❌ Erreur création composant:', err)
    }
  }

  const onCreateMacroInComponent = async (componentId: number) => {
    if (!selected) return
    const timestamp = Date.now()
    const name = `Macro ${new Date(timestamp).toLocaleTimeString('fr-FR')}`
    try {
      // Créer la macro avec component_id
      await createMacroInComponent(selected.id, componentId, { name, desc: '', code: null, criticity: null })
      const updated = await getCuj(selected.id)
      setSelected(updated)
      console.log(`✅ Macro "${name}" créée dans le composant`)
    } catch (err) {
      console.error('❌ Erreur création macro dans composant:', err)
    }
  }

  const toggleComponentExpansion = (componentId: number) => {
    setExpandedComponents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(componentId)) {
        newSet.delete(componentId)
      } else {
        newSet.add(componentId)
      }
      return newSet
    })
  }

  const handleDeleteComponent = async (componentId: number) => {
    if (!selected) return
    try {
      await deleteComponent(selected.id, componentId)
      const updated = await getCuj(selected.id)
      setSelected(updated)
      console.log('✅ Composant supprimé')
    } catch (err) {
      console.error('❌ Erreur suppression composant:', err)
    }
  }

  const handleMacroRename = (componentId: number, macroId: number, newName: string, oldName?: string) => {
    setSelected((prev:any) => {
      if (!prev) return prev
      const updatedComponents = (prev.components || []).map((comp: any) =>
        comp.id === componentId
          ? { ...comp, macros: comp.macros.map((m: any) => m.id === macroId ? { ...m, name: newName } : m) }
          : comp
      )
      return { ...prev, components: updatedComponents }
    })
    // Also sync to canvas nodes
    const { setNodes } = useCujStore.getState()
    setNodes(nodes.map((n:any) => {
      const macrosOnStep = (n.data?.macros || []).map((m:any) =>
        m.name === (oldName || '') ? { ...m, name: newName } : m
      )
      return { ...n, data: { ...n.data, macros: macrosOnStep } }
    }))
  }

  const handleDeleteMacro = async (componentId: number, macroId: number) => {
    if (!selected) return
    const component = selected.components?.find((c: any) => c.id === componentId)
    const macro = component?.macros?.find((m: any) => m.id === macroId)
    if (!macro) return

    const nameToRemove = macro.name
    setSelected((prev:any) => {
      if (!prev) return prev
      const updatedComponents = (prev.components || []).map((comp: any) =>
        comp.id === componentId
          ? { ...comp, macros: comp.macros.filter((m: any) => m.id !== macroId) }
          : comp
      )
      return { ...prev, components: updatedComponents }
    })
    // Also remove from canvas nodes
    const { setNodes } = useCujStore.getState()
    setNodes(nodes.map((n:any) => {
      const macrosOnStep = (n.data?.macros || []).filter((m:any) => m.name !== nameToRemove)
      return { ...n, data: { ...n.data, macros: macrosOnStep } }
    }))
    // refresh from backend
    try {
      const updated = await getCuj(selected.id)
      setSelected(updated)
    } catch (err) {
      console.error('Error reloading CUJ after macro delete:', err)
    }
  }

  const handleStandaloneMacroRename = (macroId: number, newName: string, oldName?: string) => {
    setSelected((prev:any) => {
      if (!prev) return prev
      return { ...prev, standaloneMacros: (prev.standaloneMacros || []).map((m:any) => m.id === macroId ? { ...m, name: newName } : m) }
    })
    // Also sync to canvas nodes
    const { setNodes } = useCujStore.getState()
    setNodes(nodes.map((n:any) => {
      const macrosOnStep = (n.data?.macros || []).map((m:any) =>
        m.name === (oldName || '') ? { ...m, name: newName } : m
      )
      return { ...n, data: { ...n.data, macros: macrosOnStep } }
    }))
  }

  const handleDeleteStandaloneMacro = async (macroId: number) => {
    if (!selected) return
    const macro = selected.standaloneMacros?.find((m: any) => m.id === macroId)
    if (!macro) return

    const nameToRemove = macro.name
    setSelected((prev:any) => {
      if (!prev) return prev
      return { ...prev, standaloneMacros: (prev.standaloneMacros || []).filter((m:any) => m.id !== macroId) }
    })
    // Also remove from canvas nodes
    const { setNodes } = useCujStore.getState()
    setNodes(nodes.map((n:any) => {
      const macrosOnStep = (n.data?.macros || []).filter((m:any) => m.name !== nameToRemove)
      return { ...n, data: { ...n.data, macros: macrosOnStep } }
    }))
    // refresh from backend
    try {
      const updated = await getCuj(selected.id)
      setSelected(updated)
    } catch (err) {
      console.error('Error reloading CUJ after macro delete:', err)
    }
  }

  const handleComponentRename = async (componentId: number, newName: string) => {
    if (!selected || !newName.trim()) return
    try {
      await updateComponent(selected.id, componentId, { name: newName.trim() })
      const updated = await getCuj(selected.id)
      setSelected(updated)
      console.log(`✅ Composant renommé en "${newName}"`)
    } catch (err) {
      console.error('❌ Erreur renommage composant:', err)
    }
  }

  const handleComponentDrop = async (event: React.DragEvent<HTMLDivElement>, componentId: number) => {
    event.preventDefault()
    event.stopPropagation()
    // Reset drag state
    setDragOverComponentId(null)
    setDragEnterCount(prev => ({ ...prev, [componentId]: 0 }))

    if (!selected) return

    // Vérifier si c'est une MF qui est déposée
    let mimeData = event.dataTransfer.getData('application/macro')
    if (!mimeData) return

    try {
      const macroData = JSON.parse(mimeData)
      if (macroData.kind !== 'macro' || !macroData.id) return

      console.log('Adding macro to component:', macroData)

      // Mise à jour optimiste : retirer la macro de standaloneMacros et l'ajouter au composant
      setSelected(prev => {
        if (!prev) return prev
        const macroToMove = prev.standaloneMacros?.find(m => m.id === macroData.id)
        if (!macroToMove) return prev
        
        return {
          ...prev,
          standaloneMacros: (prev.standaloneMacros || []).filter(m => m.id !== macroData.id),
          components: (prev.components || []).map(comp => 
            comp.id === componentId 
              ? { ...comp, macros: [...(comp.macros || []), macroToMove] }
              : comp
          )
        }
      })

      // Ajouter la MF au composant
      await addMacroToComponent(selected.id, componentId, macroData.id)
      
      // Recharger les données pour confirmer
      const updated = await getCuj(selected.id)
      console.log('Updated CUJ after adding macro to component:', updated)
      console.log('Standalone macros after update:', updated.standaloneMacros)
      console.log('Components after update:', updated.components?.map(c => ({ id: c.id, name: c.name, macrosCount: c.macros?.length || 0 })))
      setSelected(updated)
      console.log(`✅ MF "${macroData.title}" ajoutée au composant`)
    } catch (err) {
      console.error('❌ Erreur ajout MF au composant:', err)
      // En cas d'erreur, recharger les données pour restaurer l'état
      try {
        const refreshed = await getCuj(selected.id)
        setSelected(refreshed)
      } catch (refreshErr) {
        console.error('❌ Erreur lors du refresh après échec:', refreshErr)
      }
    }
  }

  const handleComponentDragOver = (event: React.DragEvent<HTMLDivElement>, componentId: number) => {
    // Accepter le drop seulement si c'est une MF
    if (event.dataTransfer.types.includes('application/macro')) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      // dragOverComponentId is now set in dragenter
    }
  }

  const handleComponentDragEnter = (event: React.DragEvent<HTMLDivElement>, componentId: number) => {
    event.preventDefault()
    setDragEnterCount(prev => ({
      ...prev,
      [componentId]: (prev[componentId] || 0) + 1
    }))
    if (event.dataTransfer.types.includes('application/macro')) {
      setDragOverComponentId(componentId)
    }
  }

  const handleComponentDragLeave = (event: React.DragEvent<HTMLDivElement>, componentId: number) => {
    event.preventDefault()
    setDragEnterCount(prev => {
      const newCount = (prev[componentId] || 0) - 1
      if (newCount <= 0) {
        setDragOverComponentId(null)
        return { ...prev, [componentId]: 0 }
      }
      return { ...prev, [componentId]: newCount }
    })
  }

  const handleRemoveMacroFromComponent = async (componentId: number, macroId: number) => {
    if (!selected) return
    try {
      await removeMacroFromComponent(selected.id, componentId, macroId)
      const updated = await getCuj(selected.id)
      setSelected(updated)
      console.log('✅ MF retirée du composant')
    } catch (err) {
      console.error('❌ Erreur retrait MF du composant:', err)
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
            <button className="add-btn" onClick={onCreateComponent}>+ Ajouter Composant</button>
            <button className="add-btn" style={{ marginLeft: 8 }} onClick={onCreateMacro}>+ Ajouter Macro</button>
          </div>
          {/* Composants avec leurs macros */}
          {selected?.components?.map((component: any) => {
            console.log('Rendering component:', component.id, component.name, 'macros:', component.macros)
            return (
            <div key={component.id} className="component-container">
              <div
                className={`component-header ${dragOverComponentId === component.id ? 'drag-over' : ''}`}
                onClick={() => toggleComponentExpansion(component.id)}
                onDragEnter={(e) => handleComponentDragEnter(e, component.id)}
                onDragOver={(e) => handleComponentDragOver(e, component.id)}
                onDragLeave={(e) => handleComponentDragLeave(e, component.id)}
                onDrop={(e) => handleComponentDrop(e, component.id)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span className="component-toggle">
                  {expandedComponents.has(component.id) ? '▼' : '▶'}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="component-code">{component.code}</div>
                  {editingComponentId === component.id ? (
                    <input
                      value={editingComponentValue}
                      onChange={(e) => setEditingComponentValue(e.target.value)}
                      onBlur={() => {
                        handleComponentRename(component.id, editingComponentValue)
                        setEditingComponentId(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleComponentRename(component.id, editingComponentValue)
                          setEditingComponentId(null)
                        }
                        if (e.key === 'Escape') {
                          setEditingComponentId(null)
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onDragStart={(e) => e.stopPropagation()}
                      onDragOver={(e) => e.stopPropagation()}
                      onDrop={(e) => e.stopPropagation()}
                      autoFocus
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1f2937',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        padding: '2px 4px',
                        width: '100%'
                      }}
                    />
                  ) : (
                    <div 
                      className="component-name"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setEditingComponentId(component.id)
                        setEditingComponentValue(component.name)
                      }}
                    >
                      {component.name}
                    </div>
                  )}
                  {component.desc && <div className="component-desc">{component.desc}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    className="add-macro-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCreateMacroInComponent(component.id)
                    }}
                    title="Ajouter une macro dans ce composant"
                    style={{
                      background: '#1f6feb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '2px 6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                  <button
                    className="component-delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleDeleteComponent(component.id); }}
                    onDragStart={(e) => e.stopPropagation()}
                    onDragOver={(e) => e.stopPropagation()}
                    onDrop={(e) => e.stopPropagation()}
                    title="Supprimer le composant"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {expandedComponents.has(component.id) && (
                <div className="component-macros">
                  {console.log(`Rendering macros for component ${component.id}:`, component.macros)}
                  {component.macros.map((macro: any) => (
                    <div key={macro.id} className="macro-in-component">
                      <StageCard
                        id={macro.id}
                        title={macro.name}
                        subtitle={macro.desc || ''}
                        code={macro.code}
                        criticity={macro.criticity}
                        kind="macro"
                        onRename={(newName, oldName) => handleMacroRename(component.id, macro.id, newName, oldName)}
                        onDelete={() => handleDeleteMacro(component.id, macro.id)}
                      />
                      <button
                        className="remove-macro-btn"
                        onClick={() => handleRemoveMacroFromComponent(component.id, macro.id)}
                        onDragStart={(e) => e.stopPropagation()}
                        onDragOver={(e) => e.stopPropagation()}
                        onDrop={(e) => e.stopPropagation()}
                        title="Retirer du composant"
                      >
                        ↗
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
          })}

          {/* Macros standalone (non rattachées à un composant) */}
          {selected?.standaloneMacros?.map((m: any) => (
            <StageCard
              key={m.id}
              id={m.id}
              title={m.name}
              subtitle={m.desc || ''}
              code={m.code}
              criticity={m.criticity}
              kind="macro"
              onRename={(newName, oldName) => handleStandaloneMacroRename(m.id, newName, oldName)}
              onDelete={() => handleDeleteStandaloneMacro(m.id)}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
