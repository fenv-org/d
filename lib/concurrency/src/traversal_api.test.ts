import { DartProject, DependencyGraph, PubDependency } from 'dart/mod.ts'
import { cliffy, std } from 'deps.ts'
import { assertEquals, fail } from 'test/deps.ts'
import { Traversal, VisitResult } from './traversal_api.ts'

const { deferred } = std.async

Deno.test('traversal_api', async (t) => {
  // setup: https://i.stack.imgur.com/zuLmn.png
  const projects = [
    dartProjectOf({ id: 0 }),
    dartProjectOf({ id: 1 }),
    dartProjectOf({ id: 2, deps: [1] }),
    dartProjectOf({ id: 3 }),
    dartProjectOf({ id: 4 }),
    dartProjectOf({ id: 5 }),
    dartProjectOf({ id: 6, deps: [3, 5] }),
    dartProjectOf({ id: 7, deps: [0, 4, 5] }),
    dartProjectOf({ id: 8, deps: [3] }),
    dartProjectOf({ id: 9, deps: [1, 3, 5] }),
    dartProjectOf({ id: 10, deps: [0, 2, 5] }),
    dartProjectOf({ id: 11, deps: [3, 9] }),
    dartProjectOf({ id: 12, deps: [2] }),
    dartProjectOf({ id: 13, deps: [0, 1, 2] }),
    dartProjectOf({ id: 14, deps: [0, 2, 7, 9, 10] }),
    dartProjectOf({ id: 15, deps: [6, 8] }),
  ]

  await t.step('traverse with concurrency 1', async () => {
    // setup
    const graph = DependencyGraph.fromDartProjects(projects)
    const visitMap: Record<number, std.async.Deferred<boolean>> = {}
    const waitMap: Record<number, std.async.Deferred<void>> = {}
    for (let i = 0; i < projects.length; i++) {
      waitMap[i] = deferred<void>()
    }
    const log: string[] = []
    const traversal = Traversal.fromDependencyGraph(graph, {
      onVisit: (projectName) =>
        onVisit({ visitMap, waitMap, log, projectName }),
      concurrency: 1,
    })

    // execution
    const promise = traversal.start()
    await waitAndGo(
      {
        visitMap,
        waitMap,
      },
      0,
      1,
      3,
      4,
      5,
      2,
      8,
      6,
      7,
      9,
      10,
      12,
      13,
      15,
      11,
      14,
    )

    // validation
    await promise
    assertEquals(log, [
      '[project_0]: enter',
      '[project_0]: exit with continue',
      '[project_1]: enter',
      '[project_1]: exit with continue',
      '[project_3]: enter',
      '[project_3]: exit with continue',
      '[project_4]: enter',
      '[project_4]: exit with continue',
      '[project_5]: enter',
      '[project_5]: exit with continue',
      '[project_2]: enter',
      '[project_2]: exit with continue',
      '[project_8]: enter',
      '[project_8]: exit with continue',
      '[project_6]: enter',
      '[project_6]: exit with continue',
      '[project_7]: enter',
      '[project_7]: exit with continue',
      '[project_9]: enter',
      '[project_9]: exit with continue',
      '[project_10]: enter',
      '[project_10]: exit with continue',
      '[project_12]: enter',
      '[project_12]: exit with continue',
      '[project_13]: enter',
      '[project_13]: exit with continue',
      '[project_15]: enter',
      '[project_15]: exit with continue',
      '[project_11]: enter',
      '[project_11]: exit with continue',
      '[project_14]: enter',
      '[project_14]: exit with continue',
    ])
  })

  await t.step('traverse with concurrency 1: stop on node 8', async () => {
    // setup
    const graph = DependencyGraph.fromDartProjects(projects)
    const visitMap: Record<number, std.async.Deferred<boolean>> = {}
    const waitMap: Record<number, std.async.Deferred<void>> = {}
    for (let i = 0; i < projects.length; i++) {
      waitMap[i] = deferred<void>()
    }
    const log: string[] = []
    const traversal = Traversal.fromDependencyGraph(graph, {
      onVisit: (projectName) =>
        onVisit({ visitMap, waitMap, log, projectName }),
      concurrency: 1,
    })

    // execution
    const promise = traversal.start()
    await waitAndGo(
      {
        visitMap,
        waitMap,
        stopOn: 8,
      },
      0,
      1,
      3,
      4,
      5,
      2,
      8,
      6,
      7,
      9,
      10,
      12,
      13,
      15,
      11,
      14,
    )

    // validation
    try {
      await promise
      fail()
    } catch (error) {
      assertEquals(error, 1)
    }
    assertEquals(log, [
      '[project_0]: enter',
      '[project_0]: exit with continue',
      '[project_1]: enter',
      '[project_1]: exit with continue',
      '[project_3]: enter',
      '[project_3]: exit with continue',
      '[project_4]: enter',
      '[project_4]: exit with continue',
      '[project_5]: enter',
      '[project_5]: exit with continue',
      '[project_2]: enter',
      '[project_2]: exit with continue',
      '[project_8]: enter',
      '[project_8]: exit with stop',
    ])
  })

  await t.step('traverse with concurrency 5', async () => {
    // setup
    const graph = DependencyGraph.fromDartProjects(projects)
    const visitMap: Record<number, std.async.Deferred<boolean>> = {}
    const waitMap: Record<number, std.async.Deferred<void>> = {}
    for (let i = 0; i < projects.length; i++) {
      waitMap[i] = deferred<void>()
    }
    const log: string[] = []
    const traversal = Traversal.fromDependencyGraph(graph, {
      onVisit: (projectName) =>
        onVisit({ visitMap, waitMap, log, projectName }),
    })

    // execution
    const promise = traversal.start()
    await waitAndGo(
      {
        visitMap,
        waitMap,
      },
      0,
      1,
      3,
      4,
      5,
      2,
      8,
      6,
      7,
      9,
      10,
      12,
      13,
      15,
      11,
      14,
    )

    // validation
    await promise
    assertEquals(log, [
      '[project_0]: enter', // remaining: 4
      '[project_1]: enter', // remaining: 3
      '[project_3]: enter', // remaining: 2
      '[project_4]: enter', // remaining: 1
      '[project_5]: enter', // remaining: 0
      '[project_0]: exit with continue', // remaining: 1
      '[project_1]: exit with continue', // remaining: 2
      '[project_2]: enter', // remaining: 1
      '[project_3]: exit with continue', // remaining: 2
      '[project_8]: enter', // remaining: 1
      '[project_4]: exit with continue', // remaining: 2
      '[project_5]: exit with continue', // remaining: 3
      '[project_6]: enter', // remaining: 2
      '[project_7]: enter', // remaining: 1
      '[project_9]: enter', // remaining: 0
      '[project_2]: exit with continue', // remaining: 1
      '[project_10]: enter', // remaining: 0
      '[project_8]: exit with continue', // remaining: 1
      '[project_12]: enter', // remaining: 0
      '[project_6]: exit with continue', // remaining: 1
      '[project_13]: enter', // remaining: 0
      '[project_7]: exit with continue', // remaining: 1
      '[project_15]: enter', // remaining: 0
      '[project_9]: exit with continue', // remaining: 1
      '[project_11]: enter', // remaining: 0
      '[project_10]: exit with continue', // remaining: 1
      '[project_14]: enter', // remaining: 0
      '[project_12]: exit with continue', // remaining: 1
      '[project_13]: exit with continue', // remaining: 2
      '[project_15]: exit with continue', // remaining: 3
      '[project_11]: exit with continue', // remaining: 4
      '[project_14]: exit with continue', // remaining: 5
    ])
  })

  await t.step('traverse with concurrency 5: stop on node 8', async () => {
    // setup
    const graph = DependencyGraph.fromDartProjects(projects)
    const visitMap: Record<number, std.async.Deferred<boolean>> = {}
    const waitMap: Record<number, std.async.Deferred<void>> = {}
    for (let i = 0; i < projects.length; i++) {
      waitMap[i] = deferred<void>()
    }
    const log: string[] = []
    const traversal = Traversal.fromDependencyGraph(graph, {
      onVisit: (projectName) =>
        onVisit({ visitMap, waitMap, log, projectName }),
    })

    // execution
    const promise = traversal.start()
    await waitAndGo(
      {
        visitMap,
        waitMap,
        stopOn: 8,
      },
      0,
      1,
      3,
      4,
      5,
      2,
      8,
    )

    // finalizes the traversal
    await waitMap[6]
    visitMap[6].resolve(true)
    await waitMap[7]
    visitMap[7].resolve(true)
    await waitMap[9]
    visitMap[9].resolve(true)
    await waitMap[10]
    visitMap[10].resolve(true)

    // validation
    await promise
    assertEquals(log, [
      '[project_0]: enter', // remaining: 4
      '[project_1]: enter', // remaining: 3
      '[project_3]: enter', // remaining: 2
      '[project_4]: enter', // remaining: 1
      '[project_5]: enter', // remaining: 0
      '[project_0]: exit with continue', // remaining: 1
      '[project_1]: exit with continue', // remaining: 2
      '[project_2]: enter', // remaining: 1
      '[project_3]: exit with continue', // remaining: 2
      '[project_8]: enter', // remaining: 1
      '[project_4]: exit with continue', // remaining: 2
      '[project_5]: exit with continue', // remaining: 3
      '[project_6]: enter', // remaining: 2
      '[project_7]: enter', // remaining: 1
      '[project_9]: enter', // remaining: 0
      '[project_2]: exit with continue', // remaining: 1
      '[project_10]: enter', // remaining: 0
      '[project_8]: exit with stop', // remaining: 1
      '[project_6]: exit with continue', // remaining: 2
      '[project_7]: exit with continue', // remaining: 3
      '[project_9]: exit with continue', // remaining: 4
      '[project_10]: exit with continue', // remaining: 5
    ])
  })
})

function dartProjectOf(option: {
  id: number
  deps?: number[]
}): DartProject {
  const name = `project_${option.id}`
  return new DartProject({
    path: std.path.join('package', name),
    pubspecFilepath: std.path.join('package', name, 'pubspec.yaml'),
    pubspec: {
      name,
      version: '1.0.0',
      dependencies: (option.deps ?? []).reduce((acc, id) => {
        acc[`project_${id}`] = {}
        return acc
      }, {} as Record<string, PubDependency>),
    },
  })
}

async function onVisit(option: {
  visitMap: Record<number, std.async.Deferred<boolean>>
  waitMap: Record<number, std.async.Deferred<void>>
  log: string[]
  projectName: string
}): Promise<VisitResult> {
  const { visitMap, waitMap, log, projectName } = option
  const id = parseInt(projectName.replace('project_', ''))
  visitMap[id] = deferred<boolean>()
  waitMap[id].resolve()
  log.push(`[${projectName}]: enter`)
  console.log(cliffy.ansi.colors.brightRed(`[${projectName}]`), 'enter')
  if (await visitMap[id]) {
    log.push(`[${projectName}]: exit with continue`)
    console.log(
      cliffy.ansi.colors.brightRed(`[${projectName}]`),
      'exit with continue',
    )
    return { kind: 'continue' }
  } else {
    log.push(`[${projectName}]: exit with stop`)
    console.log(
      cliffy.ansi.colors.brightRed(`[${projectName}]`),
      'exit with stop',
    )
    return { kind: 'stop', code: 1 }
  }
}

async function waitAndGo(
  options: {
    visitMap: Record<number, std.async.Deferred<boolean>>
    waitMap: Record<number, std.async.Deferred<void>>
    stopOn?: number
  },
  ...ids: number[]
) {
  for (const id of ids) {
    console.log(cliffy.ansi.colors.brightCyan(`[wait]`), id)
    await options.waitMap[id]
    console.log(cliffy.ansi.colors.brightCyan(`[go]`), id)
    if (id in options.visitMap) {
      if (options.stopOn === id) {
        console.log(cliffy.ansi.colors.brightCyan(`[stop]`), id)
        options.visitMap[id].resolve(false)
        break
      } else {
        console.log(cliffy.ansi.colors.brightCyan(`[continue]`), id)
        options.visitMap[id].resolve(true)
      }
    }
  }
}
