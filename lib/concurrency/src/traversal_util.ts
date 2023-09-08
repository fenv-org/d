export interface TraversalState {
  remainingNodeCount: number
  queue: string[]
  inboundEdges: Record<string, string[]>
  outDegreeMap: Record<string, number>
}

export function prepare(options: {
  nodes: string[]
  inboundEdges: Record<string, string[]>
}): TraversalState {
  const { nodes } = options
  const remainingNodeCount = nodes.length
  const queue: string[] = []
  const inboundEdges = { ...options.inboundEdges }
  const outDegreeMap: Record<string, number> = {}
  for (const node of nodes) {
    outDegreeMap[node] = 0
  }
  for (const node of nodes) {
    for (const neighbor of inboundEdges[node]) {
      outDegreeMap[neighbor] += 1
    }
  }
  for (const node of nodes) {
    if (outDegreeMap[node] === 0) {
      queue.push(node)
    }
  }
  return {
    remainingNodeCount,
    queue,
    inboundEdges,
    outDegreeMap,
  }
}

export function poll(options: {
  state: TraversalState
  removeNode?: string
  maximum: number
}): string[] {
  const { state } = options
  if (options.removeNode) {
    state.remainingNodeCount -= 1
    for (const neighbor of state.inboundEdges[options.removeNode]) {
      state.outDegreeMap[neighbor] -= 1
      if (state.outDegreeMap[neighbor] === 0) {
        state.queue.push(neighbor)
      }
    }
  }
  const dequeueCount = Math.min(options.maximum, state.queue.length)
  return dequeueCount === 0 ? [] : state.queue.splice(0, dequeueCount)
}
