import { Context } from 'context/mod.ts'
import { DependencyGraph } from 'dart/mod.ts'
import { std } from 'deps.ts'
import { Logger, logLabels } from 'logger/mod.ts'
import { runFunction, runShellCommand } from 'util/mod.ts'
import { Workspace } from 'workspace/mod.ts'
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
 * A specification to run.
 */
export type ExecutionSpec =
  | {
    command: string
    args: string[]
  }
  | {
    functionName: string
    exec: string
    pathParams: Record<string, string>
    args: string[]
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
   * Traverse the given {@link workspace} serially and run `command` with
   * `args` on each package.
   */
  static serialTraverseInOrdered(
    workspace: Workspace,
    options:
      & {
        context: Context
        earlyExit?: boolean
      }
      & ExecutionSpec,
  ): Promise<void> {
    return Traversal.parallelTraverseInOrdered(workspace, {
      ...options,
      concurrency: 1,
    })
  }

  /**
   * Traverse the given {@link workspace} in parallel and run `command` with
   * `args` on each package. The maximum parallelism is controlled by
   * `options.concurrency`, which defaults to 5.
   */
  static async parallelTraverseInOrdered(
    workspace: Workspace,
    options:
      & {
        context: Context
        earlyExit?: boolean
        concurrency?: number
      }
      & ExecutionSpec,
  ): Promise<void> {
    const dependencyGraph = DependencyGraph.fromDartProjects(
      workspace.dartProjects,
    )
    const traverse = Traversal.fromDependencyGraph(dependencyGraph, {
      ...options,
      onVisit: (node) => _onVisit(node, { ...options, workspace }),
    })
    await traverse.start()
  }

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

async function _onVisit(
  node: string,
  options:
    & {
      context: { logger: Logger }
      workspace: Workspace
    }
    & ExecutionSpec,
): Promise<VisitResult> {
  const { workspace, context: { logger } } = options
  const dartProject = workspace.dartProjects.find((project) =>
    project.name === node
  )!

  logger.stdout({ timestamp: true })
    .package(node)
    .push((s) => s.bold('Running: '))
    .lineFeed()

  let relativePackageDirectory = std.path.relative(
    workspace.workspaceDir,
    dartProject.path,
  )
  relativePackageDirectory = relativePackageDirectory === ''
    ? '.'
    : relativePackageDirectory
  logger.stdout({ timestamp: true })
    .indent()
    .childArrow()
    .push((s) => s.cyan.bold(`package directory: ${relativePackageDirectory}`))
    .lineFeed()

  let output: Deno.CommandStatus
  if ('functionName' in options) {
    const { functionName, args } = options
    const command = args.length > 0
      ? `${functionName} -- ${args.join(' ')}`
      : functionName
    logger.stdout({ timestamp: true })
      .indent(2)
      .childArrow()
      .command(command)
      .lineFeed()

    output = await runFunction({
      ...options,
      dartProject,
      workspacePath: workspace.workspaceDir,
      logger,
    })
  } else {
    const { command, args } = options
    logger.stdout({ timestamp: true })
      .indent(2)
      .childArrow()
      .command(`${command} ${args.join(' ')}`, { withDollarSign: true })
      .lineFeed()

    output = await runShellCommand(command, {
      args,
      dartProject,
      workspacePath: workspace.workspaceDir,
      logger,
    })
  }
  if (!output.success) {
    logger.stderr()
      .label(logLabels.error)
      .package(node)
      .push((s) => s.red(`Ends with code: ${output.code}`))
      .lineFeed()
    return { kind: 'stop', code: output.code }
  }
  return { kind: 'continue' }
}
