import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { DependencyGraph } from 'dart/mod.ts'
import { DError } from 'error/mod.ts'
import { runFlutterCommand } from 'util/mod.ts'
import { Workspace } from 'workspace/mod.ts'
import { logPackageFilters } from '../common/package_filter_options.ts'
import { PubOptions } from './pub_command.ts'

export async function runPubCommand(
  context: Context,
  { args, options }: {
    args: string[]
    options: PubOptions
  },
): Promise<void> {
  const { logger } = context

  logger.stdout({ timestamp: true })
    .command('d pub')
    .lineFeed()

  const workspace = await Workspace.fromContext(context, {
    useBootstrapCache: 'always',
    ...options,
  })

  logger.stdout({ timestamp: true })
    .indent()
    .childArrow()
    .push((s) => s.cyan.bold(`workspace directory: ${workspace.workspaceDir}`))
    .lineFeed()
  logPackageFilters(logger, options)

  const dependencyGraph = DependencyGraph
    .fromDartProjects(workspace.dartProjects)

  // Run `flutter pub [args...]` for each package.
  // We traverse the dependency graph in topological order.
  const commonArgs = { context, workspace, args: ['pub', ...args] }
  const flutterPubGetPerEachNode = (node: string) =>
    runFlutterCommand(node, commonArgs)
  const traversal = Traversal.fromDependencyGraph(dependencyGraph, {
    concurrency: 1,
    onVisit: flutterPubGetPerEachNode,
  })

  try {
    await traversal.start()
  } catch (error) {
    throw new DError(`Failed to bootstrap with result: ${error}`)
  }
}
