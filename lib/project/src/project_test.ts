import { FpmContext } from '../../context/mod.ts'
import { std_path } from '../../deps.ts'
import { assertEquals, removeIndent, touch } from '../../test_deps.ts'
import { FpmProject } from './project.ts'

const { join } = std_path

Deno.test('Test fromContext()', async (t) => {
  // setup
  const root = await Deno.makeTempDir()
  await Deno.writeTextFile(
    join(root, 'fpm.yaml'),
    removeIndent(`
      version: v0

      name: test_app

      packages:
        main: app
        include:
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
    assertEquals(actual.mainProject.path, join(root, 'app'))
    assertEquals(actual.extraProjects.length, 4)
    assertEquals(actual.extraProjects[0].path, join(root, 'app/packages/a'))
    assertEquals(actual.extraProjects[1].path, join(root, 'app/packages/b'))
    assertEquals(actual.extraProjects[2].path, join(root, 'packages/c'))
    assertEquals(actual.extraProjects[3].path, join(root, 'packages/e'))
  })

  // teardown
  await Deno.remove(root, { recursive: true })
})
