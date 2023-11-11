import { cliffy } from 'deps.ts'
import { Chain } from 'util/mod.ts'
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

export type FuncOptions =
  & PackageFilterOptions
  & DependencyFilterOptions
  & EarlyExitOptions

/**
 * `func` subcommand.
 */
export function funcCommand() {
  const command = new cliffy.command.Command()
    .description('Execute the pre-defined function')
    .arguments('<function:string>')
    .usage('[OPTIONS] <function> -- [args...]')
  return Chain.of(command)
    .map(addEarlyExitOptions)
    .map(addPackageFilterOptions)
    .map(addDependencyFilterOptions)
    .value
}
