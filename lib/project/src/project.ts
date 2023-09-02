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
}
