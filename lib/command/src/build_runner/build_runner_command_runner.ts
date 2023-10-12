import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { DError } from 'error/mod.ts'
import { Workspace } from 'workspace/mod.ts'

export async function runBuildRunnerCommand(
  context: Context,
  { args, rawArgs }: {
    args: string[]
    rawArgs: string[]
  },
): Promise<void> {
  const workspace = await Workspace.fromContext(context, {
    useBootstrapCache: 'always',
    includeDevDependency: ['build_runner'],
  })
  // `build_runner run` requires `--` to separate `build_runner`'s args from
  // executable's args. However, the cliffy parser does not support `--` yet.
  if (rawArgs.includes('--')) {
    const extraArgs = rawArgs.slice(rawArgs.indexOf('--'))
    args.push(...extraArgs)
  }

  try {
    await Traversal.parallelTraverseInOrdered(workspace, {
      context,
      command: 'dart',
      args: ['run', 'build_runner', ...args],
      earlyExit: false,
    })
  } catch (error) {
    throw new DError(
      `Failed to run \`build_runner\` command with result: ${error}`,
    )
  }
}
