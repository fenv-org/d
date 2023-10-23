import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { DError } from 'error/mod.ts'
import { Chain } from 'util/mod.ts'
import { Workspace } from 'workspace/mod.ts'
import {
  logDependencyFilters,
  stripDependencyFilterOptions,
} from '../common/dependency_filter_options.ts'
import { stripEarlyExitOptions } from '../common/early_exit_options.ts'
import {
  logPackageFilters,
  stripPackageFilterOptions,
} from '../common/package_filter_options.ts'
import { PubOptions } from './pub_command.ts'

export async function runPubCommand(
  context: Context,
  { options, rawArgs }: {
    rawArgs: string[]
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
  logDependencyFilters(logger, options)

  // Strips the options that are not supported by `flutter test`.
  const myRawArgs = Chain.of(rawArgs)
    .map(stripEarlyExitOptions)
    .map(stripPackageFilterOptions)
    .map(stripDependencyFilterOptions)
    .value
  try {
    await Traversal.serialTraverseInOrdered(workspace, {
      context,
      command: 'flutter',
      args: ['pub', ...myRawArgs.slice(1)],
      earlyExit: options.earlyExit,
    })
  } catch (error) {
    throw new DError(`Failed to run \`pub\` command with result: ${error}`)
  }
}
