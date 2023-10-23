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

export type PubOptions =
  & PackageFilterOptions
  & DependencyFilterOptions
  & EarlyExitOptions

/**
 * `pub` subcommand.
 */
export function pubCommand() {
  const command = new cliffy.command.Command()
    .description('Run `flutter pub` in all packages.')
    .usage('[OPTIONS] <subcommand> [args...]')
    .arguments(`<subcommand> [args...]`)
  return Chain.of(command)
    .map(addEarlyExitOptions)
    .map(addPackageFilterOptions)
    .map(addDependencyFilterOptions)
    .value
    .stopEarly()
    .option(
      '-*, --* [flags]',
      'Forward all arguments to `flutter pub <subcommand>`.',
      {
        collect: true,
      },
    )
}
