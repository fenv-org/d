import { cliffy } from 'deps.ts'

/**
 * `graph` subcommand.
 */
export function graphCommand() {
  return new cliffy.command.Command()
    .usage('[OPTIONS]')
    .description('Show the dependency graph of the workspace')
}
