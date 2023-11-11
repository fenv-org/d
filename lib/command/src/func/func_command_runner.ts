import { Context } from 'context/mod.ts'
import { GlobalOptions } from 'options/mod.ts'
import { Workspace } from 'workspace/mod.ts'
import { FuncOptions } from './func_command.ts'

export async function runFuncCommand(
  context: Context,
  { options, literal }: {
    options: FuncOptions & GlobalOptions
    literal: string[]
  },
): Promise<void> {
  const { logger } = context

  logger.stdout({ timestamp: true })
    .command('d func')
    .lineFeed()

  const workspace = await Workspace.fromContext(context, {
    useBootstrapCache: 'always',
    ...options,
  })

  console.log('options=', options)
  console.log('literal=', literal)
}
