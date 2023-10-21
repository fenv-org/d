import { cliffy } from 'deps.ts'
import {
  addEarlyExitOptions,
  EarlyExitOptions,
} from '../common/early_exit_options.ts'
import {
  addPackageFilterOptions,
  PackageFilterOptions,
} from '../common/package_filter_options.ts'

export type PubOptions = PackageFilterOptions & EarlyExitOptions

/**
 * `pub` subcommand.
 */
export function pubCommand() {
  const command = new cliffy.command.Command()
    .description('Run `flutter pub` in all packages.')
    .usage(`[OPTIONS] <pub-subcommand> [pub-args]`)
    .arguments(`<subcommand> [args...]`)
  return addEarlyExitOptions(addPackageFilterOptions(command)).stopEarly()
}
