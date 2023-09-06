import { FpmContext } from '../../context/mod.ts'
import { DartProject } from '../../dart/mod.ts'
import { std_fs, std_path } from '../../deps.ts'
import { FpmError } from '../../error/mod.ts'
import { FpmLogger } from '../../logger/mod.ts'
import * as util from '../../util/mod.ts'
import { loadProjectYaml } from './project_yaml.ts'

const { exists, expandGlob } = std_fs
const { join, dirname, globToRegExp } = std_path

/**
 * A class that represents the main project managed by `fpm`.
 *
 * The main project is a Flutter project that contains `fpm.yaml`.
 */
export class FpmProject {
  constructor(
    /**
     * The absolute path of the `fpm.yaml` file of the main project.
     */
    public projectFilepath: string,
    /**
     * The found dart projects.
     */
    public readonly dartProjects: DartProject[],
  ) {
  }

  /**
   * Constructs a new `FpmProject` instance from the given {@link FpmContext}.
   */
  static async fromContext(context: FpmContext): Promise<FpmProject> {
    const { logger } = context
    const projectFilepath = await FpmProject.#findProjectFile(context.cwd)
    if (!projectFilepath) {
      throw new FpmError(`No \`${DEFAULT_PROJECT_FILENAME}\` file found`)
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
          FpmProject.#findDartProjects({
            pwd: projectDir,
            glob,
            excludeRegExps,
            logger,
          })
        )
        .map(util.collectAsArray),
    )).flat()

    return new FpmProject(projectFilepath, dartProjects)
  }

  static async #findProjectFile(path: string): Promise<string | undefined> {
    if (await exists(join(path, DEFAULT_PROJECT_FILENAME))) {
      return join(path, DEFAULT_PROJECT_FILENAME)
    }
    const parent = dirname(path)
    if (parent === path) {
      return undefined
    }
    return FpmProject.#findProjectFile(parent)
  }

  static async *#findDartProjects(options: {
    pwd: string
    glob: string
    excludeRegExps: RegExp[]
    logger: FpmLogger
  }): AsyncGenerator<DartProject> {
    const { logger, pwd, glob, excludeRegExps } = options
    const joinedGlob = join(pwd, glob, 'pubspec.yaml')
    logger.debug(`Searching dart projects: ${joinedGlob}`)
    const walkEntries = expandGlob(joinedGlob)
    for await (const walkEntry of walkEntries) {
      const dartProject = await DartProject.fromPubspecFilepath(
        walkEntry.path,
      )
      if (FpmProject.#shouldExclude(dartProject, excludeRegExps)) {
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

const DEFAULT_PROJECT_FILENAME = 'fpm.yaml'
