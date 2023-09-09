import { cliffy } from '../../deps.ts'
import { VERSION_STRING } from '../../version/src/version.ts'
import { fileOrGlobType } from './cliffy_types.ts'
import { Options } from './options.ts'

const { command } = cliffy

/**
 * Parses the given {@link args}.
 */
export async function parseArgs(
  cwd: string,
  args: string[],
): Promise<Options> {
  const flags = await new command.Command()
    .name('d')
    .usage('[command] <OPTIONS>')
    .version(VERSION_STRING)
    .description('A Dart/Flutter multi-package project manager')
    .globalType('fileOrGlob', fileOrGlobType)
    .env(
      'D_WORKSPACE=<workspace:file>',
      'The path to the `d.yaml` file or the directory containing it. ' +
        'This will override `--config` parameter. ',
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
    .command('bs', bootstrapCommand())
    .parse(args)

  const commandName = flags.cmd.getName()
  return {
    cwd,
    name: commandName === 'bs' ? 'bootstrap' : commandName,
    args: flags.args,
    options: flags.options,
  } as unknown as Options
}

/**
 * `bootstrap` subcommand.
 *
 * `bs` is one of the aliases for `bootstrap`.
 */
function bootstrapCommand() {
  return new command.Command()
    .description(
      'Initialize the workspace and link packages specified in `d.yaml` file.',
    )
    .option(
      '--file-exists <file/glob:fileOrGlob>',
      'A glob pattern or a specific file that must exist',
      { collect: true },
    )
}
