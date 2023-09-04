import { std_yaml } from '../../deps.ts'
import { PubDependency } from './pub_dependency.ts'

/**
 * The schema definition of `pubspec.yaml` files.
 *
 * This is a subset of the full schema.
 *
 * @see https://dart.dev/tools/pub/pubspec
 */
export interface PubspecYamlSchema {
  readonly name: string
  readonly description?: string
  readonly version: string
  readonly repository?: string
  readonly publish_to?: string

  readonly environment?: {
    readonly sdk?: string
    readonly flutter?: string
  }

  readonly dependencies?: {
    readonly [name: string]: PubDependency
  }

  readonly dev_dependencies?: {
    readonly [name: string]: PubDependency
  }

  readonly dependency_overrides?: {
    readonly [name: string]: PubDependency
  }
}

/**
 * Parses the given `pubspec.yaml` file.
 *
 * This doesn't validate the file's format or the correctness.
 */
export async function loadProjectYaml(
  pubspecFilepath: string,
): Promise<PubspecYamlSchema> {
  return std_yaml.parse(
    await Deno.readTextFile(pubspecFilepath),
  ) as PubspecYamlSchema
}
