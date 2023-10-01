import { removeBootstrapCache } from 'cache/mod.ts'
import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { DependencyGraph } from 'dart/mod.ts'
import { std } from 'deps.ts'
import { DError } from 'error/mod.ts'
import { runFlutterClean } from 'util/mod.ts'
import { Workspace } from 'workspace/mod.ts'
import { CleanOptions } from './clean_command.ts'

export async function runCleanCommand(
  context: Context,
  options: { flags: CleanOptions },
): Promise<void> {
  const { flags } = options
  const { logger } = context

  logger.stdout({ timestamp: true })
    .command('d clean')
    .lineFeed()

  const workspace = await Workspace.fromContext(context, {
    useBootstrapCache: 'fallbackToWorkspaceFile',
    ...flags,
  })

  logger.stdout({ timestamp: true })
    .indent()
    .childArrow()
    .push((s) => s.cyan.bold(`workspace directory: ${workspace.workspaceDir}`))
    .lineFeed()

  logger.stdout({ timestamp: true, verbose: true })
    .push(`Removing bootstrap cache`)
    .lineFeed()
  await removeBootstrapCache(workspace.workspaceDir)

  if (flags.flutter) {
    // Run `flutter clean` for each package.
    // We traverse the dependency graph in topological order.
    const dependencyGraph = DependencyGraph
      .fromDartProjects(workspace.dartProjects)
    const commonArgs = { context, workspace }
    const flutterPubGetPerEachNode = (node: string) =>
      runFlutterClean(node, commonArgs)
    const traversal = Traversal.fromDependencyGraph(dependencyGraph, {
      onVisit: flutterPubGetPerEachNode,
    })

    // TODO: We should not throw an error here.
    // TODO: We should not exit early.
    try {
      await traversal.start()
    } catch (error) {
      throw new DError(`Failed to bootstrap with result: ${error}`)
    }
  }

  for (const dartProject of workspace.dartProjects) {
    if (
      dartProject.pubspecOverridesFilepath &&
      await std.fs.exists(dartProject.pubspecOverridesFilepath)
    ) {
      logger.stdout({ timestamp: true, verbose: true })
        .push(
          'Removing pubspec overrides file: ' +
            dartProject.pubspecOverridesFilepath,
        )
        .lineFeed()
      await Deno.remove(dartProject.pubspecOverridesFilepath)
    }
  }

  logger.stdout({ timestamp: true })
    .push('Successfully cleaned the workspace')
    .lineFeed()
}
