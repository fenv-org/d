import { FpmContext } from '../../context/mod.ts'
import { std_path } from '../../deps.ts'
import {
  assert,
  assertEquals,
  fail,
  removeIndent,
  touch,
} from '../../test_deps.ts'
import { FpmProject } from './project.ts'

const { join } = std_path

Deno.test('Build `FpmProject` successfully', async (t) => {
  // setup
  const root = await Deno.makeTempDir()
  await Deno.writeTextFile(
    join(root, 'fpm.yaml'),
    removeIndent(`
      version: v0

      name: test_app

      packages:
        include:
          - app
          - app/packages/**
          - packages/**
        exclude:
          - "*example*"
          - "d"
    `),
  )
  await touch(join(root, 'app/pubspec.yaml'))
  await touch(join(root, 'app/packages/a/pubspec.yaml'))
  await touch(join(root, 'app/packages/b/pubspec.yaml'))
  await touch(join(root, 'app/packages/b/example/pubspec.yaml'))
  await touch(join(root, 'packages/c/pubspec.yaml'))
  await touch(join(root, 'packages/d/pubspec.yaml'))
  await touch(join(root, 'packages/e/pubspec.yaml'))
  await touch(join(root, 'packages/e/example/pubspec.yaml'))

  await t.step('call FpmProject.fromContext()', async () => {
    const context = FpmContext.fromFlags({
      cwd: root,
      verbose: true,
      debug: true,
    })
    const actual = await FpmProject.fromContext(context)

    // verify
    assertEquals(actual.dartProjects.length, 5)
    assertEquals(actual.dartProjects[0].path, join(root, 'app'))
    assertEquals(actual.dartProjects[1].path, join(root, 'app/packages/a'))
    assertEquals(actual.dartProjects[2].path, join(root, 'app/packages/b'))
    assertEquals(actual.dartProjects[3].path, join(root, 'packages/c'))
    assertEquals(actual.dartProjects[4].path, join(root, 'packages/e'))
  })

  // teardown
  await Deno.remove(root, { recursive: true })
})

Deno.test('Fail to build `FpmProject` because of incompatible version', async (t) => {
  // setup
  const root = await Deno.makeTempDir()
  await Deno.writeTextFile(
    join(root, 'fpm.yaml'),
    removeIndent(`
      version: v1

      name: test_app

      packages:
        include:
          - app
          - app/packages/**
          - packages/**
        exclude:
          - "*example*"
          - "d"
    `),
  )
  await touch(join(root, 'app/pubspec.yaml'))
  await touch(join(root, 'app/packages/a/pubspec.yaml'))
  await touch(join(root, 'app/packages/b/pubspec.yaml'))
  await touch(join(root, 'app/packages/b/example/pubspec.yaml'))
  await touch(join(root, 'packages/c/pubspec.yaml'))
  await touch(join(root, 'packages/d/pubspec.yaml'))
  await touch(join(root, 'packages/e/pubspec.yaml'))
  await touch(join(root, 'packages/e/example/pubspec.yaml'))

  await t.step('call FpmProject.fromContext()', async () => {
    const context = FpmContext.fromFlags({
      cwd: root,
      verbose: true,
      debug: true,
    })

    try {
      await FpmProject.fromContext(context)
      fail('should throw an error')
    } catch (e) {
      assert(e.message.includes('Not compatible version'))
    }
  })

  // teardown
  await Deno.remove(root, { recursive: true })
})
