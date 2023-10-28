import { removeBootstrapCache } from 'cache/mod.ts'
import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { std } from 'deps.ts'
import { logLabels } from 'logger/mod.ts'
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

  if (options.flutter) {
    try {
      // Even though runs into an error during `flutter clean`, runs
      // `flutter clean` for all packages.
      await Traversal.parallelTraverseInOrdered(workspace, {
        context,
        command: 'flutter',
        args: ['clean'],
        earlyExit: false,
      })
    } catch (error) {
      logger.stderr({ timestamp: true, verbose: true })
        .label(logLabels.warning)
        .push(`: Failed to \`flutter clean\`: ${error}`)
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

  logger.stdout({ timestamp: true, verbose: true })
    .push(`Removing bootstrap cache`)
    .lineFeed()
  await removeBootstrapCache(workspace.workspaceDir)

  logger.stdout({ timestamp: true })
    .push('Successfully cleaned the workspace')
    .lineFeed()
}
