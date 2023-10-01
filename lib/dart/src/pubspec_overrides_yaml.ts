import { std } from 'deps.ts'
import { PubDependency } from './pub_dependency.ts'

/**
 * The schema definition of `pubspec_overrides.yaml` files.
 *
 * @see https://dart.dev/tools/pub/pubspec#dependencies
 */
export interface PubspecOverridesYaml {
  readonly dependency_overrides?: {
    readonly [name: string]: PubDependency
  }
}

/**
 * Parses the given `pubspec_overrides.yaml` file.
 *
 * This doesn't validate the file's format or the correctness.
 */
export async function loadPubspecOverridesYaml(
  pubspecOverridesFilepath: string,
): Promise<PubspecOverridesYaml> {
  return std.yaml.parse(
    await Deno.readTextFile(pubspecOverridesFilepath),
  ) as PubspecOverridesYaml
}
