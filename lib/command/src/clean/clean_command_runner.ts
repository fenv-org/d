import { removeBootstrapCache } from 'cache/mod.ts'
import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { DependencyGraph } from 'dart/mod.ts'
import { std } from 'deps.ts'
import { runFlutterClean } from 'util/mod.ts'
import { Workspace } from 'workspace/mod.ts'
import { CleanOptions } from './clean_command.ts'

export async function runCleanCommand(
  context: Context,
  { options }: {
    options: CleanOptions
  },
): Promise<void> {
  const { logger } = context

  logger.stdout({ timestamp: true })
    .command('d clean')
    .lineFeed()

  const workspace = await Workspace.fromContext(context, {
    useBootstrapCache: 'fallbackToWorkspaceFile',
    ...options,
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

  if (options.flutter) {
    // Run `flutter clean` for each package.
    // We traverse the dependency graph in topological order.
    const dependencyGraph = DependencyGraph
      .fromDartProjects(workspace.dartProjects)
    const commonArgs = { context, workspace }
    const flutterCleanPerEachNode = (node: string) =>
      runFlutterClean(node, commonArgs)

    // Even though runs into an error during `flutter clean`, runs
    // `flutter clean` for all packages.
    const traversal = Traversal.fromDependencyGraph(dependencyGraph, {
      onVisit: flutterCleanPerEachNode,
      earlyExit: false,
    })

    try {
      await traversal.start()
    } catch (error) {
      logger.stderr({ timestamp: true, verbose: true })
        .push(`Failed to clean the workspace: ${error}`)
        .lineFeed()
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
