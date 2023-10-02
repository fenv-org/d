import {
  assertDirectoryExists,
  assertDirectoryNotExists,
  assertFileNotExists,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('Run `d clean`', async (t) => {
  // Set-up: Run `d bootstrap` first.
  await dMain(['bootstrap', '--config', 'test-sample/d.yaml'], {
    cwd: Deno.cwd(),
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('Run `d clean`', async () => {
    await dMain(['clean', '--config', 'test-sample/d.yaml'], {
      cwd: Deno.cwd(),
      stdout: Deno.stdout,
      stderr: Deno.stderr,
      colorSupported: true,
    })

    assertDirectoryNotExists('test-sample/.d')

    // Assert that `d clean` does not remove `.dart_tool` directories.
    assertDirectoryExists('test-sample/app/.dart_tool')
    assertDirectoryExists('test-sample/app/packages/pack-e/.dart_tool')
    assertDirectoryExists('test-sample/packages/pack-a/.dart_tool')
    assertDirectoryExists('test-sample/packages/pack-b/.dart_tool')
    assertDirectoryExists('test-sample/packages/pack-c/.dart_tool')
    assertDirectoryExists('test-sample/packages/pack-d/.dart_tool')

    // Assert that `d clean` removes `pubspec_overrides.yaml` files.
    assertFileNotExists('test-sample/app/pubspec_overrides.yaml')
    assertFileNotExists(
      'test-sample/app/packages/pack-e/pubspec_overrides.yaml',
    )
    assertFileNotExists('test-sample/packages/pack-a/pubspec_overrides.yaml')
    assertFileNotExists('test-sample/packages/pack-b/pubspec_overrides.yaml')
    assertFileNotExists('test-sample/packages/pack-c/pubspec_overrides.yaml')
    assertFileNotExists('test-sample/packages/pack-d/pubspec_overrides.yaml')
  })
})

Deno.test('Run `d clean --flutter`', async (t) => {
  // Set-up: Run `d bootstrap` first.
  await dMain(['bootstrap', '--config', 'test-sample/d.yaml'], {
    cwd: Deno.cwd(),
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('Run `d clean --flutter`', async () => {
    await dMain(['clean', '--config', 'test-sample/d.yaml', '-f'], {
      cwd: Deno.cwd(),
      stdout: Deno.stdout,
      stderr: Deno.stderr,
      colorSupported: true,
    })

    assertDirectoryNotExists('test-sample/.d')

    // Assert that `d clean --flutter` removes `.dart_tool` directories.
    assertDirectoryNotExists('test-sample/app/.dart_tool')
    assertDirectoryNotExists('test-sample/app/packages/pack-e/.dart_tool')
    assertDirectoryNotExists('test-sample/packages/pack-a/.dart_tool')
    assertDirectoryNotExists('test-sample/packages/pack-b/.dart_tool')
    assertDirectoryNotExists('test-sample/packages/pack-c/.dart_tool')
    assertDirectoryNotExists('test-sample/packages/pack-d/.dart_tool')

    // Assert that `d clean` removes `pubspec_overrides.yaml` files.
    assertFileNotExists('test-sample/app/pubspec_overrides.yaml')
    assertFileNotExists(
      'test-sample/app/packages/pack-e/pubspec_overrides.yaml',
    )
    assertFileNotExists('test-sample/packages/pack-a/pubspec_overrides.yaml')
    assertFileNotExists('test-sample/packages/pack-b/pubspec_overrides.yaml')
    assertFileNotExists('test-sample/packages/pack-c/pubspec_overrides.yaml')
    assertFileNotExists('test-sample/packages/pack-d/pubspec_overrides.yaml')
  })
})
