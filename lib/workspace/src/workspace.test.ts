import { Context } from 'context/mod.ts'
import { std } from 'deps.ts'
import { assert, assertEquals, fail, touch, writeYamlFile } from 'test/deps.ts'
import { Workspace } from './workspace.ts'

const { join } = std.path

Deno.test('When there is no bootstrap cache', async (t) => {
  // setup
  const root = await Deno.makeTempDir({ prefix: 'test1-' })
  await writeYamlFile(
    join(root, 'd.yaml'),
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

  await t.step(
    'Succeeds on useBootstrapCache=never',
    async () => {
      const context = Context.fromFlags({
        cwd: root,
        stdout: Deno.stdout,
        stderr: Deno.stderr,
        options: {
          verbose: true,
          debug: true,
        },
      })
      const actual = await Workspace.fromContext(context, {
        useBootstrapCache: 'never',
      })

      // verify
      assertEquals(actual.dartProjects.length, 5)
      const projectPaths = actual.dartProjects.map((project) => project.path)
      assert(projectPaths.includes(join(root, 'app')))
      assert(projectPaths.includes(join(root, 'app/packages/a')))
      assert(projectPaths.includes(join(root, 'app/packages/b')))
      assert(projectPaths.includes(join(root, 'packages/c')))
      assert(projectPaths.includes(join(root, 'packages/e')))
    },
  )

  await t.step(
    'Fails on useBootstrapCache=always',
    async () => {
      const context = Context.fromFlags({
        cwd: root,
        stdout: Deno.stdout,
        stderr: Deno.stderr,
        options: {
          verbose: true,
          debug: true,
        },
      })

      try {
        await Workspace.fromContext(context)
        fail('should throw an error')
      } catch (e) {
        assert(e.message.includes('Need to bootstrap the workspace'))
      }
    },
  )

  await t.step(
    'Succeeds on useBootstrapCache=fallbackToWorkspaceFile',
    async () => {
      const context = Context.fromFlags({
        cwd: root,
        stdout: Deno.stdout,
        stderr: Deno.stderr,
        options: {
          verbose: true,
          debug: true,
        },
      })
      const actual = await Workspace.fromContext(context, {
        useBootstrapCache: 'fallbackToWorkspaceFile',
      })

      // verify
      assertEquals(actual.dartProjects.length, 5)
      const projectPaths = actual.dartProjects.map((project) => project.path)
      assert(projectPaths.includes(join(root, 'app')))
      assert(projectPaths.includes(join(root, 'app/packages/a')))
      assert(projectPaths.includes(join(root, 'app/packages/b')))
      assert(projectPaths.includes(join(root, 'packages/c')))
      assert(projectPaths.includes(join(root, 'packages/e')))
    },
  )

  // teardown
  await Deno.remove(root, { recursive: true })
})

Deno.test('When there is bootstrap cache', async (t) => {
  // setup
  const root = await Deno.makeTempDir({ prefix: 'test2-' })
  await touch(join(root, 'd.yaml'))
  await writeYamlFile(
    join(root, '.d', 'bootstrap.yaml'),
    {
      workspaceFilepath: join(root, 'd.yaml'),
      packages: {
        test_app: {
          pubspecRelativePath: 'app/pubspec.yaml',
        },
        test_package_a: {
          pubspecRelativePath: 'app/packages/a/pubspec.yaml',
        },
        test_package_b: {
          pubspecRelativePath: 'app/packages/b/pubspec.yaml',
        },
        test_package_c: {
          pubspecRelativePath: 'packages/c/pubspec.yaml',
        },
        test_package_e: {
          pubspecRelativePath: 'packages/e/pubspec.yaml',
        },
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

  await t.step(
    'Succeeds on useBootstrapCache=never',
    async () => {
      const context = Context.fromFlags({
        cwd: root,
        stdout: Deno.stdout,
        stderr: Deno.stderr,
        options: {
          verbose: true,
          debug: true,
        },
      })

      try {
        await Workspace.fromContext(context, { useBootstrapCache: 'never' })
        fail('should throw an error')
      } catch (e) {
        assert(e.message.includes('Invalid yaml file format'))
      }
    },
  )

  await t.step(
    'Fails on useBootstrapCache=always',
    async () => {
      const context = Context.fromFlags({
        cwd: root,
        stdout: Deno.stdout,
        stderr: Deno.stderr,
        options: {
          verbose: true,
          debug: true,
        },
      })
      const actual = await Workspace.fromContext(context, {
        useBootstrapCache: 'always',
      })

      // verify
      assertEquals(actual.dartProjects.length, 5)
      const projectPaths = actual.dartProjects.map((project) => project.path)
      assert(projectPaths.includes(join(root, 'app')))
      assert(projectPaths.includes(join(root, 'app/packages/a')))
      assert(projectPaths.includes(join(root, 'app/packages/b')))
      assert(projectPaths.includes(join(root, 'packages/c')))
      assert(projectPaths.includes(join(root, 'packages/e')))
    },
  )

  await t.step(
    'Succeeds on useBootstrapCache=fallbackToWorkspaceFile',
    async () => {
      const context = Context.fromFlags({
        cwd: root,
        stdout: Deno.stdout,
        stderr: Deno.stderr,
        options: {
          verbose: true,
          debug: true,
        },
      })
      const actual = await Workspace.fromContext(context, {
        useBootstrapCache: 'fallbackToWorkspaceFile',
      })

      // verify
      assertEquals(actual.dartProjects.length, 5)
      const projectPaths = actual.dartProjects.map((project) => project.path)
      assert(projectPaths.includes(join(root, 'app')))
      assert(projectPaths.includes(join(root, 'app/packages/a')))
      assert(projectPaths.includes(join(root, 'app/packages/b')))
      assert(projectPaths.includes(join(root, 'packages/c')))
      assert(projectPaths.includes(join(root, 'packages/e')))
    },
  )

  // teardown
  await Deno.remove(root, { recursive: true })
})

Deno.test('Fail to build `Workspace` because of incompatible version', async (t) => {
  // setup
  const root = await Deno.makeTempDir({ prefix: 'test3-' })
  await writeYamlFile(
    join(root, 'd.yaml'),
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

  await t.step(
    'call Workspace.fromContext() with useBootstrapCache=never',
    async () => {
      const context = Context.fromFlags({
        cwd: root,
        stdout: Deno.stdout,
        stderr: Deno.stderr,
        options: {
          verbose: true,
          debug: true,
        },
      })

      try {
        await Workspace.fromContext(context, { useBootstrapCache: 'never' })
        fail('should throw an error')
      } catch (e) {
        assert(e.message.includes('Not compatible version'))
      }
    },
  )

  // teardown
  await Deno.remove(root, { recursive: true })
})
