import { create } from 'zustand'
import { Node, Edge, applyNodeChanges, applyEdgeChanges } from 'reactflow'

type Store = {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: any
  onEdgesChange: any
  addStep: () => void
  addNode: (node: Node) => void
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  selectedCujId: string | null
  setSelectedCujId: (id: string | null) => void
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  selectedCujTitle: string | null
  setSelectedCujTitle: (title: string | null) => void
  selectedCujCriticity: 'or' | 'argent' | 'bronze' | null
  setSelectedCujCriticity: (c: 'or' | 'argent' | 'bronze' | null) => void
  // explicit start step for numbering/layout
  startStepId: string | null
  setStartStepId: (id: string | null) => void
}

export const useCujStore = create<Store>((set, get) => ({
  nodes: [],
  edges: [],
  selectedCujId: null,
  selectedNodeId: null,
  selectedCujTitle: null,
  selectedCujCriticity: null,

  onNodesChange: (changes: any) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),

  onEdgesChange: (changes: any) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  addStep: () =>
    set({
      nodes: [
        ...get().nodes,
        {
          id: crypto.randomUUID(),
          position: { x: Math.random() * 400, y: Math.random() * 400 },
          data: { label: 'New Step', macros: [] },
          type: 'cujNode'
        }
      ]
    }),

  addNode: (node: Node) =>
    set({
      nodes: [...get().nodes, node]
    }),

  setNodes: (nodes: Node[]) => set({ nodes }),
  setEdges: (edges: Edge[]) => set({ edges }),

  setSelectedCujId: (id: string | null) => set({ selectedCujId: id }),
  setSelectedNodeId: (id: string | null) => set({ selectedNodeId: id }),
  setSelectedCujTitle: (title: string | null) => set({ selectedCujTitle: title }),
  setSelectedCujCriticity: (c: 'or' | 'argent' | 'bronze' | null) => set({ selectedCujCriticity: c }),

  startStepId: null,
  setStartStepId: (id: string | null) => set({ startStepId: id })
}))
