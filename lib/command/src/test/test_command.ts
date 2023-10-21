import { PackageFilterOptions } from 'command/mod.ts'
import { cliffy } from 'deps.ts'
import { addPackageFilterOptions } from '../common/package_filter_options.ts'

export type TestOptions = PackageFilterOptions

/**
 * `test` subcommand.
 */
export function testCommand() {
  const command = new cliffy.command.Command()
    .description('Commands for managing Flutter packages.')
    .arguments(`[args...]`)
    .option('-*, --* [flags]', 'Forward all arguments to `flutter test`.', {
      collect: true,
    })
    .allowEmpty(true)
  return addPackageFilterOptions(command).stopEarly()
}
