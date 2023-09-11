import { cliffy } from '../../deps.ts'
import { DENO_VERSION } from '../../version/src/deno_version.ts'
import { VERSION_STRING } from '../../version/src/version.ts'
import { DirOrGlobType, FileOrGlobType } from './cliffy_types.ts'
import { Flags } from './options.ts'

const { command } = cliffy

export function buildCommand() {
  return new command.Command()
    .name('d')
    .usage('[command] <OPTIONS>')
    .version(VERSION_STRING)
    .description(
      `A Dart/Flutter multi-package project manager\n\n` +
        `Powered by deno v${DENO_VERSION}`,
    )
    .globalType('fileOrGlob', new FileOrGlobType())
    .globalType('dirOrGlob', new DirOrGlobType())
    .env(
      'D_WORKSPACE=<workspace:file>',
      'The path to the `d.yaml` file or the directory containing it. ' +
        'This will override `--config` parameter. ',
      { global: true, required: false },
    )
    .env(
      'D_LOG_TIME=<0/1:number>',
      'Enable/disable logging time for verbose outputs. ' +
        '0: disable, 1: enable and default to 1.',
      { global: true, required: false },
    )
    .option('-v, --verbose', 'Enable verbose output', {
      global: true,
      default: false,
    })
    .option('--debug', 'Enable debug output', {
      global: true,
      default: false,
    })
    .option(
      '--config <filepath:file>',
      'The path to the `d.yaml` file',
      {
        global: true,
        default: undefined,
      },
    )
    .command('help', new command.HelpCommand().global())
    .command('bootstrap', bootstrapCommand())
    .command('graph', graphCommand())
}

/**
 * Parses the given {@link args}.
 */
export async function parseArgs(
  cwd: string,
  args: string[],
): Promise<Flags> {
  const flags = await buildCommand().parse(args)
  const commandName = flags.cmd.getName()
  return {
    cwd,
    name: commandName,
    args: flags.args,
    options: flags.options,
  } as unknown as Flags
}

/**
 * `bootstrap` subcommand.
 *
 * `bs` is one of the aliases for `bootstrap`.
 */
function bootstrapCommand() {
  return new command.Command()
    .alias('bs')
    .description(
      'Initialize the workspace and link packages specified in `d.yaml` file.',
    )
    .option(
      '--file-exists <file/glob:fileOrGlob>',
      'Includes the packages that has the specified file or any file maglob pattern',
      { collect: true },
    )
    .option(
      '--dir-exists <dir/glob:dirOrGlob>',
      'A glob pattern or a specific directory that must exist',
      { collect: true },
    )
}

function graphCommand() {
  return new command.Command()
    .description('Show the dependency graph of the workspace')
}
