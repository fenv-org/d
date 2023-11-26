import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { DError } from 'error/mod.ts'
import { Workspace } from 'workspace/mod.ts'
import { logDependencyFilters } from '../common/dependency_filter_options.ts'
import { logPackageFilters } from '../common/package_filter_options.ts'
import { RunOptions } from './run_command.ts'

export async function runRunCommand(
  context: Context,
  { options, literal }: {
    literal: string[]
    options: RunOptions
  },
): Promise<void> {
  const { logger } = context

  logger.stdout({ timestamp: true })
    .command('d run')
    .lineFeed()

  if (literal.length === 0) {
    throw new DError('No command specified: `d run` requires a command to run.')
  } else if (literal.length > 1) {
    throw new DError(
      'Two many commands specified: ' +
        '`d run` only supports one command at a time.',
    )
  }

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

  const command = literal[0]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('; ')

  try {
    await Traversal.parallelTraverseInOrdered(workspace, {
      context,
      command,
      args: [],
      earlyExit: options.earlyExit,
      concurrency: options.concurrency,
    })
  } catch (error) {
    throw new DError(
      `Failed to run \`${command}\` command with result: ${error}`,
    )
  }
}
