import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { DError } from 'error/mod.ts'
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

  try {
    await Traversal.serialTraverseInOrdered(workspace, {
      context,
      command: 'flutter',
      args: ['pub', ...args],
      earlyExit: options.earlyExit,
    })
  } catch (error) {
    throw new DError(`Failed to run \`pub\` command with result: ${error}`)
  }
}
