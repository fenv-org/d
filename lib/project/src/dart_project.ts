import { std_fs, std_path } from '../../deps.ts'
import { FpmError } from '../../error/mod.ts'

const { existsSync } = std_fs
const { resolve, dirname } = std_path

/**
 * Represents a Dart project.
 */
export class DartProject {
  constructor(options: {
    path: string
    pubspecFilepath: string
    pubspecOverridesFilepath?: string
  }) {
    this.path = options.path
    this.pubspecFilepath = options.pubspecFilepath
    this.pubspecOverridesFilepath = options.pubspecOverridesFilepath
  }

  /**
   * The absolute path to the dart project.
   */
  readonly path: string
  /**
   * The absolute path to the `pubspec.yaml` file of the dart project.
   */
  readonly pubspecFilepath: string
  /**
   * The absolute path to the `pubspec_overrides.yaml` file of the dart.
   */
  readonly pubspecOverridesFilepath: string | undefined

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
    if (!existsSync(path)) {
      throw new Deno.errors.NotFound(`pubspec.yaml not found: ${path}`)
    }
    return new DartProject({
      path: dirname(resolve(path)),
      pubspecFilepath: resolve(path),
      pubspecOverridesFilepath:
        existsSync(resolve(dirname(path), 'pubspec_overrides.yaml'))
          ? resolve(dirname(path), 'pubspec_overrides.yaml')
          : undefined,
    })
  }
}
