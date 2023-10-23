import { PackageFilterOptions } from 'command/mod.ts'
import { cliffy } from 'deps.ts'
import { Chain } from 'util/mod.ts'
import { addDependencyFilterOptions } from '../common/dependency_filter_options.ts'
import {
  addEarlyExitOptions,
  EarlyExitOptions,
} from '../common/early_exit_options.ts'
import { addPackageFilterOptions } from '../common/package_filter_options.ts'

export type TestOptions = PackageFilterOptions & EarlyExitOptions

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
