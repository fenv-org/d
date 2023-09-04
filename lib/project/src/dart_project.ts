import { std_fs, std_path } from '../../deps.ts'
import { FpmError } from '../../error/mod.ts'

/**
 * Represents a Dart project.
 */
export class DartProject {
  constructor(
    /**
     * The absolute path to the dart project.
     */
    public readonly path: string,
    /**
     * The absolute path to the `pubspec.yaml` file of the dart project.
     */
    public readonly pubspecFilepath: string,
  ) {}

  /**
   * Returns a new `DartProject` instance from the given `pubspec.yaml` file
   * path.
   *
   * @throws {Deno.errors.NotFound} If the file does not exist.
   */
  static fromPubspecFilepath(path: string): DartProject {
    if (!path.endsWith('pubspec.yaml')) {
      throw new FpmError(`Not a pubspec.yaml file: ${path}`)
    }
    if (!std_fs.existsSync(path)) {
      throw new Deno.errors.NotFound(`pubspec.yaml not found: ${path}`)
    }
    return new DartProject(
      std_path.dirname(std_path.resolve(path)),
      std_path.resolve(path),
    )
  }
}
