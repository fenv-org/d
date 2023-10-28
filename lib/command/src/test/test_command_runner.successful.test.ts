import {
  assertEquals,
  Buffer,
  copyTestSample,
  extractPackageNamesInOrder,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('d test: successful execution', async (t) => {
  // setup: bootstrap
  const testSampleDir = await copyTestSample()

  await dMain(['bootstrap'], {
    cwd: testSampleDir,
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('execution', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    await dMain(['test', '--no-early-exit', '--reporter', 'expanded'], {
      cwd: testSampleDir,
      stdout: stdout,
      stderr: stderr,
      colorSupported: false,
    })
    assertEquals(
      extractPackageNamesInOrder(stdout),
      [
        'fpm_sample_package_a',
        'fpm_sample_package_e',
        'fpm_sample_package_b',
        'fpm_sample_package_c',
        'fpm_sample_package_d',
        'fpm_sample_app',
      ],
    )
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
