import { std } from '../../deps.ts'
import { createLoggerV2, LoggerV2 } from '../../logger/mod.ts'
import { GlobalOptions } from '../../options/mod.ts'
import { Stderr, Stdout, supportsColor } from '../../util/mod.ts'

/**
 * A class that represents the context of the application.
 */
export class Context {
  constructor(options: {
    cwd: string
    verbose: boolean
    debug: boolean
    logger: LoggerV2
    config?: string
    dWorkspace?: string
  }) {
    this.cwd = options.cwd
    this.verbose = options.verbose
    this.debug = options.debug
    this.logger = options.logger
    this.config = options.config
    this.dWorkspace = options.dWorkspace
  }

  readonly cwd: string
  readonly verbose: boolean
  readonly debug: boolean
  readonly logger: LoggerV2
  readonly config: string | undefined
  readonly dWorkspace: string | undefined

  /**
   * Creates a new {@link Context} from the given {@link flags}.
   */
  static fromFlags(
    flags: {
      readonly cwd: string
      readonly stdout: Stdout
      readonly stderr: Stderr
      readonly colorSupported?: boolean
      readonly options: GlobalOptions
    },
  ): Context {
    return new Context({
      ...flags,
      ...flags.options,
      cwd: std.path.resolve(flags.cwd),
      dWorkspace: flags.options.dWorkspace
        ? std.path.isAbsolute(flags.options.dWorkspace)
          ? flags.options.dWorkspace
          : std.path.resolve(flags.cwd, flags.options.dWorkspace)
        : undefined,
      logger: createLoggerV2({
        stdout: flags.stdout,
        stderr: flags.stderr,
        supportColors: flags.colorSupported ?? supportsColor(flags.stdout),
        verboseEnabled: flags.options.verbose,
        debugEnabled: flags.options.debug,
      }),
    })
  }
}
