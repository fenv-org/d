import {
  PubDependency,
  PubspecOverridesYaml,
  PubspecYamlSchema,
} from '../../dart/mod.ts'
import { DartProject } from './dart_project.ts'

/**
 * Represents a dependency graph of dart projects.
 */
export class DependencyGraph {
  constructor(
    /**
     * All the nodes of the dependency graph.
     */
    public readonly allNodes: DependencyGraphNode[],
  ) {}

  /**
   * The root nodes of the dependency graph.
   *
   * These are the dart projects that are not dependencies of other dart and
   * these can be one or more.
   */
  get rootNodes(): DependencyGraphNode[] {
    return this.allNodes.filter((node) => node.reverseDependencies.length === 0)
  }

  /**
   * The leaf nodes of the dependency graph.
   *
   * These are the dart projects that do not depend on other dart projects and
   * these can be one or more.
   */
  get leafNodes(): DependencyGraphNode[] {
    return this.allNodes.filter((node) => node.dependencies.length === 0)
  }

  /**
   * Returns a new `DependencyGraph` instance from the given
   * {@link DartProject}.
   */
  static fromDartProjects(dartProjects: DartProject[]): DependencyGraph {
    const nodeMap: Record<string, DependencyGraphNode> = {}
    for (const dartProject of dartProjects) {
      const node = DependencyGraphNode.fromDartProject(dartProject)
      nodeMap[node.name] = node
    }
    const allManagedDependencyNames = new Set(Object.keys(nodeMap))

    function collectDistinctDependencyNames(
      ...records: Record<string, PubDependency>[]
    ): Set<string> {
      const names = new Set<string>()
      for (const record of records) {
        for (const name of Object.keys(record)) {
          if (allManagedDependencyNames.has(name)) {
            names.add(name)
          }
        }
      }
      return names
    }

    // Create the dependency graph.
    for (const dartProject of dartProjects) {
      const managedDirectDependencyNames = collectDistinctDependencyNames(
        dartProject.pubspec.dependencies ?? {},
        dartProject.pubspec.dev_dependencies ?? {},
        dartProject.pubspec.dependency_overrides ?? {},
        dartProject.pubspecOverrides?.dependency_overrides ?? {},
      )

      const currentNode = nodeMap[dartProject.name]
      for (const dependencyName of managedDirectDependencyNames) {
        currentNode.addDependency(nodeMap[dependencyName])
      }
    }
    return new DependencyGraph(Object.values(nodeMap))
  }
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
    pubspec: PubspecYamlSchema
    pubspecOverrides?: PubspecOverridesYaml
  }) {
    super(options)
    this.dependencies = []
    this.reverseDependencies = []
  }

  /**
   * The backing field for {@link dependencies}.
   */
  dependencies: DependencyGraphNode[]

  /**
   * The backing field for {@link reverseDependencies}.
   */
  reverseDependencies: DependencyGraphNode[]

  /**
   * Adds the given node as a dependency of this node.
   */
  addDependency(node: DependencyGraphNode): void {
    if (!this.dependencies.includes(node)) {
      this.dependencies.push(node)
    }
    if (!node.reverseDependencies.includes(this)) {
      node.reverseDependencies.push(this)
    }
  }

  /**
   * Constructs a new `DependencyGraphNode` instance from the given
   * {@link DartProject}.
   */
  static fromDartProject(dartProject: DartProject): DependencyGraphNode {
    return new DependencyGraphNode({
      path: dartProject.path,
      pubspecFilepath: dartProject.pubspecFilepath,
      pubspecOverridesFilepath: dartProject.pubspecOverridesFilepath,
      pubspec: { ...dartProject.pubspec },
      pubspecOverrides: { ...dartProject.pubspecOverrides },
    })
  }
}
