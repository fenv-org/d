import { FpmContext } from '../../context/mod.ts'
import { std_fs, std_path } from '../../deps.ts'
import { FpmError } from '../../error/mod.ts'
import { asArray } from '../../util/mod.ts'
import { DartProject } from './dart_project.ts'
import { parseProjectYaml } from './project_yaml.ts'

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
     * The main dart project.
     */
    public readonly mainProject: DartProject,
    /**
     * The extra dart projects.
     *
     * This does not include the main project.
     */
    public readonly extraProjects: DartProject[],
  ) {
  }

  static async fromContext(context: FpmContext): Promise<FpmProject> {
    const { logger } = context
    const DEFAULT_PROJECT_FILENAME = 'fpm.yaml'

    async function findProjectFile(path: string): Promise<string | undefined> {
      if (await std_fs.exists(std_path.join(path, DEFAULT_PROJECT_FILENAME))) {
        return std_path.join(path, DEFAULT_PROJECT_FILENAME)
      }
      const parent = std_path.dirname(path)
      if (parent === path) {
        return undefined
      }
      return findProjectFile(parent)
    }

    async function* findDartProjects(
      pwd: string,
      glob: string,
    ): AsyncGenerator<DartProject> {
      const joinedGlob = std_path.join(pwd, glob, 'pubspec.yaml')
      logger.debug(`Searching dart projects: ${joinedGlob}`)
      const walkEntries = std_fs.expandGlob(joinedGlob)
      for await (const walkEntry of walkEntries) {
        yield DartProject.fromPubspecFilepath(walkEntry.path)
      }
    }

    function shouldExclude(
      dartProject: DartProject,
      excludeGlobs: string[],
    ): boolean {
      return false
    }

    const projectFilepath = await findProjectFile(context.cwd)
    if (!projectFilepath) {
      throw new FpmError(`No \`${DEFAULT_PROJECT_FILENAME}\` file found`)
    }
    logger.verbose(`Found project file: ${projectFilepath}`)

    const projectYaml = parseProjectYaml(projectFilepath)
    logger.debug('projectYaml=', projectYaml)

    const projectDir = std_path.dirname(projectFilepath)
    const mainProject = DartProject.fromDirectoryPath(
      std_path.join(projectDir, projectYaml.packages.main),
    )
    logger.verbose(`Found main project: ${mainProject.path}`)

    const extraProjects: DartProject[] = []
    const excludeGlobs = asArray(projectYaml.packages.exclude)
    for (const glob of asArray(projectYaml.packages.include)) {
      for await (const dartProject of findDartProjects(projectDir, glob)) {
        if (!shouldExclude(dartProject, excludeGlobs)) {
          extraProjects.push(dartProject)
          logger.verbose(`Found dart project: ${dartProject.path}`)
        } else {
          logger.debug(`Found but excluded dart project: ${dartProject.path}`)
        }
      }
    }

    logger.debug('extraProjects=', extraProjects)

    throw new Error('Not implemented yet')
  }
}
