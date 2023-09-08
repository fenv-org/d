import { DependencyGraph } from '../../dart/mod.ts'
import { poll, prepare, TraversalState } from './traversal_util.ts'

/**
 * Result of visiting a node.
 */
export enum VisitResult {
  /**
   * Continue the traversal.
   */
  Continue,
  /**
   * Stop the traversal.
   *
   * It does not stop immediately. The traversal will stop after the current
   * visiting nodes are done.
   */
  Stop,
}

/**
 * Callback that is called when a node is visiting.
 *
 * @param node The node that is visiting.
 * @returns `VisitResult.Continue` to continue the traversal.
 *          `VisitResult.Stop` to stop the traversal.
 */
export type OnVisitCallback = (node: string) => Promise<VisitResult>

/**
 * A asynchronous worker that traverses a graph in the bottom-to-top order.
 */
export class Traversal {
  private constructor(options: {
    state: TraversalState
    nodes: string[]
    inboundEdges: Record<string, string[]>
    concurrency: number
    onVisit: OnVisitCallback
  }) {
    this.#concurrency = options.concurrency
    this.#onVisit = options.onVisit
    this.#state = options.state
  }

  readonly #onVisit: OnVisitCallback
  readonly #state: TraversalState
  readonly #visitingNodes: Set<string> = new Set()

  /**
   * Maximum number of nodes that can be visited concurrently.
   *
   * When set to 0, the traversal will stop.
   */
  #concurrency: number

  /**
   * Create a traversal from the given dependency {@link graph}.
   *
   * - `options.onVisit` will be called when a node is visiting.
   * - `options.concurrency` is the maximum number of nodes that can be visited
   *   concurrently. Default to 5.
   */
  static fromDependencyGraph(
    graph: DependencyGraph,
    options: {
      onVisit: OnVisitCallback
      concurrency?: number
    },
  ): Traversal {
    return this.fromGraph(
      {
        nodes: graph.projects.map((project) => project.name),
        inboundEdges: Object.entries(graph.reverseEdges)
          .map(([projectName, neighbors]) => ({
            [projectName]: neighbors.map((neighbor) => neighbor.name),
          }))
          .reduce((acc, entry) => ({ ...acc, ...entry }), {}),
        ...options,
      },
    )
  }

  /**
   * Create a traversal from the given `options.nodes` and
   * `options.inboundEdges`.
   *
   * - `options.onVisit` will be called when a node is visiting.
   * - `options.concurrency` is the maximum number of nodes that can be visited
   *   concurrently. Default to 5.
   */
  static fromGraph(
    options: {
      nodes: string[]
      inboundEdges: Record<string, string[]>
      onVisit: OnVisitCallback
      concurrency?: number
    },
  ): Traversal {
    const worker = new Traversal({
      ...options,
      state: prepare({
        nodes: options.nodes,
        inboundEdges: options.inboundEdges,
      }),
      concurrency: options?.concurrency ?? 5,
    })

    return worker
  }

  /**
   * Start the traversal.
   */
  start() {
    this.#run()
  }

  /**
   * Stop the traversal. The traversal will stop after the current visiting
   * nodes are done.
   */
  cancel() {
    this.#concurrency = 0
  }

  #run(removeNode?: string) {
    const room = this.#concurrency -
      this.#visitingNodes.size
    if (room > 0) {
      const nodes = poll({
        state: this.#state,
        removeNode,
        maximum: room,
      })
      for (const node of nodes) {
        this.#visitingNodes.add(node)
        this.#visit(node)
      }
    }
  }

  async #visit(node: string): Promise<void> {
    const visitResult = await this.#onVisit(node)
    switch (visitResult) {
      case VisitResult.Continue: {
        this.#run(node)
        break
      }

      case VisitResult.Stop:
        this.#concurrency = 0
    }
  }
}
