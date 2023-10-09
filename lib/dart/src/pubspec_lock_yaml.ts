import { std } from 'deps.ts'

/**
 * The schema definition of `pubspec.lock` files.
 *
 * This is a subset of the full schema.
 */
export interface PubspecLockYaml {
  packages: {
    [packageName: string]: {
      version: string
      dependency: DependencyType
    }
  }
}

/**
 * The type of a dependency.
 */
export enum DependencyType {
  directMain = 'direct main',
  directDev = 'direct dev',
  transitive = 'transitive',
}

/**
 * Returns whether the given {@link directory} contains a `pubspec.lock` file.
 */
export function existsPubspecLockIn(directory: string): Promise<boolean> {
  return std.fs.exists(std.path.join(directory, 'pubspec.lock'))
}

/**
 * Reads the `pubspec.lock` file from the given {@link directory}.
 */
export async function loadPubspecLockIn(
  directory: string,
): Promise<Readonly<PubspecLockYaml>> {
  const content = await Deno.readTextFile(
    std.path.join(directory, 'pubspec.lock'),
  )
  return std.yaml.parse(content) as PubspecLockYaml
}
