// deno-lint-ignore-file no-explicit-any

import { cliffy } from "deps.ts"

/**
 * Additional package filters.
 */
export type PackageFilterOptions = {
  readonly includeHasFile?: string[]
  readonly excludeHasFile?: string[]
  readonly includeHasDir?: string[]
  readonly excludeHasDir?: string[]
}

export function addPackageFilterOptions<
  TParentCommandGlobals extends Record<string, unknown> | void = void,
  TParentCommandTypes extends Record<string, unknown> | void =
    TParentCommandGlobals extends number ? any : void,
  TCommandOptions extends Record<string, unknown> | void =
    TParentCommandGlobals extends number ? any : void,
  TCommandArguments extends Array<unknown> = TParentCommandGlobals extends
    number ? any : [],
  TCommandGlobals extends Record<string, unknown> | void =
    TParentCommandGlobals extends number ? any : void,
  TCommandTypes extends Record<string, unknown> | void =
    TParentCommandGlobals extends number ? any : {
      number: number
      integer: number
      string: string
      boolean: boolean
      file: string
    },
  TCommandGlobalTypes extends Record<string, unknown> | void =
    TParentCommandGlobals extends number ? any : void,
  TParentCommand extends cliffy.command.Command<any> | undefined =
    TParentCommandGlobals extends number ? any : undefined,
>(
  command: cliffy.command.Command<
    TParentCommandGlobals,
    TParentCommandTypes,
    TCommandOptions,
    TCommandArguments,
    TCommandGlobals,
    TCommandTypes,
    TCommandGlobalTypes,
    TParentCommand
  >,
) {
  return command
    .option(
      '--include-has-file <file/glob:fileOrGlob>',
      'Includes the packages that has any matching file. Relative path from ' +
        'the package root.',
      { collect: true },
    )
    .option(
      '--exclude-has-file <file/glob:fileOrGlob>',
      'Excludes the packages that has any matching file. Relative path from ' +
        'the package root.',
      { collect: true },
    )
    .option(
      '--include-has-dir <dir/glob:dirOrGlob>',
      'Includes the packages that has any matching directory. Relative path ' +
        'from the package root.',
      { collect: true },
    )
    .option(
      '--exclude-has-dir <dir/glob:dirOrGlob>',
      'Excludes the packages that has any matching directory. Relative path ' +
        'from the package root.',
      { collect: true },
    )
}
