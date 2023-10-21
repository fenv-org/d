import {
  assertEquals,
  Buffer,
  extractPackageNamesInOrder,
  fail,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('d test', async (t) => {
  // setup: bootstrap
  await dMain(['bootstrap'], {
    cwd: 'test-sample',
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('Successful execution', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    await dMain(['test', '--no-early-exit', '--reporter', 'expanded'], {
      cwd: 'test-sample',
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

  await t.step('Unsuccessful execution with no early exit', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    try {
      await dMain(
        ['test', '--no-early-exit', '--reporter', 'expanded', 'abc'],
        {
          cwd: 'test-sample',
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
        'fpm_sample_package_b',
        'fpm_sample_package_c',
        'fpm_sample_package_d',
        'fpm_sample_app',
      ],
    )
  })

  await t.step('Unsuccessful execution with early exit', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    try {
      await dMain(
        ['test', '--reporter', 'expanded', 'abc'],
        {
          cwd: 'test-sample',
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
})
