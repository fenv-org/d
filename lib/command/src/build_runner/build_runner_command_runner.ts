import { Context } from 'context/mod.ts'
import { GlobalOptions } from 'options/mod.ts'

export async function runBuildRunnerCommand(
  context: Context,
  { args, options }: {
    args: string[]
    options: GlobalOptions
  },
): Promise<void> {
  console.log('build_runner_command_runner')
  console.log('args=', args)
  console.log('options=', options)
}
