import { graphCommand } from './command/graph/mod.ts'
import { Context } from './context/mod.ts'
import { buildCommand, parseArgs } from './options/mod.ts'
import { Workspace } from './workspace/mod.ts'

/**
 * The entry point of the `d` CLI application.
 *
 * ## Required permissions
 *
 * - `--allow-read`
 * - `--allow-write`
 * - `--allow-run`
 * - `--allow-env`
 * - `--allow-net`
 */
export async function dMain(
  args: string[],
  options: {
    readonly cwd: string
    readonly stdout: Deno.Writer & Deno.WriterSync
    readonly stderr: Deno.Writer & Deno.WriterSync
    readonly colorSupported: boolean
  },
) {
  const flags = await parseArgs(options.cwd, args)
  console.log(flags)
  const context = Context.fromFlags({
    ...flags,
    stderr: options.stderr,
    stdout: options.stdout,
    colorSupported: options.colorSupported,
  })
  const workspace = await Workspace.fromContext(context)

  switch (flags.name) {
    case 'bootstrap':
      // await workspace.bootstrap(flags.options)
      break

    case 'graph':
      graphCommand({ context, workspace })
      break

    default:
      buildCommand().showHelp()
  }
}
