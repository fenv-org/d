import { cliffy } from '../../../deps.ts'
import {
  addPackageFilterOptions,
  PackageFilterOptions,
} from '../common/package_filter_options.ts'

/**
 * The definition of `d bootstrap` command flags.
 */
export type BootstrapOptions = PackageFilterOptions

/**
 * `bootstrap` subcommand.
 *
 * `bs` is one of the aliases for `bootstrap`.
 */
export function bootstrapCommand() {
  const command = new cliffy.command.Command()
    .alias('bs')
    .usage('[OPTIONS]')
    .description(
      'Initialize the workspace and link packages specified in `d.yaml` file.',
    )
  return addPackageFilterOptions(command)
}
