import {
  assertEquals,
  assertFileExists,
  assertFileNotExists,
  Buffer,
  copyTestSample,
  extractPackageNamesInOrder,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('Run `d br build`', async (t) => {
  // setup: bootstrap
  const testSampleDir = await copyTestSample()

  await dMain(['bootstrap'], {
    cwd: testSampleDir,
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('pre-condition', () => {
    assertFileNotExists(testSampleDir, 'app/lib/sample.freezed.dart')
    assertFileNotExists(testSampleDir, 'packages/pack-c/lib/sample.g.dart')
  })

  await t.step('execution', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    await dMain(['br', 'b', '-d'], {
      cwd: testSampleDir,
      stdout: stdout,
      stderr: stderr,
      colorSupported: false,
    })

    assertFileExists(testSampleDir, 'app/lib/sample.freezed.dart')
    assertFileExists(testSampleDir, 'packages/pack-c/lib/sample.g.dart')
    assertEquals(
      extractPackageNamesInOrder(stdout),
      ['fpm_sample_package_c', 'fpm_sample_app'],
    )
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
