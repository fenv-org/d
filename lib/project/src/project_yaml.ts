import { std_yaml } from '../../deps.ts'
import { FpmError } from '../../error/mod.ts'
import { fpmVersion } from '../../version/mod.ts'

/**
 * The schema of `fpm.yaml`.
 */
export interface ProjectYaml {
  version: string
  name: string
  packages: {
    include: string | string[]
    exclude?: string | string[]
  }
}

export function loadProjectYaml(filepath: string): ProjectYaml {
  const text = Deno.readTextFileSync(filepath)
  const parsedText = std_yaml.parse(text)
  if (typeof parsedText !== 'object' || parsedText === null) {
    throw new FpmError('Invalid `fpm.yaml` file format')
  }
  const yaml = parsedText as Record<string, unknown>
  if (!('version' in yaml)) {
    throw new FpmError('`version` field is required')
  }
  if (typeof yaml.version !== 'string' || !/^v\d+$/.test(yaml.version)) {
    throw new FpmError('`version` must be the version number started with `v`')
  }
  const yamlVersion: number = parseInt(
    /^v(?<ver>\d+)$/.exec(yaml.version)!.groups!['ver'],
  )
  if (yamlVersion !== fpmVersion.major) {
    throw new FpmError(
      `Not compatible version: ` +
        `\`v${yamlVersion}\` in \`fpm.yaml\`: ` +
        `Expected \`v${fpmVersion.major}\``,
    )
  }
  if (!('name' in yaml) || typeof yaml.name !== 'string') {
    throw new FpmError('`name` field is required')
  }
  if (!('packages' in yaml)) {
    throw new FpmError('`packages` field is required')
  }
  if (typeof yaml.packages !== 'object' || yaml.packages === null) {
    throw new FpmError('`packages` field must be an object')
  }
  if (!('include' in yaml.packages)) {
    throw new FpmError('`packages.include` field is required')
  }
  if (
    typeof yaml.packages.include !== 'string' &&
    !Array.isArray(yaml.packages.include)
  ) {
    throw new FpmError(
      '`packages.include` must consist of at least one glob pattern',
    )
  }
  if ('exclude' in yaml.packages) {
    if (
      typeof yaml.packages.exclude !== 'string' &&
      !Array.isArray(yaml.packages.exclude)
    ) {
      throw new FpmError(
        '`packages.exclude` must consist of at least one glob pattern',
      )
    }
  }
  return {
    version: yaml.version,
    name: yaml.name,
    packages: yaml.packages as ProjectYaml['packages'],
  }
}
