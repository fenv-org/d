// deno-lint-ignore-file no-explicit-any

import { cliffy } from 'deps.ts'
import { Logger } from 'logger/mod.ts'
import { sanitizeRawArguments } from 'util/mod.ts'

/**
 * Additional dependency filters.
 */
export type DependencyFilterOptions = {
  readonly includeDependency?: string[]
  readonly excludeDependency?: string[]
  readonly includeDirectDependency?: string[]
  readonly excludeDirectDependency?: string[]
  readonly includeDevDependency?: string[]
  readonly excludeDevDependency?: string[]
}

/**
 * Adds dependency filter options to the given {@link command}.
 */
export function addDependencyFilterOptions<
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
      '--include-dependency <name:string>',
      'Includes the packages that depends on the given package ' +
        'regardless of direct/transitive and dev/runtime dependency.',
      { collect: true },
    )
    .option(
      '--exclude-dependency <name:string>',
      'Excludes the packages that depends on the given package ' +
        'regardless of direct/transitive and dev/runtime dependency.',
      { collect: true },
    )
    .option(
      '--include-direct-dependency <name:string>',
      'Includes the packages that directly depends on the given package.',
      { collect: true },
    )
    .option(
      '--exclude-direct-dependency <name:string>',
      'Excludes the packages that directly depends on the given package.',
      { collect: true },
    )
    .option(
      '--include-dev-dependency <name:string>',
      'Includes the packages that depends on the given package as dev ' +
        'dependency.',
      { collect: true },
    )
    .option(
      '--exclude-dev-dependency <name:string>',
      'Excludes the packages that depends on the given package as dev ' +
        'dependency.',
      { collect: true },
    )
}

/**
 * Removes dependency filter options from the given {@link rawArgs}.
 */
export function stripDependencyFilterOptions(rawArgs: string[]): string[] {
  return sanitizeRawArguments(rawArgs, {
    options: [
      '--include-dependency',
      '--exclude-dependency',
      '--include-direct-dependency',
      '--exclude-direct-dependency',
      '--include-dev-dependency',
      '--exclude-dev-dependency',
    ],
  })
}

export function logDependencyFilters(
  logger: Logger,
  flags: DependencyFilterOptions,
) {
  const filterDebugLogger = logger
    .stdout({ debug: true, timestamp: true })
    .indent(2)
  if (flags.includeDependency) {
    filterDebugLogger
      .push('[dependency filter] include dependency=')
      .push(JSON.stringify(flags.includeDependency))
      .lineFeed()
  }
  if (flags.excludeDependency) {
    filterDebugLogger
      .push('[dependency filter] exclude dependency=')
      .push(JSON.stringify(flags.excludeDependency))
      .lineFeed()
  }
  if (flags.includeDirectDependency) {
    filterDebugLogger
      .push('[dependency filter] include direct dependency=')
      .push(JSON.stringify(flags.includeDirectDependency))
      .lineFeed()
  }
  if (flags.excludeDirectDependency) {
    filterDebugLogger
      .push('[dependency filter] exclude direct dependency=')
      .push(JSON.stringify(flags.excludeDirectDependency))
      .lineFeed()
  }
  if (flags.includeDevDependency) {
    filterDebugLogger
      .push('[dependency filter] include dev dependency=')
      .push(JSON.stringify(flags.includeDevDependency))
      .lineFeed()
  }
  if (flags.excludeDevDependency) {
    filterDebugLogger
      .push('[dependency filter] exclude dev dependency=')
      .push(JSON.stringify(flags.excludeDevDependency))
      .lineFeed()
  }
}
