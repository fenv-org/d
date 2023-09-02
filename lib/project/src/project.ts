import { FpmContext } from '../../context/mod.ts'
import { std_fs, std_path } from '../../deps.ts'
import { FpmError } from '../../error/mod.ts'

/**
 * A class that represents the main project managed by `fpm`.
 *
 * The main project is a Flutter project that contains `fpm.yaml`.
 */
export class FpmProject {
  constructor(
    /**
     * The absolute path of the main project.
     */
    public path: string,
    /**
     * The absolute path of the `pubspec.yaml` file of the main project.
     */
    public pubspecFilepath: string,
    /**
     * The absolute path of the `fpm.yaml` file of the main project.
     */
    public projectFilepath: string,
  ) {
  }

  static async fromContext(context: FpmContext): Promise<FpmProject> {
    const DEFAULT_PROJECT_FILENAME = 'fpm.yaml'

    function findProjectFile(path: string): string | undefined {
      if (std_fs.existsSync(std_path.join(path, DEFAULT_PROJECT_FILENAME))) {
        return std_path.join(path, DEFAULT_PROJECT_FILENAME)
      }
      const parent = std_path.dirname(path)
      if (parent === path) {
        return undefined
      }
      return findProjectFile(parent)
    }

    const projectFilepath = findProjectFile(context.pwd)
    if (!projectFilepath) {
      throw new FpmError(`No \`${DEFAULT_PROJECT_FILENAME}\` file found`)
    }

    context.logger.verbose(`Found project file: ${projectFilepath}`)

    throw new Error('Not implemented yet')
  }
}
