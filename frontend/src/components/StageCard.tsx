import React, { useState } from 'react'
import { useCujStore } from '../store/store'
import { updateStep, updateCujMacroName, deleteStep, deleteCujMacro, deleteCujMacroById, updateCujMacroById } from '../api/cujApi'

type Props = {
  id?: string
  title: string
  subtitle?: string
  code?: string
  criticity?: string
  kind?: 'step' | 'macro'
  onRename?: (newName: string, oldName?: string) => void
  onDelete?: () => void
}

const StageCard: React.FC<Props> = ({ id, title, subtitle, code, criticity, kind = 'macro', onRename, onDelete }) => {
  const [editing, setEditing] = useState(false)
  const [hover, setHover] = useState(false)
  const [localTitle, setLocalTitle] = useState(title)

  React.useEffect(() => {
    setLocalTitle(title)
  }, [title])

  const onDragStart = (e: React.DragEvent) => {
    const payload: any = { title: localTitle, subtitle }
    if (id) payload.id = id
    payload.kind = kind
    
    // Use 'application/macro' for sidebar items to avoid React Flow interception
    // Use 'application/reactflow' only for canvas drops (creating new nodes)
    if (kind === 'macro') {
      e.dataTransfer.setData('application/macro', JSON.stringify(payload))
    } else {
      e.dataTransfer.setData('application/reactflow', JSON.stringify(payload))
    }
    // Use 'all' for maximum compatibility with different drop targets
    e.dataTransfer.effectAllowed = 'all'
  }

  const save = async () => {
    const newName = (localTitle || '').trim()
    if (!newName || newName === title) { setEditing(false); return }
    try {
      const cujId = useCujStore.getState().selectedCujId
      if (!cujId) return
      if (kind === 'step') {
        if (!id) return
        await updateStep(cujId, id, { name: newName })
        // update local node if present
        const { setNodes, nodes } = useCujStore.getState()
        setNodes(nodes.map(n => n.id === id ? { ...n, data: { ...n.data, label: newName } } : n))
      } else {
        // macro at CUJ level rename
        if (id) {
          await updateCujMacroById(cujId, id, { newName })
        } else {
          await updateCujMacroName(cujId, title, { newName })
        }
      }
      if (onRename) onRename(newName, title)
    } catch (err) { console.error(err) }
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) return
    
    try {
      const cujId = useCujStore.getState().selectedCujId
      if (!cujId) return
      console.log('Deleting', kind, '"' + title + '"', id ? `(id=${id})` : '')
      if (kind === 'step') {
        if (!id) return
        await deleteStep(cujId, id)
        // Remove from store
        const { setNodes, nodes } = useCujStore.getState()
        setNodes(nodes.filter(n => n.id !== id))
      } else {
        // Delete macro at CUJ level (use id when available to avoid encoding issues)
        if (id) {
          await deleteCujMacroById(cujId, id)
        } else {
          await deleteCujMacro(cujId, title)
        }
      }
      
      if (onDelete) onDelete()
    } catch (err) { 
      console.error('Error deleting:', err)
    }
  }

  return (
    <div
      className="stage-card"
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
    >
      <div style={{ flex: 1 }}>
        {code && <div className="stage-card-code">{code}</div>}
        <div className="stage-card-title" onDoubleClick={() => setEditing(true)}>
          {editing ? (
            <input
              value={localTitle}
              onChange={(e)=>setLocalTitle(e.target.value)}
              onBlur={save}
              onKeyDown={(e)=>{ if (e.key === 'Enter') save() }}
              autoFocus
            />
          ) : (
            localTitle
          )}
        </div>
        <div className="stage-card-meta">
          {criticity && <span className="stage-card-criticity">{criticity}</span>}
          {subtitle && <div className="stage-card-sub">{subtitle}</div>}
        </div>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          padding: '4px 8px',
          fontSize: '12px',
          background: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          flexShrink: 0,
          opacity: hover ? 1 : 0,
          transition: 'opacity 0.2s'
        }}
        title={`Supprimer cette ${kind}`}
      >
        ✕
      </button>
    </div>
  )
}

export default StageCard
