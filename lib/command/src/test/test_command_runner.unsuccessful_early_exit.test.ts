import {
  assertEquals,
  Buffer,
  copyTestSample,
  extractPackageNamesInOrder,
  fail,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('d test: unsuccessful execution with early exit', async (t) => {
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
    try {
      await dMain(
        ['test', '--reporter', 'expanded', 'abc'],
        {
          cwd: testSampleDir,
          stdout: stdout,
          stderr: stderr,
          colorSupported: false,
        },
      )
      fail('Should not reach here.')
    } catch (error) {
      assertEquals(
        error.message,
        'Failed to run `test` command with result: 1',
      )
    }
    assertEquals(
      extractPackageNamesInOrder(stdout),
      [
        'fpm_sample_package_a',
        'fpm_sample_package_e',
      ],
    )
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
