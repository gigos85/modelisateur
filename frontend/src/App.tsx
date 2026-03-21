import React, { useState, useEffect } from 'react'
import { useCujStore } from './store/store'
import CanvasArea from './components/CanvasArea'
import Sidebar from './components/Sidebar'
import RightPanel from './components/RightPanel'
import { updateCuj } from './api/cujApi'
import './index.css'

export default function App() {
  const { addStep, selectedCujTitle, selectedCujCriticity, selectedCujId, setSelectedCujTitle, setSelectedCujCriticity } = useCujStore()
  const [title, setTitle] = useState<string>(selectedCujTitle || '')
  const [crit, setCrit] = useState<'or'|'argent'|'bronze'|null>(selectedCujCriticity || null)
  const [editingTitle, setEditingTitle] = useState(false)

  useEffect(()=>{
    setTitle(selectedCujTitle || '')
    setCrit(selectedCujCriticity || null)
  }, [selectedCujTitle, selectedCujCriticity])

  const onSave = async () => {
    if (!selectedCujId) return
    await updateCuj(selectedCujId, { name: title, criticity: crit })
    setSelectedCujTitle(title)
    setSelectedCujCriticity(crit)
    setEditingTitle(false)
  }

  return (
    <div className="app-root">
      <Sidebar />

      <main className="canvas-column">
        <div className="canvas-header">
          <div style={{display:'flex',alignItems:'center',gap:12,width:'100%'}}>
            <div style={{flex:1}}>
              <div onDoubleClick={()=>setEditingTitle(true)} style={{fontSize:18,fontWeight:700,width:'100%'}}>
                {editingTitle ? (
                  <input
                    value={title}
                    onChange={(e)=>setTitle(e.target.value)}
                    placeholder="Nom du parcours"
                    onBlur={onSave}
                    onKeyDown={(e)=>{ if (e.key === 'Enter') onSave() }}
                    autoFocus
                    style={{fontSize:18,fontWeight:700,width:'100%'}}
                  />
                ) : (
                  <div style={{padding:6}}>{title || 'Double-cliquez pour éditer le nom du parcours'}</div>
                )}
              </div>
              <div className="criticality">Criticité: <span className="gold">{crit ? (crit==='or' ? 'Or' : crit==='argent' ? 'Argent' : 'Bronze') : '—'}</span></div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <label><input type="radio" name="crit" checked={crit==='or'} onChange={()=>setCrit('or')} /> Or</label>
              <label><input type="radio" name="crit" checked={crit==='argent'} onChange={()=>setCrit('argent')} /> Argent</label>
              <label><input type="radio" name="crit" checked={crit==='bronze'} onChange={()=>setCrit('bronze')} /> Bronze</label>
              <button className="add-btn" onClick={onSave}>Save</button>
            </div>
          </div>
        </div>

        <CanvasArea />
      </main>

      <RightPanel />
    </div>
  )
}
