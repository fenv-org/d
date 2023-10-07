import { cliffy } from 'deps.ts'
import {
  addPackageFilterOptions,
  PackageFilterOptions,
} from '../common/package_filter_options.ts'

export type PubOptions = PackageFilterOptions

/**
 * `pub` subcommand.
 */
export function pubCommand() {
  const command = new cliffy.command.Command()
    .description('Commands for managing Flutter packages.')
    .usage(`[OPTIONS] <pub-subcommand> [pub-args]`)
    .arguments(`<subcommand> [args...]`)
  return addPackageFilterOptions(command).stopEarly()
}
