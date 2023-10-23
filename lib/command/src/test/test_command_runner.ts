import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { DError } from 'error/mod.ts'
import { GlobalOptions } from 'options/mod.ts'
import { Chain } from 'util/mod.ts'
import { Workspace } from 'workspace/mod.ts'
import { stripDependencyFilterOptions } from '../common/dependency_filter_options.ts'
import { stripEarlyExitOptions } from '../common/early_exit_options.ts'
import { stripPackageFilterOptions } from '../common/package_filter_options.ts'
import { TestOptions } from './test_command.ts'

export async function runTestCommand(
  context: Context,
  { options, rawArgs }: {
    options: TestOptions & GlobalOptions
    rawArgs: string[]
  },
): Promise<void> {
  const { logger } = context

  logger.stdout({ timestamp: true })
    .command('d test')
    .lineFeed()

  const workspace = await Workspace.fromContext(context, {
    useBootstrapCache: 'always',
    ...options,
    includeHasFile: [
      ...(options.includeHasFile ?? []),
      'test/**/*_test.dart',
    ],
  })

  logger.stdout({ timestamp: true })
    .indent()
    .childArrow()
    .push((s) => s.cyan.bold(`workspace directory: ${workspace.workspaceDir}`))
    .lineFeed()

  // Strips the options that are not supported by `flutter test`.
  const myRawArgs = Chain.of(rawArgs)
    .map(stripEarlyExitOptions)
    .map(stripPackageFilterOptions)
    .map(stripDependencyFilterOptions)
    .value
  const argsStartIndex = myRawArgs.findIndex((arg) => arg === 'test') + 1
  const flutterTestArgs = myRawArgs.slice(argsStartIndex)
  try {
    await Traversal.parallelTraverseInOrdered(workspace, {
      context,
      command: 'flutter',
      args: ['test', ...flutterTestArgs],
      earlyExit: options.earlyExit,
    })
  } catch (error) {
    throw new DError(`Failed to run \`test\` command with result: ${error}`)
  }
}
