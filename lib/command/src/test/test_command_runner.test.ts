import { assertEquals, Buffer, extractPackageNamesInOrder } from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('successful `d test` execution', async (t) => {
  // setup: bootstrap
  await dMain(['bootstrap'], {
    cwd: 'test-sample',
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('Run `d test`', async () => {
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
})
