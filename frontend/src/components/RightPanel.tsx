import React, { useEffect, useState } from 'react'
import { useCujStore } from '../store/store'
import { getPages } from '../api/dynatraceApi'

const RightPanel: React.FC = () => {
  const { selectedNodeId, nodes } = useCujStore()
  const [pages, setPages] = useState<any[]>([])

  const node = nodes.find((n) => n.id === selectedNodeId)

  useEffect(() => {
    ;(async () => {
      try {
        const p = await getPages()
        setPages(p)
      } catch (err) {
        console.error(err)
      }
    })()
  }, [])

  return (
    <aside className="right-panel">
      <div className="panel">
        <div className="panel-title">Pages Disponibles</div>
        <div className="panel-body">
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 12px 0' }}>Glissez les pages sur les macros dans le diagramme</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pages.map(p => (
                <div 
                  key={p.id} 
                  draggable 
                  onDragStart={(e) => e.dataTransfer.setData('application/dynapage', JSON.stringify(p))} 
                  style={{ 
                    padding: 8, 
                    background: '#f9f9f9', 
                    borderRadius: 6, 
                    border: '1px solid #ddd',
                    cursor: 'grab',
                    fontSize: 13
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <small style={{ color:'#888', display: 'block', marginTop: 2 }}>{p.url}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {node && (
        <div className="panel">
          <div className="panel-title">Étape Sélectionnée</div>
          <div className="panel-body">
            <div style={{ marginBottom: 12 }}>
              <strong style={{ display: 'block', marginBottom: 4 }}>Nom : {node.data?.label}</strong>
            </div>
            {(node?.data?.macros || []).length > 0 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12 }}>Macros attachées à cette étape</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(node?.data?.macros || []).map((m:any) => (
                    <div key={m.name} style={{ padding: 6, background: '#f0f0f0', borderRadius: 4, fontSize: 12 }}>
                      <div style={{ fontWeight: 500 }}>{m.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

export default RightPanel
