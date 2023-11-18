import {
  assertEquals,
  buildStringFromBuffer,
  runDMain,
  testBootstrap,
} from 'test/deps.ts'

Deno.test('Run `d func echo:hello:world', async (t) => {
  // setup: bootstrap
  const testSampleDir = await testBootstrap()

  await t.step('execution', async () => {
    const { stdout } = await runDMain(
      testSampleDir,
      'func',
      'echo:hello:world',
      '--',
      'good',
      'night',
    )

    assertEquals(
      buildStringFromBuffer(stdout),
      Deno.readTextFileSync('test-resources/func_echo_hello_world_output.txt'),
    )
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
