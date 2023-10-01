import { BootstrapCacheLoadResult, loadBootstrapCache } from 'cache/mod.ts'
import { PackageFilterOptions } from 'command/mod.ts'
import { Context } from 'context/mod.ts'
import { DartProject } from 'dart/mod.ts'
import { std } from 'deps.ts'
import { DError } from 'error/mod.ts'
import { Logger, logLabels } from 'logger/mod.ts'
import * as util from '../../util/mod.ts'
import { applyPackageFilterOptions } from './apply_package_filter.ts'
import { loadWorkspaceYaml } from './workspace_yaml.ts'

const { exists, expandGlob } = std.fs
const { join, dirname, globToRegExp, joinGlobs } = std.path

export const DEFAULT_PROJECT_FILENAME = 'd.yaml'

/**
 * A class that represents the workspace managed by `d`.
 *
 * The workspace is a Dart/Flutter project that contains `d.yaml`.
 */
export class Workspace {
  constructor(
    /**
     * The absolute path of the `d.yaml` file of the main project.
     */
    public readonly workspaceFilepath: string,
    /**
     * The cached result of the latest `d bootstrap` execution.
     */
    public readonly bootstrapCache: BootstrapCacheLoadResult,
    /**
     * The found dart projects.
     */
    public readonly dartProjects: DartProject[],
  ) {
  }

  /**
   * The absolute path of the workspace directory.
   */
  get workspaceDir(): string {
    return dirname(this.workspaceFilepath)
  }

  /**
   * Creates a new {@link Workspace} clone applying the given
   * package filter {@link options}.
   */
  async applyPackageFilterOptions(
    options: PackageFilterOptions,
  ): Promise<Workspace> {
    return new Workspace(
      this.workspaceFilepath,
      this.bootstrapCache,
      await applyPackageFilterOptions(this.dartProjects, options),
    )
  }

  /**
   * Constructs a new {@link Workspace} instance from the given {@link Context}.
   */
  static async fromContext(context: Context): Promise<Workspace> {
    const { logger } = context
    const workspaceFilepath = await Workspace.#findWorkspaceFile(context)
    logger.stdout({ verbose: true, timestamp: true })
      .push('Found workspace file: ')
      .push(workspaceFilepath)
      .lineFeed()

    const bootstrapCache = await loadBootstrapCache(
      std.path.dirname(workspaceFilepath),
    )

    let dartProjects: DartProject[]

    switch (bootstrapCache.type) {
      case 'success': {
        logger.stdout({ debug: true, timestamp: true })
          .push('Using cached dart projects: ')
          .push(JSON.stringify(bootstrapCache.cache))
          .lineFeed()
        const workspaceDir = dirname(workspaceFilepath)
        dartProjects = await Promise.all(
          Object.entries(bootstrapCache.cache.packages)
            .map(([_, { pubspecRelativePath }]) =>
              std.path.resolve(workspaceDir, pubspecRelativePath)
            )
            .map(DartProject.fromPubspecFilepath),
        )
        break
      }

      case 'error':
        logger.stdout({ debug: true, timestamp: true })
          .label(logLabels.error)
          .push('Failed to load bootstrap cache: ')
          .push(bootstrapCache.error.message)
          .lineFeed()
        /* falls through */

      case 'not_found':
        logger.stdout({ debug: true, timestamp: true })
          .push('No bootstrap cache exists')
          .lineFeed()
        dartProjects = await Workspace.#dartProjectsFromWorkspaceYaml(
          logger,
          workspaceFilepath,
        )
        break
    }
    return new Workspace(workspaceFilepath, bootstrapCache, dartProjects)
  }

  static async #findWorkspaceFile(context: Context): Promise<string> {
    if (context.dWorkspace) {
      if (await exists(context.dWorkspace, { isFile: true })) {
        return context.dWorkspace
      }
      if (await exists(join(context.dWorkspace, DEFAULT_PROJECT_FILENAME))) {
        return join(context.dWorkspace, DEFAULT_PROJECT_FILENAME)
      }
      throw new DError(
        `No \`${DEFAULT_PROJECT_FILENAME}\` file found in ` +
          `\`${context.dWorkspace}\``,
      )
    }

    if (context.config) {
      if (await exists(context.config, { isFile: true })) {
        return context.config
      }
      throw new DError(`No \`${context.config}\` file exists`)
    }

    return this.#findWorkspaceFileRecursively(context.cwd)
  }

  static async #findWorkspaceFileRecursively(path: string): Promise<string> {
    if (await exists(join(path, DEFAULT_PROJECT_FILENAME))) {
      return join(path, DEFAULT_PROJECT_FILENAME)
    }
    const parent = dirname(path)
    if (parent === path) {
      throw new DError(`No \`${DEFAULT_PROJECT_FILENAME}\` file found`)
    }
    return Workspace.#findWorkspaceFileRecursively(parent)
  }

  static async *#findDartProjects(options: {
    pwd: string
    glob: string
    excludeRegExps: RegExp[]
    logger: Logger
  }): AsyncGenerator<DartProject> {
    const { logger, pwd, glob, excludeRegExps } = options
    const joinedGlob = join(glob, 'pubspec.yaml')
    logger
      .stdout({ debug: true, timestamp: true })
      .push('Searching dart projects: ')
      .push(joinedGlob)
      .lineFeed()
    const walkEntries = expandGlob(joinedGlob, {
      root: pwd,
      extended: true,
      followSymlinks: true,
      resolveSymlinksToRealPaths: false,
    })
    for await (const walkEntry of walkEntries) {
      const dartProject = await DartProject.fromPubspecFilepath(
        walkEntry.path,
      )
      if (Workspace.#shouldExclude(dartProject, excludeRegExps)) {
        logger.stdout({ debug: true, timestamp: true })
          .push('Found but excluded dart project: ')
          .push(walkEntry.path)
          .lineFeed()
        continue
      }

      logger.stdout({ verbose: true, timestamp: true })
        .push('Found dart project: ')
        .push(dartProject.name)
        .push(': ')
        .push(dartProject.path)
        .lineFeed()
      yield dartProject
    }
  }

  static #shouldExclude(
    dartProject: DartProject,
    excludeRegExps: RegExp[],
  ): boolean {
    return excludeRegExps.some((exclude) => exclude.test(dartProject.path))
  }

  static async #dartProjectsFromWorkspaceYaml(
    logger: Logger,
    workspaceFilepath: string,
  ): Promise<DartProject[]> {
    const workspaceYaml = loadWorkspaceYaml(workspaceFilepath)
    logger.stdout({ debug: true, timestamp: true })
      .push('Loaded workspace file: ')
      .push(JSON.stringify(workspaceYaml, null, '  '))
      .lineFeed()

    const workspaceDir = dirname(workspaceFilepath)
    const excludeRegExps = util
      .asArray(workspaceYaml.packages.exclude)
      .map((glob) =>
        glob.includes('**')
          ? globToRegExp(glob, { extended: true })
          : globToRegExp(joinGlobs(['**', glob], { extended: true }))
      )

    return (await Promise.all(
      util
        .asArray(workspaceYaml.packages.include)
        .map((glob) =>
          Workspace.#findDartProjects({
            pwd: workspaceDir,
            glob,
            excludeRegExps,
            logger,
          })
        )
        .map(util.collectAsArray),
    )).flat()
  }
}
