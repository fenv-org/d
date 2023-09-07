import { DartProject } from './dart_project.ts'
import { PubDependency } from './pub_dependency.ts'

/**
 * Represents a dependency graph of dart projects.
 */
export class DependencyGraph {
  constructor(
    /**
     * All the nodes of the dependency graph.
     */
    public readonly projects: DartProject[],
    /**
     * A map of project names to their dependencies.
     */
    public readonly edges: DependencyEdges,
    /**
     * A map of project names to their reversed-direction dependencies.
     */
    public readonly reverseEdges: DependencyEdges,
  ) {}

  /**
   * The root nodes of the dependency graph.
   *
   * These are the dart projects that are not dependencies of other dart and
   * these can be one or more.
   */
  get roots(): DartProject[] {
    return this.projects.filter((node) => !(node.name in this.reverseEdges))
  }

  /**
   * The leaf nodes of the dependency graph.
   *
   * These are the dart projects that do not depend on other dart projects and
   * these can be one or more.
   */
  get leaves(): DartProject[] {
    return this.projects.filter((node) => !(node.name in this.edges))
  }

  /**
   * Returns the dependencies of the given {@link DartProject}.
   */
  dependenciesOf(project: DartProject): readonly DartProject[] {
    return this.edges[project.name] ?? []
  }

  /**
   * Returns the dependents of the given {@link DartProject}.
   */
  dependentsOf(project: DartProject): readonly DartProject[] {
    return this.reverseEdges[project.name] ?? []
  }

  /**
   * Returns a new `DependencyGraph` instance from the given
   * {@link DartProject}.
   */
  static fromDartProjects(dartProjects: DartProject[]): DependencyGraph {
    const nodeMap: Record<string, DartProject> = {}
    for (const dartProject of dartProjects) {
      nodeMap[dartProject.name] = dartProject
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
    const edges: Record<string, DartProject[]> = {}
    const reverseEdges: Record<string, DartProject[]> = {}
    for (const dartProject of dartProjects) {
      const managedDirectDependencyNames = collectDistinctDependencyNames(
        dartProject.pubspec.dependencies ?? {},
        dartProject.pubspec.dev_dependencies ?? {},
        dartProject.pubspec.dependency_overrides ?? {},
        dartProject.pubspecOverrides?.dependency_overrides ?? {},
      )

      for (const dependencyName of managedDirectDependencyNames) {
        const dependencyNode = nodeMap[dependencyName]
        if (!(dartProject.name in edges)) {
          edges[dartProject.name] = []
        }
        if (!(dependencyNode.name in reverseEdges)) {
          reverseEdges[dependencyNode.name] = []
        }
        edges[dartProject.name].push(dependencyNode)
        reverseEdges[dependencyNode.name].push(dartProject)
      }
    }

    return new DependencyGraph(
      [...dartProjects],
      { ...edges },
      { ...reverseEdges },
    )
  }
}

/**
 * Mappings of project names to their dependencies.
 */
export interface DependencyEdges {
  readonly [projectName: string]: readonly DartProject[]
}
