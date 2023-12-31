import { DependencyGraph, loadProjectYaml } from 'dart/mod.ts'
import { std } from 'deps.ts'
import { DError } from 'error/mod.ts'
import { Workspace } from 'workspace/mod.ts'
import { getCacheDirectory, getCacheFilepath } from './cache_directory.ts'

/**
 * The schema of the bootstrap cache.
 */
export type BootstrapCache = {
  workspaceFilepath: string
  packages: {
    [packageName: string]: {
      pubspecRelativePath: string
      dependency: string[]
    }
  }
}

export type BootstrapCacheLoadResult = {
  type: 'success'
  cache: Readonly<BootstrapCache>
} | {
  type: 'error'
  error: Error
}

/**
 * Loads the bootstrap cache from the given workspace directory.
 *
 * The bootstrap cache is located at `workspace/.d/bootstrap.yaml`.
 */
export async function loadBootstrapCache(
  workspaceDir: string,
): Promise<BootstrapCacheLoadResult> {
  const cacheFilepath = getCacheFilepath(workspaceDir)
  if (!await std.fs.exists(cacheFilepath, { isFile: true })) {
    return {
      type: 'error',
      error: new DError(`Need to bootstrap the workspace`),
    }
  }

  const cache = await std.yaml
    .parse(await Deno.readTextFile(cacheFilepath)) as BootstrapCache

  if (
    std.path.dirname(cache.workspaceFilepath) !== std.path.resolve(workspaceDir)
  ) {
    return {
      type: 'error',
      error: new DError(`Need to re-bootstrap the workspace`),
    }
  }

  try {
    await Promise.all(
      Object.entries(cache.packages)
        .map(([packageName, { pubspecRelativePath }]) =>
          ensurePackageExists(
            packageName,
            std.path.resolve(workspaceDir, pubspecRelativePath),
          )
        ),
    )
    return { type: 'success', cache }
  } catch (error) {
    return { type: 'error', error }
  }
}

/**
 * Saves the bootstrap cache for the given workspace.
 */
export async function saveBootstrapCache(
  workspace: Workspace,
  dependencyGraph: DependencyGraph,
): Promise<void> {
  const cache: BootstrapCache = {
    workspaceFilepath: workspace.workspaceFilepath,
    packages: {},
  }

  for (const dartProject of workspace.dartProjects) {
    const relativePath = std.path.relative(
      workspace.workspaceDir,
      dartProject.path,
    )
    cache.packages[dartProject.name] = {
      pubspecRelativePath: std.path.join(relativePath, 'pubspec.yaml'),
      dependency: dependencyGraph
        .dependenciesOf(dartProject)
        .map((dependency) => dependency.name),
    }
  }

  const cacheDirectory = getCacheDirectory(workspace.workspaceDir)
  await std.fs.ensureDir(cacheDirectory)
  const cacheFilepath = std.path.join(cacheDirectory, 'bootstrap.yaml')
  await Deno.writeTextFile(
    cacheFilepath,
    std.yaml.stringify(cache),
  )
}

/**
 * Removes the bootstrap cache for the given workspace.
 */
export async function removeBootstrapCache(
  workspaceDir: string,
): Promise<void> {
  const cacheDirectory = getCacheDirectory(workspaceDir)
  if (await std.fs.exists(cacheDirectory, { isDirectory: true })) {
    return Deno.remove(cacheDirectory, { recursive: true })
  }
}

async function ensurePackageExists(
  packageName: string,
  pubspecFilepath: string,
): Promise<void> {
  if (!await std.fs.exists(pubspecFilepath, { isFile: true })) {
    throw new DError(`Need to re-bootstrap the workspace`)
  }

  const pubspecYaml = await loadProjectYaml(pubspecFilepath)
  if (pubspecYaml.name !== packageName) {
    throw new DError(`Need to re-bootstrap the workspace`)
  }
}
