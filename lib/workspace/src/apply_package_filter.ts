import { PackageFilterOptions } from 'command/mod.ts'
import { std } from 'deps.ts'
import { DartProject } from '../../dart/mod.ts'

/**
 * Returns an array of {@link DartProject} instances that contains only
 * projects that match the given package filter {@link options}.
 */
export async function applyPackageFilterOptions(
  dartProjects: DartProject[],
  options: PackageFilterOptions,
): Promise<DartProject[]> {
  return await Promise.resolve(dartProjects)
    .then((it) => applyIncludeHasFileOptions(it, options.includeHasFile))
    .then((it) => applyExcludeHasFileOptions(it, options.excludeHasFile))
    .then((it) => applyIncludeHasDirOptions(it, options.includeHasDir))
    .then((it) => applyExcludeHasDirOptions(it, options.excludeHasDir))
}

async function applyIncludeHasFileOptions(
  dartProjects: DartProject[],
  fileExists: string[] | undefined,
): Promise<DartProject[]> {
  if (!fileExists) {
    return dartProjects
  }
  const filtered: DartProject[] = []
  for (const dartProject of dartProjects) {
    if (await hasMatches(dartProject, { pattern: fileExists, type: 'file' })) {
      filtered.push(dartProject)
    }
  }
  return filtered
}

async function applyExcludeHasFileOptions(
  dartProjects: DartProject[],
  noFileExists: string[] | undefined,
): Promise<DartProject[]> {
  if (!noFileExists) {
    return dartProjects
  }
  const filtered: DartProject[] = []
  for (const dartProject of dartProjects) {
    if (
      !(await hasMatches(dartProject, { pattern: noFileExists, type: 'file' }))
    ) {
      filtered.push(dartProject)
    }
  }
  return filtered
}

async function applyIncludeHasDirOptions(
  dartProjects: DartProject[],
  dirExists: string[] | undefined,
): Promise<DartProject[]> {
  if (!dirExists) {
    return dartProjects
  }
  const filtered: DartProject[] = []
  for (const dartProject of dartProjects) {
    if (await hasMatches(dartProject, { pattern: dirExists, type: 'dir' })) {
      filtered.push(dartProject)
    }
  }
  return filtered
}

async function applyExcludeHasDirOptions(
  dartProjects: DartProject[],
  noDirExists: string[] | undefined,
): Promise<DartProject[]> {
  if (!noDirExists) {
    return dartProjects
  }
  const filtered: DartProject[] = []
  for (const dartProject of dartProjects) {
    if (
      !(await hasMatches(dartProject, { pattern: noDirExists, type: 'dir' }))
    ) {
      filtered.push(dartProject)
    }
  }
  return filtered
}

async function hasMatches(
  dartProject: DartProject,
  options: {
    pattern: string[]
    type: 'file' | 'dir'
  },
): Promise<boolean> {
  if (options.pattern.length === 0) {
    return true
  }

  for (const fileOrGlob of options.pattern) {
    if (std.path.isGlob(fileOrGlob)) {
      const filesIterator = std.fs.expandGlob(fileOrGlob, {
        root: dartProject.path,
        includeDirs: options.type === 'dir',
        extended: true,
        followSymlinks: true,
        resolveSymlinksToRealPaths: false,
      })
      for await (const _ of filesIterator) {
        return true
      }
    } else {
      const path = std.path.resolve(dartProject.path, fileOrGlob)
      if (
        await std.fs.exists(path, {
          isFile: options.type === 'file',
          isDirectory: options.type === 'dir',
        })
      ) {
        return true
      }
    }
  }
  return false
}
