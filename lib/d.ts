import {
  runBootstrapCommand,
  runBuildRunnerCommand,
  runCleanCommand,
  runFuncCommand,
  runGraphCommand,
  runPubCommand,
  runRunCommand,
  runTestCommand,
  runUpdateCommand,
} from 'command/mod.ts'
import { Context } from 'context/mod.ts'
import { buildCommand, Flags, parseArgs } from 'options/mod.ts'
import { Stderr, Stdout } from 'util/mod.ts'

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
  const context = Context.fromFlags({ ...flags, ...options })
  const voidOrPromise = runCommand(context, { flags })
  if (voidOrPromise) {
    await voidOrPromise
  }
}

function runCommand(
  context: Context,
  options: {
    flags: Flags
  },
): Promise<void> | void {
  const { flags } = options
  switch (flags.name) {
    case 'bootstrap':
      return runBootstrapCommand(context, flags)

    case 'graph':
      return runGraphCommand(context)

    case 'clean':
      return runCleanCommand(context, flags)

    case 'pub':
      return runPubCommand(context, flags)

    case 'update':
      return runUpdateCommand(context, flags)

    case 'build_runner':
      return runBuildRunnerCommand(context, flags)

    case 'test':
      return runTestCommand(context, flags)

    case 'run':
      return runRunCommand(context, flags)

    case 'func':
      return runFuncCommand(context, flags)

    default:
      return buildCommand().showHelp()
  }
}
