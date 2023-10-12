import { saveBootstrapCache } from 'cache/mod.ts'
import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { DependencyGraph } from 'dart/mod.ts'
import { DError } from 'error/mod.ts'
import { Workspace } from 'workspace/mod.ts'
import { logPackageFilters } from '../common/package_filter_options.ts'
import { BootstrapOptions } from './bootstrap_command.ts'
import { writePubspecOverridesYamlFiles } from './bootstrap_pubspec_overrides.ts'

export async function runBootstrapCommand(
  context: Context,
  { options }: {
    options: BootstrapOptions
  },
): Promise<void> {
  const { logger } = context

  logger.stdout({ timestamp: true })
    .command('d bootstrap')
    .lineFeed()

  logger.stdout({ timestamp: true })
    .indent()
    .push('Loading `d.yaml` file')
    .lineFeed()
  const workspace = await Workspace.fromContext(context, {
    useBootstrapCache: 'never',
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

  logger.stdout({ timestamp: true })
    .indent().indent()
    .push('Generating `pubspec_overrides.yaml` files')
    .lineFeed()
  await writePubspecOverridesYamlFiles(workspace)

  try {
    await Traversal.serialTraverseInOrdered(workspace, {
      context,
      command: 'flutter',
      args: ['pub', 'get'],
    })
  } catch (error) {
    throw new DError(`Failed to \`bootstrap\` with result: ${error}`)
  }

  logger.stdout({ timestamp: true })
    .push('Successfully bootstrapped and writing bootstrap cache')
    .lineFeed()
  await saveBootstrapCache(workspace, dependencyGraph)
}
