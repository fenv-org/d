import { FpmContext } from '../../context/mod.ts'
import { std_path } from '../../deps.ts'
import { assert, assertEquals, fail, writeYamlFile } from '../../test_deps.ts'
import { FpmProject } from './project.ts'

const { join } = std_path

Deno.test('Build `FpmProject` successfully', async (t) => {
  // setup
  const root = await Deno.makeTempDir()
  await writeYamlFile(
    join(root, 'fpm.yaml'),
    {
      version: 'v0',
      name: 'test_app',
      packages: {
        include: [
          'app',
          'app/packages/**',
          'packages/**',
        ],
        exclude: [
          '*example*',
          'd',
        ],
      },
    },
  )
  await writeYamlFile(
    join(root, 'app/pubspec.yaml'),
    { name: 'test_app' },
  )
  await writeYamlFile(
    join(root, 'app/packages/a/pubspec.yaml'),
    { name: 'test_package_a' },
  )
  await writeYamlFile(
    join(root, 'app/packages/b/pubspec.yaml'),
    { name: 'test_package_b' },
  )
  await writeYamlFile(
    join(root, 'app/packages/b/example/pubspec.yaml'),
    { name: 'test_package_b_example' },
  )
  await writeYamlFile(
    join(root, 'packages/c/pubspec.yaml'),
    { name: 'test_package_c' },
  )
  await writeYamlFile(
    join(root, 'packages/d/pubspec.yaml'),
    { name: 'test_package_d' },
  )
  await writeYamlFile(
    join(root, 'packages/e/pubspec.yaml'),
    { name: 'test_package_e' },
  )
  await writeYamlFile(
    join(root, 'packages/e/example/pubspec.yaml'),
    { name: 'test_package_e_example' },
  )

  await t.step('call FpmProject.fromContext()', async () => {
    const context = FpmContext.fromFlags({
      cwd: root,
      verbose: true,
      debug: true,
    })
    const actual = await FpmProject.fromContext(context)

    // verify
    assertEquals(actual.dartProjects.length, 5)
    const projectPaths = actual.dartProjects.map((project) => project.path)
    assert(projectPaths.includes(join(root, 'app')))
    assert(projectPaths.includes(join(root, 'app/packages/a')))
    assert(projectPaths.includes(join(root, 'app/packages/b')))
    assert(projectPaths.includes(join(root, 'packages/c')))
    assert(projectPaths.includes(join(root, 'packages/e')))
  })

  // teardown
  await Deno.remove(root, { recursive: true })
})

Deno.test('Fail to build `FpmProject` because of incompatible version', async (t) => {
  // setup
  const root = await Deno.makeTempDir()
  await writeYamlFile(
    join(root, 'fpm.yaml'),
    {
      version: 'v1',
      name: 'test_app',
      packages: {
        include: [
          'app',
          'app/packages/**',
          'packages/**',
        ],
        exclude: [
          '*example*',
          'd',
        ],
      },
    },
  )

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
