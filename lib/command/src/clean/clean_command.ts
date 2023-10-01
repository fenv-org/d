import { cliffy } from 'deps.ts'

/**
 * The definition of `d clean` command flags.
 */
export type CleanOptions = {
  flutter: boolean
}

/**
 * `clean` subcommand.
 */
export function cleanCommand() {
  return new cliffy.command.Command()
    .description(
      'Remove the bootstrap bootstrap cache auto-generated files.',
    )
    .option(
      '-f, --flutter',
      'Run `flutter clean` command after cleaning.',
      {
        default: false,
      },
    )
}
