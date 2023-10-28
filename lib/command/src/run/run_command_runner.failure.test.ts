import { assertEquals, copyTestSample, fail } from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('Run `d run`: unsuccessful', async (t) => {
  // setup: bootstrap
  const testSampleDir = await copyTestSample()

  await dMain(['bootstrap'], {
    cwd: testSampleDir,
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('no command specified', async () => {
    try {
      await dMain([
        'run',
        '--',
      ], {
        cwd: testSampleDir,
        stdout: Deno.stdout,
        stderr: Deno.stderr,
        colorSupported: true,
      })
      fail('Expected to throw an error')
    } catch (error) {
      assertEquals(
        error.message,
        'No command specified: `d run` requires a command to run.',
      )
    }
  })

  await t.step('too many commands specified', async () => {
    try {
      await dMain([
        'run',
        '--',
        'hello',
        'world',
      ], {
        cwd: testSampleDir,
        stdout: Deno.stdout,
        stderr: Deno.stderr,
        colorSupported: true,
      })
      fail('Expected to throw an error')
    } catch (error) {
      assertEquals(
        error.message,
        'Two many commands specified: `d run` only supports one command at a time.',
      )
    }
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
