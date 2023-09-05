import { FpmContext } from '../../context/mod.ts'
import { std_fs, std_path } from '../../deps.ts'
import { FpmError } from '../../error/mod.ts'
import { FpmLogger } from '../../logger/mod.ts'
import { asArray, collectAsArray } from '../../util/mod.ts'
import { DartProject } from './dart_project.ts'
import { loadProjectYaml } from './project_yaml.ts'

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

  static async fromContext(context: FpmContext): Promise<FpmProject> {
    const { logger } = context
    const projectFilepath = await FpmProject.#findProjectFile(context.cwd)
    if (!projectFilepath) {
      throw new FpmError(`No \`${DEFAULT_PROJECT_FILENAME}\` file found`)
    }
    logger.verbose(`Found project file: ${projectFilepath}`)

    const projectYaml = loadProjectYaml(projectFilepath)
    logger.debug('projectYaml=', projectYaml)

    const projectDir = std_path.dirname(projectFilepath)
    const excludeRegExps = asArray(projectYaml.packages.exclude).map((glob) =>
      glob.includes('**')
        ? std_path.globToRegExp(glob)
        : std_path.globToRegExp(std_path.join('**', glob))
    )

    const dartProjects = (await Promise.all(
      asArray(projectYaml.packages.include).map((glob) =>
        collectAsArray(
          FpmProject.#findDartProjects({
            pwd: projectDir,
            glob,
            excludeRegExps,
            logger,
          }),
        )
      ),
    )).flat()

    return new FpmProject(projectFilepath, dartProjects)
  }

  static async #findProjectFile(path: string): Promise<string | undefined> {
    if (await std_fs.exists(std_path.join(path, DEFAULT_PROJECT_FILENAME))) {
      return std_path.join(path, DEFAULT_PROJECT_FILENAME)
    }
    const parent = std_path.dirname(path)
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
    const joinedGlob = std_path.join(pwd, glob, 'pubspec.yaml')
    logger.debug(`Searching dart projects: ${joinedGlob}`)
    const walkEntries = std_fs.expandGlob(joinedGlob)
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
