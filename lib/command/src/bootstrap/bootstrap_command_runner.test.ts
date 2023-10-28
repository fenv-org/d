import { std } from 'deps.ts'
import { DError } from 'error/mod.ts'
import {
  assert,
  assertEquals,
  assertFileExists,
  assertFileNotExists,
  copyTestSample,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('Bootstrapping', async (t) => {
  const testSampleDir = await copyTestSample()

  // Run bootstrap
  await t.step('Run bootstrap', async () => {
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
      cwd: testSampleDir,
      stdout: Deno.stdout,
      stderr: Deno.stderr,
      colorSupported: true,
    })

    assertFileExists(testSampleDir, 'app/pubspec.lock')
    assertFileExists(testSampleDir, 'app/packages/pack-e/pubspec.lock')
    assertFileExists(testSampleDir, 'packages/pack-a/pubspec.lock')
    assertFileExists(testSampleDir, 'packages/pack-b/pubspec.lock')
    assertFileExists(testSampleDir, 'packages/pack-c/pubspec.lock')
    assertFileExists(testSampleDir, 'packages/pack-d/pubspec.lock')

    assertEquals(
      readYaml(testSampleDir, 'app/pubspec_overrides.yaml'),
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
      testSampleDir,
      'app/packages/pack-e/pubspec_overrides.yaml',
    )
    assertFileNotExists(testSampleDir, 'packages/pack-a/pubspec_overrides.yaml')
    assertEquals(
      readYaml(testSampleDir, 'packages/pack-b/pubspec_overrides.yaml'),
      {
        dependency_overrides: {
          fpm_sample_package_a: {
            path: '../pack-a',
          },
        },
      },
    )
    assertEquals(
      readYaml(testSampleDir, 'packages/pack-c/pubspec_overrides.yaml'),
      {
        dependency_overrides: {
          fpm_sample_package_a: {
            path: '../pack-a',
          },
        },
      },
    )
    assertEquals(
      readYaml(testSampleDir, 'packages/pack-d/pubspec_overrides.yaml'),
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
      readYaml(testSampleDir, '.d/bootstrap.yaml'),
      {
        workspaceFilepath: std.path.resolve(testSampleDir, 'd.yaml'),
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

  await Deno.remove(testSampleDir, { recursive: true })
})

Deno.test('Bootstrapping should fail because of `pack-c`', async (t) => {
  const testSampleDir = await copyTestSample()

  await t.step('execution', async () => {
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
      cwd: testSampleDir,
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
})

function readYaml(...paths: string[]): Record<string, unknown> {
  const filepath = std.path.join(...paths)
  return std.yaml.parse(Deno.readTextFileSync(filepath)) as unknown as Record<
    string,
    unknown
  >
}
