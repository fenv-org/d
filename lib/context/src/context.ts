import { std_path } from '../../deps.ts'

/**
 * A class that represents the context of the application.
 */
export class FpmContext {
  private constructor(
    public readonly pwd: string,
    public readonly verbose: boolean,
    public readonly debug: boolean,
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
    )
  }
}
