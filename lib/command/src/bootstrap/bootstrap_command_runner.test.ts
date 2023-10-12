import { std } from 'deps.ts'
import { DError } from 'error/mod.ts'
import {
  assert,
  assertEquals,
  assertFileExists,
  assertFileNotExists,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('Bootstrapping', async (t) => {
  // Run bootstrap
  await t.step('Run bootstrap', async () => {
    await removeGarbages()
    await dMain([
      'bootstrap',
      '--include-has-file',
      'pubspec.yaml',
      '--exclude-has-file',
      '**/non-existent-file',
      '--include-has-dir',
      'lib',
      '--exclude-has-dir',
      '**/non-existent-dir',
      '--verbose',
      '--debug',
    ], {
      cwd: 'test-sample',
      stdout: Deno.stdout,
      stderr: Deno.stderr,
      colorSupported: true,
    })

    assertFileExists('test-sample/app/pubspec.lock')
    assertFileExists('test-sample/app/packages/pack-e/pubspec.lock')
    assertFileExists('test-sample/packages/pack-a/pubspec.lock')
    assertFileExists('test-sample/packages/pack-b/pubspec.lock')
    assertFileExists('test-sample/packages/pack-c/pubspec.lock')
    assertFileExists('test-sample/packages/pack-d/pubspec.lock')

    assertEquals(
      readYaml('test-sample/app/pubspec_overrides.yaml'),
      {
        dependency_overrides: {
          fpm_sample_package_a: {
            path: '../packages/pack-a',
          },
          fpm_sample_package_b: {
            path: '../packages/pack-b',
          },
          fpm_sample_package_c: {
            path: '../packages/pack-c',
          },
          fpm_sample_package_d: {
            path: '../packages/pack-d',
          },
          fpm_sample_package_e: {
            path: 'packages/pack-e',
          },
        },
      },
    )
    assertFileNotExists(
      'test-sample/app/packages/pack-e/pubspec_overrides.yaml',
    )
    assertFileNotExists('test-sample/packages/pack-a/pubspec_overrides.yaml')
    assertEquals(
      readYaml('test-sample/packages/pack-b/pubspec_overrides.yaml'),
      {
        dependency_overrides: {
          fpm_sample_package_a: {
            path: '../pack-a',
          },
        },
      },
    )
    assertEquals(
      readYaml('test-sample/packages/pack-c/pubspec_overrides.yaml'),
      {
        dependency_overrides: {
          fpm_sample_package_a: {
            path: '../pack-a',
          },
        },
      },
    )
    assertEquals(
      readYaml('test-sample/packages/pack-d/pubspec_overrides.yaml'),
      {
        dependency_overrides: {
          collection: '^1.18.0',
          fpm_sample_package_a: {
            path: '../pack-a',
          },
          fpm_sample_package_b: {
            path: '../pack-b',
          },
          fpm_sample_package_c: {
            path: '../pack-c',
          },
        },
      },
    )

    assertEquals(
      readYaml('test-sample/.d/bootstrap.yaml'),
      {
        workspaceFilepath: std.path.resolve('test-sample', 'd.yaml'),
        packages: {
          fpm_sample_app: {
            pubspecRelativePath: 'app/pubspec.yaml',
            dependency: [
              'fpm_sample_package_a',
              'fpm_sample_package_b',
              'fpm_sample_package_c',
              'fpm_sample_package_d',
              'fpm_sample_package_e',
            ],
          },
          fpm_sample_package_a: {
            pubspecRelativePath: 'packages/pack-a/pubspec.yaml',
            dependency: [],
          },
          fpm_sample_package_b: {
            pubspecRelativePath: 'packages/pack-b/pubspec.yaml',
            dependency: ['fpm_sample_package_a'],
          },
          fpm_sample_package_c: {
            pubspecRelativePath: 'packages/pack-c/pubspec.yaml',
            dependency: ['fpm_sample_package_a'],
          },
          fpm_sample_package_d: {
            pubspecRelativePath: 'packages/pack-d/pubspec.yaml',
            dependency: [
              'fpm_sample_package_b',
              'fpm_sample_package_c',
            ],
          },
          fpm_sample_package_e: {
            pubspecRelativePath: 'app/packages/pack-e/pubspec.yaml',
            dependency: [],
          },
        },
      },
    )
  })

  await t.step('Should fail to bootstrap because of `pack-c`', async () => {
    await removeGarbages()
    const promise = dMain([
      'bootstrap',
      '--include-has-file',
      'pubspec.yaml',
      '--exclude-has-file',
      '**/skip-this',
      '--include-has-dir',
      'ios',
      '--exclude-has-dir',
      '**/non-existent-dir',
      '--verbose',
      '--debug',
    ], {
      cwd: 'test-sample',
      stdout: Deno.stdout,
      stderr: Deno.stderr,
      colorSupported: true,
    })

    try {
      await promise
      throw new Error('Expected to fail')
    } catch (error) {
      assert(error instanceof DError)
      assert(
        error.message.includes('Failed to `bootstrap` with result'),
        error.message,
      )
    }
  })

  await removeGarbages()
})

async function removeGarbages() {
  const promises: Promise<void>[] = []
  for (
    const walkEntry of std.fs.expandGlobSync('**/pubspec_overrides.yaml', {
      root: 'test-sample',
      extended: true,
      followSymlinks: true,
    })
  ) {
    promises.push(Deno.remove(walkEntry.path, { recursive: true }))
  }
  for (
    const walkEntry of std.fs.expandGlobSync('**/pubspec.lock', {
      root: 'test-sample',
      extended: true,
      followSymlinks: true,
    })
  ) {
    promises.push(Deno.remove(walkEntry.path, { recursive: true }))
  }
  if (std.fs.existsSync('test-sample/.d')) {
    promises.push(Deno.remove('test-sample/.d', { recursive: true }))
  }
  await Promise.all(promises)
}

function readYaml(filepath: string): Record<string, unknown> {
  return std.yaml.parse(Deno.readTextFileSync(filepath)) as unknown as Record<
    string,
    unknown
  >
}
