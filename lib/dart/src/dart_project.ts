import { std } from 'deps.ts'
import { DError } from 'error/mod.ts'
import {
  loadPubspecOverridesYaml,
  PubspecOverridesYaml,
} from './pubspec_overrides_yaml.ts'
import { loadProjectYaml, PubspecYamlSchema } from './pubspec_yaml.ts'

const { existsSync } = std.fs
const { resolve, dirname } = std.path

/**
 * Represents a Dart project.
 */
export class DartProject {
  constructor(options: {
    path: string
    pubspecFilepath: string
    pubspecOverridesFilepath?: string
    pubspec: PubspecYamlSchema
    pubspecOverrides?: PubspecOverridesYaml
  }) {
    this.path = options.path
    this.pubspecFilepath = options.pubspecFilepath
    this.pubspecOverridesFilepath = options.pubspecOverridesFilepath
    this.pubspec = options.pubspec
    this.pubspecOverrides = options.pubspecOverrides
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
   * The parsed `pubspec.yaml` file of the dart project.
   */
  readonly pubspec: PubspecYamlSchema

  /**
   * The parsed `pubspec_overrides.yaml` file of the dart project.
   */
  readonly pubspecOverrides: PubspecOverridesYaml | undefined

  /**
   * The name of the dart project.
   */
  get name(): string {
    return this.pubspec.name
  }

  /**
   * Returns a new `DartProject` instance from the given `pubspec.yaml` file
   * path.
   *
   * @throws {Deno.errors.NotFound} If the file does not exist.
   */
  static async fromPubspecFilepath(path: string): Promise<DartProject> {
    if (!path.endsWith('pubspec.yaml')) {
      throw new DError(`Not a pubspec.yaml file: ${path}`)
    }
    if (!existsSync(path)) {
      throw new Deno.errors.NotFound(`pubspec.yaml not found: ${path}`)
    }
    const pubspecFilepath = resolve(path)
    const pubspecOverridesFilepath =
      existsSync(resolve(dirname(path), 'pubspec_overrides.yaml'))
        ? resolve(dirname(path), 'pubspec_overrides.yaml')
        : undefined
    return new DartProject({
      path: dirname(resolve(path)),
      pubspecFilepath,
      pubspecOverridesFilepath,
      pubspec: await loadProjectYaml(pubspecFilepath),
      pubspecOverrides: pubspecOverridesFilepath
        ? await loadPubspecOverridesYaml(pubspecOverridesFilepath)
        : undefined,
    })
  }
}
