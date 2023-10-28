import {
  assertDirectoryExists,
  assertDirectoryNotExists,
  assertFileNotExists,
  copyTestSample,
  std,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('Run `d clean`', async (t) => {
  // Set-up: Run `d bootstrap` first.
  const testSampleDir = await copyTestSample()

  await dMain([
    'bootstrap',
    '--config',
    std.path.resolve(testSampleDir, 'd.yaml'),
  ], {
    cwd: Deno.cwd(),
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('execution', async () => {
    await dMain([
      'clean',
      '--config',
      std.path.resolve(testSampleDir, 'd.yaml'),
    ], {
      cwd: Deno.cwd(),
      stdout: Deno.stdout,
      stderr: Deno.stderr,
      colorSupported: true,
    })

    assertDirectoryNotExists(testSampleDir, '.d')

    // Assert that `d clean` does not remove `.dart_tool` directories.
    assertDirectoryExists(testSampleDir, 'app/.dart_tool')
    assertDirectoryExists(testSampleDir, 'app/packages/pack-e/.dart_tool')
    assertDirectoryExists(testSampleDir, 'packages/pack-a/.dart_tool')
    assertDirectoryExists(testSampleDir, 'packages/pack-b/.dart_tool')
    assertDirectoryExists(testSampleDir, 'packages/pack-c/.dart_tool')
    assertDirectoryExists(testSampleDir, 'packages/pack-d/.dart_tool')

    // Assert that `d clean` removes `pubspec_overrides.yaml` files.
    assertFileNotExists(testSampleDir, 'app/pubspec_overrides.yaml')
    assertFileNotExists(
      testSampleDir,
      'app/packages/pack-e/pubspec_overrides.yaml',
    )
    assertFileNotExists(testSampleDir, 'packages/pack-a/pubspec_overrides.yaml')
    assertFileNotExists(testSampleDir, 'packages/pack-b/pubspec_overrides.yaml')
    assertFileNotExists(testSampleDir, 'packages/pack-c/pubspec_overrides.yaml')
    assertFileNotExists(testSampleDir, 'packages/pack-d/pubspec_overrides.yaml')
  })

  await Deno.remove(testSampleDir, { recursive: true })
})

Deno.test('Run `d clean --flutter`', async (t) => {
  // Set-up: Run `d bootstrap` first.
  const testSampleDir = await copyTestSample()

  await dMain([
    'bootstrap',
    '--config',
    std.path.resolve(testSampleDir, 'd.yaml'),
  ], {
    cwd: Deno.cwd(),
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('execution', async () => {
    await dMain([
      'clean',
      '--config',
      std.path.resolve(testSampleDir, 'd.yaml'),
      '-f',
    ], {
      cwd: Deno.cwd(),
      stdout: Deno.stdout,
      stderr: Deno.stderr,
      colorSupported: true,
    })

    assertDirectoryNotExists(testSampleDir, '.d')

    // Assert that `d clean --flutter` removes `.dart_tool` directories.
    assertDirectoryNotExists(testSampleDir, 'app/.dart_tool')
    assertDirectoryNotExists(testSampleDir, 'app/packages/pack-e/.dart_tool')
    assertDirectoryNotExists(testSampleDir, 'packages/pack-a/.dart_tool')
    assertDirectoryNotExists(testSampleDir, 'packages/pack-b/.dart_tool')
    assertDirectoryNotExists(testSampleDir, 'packages/pack-c/.dart_tool')
    assertDirectoryNotExists(testSampleDir, 'packages/pack-d/.dart_tool')

    // Assert that `d clean` removes `pubspec_overrides.yaml` files.
    assertFileNotExists(testSampleDir, 'app/pubspec_overrides.yaml')
    assertFileNotExists(
      testSampleDir,
      'app/packages/pack-e/pubspec_overrides.yaml',
    )
    assertFileNotExists(testSampleDir, 'packages/pack-a/pubspec_overrides.yaml')
    assertFileNotExists(testSampleDir, 'packages/pack-b/pubspec_overrides.yaml')
    assertFileNotExists(testSampleDir, 'packages/pack-c/pubspec_overrides.yaml')
    assertFileNotExists(testSampleDir, 'packages/pack-d/pubspec_overrides.yaml')
  })

  await Deno.remove(testSampleDir, { recursive: true })
})
