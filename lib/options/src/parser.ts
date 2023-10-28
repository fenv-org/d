import {
  bootstrapCommand,
  buildRunnerCommand,
  cleanCommand,
  graphCommand,
  pubCommand,
  runCommand,
  testCommand,
  updateCommand,
} from 'command/mod.ts'
import { cliffy } from 'deps.ts'
import { DENO_VERSION, VERSION_STRING } from 'version/mod.ts'
import { DirOrGlobType, FileOrGlobType } from './cliffy_types.ts'
import { Flags, stripGlobalOptions } from './options.ts'

const { command } = cliffy

export function buildCommand() {
  return new command.Command()
    .name(Deno.env.get('D_CLI') ?? 'd')
    .usage('<command> [OPTIONS]')
    .version(VERSION_STRING)
    .description(
      `A Dart/Flutter multi-package project manager\n\n` +
        `Powered by deno v${DENO_VERSION}`,
    )
    .globalType('fileOrGlob', new FileOrGlobType())
    .globalType('dirOrGlob', new DirOrGlobType())
    .globalEnv(
      'D_WORKSPACE=<workspace:file>',
      'The path to the `d.yaml` file or the directory containing it. ' +
        'This will override `--config` parameter.',
      { required: false },
    )
    .globalEnv(
      'D_LOG_TIME=<0/1:number>',
      'Enable/disable logging time for verbose outputs. ' +
        '0: disable, 1: enable and default to 1.',
      { required: false },
    )
    .globalOption('-v, --verbose', 'Enable verbose output.', { default: false })
    .globalOption('--debug', 'Enable debug output.', { default: false })
    .globalOption(
      '--config <filepath:file>',
      'The path to the `d.yaml` file. If omitted, attempt to find `d.yaml` ' +
        'recursively upward from the current directory.',
      { default: undefined },
    )
    .command('help', new command.HelpCommand().global())
    .command('bootstrap', bootstrapCommand())
    .command('build_runner', buildRunnerCommand())
    .command('clean', cleanCommand())
    .command('graph', graphCommand())
    .command('pub', pubCommand())
    .command('run', runCommand())
    .command('test', testCommand())
    .command('update', updateCommand())
}

/**
 * Parses the given {@link args}.
 */
export async function parseArgs(
  cwd: string,
  args: string[],
): Promise<Flags> {
  const flags = await buildCommand().parse(args)

  // Check whether `flags.cmd` is any of `BashCompletionsCommand`,
  // `FishCompletionsCommand`, `ZshCompletionsCommand` or not.
  if (
    flags.cmd instanceof cliffy.command.BashCompletionsCommand ||
    flags.cmd instanceof cliffy.command.FishCompletionsCommand ||
    flags.cmd instanceof cliffy.command.ZshCompletionsCommand
  ) {
    return {
      cwd,
      name: 'completions',
      args: [],
      options: flags.options,
    } as unknown as Flags
  }

  const commandName = flags.cmd.getName()
  const rawArgs =
    (flags.cmd as unknown as { _parent: { rawArgs: string[] } } | undefined)
      ?._parent
      ?.rawArgs
  return {
    cwd,
    name: commandName,
    ...flags,
    rawArgs: stripGlobalOptions(rawArgs ?? []),
  } as unknown as Flags
}
