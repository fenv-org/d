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

const subcommands: { readonly [command: string]: string } = {
  b: 'build',
  build: 'build',
  c: 'clean',
  clean: 'clean',
  r: 'run',
  run: 'run',
}

function subcommandType(
  { label, name, value }: cliffy.command.ArgumentValue,
): string {
  if (!(value in subcommands)) {
    throw new Error(
      `${label} "${name}" must be one of the supported subcommands, but got "${value}". ` +
        `Possible values are: "build/b", "clean/c", "run/r".`,
    )
  }
  return subcommands[value]
}

export type BuildRunnerOptions =
  & PackageFilterOptions
  & EarlyExitOptions
  & DependencyFilterOptions

/**
 * `build_runner` subcommand.
 *
 * `br` is one of the aliases for `build_runner`.
 */
export function buildRunnerCommand() {
  const command = new cliffy.command.Command()
    .alias('br')
    .description(
      'Run `dart run build_runner <subcommand>` in all packages ' +
        'that has `build_runner` as dev dependency.\n' +
        'The subcommand can be one of: ' +
        `"build/b", "clean/c", "run/r"`,
    )
    .type('subcommand', subcommandType)
    .usage('[OPTIONS] <subcommand> [args...]')
    .arguments('<subcommand:subcommand> [args...:string]')
    .allowEmpty(true)
  return Chain.of(command)
    .map(addEarlyExitOptions)
    .map(addPackageFilterOptions)
    .map(addDependencyFilterOptions)
    .value
    .stopEarly()
    .option(
      '-*, --* [flags]',
      'Forward all arguments to `dart run build_runner <subcommand>`.',
      {
        collect: true,
      },
    )
}
