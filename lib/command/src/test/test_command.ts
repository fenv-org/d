import { PackageFilterOptions } from 'command/mod.ts'
import { cliffy } from 'deps.ts'
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
    .arguments(`[args...]`)
    .allowEmpty(true)
  return addEarlyExitOptions(addPackageFilterOptions(command)).stopEarly()
    .option('-*, --* [flags]', 'Forward all arguments to `flutter test`.', {
      collect: true,
    })
}
