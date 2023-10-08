import { cliffy } from 'deps.ts'

/**
 * Options for the `update` subcommand.
 */
export type UpdateOptions = {
  showList: boolean
}

/**
 * `update` subcommand.
 */
export function updateCommand() {
  return new cliffy.command.Command()
    .description('Update the CLI to the latest version or the given version.')
    .arguments('[version:string]')
    .option(
      '-l, --show-list',
      'Show a list of the available versions up to the recent 30 versions. ' +
        'Ignores [version] parameter',
      { default: false },
    )
}
