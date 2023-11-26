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
import { BuildRunnerOptions } from './build_runner_command.ts'

export async function runBuildRunnerCommand(
  context: Context,
  { args, rawArgs, options }: {
    args: string[]
    rawArgs: string[]
    options: BuildRunnerOptions
  },
): Promise<void> {
  const { logger } = context

  logger.stdout({ timestamp: true })
    .command('d build_runner')
    .lineFeed()

  const workspace = await Workspace.fromContext(context, {
    useBootstrapCache: 'always',
    ...options,
    includeDevDependency: [
      ...(options.includeDevDependency ?? []),
      'build_runner',
    ],
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
  const subcommand = args[0]
  const subcommandArgs = myRawArgs.slice(2)
  try {
    await Traversal.parallelTraverseInOrdered(workspace, {
      context,
      command: 'dart',
      args: ['run', 'build_runner', subcommand, ...subcommandArgs],
      earlyExit: options.earlyExit,
      concurrency: options.concurrency,
    })
  } catch (error) {
    throw new DError(
      `Failed to run \`build_runner\` command with result: ${error}`,
    )
  }
}
