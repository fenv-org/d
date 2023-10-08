import { assertEquals, Buffer, bufferToString, fail } from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('pub subcommand should fails if not bootstrapped', async (t) => {
  // set-up: clean-up
  await dMain(['clean'], {
    cwd: 'test-sample',
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('should fail', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    try {
      await dMain(['pub', 'get'], {
        cwd: 'test-sample',
        stdout,
        stderr,
        colorSupported: false,
      })
      fail('should throw a DError')
    } catch (e) {
      assertEquals(e.message, 'Need to bootstrap the workspace')
    }
  })
})

Deno.test('pub get should succeed if bootstrapped', async (t) => {
  // set-up: bootstrap
  const stdout = new Buffer()
  const stderr = new Buffer()
  await dMain(['bootstrap'], {
    cwd: 'test-sample',
    stdout,
    stderr,
    colorSupported: false,
  })

  stdout.reset()
  stderr.reset()
  await t.step('pub get', async () => {
    await dMain(['pub', 'get'], {
      cwd: 'test-sample',
      stdout,
      stderr,
      colorSupported: false,
    })

    const actualOutput = bufferToString(stdout)
    const packageNamesInOrdered = new Set(
      actualOutput
        .split('\n')
        .flatMap((line) => {
          const matchArray = line.match(/^\[([^]+)\]/)
          if (matchArray) {
            return matchArray[1]
          } else {
            return []
          }
        }),
    )

    assertEquals(
      [...packageNamesInOrdered],
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

  stdout.reset()
  stderr.reset()
  await t.step('pub --include-has-dir get', async () => {
    await dMain(['pub', '--id', 'ios', 'get'], {
      cwd: 'test-sample',
      stdout,
      stderr,
      colorSupported: false,
    })

    const actualOutput = bufferToString(stdout)
    const packageNamesInOrdered = new Set(
      actualOutput
        .split('\n')
        .flatMap((line) => {
          const matchArray = line.match(/^\[([^]+)\]/)
          if (matchArray) {
            return matchArray[1]
          } else {
            return []
          }
        }),
    )

    assertEquals(
      [...packageNamesInOrdered],
      [
        'fpm_sample_package_b',
        'fpm_sample_package_c',
        'fpm_sample_package_e',
        'fpm_sample_package_d',
        'fpm_sample_app',
      ],
    )
  })

  // set-up: clean-up
  await dMain(['clean'], {
    cwd: 'test-sample',
    stdout: stdout,
    stderr: stderr,
    colorSupported: false,
  })
})
