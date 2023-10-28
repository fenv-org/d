import {
  assertEquals,
  Buffer,
  copyTestSample,
  extractPackageNamesInOrder,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('Run `d br clean`', async (t) => {
  // setup: bootstrap
  const testSampleDir = await copyTestSample()

  await dMain(['bootstrap'], {
    cwd: testSampleDir,
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('Run `d br clean`', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    await dMain(['br', 'c'], {
      cwd: testSampleDir,
      stdout: stdout,
      stderr: stderr,
      colorSupported: false,
    })
    assertEquals(
      extractPackageNamesInOrder(stdout),
      ['fpm_sample_package_c', 'fpm_sample_app'],
    )
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
