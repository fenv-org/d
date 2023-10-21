import {
  BootstrapOptions,
  BuildRunnerOptions,
  CleanOptions,
  PubOptions,
  TestOptions,
  UpdateOptions,
} from 'command/mod.ts'
import { sanitizeRawArguments } from 'util/mod.ts'

/**
 * The definition of `d`'s command line arguments.
 */
export type Flags =
  & {
    readonly cwd: string
    readonly args: string[]
    readonly rawArgs: string[]
  }
  & (
    | {
      readonly name: 'bootstrap'
      readonly options: BootstrapOptions & GlobalOptions
    }
    | {
      readonly name: 'graph'
      readonly options: GlobalOptions
    }
    | {
      readonly name: 'clean'
      readonly options: CleanOptions & GlobalOptions
    }
    | {
      readonly name: 'completions'
      readonly options: GlobalOptions
    }
    | {
      readonly name: 'pub'
      readonly options: PubOptions & GlobalOptions
    }
    | {
      readonly name: 'update'
      readonly options: UpdateOptions & GlobalOptions
    }
    | {
      readonly name: 'build_runner'
      readonly options: BuildRunnerOptions & GlobalOptions
    }
    | {
      readonly name: 'test'
      readonly options: TestOptions & GlobalOptions
    }
  )

/**
 * The definition of `d`'s global command flags.
 */
export type GlobalOptions = {
  readonly verbose: boolean
  readonly debug: boolean
  readonly config?: string
  readonly dWorkspace?: string
  readonly dLogTime?: number
}

/**
 * Removes global options from the given {@link rawArgs}.
 */
export function stripGlobalOptions(rawArgs: string[]): string[] {
  return sanitizeRawArguments(rawArgs, {
    flags: ['--verbose', '-v', '--debug'],
    options: ['--config'],
  })
}
