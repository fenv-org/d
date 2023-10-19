import { cliffy } from 'deps.ts'
import {
  addEarlyExitOptions,
  EarlyExitOptions,
} from '../common/early_exit_options.ts'

const subcommands: { readonly [command: string]: string } = {
  b: 'build',
  build: 'build',
  c: 'clean',
  clean: 'clean',
  r: 'run',
  run: 'run',
}

function subcommandType(
  { label, name, value }: cliffy.command.ArgumentValue,
): string {
  if (!(value in subcommands)) {
    throw new Error(
      `${label} "${name}" must be one of the supported subcommands, but got "${value}". ` +
        `Possible values are: "build/b", "clean/c", "run/r".`,
    )
  }
  return subcommands[value]
}

export type BuildRunnerOptions = EarlyExitOptions

/**
 * `build_runner` subcommand.
 *
 * `br` is one of the aliases for `build_runner`.
 */
export function buildRunnerCommand() {
  const command = new cliffy.command.Command()
    .usage('[OPTIONS] <subcommand> [args...]')
    .alias('br')
    .description(
      'Run `dart run build_runner <subcommand>` in all packages ' +
        'that has `build_runner` as dev dependency.\n' +
        'The subcommand can be one of: ' +
        `"build/b", "clean/c", "run/r"`,
    )
    .type('subcommand', subcommandType)
    .arguments('<subcommand:subcommand> [args...:string]')
  return addEarlyExitOptions(command).stopEarly()
}
