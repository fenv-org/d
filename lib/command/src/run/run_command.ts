import { cliffy } from 'deps.ts'
import { Chain } from 'util/mod.ts'
import {
  addConcurrencyOptions,
  ConcurrencyOptions,
} from '../common/concurrency_options.ts'
import {
  addDependencyFilterOptions,
  DependencyFilterOptions,
} from '../common/dependency_filter_options.ts'
import {
  addEarlyExitOptions,
  EarlyExitOptions,
} from '../common/early_exit_options.ts'
import {
  addPackageFilterOptions,
  PackageFilterOptions,
} from '../common/package_filter_options.ts'

export type RunOptions =
  & PackageFilterOptions
  & DependencyFilterOptions
  & EarlyExitOptions
  & ConcurrencyOptions

/**
 * `run` subcommand.
 */
export function runCommand() {
  const command = new cliffy.command.Command()
    .description('Run any arbitrary command in all packages.')
    .usage('[OPTIONS] -- \'<command>\'')
  return Chain.of(command)
    .map(addEarlyExitOptions)
    .map(addPackageFilterOptions)
    .map(addDependencyFilterOptions)
    .map(addConcurrencyOptions)
    .value
}
