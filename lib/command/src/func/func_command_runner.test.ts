import {
  assertEquals,
  assertIsError,
  Buffer,
  buildStringFromBuffer,
  extractPackageNamesInOrder,
  fail,
  runDMain,
  runDMain2,
  testBootstrap,
} from 'test/deps.ts'

Deno.test('Test `d func`', async (t) => {
  // setup: bootstrap
  const testSampleDir = await testBootstrap()

  await t.step('calling function that has filters', async () => {
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

  await t.step('calling not existing function', async () => {
    try {
      await runDMain(testSampleDir, 'func', 'not_exists')
      fail('Cannot be reached here')
    } catch (e) {
      assertIsError(e, undefined, undefined, 'Not function found: not_exists')
    }
  })

  await t.step('calling lazily-exiting function', async () => {
    const stdout = new Buffer()
    try {
      await runDMain2(testSampleDir, {
        args: ['func', 'echo2:hello:world'],
        stdout,
      })
      fail('Cannot be reached here')
    } catch (e) {
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
      assertIsError(
        e,
        undefined,
        undefined,
        'Failed to run `echo2:hello:world` command with result: 1',
      )
    }
  })

  await t.step('calling early-exiting function', async () => {
    const stdout = new Buffer()
    try {
      await runDMain2(testSampleDir, {
        args: ['func', 'echo3:hello:world'],
        stdout,
      })
      fail('Cannot be reached here')
    } catch (e) {
      assertEquals(
        extractPackageNamesInOrder(stdout),
        [
          'fpm_sample_package_a',
          'fpm_sample_package_e',
        ],
      )
      assertIsError(
        e,
        undefined,
        undefined,
        'Failed to run `echo3:hello:world` command with result: 1',
      )
    }
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
