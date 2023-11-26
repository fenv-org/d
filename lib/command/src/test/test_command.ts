import { cliffy } from 'deps.ts'
import { Chain } from 'util/mod.ts'
import {
  addConcurrencyOptions,
  ConcurrencyOptions,
} from '../common/concurrency_options.ts'
import { addDependencyFilterOptions } from '../common/dependency_filter_options.ts'
import {
  addEarlyExitOptions,
  EarlyExitOptions,
} from '../common/early_exit_options.ts'
import {
  addPackageFilterOptions,
  PackageFilterOptions,
} from '../common/package_filter_options.ts'

export type TestOptions =
  & PackageFilterOptions
  & EarlyExitOptions
  & ConcurrencyOptions

/**
 * `test` subcommand.
 */
export function testCommand() {
  const command = new cliffy.command.Command()
    .description('Commands for managing Flutter packages.')
    .usage('[OPTIONS] [args...]')
    .arguments(`[args...]`)
    .allowEmpty(true)
  return Chain.of(command)
    .map(addEarlyExitOptions)
    .map(addPackageFilterOptions)
    .map(addDependencyFilterOptions)
    .map(addConcurrencyOptions)
    .value
    .stopEarly()
    .option(
      '-*, --* [flags]',
      'Forward all arguments to `flutter test`.',
      {
        collect: true,
      },
    )
}
