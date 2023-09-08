import { std_path } from '../../deps.ts'
import { DLogger, Logger } from '../../logger/mod.ts'

/**
 * A class that represents the context of the application.
 */
export class Context {
  constructor(
    public readonly cwd: string,
    public readonly verbose: boolean,
    public readonly debug: boolean,
    public readonly logger: DLogger,
    public readonly ansi = logger.ansi,
  ) {
  }

  static fromFlags(flags: {
    cwd: string
    verbose: boolean
    debug: boolean
  }): Context {
    return new Context(
      std_path.resolve(flags.cwd),
      flags.verbose,
      flags.debug,
      new DLogger(
        flags.verbose
          ? Logger.verbose({ logTime: true, debug: flags.debug })
          : Logger.standard({ debug: flags.debug }),
      ),
    )
  }
}
