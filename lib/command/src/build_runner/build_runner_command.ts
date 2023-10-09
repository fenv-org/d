import { cliffy } from 'deps.ts'

/**
 * `build_runner` subcommand.
 */
export function buildRunnerCommand() {
  return new cliffy.command.Command()
    .usage('[OPTIONS] [subcommand] [args...]')
    .description(
      'Run `dart run build_runner` in all packages ' +
        'that has `build_runner` as dev dependency.\n' +
        'If no subcommand is provided, `build_runner build` will be used.',
    )
    .stopEarly()
    .arguments('[subcommand:string] [args...:string]')
}
