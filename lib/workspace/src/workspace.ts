import { loadBootstrapCache } from 'cache/mod.ts'
import { DependencyFilterOptions, PackageFilterOptions } from 'command/mod.ts'
import { Context } from 'context/mod.ts'
import { DartProject } from 'dart/mod.ts'
import { std } from 'deps.ts'
import { DError } from 'error/mod.ts'
import { Logger } from 'logger/mod.ts'
import * as util from 'util/mod.ts'
import { applyDependencyFilterOptions } from './apply_dependency_filter.ts'
import { applyPackageFilterOptions } from './apply_package_filter.ts'
import { FunctionSpec, loadWorkspaceYaml } from './workspace_yaml.ts'

const { exists, expandGlob } = std.fs
const { join, dirname, globToRegExp, joinGlobs } = std.path

export const DEFAULT_PROJECT_FILENAME = 'd.yaml'

export type WorkspaceFromContextOptions =
  & {
    useBootstrapCache: 'always' | 'never' | 'fallbackToWorkspaceFile'
  }
  & PackageFilterOptions
  & DependencyFilterOptions

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
   * Finds a pre-defined function in `d.yaml` that matches the given
   * {@link functionName}.
   */
  async findFunction(
    functionName: string,
  ): Promise<
    {
      workspace: Workspace
      function: {
        functionName: string
        pathParams: Record<string, string>
      } & FunctionSpec
    } | undefined
  > {
    const functions = loadWorkspaceYaml(this.workspaceFilepath).functions
    for (const [definedFuncName, functionSpec] of Object.entries(functions)) {
      const match = functionName.match(functionNameToRegexp(definedFuncName))
      if (!match) {
        continue
      }
      const filteredDartProjects = await applyCommonFilters(
        this.dartProjects,
        functionSpec.options ?? {},
      )
      return {
        workspace: new Workspace(
          this.workspaceFilepath,
          filteredDartProjects,
        ),
        function: {
          ...functionSpec,
          functionName: definedFuncName,
          pathParams: { ...match.groups },
        },
      }
    }
    return undefined
  }

  /**
   * Constructs a new {@link Workspace} instance from the given {@link Context}.
   */
  static async fromContext(
    context: Context,
    options = {
      useBootstrapCache: 'always',
    } as Readonly<WorkspaceFromContextOptions>,
  ): Promise<Workspace> {
    const { logger } = context
    const workspaceFilepath = await Workspace.#findWorkspaceFile(context)
    logger.stdout({ verbose: true, timestamp: true })
      .push('Found workspace file: ')
      .push(workspaceFilepath)
      .lineFeed()

    if (options.useBootstrapCache !== 'never') {
      const workspaceDir = std.path.dirname(workspaceFilepath)
      const cacheLoadResult = await loadBootstrapCache(workspaceDir)
      switch (cacheLoadResult.type) {
        case 'success': {
          logger.stdout({ debug: true, timestamp: true })
            .push('Using cached dart projects: ')
            .push(JSON.stringify(cacheLoadResult.cache))
            .lineFeed()
          const workspaceDir = dirname(workspaceFilepath)
          const dartProjects = await Promise.all(
            Object.entries(cacheLoadResult.cache.packages)
              .map(([_, { pubspecRelativePath }]) =>
                std.path.resolve(workspaceDir, pubspecRelativePath)
              )
              .map(DartProject.fromPubspecFilepath),
          )
          return new Workspace(
            std.path.resolve(workspaceFilepath),
            await applyCommonFilters(dartProjects, options),
          )
        }

        case 'error':
          if (options.useBootstrapCache === 'always') {
            throw cacheLoadResult.error
          }
          break
      }
    }

    const dartProjects = await Workspace
      .#dartProjectsFromWorkspaceYaml(logger, workspaceFilepath)
    return new Workspace(
      std.path.resolve(workspaceFilepath),
      await applyCommonFilters(dartProjects, options),
    )
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
      canonicalize: false,
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

async function applyCommonFilters(
  dartProjects: DartProject[],
  options: PackageFilterOptions & DependencyFilterOptions,
): Promise<DartProject[]> {
  return await applyPackageFilterOptions(dartProjects, options)
    .then((them) => applyDependencyFilterOptions(them, options))
}

function functionNameToRegexp(functionName: string): RegExp {
  const variableRegexp = /{(?<variable>[a-zA-A_][[a-zA-A0-9_]+)}/g
  let pattern = ''
  let cursor = 0
  for (const match of functionName.matchAll(variableRegexp)) {
    if (match.index) {
      pattern += functionName.substring(cursor, match.index)
      pattern += `(?<${match.groups!['variable']}>.+)`
      cursor = match.index + match[0].length
    }
  }
  pattern += functionName.substring(cursor)
  return new RegExp(`^${pattern}$`)
}
