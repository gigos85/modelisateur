import React, { useEffect, useState, useCallback } from 'react'
import ReactFlow, { Background, Controls, ReactFlowInstance, Edge as RFEdge, Connection } from 'reactflow'
import CustomNode from './CustomNode'
import { createEdge, linkMacroToStep, deleteEdge, saveCujLayout } from '../api/cujApi'
import { applyHierarchicalLayout } from '../utils/layoutEngine'
import 'reactflow/dist/style.css'
import { useCujStore } from '../store/store'

// Define nodeTypes OUTSIDE component to avoid React Flow warnings
const nodeTypes = { cujNode: CustomNode }

// Utility for debounce
function useDebounce(callback: any, delay: number) {
  const timeoutRef = React.useRef<any>(null)
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}

const CanvasArea: React.FC = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, addStep, addNode, setSelectedNodeId, selectedCujId, setEdges, startStepId } = useCujStore()
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)

  // Auto-save function (now also persists startStepId)
  const performAutoSave = useCallback(async (nodesToSave: any[], edgesToSave: any[], startId: string | null) => {
    if (!selectedCujId) return
    try {
      console.log('💾 Auto-saving layout...')
      await saveCujLayout(selectedCujId, nodesToSave, edgesToSave, startId)
      console.log('✅ Layout saved successfully')
    } catch (err) {
      console.error('❌ Auto-save failed', err)
    }
  }, [selectedCujId])

  // Debounced auto-save
  const debouncedAutoSave = useDebounce(performAutoSave, 1000)

  // Auto-save on nodes/edges/start step change
  useEffect(() => {
    debouncedAutoSave(nodes, edges, startStepId)
  }, [nodes, edges, startStepId, debouncedAutoSave])

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setRfInstance(instance)
  }, [])

  // whenever the edges or explicit start step change we need to recompute numbers
  React.useEffect(() => {
    const { setNodes, nodes: current } = useCujStore.getState()
    const updated = applyHierarchicalLayout(current, edges, startStepId)
    // preserve positions and only update if numbers/flags changed
    let changed = false
    const merged = updated.map((n: any, idx: number) => {
      const old = current[idx]
      if (
        old.data.stepNumber !== n.data.stepNumber ||
        old.data.isStartStep !== n.data.isStartStep
      ) {
        changed = true
        return { ...n, position: old.position } // keep original position
      }
      return old
    })
    if (changed) {
      setNodes(merged)
    }
  }, [edges, startStepId, nodes.length])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDragLeaveCanvas = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      console.log('🚪 CANVAS DRAGLEAVE')
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    // Only handle step drops on the canvas (creating new nodes)
    // Macro drops are handled by CustomNode
    const stepData = e.dataTransfer.getData('application/reactflow')
    
    if (!stepData) return
    
    try {
      const parsed = JSON.parse(stepData)
      if (parsed.kind === 'step') {
        const reactFlowBounds = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        const x = e.clientX - reactFlowBounds.left
        const y = e.clientY - reactFlowBounds.top
        const position = rfInstance ? rfInstance.project({ x, y }) : { x, y }

        const node = {
          id: crypto.randomUUID(),
          position,
          data: { label: parsed.title || 'Étape', macros: [] },
          type: 'cujNode'
        }

        addNode(node)
        console.log('✨ Step node created')
      }
    } catch (err) {
      console.error('❌ Step drop parse error:', err)
    }
  }

  const onConnect = async (params: Connection | any) => {
    // params: { source, target }
    if (!params || !params.source || !params.target) return
    // persist to backend
    if (selectedCujId) {
      try {
        await createEdge(selectedCujId, { from: params.source, to: params.target })
      } catch (err) {
        console.error('createEdge failed', err)
      }
    }
    const newEdge: RFEdge = { id: `${params.source}-${params.target}`, source: params.source, target: params.target }
    setEdges([...(edges || []), newEdge])
  }

  const onEdgeDoubleClick = async (_: any, edge: any) => {
    // remove edge locally and on backend
    const from = edge.source
    const to = edge.target
    // optimistic update
    const remaining = (edges || []).filter((e) => !(e.source === from && e.target === to))
    setEdges(remaining)
    if (selectedCujId) {
      try {
        await deleteEdge(selectedCujId, { from, to })
      } catch (err) {
        console.error('deleteEdge failed', err)
      }
    }
  }

  const onNodeClick = (_: any, node: any) => {
    setSelectedNodeId(node.id)
  }

  return (
    <div className="canvas-area">
      <div className="canvas-stage" onDragOver={onDragOver} onDragLeave={onDragLeaveCanvas} onDrop={onDrop}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView onInit={onInit} onNodeClick={onNodeClick} onConnect={onConnect} onEdgeDoubleClick={onEdgeDoubleClick} nodeTypes={nodeTypes}>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}

export default CanvasArea
