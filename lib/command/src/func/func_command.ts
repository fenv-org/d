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
  addPackageFilterOptions,
  PackageFilterOptions,
} from '../common/package_filter_options.ts'

export type FuncOptions =
  & PackageFilterOptions
  & DependencyFilterOptions
  & ConcurrencyOptions

/**
 * `func` subcommand.
 */
export function funcCommand() {
  const command = new cliffy.command.Command()
    .description('Execute the pre-defined function')
    .alias('f')
    .arguments('<function:string>')
    .usage('[OPTIONS] <function> -- [args...]')
  return Chain.of(command)
    .map(addPackageFilterOptions)
    .map(addDependencyFilterOptions)
    .map(addConcurrencyOptions)
    .value
}
