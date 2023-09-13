import { runBootstrapCommand } from './command/bootstrap/mod.ts'
import { runGraphCommand } from './command/graph/mod.ts'
import { Context } from './context/mod.ts'
import { buildCommand, Flags, parseArgs } from './options/mod.ts'
import { Stderr, Stdout } from './util/mod.ts'
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
    readonly stdout: Stdout
    readonly stderr: Stderr
    readonly colorSupported: boolean
  },
) {
  const flags = await parseArgs(options.cwd, args)
  const context = Context.fromFlags({
    ...flags,
    ...options,
  })
  const workspace = await Workspace.fromContext(context)
  const voidOrPromise = runCommand({ context, workspace, flags })
  if (voidOrPromise) {
    await voidOrPromise
  }
}

function runCommand(options: {
  context: Context
  workspace: Workspace
  flags: Flags
}): Promise<void> | void {
  const { context, workspace, flags } = options
  switch (flags.name) {
    case 'bootstrap':
      return runBootstrapCommand({
        context,
        workspace,
        flags: flags.options,
      })

    case 'graph':
      return runGraphCommand({ context, workspace })

    default:
      return buildCommand().showHelp()
  }
}
