import { Context } from '../../context/mod.ts'
import { DartProject } from '../../dart/mod.ts'
import { std } from '../../deps.ts'
import { DError } from '../../error/mod.ts'
import { DLogger } from '../../logger/mod.ts'
import * as util from '../../util/mod.ts'
import { loadWorkspaceYaml } from './workspace_yaml.ts'

const { exists, expandGlob } = std.fs
const { join, dirname, globToRegExp } = std.path

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
    public workspaceFilepath: string,
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
   * Constructs a new {@link Workspace} instance from the given {@link Context}.
   */
  static async fromContext(context: Context): Promise<Workspace> {
    const { logger } = context
    const workspaceFilepath = await Workspace.#findWorkspaceFile(context)
    logger.verbose(`Found project file: ${workspaceFilepath}`)

    const workspaceYaml = loadWorkspaceYaml(workspaceFilepath)
    logger.debug('workspaceYaml=', workspaceYaml)

    const workspaceDir = dirname(workspaceFilepath)
    const excludeRegExps = util
      .asArray(workspaceYaml.packages.exclude)
      .map((glob) =>
        glob.includes('**')
          ? globToRegExp(glob)
          : globToRegExp(join('**', glob))
      )

    const dartProjects = (await Promise.all(
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

    return new Workspace(workspaceFilepath, dartProjects)
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
    logger: DLogger
  }): AsyncGenerator<DartProject> {
    const { logger, pwd, glob, excludeRegExps } = options
    const joinedGlob = join(pwd, glob, 'pubspec.yaml')
    logger.debug(`Searching dart projects: ${joinedGlob}`)
    const walkEntries = expandGlob(joinedGlob)
    for await (const walkEntry of walkEntries) {
      const dartProject = await DartProject.fromPubspecFilepath(
        walkEntry.path,
      )
      if (Workspace.#shouldExclude(dartProject, excludeRegExps)) {
        logger.debug(`Found but excluded dart project: ${walkEntry.path}`)
        continue
      }

      logger.verbose(
        `Found dart project: ${dartProject.name}: ${dartProject.path}`,
      )
      yield dartProject
    }
  }

  static #shouldExclude(
    dartProject: DartProject,
    excludeRegExps: RegExp[],
  ): boolean {
    return excludeRegExps.some((exclude) => exclude.test(dartProject.path))
  }
}
