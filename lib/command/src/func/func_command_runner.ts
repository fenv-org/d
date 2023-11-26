import { Traversal } from 'concurrency/mod.ts'
import { Context } from 'context/mod.ts'
import { DError } from 'error/mod.ts'
import { GlobalOptions } from 'options/mod.ts'
import { Workspace } from 'workspace/mod.ts'
import { FuncOptions } from './func_command.ts'

export async function runFuncCommand(
  context: Context,
  { args, options, literal }: {
    args: string[]
    options: FuncOptions & GlobalOptions
    literal: string[]
  },
): Promise<void> {
  const { logger } = context

  const functionName = args[0]
  logger.stdout({ timestamp: true })
    .command(`d func ${functionName}`)
    .lineFeed()

  const workspace = await Workspace.fromContext(context, {
    useBootstrapCache: 'always',
    ...options,
  })

  const findResult = await workspace.findFunction(functionName)
  if (!findResult) {
    throw new DError('Not function found: ' + functionName)
  }

  try {
    await Traversal.parallelTraverseInOrdered(
      findResult.workspace,
      {
        ...findResult.function,
        context,
        functionName: functionName,
        args: literal,
        earlyExit: findResult.function.options?.earlyExit,
        concurrency: options.concurrency ??
          findResult.function.options?.concurrency,
      },
    )
  } catch (error) {
    throw new DError(
      `Failed to run \`${functionName}\` command with result: ${error}`,
    )
  }
}
