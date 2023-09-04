import { DartProject } from './dart_project.ts'

/**
 * Represents a dependency graph of dart projects.
 */
export class DependencyGraph {
  constructor(
    /**
     * The root nodes of the dependency graph.
     *
     * These are the dart projects that are not dependencies of other dart and
     * these can be one or more.
     */
    public readonly rootNodes: DependencyGraphNode[],
  ) {}
}

/**
 * Represents a node in a dependency graph of dart projects.
 *
 * This class extends `DartProject` to add a list of dependencies.
 */
export class DependencyGraphNode extends DartProject {
  constructor(options: {
    path: string
    pubspecFilepath: string
    pubspecOverridesFilepath?: string
    name: string
    dependencies: DependencyGraphNode[]
  }) {
    super(options)
    this.name = options.name
    this.dependencies = options.dependencies
  }

  /**
   * The name of the dart project.
   */
  readonly name: string

  /**
   * The dependencies of the dart project.
   */
  readonly dependencies: DependencyGraphNode[]
}
