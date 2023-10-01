import { BootstrapOptions, CleanOptions } from 'command/mod.ts'

/**
 * The definition of `d`'s command line arguments.
 */
export type Flags =
  & {
    readonly cwd: string
    readonly args: string[]
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
