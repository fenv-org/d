import { std } from '../../deps.ts'
import { DLogger, Logger } from '../../logger/mod.ts'
import { GlobalOptions } from '../../options/mod.ts'

/**
 * A class that represents the context of the application.
 */
export class Context {
  constructor(options: {
    cwd: string
    verbose: boolean
    debug: boolean
    logger: DLogger
    config?: string
    dWorkspace?: string
  }) {
    this.cwd = options.cwd
    this.verbose = options.verbose
    this.debug = options.debug
    this.logger = options.logger
    this.ansi = options.logger.ansi
    this.config = options.config
    this.dWorkspace = options.dWorkspace
  }

  readonly cwd: string
  readonly verbose: boolean
  readonly debug: boolean
  readonly logger: DLogger
  readonly ansi: DLogger['ansi']
  readonly config: string | undefined
  readonly dWorkspace: string | undefined

  /**
   * Creates a new {@link Context} from the given {@link flags}.
   */
  static fromFlags(
    flags: {
      readonly cwd: string
      readonly stdout: Deno.Writer & Deno.WriterSync
      readonly stderr: Deno.Writer & Deno.WriterSync
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
      logger: new DLogger(
        flags.options.verbose
          ? Logger.verbose({
            ...flags,
            logTime: true,
            debug: flags.options.debug,
          })
          : Logger.standard({ ...flags, debug: flags.options.debug }),
      ),
    })
  }
}
