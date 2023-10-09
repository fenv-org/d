import { DependencyFilterOptions } from 'command/mod.ts'
import {
  DartProject,
  DependencyType,
  loadPubspecLockIn,
  PubspecLockYaml,
} from 'dart/mod.ts'

type ExtDartProject = DartProject & {
  pubspecLockYaml: PubspecLockYaml
}

/**
 * Returns an array of {@link DartProject} instances that contains only
 * projects that match the given package filter {@link options}.
 */
export async function applyDependencyFilterOptions(
  dartProjects: DartProject[],
  {
    includeDependency,
    excludeDependency,
    includeDirectDependency,
    excludeDirectDependency,
    includeDevDependency,
    excludeDevDependency,
  }: DependencyFilterOptions,
): Promise<DartProject[]> {
  if (
    !includeDependency && !excludeDependency &&
    !includeDirectDependency && !excludeDirectDependency &&
    !includeDevDependency && !excludeDevDependency
  ) {
    return dartProjects
  }

  return await Promise.all(dartProjects.map(readPubspecLockYaml))
    .then((it) => applyIncludeDependency(it, includeDependency))
    .then((it) => applyExcludeDependency(it, excludeDependency))
    .then((it) => applyIncludeDirectDependency(it, includeDirectDependency))
    .then((it) => applyExcludeDirectDependency(it, excludeDirectDependency))
    .then((it) => applyIncludeDevDependency(it, includeDevDependency))
    .then((it) => applyExcludeDevDependency(it, excludeDevDependency))
}

async function readPubspecLockYaml(
  dartProject: DartProject,
): Promise<ExtDartProject> {
  const pubspecLockYaml = await loadPubspecLockIn(dartProject.path)
  return {
    ...dartProject,
    name: dartProject.name,
    pubspecLockYaml,
  }
}

function applyIncludeDependency(
  dartProjects: ExtDartProject[],
  dependencies: string[] | undefined,
): ExtDartProject[] {
  if (!dependencies) {
    return dartProjects
  }
  const filtered: ExtDartProject[] = []
  for (const dartProject of dartProjects) {
    if (hasAllDependencies(dartProject.pubspecLockYaml, { dependencies })) {
      filtered.push(dartProject)
    }
  }
  return filtered
}

function applyExcludeDependency(
  dartProjects: ExtDartProject[],
  dependencies: string[] | undefined,
): ExtDartProject[] {
  if (!dependencies) {
    return dartProjects
  }
  const filtered: ExtDartProject[] = []
  for (const dartProject of dartProjects) {
    if (hasNoDependencies(dartProject.pubspecLockYaml, { dependencies })) {
      filtered.push(dartProject)
    }
  }
  return filtered
}

function applyIncludeDirectDependency(
  dartProjects: ExtDartProject[],
  dependencies: string[] | undefined,
): ExtDartProject[] {
  if (!dependencies) {
    return dartProjects
  }
  const filtered: ExtDartProject[] = []
  const dependencyTypes = new Set([
    DependencyType.directMain,
    DependencyType.directDev,
    DependencyType.directOverridden,
  ])
  for (const dartProject of dartProjects) {
    if (
      hasAllDependencies(dartProject.pubspecLockYaml, {
        dependencies,
        dependencyTypes,
      })
    ) {
      filtered.push(dartProject)
    }
  }
  return filtered
}

function applyExcludeDirectDependency(
  dartProjects: ExtDartProject[],
  dependencies: string[] | undefined,
): ExtDartProject[] {
  if (!dependencies) {
    return dartProjects
  }
  const filtered: ExtDartProject[] = []
  const dependencyTypes = new Set([
    DependencyType.directMain,
    DependencyType.directDev,
    DependencyType.directOverridden,
  ])
  for (const dartProject of dartProjects) {
    if (
      hasNoDependencies(dartProject.pubspecLockYaml, {
        dependencies,
        dependencyTypes,
      })
    ) {
      filtered.push(dartProject)
    }
  }
  return filtered
}

function applyIncludeDevDependency(
  dartProjects: ExtDartProject[],
  dependencies: string[] | undefined,
): ExtDartProject[] {
  if (!dependencies) {
    return dartProjects
  }
  const filtered: ExtDartProject[] = []
  const dependencyTypes = new Set([DependencyType.directDev])
  for (const dartProject of dartProjects) {
    if (
      hasAllDependencies(dartProject.pubspecLockYaml, {
        dependencies,
        dependencyTypes,
      })
    ) {
      filtered.push(dartProject)
    }
  }
  return filtered
}

function applyExcludeDevDependency(
  dartProjects: ExtDartProject[],
  dependencies: string[] | undefined,
): ExtDartProject[] {
  if (!dependencies) {
    return dartProjects
  }
  const filtered: ExtDartProject[] = []
  const dependencyTypes = new Set([DependencyType.directDev])
  for (const dartProject of dartProjects) {
    if (
      hasNoDependencies(dartProject.pubspecLockYaml, {
        dependencies,
        dependencyTypes,
      })
    ) {
      filtered.push(dartProject)
    }
  }
  return filtered
}

function hasAllDependencies(
  pubspecLockYaml: PubspecLockYaml,
  { dependencies, dependencyTypes = new Set() }: {
    dependencies: string[]
    dependencyTypes?: Set<DependencyType>
  },
): boolean {
  for (const packageName of dependencies) {
    if (!(packageName in pubspecLockYaml.packages)) {
      return false
    }
    if (dependencyTypes.size > 0) {
      const dependency = pubspecLockYaml.packages[packageName]
      if (!dependencyTypes.has(dependency.dependency)) {
        return false
      }
    }
  }
  return true
}

function hasNoDependencies(
  pubspecLockYaml: PubspecLockYaml,
  { dependencies, dependencyTypes = new Set() }: {
    dependencies: string[]
    dependencyTypes?: Set<DependencyType>
  },
): boolean {
  for (const packageName of dependencies) {
    if (!(packageName in pubspecLockYaml.packages)) {
      continue
    }
    if (dependencyTypes.size === 0) {
      return false
    }
    const dependency = pubspecLockYaml.packages[packageName]
    if (dependencyTypes.has(dependency.dependency)) {
      return false
    }
  }
  return true
}
