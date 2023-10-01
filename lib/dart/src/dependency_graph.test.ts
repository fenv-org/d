import { assertEquals } from 'test/deps.ts'
import { DartProject } from './dart_project.ts'
import { DependencyGraph } from './dependency_graph.ts'

function assertContents<T>(
  actual: readonly T[],
  expected: readonly T[],
  message?: string,
): void {
  assertEquals(
    new Set(actual),
    new Set(expected),
    message,
  )
}

Deno.test('Acyclic dependency graph', async (t) => {
  // setup
  const projects = [
    new DartProject({
      path: '/path/to/project0',
      pubspecFilepath: '/path/to/project0/pubspec.yaml',
      pubspec: {
        name: 'project0',
        version: '1.0.0',
      },
    }),
    new DartProject({
      path: '/path/to/project1',
      pubspecFilepath: '/path/to/project1/pubspec.yaml',
      pubspec: {
        name: 'project1',
        version: '1.0.0',
      },
    }),
    new DartProject({
      path: '/path/to/project2',
      pubspecFilepath: '/path/to/project2/pubspec.yaml',
      pubspec: {
        name: 'project2',
        version: '1.0.0',
        dependencies: {
          project3: {},
        },
      },
    }),
    new DartProject({
      path: '/path/to/project3',
      pubspecFilepath: '/path/to/project3/pubspec.yaml',
      pubspec: {
        name: 'project3',
        version: '1.0.0',
        dev_dependencies: {
          project1: {},
        },
      },
    }),
    new DartProject({
      path: '/path/to/project4',
      pubspecFilepath: '/path/to/project4/pubspec.yaml',
      pubspecOverridesFilepath: '/path/to/project4/pubspec_overrides.yaml',
      pubspec: {
        name: 'project4',
        version: '1.0.0',
        dependencies: {
          project0: {},
        },
        dev_dependencies: {
          project1: {},
        },
        dependency_overrides: {
          // this should be ignored
          project2: 'any',
        },
      },
      pubspecOverrides: {
        dependency_overrides: {
          project0: 'any',
        },
      },
    }),
    new DartProject({
      path: '/path/to/project5',
      pubspecFilepath: '/path/to/project5/pubspec.yaml',
      pubspec: {
        name: 'project5',
        version: '1.0.0',
        dependencies: {
          project0: {},
        },
        dev_dependencies: {
          project2: {},
        },
      },
    }),
  ]

  await t.step('check edges', () => {
    const graph = DependencyGraph.fromDartProjects(projects)
    assertEquals(graph.projects.length, 6)
    assertContents(graph.dependenciesOf(projects[0]), [], 'project0')
    assertContents(graph.dependenciesOf(projects[1]), [], 'project1')
    assertContents(graph.dependenciesOf(projects[2]), [projects[3]], 'project2')
    assertContents(graph.dependenciesOf(projects[3]), [projects[1]], 'project3')
    assertContents(graph.dependenciesOf(projects[4]), [
      projects[0],
      projects[1],
    ], 'project4')
    assertContents(graph.dependenciesOf(projects[5]), [
      projects[0],
      projects[2],
    ], 'project5')
  })

  await t.step('check reverse edges', () => {
    const graph = DependencyGraph.fromDartProjects(projects)
    assertEquals(graph.projects.length, 6)
    assertContents(graph.dependentsOf(projects[0]), [
      projects[4],
      projects[5],
    ], 'project0')
    assertContents(graph.dependentsOf(projects[1]), [
      projects[3],
      projects[4],
    ], 'project1')
    assertContents(graph.dependentsOf(projects[2]), [projects[5]], 'project2')
    assertContents(graph.dependentsOf(projects[3]), [projects[2]], 'project3')
    assertContents(graph.dependentsOf(projects[4]), [], 'project4')
    assertContents(graph.dependentsOf(projects[5]), [], 'project5')
  })

  await t.step('hasCycle should return false', () => {
    const graph = DependencyGraph.fromDartProjects(projects)
    assertEquals(graph.hasCycle(), false)
  })

  await t.step('verify roots', () => {
    const graph = DependencyGraph.fromDartProjects(projects)
    assertEquals(graph.roots.length, 2)
    assertContents(graph.roots, [projects[4], projects[5]])
  })

  await t.step('verify leaves', () => {
    const graph = DependencyGraph.fromDartProjects(projects)
    assertEquals(graph.leaves.length, 2)
    assertContents(graph.leaves, [projects[0], projects[1]])
  })
})

Deno.test('Cyclic dependency graph', async (t) => {
  // setup
  const projects = [
    new DartProject({
      path: '/path/to/project0',
      pubspecFilepath: '/path/to/project0/pubspec.yaml',
      pubspecOverridesFilepath: '/path/to/project0/pubspec_overrides.yaml',
      pubspec: {
        name: 'project0',
        version: '1.0.0',
        dependencies: {
          project1: {},
        },
        dev_dependencies: {
          project2: {},
        },
      },
      pubspecOverrides: {
        dependency_overrides: {
          project2: 'any',
        },
      },
    }),
    new DartProject({
      path: '/path/to/project1',
      pubspecFilepath: '/path/to/project1/pubspec.yaml',
      pubspec: {
        name: 'project1',
        version: '1.0.0',
        dev_dependencies: {
          project2: 'any',
        },
      },
    }),
    new DartProject({
      path: '/path/to/project2',
      pubspecFilepath: '/path/to/project2/pubspec.yaml',
      pubspec: {
        name: 'project2',
        version: '1.0.0',
        dependencies: {
          project0: 'any',
          project3: 'any',
        },
      },
    }),
    new DartProject({
      path: '/path/to/project3',
      pubspecFilepath: '/path/to/project3/pubspec.yaml',
      pubspec: {
        name: 'project3',
        version: '1.0.0',
      },
    }),
  ]

  await t.step('check edges', () => {
    const graph = DependencyGraph.fromDartProjects(projects)
    assertEquals(graph.projects.length, 4)
    assertContents(graph.dependenciesOf(projects[0]), [
      projects[1],
      projects[2],
    ], 'project0')
    assertContents(graph.dependenciesOf(projects[1]), [projects[2]], 'project1')
    assertContents(graph.dependenciesOf(projects[2]), [
      projects[1],
      projects[3],
    ], 'project2')
    assertContents(graph.dependenciesOf(projects[3]), [], 'project3')
  })

  await t.step('check reverse edges', () => {
    const graph = DependencyGraph.fromDartProjects(projects)
    assertEquals(graph.projects.length, 4)
    assertContents(graph.dependentsOf(projects[0]), [projects[2]], 'project0')
    assertContents(graph.dependentsOf(projects[1]), [projects[0]], 'project1')
    assertContents(graph.dependentsOf(projects[2]), [
      projects[0],
      projects[1],
    ], 'project2')
    assertContents(graph.dependentsOf(projects[3]), [projects[2]], 'project3')
  })

  await t.step('hasCycle should return true', () => {
    const graph = DependencyGraph.fromDartProjects(projects)
    assertEquals(graph.hasCycle(), true)
  })
})
