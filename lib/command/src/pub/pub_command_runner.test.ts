import {
  assertEquals,
  Buffer,
  copyTestSample,
  extractPackageNamesInOrder,
  fail,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('`d pub get` should fails if not bootstrapped', async (t) => {
  // set-up: clean-up
  const testSampleDir = await copyTestSample()

  await dMain(['clean'], {
    cwd: testSampleDir,
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('should fail', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    try {
      await dMain(['pub', 'get'], {
        cwd: testSampleDir,
        stdout,
        stderr,
        colorSupported: false,
      })
      fail('should throw a DError')
    } catch (e) {
      assertEquals(e.message, 'Need to bootstrap the workspace')
    }
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})

Deno.test('`d pub get` should succeed if bootstrapped', async (t) => {
  // set-up: bootstrap
  const testSampleDir = await copyTestSample()
  await dMain(['bootstrap'], {
    cwd: testSampleDir,
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: false,
  })

  await t.step('execution', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    await dMain(['pub', 'get'], {
      cwd: testSampleDir,
      stdout,
      stderr,
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

Deno.test('`d pub --include-has-dir get` should succeed if bootstrapped', async (t) => {
  // set-up: bootstrap
  const testSampleDir = await copyTestSample()
  await dMain(['bootstrap'], {
    cwd: testSampleDir,
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: false,
  })

  await t.step('pub --include-has-dir get', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    await dMain(['pub', '--id', 'ios', 'get'], {
      cwd: testSampleDir,
      stdout,
      stderr,
      colorSupported: false,
    })

    assertEquals(
      extractPackageNamesInOrder(stdout),
      [
        'fpm_sample_package_b',
        'fpm_sample_package_c',
        'fpm_sample_package_e',
        'fpm_sample_package_d',
        'fpm_sample_app',
      ],
    )
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
