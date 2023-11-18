import {
  DependencyFilterOptions,
  EarlyExitOptions,
  PackageFilterOptions,
} from 'command/mod.ts'
import { std } from 'deps.ts'
import { DError } from 'error/mod.ts'
import { version } from 'version/mod.ts'

/**
 * The schema definition of `d.yaml`.
 */
export interface WorkspaceYamlSchema {
  version: string
  name: string
  packages: {
    include: string | string[]
    exclude?: string | string[]
  }
  functions: {
    [functionName: string]: FunctionSpec
  }
}

export type FunctionSpec = {
  description?: string
  exec: string
  options?: Partial<
    EarlyExitOptions & PackageFilterOptions & DependencyFilterOptions
  >
}

/**
 * Loads the `d.yaml` file from the given `filepath`.
 *
 * This function assumes that the given `filepath` file exists.
 */
export function loadWorkspaceYaml(filepath: string): WorkspaceYamlSchema {
  const text = Deno.readTextFileSync(filepath)
  const parsedText = std.yaml.parse(text)
  if (typeof parsedText !== 'object' || parsedText === null) {
    throw new DError(`Invalid yaml file format`)
  }
  const yaml = parsedText as Record<string, unknown>
  if (!('version' in yaml)) {
    throw new DError('`version` field is required')
  }
  if (typeof yaml.version !== 'string' || !/^v\d+$/.test(yaml.version)) {
    throw new DError('`version` must be the version number started with `v`')
  }
  const yamlVersion: number = parseInt(
    /^v(?<ver>\d+)$/.exec(yaml.version)!.groups!['ver'],
  )
  if (yamlVersion !== version.major) {
    throw new DError(
      `Not compatible version: ` +
        `\`v${yamlVersion}\` in the yaml file: ` +
        `Expected \`v${version.major}\``,
    )
  }
  if (!('name' in yaml) || typeof yaml.name !== 'string') {
    throw new DError('`name` field is required')
  }
  if (!('packages' in yaml)) {
    throw new DError('`packages` field is required')
  }
  if (typeof yaml.packages !== 'object' || yaml.packages === null) {
    throw new DError('`packages` field must be an object')
  }
  if (!('include' in yaml.packages)) {
    throw new DError('`packages.include` field is required')
  }
  if (
    typeof yaml.packages.include !== 'string' &&
    !Array.isArray(yaml.packages.include)
  ) {
    throw new DError(
      '`packages.include` must consist of at least one glob pattern',
    )
  }
  if ('exclude' in yaml.packages) {
    if (
      typeof yaml.packages.exclude !== 'string' &&
      !Array.isArray(yaml.packages.exclude)
    ) {
      throw new DError(
        '`packages.exclude` must consist of at least one glob pattern',
      )
    }
  }
  if ('functions' in yaml && typeof yaml.functions === 'object') {
    const functions = yaml.functions!
    for (const [functionName, functionSpec] of Object.entries(functions)) {
      if (!/^[a-zA-Z0-9_/{}.:]+$/.test(functionName)) {
        throw new DError(
          `\`functions.${functionName}\` contains any disallowed characters: allowed characters are "a-zA-Z0-9_/{}.:"`,
        )
      }
      if (!('exec' in functionSpec)) {
        throw new DError(
          `\`functions.${functionName}\` does not have \`exec\` property.`,
        )
      }
    }
  }
  return {
    version: yaml.version,
    name: yaml.name,
    packages: yaml.packages as WorkspaceYamlSchema['packages'],
    functions: yaml.functions
      ? yaml.functions as WorkspaceYamlSchema['functions']
      : {},
  }
}
