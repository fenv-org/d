import { Context } from '../../context/mod.ts'
import { DartProject } from '../../dart/mod.ts'
import { std } from '../../deps.ts'
import { DError } from '../../error/mod.ts'
import { DLogger } from '../../logger/mod.ts'
import * as util from '../../util/mod.ts'
import { loadProjectYaml } from './project_yaml.ts'

const { exists, expandGlob } = std.fs
const { join, dirname, globToRegExp } = std.path

export const DEFAULT_PROJECT_FILENAME = 'd.yaml'

/**
 * A class that represents the main project managed by `d`.
 *
 * The main project is a Flutter project that contains `d.yaml`.
 */
export class DProject {
  constructor(
    /**
     * The absolute path of the `d.yaml` file of the main project.
     */
    public projectFilepath: string,
    /**
     * The found dart projects.
     */
    public readonly dartProjects: DartProject[],
  ) {
  }

  /**
   * Constructs a new `DProject` instance from the given {@link Context}.
   */
  static async fromContext(context: Context): Promise<DProject> {
    const { logger } = context
    const projectFilepath = await DProject.#findProjectFile(context.cwd)
    if (!projectFilepath) {
      throw new DError(`No \`${DEFAULT_PROJECT_FILENAME}\` file found`)
    }
    logger.verbose(`Found project file: ${projectFilepath}`)

    const projectYaml = loadProjectYaml(projectFilepath)
    logger.debug('projectYaml=', projectYaml)

    const projectDir = dirname(projectFilepath)
    const excludeRegExps = util
      .asArray(projectYaml.packages.exclude)
      .map((glob) =>
        glob.includes('**')
          ? globToRegExp(glob)
          : globToRegExp(join('**', glob))
      )

    const dartProjects = (await Promise.all(
      util
        .asArray(projectYaml.packages.include)
        .map((glob) =>
          DProject.#findDartProjects({
            pwd: projectDir,
            glob,
            excludeRegExps,
            logger,
          })
        )
        .map(util.collectAsArray),
    )).flat()

    return new DProject(projectFilepath, dartProjects)
  }

  static async #findProjectFile(path: string): Promise<string | undefined> {
    if (await exists(join(path, DEFAULT_PROJECT_FILENAME))) {
      return join(path, DEFAULT_PROJECT_FILENAME)
    }
    const parent = dirname(path)
    if (parent === path) {
      return undefined
    }
    return DProject.#findProjectFile(parent)
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
      if (DProject.#shouldExclude(dartProject, excludeRegExps)) {
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
