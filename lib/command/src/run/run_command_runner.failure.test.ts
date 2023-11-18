import { assertEquals, fail, runDMain, testBootstrap } from 'test/deps.ts'

Deno.test('Run `d run`: unsuccessful', async (t) => {
  // setup: bootstrap
  const testSampleDir = await testBootstrap()

  await t.step('no command specified', async () => {
    try {
      await runDMain(testSampleDir, 'run', '--')
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
      await runDMain(testSampleDir, 'run', '--', 'hello', 'world')
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
