// deno-lint-ignore-file no-explicit-any

import { cliffy } from 'deps.ts'
import { Logger } from 'logger/mod.ts'
import { sanitizeRawArguments } from 'util/mod.ts'

/**
 * Additional package filters.
 */
export type PackageFilterOptions = {
  readonly includeHasFile?: string[]
  readonly excludeHasFile?: string[]
  readonly includeHasDir?: string[]
  readonly excludeHasDir?: string[]
}

/**
 * Adds package filter options to the given {@link command}.
 */
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
      '--include-has-file, --if <file/glob:fileOrGlob>',
      'Includes the packages that has any matching file. Relative path from ' +
        'the package root.',
      { collect: true },
    )
    .option(
      '--exclude-has-file, --ef <file/glob:fileOrGlob>',
      'Excludes the packages that has any matching file. Relative path from ' +
        'the package root.',
      { collect: true },
    )
    .option(
      '--include-has-dir, --id <dir/glob:dirOrGlob>',
      'Includes the packages that has any matching directory. Relative path ' +
        'from the package root.',
      { collect: true },
    )
    .option(
      '--exclude-has-dir, --ed <dir/glob:dirOrGlob>',
      'Excludes the packages that has any matching directory. Relative path ' +
        'from the package root.',
      { collect: true },
    )
}

/**
 * Removes package filter options from the given {@link rawArgs}.
 */
export function stripPackageFilterOptions(rawArgs: string[]): string[] {
  return sanitizeRawArguments(rawArgs, {
    options: [
      '--include-has-file',
      '--if',
      '--exclude-has-file',
      '--ef',
      '--include-has-dir',
      '--id',
      '--exclude-has-dir',
      '--ed',
    ],
  })
}

export function logPackageFilters(logger: Logger, flags: PackageFilterOptions) {
  const filterDebugLogger = logger
    .stdout({ debug: true, timestamp: true })
    .indent(2)
  if (flags.includeHasFile) {
    filterDebugLogger
      .push('[package filter] include has file=')
      .push(JSON.stringify(flags.includeHasFile))
      .lineFeed()
  }
  if (flags.excludeHasFile) {
    filterDebugLogger
      .push('[package filter] exclude has file=')
      .push(JSON.stringify(flags.excludeHasFile))
      .lineFeed()
  }
  if (flags.includeHasDir) {
    filterDebugLogger
      .push('[package filter] include has directory=')
      .push(JSON.stringify(flags.includeHasDir))
      .lineFeed()
  }
  if (flags.excludeHasDir) {
    filterDebugLogger
      .push('[package filter] exclude has directory=')
      .push(JSON.stringify(flags.excludeHasDir))
      .lineFeed()
  }
}
