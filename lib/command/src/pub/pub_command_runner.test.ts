import { assertEquals, Buffer, bufferToString, fail, std } from 'test/deps.ts'
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
    const expectedOutput = Deno.readTextFileSync(
      std.path.join(
        'test-resources',
        'output_pub_get.txt',
      ),
    )
      .replace('$CWD', Deno.cwd())

    await dMain(['pub', 'get'], {
      cwd: 'test-sample',
      stdout,
      stderr,
      colorSupported: false,
    })

    const actualOutput = bufferToString(stdout)
    assertEquals(
      actualOutput,
      expectedOutput,
    )
  })

  stdout.reset()
  stderr.reset()
  await t.step('pub --include-has-dir get', async () => {
    const expectedOutput = Deno.readTextFileSync(
      std.path.join(
        'test-resources',
        'output_pub_get_with_id_ios.txt',
      ),
    )
      .replace('$CWD', Deno.cwd())

    await dMain(['pub', '--id', 'ios', 'get'], {
      cwd: 'test-sample',
      stdout,
      stderr,
      colorSupported: false,
    })

    const actualOutput = bufferToString(stdout)
    assertEquals(
      actualOutput,
      expectedOutput,
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
