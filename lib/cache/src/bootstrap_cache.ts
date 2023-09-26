import { loadProjectYaml } from '../../dart/mod.ts'
import { std } from '../../deps.ts'
import { DError } from '../../error/mod.ts'
import { Workspace } from '../../workspace/mod.ts'
import { RELATIVE_CACHE_DIRECTORY } from './cache_directory.ts'

export type BootstrapCache = {
  readonly workspaceFilepath: string
  readonly packages: {
    readonly [packageName: string]: {
      readonly pubspecRelativePath: string
      readonly dependency: string[]
    }
  }
}

export type LoadBootstrapCacheResult = {
  type: 'success'
  cache: BootstrapCache
} | {
  type: 'error'
  error: Error
} | {
  type: 'not_found'
}

/**
 * Loads the bootstrap cache from the given workspace directory.
 *
 * The bootstrap cache is located at `workspace/.d/bootstrap.yaml`.
 */
export async function loadBootstrapCache(
  workspaceDir: string,
): Promise<LoadBootstrapCacheResult> {
  const cacheFilepath = std.path.resolve(
    workspaceDir,
    RELATIVE_CACHE_DIRECTORY,
    'bootstrap.yaml',
  )
  if (!await std.fs.exists(cacheFilepath, { isFile: true })) {
    return { type: 'not_found' }
  }

  const cache = await std.yaml.parse(
    await Deno.readTextFile(cacheFilepath),
  ) as BootstrapCache

  if (std.path.dirname(cache.workspaceFilepath) !== workspaceDir) {
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

export async function saveBootstrapCache(
  workspace: Workspace,
): Promise<void> {
  const cacheDirectory = std.path.resolve(
    workspace.workspaceDir,
    RELATIVE_CACHE_DIRECTORY,
  )
  await std.fs.ensureDir(cacheDirectory)
  const cacheFilepath = std.path.join(cacheDirectory, 'bootstrap.yaml')
  const cache = {
    workspaceFilepath: workspace.workspaceFilepath,
    packages: {},
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
