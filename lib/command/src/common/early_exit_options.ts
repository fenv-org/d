// deno-lint-ignore-file no-explicit-any

import { cliffy } from 'deps.ts'
import { sanitizeRawArguments } from 'util/mod.ts'

export type EarlyExitOptions = {
  readonly earlyExit: boolean
}

/**
 * Adds early exit options to the given {@link command}.
 */
export function addEarlyExitOptions<
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
      '--early-exit',
      'Exit as soon as possible when any failure happens on any package',
      { default: true },
    )
    .option(
      '--no-early-exit',
      'Execute the command for all packages even though a failure happens on ' +
        'any package',
    )
}

/**
 * Removes early exit options from the given {@link rawArgs}.
 */
export function stripEarlyExitOptions(rawArgs: string[]): string[] {
  return sanitizeRawArguments(rawArgs, {
    flags: ['--early-exit', '--no-early-exit'],
  })
}
