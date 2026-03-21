import { Node, Edge } from 'reactflow'

interface PositionedNode extends Node {
  position: { x: number; y: number }
  data: any & { stepNumber?: number; isStartStep?: boolean }
}

/**
 * Calcul du layout hiérarchique.
 * @param nodes liste des nœuds
 * @param edges liens entre nœuds
 * @param startId optionnel id du nœud de départ pour numérotation
 * @param preservePositions si vrai on conserve la position existante au lieu de recomposer
 */
export function calculateHierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  startId?: string | null,
  preservePositions: boolean = false
): PositionedNode[] {
  if (nodes.length === 0) return []

  // build adjacency graph and indegree map
  const graph = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  nodes.forEach(node => {
    graph.set(node.id, [])
    inDegree.set(node.id, 0)
  })

  edges.forEach(edge => {
    if (graph.has(edge.source) && graph.has(edge.target)) {
      graph.get(edge.source)!.push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    }
  })

  // topological sort to determine horizontal order (not affected by startId)
  const queue: string[] = []
  const order: string[] = []
  
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId)
    }
  })

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    order.push(nodeId)
    graph.get(nodeId)?.forEach(neighbor => {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1)
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor)
      }
    })
  }

  nodes.forEach(node => {
    if (!order.includes(node.id)) {
      order.push(node.id)
    }
  })

  const HORIZONTAL_SPACING = 280
  const NODE_WIDTH = 200

  const positionMap = new Map<string, { x: number; y: number }>()
  order.forEach((nodeId, index) => {
    const x = index * HORIZONTAL_SPACING
    const y = 50
    positionMap.set(nodeId, { x, y })
  })

  // numbering
  const stepNumberMap = new Map<string, number>()
  if (startId && nodes.find((n) => n.id === startId)) {
    // BFS from startId to number reachable nodes
    const visited = new Set<string>()
    const q: string[] = []
    let counter = 1
    visited.add(startId)
    q.push(startId)
    while (q.length > 0) {
      const nid = q.shift()!
      stepNumberMap.set(nid, counter++)
      const neighbors = graph.get(nid) || []
      neighbors.forEach((nbr) => {
        if (!visited.has(nbr)) {
          visited.add(nbr)
          q.push(nbr)
        }
      })
    }
  } else {
    // default numbering: order of appearance in nodes array
    nodes.forEach((node, idx) => {
      stepNumberMap.set(node.id, idx + 1)
    })
  }

  // mark start step only when an explicit startId is provided
  const isStartStepFn = (nodeId: string) => {
    return startId ? nodeId === startId : false
  }

  return nodes.map((node) => ({
    ...node,
    position: preservePositions ? node.position : positionMap.get(node.id) || node.position,
    data: {
      ...node.data,
      stepNumber: stepNumberMap.get(node.id) || undefined,
      isStartStep: isStartStepFn(node.id)
    }
  }))
}

/**
 * Applique le layout hiérarchique aux nœuds
 */
export function applyHierarchicalLayout(nodes: Node[], edges: Edge[], startId?: string | null): Node[] {
  return calculateHierarchicalLayout(nodes, edges, startId, false)
}

