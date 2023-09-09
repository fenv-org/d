import { graphCommand } from './command/graph/mod.ts'
import { Context } from './context/mod.ts'
import { std } from './deps.ts'
import { parseArgs } from './options/mod.ts'
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
export async function dMain(cwd: string, args: string[]) {
  const flags = await parseArgs(cwd, args)

  const context = Context.fromFlags(flags)
  const workspace = await Workspace.fromContext(context)

  switch (flags.name) {
    case 'bootstrap':
      // await workspace.bootstrap(flags.options)
      break

    case 'graph':
      graphCommand({ context, workspace })
      break

    default:
      std.assert.unreachable()
  }
}
