import { DartProject } from 'dart/mod.ts'
import { assertEquals, fail } from 'test/deps.ts'
import { applyDependencyFilterOptions } from './apply_dependency_filter.ts'

Deno.test('applyDependencyFilterOptions', async (t) => {
  // setup
  const project1: DartProject = {
    path: 'test-resources/sample_package_1',
    pubspecFilepath: '',
    pubspec: {
      name: 'sample_package_1',
      version: '1.0.0',
    },
    pubspecOverridesFilepath: undefined,
    pubspecOverrides: undefined,
    name: 'sample_package_1',
  }
  const project2: DartProject = {
    path: 'test-resources/sample_package_2',
    pubspecFilepath: '',
    pubspec: {
      name: 'sample_package_2',
      version: '1.0.0',
    },
    pubspecOverridesFilepath: undefined,
    pubspecOverrides: undefined,
    name: 'sample_package_2',
  }
  const dartProjects = [project1, project2]

  await t.step('when no options are given', async () => {
    const actual = await applyDependencyFilterOptions(dartProjects, {})
    assertEquals(
      actual.map((it) => it.name),
      ['sample_package_1', 'sample_package_2'],
    )
  })

  await t.step(
    'includes packages that has dependency on go_router',
    async () => {
      const actual = await applyDependencyFilterOptions(dartProjects, {
        includeDependency: ['go_router'],
      })
      assertEquals(actual.map((it) => it.name), [
        'sample_package_1',
        'sample_package_2',
      ])
    },
  )

  await t.step(
    'includes packages that has dependency on shelf and has direct dependency on result',
    async () => {
      const actual = await applyDependencyFilterOptions(dartProjects, {
        includeDependency: ['shelf'],
        includeDirectDependency: ['result'],
      })
      assertEquals(actual.map((it) => it.name), ['sample_package_1'])
    },
  )

  await t.step(
    'includes packages that has dependency on go_router ' +
      'but not direct dependency on go_router',
    async () => {
      const actual = await applyDependencyFilterOptions(dartProjects, {
        includeDependency: ['go_router'],
        excludeDirectDependency: ['go_router'],
      })
      assertEquals(actual.map((it) => it.name), ['sample_package_1'])
    },
  )

  await t.step(
    'includes packages that has dev dependency on build_runner',
    async () => {
      const actual = await applyDependencyFilterOptions(dartProjects, {
        includeDevDependency: ['build_runner'],
      })
      assertEquals(actual.map((it) => it.name), ['sample_package_1'])
    },
  )

  await t.step(
    'excludes packages that has dependency on xml',
    async () => {
      const actual = await applyDependencyFilterOptions(dartProjects, {
        excludeDependency: ['xml'],
      })
      assertEquals(actual.map((it) => it.name), ['sample_package_2'])
    },
  )

  await t.step(
    'exclude packages that has dev dependency on build_runner',
    async () => {
      const actual = await applyDependencyFilterOptions(dartProjects, {
        excludeDevDependency: ['build_runner'],
      })
      assertEquals(actual.map((it) => it.name), ['sample_package_2'])
    },
  )

  await t.step(
    'includes packages that has dev dependency on build_runner and ' +
      'exclude packages that has dev dependency on build_runner',
    async () => {
      const actual = await applyDependencyFilterOptions(dartProjects, {
        includeDevDependency: ['build_runner'],
        excludeDevDependency: ['build_runner'],
      })
      assertEquals(actual.map((it) => it.name), [])
    },
  )

  await t.step(
    'includes packages that has direct dependency on fake_async',
    async () => {
      const actual = await applyDependencyFilterOptions(dartProjects, {
        includeDirectDependency: ['fake_async'],
      })
      assertEquals(actual.map((it) => it.name), ['sample_package_1'])
    },
  )
})

Deno.test('Fails when pubspec.lock is not found', async () => {
  const project: DartProject = {
    path: 'non-existing-path',
    pubspecFilepath: '',
    pubspec: {
      name: 'sample_package_1',
      version: '1.0.0',
    },
    pubspecOverridesFilepath: undefined,
    pubspecOverrides: undefined,
    name: 'sample_package_1',
  }

  try {
    await applyDependencyFilterOptions([project], {
      includeDependency: ['go_router'],
    })
    fail('Should have failed')
  } catch (e) {
    assertEquals(e.message, 'pubspec.lock not found in non-existing-path')
  }
})
