import React from 'react'
import { Handle, Position } from 'reactflow'
import { useCujStore } from '../store/store'
import { linkMacroToStep, updateMacroName, updateStep, deleteMacroFromStep, linkPageToMacro, deleteStep, deletePageFromMacro } from '../api/cujApi'

interface MacroPayload {
  kind: 'macro'
  title: string
}

const CustomNode: React.FC<any> = ({ id, data }) => {
  const selectedCujId = useCujStore((s) => s.selectedCujId)
  const selectedNodeId = useCujStore((s) => s.selectedNodeId)
  const startStepId = useCujStore((s) => s.startStepId)
  const setStartStepId = useCujStore((s) => s.setStartStepId)

  const [editing, setEditing] = React.useState(false)
  const [title, setTitle] = React.useState(data.label)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [editingMacroName, setEditingMacroName] = React.useState<string | null>(null)
  const [editingMacroValue, setEditingMacroValue] = React.useState<string>('')

  React.useEffect(() => {
    setTitle(data.label)
  }, [data.label])

  // ============================================
  // DROP HANDLER - CENTRALISED & CLEAN
  // ============================================
  const handleMacroDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
    console.log('🎯 DROP EVENT FIRED on node:', id)
    console.log('📋 Available types:', event.dataTransfer.types)
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)

    if (!selectedCujId) {
      console.warn('❌ No CUJ selected')
      return
    }

    // Read MIME data - check both macros and reactflow types
    // Macros use 'application/macro' to bypass React Flow interception
    // Steps use 'application/reactflow'
    let mimeData = event.dataTransfer.getData('application/macro')
    if (!mimeData) {
      mimeData = event.dataTransfer.getData('application/reactflow')
    }
    console.log('📋 Raw MIME data:', mimeData)
    
    if (!mimeData) {
      console.warn('❌ No application/macro or application/reactflow data in transfer')
      return
    }

    // Parse payload
    let payload: any = null
    try {
      payload = JSON.parse(mimeData)
      console.log('✅ Parsed payload:', payload)
    } catch (err) {
      console.warn('❌ Failed to parse JSON:', err)
      return
    }

    // Validate payload
    if (payload.kind !== 'macro') {
      console.warn(`❌ Wrong kind. Expected 'macro', got '${payload.kind}'`)
      return
    }
    if (!payload.title) {
      console.warn('❌ Payload missing title')
      return
    }

    // Check if already exists
    const existingMacros = (data.macros || []) as Array<{ name: string }>
    if (existingMacros.some((m) => m.name === payload.title)) {
      console.warn(`❌ Macro "${payload.title}" already on this step`)
      return
    }

    try {
      console.log(`🚀 LINKING macro "${payload.title}" to step "${id}"...`)
      await linkMacroToStep(selectedCujId, id, { name: payload.title })

      // Update store immutably
      const { setNodes, nodes } = useCujStore.getState()
      const updatedNodes = nodes.map((n: any) => {
        if (n.id !== id) return n
        return {
          ...n,
          data: {
            ...n.data,
            macros: [...(n.data?.macros || []), { name: payload.title }]
          }
        }
      })
      setNodes(updatedNodes)
      console.log('✨ SUCCESS! Macro added.')
    } catch (err) {
      console.error('❌ Backend error:', err)
    }
  }

  // ============================================
  // DRAG HANDLERS
  // ============================================
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    console.log('👆 DRAGOVER on node:', id, 'Types:', event.dataTransfer.types)
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = (): void => {
    console.log('👆 DRAGLEAVE on node:', id)
    setIsDragOver(false)
  }

  // ============================================
  // TITLE EDITING
  // ============================================
  const onTitleDouble = (): void => {
    setEditing(true)
  }

  const onTitleSave = async (): Promise<void> => {
    setEditing(false)
    if (title === data.label) return

    const cujId = useCujStore.getState().selectedCujId
    if (!cujId) return

    try {
      await updateStep(cujId, id, { name: title })
      const { setNodes, nodes } = useCujStore.getState()
      const updatedNodes = nodes.map((n: any) =>
        n.id === id ? { ...n, data: { ...n.data, label: title } } : n
      )
      setNodes(updatedNodes)
    } catch (err) {
      console.error('[Title] Save error:', err)
    }
  }

  // ============================================
  // MACRO RENAMING
  // ============================================
  const onMacroDouble = (event: React.MouseEvent, macro: any): void => {
    event.stopPropagation()
    setEditingMacroName(macro.name)
    setEditingMacroValue(macro.name)
  }

  const saveMacroRename = async (oldName: string): Promise<void> => {
    const newName = (editingMacroValue || '').trim()
    setEditingMacroName(null)

    if (!newName || newName === oldName) return

    const cujId = useCujStore.getState().selectedCujId
    if (!cujId) return

    try {
      await updateMacroName(cujId, id, oldName, { newName })
      const { setNodes, nodes } = useCujStore.getState()
      const updatedNodes = nodes.map((n: any) => {
        if (n.id !== id) return n
        const macros = (n.data?.macros || []).map((m: any) =>
          m.name === oldName ? { ...m, name: newName } : m
        )
        return { ...n, data: { ...n.data, macros } }
      })
      setNodes(updatedNodes)
    } catch (err) {
      console.error('[Macro] Rename error:', err)
    }
  }

  // ============================================
  // MACRO DELETION
  // ============================================
  const deleteMacro = async (event: React.MouseEvent, macroName: string): Promise<void> => {
    event.stopPropagation()
    
    const cujId = useCujStore.getState().selectedCujId
    if (!cujId) return

    try {
      console.log(`🗑️ Deleting macro "${macroName}" from step "${id}"`)
      await deleteMacroFromStep(cujId, id, macroName)
      
      // Update store
      const { setNodes, nodes } = useCujStore.getState()
      const updatedNodes = nodes.map((n: any) => {
        if (n.id !== id) return n
        const macros = (n.data?.macros || []).filter((m: any) => m.name !== macroName)
        return { ...n, data: { ...n.data, macros } }
      })
      setNodes(updatedNodes)
      console.log('✨ Macro deleted successfully')
    } catch (err) {
      console.error('❌ Failed to delete macro:', err)
    }
  }

  // ============================================
  // PAGE DROP ON MACRO
  // ============================================
  const handlePageDrop = async (event: React.DragEvent<HTMLDivElement>, macroName: string): Promise<void> => {
    const pageData = event.dataTransfer.getData('application/dynapage')
    
    // CRITICAL: Only stop propagation if this is actually a page drop
    // Otherwise, let the event bubble up to parent (macro drop handler)
    if (!pageData) {
      console.log('ℹ️ Not a page drop, allowing event to bubble')
      return
    }
    
    // Now we're sure it's a page, so we can stop propagation
    event.preventDefault()
    event.stopPropagation()

    const cujId = useCujStore.getState().selectedCujId
    if (!cujId) return

    try {
      const page = JSON.parse(pageData)
      console.log(`📖 Linking page "${page.name}" (${page.url}) to macro "${macroName}"`)
      
      await linkPageToMacro(cujId, id, macroName, page)
      
      // UPDATE STORE - Add page to macro in the node
      const { setNodes, nodes } = useCujStore.getState()
      const updatedNodes = nodes.map((n: any) => {
        if (n.id !== id) return n
        const macros = (n.data?.macros || []).map((m: any) => {
          if (m.name !== macroName) return m
          return {
            ...m,
            pages: [...(m.pages || []), page]
          }
        })
        return { ...n, data: { ...n.data, macros } }
      })
      setNodes(updatedNodes)
      console.log('✨ Page linked to macro successfully and UI updated')
    } catch (err) {
      console.error('❌ Failed to link page to macro:', err)
    }
  }

  const handleMacroDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    const pageData = event.dataTransfer.types.includes('application/dynapage')
    if (pageData) {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  // ============================================
  // STEP DELETION
  // ============================================
  const deleteStepNode = async (event: React.MouseEvent): Promise<void> => {
    event.stopPropagation()
    
    const cujId = useCujStore.getState().selectedCujId
    if (!cujId) return

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'étape "${title}" et tous les liens?`)) {
      return
    }

    try {
      console.log(`🗑️ Deleting step "${id}"`)
      await deleteStep(cujId, id)
      
      // Update store - remove the node
      const { setNodes, nodes, setEdges, edges } = useCujStore.getState()
      const updatedNodes = nodes.filter((n: any) => n.id !== id)
      const updatedEdges = edges.filter((e: any) => e.source !== id && e.target !== id)
      
      setNodes(updatedNodes)
      setEdges(updatedEdges)
      console.log('✨ Step deleted successfully')
    } catch (err) {
      console.error('❌ Failed to delete step:', err)
    }
  }

  // ============================================
  // PAGE DELETION
  // ============================================
  const deletePageFromMacroFunc = async (event: React.MouseEvent, macroName: string, pageUrl: string): Promise<void> => {
    event.stopPropagation()
    
    const cujId = useCujStore.getState().selectedCujId
    if (!cujId) return

    try {
      console.log(`🗑️ Deleting page "${pageUrl}" from macro "${macroName}"`)
      await deletePageFromMacro(cujId, id, macroName, pageUrl)
      
      // Update store
      const { setNodes, nodes } = useCujStore.getState()
      const updatedNodes = nodes.map((n: any) => {
        if (n.id !== id) return n
        const macros = (n.data?.macros || []).map((m: any) => {
          if (m.name !== macroName) return m
          return {
            ...m,
            pages: (m.pages || []).filter((p: any) => p.url !== pageUrl)
          }
        })
        return { ...n, data: { ...n.data, macros } }
      })
      setNodes(updatedNodes)
      console.log('✨ Page deleted successfully')
    } catch (err) {
      console.error('❌ Failed to delete page:', err)
    }
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div 
      className={`custom-node ${isDragOver ? 'drag-over' : ''}`}
      data-id={id}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleMacroDrop}
    >
      <Handle type="target" position={Position.Left} />

      {/* TITLE SECTION */}
      <div className="node-title-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {data.stepNumber && (
            <div className="step-number-badge">{data.stepNumber}</div>
          )}
          {data.isStartStep && (
            <div className="start-badge">🚀 Départ</div>
          )}
        </div>
        <div className="node-title" onDoubleClick={onTitleDouble}>
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={onTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onTitleSave()
              }}
              autoFocus
            />
          ) : (
            title
          )}
        </div>
        <button 
          className="step-delete-btn"
          onClick={deleteStepNode}
          title="Delete step"
        >
          ✕
        </button>
        {/* show start toggle only on selected node */}
        {selectedNodeId === id && (
          <button
            className={`start-btn ${startStepId === id ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setStartStepId(startStepId === id ? null : id)
            }}
            title="Mark as start step"
          >
            🚩
          </button>
        )}
      </div>

      {/* MACROS DROP ZONE - SINGLE DROP TARGET */}
      <div
        className="node-macros-compact"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleMacroDrop}
      >
        {(data.macros || []).length === 0 ? (
          <div className="macro-empty-state">Aucune macro</div>
        ) : (
          <div className="macro-list">
            {(data.macros || []).map((macro: any, idx: number) => (
              <div
                key={`${macro.name}-${idx}`}
                className="macro-child-item"
                onDoubleClick={(e) => onMacroDouble(e, macro)}
                onDragOver={handleMacroDragOver}
                onDrop={(e) => handlePageDrop(e, macro.name)}
              >
                {editingMacroName === macro.name ? (
                  <input
                    value={editingMacroValue}
                    onChange={(e) => setEditingMacroValue(e.target.value)}
                    onBlur={() => saveMacroRename(macro.name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveMacroRename(macro.name)
                      if (e.key === 'Escape') setEditingMacroName(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <div className="macro-item-content">
                    <div className="macro-name-and-pages">
                      <span className="macro-name">{macro.name}</span>
                    </div>
                    <button 
                      className="macro-delete-btn"
                      onClick={(e) => deleteMacro(e, macro.name)}
                      title="Delete macro"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {/* Pages list under macro */}
                {editingMacroName !== macro.name && macro.pages && macro.pages.length > 0 && (
                  <div className="pages-list">
                    {macro.pages.map((page: any, pIdx: number) => (
                      <div key={`${macro.name}-page-${pIdx}`} className="page-item">
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="page-link-text"
                          title={page.name}
                        >
                          📄 {page.name}
                        </a>
                        <button
                          className="page-delete-btn"
                          onClick={(e) => deletePageFromMacroFunc(e, macro.name, page.url)}
                          title="Delete page"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default CustomNode
