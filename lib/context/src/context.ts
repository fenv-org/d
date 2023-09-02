import { std_path } from '../../deps.ts'
import { FpmLogger, Logger } from '../../logger/mod.ts'

/**
 * A class that represents the context of the application.
 */
export class FpmContext {
  private constructor(
    public readonly pwd: string,
    public readonly verbose: boolean,
    public readonly debug: boolean,
    public readonly logger: FpmLogger,
    public readonly ansi = logger.ansi,
  ) {
  }

  static fromFlags(flags: {
    pwd: string
    verbose: boolean
    debug: boolean
  }): FpmContext {
    return new FpmContext(
      std_path.resolve(flags.pwd),
      flags.verbose,
      flags.debug,
      new FpmLogger(
        flags.verbose
          ? Logger.verbose({ logTime: true, debug: flags.debug })
          : Logger.standard({ debug: flags.debug }),
      ),
    )
  }
}
