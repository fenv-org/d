import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { DError } from 'error/mod.ts'
import { Workspace } from 'workspace/mod.ts'

export async function runBuildRunnerCommand(
  context: Context,
  { args }: {
    args: string[]
  },
): Promise<void> {
  const workspace = await Workspace.fromContext(context, {
    useBootstrapCache: 'always',
    includeDevDependency: ['build_runner'],
  })

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
