import { DependencyGraph } from 'dart/mod.ts'
import { std } from 'deps.ts'
import { poll, prepare, TraversalState } from './traversal_util.ts'

const { deferred } = std.async

/**
 * Result of visiting a node.
 */
export type VisitResult =
  /**
   * Continue the traversal.
   */
  | {
    kind: 'continue'
  }
  /**
   * Stop the traversal.
   *
   * It does not stop immediately. The traversal will stop after the current
   * visiting nodes are done.
   */ | {
    kind: 'stop'
    code: number
  }

/**
 * Callback that is called when a node is visiting.
 *
 * @param node The node that is visiting.
 * @returns `VisitResult.Continue` to continue the traversal.
 *          `VisitResult.Stop` to stop the traversal.
 */
export type OnVisitCallback = (node: string) => Promise<VisitResult>

export type TraversalOptions = {
  /**
   * Maximum number of nodes that can be visited concurrently.
   * When set to 1, the traversal will run serially.
   *
   * @default 5
   */
  concurrency?: number
  /**
   * Callback that is called when a node is visiting.
   */
  onVisit: OnVisitCallback
  /**
   * If `true`, the traversal will stop as soon as a visit on any node ends
   * with a failure. Otherwise, the traversal will continue until all nodes
   * are visited.
   *
   * @default true
   */
  earlyExit?: boolean
}

/**
 * A asynchronous worker that traverses a graph in the bottom-to-top order.
 */
export class Traversal {
  private constructor({
    state,
    concurrency,
    earlyExit,
    onVisit,
  }: {
    state: TraversalState
    concurrency: number
    earlyExit: boolean
    onVisit: OnVisitCallback
  }) {
    this.#concurrency = concurrency
    this.#onVisit = onVisit
    this.#state = state
    this.#earlyExit = earlyExit
  }

  readonly #onVisit: OnVisitCallback
  readonly #state: TraversalState
  readonly #visitingNodes: Set<string> = new Set()
  readonly #earlyExit: boolean

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
    options = {
      concurrency: 5,
      earlyExit: true,
    } as TraversalOptions,
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
    {
      nodes,
      inboundEdges,
      onVisit,
      concurrency = 5,
      earlyExit = true,
    }: {
      nodes: string[]
      inboundEdges: Record<string, string[]>
    } & TraversalOptions,
  ): Traversal {
    const worker = new Traversal({
      state: prepare({ nodes, inboundEdges }),
      concurrency,
      earlyExit,
      onVisit,
    })

    return worker
  }

  /**
   * Start the traversal.
   *
   * @returns A promise that resolves when the traversal is done.
   */
  start(): Promise<void> {
    const promise = deferred<void>()
    this.#run(promise)
    return promise
  }

  /**
   * Stop the traversal. The traversal will stop after the current visiting
   * nodes are done.
   */
  cancel() {
    this.#concurrency = 0
  }

  #run(promise: std.async.Deferred<void>, removeNode?: string) {
    const room = this.#concurrency -
      this.#visitingNodes.size
    const result: { code?: number } = {}
    if (room > 0) {
      const nodes = poll({
        state: this.#state,
        removeNode,
        maximum: room,
      })
      if (nodes.length === 0 && this.#state.remainingNodeCount === 0) {
        if (result.code) {
          promise.reject(result.code)
        } else {
          promise.resolve()
        }
        return
      }
      for (const node of nodes) {
        this.#visitingNodes.add(node)
        this.#visit(promise, node, result)
      }
    }
  }

  async #visit(
    promise: std.async.Deferred<void>,
    node: string,
    result: { code?: number },
  ): Promise<void> {
    const visitResult = await this.#onVisit(node)
    this.#visitingNodes.delete(node)
    switch (visitResult.kind) {
      case 'continue': {
        this.#run(promise, node)
        if (this.#visitingNodes.size === 0 && this.#concurrency === 0) {
          // The finally running node is just done.
          promise.resolve()
        }
        break
      }

      case 'stop':
        console.error(
          `Stopping the traversal because of node ${node}: ${this.#earlyExit}`,
        )
        if (this.#earlyExit) {
          this.#concurrency = 0
        } else {
          this.#run(promise, node)
        }
        if (!result.code) {
          result.code = visitResult.code
        }
        if (this.#visitingNodes.size === 0) {
          // `node` is the only running node and it is just done.
          promise.reject(visitResult.code)
        }
    }
  }
}
